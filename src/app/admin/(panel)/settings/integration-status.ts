import type { IntegrationStatus } from "@/components/funnels/integrations-checklist";

/**
 * Status rules for the Settings → Integrations checklist, kept pure so they're unit tested. The page passes in the
 * runtime: integrations() and checkoutMode().
 */

type ItemStatus = { status: IntegrationStatus; statusLabel: string };

/** How buyers pay right now (the return value of checkoutMode() in @/lib/payments). */
export type CheckoutMode = "stripe" | "test" | "disabled";

/**
 * A production server on a persistent database, i.e. real visitors. Local development and the throwaway demo
 * (in-memory database) show sign-in links on the page and run the test checkout, so nothing there needs Resend or Stripe.
 */
export function isLiveDeployment(nodeEnv: string | undefined, demoMode: boolean): boolean {
  return nodeEnv === "production" && !demoMode;
}

/**
 * Without Resend every email is only logged. Locally and in the demo the login page shows the sign-in link instead,
 * but on a live site that link is never shown, so students (paying ones too) can't sign in at all.
 */
export function emailStatus({ email, live }: { email: boolean; live: boolean }): ItemStatus {
  if (email) return { status: "ready", statusLabel: "Connected" };
  if (live) return { status: "attention", statusLabel: "Required — students can't sign in" };
  return { status: "optional", statusLabel: "Simulated" };
}

/**
 * The postal address the US CAN-SPAM Act requires in every marketing email (Settings → Business → Mailing address).
 * Marketing emails still go out without it, so it stays flagged until it is set.
 */
export function mailingAddressStatus(address: string): ItemStatus {
  if (address.trim()) return { status: "ready", statusLabel: "Set" };
  return { status: "attention", statusLabel: "Missing — required by law" };
}

/**
 * Stripe's checklist entry, from what's configured and how checkout actually behaves: `mode` is checkoutMode() and
 * `liveKeyBlocked` is livePaymentsBlocked() (a demo deployment refuses a live key, since its orders would be lost).
 */
export function paymentsStatus({
  stripe,
  stripeWebhook,
  mode,
  liveKeyBlocked,
}: {
  stripe: boolean;
  stripeWebhook: boolean;
  mode: CheckoutMode;
  liveKeyBlocked: boolean;
}): ItemStatus & { summary: string } {
  if (liveKeyBlocked) {
    return {
      status: "attention",
      statusLabel: "Live key off in demo mode",
      summary:
        "This demo has no database, so checkout is turned off while a live Stripe key is set: orders would be lost. Connect a database, or use a test key (sk_test_…) to try payments.",
    };
  }
  if (stripe) {
    return {
      status: stripeWebhook ? "ready" : "attention",
      statusLabel: stripeWebhook ? "Connected" : "Webhook missing",
      summary: "Course and paid-session checkouts go through Stripe. The webhook confirms payments and unlocks courses, so it must be set up too.",
    };
  }
  if (mode === "test") {
    return {
      status: "optional",
      statusLabel: "Test checkout",
      summary: "Without Stripe, a built-in test checkout lets you try the full purchase flow with no real payment.",
    };
  }
  return {
    status: "attention",
    statusLabel: "Not connected — checkout is off",
    summary: "Course purchases and paid sessions can't be bought until Stripe is connected.",
  };
}
