import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Bundles a snippet the way a user's bundler would: `@pixid/vue` resolves to
 * this package's built `dist/` through its own exports map, with its
 * `sideEffects` flag applied. Vue itself is a peer dependency, so it stays
 * external and does not count toward the size.
 */
const bundle = async (source: string): Promise<string> => {
  const result = await build({
    stdin: { contents: source, resolveDir: fileURLToPath(new URL('.', import.meta.url)) },
    bundle: true,
    minify: true,
    format: 'esm',
    write: false,
    logLevel: 'silent',
    external: ['vue'],
  });
  return result.outputFiles[0]!.text;
};

describe('bundling @pixid/vue', () => {
  it('stays under 4 KB minified, excluding vue', async () => {
    const code = await bundle(`
      import { Pixid } from '@pixid/vue';
      console.log(Pixid);
    `);
    // The PNG encoder writes literal chunk type names; the component renders
    // SVG only.
    expect(code).not.toContain('IDAT');
    expect(code.length).toBeLessThan(4 * 1024);
    console.log(`@pixid/vue bundle: ${code.length} bytes minified`);
  });
});
