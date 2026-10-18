"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Copies text (e.g. a prompt) to the clipboard with visible + screen-reader feedback. */
export function CopyButton({ text, label = "Copy prompt", className }: { text: string; label?: string; className?: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus("idle"), 2200);
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        className={cn(
          "inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400",
          status === "copied" ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-zinc-200 hover:bg-white/20 hover:text-white",
          className,
        )}
      >
        {status === "copied" ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
        {status === "copied" ? "Copied" : status === "failed" ? "Select & copy" : label}
      </button>
      <span className="sr-only" aria-live="polite">
        {status === "copied" ? "Prompt copied to clipboard." : status === "failed" ? "Couldn't copy automatically. Please select the prompt text and copy it." : ""}
      </span>
    </>
  );
}
