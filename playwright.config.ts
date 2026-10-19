import { defineConfig, devices } from "@playwright/test";
import {
  aiServerAvailable,
  E2E_ADMIN,
  E2E_AI_BASE_URL,
  E2E_AI_PORT,
  E2E_AUTH_SECRET,
  E2E_CRON_SECRET,
  MOCK_ANTHROPIC_PORT,
  MOCK_ANTHROPIC_URL,
} from "./tests/e2e/env";

const PORT = Number(process.env.E2E_PORT ?? 3400);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;
const AI_SPEC = /ai-claude\.spec\.ts$/;

/** Projects named on the command line (`--project=ai`, `--project ai`, globs allowed); empty when none are. */
function cliProjects(): string[] {
  const names: string[] = [];
  const argv = process.argv;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--project" && argv[i + 1]) names.push(argv[++i]);
    else if (argv[i].startsWith("--project=")) names.push(argv[i].slice("--project=".length));
  }
  return names;
}

/** Whether this run includes the project: only its own web server is started for `--project=desktop` and the like. */
function runsProject(name: string): boolean {
  const selected = cliProjects();
  return (
    selected.length === 0 ||
    selected.some((p) => new RegExp(`^${p.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`, "i").test(name))
  );
}

/**
 * The server inherits this shell's environment: pin everything the suite depends on, and switch off live services
 * (real database, email, payments, AI) even if they are configured in the shell. `anthropic` points the Claude SDK at
 * the mock Messages API instead (the `ai` project).
 */
function serverEnv(siteUrl: string, anthropic?: { baseUrl: string }): Record<string, string> {
  return {
    PGLITE_DIR: "memory://",
    ALLOW_TEST_CHECKOUT: "1",
    DATABASE_URL: "",
    POSTGRES_URL: "",
    RESEND_API_KEY: "",
    STRIPE_SECRET_KEY: "",
    STRIPE_WEBHOOK_SECRET: "",
    ANTHROPIC_API_KEY: anthropic ? "test-key" : "",
    ANTHROPIC_AUTH_TOKEN: "",
    ANTHROPIC_BASE_URL: anthropic?.baseUrl ?? "",
    ANTHROPIC_CUSTOM_HEADERS: "",
    // Kept as set in the shell, so the specs expect the same model (src/lib/ai.ts defaults to claude-opus-5-5).
    ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL ?? "",
    AI_DAILY_LIMIT: "",
    AI_TUTOR_DAILY_LIMIT: "",
    DEMO_MODE: "",
    VERCEL: "",
    ADMIN_EMAIL: E2E_ADMIN.email,
    ADMIN_PASSWORD: E2E_ADMIN.password,
    ADMIN_SESSION_VERSION: "",
    AUTH_SECRET: E2E_AUTH_SECRET,
    CRON_SECRET: E2E_CRON_SECRET,
    NEXT_PUBLIC_SITE_URL: siteUrl,
  };
}

// A server already on a port may run with other settings (database, keys, admin login): opt in explicitly.
const reuseExistingServer = process.env.E2E_REUSE_SERVER === "1";
const startAi = aiServerAvailable() && runsProject("ai");

const webServers = [
  ...(!process.env.E2E_BASE_URL && (runsProject("desktop") || runsProject("mobile"))
    ? [
        {
          name: "app",
          command: `npx next start -p ${PORT}`,
          url: `${baseURL}/admin/login`,
          reuseExistingServer,
          timeout: 120_000,
          stdout: "ignore" as const,
          stderr: "pipe" as const,
          env: serverEnv(baseURL),
        },
      ]
    : []),
  ...(startAi && !process.env.E2E_MOCK_ANTHROPIC_URL
    ? [
        {
          name: "mock-anthropic",
          command: "npx tsx tests/e2e/mock-anthropic.ts",
          url: `${MOCK_ANTHROPIC_URL}/health`,
          reuseExistingServer,
          timeout: 30_000,
          stdout: "ignore" as const,
          stderr: "pipe" as const,
          env: { E2E_MOCK_ANTHROPIC_PORT: String(MOCK_ANTHROPIC_PORT) },
          gracefulShutdown: { signal: "SIGTERM" as const, timeout: 2_000 },
        },
      ]
    : []),
  ...(startAi && !process.env.E2E_AI_BASE_URL
    ? [
        {
          name: "app-ai",
          command: `npx next start -p ${E2E_AI_PORT}`,
          url: `${E2E_AI_BASE_URL}/admin/login`,
          reuseExistingServer,
          timeout: 120_000,
          stdout: "ignore" as const,
          stderr: "pipe" as const,
          env: serverEnv(E2E_AI_BASE_URL, { baseUrl: MOCK_ANTHROPIC_URL }),
        },
      ]
    : []),
];

/**
 * End-to-end tests run against a production build in demo mode (in-memory database, built-in test checkout,
 * simulated email) so they need no external services:
 *   npx next build && npm run test:e2e
 * - `desktop` runs every spec on the server without an AI key (non-AI fallback replies); `mobile` runs only the
 *   tests tagged @mobile (and `desktop` skips them).
 * - `ai` runs tests/e2e/ai-claude.spec.ts on a second server (port 3401) whose Claude SDK calls the mock Anthropic
 *   API in tests/e2e/mock-anthropic.ts (port 3402), so the real AI code path runs. `--project=desktop` (or mobile)
 *   starts neither of them.
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
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, grepInvert: /@mobile/, testIgnore: AI_SPEC },
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } }, grep: /@mobile/, testIgnore: AI_SPEC },
    { name: "ai", use: { ...devices["Desktop Chrome"], baseURL: E2E_AI_BASE_URL }, testMatch: AI_SPEC },
  ],
  webServer: webServers.length ? webServers : undefined,
});
