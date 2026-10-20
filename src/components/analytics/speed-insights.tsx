"use client";

import { SpeedInsights as VercelSpeedInsights } from "@vercel/speed-insights/next";
import type { ComponentProps } from "react";
import { redactSpeedInsightsUrl } from "./speed-insights-redact";

type BeforeSend = NonNullable<ComponentProps<typeof VercelSpeedInsights>["beforeSend"]>;

// Module-level so the reference stays stable across renders.
const beforeSend: BeforeSend = (event) => {
  const url = redactSpeedInsightsUrl(event.url, window.location.origin);
  return url ? { ...event, url } : null;
};

/** Vercel Speed Insights (real-user Core Web Vitals), with private links and query strings removed from URLs. */
export function SpeedInsights() {
  return <VercelSpeedInsights beforeSend={beforeSend} />;
}
