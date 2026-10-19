import "server-only";
import Stripe from "stripe";

/**
 * Stripe client (or null when STRIPE_SECRET_KEY isn't configured — callers fall back to the
 * built-in test checkout). Uses the SDK's pinned default API version.
 */
let cached: { key: string; client: Stripe } | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (cached?.key !== key) {
    cached = {
      key,
      client: new Stripe(key, {
        maxNetworkRetries: 2,
        timeout: 20_000,
        appInfo: { name: "Principe AI" },
      }),
    };
  }
  return cached.client;
}

/** True when the configured key is a Stripe test-mode key. */
export function stripeTestMode(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  return key.startsWith("sk_test_") || key.startsWith("rk_test_");
}

/** Link to a payment in the Stripe dashboard (test or live; defaults to the configured key's mode). */
export function stripeDashboardUrl(paymentIntentId: string, test: boolean = stripeTestMode()): string {
  return `https://dashboard.stripe.com/${test ? "test/" : ""}payments/${encodeURIComponent(paymentIntentId)}`;
}

/** Extracts the PaymentIntent id from an expandable Stripe field. */
export function paymentIntentId(value: string | Stripe.PaymentIntent | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

export type { Stripe };
