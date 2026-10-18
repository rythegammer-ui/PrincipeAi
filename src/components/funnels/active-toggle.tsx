"use client";

import { useOptimistic, useState, useTransition } from "react";
import { setSequenceActiveAction } from "@/app/admin/(panel)/sequences/actions";
import { cn } from "@/lib/utils";

/** On/off switch for an automation (optimistic, reverts on error). */
export function ActiveToggle({ sequenceId, name, active }: { sequenceId: string; name: string; active: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(active);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <button
        type="button"
        role="switch"
        aria-checked={optimistic}
        aria-label={`${name}: ${optimistic ? "on" : "off"}`}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            setOptimistic(!optimistic);
            const res = await setSequenceActiveAction(sequenceId, !optimistic);
            if (!res.ok) setError(res.error);
          })
        }
        className="group inline-flex min-h-9 items-center gap-2 rounded-lg px-1 text-xs font-medium text-zinc-700 focus-visible:outline-2 focus-visible:outline-brand-500 disabled:opacity-70"
      >
        <span
          aria-hidden
          className={cn("relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors", optimistic ? "bg-brand-600" : "bg-zinc-300")}
        >
          <span className={cn("absolute size-4 rounded-full bg-white shadow-sm transition-transform", optimistic ? "translate-x-[18px]" : "translate-x-0.5")} />
        </span>
        {optimistic ? "On" : "Off"}
      </button>
      {error && (
        <span role="alert" className="text-xs text-red-600">
          {error}
        </span>
      )}
    </span>
  );
}
