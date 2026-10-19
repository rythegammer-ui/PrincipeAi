import { defineConfig, devices } from "@playwright/test";
import { E2E_ADMIN, E2E_AUTH_SECRET, E2E_CRON_SECRET } from "./tests/e2e/env";

const PORT = Number(process.env.E2E_PORT ?? 3400);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

/**
 * End-to-end tests run against a production build in demo mode (in-memory database, built-in test checkout,
 * simulated email, non-AI fallback replies) so they need no external services:
 *   npx next build && npm run test:e2e
 * The `mobile` project runs only the tests tagged @mobile (and `desktop` skips them).
 * Set PLAYWRIGHT_CHROMIUM_EXECUTABLE to use a Chromium other than the one bundled with @playwright/test.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, grepInvert: /@mobile/ },
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } }, grep: /@mobile/ },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npx next start -p ${PORT}`,
        url: `${baseURL}/admin/login`,
        // A server already on this port may run with other settings (database, keys, admin login): opt in explicitly.
        reuseExistingServer: process.env.E2E_REUSE_SERVER === "1",
        timeout: 120_000,
        stdout: "ignore",
        stderr: "pipe",
        // The server inherits this shell's environment: pin everything the suite depends on, and switch off
        // live services (real database, email, payments, AI) even if they are configured in the shell.
        env: {
          PGLITE_DIR: "memory://",
          ALLOW_TEST_CHECKOUT: "1",
          DATABASE_URL: "",
          POSTGRES_URL: "",
          RESEND_API_KEY: "",
          STRIPE_SECRET_KEY: "",
          STRIPE_WEBHOOK_SECRET: "",
          ANTHROPIC_API_KEY: "",
          ANTHROPIC_AUTH_TOKEN: "",
          DEMO_MODE: "",
          VERCEL: "",
          ADMIN_EMAIL: E2E_ADMIN.email,
          ADMIN_PASSWORD: E2E_ADMIN.password,
          ADMIN_SESSION_VERSION: "",
          AUTH_SECRET: E2E_AUTH_SECRET,
          CRON_SECRET: E2E_CRON_SECRET,
          NEXT_PUBLIC_SITE_URL: baseURL,
        },
      },
});
