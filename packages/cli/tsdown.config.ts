import { defineConfig } from 'tsdown';
import pkg from './package.json' with { type: 'json' };

const define = { __PKG_VERSION__: JSON.stringify(pkg.version) };

// `platform: 'node'` would otherwise force `.mjs`/`.d.mts` extensions, but the
// package.json entry points name `.js`/`.cjs` files.
const fixedExtension = false;

// One build with two entries, so `cli.js` imports `index.js` instead of
// carrying a second copy of it (and of commander, which is bundled: it is a
// devDependency, and `@pixid/core` stays the only package installed with the
// CLI).
//
// `src/cli.ts` starts with a shebang, which tsdown keeps and marks executable.
// The executable doubles as the `./run` export subpath: importing it runs the
// CLI. Node strips the shebang from any module it loads, so the same file works
// as a bin and as an import target. Both formats are built and typed, so
// `require('@pixid/cli/run')` gets CommonJS rather than an ESM file it cannot
// load.
export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['esm', 'cjs'],
  platform: 'node',
  fixedExtension,
  // Fails the build if anything else from node_modules ends up in `dist`.
  deps: { onlyBundle: ['commander'] },
  dts: true,
  clean: true,
  minify: true,
  target: 'es2022',
  define,
});
