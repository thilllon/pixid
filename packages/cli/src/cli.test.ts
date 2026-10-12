import { execFile } from 'node:child_process';
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
import { promisify } from 'node:util';
import { createIcon, toPng, toSvg } from '@pixid/core';
import { describe, expect, it as base } from 'vitest';
import pkg from '../package.json' with { type: 'json' };

const CLI = fileURLToPath(new URL('../dist/cli.js', import.meta.url));

const exec = promisify(execFile);

// Each test gets a directory of its own, which is what lets the tests in this
// file run concurrently: every one of them spawns a node process.
const it = base.extend<{ cwd: string }>({
  // oxlint-disable-next-line no-empty-pattern -- vitest requires the fixture context to be destructured
  cwd: async ({}, use) => {
    const cwd = mkdtempSync(join(tmpdir(), 'pixid-cli-'));
    await use(cwd);
    rmSync(cwd, { recursive: true, force: true });
  },
});

const run = async (cwd: string, args: string[]) =>
  (await exec(process.execPath, [CLI, ...args], { cwd })).stdout;

const runFail = async (cwd: string, args: string[]) => {
  const error = await exec(process.execPath, [CLI, ...args], { cwd }).then(
    () => {
      throw new Error('expected the CLI to exit with a non-zero code');
    },
    (error: { code?: number; stderr?: string }) => error,
  );
  expect(error.code).toBe(1);
  return error.stderr ?? '';
};

