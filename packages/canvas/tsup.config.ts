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
    globalName: 'pixidCanvas',
    noExternal: [/@pixid\//],
    minify: true,
    target: 'es2022',
  },
]);
