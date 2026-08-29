import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Bundles resolve `pixid` and `@pixid/svg` from this package's own
// node_modules, where they are declared as devDependencies.
const RESOLVE_DIR = fileURLToPath(new URL('.', import.meta.url));

/**
 * Bundles a snippet against the built `pixid` package exactly like a user's
 * bundler would (ESM entry, exports map, sideEffects: false) and returns the
 * minified output.
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

describe('tree-shaking the pixid meta package', () => {
  it('drops both renderers when only the core is used', async () => {
    const code = await bundle(`
      import { createIcon } from 'pixid';
      console.log(createIcon({ seed: 'shake' }));
    `);
    expect(code).not.toContain(PNG_MARKER);
    expect(code).not.toContain(SVG_MARKER);
    expect(code.length).toBeLessThan(3 * 1024);
    console.log(`core-only bundle: ${code.length} bytes minified`);
  });

  it('drops the PNG encoder when only toSvg is used', async () => {
    const code = await bundle(`
      import { toSvg } from 'pixid';
      console.log(toSvg({ seed: 'shake' }));
    `);
    expect(code).toContain(SVG_MARKER);
    expect(code).not.toContain(PNG_MARKER);
    expect(code.length).toBeLessThan(4 * 1024);
    console.log(`svg-only bundle: ${code.length} bytes minified`);
  });

  it('drops the SVG renderer when only toPng is used', async () => {
    const code = await bundle(`
      import { toPng } from 'pixid';
      console.log(toPng({ seed: 'shake' }));
    `);
    expect(code).toContain(PNG_MARKER);
    expect(code).not.toContain(SVG_MARKER);
    expect(code.length).toBeLessThan(6 * 1024);
    console.log(`png-only bundle: ${code.length} bytes minified`);
  });

  it('stays small even when everything is imported', async () => {
    const code = await bundle(`
      import * as pixid from 'pixid';
      console.log(pixid.toSvg({ seed: 'all' }), pixid.toPng({ seed: 'all' }), pixid.createIcon());
    `);
    expect(code).toContain(PNG_MARKER);
    expect(code).toContain(SVG_MARKER);
    expect(code.length).toBeLessThan(10 * 1024);
    console.log(`full bundle: ${code.length} bytes minified`);
  });

  it('scoped packages bundle independently without the meta package', async () => {
    const code = await bundle(`
      import { toSvg } from '@pixid/svg';
      console.log(toSvg({ seed: 'scoped' }));
    `);
    expect(code).not.toContain(PNG_MARKER);
    expect(code.length).toBeLessThan(4 * 1024);
    console.log(`@pixid/svg bundle: ${code.length} bytes minified`);
  });
});
