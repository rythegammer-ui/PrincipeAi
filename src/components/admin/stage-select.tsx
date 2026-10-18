"use client";

import { Loader2 } from "lucide-react";
import { useId, useOptimistic, useState, useTransition } from "react";
import { setContactStageAction } from "@/app/admin/(panel)/contacts/actions";
import { cn } from "@/lib/utils";
import { STAGE_META, STAGE_ORDER } from "./crm-utils";

/** Pipeline stage picker that saves on change (optimistic). */
export function StageSelect({ contactId, stage, className, label = "Pipeline stage", hideLabel = true }: { contactId: string; stage: string; className?: string; label?: string; hideLabel?: boolean }) {
  const id = useId();
  const [current, setCurrent] = useOptimistic(stage);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : "text-xs font-medium text-zinc-500"}>
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={current}
          disabled={pending}
          onChange={(e) => {
            const next = e.target.value;
            setError(null);
            startTransition(async () => {
              setCurrent(next);
              const res = await setContactStageAction(contactId, next);
              if (!res.ok) setError(res.error);
            });
          }}
          className="h-10 w-full appearance-none rounded-xl border border-zinc-300 bg-white pr-9 pl-3 text-sm font-medium text-zinc-900 shadow-xs hover:border-zinc-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 focus:outline-none disabled:opacity-70"
        >
          {STAGE_ORDER.map((s) => (
            <option key={s} value={s}>
              {STAGE_META[s].label}
            </option>
          ))}
        </select>
        <span aria-hidden className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-400">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <svg viewBox="0 0 20 20" fill="currentColor" className="size-4"><path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06z" /></svg>}
        </span>
      </div>
      {error && <p role="alert" className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
