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

describe('bundling @pixid/core', () => {
  it('stays under 3 KB minified', async () => {
    const code = await bundle(`
      import { createIcon } from '@pixid/core';
      console.log(createIcon({ seed: 'shake' }));
    `);
    expect(code.length).toBeLessThan(3 * 1024);
    console.log(`@pixid/core bundle: ${code.length} bytes minified`);
  });
});
