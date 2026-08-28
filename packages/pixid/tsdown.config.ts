import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    platform: 'neutral',
    dts: true,
    clean: true,
    minify: true,
    target: 'es2022',
  },
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    platform: 'neutral',
    globalName: 'pixid',
    // tsdown names IIFE output `index.iife.js`; the package's `unpkg` and
    // `jsdelivr` fields point at the tsup-era `index.global.js`.
    outputOptions: { entryFileNames: '[name].global.js' },
    deps: { alwaysBundle: [/@pixid\//] },
    dts: false,
    clean: false,
    minify: true,
    target: 'es2022',
  },
  // Bin shim. `@pixid/cli` stays external so the CLI is shared, not duplicated.
  {
    entry: ['src/cli.ts'],
    format: ['esm'],
    platform: 'node',
    // `platform: 'node'` would otherwise force a `.mjs` extension, but `bin`
    // points at `dist/cli.js`.
    fixedExtension: false,
    dts: false,
    clean: false,
    minify: true,
    target: 'es2022',
    banner: '#!/usr/bin/env node',
  },
]);
