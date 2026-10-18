"use client";

import { useState, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};
const detect = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
};

/**
 * The visitor's timezone (detected from the browser after hydration, overridable by the user).
 * Before hydration it falls back to `fallback` so server and client markup match.
 */
export function useVisitorTimezone(fallback: string) {
  const detected = useSyncExternalStore(noopSubscribe, detect, () => null);
  const [chosen, setChosen] = useState<string | null>(null);
  return {
    timezone: chosen ?? detected ?? fallback,
    detected,
    /** True once we're on the client (the full timezone list can be rendered). */
    ready: detected !== null,
    setTimezone: setChosen,
  };
}
