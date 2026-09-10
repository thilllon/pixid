import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Bundles resolve `@pixid/core`, `@pixid/svg`, and `@pixid/png` from this
// package's own node_modules, where they are declared as devDependencies.
const RESOLVE_DIR = fileURLToPath(new URL('.', import.meta.url));

/**
 * Bundles a snippet against the built packages exactly like a user's bundler
 * would (ESM entry, exports map, sideEffects: false) and returns the minified
 * output.
 */
const bundle = async (source: string): Promise<string> => {
  const result = await build({
    stdin: { contents: source, resolveDir: RESOLVE_DIR, loader: 'ts' },
    bundle: true,
    minify: true,
    format: 'esm',
    write: false,
    logLevel: 'silent',
  });
  return result.outputFiles[0]!.text;
};

// Marker strings that survive minification and identify each renderer:
// the PNG encoder writes literal chunk type names, the SVG renderer emits
// a literal shape-rendering attribute.
const PNG_MARKER = 'IDAT';
const SVG_MARKER = 'crispEdges';
// The CRC-32 polynomial (0xedb88320) in @pixid/png's top-level table setup.
// That loop is module-level code, so only `sideEffects: false` lets a
// bundler drop it when nothing from the package is used.
const PNG_CRC_MARKER = '3988292384';

describe('bundling the scoped packages', () => {
  it('pulls in neither renderer when only the core is used', async () => {
    const code = await bundle(`
      import { createIcon } from '@pixid/core';
      console.log(createIcon({ seed: 'shake' }));
    `);
    expect(code).not.toContain(PNG_MARKER);
    expect(code).not.toContain(SVG_MARKER);
    expect(code.length).toBeLessThan(3 * 1024);
    console.log(`@pixid/core bundle: ${code.length} bytes minified`);
  });

  it('leaves out the PNG encoder when only toSvg is used', async () => {
    const code = await bundle(`
      import { toSvg } from '@pixid/svg';
      console.log(toSvg({ seed: 'shake' }));
    `);
    expect(code).toContain(SVG_MARKER);
    expect(code).not.toContain(PNG_MARKER);
    expect(code.length).toBeLessThan(4 * 1024);
    console.log(`@pixid/svg bundle: ${code.length} bytes minified`);
  });

  it('leaves out the SVG renderer when only toPng is used', async () => {
    const code = await bundle(`
      import { toPng } from '@pixid/png';
      console.log(toPng({ seed: 'shake' }));
    `);
    expect(code).toContain(PNG_MARKER);
    expect(code).not.toContain(SVG_MARKER);
    expect(code.length).toBeLessThan(6 * 1024);
    console.log(`@pixid/png bundle: ${code.length} bytes minified`);
  });

  it('drops an imported but unused @pixid/png entirely', async () => {
    const code = await bundle(`
      import { toSvg } from '@pixid/svg';
      import '@pixid/png';
      console.log(toSvg({ seed: 'shake' }));
    `);
    expect(code).not.toContain(PNG_CRC_MARKER);
    expect(code).not.toContain(PNG_MARKER);
  });

  it('stays small with the core and both renderers', async () => {
    const code = await bundle(`
      import { createIcon } from '@pixid/core';
      import { toSvg } from '@pixid/svg';
      import { toPng } from '@pixid/png';
      console.log(toSvg({ seed: 'all' }), toPng({ seed: 'all' }), createIcon());
    `);
    expect(code).toContain(PNG_MARKER);
    expect(code).toContain(SVG_MARKER);
    expect(code.length).toBeLessThan(10 * 1024);
    console.log(`core + svg + png bundle: ${code.length} bytes minified`);
  });
});
