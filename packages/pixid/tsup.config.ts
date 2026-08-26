import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    minify: true,
    target: 'es2022',
  },
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'pixid',
    noExternal: [/@pixid\//],
    minify: true,
    target: 'es2022',
  },
  // Bin shim. `@pixid/cli` stays external so the CLI is shared, not duplicated.
  {
    entry: ['src/cli.ts'],
    format: ['esm'],
    minify: true,
    target: 'es2022',
    banner: { js: '#!/usr/bin/env node' },
  },
]);
