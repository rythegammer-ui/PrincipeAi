import "server-only";
import { dbMode, isDemoMode } from "@/db";
import { MIN_AUTH_SECRET_LENGTH } from "@/lib/runtime-mode";

/** Which third-party integrations are configured. Features degrade gracefully when one is missing. */
export function integrations() {
  return {
    database: dbMode(),
    demoMode: isDemoMode(),
    ai: Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY),
    stripeWebhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    email: Boolean(process.env.RESEND_API_KEY),
    cron: Boolean(process.env.CRON_SECRET),
    adminConfigured: Boolean(process.env.ADMIN_PASSWORD),
    authSecret: (process.env.AUTH_SECRET?.length ?? 0) >= MIN_AUTH_SECRET_LENGTH,
  };
}

/**
 * The built-in test checkout (no real payment) is allowed only when Stripe isn't configured
 * AND we're not running against a real production database.
 */
export function testCheckoutAllowed(): boolean {
  if (process.env.STRIPE_SECRET_KEY) return false;
  if (process.env.ALLOW_TEST_CHECKOUT === "1") return true;
  return process.env.NODE_ENV !== "production" || isDemoMode();
}
