import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Bundles a snippet the way a user's bundler would: `@pixid/canvas` resolves
 * to this package's built `dist/` through its own exports map, with its
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

describe('bundling @pixid/canvas', () => {
  it('stays under 4 KB minified and pulls in neither other renderer', async () => {
    const code = await bundle(`
      import { createCanvas } from '@pixid/canvas';
      console.log(createCanvas({ seed: 'shake' }));
    `);
    // The PNG encoder writes literal chunk type names and the SVG renderer
    // emits a literal shape-rendering attribute; canvas draws with the 2D API
    // and needs neither.
    expect(code).not.toContain('IDAT');
    expect(code).not.toContain('crispEdges');
    expect(code.length).toBeLessThan(4 * 1024);
    console.log(`@pixid/canvas bundle: ${code.length} bytes minified`);
  });
});
