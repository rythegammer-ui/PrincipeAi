"use client";

import { Columns2, Eye, PencilLine } from "lucide-react";
import { useId, useState } from "react";
import { Textarea } from "@/components/ui/form";
import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/utils";

type View = "write" | "preview" | "split";

/** Markdown textarea with a live, safely-rendered preview (write / preview / side-by-side). */
export function MarkdownField({
  name,
  label,
  defaultValue,
  hint,
  error,
  rows = 12,
  allowSplit = false,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue: string;
  hint?: string;
  error?: string;
  rows?: number;
  allowSplit?: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [view, setView] = useState<View>(allowSplit ? "split" : "write");
  const id = useId();
  const tabs: { key: View; label: string; icon: typeof Eye; className?: string }[] = [
    { key: "write", label: "Write", icon: PencilLine },
    { key: "preview", label: "Preview", icon: Eye },
    ...(allowSplit ? [{ key: "split" as const, label: "Side by side", icon: Columns2, className: "hidden xl:inline-flex" }] : []),
  ];
  const showEditor = view !== "preview";
  const showPreview = view !== "write";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-zinc-800">
          {label}
        </label>
        <div role="group" aria-label={`${label} view`} className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setView(t.key)}
              aria-pressed={view === t.key}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                view === t.key ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500 hover:text-zinc-800",
                t.className,
              )}
            >
              <t.icon className="size-3.5" aria-hidden /> {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className={cn("grid gap-3", view === "split" && "xl:grid-cols-2")}>
        <Textarea
          id={id}
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          className={cn("font-mono text-[13px]", !showEditor && "hidden")}
        />
        {showPreview && (
          <div
            className="max-h-[70vh] min-h-40 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-4 sm:p-5"
            aria-label={`${label} preview`}
            role="region"
          >
            {value.trim() ? <Markdown>{value}</Markdown> : <p className="text-sm text-zinc-500">Nothing to preview yet.</p>}
          </div>
        )}
      </div>
      {error ? (
        <p className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}
