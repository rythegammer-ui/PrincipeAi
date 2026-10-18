"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { track } from "@/components/analytics/page-view-tracker";

/**
 * A next/link that records a `cta_click` funnel event (with a stable `id`) before navigating.
 * Use for every important call to action so the funnel report can attribute clicks.
 */
export function TrackedLink({ trackId, onClick, ...props }: ComponentProps<typeof Link> & { trackId: string }) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        track("cta_click", { id: trackId, href: typeof props.href === "string" ? props.href : undefined });
        onClick?.(e);
      }}
    />
  );
}
