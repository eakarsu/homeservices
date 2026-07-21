import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: '.playwright-report-runtime', open: 'never' }]],

  // Global setup runs once before all tests to cache the admin auth state.
  // Individual specs that need auth use storageState: '.auth/admin.json'.
  globalSetup: './tests/helpers/globalSetup.ts',

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Default timeout per action
    actionTimeout: 10_000,
    // Default navigation timeout
    navigationTimeout: 30_000,
  },

  projects: [
    // ---- Unauthenticated tests (landing page, login page) ----
    {
      name: 'public',
      testMatch: ['**/landing-page.spec.ts', '**/auth.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },

    // ---- Authenticated tests (everything behind /dashboard) ----
    {
      name: 'authenticated',
      testIgnore: ['**/landing-page.spec.ts', '**/auth.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        // Reuse the admin session saved by globalSetup — avoids repeated logins
        storageState: '.auth/admin.json',
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
