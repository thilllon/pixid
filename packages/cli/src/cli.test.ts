import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toPng } from '@pixid/png';
import { toSvg } from '@pixid/svg';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import pkg from '../package.json' with { type: 'json' };

const CLI = fileURLToPath(new URL('../dist/cli.js', import.meta.url));

let cwd: string;

const run = (args: string[]) =>
  execFileSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8' });

const runFail = (args: string[]) => {
  try {
    execFileSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8', stdio: 'pipe' });
    throw new Error('expected the CLI to exit with a non-zero code');
  } catch (error) {
    const e = error as { status?: number; stderr?: string };
    expect(e.status).toBe(1);
    return e.stderr ?? '';
  }
};

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), 'pixid-cli-'));
});

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

describe('@pixid/cli', () => {
  it('writes a PNG named after the seed by default', () => {
    const stdout = run(['--seed', 'alice']);
    expect(stdout).toContain('alice.png');
    const bytes = readFileSync(join(cwd, 'alice.png'));
    expect(new Uint8Array(bytes)).toEqual(toPng({ seed: 'alice', scale: 16 }));
  });

  it('accepts the seed as a positional argument', () => {
    run(['bob']);
    expect(existsSync(join(cwd, 'bob.png'))).toBe(true);
  });

  it('generates a random seed when none is given', () => {
    run([]);
    const files = readdirSync(cwd);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/\.png$/);
  });

  it('writes SVG when requested via --format', () => {
    run(['--seed', 'carol', '--format', 'svg']);
    const svg = readFileSync(join(cwd, 'carol.svg'), 'utf8');
    expect(svg).toBe(toSvg({ seed: 'carol', scale: 16 }));
  });

  it('infers the format from the output extension', () => {
    run(['--seed', 'dave', '--out', 'icon.svg']);
    expect(readFileSync(join(cwd, 'icon.svg'), 'utf8')).toBe(toSvg({ seed: 'dave', scale: 16 }));
  });

  it('applies size, scale, and color options', () => {
    run(['--seed', 'erin', '--size', '5', '--scale', '10', '--bgcolor', '#ffffff', '-o', 'e.png']);
    const bytes = readFileSync(join(cwd, 'e.png'));
    expect(new Uint8Array(bytes)).toEqual(
      toPng({ seed: 'erin', size: 5, scale: 10, bgcolor: '#ffffff' }),
    );
  });

  it('sanitizes unsafe characters in the default filename', () => {
    run(['--seed', 'a/b:c']);
    expect(existsSync(join(cwd, 'a_b_c.png'))).toBe(true);
  });

  it('treats an empty seed like no seed', () => {
    // Otherwise both runs would write the icon for '' to a hidden `.png`.
    run(['--seed', '']);
    run(['']);
    const files = readdirSync(cwd);
    expect(files).toHaveLength(2);
    for (const file of files) {
      expect(file).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/);
      expect(new Uint8Array(readFileSync(join(cwd, file)))).toEqual(
        toPng({ seed: file.slice(0, -'.png'.length), scale: 16 }),
      );
    }
  });

  it('shortens a long seed in the default filename, but not an explicit --out', () => {
    const seed = 'a/'.repeat(150); // 300 characters
    run([seed]);
    const name = `${'a_'.repeat(50)}.png`;
    expect(readdirSync(cwd)).toEqual([name]);
    // Only the filename is shortened; the icon still uses the whole seed.
    expect(new Uint8Array(readFileSync(join(cwd, name)))).toEqual(toPng({ seed, scale: 16 }));

    const out = `${'b'.repeat(150)}.png`;
    run([seed, '--out', out]);
    expect(existsSync(join(cwd, out))).toBe(true);
  });

  it('creates missing parent directories for --out', () => {
    run(['--seed', 'alice', '--out', 'avatars/2026/alice.svg']);
    expect(readFileSync(join(cwd, 'avatars/2026/alice.svg'), 'utf8')).toBe(
      toSvg({ seed: 'alice', scale: 16 }),
    );
  });

  it('reports a failed write like invalid input, without a stack trace', () => {
    mkdirSync(join(cwd, 'taken'));
    const stderr = runFail(['--seed', 'alice', '--out', 'taken']);
    expect(stderr).toMatch(/^pixid: EISDIR: /);
    expect(stderr).not.toMatch(/^\s+at /m);
    expect(statSync(join(cwd, 'taken')).isDirectory()).toBe(true);
  });

  it('prints help and version', () => {
    expect(run(['--help'])).toContain('Usage:');
    expect(run(['--version']).trim()).toBe(pkg.version);
  });

  it('shows npx examples under the scoped package name', () => {
    // There is no unscoped `pixid` package on npm, so `npx pixid` would not
    // fetch this CLI.
    const help = run(['--help']);
    expect(help).toContain('npx @pixid/cli');
    expect(help).not.toContain('npx pixid');
  });

  it('exposes the bin through the ./run export subpath, from both module systems', () => {
    // CommonJS gets the CJS build: requiring the ESM one would throw
    // ERR_REQUIRE_ESM. ESM gets the same file the `bin` entry points at.
    expect(createRequire(import.meta.url).resolve('@pixid/cli/run')).toBe(
      fileURLToPath(new URL('../dist/cli.cjs', import.meta.url)),
    );
    const resolvedFromEsm = execFileSync(
      process.execPath,
      ['--input-type=module', '-e', "process.stdout.write(import.meta.resolve('@pixid/cli/run'))"],
      { cwd: fileURLToPath(new URL('..', import.meta.url)), encoding: 'utf8' },
    );
    expect(fileURLToPath(resolvedFromEsm)).toBe(CLI);

    // Both conditions carry declarations, which is what attw checks.
    for (const types of ['../dist/cli.d.ts', '../dist/cli.d.cts']) {
      expect(existsSync(fileURLToPath(new URL(types, import.meta.url))), types).toBe(true);
    }
  });

  it('documents every flag it accepts in --help', () => {
    const help = run(['--help']);
    for (const flag of [
      '-s, --seed',
      '-o, --out',
      '-f, --format',
      '--size',
      '--scale',
      '--color',
      '--bgcolor',
      '--spotcolor',
      '-h, --help',
      '-v, --version',
    ]) {
      expect(help).toContain(flag);
    }
  });

  it('rejects unknown formats', () => {
    expect(runFail(['--seed', 'x', '--format', 'webp'])).toContain('--format must be');
  });

  it('rejects seed given both positionally and via flag', () => {
    expect(runFail(['posix', '--seed', 'flag'])).toContain('not both');
  });

  it('rejects invalid numeric options', () => {
    expect(runFail(['--seed', 'x', '--scale', '0'])).toContain('positive integer');
    expect(runFail(['--seed', 'x', '--size', 'abc'])).toContain('positive integer');
  });

  it('rejects an image wider than 4096 pixels instead of grinding on it', () => {
    // Without the cap this allocated for minutes: 8 * 100000 is 800000 pixels
    // per side, 640 billion pixels.
    expect(runFail(['--seed', 'x', '--scale', '100000'])).toContain(
      '--size times --scale must be at most 4096 pixels per side, got 800000 (size 8 x scale 100000)',
    );
    // One pixel over the line, counted from --size as well as --scale.
    expect(runFail(['--seed', 'x', '--size', '8', '--scale', '513'])).toContain('got 4104');
    expect(runFail(['--seed', 'x', '--size', '4097', '--scale', '1'])).toContain('got 4097');
    expect(readdirSync(cwd)).toHaveLength(0);
  });

  it('accepts an image exactly at the cap', () => {
    // SVG, so the assertion costs nothing: the same size as a PNG would be a
    // 4096x4096 pixel buffer.
    run(['--seed', 'x', '--size', '8', '--scale', '512', '--out', 'edge.svg']);
    expect(readFileSync(join(cwd, 'edge.svg'), 'utf8')).toContain('width="4096"');
  });

  it('rejects unknown flags', () => {
    expect(runFail(['--nope'])).toContain('--nope');
  });

  it('rejects invalid colors with a clean error', () => {
    expect(runFail(['--seed', 'x', '--color', 'red'])).toContain('invalid color');
  });
});

describe('@pixid/cli programmatic entry', () => {
  it('exports runCli and the package version', async () => {
    const mod = (await import(
      fileURLToPath(new URL('../dist/index.js', import.meta.url))
    )) as typeof import('./index.js');

    expect(typeof mod.runCli).toBe('function');
    expect(mod.version).toBe(pkg.version);
  });

  it('writes a file when called with an explicit argv', () => {
    const script = [
      `import { runCli } from ${JSON.stringify(fileURLToPath(new URL('../dist/index.js', import.meta.url)))};`,
      "runCli(['--seed', 'frank', '-o', 'frank.png']);",
    ].join('\n');

    execFileSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd,
      encoding: 'utf8',
    });
    expect(new Uint8Array(readFileSync(join(cwd, 'frank.png')))).toEqual(
      toPng({ seed: 'frank', scale: 16 }),
    );
  });
});
