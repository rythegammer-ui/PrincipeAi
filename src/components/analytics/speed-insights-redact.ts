/**
 * Cleans a page URL before Vercel Speed Insights sends it off the site. Query strings can carry sign-in tokens,
 * checkout session ids or email addresses, and some pages are private links whose path segment is the secret
 * (manage a booking, assessment results, unsubscribe), so both are removed. Speed Insights still groups data by
 * route (e.g. /booking/[token]), which is unaffected.
 */
const PRIVATE_LINK_PREFIXES = ["/booking/", "/book/confirmed/", "/assessment/results/", "/unsubscribe/", "/checkout/test/"];

export function redactSpeedInsightsUrl(href: string, base?: string): string | null {
  try {
    const url = new URL(href, base);
    url.search = "";
    url.hash = "";
    const prefix = PRIVATE_LINK_PREFIXES.find((p) => url.pathname.startsWith(p) && url.pathname.length > p.length);
    if (prefix) url.pathname = prefix + "[token]";
    return url.toString();
  } catch {
    // A URL we can't parse can't be cleaned, so it isn't sent at all.
    return null;
  }
}
