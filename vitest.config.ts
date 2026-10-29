import { defaultExclude, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        lines: 10,
        functions: 10,
        branches: 10,
        statements: 10,
      },
      include: ['packages/embed', 'packages/procurement'],
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
