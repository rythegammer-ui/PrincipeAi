import { describe, expect, it } from "vitest";
import { isSafeSpeedInsightsRoute, redactSpeedInsightsUrl, redactWebAnalyticsUrl } from "@/components/analytics/speed-insights-redact";

const SITE = "https://principe.ai";

describe("Speed Insights URL redaction", () => {
  it("keeps ordinary page URLs", () => {
    expect(redactSpeedInsightsUrl(`${SITE}/courses/ai-essentials`)).toBe(`${SITE}/courses/ai-essentials`);
    expect(redactSpeedInsightsUrl(`${SITE}/`)).toBe(`${SITE}/`);
  });

  it("drops query strings and fragments (sign-in tokens, checkout sessions, emails)", () => {
    expect(redactSpeedInsightsUrl(`${SITE}/auth/verify?token=secret123`)).toBe(`${SITE}/auth/verify`);
    expect(redactSpeedInsightsUrl(`${SITE}/checkout/success?session_id=cs_live_abc#top`)).toBe(`${SITE}/checkout/success`);
    expect(redactSpeedInsightsUrl(`${SITE}/login?email=a%40b.com&next=/learn`)).toBe(`${SITE}/login`);
  });

  it("replaces the secret segment of private-link pages", () => {
    for (const prefix of ["/booking/", "/book/confirmed/", "/assessment/results/", "/unsubscribe/", "/checkout/test/"]) {
      expect(redactSpeedInsightsUrl(`${SITE}${prefix}tok_9f8e7d/extra?x=1`)).toBe(`${SITE}${prefix}[token]`);
    }
  });

  it("leaves public pages that share a prefix alone", () => {
    expect(redactSpeedInsightsUrl(`${SITE}/book/ai-strategy-call`)).toBe(`${SITE}/book/ai-strategy-call`);
    expect(redactSpeedInsightsUrl(`${SITE}/book`)).toBe(`${SITE}/book`);
    expect(redactSpeedInsightsUrl(`${SITE}/assessment`)).toBe(`${SITE}/assessment`);
  });

  it("resolves relative URLs against the site origin", () => {
    expect(redactSpeedInsightsUrl("/booking/abc?x=1", SITE)).toBe(`${SITE}/booking/[token]`);
  });

  it("sends nothing when the URL can't be parsed", () => {
    expect(redactSpeedInsightsUrl("not a url")).toBeNull();
  });
});

describe("Speed Insights route check", () => {
  it("accepts parametrized and static routes", () => {
    for (const route of [
      undefined,
      "",
      "/",
      "/courses/[slug]",
      "/booking/[token]",
      "/book/confirmed/[token]",
      "/checkout/test/[orderId]",
      "/learn/[courseSlug]/[lessonSlug]",
      "/admin/contacts/[id]",
      "/free-guide/thank-you",
    ]) {
      expect(isSafeSpeedInsightsRoute(route), String(route)).toBe(true);
    }
  });

  it("rejects raw private links (an unmatched URL falls back to its raw path)", () => {
    expect(isSafeSpeedInsightsRoute("/booking/sometoken123/extra")).toBe(false);
    expect(isSafeSpeedInsightsRoute("/unsubscribe/tok999/x")).toBe(false);
    expect(isSafeSpeedInsightsRoute("/assessment/results/toka1/zz")).toBe(false);
    expect(isSafeSpeedInsightsRoute("/booking/0123456789abcdef0123456789abcdef")).toBe(false);
  });

  it("rejects segments built from query text or unusual characters", () => {
    expect(isSafeSpeedInsightsRoute("/[jane@example.com]")).toBe(false);
    expect(isSafeSpeedInsightsRoute("/Some_Page")).toBe(false);
    expect(isSafeSpeedInsightsRoute("/courses/a%20b")).toBe(false);
  });
});

describe("Web Analytics URL redaction", () => {
  it("keeps campaign tags and drops every other query parameter", () => {
    expect(redactWebAnalyticsUrl(`${SITE}/free-guide?utm_source=instagram&utm_campaign=starter-kit&email=a%40b.com#x`)).toBe(
      `${SITE}/free-guide?utm_source=instagram&utm_campaign=starter-kit`,
    );
    expect(redactWebAnalyticsUrl(`${SITE}/auth/verify?token=secret123&utm_medium=email`)).toBe(`${SITE}/auth/verify?utm_medium=email`);
  });

  it("drops a campaign tag that carries an email address", () => {
    expect(redactWebAnalyticsUrl(`${SITE}/?utm_content=jane%40example.com&utm_source=newsletter`)).toBe(`${SITE}/?utm_source=newsletter`);
  });

  it("keeps no tags on private-link pages", () => {
    expect(redactWebAnalyticsUrl(`${SITE}/booking/tok_123?utm_source=email`)).toBe(`${SITE}/booking/[token]`);
  });

  it("sends nothing when the URL can't be parsed", () => {
    expect(redactWebAnalyticsUrl("not a url")).toBeNull();
  });
});
