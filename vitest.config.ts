import { defaultExclude, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      include: ['packages/server/src', 'packages/web-client/src'],
      exclude: ['**/generated', '**/dist', '**/dist-tsc', '**/tsconfig.*'],
    },
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    exclude: [
      ...defaultExclude,
      '**/e2e',
      '**/dist',
      '**/dist-tsc',
      '**/generated',
    ],
    globals: true,
  },
  resolve: {
    tsconfigPaths: true,
  },
})
