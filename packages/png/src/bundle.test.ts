import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Bundles a snippet the way a user's bundler would: `@pixid/png` resolves to
 * this package's built `dist/` through its own exports map, with its
 * `sideEffects` flag applied.
 */
const bundle = async (source: string): Promise<string> => {
  const result = await build({
    stdin: { contents: source, resolveDir: fileURLToPath(new URL('.', import.meta.url)) },
    bundle: true,
    minify: true,
    format: 'esm',
    write: false,
    logLevel: 'silent',
  });
  return result.outputFiles[0]!.text;
};

// The PNG encoder writes literal chunk type names; the SVG renderer emits a
// literal shape-rendering attribute.
const PNG_MARKER = 'IDAT';
const SVG_MARKER = 'crispEdges';
// The CRC-32 polynomial (0xedb88320) in the encoder's top-level table setup.
// That loop is module-level code, so only `sideEffects: false` lets a bundler
// drop it when nothing from the package is used.
const CRC_MARKER = '3988292384';

describe('bundling @pixid/png', () => {
  it('stays under 6 KB minified and pulls in no SVG renderer', async () => {
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
      import '@pixid/png';
      console.log('unused');
    `);
    expect(code).not.toContain(CRC_MARKER);
    expect(code).not.toContain(PNG_MARKER);
  });
});
