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

/** At least 16 characters (production refuses shorter AUTH_SECRETs). Only used by the server the config starts. */
export const E2E_AUTH_SECRET = "e2e-auth-secret-0123456789abcdef";
