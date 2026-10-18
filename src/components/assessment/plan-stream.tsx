"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PlanMarkdown } from "./plan-markdown";

type Status = "connecting" | "streaming" | "done" | "error";

/** Marker the server appends when an AI stream breaks part-way (see lib/ai.ts). */
const INTERRUPTED_MARKER = "the connection was interrupted";
const RENDER_INTERVAL_MS = 60;

function messageFor(status: number): string {
  if (status === 429) return "Lots of plans are being written right now. Please wait a minute and try again.";
  if (status === 404) return "We couldn't find these results. Please check the link from your email.";
  return "We couldn't write your plan just now. Please try again.";
}

/**
 * Streams the personalized plan from POST /api/assessment/[token]/plan and renders it
 * progressively as Markdown, with a typing indicator and a retry on failure.
 */
export function PlanStream({ token }: { token: string }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const startedAttempt = useRef<number | null>(null);

  useEffect(() => {
    // Guard against React Strict Mode's double effect so the plan is only requested once per attempt.
    if (startedAttempt.current === attempt) return;
    startedAttempt.current = attempt;

    async function run() {
      try {
        const res = await fetch(`/api/assessment/${encodeURIComponent(token)}/plan`, { method: "POST", cache: "no-store" });
        if (!res.ok || !res.body) {
          setError(messageFor(res.status));
          setStatus("error");
          return;
        }
        setStatus("streaming");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = "";
        let lastRender = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          full += decoder.decode(value, { stream: true });
          const now = performance.now();
          if (now - lastRender >= RENDER_INTERVAL_MS) {
            lastRender = now;
            setText(full);
          }
        }
        full += decoder.decode();
        setText(full);
        if (!full.trim() || full.includes(INTERRUPTED_MARKER)) {
          setError("Your plan was interrupted before it finished. Please try again.");
          setStatus("error");
        } else {
          setStatus("done");
        }
      } catch {
        setError("We lost the connection while writing your plan. Please check your internet connection and try again.");
        setStatus("error");
      }
    }
    void run();
  }, [attempt, token]);

  function retry() {
    setText("");
    setError(null);
    setStatus("connecting");
    setAttempt((n) => n + 1);
  }

  const busy = status === "connecting" || status === "streaming";

  return (
    <div aria-busy={busy}>
      <p className="sr-only" role="status">
        {busy ? "Writing your personalized plan…" : status === "done" ? "Your personalized plan is ready." : ""}
      </p>

      {status === "connecting" && !text && (
        <div aria-hidden className="space-y-3">
          <TypingIndicator label="Personalizing your plan from your answers…" />
          <div className="mt-6 h-5 w-48 animate-pulse rounded bg-zinc-200/80" />
          <div className="h-4 w-full animate-pulse rounded bg-zinc-100" />
          <div className="h-4 w-11/12 animate-pulse rounded bg-zinc-100" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-zinc-100" />
        </div>
      )}

      {text && <PlanMarkdown>{text}</PlanMarkdown>}

      {status === "streaming" && (
        <div aria-hidden className="mt-4">
          <TypingIndicator label="Writing…" />
        </div>
      )}

      {status === "error" && (
        <div role="alert" className="mt-6 flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </p>
          <Button variant="outline" size="sm" onClick={retry} className="shrink-0">
            <RotateCcw aria-hidden /> Try again
          </Button>
        </div>
      )}
    </div>
  );
}

function TypingIndicator({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2.5 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-800 ring-1 ring-brand-200 ring-inset">
      <span className="flex items-center gap-1">
        {[0, 150, 300].map((delay) => (
          <span key={delay} className="size-1.5 rounded-full bg-brand-500 motion-safe:animate-bounce" style={{ animationDelay: `${delay}ms` }} />
        ))}
      </span>
      {label}
    </span>
  );
}
