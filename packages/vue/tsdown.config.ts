import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  platform: 'neutral',
  dts: true,
  clean: true,
  minify: true,
  target: 'es2022',
  deps: { neverBundle: ['vue'] },
});
