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
    globalName: 'pixidCanvas',
    // tsdown names IIFE output `index.iife.js`; the package's `unpkg` and
    // `jsdelivr` fields point at the tsup-era `index.global.js`.
    outputOptions: { entryFileNames: '[name].global.js' },
    deps: { alwaysBundle: [/@pixid\//] },
    dts: false,
    clean: false,
    minify: true,
    target: 'es2022',
  },
]);
