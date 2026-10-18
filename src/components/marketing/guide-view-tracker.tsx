"use client";

import { useEffect, useRef } from "react";
import { track } from "@/components/analytics/page-view-tracker";

/** Records one `guide_viewed` funnel event per page load of the Starter Kit. */
export function GuideViewTracker({ unlocked }: { unlocked: boolean }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    track("guide_viewed", { unlocked });
  }, [unlocked]);
  return null;
}
