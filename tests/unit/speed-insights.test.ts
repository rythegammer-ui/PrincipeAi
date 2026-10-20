import { describe, expect, it } from "vitest";
import { redactSpeedInsightsUrl } from "@/components/analytics/speed-insights-redact";

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
