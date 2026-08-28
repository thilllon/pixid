import { defineConfig } from 'tsdown';
import pkg from './package.json' with { type: 'json' };

const define = { __PKG_VERSION__: JSON.stringify(pkg.version) };

// `platform: 'node'` would otherwise force `.mjs`/`.d.mts` extensions, but the
// package.json entry points name `.js`/`.cjs` files.
const fixedExtension = false;

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    platform: 'node',
    fixedExtension,
    dts: true,
    clean: true,
    minify: true,
    target: 'es2022',
    define,
  },
  // The executable doubles as the `./run` export subpath: importing it runs
  // the CLI. Node strips the shebang from any module it loads, so the same
  // file works as a bin and as an import target.
  {
    entry: ['src/cli.ts'],
    format: ['esm'],
    platform: 'node',
    fixedExtension,
    dts: false,
    clean: false,
    minify: true,
    target: 'es2022',
    banner: '#!/usr/bin/env node',
    define,
  },
]);
