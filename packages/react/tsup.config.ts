import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  target: 'es2022',
  external: ['react', 'react/jsx-runtime'],
});
