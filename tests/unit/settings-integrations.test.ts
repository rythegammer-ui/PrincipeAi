import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { emailStatus, isLiveDeployment, paymentsStatus } from "@/app/admin/(panel)/settings/integration-status";
import { IntegrationsChecklist, type IntegrationItem } from "@/components/funnels/integrations-checklist";
import { integrations } from "@/lib/integrations";
import { checkoutMode, livePaymentsBlocked } from "@/lib/payments";

/** The checklist entries the Settings page shows for the current environment. */
function current() {
  const s = integrations();
  const live = isLiveDeployment(process.env.NODE_ENV, s.demoMode);
  return {
    live,
    email: emailStatus({ email: s.email, live }),
    payments: paymentsStatus({ stripe: s.stripe, stripeWebhook: s.stripeWebhook, mode: checkoutMode(), liveKeyBlocked: livePaymentsBlocked() }),
  };
}

describe("settings integrations checklist", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function stubNoKeys() {
    for (const key of ["RESEND_API_KEY", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "ALLOW_TEST_CHECKOUT", "DATABASE_URL", "POSTGRES_URL", "VERCEL", "DEMO_MODE"]) {
      vi.stubEnv(key, "");
    }
  }

  it("treats only a production server on a persistent database as live", () => {
    expect(isLiveDeployment("production", false)).toBe(true);
    expect(isLiveDeployment("production", true)).toBe(false);
    expect(isLiveDeployment("development", false)).toBe(false);
    expect(isLiveDeployment(undefined, false)).toBe(false);
  });

  it("keeps email and Stripe optional locally, where links show on the page and the test checkout runs", () => {
    stubNoKeys();
    vi.stubEnv("NODE_ENV", "development");
    const { live, email, payments } = current();
    expect(live).toBe(false);
    expect(email).toEqual({ status: "optional", statusLabel: "Simulated" });
    expect(payments).toMatchObject({ status: "optional", statusLabel: "Test checkout" });
    expect(payments.summary).toMatch(/test checkout/);
  });

  it("keeps them optional in the throwaway demo (in-memory database)", () => {
    stubNoKeys();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PGLITE_DIR", "memory://");
    const { live, email, payments } = current();
    expect(live).toBe(false);
    expect(email.status).toBe("optional");
    expect(payments.statusLabel).toBe("Test checkout");
  });

  it("flags missing email and payments on a live production site", () => {
    stubNoKeys();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "postgres://user:pass@db.example.com/app");
    expect(checkoutMode()).toBe("disabled");
    const { live, email, payments } = current();
    expect(live).toBe(true);
    expect(email).toEqual({ status: "attention", statusLabel: "Required — students can't sign in" });
    expect(payments).toEqual({
      status: "attention",
      statusLabel: "Not connected — checkout is off",
      summary: "Course purchases and paid sessions can't be bought until Stripe is connected.",
    });
  });

  it("still describes the test checkout when a live site opts in with ALLOW_TEST_CHECKOUT", () => {
    stubNoKeys();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "postgres://user:pass@db.example.com/app");
    vi.stubEnv("ALLOW_TEST_CHECKOUT", "1");
    expect(current().payments).toMatchObject({ status: "optional", statusLabel: "Test checkout" });
  });

  it("reports connected services and a missing Stripe webhook", () => {
    stubNoKeys();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "postgres://user:pass@db.example.com/app");
    vi.stubEnv("RESEND_API_KEY", "re_123");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_123");
    expect(current().email).toEqual({ status: "ready", statusLabel: "Connected" });
    expect(current().payments).toMatchObject({ status: "attention", statusLabel: "Webhook missing" });
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_123");
    expect(current().payments).toMatchObject({ status: "ready", statusLabel: "Connected" });
  });

  it("explains a live Stripe key turned off in demo mode", () => {
    stubNoKeys();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PGLITE_DIR", "memory://");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_123");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_123");
    expect(current().payments).toMatchObject({ status: "attention", statusLabel: "Live key off in demo mode" });
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    expect(current().payments).toMatchObject({ status: "ready", statusLabel: "Connected" });
  });
});

describe("integrations checklist intro", () => {
  const items: IntegrationItem[] = [
    { id: "email", title: "Email delivery (Resend)", envVars: ["RESEND_API_KEY"], ...emailStatus({ email: false, live: true }), summary: "", steps: [] },
    { id: "ai", title: "AI (Claude)", envVars: ["ANTHROPIC_API_KEY"], status: "ready", statusLabel: "Connected", summary: "", steps: [] },
  ];
  const text = (live?: boolean) => renderToStaticMarkup(createElement(IntegrationsChecklist, { items, live })).replace(/<[^>]+>/g, "");

  it("promises the test checkout and logged emails only outside a live site", () => {
    expect(text()).toContain("Everything works without the optional services");
    expect(text(false)).toContain("payments use a test checkout");
    const live = text(true);
    expect(live).toContain("1 of 2 connected.");
    expect(live).not.toContain("test checkout");
    expect(live).toContain("needs email delivery and payments");
  });

  it("opens the entries that need attention", () => {
    const html = renderToStaticMarkup(createElement(IntegrationsChecklist, { items, live: true }));
    expect(html).toMatch(/<details[^>]*open=""[^>]*>.*Required — students can(&#x27;|')t sign in/);
  });
});
