/**
 * Cleans a page URL before Vercel Speed Insights sends it off the site. Query strings can carry sign-in tokens,
 * checkout session ids or email addresses, and some pages are private links whose path segment is the secret
 * (manage a booking, assessment results, unsubscribe), so both are removed. Speed Insights still groups data by
 * route (e.g. /booking/[token]), which is unaffected.
 */
const PRIVATE_LINK_PREFIXES = ["/booking/", "/book/confirmed/", "/assessment/results/", "/unsubscribe/", "/checkout/test/"];

/** A route segment is a plain path word or a [param] name, e.g. /booking/[token] or /learn/[courseSlug]. */
const SAFE_ROUTE_SEGMENT = /^(?:[a-z0-9-]+|\[(?:\.\.\.)?[A-Za-z]\w*\])$/;

/**
 * The SDK also sends a `route`, which beforeSend can't rewrite (only drop). It's normally parametrized, but on an
 * unmatched URL it falls back to the raw path (/booking/<token>/extra), and on a page without path params a
 * query key can become a [segment] (/?jane@example.com → /[jane@example.com]). Such routes aren't safe to send.
 */
export function isSafeSpeedInsightsRoute(route: string | null | undefined): boolean {
  if (!route) return true;
  const segments = route.split("/").filter(Boolean);
  if (!segments.every((s) => SAFE_ROUTE_SEGMENT.test(s))) return false;
  const path = `/${segments.join("/")}`;
  return !PRIVATE_LINK_PREFIXES.some((p) => path.startsWith(p) && !path.slice(p.length).startsWith("["));
}

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
