"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Old-school fallback for browsers / contexts without the async Clipboard API. */
function legacyCopy(text: string): boolean {
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.position = "fixed";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(el);
  return ok;
}

/** Copy-to-clipboard button with visible + screen-reader feedback. */
export function CopyButton({
  text,
  label = "Copy",
  srLabel,
  tone = "light",
  className,
}: {
  text: string;
  label?: string;
  /** Accessible name, e.g. "Copy prompt: Weekly meal plan". */
  srLabel?: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      ok = legacyCopy(text);
    }
    setStatus(ok ? "copied" : "failed");
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus("idle"), 2200);
  }

  const copied = status === "copied";
  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={srLabel}
        className={cn(
          "inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
          tone === "dark"
            ? copied
              ? "bg-emerald-400/15 text-emerald-300"
              : "bg-white/10 text-zinc-100 hover:bg-white/20"
            : copied
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 ring-inset"
              : "bg-white text-zinc-700 ring-1 ring-zinc-200 ring-inset hover:bg-brand-50 hover:text-brand-800 hover:ring-brand-200",
          className,
        )}
      >
        {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
        <span aria-hidden={srLabel ? true : undefined}>{copied ? "Copied" : status === "failed" ? "Select & copy" : label}</span>
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Copied to clipboard." : status === "failed" ? "Couldn't copy automatically. Please select the text and copy it." : ""}
      </span>
    </>
  );
}
