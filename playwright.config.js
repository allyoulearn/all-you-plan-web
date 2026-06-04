import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for the accessibility (axe) gate.
 *
 * IMPORTANT — this is the committed CI definition. Browser binaries are NOT
 * installed in this repo; CI (or a developer) runs
 * `npx playwright install --with-deps chromium` before `npm run test:a11y`.
 *
 * Why the dev server (not `vite preview`):
 *   The app's fixture/mock Apollo link is gated on `import.meta.env.DEV` AND
 *   `VITE_USE_MOCKS === 'true'` (see src/api/apollo.js `useMocks()`), and the
 *   dev-only "Dev sign-in (skip backend)" control on the login screen is
 *   likewise compiled out of production builds. A production `vite preview`
 *   build therefore has neither mocks nor a no-backend login path. Running
 *   `vite` in dev mode with `VITE_USE_MOCKS=true` gives the axe run a fully
 *   functional, API-free app it can authenticate into and crawl.
 */
export default defineConfig({
  testDir: './tests-e2e',
  // Fail the build on the first a11y regression rather than running on.
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  // Boot the app in dev mode with mocks so no GraphQL API is required. `open`
  // is forced off so CI doesn't try to launch a browser at the OS level.
  webServer: {
    command: 'npx vite --port 3100 --no-open',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      VITE_USE_MOCKS: 'true'
    }
  }
})
