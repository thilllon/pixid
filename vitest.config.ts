import { configDefaults, defineConfig } from 'vitest/config';

// Every test lives next to the code it covers, in its package's `src/`.
// `*.e2e.test.ts` files boot a local registry and are slow, so they form their
// own project (`pnpm e2e`) instead of running with the unit tests (`pnpm test`).
const E2E = 'packages/*/src/**/*.e2e.test.ts';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['packages/*/src/**/*.test.{ts,tsx}'],
          exclude: [...configDefaults.exclude, E2E],
        },
      },
      {
        test: {
          name: 'e2e',
          include: [E2E],
          testTimeout: 300_000,
          hookTimeout: 300_000,
          fileParallelism: false,
        },
      },
    ],
  },
});
