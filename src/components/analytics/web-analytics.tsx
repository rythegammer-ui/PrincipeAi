"use client";

import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import type { ComponentProps } from "react";
import { redactWebAnalyticsUrl } from "./speed-insights-redact";

type BeforeSend = NonNullable<ComponentProps<typeof VercelAnalytics>["beforeSend"]>;

// Module-level so the reference stays stable across renders.
const beforeSend: BeforeSend = (event) => {
  const url = redactWebAnalyticsUrl(event.url, window.location.origin);
  return url ? { ...event, url } : null;
};

/**
 * Vercel Web Analytics (cookieless page views), with private links and query strings removed from URLs; campaign
 * (UTM) tags are kept so campaign reports work.
 */
export function WebAnalytics() {
  return <VercelAnalytics beforeSend={beforeSend} />;
}
