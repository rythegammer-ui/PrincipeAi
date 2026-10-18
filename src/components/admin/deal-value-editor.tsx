"use client";

import { Check, Loader2, Pencil, X } from "lucide-react";
import { useId, useOptimistic, useRef, useState, useTransition } from "react";
import { setDealValueAction } from "@/app/admin/(panel)/contacts/actions";
import { cn, formatMoney } from "@/lib/utils";

/** Inline-editable estimated deal value (dollars in, cents stored). */
export function DealValueEditor({ contactId, cents, className, size = "md" }: { contactId: string; cents: number; className?: string; size?: "sm" | "md" }) {
  const id = useId();
  const [value, setValue] = useOptimistic(cents);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const save = () => {
    const raw = inputRef.current?.value ?? "";
    setError(null);
    startTransition(async () => {
      const guess = Math.round(Number(raw.replace(/[$,\s]/g, "")) * 100);
      if (Number.isFinite(guess) && guess >= 0) setValue(guess);
      const res = await setDealValueAction(contactId, raw);
      if (!res.ok) {
        setError(res.error);
        setEditing(true);
      }
    });
    setEditing(false);
    requestAnimationFrame(() => buttonRef.current?.focus());
  };

  if (editing) {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <div className="flex items-center gap-1">
          <label htmlFor={id} className="sr-only">
            Deal value in dollars
          </label>
          <span className="text-sm text-zinc-500">$</span>
          <input
            ref={inputRef}
            id={id}
            inputMode="decimal"
            autoFocus
            defaultValue={value ? String(value / 100) : ""}
            placeholder="0"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setEditing(false);
              }
            }}
            className={cn(
              "w-24 rounded-lg border border-zinc-300 bg-white px-2 text-sm tabular-nums focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 focus:outline-none",
              size === "sm" ? "h-8" : "h-9",
            )}
          />
          <button type="button" onClick={save} className="inline-flex size-8 items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-50" aria-label="Save deal value">
            <Check className="size-4" />
          </button>
          <button type="button" onClick={() => setEditing(false)} className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100" aria-label="Cancel">
            <X className="size-4" />
          </button>
        </div>
        {error && <p role="alert" className="text-xs font-medium text-red-600">{error}</p>}
      </div>
    );
  }
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setEditing(true)}
        className={cn(
          "group inline-flex items-center gap-1.5 rounded-lg font-semibold text-zinc-900 tabular-nums hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-brand-500",
          size === "sm" ? "text-sm" : "text-base",
        )}
        aria-label={`Deal value ${formatMoney(value)}. Edit`}
      >
        {formatMoney(value)}
        {pending ? <Loader2 className="size-3.5 animate-spin text-zinc-400" aria-hidden /> : <Pencil className="size-3.5 text-zinc-400 group-hover:text-brand-600" aria-hidden />}
      </button>
      {error && <p role="alert" className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
