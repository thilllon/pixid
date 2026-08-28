import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['esm', 'cjs'],
  platform: 'neutral',
  dts: true,
  clean: true,
  minify: true,
  target: 'es2022',
  deps: { neverBundle: ['react', 'react/jsx-runtime'] },
});
