"use client";

import { useSyncExternalStore } from "react";

const noSubscribe = () => () => {};

/**
 * A date in the viewer's own time zone. The server renders `fallback` (formatted in the business time zone);
 * the browser swaps in its local date after hydration, so nobody sees "yesterday" because the server runs in UTC.
 */
export function LocalDate({ iso, fallback, options = { dateStyle: "long" } }: { iso: string; fallback: string; options?: Intl.DateTimeFormatOptions }) {
  const text = useSyncExternalStore(
    noSubscribe,
    () => new Intl.DateTimeFormat("en-US", options).format(new Date(iso)),
    () => fallback,
  );
  return <time dateTime={iso}>{text}</time>;
}
