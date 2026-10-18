"use client";

import { useState } from "react";
import { BarList, type BarItem } from "@/components/analytics/charts";
import { cn } from "@/lib/utils";

/** Lead sources as ranked bars, switchable between signup path (contacts.source) and channel (utm.source). */
export function SourceBreakdown({ paths, channels }: { paths: BarItem[]; channels: BarItem[] }) {
  const [view, setView] = useState<"paths" | "channels">("paths");
  const items = view === "paths" ? paths : channels;
  return (
    <div className="flex flex-col gap-3">
      <div className="inline-flex self-start rounded-lg border border-zinc-200 bg-white p-0.5" role="group" aria-label="Group leads by">
        {(
          [
            { id: "paths", label: "Signup path" },
            { id: "channels", label: "Channel (UTM)" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={view === t.id}
            onClick={() => setView(t.id)}
            className={cn("h-7 rounded-md px-2.5 text-xs font-medium transition-colors", view === t.id ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100")}
          >
            {t.label}
          </button>
        ))}
      </div>
      <BarList
        items={items}
        ariaLabel={view === "paths" ? "New leads by signup path" : "New leads by marketing channel"}
        emptyMessage="No new leads in this period yet."
      />
    </div>
  );
}
