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
import { toPng } from '@pixid/png';
import { toSvg } from '@pixid/svg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pkg from '../package.json' with { type: 'json' };

// End-to-end check of how users actually get the CLI: publish the workspace
// to a throwaway verdaccio registry, then run `npx @pixid/cli` from a cold
// cache. It publishes every package because the CLI depends on core, svg, and
// png, so it doubles as the check that the whole release installs.

const WORKSPACE_ROOT = fileURLToPath(new URL('../../..', import.meta.url));
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

  // Resolve the verdaccio binary from this package's own node_modules.
  const require = createRequire(import.meta.url);
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

  // Publish every publishable workspace package to the local registry, exactly
  // like a real release (workspace: ranges are rewritten by pnpm on publish).
  // The workspace root is `private`, so pnpm skips it.
  execFileSync('pnpm', ['--recursive', 'publish', '--registry', REGISTRY, '--no-git-checks'], {
    cwd: WORKSPACE_ROOT,
    env: npmEnv(join(workDir, 'publish-cache')),
    encoding: 'utf8',
  });
});

afterAll(() => {
  verdaccio?.kill();
  rmSync(workDir, { recursive: true, force: true });
});

/** Runs `npx -y <spec> <args>` in a fresh directory with its own empty cache. */
const npx = (label: string, spec: string, args: string[]) => {
  const cwd = join(workDir, `run-${label}`);
  mkdirSync(cwd);
  const cacheDir = join(workDir, `cache-${label}`);

  const stdout = execFileSync('npx', ['-y', spec, ...args], {
    cwd,
    env: npmEnv(cacheDir),
    encoding: 'utf8',
    timeout: 120_000,
  });

  return { cwd, cacheDir, stdout };
};

/** Package names installed into the npx sandbox for a given cache directory. */
const installedPackages = (cacheDir: string): string[] => {
  const installs = readdirSync(join(cacheDir, '_npx'));
  expect(installs).toHaveLength(1);

  const modules = join(cacheDir, '_npx', installs[0]!, 'node_modules');
  return readdirSync(modules)
    .filter((name) => !name.startsWith('.'))
    .flatMap((name) =>
      name === '@pixid'
        ? readdirSync(join(modules, name)).map((scoped) => `@pixid/${scoped}`)
        : [name],
    )
    .sort();
};

describe('npx against a real registry', () => {
  it('runs from a cold cache and writes the expected PNG', () => {
    const { cwd, stdout } = npx('png', '@pixid/cli', ['--seed', 'hello', '-o', 'out.png']);
    expect(stdout).toContain('out.png');
    expect(new Uint8Array(readFileSync(join(cwd, 'out.png')))).toEqual(
      toPng({ seed: 'hello', scale: 16 }),
    );
  });

  it('reports the version of the published CLI package', () => {
    expect(npx('version', '@pixid/cli', ['--version']).stdout).toBe(`${pkg.version}\n`);
  });

  it('installs only the CLI and its runtime packages, nothing else', () => {
    // The cold-cache run above populated npx's cache. Renderer packages the
    // CLI does not need (canvas, react, vue) must not have been downloaded.
    expect(installedPackages(join(workDir, 'cache-png'))).toEqual([
      '@pixid/cli',
      '@pixid/core',
      '@pixid/png',
      '@pixid/svg',
    ]);
  });

  it('publishes exactly the public packages and keeps the npx download under 30 KB', () => {
    // Every published package gets a storage directory named after it, and
    // nothing outside the `@pixid` scope may appear.
    const published = readdirSync(storageDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((entry) =>
        entry.name === '@pixid'
          ? readdirSync(join(storageDir, entry.name)).map((scoped) => `@pixid/${scoped}`)
          : [entry.name],
      )
      .sort();
    expect(published).toEqual([
      '@pixid/canvas',
      '@pixid/cli',
      '@pixid/core',
      '@pixid/png',
      '@pixid/react',
      '@pixid/svg',
      '@pixid/vue',
    ]);

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

    expect(tarballs).toHaveLength(published.length);
    for (const t of tarballs) {
      console.log(`${t.name}: ${t.size} bytes`);
      expect(t.size).toBeLessThan(20 * 1024);
    }

    const download = (names: string[]) =>
      tarballs
        .filter((t) => names.some((n) => t.name.startsWith(`${n}-`)))
        .reduce((sum, t) => sum + t.size, 0);

    const total = download(['cli', 'core', 'svg', 'png']);
    console.log(`npx @pixid/cli total download: ${total} bytes`);
    expect(total).toBeLessThan(30 * 1024);
  });

  it('renders SVG through npx with an inferred format', () => {
    const { cwd } = npx('svg', '@pixid/cli', ['world', '--out', 'icon.svg', '--scale', '32']);
    expect(readFileSync(join(cwd, 'icon.svg'), 'utf8')).toBe(toSvg({ seed: 'world', scale: 32 }));
  });

  it('installs the library packages and imports them', () => {
    const cwd = join(workDir, 'run-lib');
    mkdirSync(cwd);
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ name: 'consumer', type: 'module' }));
    writeFileSync(
      join(cwd, 'main.mjs'),
      [
        "import { createIcon } from '@pixid/core';",
        "import { toSvg } from '@pixid/svg';",
        "import { toPngDataURL } from '@pixid/png';",
        "const icon = createIcon({ seed: 'consumer' });",
        "if (icon.grid.length !== 64) throw new Error('bad grid');",
        "if (!toSvg({ seed: 'consumer' }).startsWith('<svg')) throw new Error('bad svg');",
        "if (!toPngDataURL({ seed: 'consumer' }).startsWith('data:image/png;base64,')) throw new Error('bad png');",
        "console.log('ok');",
      ].join('\n'),
    );

    const env = npmEnv(join(workDir, 'cache-lib'));
    execFileSync('npm', ['install', '@pixid/core', '@pixid/svg', '@pixid/png'], {
      cwd,
      env,
      encoding: 'utf8',
      timeout: 120_000,
    });
    const out = execFileSync(process.execPath, ['main.mjs'], { cwd, encoding: 'utf8' });
    expect(out.trim()).toBe('ok');
  });
});
