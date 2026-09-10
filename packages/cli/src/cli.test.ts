import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
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

  it('exposes the bin through the ./run export subpath', () => {
    expect(createRequire(import.meta.url).resolve('@pixid/cli/run')).toBe(CLI);
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
