/**
 * Settings shared by playwright.config.ts (which starts the server with them) and the specs.
 * Point the suite at another server with E2E_BASE_URL and pass that server's admin login and cron secret
 * through E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD / E2E_CRON_SECRET.
 */
export const E2E_ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL ?? "e2e-admin@principe.ai",
  password: process.env.E2E_ADMIN_PASSWORD ?? "e2e-admin-password-0123",
};

export const E2E_CRON_SECRET = process.env.E2E_CRON_SECRET ?? "e2e-cron-secret-0123456789";

/**
 * At least 16 characters (production refuses shorter AUTH_SECRETs). The server the config starts uses it; for another
 * server, pass its AUTH_SECRET as E2E_AUTH_SECRET to run the tests that sign their own session cookies.
 */
export const E2E_AUTH_SECRET = process.env.E2E_AUTH_SECRET ?? "e2e-auth-secret-0123456789abcdef";

/**
 * The `ai` project (tests/e2e/ai-claude.spec.ts) runs against a second server whose Anthropic SDK talks to the mock
 * Messages API in tests/e2e/mock-anthropic.ts instead of api.anthropic.com. Point it at other servers with
 * E2E_AI_BASE_URL (an app server whose ANTHROPIC_BASE_URL is the mock) and E2E_MOCK_ANTHROPIC_URL.
 */
export const E2E_AI_PORT = Number(process.env.E2E_AI_PORT ?? 3401);
export const E2E_AI_BASE_URL = process.env.E2E_AI_BASE_URL ?? `http://localhost:${E2E_AI_PORT}`;
export const MOCK_ANTHROPIC_PORT = Number(process.env.E2E_MOCK_ANTHROPIC_PORT ?? 3402);
export const MOCK_ANTHROPIC_URL = process.env.E2E_MOCK_ANTHROPIC_URL ?? `http://127.0.0.1:${MOCK_ANTHROPIC_PORT}`;
/** Every reply of the mock Anthropic API contains this, so a page showing it shows real (mock) Claude output. */
export const MOCK_CLAUDE_MARKER = "MOCK-CLAUDE";

/**
 * Whether the `ai` project has a server to test: the one playwright.config.ts starts, unless the suite is pointed at
 * another server (E2E_BASE_URL) without an AI one (E2E_AI_BASE_URL).
 */
export function aiServerAvailable(): boolean {
  return !process.env.E2E_BASE_URL || Boolean(process.env.E2E_AI_BASE_URL);
}
