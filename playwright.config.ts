import { sharedConfig } from '@packages/web-app-utils/shared'
import { defineConfig, devices } from '@playwright/test'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e/tests',
  outputDir: './e2e/generated/e2e-test-results/',
  reporter: [
    [
      'html',
      { outputFolder: './e2e/generated/e2e-test-reports', open: 'never' },
    ],
  ],
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : '50%',
  use: {
    ignoreHTTPSErrors: true,
    trace: 'on',
    baseURL: sharedConfig.webClientOrigin,
  },

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'pnpm run start-server',
      url: sharedConfig.origin,
      reuseExistingServer: !process.env.CI,
      ignoreHTTPSErrors: true,
    },
    {
      command: 'pnpm run start-react:watch',
      url: sharedConfig.webClientOrigin,
      reuseExistingServer: !process.env.CI,
      ignoreHTTPSErrors: true,
    },
  ],

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--ignore-certificate-errors'],
        },
      },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      /**
       * Firefox takes more time setting up
       *  fixtures like BrowserContexts.
       */
      // timeout: 50 * 1000,
      timeout: 150 * 1000,
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      timeout: 60 * 1000,
    },

    // /* Test against mobile browsers. */
    // {
    //   name: 'Mobile Chrome',
    //   use: {
    //     ...devices['Pixel 5'],
    //     launchOptions: {
    //       args: ['--ignore-certificate-errors'],
    //     },
    //   },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    //   timeout: 50 * 1000,
    // },
    // // /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: {
    //     ...devices['Desktop Edge'],
    //     channel: 'msedge',
    //     launchOptions: {
    //       args: ['--ignore-certificate-errors'],
    //     },
    //   },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: {
    //     ...devices['Desktop Chrome'],
    //     channel: 'chrome',
    //     launchOptions: {
    //       args: ['--ignore-certificate-errors'],
    //     },
    //   },
    // },
  ],
})
