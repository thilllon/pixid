import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { createRequire } from 'node:module';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toPng, toSvg } from 'pixid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = 4873 + Math.floor(Math.random() * 1000);
const REGISTRY = `http://127.0.0.1:${PORT}/`;

let workDir: string;
let npmrcPath: string;
let storageDir: string;
let verdaccio: ChildProcess;

const npmEnv = (cacheDir: string) => ({
  ...process.env,
  NPM_CONFIG_USERCONFIG: npmrcPath,
  npm_config_cache: cacheDir,
  npm_config_audit: 'false',
  npm_config_fund: 'false',
  npm_config_update_notifier: 'false',
});

beforeAll(async () => {
  workDir = mkdtempSync(join(tmpdir(), 'pixid-e2e-'));
  storageDir = join(workDir, 'storage');
  npmrcPath = join(workDir, '.npmrc');

  const configPath = join(workDir, 'verdaccio.yaml');
  writeFileSync(
    configPath,
    [
      `storage: ${storageDir}`,
      'auth:',
      '  htpasswd:',
      `    file: ${join(workDir, 'htpasswd')}`,
      'packages:',
      "  '**':",
      '    access: $all',
      '    publish: $authenticated',
      'log: { type: stdout, format: pretty, level: http }',
    ].join('\n'),
  );

  // Resolve the verdaccio binary from the workspace root's node_modules.
  const require = createRequire(join(ROOT, 'package.json'));
  const verdaccioPkg = require('verdaccio/package.json') as {
    bin: string | Record<string, string>;
  };
  const binRelative =
    typeof verdaccioPkg.bin === 'string' ? verdaccioPkg.bin : verdaccioPkg.bin.verdaccio!;
  const verdaccioBin = join(dirname(require.resolve('verdaccio/package.json')), binRelative);

  verdaccio = spawn(process.execPath, [verdaccioBin, '-c', configPath, '-l', `127.0.0.1:${PORT}`], {
    stdio: ['ignore', 'ignore', 'pipe'],
  });

  // Wait for the registry to come up.
  for (let i = 0; ; i++) {
    try {
      const res = await fetch(`${REGISTRY}-/ping`);
      if (res.ok) break;
    } catch {
      if (i > 100) throw new Error('verdaccio did not start in time');
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  // Create a user through the couchdb-style endpoint to obtain a token.
  const res = await fetch(`${REGISTRY}-/user/org.couchdb.user:e2e`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      _id: 'org.couchdb.user:e2e',
      name: 'e2e',
      password: 'e2e-password',
      type: 'user',
      roles: [],
    }),
  });
  expect(res.status).toBe(201);
  const { token } = (await res.json()) as { token: string };

  writeFileSync(
    npmrcPath,
    [`registry=${REGISTRY}`, `//127.0.0.1:${PORT}/:_authToken=${token}`, ''].join('\n'),
  );

  // Publish every workspace package to the local registry, exactly like a
  // real release (workspace: ranges are rewritten by pnpm on publish).
  execFileSync('pnpm', ['-r', 'publish', '--registry', REGISTRY, '--no-git-checks'], {
    cwd: ROOT,
    env: npmEnv(join(workDir, 'publish-cache')),
    encoding: 'utf8',
  });
});

afterAll(() => {
  verdaccio?.kill();
  rmSync(workDir, { recursive: true, force: true });
});

describe('npx pixid against a real registry', () => {
  it('runs from a cold cache and writes a deterministic PNG', () => {
    const cwd = join(workDir, 'run-png');
    mkdirSync(cwd);

    const stdout = execFileSync('npx', ['-y', 'pixid', '--seed', 'hello', '-o', 'out.png'], {
      cwd,
      env: npmEnv(join(workDir, 'cache-png')),
      encoding: 'utf8',
      timeout: 120_000,
    });

    expect(stdout).toContain('out.png');
    const bytes = new Uint8Array(readFileSync(join(cwd, 'out.png')));
    expect(bytes).toEqual(toPng({ seed: 'hello', scale: 16 }));
  });

  it('installs only the CLI and its three runtime packages, nothing else', () => {
    // The cold-cache run above populated npx's cache. Renderer packages the
    // CLI does not need (canvas, react) must not have been downloaded.
    const npxDir = join(workDir, 'cache-png', '_npx');
    const installs = readdirSync(npxDir);
    expect(installs).toHaveLength(1);

    const modules = join(npxDir, installs[0]!, 'node_modules');
    const top = readdirSync(modules).filter((n) => !n.startsWith('.'));
    expect(top.sort()).toEqual(['@pixid', 'pixid']);
    expect(readdirSync(join(modules, '@pixid')).sort()).toEqual(['core', 'png', 'svg']);
  });

  it('keeps the total download for npx under 30 KB of tarballs', () => {
    const tarballs: { name: string; size: number }[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith('.tgz'))
          tarballs.push({ name: entry.name, size: statSync(full).size });
      }
    };
    walk(storageDir);

    expect(tarballs.length).toBeGreaterThanOrEqual(6);
    for (const t of tarballs) {
      console.log(`${t.name}: ${t.size} bytes`);
      expect(t.size).toBeLessThan(20 * 1024);
    }

    const cliDownload = tarballs
      .filter((t) => /^(pixid|core|svg|png)-/.test(t.name))
      .reduce((sum, t) => sum + t.size, 0);
    console.log(`npx pixid total download: ${cliDownload} bytes`);
    expect(cliDownload).toBeLessThan(30 * 1024);
  });

  it('renders SVG through npx with inferred format', () => {
    const cwd = join(workDir, 'run-svg');
    mkdirSync(cwd);

    execFileSync('npx', ['-y', 'pixid', 'world', '--out', 'icon.svg', '--scale', '32'], {
      cwd,
      env: npmEnv(join(workDir, 'cache-svg')),
      encoding: 'utf8',
      timeout: 120_000,
    });

    expect(readFileSync(join(cwd, 'icon.svg'), 'utf8')).toBe(toSvg({ seed: 'world', scale: 32 }));
  });

  it('installs the meta package and imports it as a library', () => {
    const cwd = join(workDir, 'run-lib');
    mkdirSync(cwd);
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ name: 'consumer', type: 'module' }));
    writeFileSync(
      join(cwd, 'main.mjs'),
      [
        "import { createIcon, toSvg, toPngDataURL } from 'pixid';",
        "const icon = createIcon({ seed: 'consumer' });",
        "if (icon.grid.length !== 64) throw new Error('bad grid');",
        "if (!toSvg({ seed: 'consumer' }).startsWith('<svg')) throw new Error('bad svg');",
        "if (!toPngDataURL({ seed: 'consumer' }).startsWith('data:image/png;base64,')) throw new Error('bad png');",
        "console.log('ok');",
      ].join('\n'),
    );

    const env = npmEnv(join(workDir, 'cache-lib'));
    execFileSync('npm', ['install', 'pixid'], { cwd, env, encoding: 'utf8', timeout: 120_000 });
    const out = execFileSync(process.execPath, ['main.mjs'], { cwd, encoding: 'utf8' });
    expect(out.trim()).toBe('ok');
  });
});
