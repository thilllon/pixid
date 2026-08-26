import { defineConfig } from 'tsup';
import pkg from './package.json';

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
  {
    entry: ['src/cli.ts'],
    format: ['esm'],
    minify: true,
    target: 'es2022',
    banner: { js: '#!/usr/bin/env node' },
    define: { __PKG_VERSION__: JSON.stringify(pkg.version) },
  },
]);