describe.concurrent('@pixid/cli', () => {
  it('writes a PNG named after the seed by default', async ({ cwd }) => {
    const stdout = await run(cwd, ['--seed', 'alice']);
    expect(stdout).toContain('alice.png');
    const bytes = readFileSync(join(cwd, 'alice.png'));
    expect(new Uint8Array(bytes)).toEqual(toPng(createIcon({ seed: 'alice' }), 16));
  });

  it('accepts the seed as a positional argument', async ({ cwd }) => {
    await run(cwd, ['bob']);
    expect(existsSync(join(cwd, 'bob.png'))).toBe(true);
  });

  it('generates a random seed when none is given', async ({ cwd }) => {
    await run(cwd, []);
    const files = readdirSync(cwd);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/\.png$/);
  });

  it('writes SVG when requested via --format', async ({ cwd }) => {
    await run(cwd, ['--seed', 'carol', '--format', 'svg']);
    const svg = readFileSync(join(cwd, 'carol.svg'), 'utf8');
    expect(svg).toBe(toSvg(createIcon({ seed: 'carol' }), 16));
  });

  it('infers the format from the output extension', async ({ cwd }) => {
    await run(cwd, ['--seed', 'dave', '--out', 'icon.svg']);
    expect(readFileSync(join(cwd, 'icon.svg'), 'utf8')).toBe(
      toSvg(createIcon({ seed: 'dave' }), 16),
    );
  });

  it('applies size, scale, and color options', async ({ cwd }) => {
    await run(cwd, [
      '--seed',
      'erin',
      '--size',
      '5',
      '--scale',
      '10',
      '--bgcolor',
      '#ffffff',
      '-o',
      'e.png',
    ]);
    const bytes = readFileSync(join(cwd, 'e.png'));
    expect(new Uint8Array(bytes)).toEqual(
      toPng(createIcon({ seed: 'erin', size: 5, bgcolor: '#ffffff' }), 10),
    );
  });

  it('sanitizes unsafe characters in the default filename', async ({ cwd }) => {
    await run(cwd, ['--seed', 'a/b:c']);
    expect(existsSync(join(cwd, 'a_b_c.png'))).toBe(true);
  });

  it('treats an empty seed like no seed', async ({ cwd }) => {
    // Otherwise both runs would write the icon for '' to a hidden `.png`.
    await run(cwd, ['--seed', '']);
    await run(cwd, ['']);
    const files = readdirSync(cwd);
    expect(files).toHaveLength(2);
    for (const file of files) {
      expect(file).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/);
      expect(new Uint8Array(readFileSync(join(cwd, file)))).toEqual(
        toPng(createIcon({ seed: file.slice(0, -'.png'.length) }), 16),
      );
    }
  });

  it('shortens a long seed in the default filename, but not an explicit --out', async ({ cwd }) => {
    const seed = 'a/'.repeat(150); // 300 characters
    await run(cwd, [seed]);
    const name = `${'a_'.repeat(50)}.png`;
    expect(readdirSync(cwd)).toEqual([name]);
    // Only the filename is shortened; the icon still uses the whole seed.
    expect(new Uint8Array(readFileSync(join(cwd, name)))).toEqual(toPng(createIcon({ seed }), 16));

    const out = `${'b'.repeat(150)}.png`;
    await run(cwd, [seed, '--out', out]);
    expect(existsSync(join(cwd, out))).toBe(true);
  });

  it('creates missing parent directories for --out', async ({ cwd }) => {
    await run(cwd, ['--seed', 'alice', '--out', 'avatars/2026/alice.svg']);
    expect(readFileSync(join(cwd, 'avatars/2026/alice.svg'), 'utf8')).toBe(
      toSvg(createIcon({ seed: 'alice' }), 16),
    );
  });

  it('reports a failed write like invalid input, without a stack trace', async ({ cwd }) => {
    mkdirSync(join(cwd, 'taken'));
    const stderr = await runFail(cwd, ['--seed', 'alice', '--out', 'taken']);
    expect(stderr).toMatch(/^pixid: EISDIR: /);
    expect(stderr).not.toMatch(/^\s+at /m);
    expect(statSync(join(cwd, 'taken')).isDirectory()).toBe(true);
  });

  it('prints help and version', async ({ cwd }) => {
    expect(await run(cwd, ['--help'])).toContain('Usage:');
    expect((await run(cwd, ['--version'])).trim()).toBe(pkg.version);
  });

  it('shows npx examples under the scoped package name', async ({ cwd }) => {
    // There is no unscoped `pixid` package on npm, so `npx pixid` would not
    // fetch this CLI.
    const help = await run(cwd, ['--help']);
    expect(help).toContain('npx @pixid/cli');
    expect(help).not.toContain('npx pixid');
  });

  it('exposes the bin through the ./run export subpath, from both module systems', async () => {
    // CommonJS gets the CJS build: requiring the ESM one would throw
    // ERR_REQUIRE_ESM. ESM gets the same file the `bin` entry points at.
    expect(createRequire(import.meta.url).resolve('@pixid/cli/run')).toBe(
      fileURLToPath(new URL('../dist/cli.cjs', import.meta.url)),
    );
    const { stdout: resolvedFromEsm } = await exec(
      process.execPath,
      ['--input-type=module', '-e', "process.stdout.write(import.meta.resolve('@pixid/cli/run'))"],
      { cwd: fileURLToPath(new URL('..', import.meta.url)) },
    );
    expect(fileURLToPath(resolvedFromEsm)).toBe(CLI);

    // Both conditions carry declarations, which is what attw checks.
    for (const types of ['../dist/cli.d.ts', '../dist/cli.d.cts']) {
      expect(existsSync(fileURLToPath(new URL(types, import.meta.url))), types).toBe(true);
    }
  });

  it('documents every flag it accepts in --help', async ({ cwd }) => {
    const help = await run(cwd, ['--help']);
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

  it('rejects unknown formats', async ({ cwd }) => {
    expect(await runFail(cwd, ['--seed', 'x', '--format', 'webp'])).toContain('--format must be');
  });

  it('rejects seed given both positionally and via flag', async ({ cwd }) => {
    expect(await runFail(cwd, ['posix', '--seed', 'flag'])).toContain('not both');
  });

  it('rejects invalid numeric options', async ({ cwd }) => {
    expect(await runFail(cwd, ['--seed', 'x', '--scale', '0'])).toContain('positive integer');
    expect(await runFail(cwd, ['--seed', 'x', '--size', 'abc'])).toContain('positive integer');
  });

  it('rejects an image wider than 4096 pixels instead of grinding on it', async ({ cwd }) => {
    // Without the cap this allocated for minutes: 8 * 100000 is 800000 pixels
    // per side, 640 billion pixels.
    expect(await runFail(cwd, ['--seed', 'x', '--scale', '100000'])).toContain(
      '--size times --scale must be at most 4096 pixels per side, got 800000 (size 8 x scale 100000)',
    );
    // One pixel over the line, counted from --size as well as --scale.
    expect(await runFail(cwd, ['--seed', 'x', '--size', '8', '--scale', '513'])).toContain(
      'got 4104',
    );
    expect(await runFail(cwd, ['--seed', 'x', '--size', '4097', '--scale', '1'])).toContain(
      'got 4097',
    );
    expect(readdirSync(cwd)).toHaveLength(0);
  });

  it('accepts an image exactly at the cap', async ({ cwd }) => {
    // SVG, so the assertion costs nothing: the same size as a PNG would be a
    // 4096x4096 pixel buffer.
    await run(cwd, ['--seed', 'x', '--size', '8', '--scale', '512', '--out', 'edge.svg']);
    expect(readFileSync(join(cwd, 'edge.svg'), 'utf8')).toContain('width="4096"');
  });

  it('rejects unknown flags', async ({ cwd }) => {
    expect(await runFail(cwd, ['--nope'])).toContain('--nope');
  });

  it('keeps numeric-looking values as the strings they are', async ({ cwd }) => {
    // An argument parser that coerces numbers (cac, yargs) turns this address
    // into 7.97e+47 and `007` into 7.
    const seed = '0x8ba1f109551bd432803012645ac136ddd64dba72';
    await run(cwd, ['--seed', seed, '--out', '007']);
    expect(new Uint8Array(readFileSync(join(cwd, '007')))).toEqual(toPng(createIcon({ seed }), 16));
  });

  it('rejects invalid colors with a clean error', async ({ cwd }) => {
    expect(await runFail(cwd, ['--seed', 'x', '--color', 'red'])).toContain('invalid color');
  });
});

describe.concurrent('@pixid/cli programmatic entry', () => {
  it('exports runCli and the package version', async () => {
    const mod = (await import(
      fileURLToPath(new URL('../dist/index.js', import.meta.url))
    )) as typeof import('./index.js');

    expect(typeof mod.runCli).toBe('function');
    expect(mod.version).toBe(pkg.version);
  });

  it('writes a file when called with an explicit argv', async ({ cwd }) => {
    const script = [
      `import { runCli } from ${JSON.stringify(fileURLToPath(new URL('../dist/index.js', import.meta.url)))};`,
      "runCli(['--seed', 'frank', '-o', 'frank.png']);",
    ].join('\n');

    await exec(process.execPath, ['--input-type=module', '-e', script], { cwd });
    expect(new Uint8Array(readFileSync(join(cwd, 'frank.png')))).toEqual(
      toPng(createIcon({ seed: 'frank' }), 16),
    );
  });
});
