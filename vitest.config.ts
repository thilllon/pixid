import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['packages/*/src/**/*.test.{ts,tsx}'],
        },
      },
      {
        test: {
          name: 'e2e',
          include: ['e2e/**/*.test.ts'],
          testTimeout: 300_000,
          hookTimeout: 300_000,
          fileParallelism: false,
        },
      },
    ],
  },
});
