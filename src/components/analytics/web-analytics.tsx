"use client";

import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import type { ComponentProps } from "react";
import { redactSpeedInsightsUrl } from "./speed-insights-redact";

type BeforeSend = NonNullable<ComponentProps<typeof VercelAnalytics>["beforeSend"]>;

// Module-level so the reference stays stable across renders.
const beforeSend: BeforeSend = (event) => {
  const url = redactSpeedInsightsUrl(event.url, window.location.origin);
  return url ? { ...event, url } : null;
};

/** Vercel Web Analytics (page views and custom events), with private links and query strings removed from URLs. */
export function WebAnalytics() {
  return <VercelAnalytics beforeSend={beforeSend} />;
}
