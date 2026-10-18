"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

/** Sends one "page_view" event per client navigation to /api/track. */
export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const last = useRef<string | null>(null);

  useEffect(() => {
    const key = pathname;
    if (last.current === key) return;
    last.current = key;
    track("page_view", { path: pathname, referrer: document.referrer || undefined, query: searchParams.toString() || undefined });
  }, [pathname, searchParams]);

  return null;
}

/** Fire-and-forget client event (allowed names: see CLIENT_EVENTS in lib/tracking.ts). */
export function track(name: string, props: Record<string, unknown> = {}) {
  try {
    const body = JSON.stringify({ name, path: (props.path as string) ?? window.location.pathname, props });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/track", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
    }
  } catch {
    /* analytics must never break the page */
  }
}
