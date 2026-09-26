import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Bundles a snippet the way a user's bundler would: `@pixid/core` resolves to
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
// The CRC-32 polynomial (0xedb88320) that fills the PNG encoder's lookup
// table. All renderers share one built file, so `sideEffects: false` cannot
// drop module-level code per renderer; the table is built on first use, and
// this marker catches it creeping back to the top level.
const CRC_MARKER = '3988292384';

describe('bundling @pixid/core', () => {
  it('keeps createIcon alone under 3 KB minified, with no renderer', async () => {
    const code = await bundle(`
      import { createIcon } from '@pixid/core';
      console.log(createIcon({ seed: 'shake' }));
    `);
    expect(code).not.toContain(SVG_MARKER);
    expect(code).not.toContain(PNG_MARKER);
    expect(code).not.toContain(CRC_MARKER);
    expect(code.length).toBeLessThan(3 * 1024);
    console.log(`createIcon bundle: ${code.length} bytes minified`);
  });

  it('keeps toSvg under 4 KB minified, with no PNG encoder', async () => {
    const code = await bundle(`
      import { createIcon, toSvg } from '@pixid/core';
      console.log(toSvg(createIcon({ seed: 'shake' })));
    `);
    expect(code).toContain(SVG_MARKER);
    expect(code).not.toContain(PNG_MARKER);
    expect(code).not.toContain(CRC_MARKER);
    expect(code.length).toBeLessThan(4 * 1024);
    console.log(`toSvg bundle: ${code.length} bytes minified`);
  });

  it('keeps toPng under 6 KB minified, with no SVG renderer', async () => {
    const code = await bundle(`
      import { createIcon, toPng } from '@pixid/core';
      console.log(toPng(createIcon({ seed: 'shake' })));
    `);
    expect(code).toContain(PNG_MARKER);
    expect(code).not.toContain(SVG_MARKER);
    expect(code.length).toBeLessThan(6 * 1024);
    console.log(`toPng bundle: ${code.length} bytes minified`);
  });

  it('drops an imported but unused @pixid/core entirely', async () => {
    const code = await bundle(`
      import '@pixid/core';
      console.log('unused');
    `);
    expect(code).not.toContain(CRC_MARKER);
    expect(code).not.toContain(PNG_MARKER);
    expect(code).not.toContain(SVG_MARKER);
  });
});
