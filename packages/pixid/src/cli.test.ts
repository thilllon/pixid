import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toPng } from '@pixid/png';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

/** The unscoped `pixid` bin: a shim that imports `@pixid/cli/run`. */
const SHIM = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
/** The real implementation, resolved the same way the shim resolves it. */
const CLI = require.resolve('@pixid/cli/run');

let cwd: string;

const run = (bin: string, args: string[]) =>
  execFileSync(process.execPath, [bin, ...args], { cwd, encoding: 'utf8' });

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), 'pixid-shim-'));
});

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

describe('pixid bin shim', () => {
  it('delegates to @pixid/cli instead of shipping a second copy', () => {
    expect(readFileSync(SHIM, 'utf8')).toContain('@pixid/cli/run');
  });

  it('produces byte-identical output to the @pixid/cli bin', () => {
    run(SHIM, ['--seed', 'grace', '-o', 'shim.png']);
    run(CLI, ['--seed', 'grace', '-o', 'direct.png']);

    const shimBytes = new Uint8Array(readFileSync(join(cwd, 'shim.png')));
    expect(shimBytes).toEqual(new Uint8Array(readFileSync(join(cwd, 'direct.png'))));
    expect(shimBytes).toEqual(toPng({ seed: 'grace', scale: 16 }));
  });

  it('reports the same help and version as the @pixid/cli bin', () => {
    expect(run(SHIM, ['--help'])).toBe(run(CLI, ['--help']));
    expect(run(SHIM, ['--version'])).toBe(run(CLI, ['--version']));
  });
});
