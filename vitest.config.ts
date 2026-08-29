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
          // Owned by the private `@pixid/e2e` package. Its tests sit at the
          // package root, not under `src/`, so the `unit` glob above cannot
          // pick them up.
          include: ['packages/e2e/*.test.ts'],
          testTimeout: 300_000,
          hookTimeout: 300_000,
          fileParallelism: false,
        },
      },
    ],
  },
});
