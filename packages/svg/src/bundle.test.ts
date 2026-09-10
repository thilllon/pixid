import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Bundles a snippet the way a user's bundler would: `@pixid/svg` resolves to
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

describe('bundling @pixid/svg', () => {
  it('stays under 4 KB minified and pulls in no PNG encoder', async () => {
    const code = await bundle(`
      import { toSvg } from '@pixid/svg';
      console.log(toSvg({ seed: 'shake' }));
    `);
    // The SVG renderer emits a literal shape-rendering attribute; the PNG
    // encoder writes literal chunk type names.
    expect(code).toContain('crispEdges');
    expect(code).not.toContain('IDAT');
    expect(code.length).toBeLessThan(4 * 1024);
    console.log(`@pixid/svg bundle: ${code.length} bytes minified`);
  });
});
