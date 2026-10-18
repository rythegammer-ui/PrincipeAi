"use client";

import { Lightbulb, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/ui/markdown";
import { generateInsightsAction } from "../actions";
import type { StoredInsights } from "../insights";

function formatStamp(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: tz }).format(new Date(iso));
}

/** "AI insights" across recent assistant chats: top questions, objections, content ideas and FAQ gaps. */
export function InsightsCard({
  initial,
  aiConfigured,
  hasConversations,
  sampleSize,
  tz,
}: {
  initial: StoredInsights | null;
  aiConfigured: boolean;
  hasConversations: boolean;
  sampleSize: number;
  tz: string;
}) {
  const [insights, setInsights] = useState<StoredInsights | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = () => {
    setError(null);
    startTransition(async () => {
      const res = await generateInsightsAction();
      if (res.ok) setInsights(res.insights);
      else setError(res.error);
    });
  };

  return (
    <section
      aria-labelledby="ai-insights-title"
      className="relative overflow-hidden rounded-2xl border border-brand-200/70 bg-gradient-to-br from-brand-50/80 via-white to-gold-50/40 shadow-soft"
    >
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <span aria-hidden className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-900/20">
            <Lightbulb className="size-4" />
          </span>
          <div>
            <h2 id="ai-insights-title" className="text-base font-semibold tracking-tight text-zinc-900">
              AI insights
            </h2>
            <p className="text-sm text-zinc-500">
              {insights ? (
                <>
                  Based on {insights.conversations} recent {insights.conversations === 1 ? "chat" : "chats"} · updated{" "}
                  <time dateTime={insights.generatedAt}>{formatStamp(insights.generatedAt, tz)}</time>
                </>
              ) : (
                `What prospects ask most, what holds them back, and what to write next — from your last ${sampleSize} assistant chats.`
              )}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {insights && <Badge tone={insights.source === "ai" ? "brand" : "neutral"}>{insights.source === "ai" ? "Claude" : "Rule-based"}</Badge>}
          <Button size="sm" variant={insights ? "outline" : "primary"} onClick={run} disabled={pending || !hasConversations} aria-busy={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : insights ? <RefreshCw aria-hidden /> : <Sparkles aria-hidden />}
            {pending ? "Analyzing…" : insights ? "Refresh" : "Analyze conversations"}
          </Button>
        </div>
      </div>
      <div className="px-5 pb-5 sm:px-6 sm:pb-6" aria-live="polite" aria-busy={pending}>
        {error && (
          <p role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
        {pending && !insights ? (
          <div className="space-y-2.5" aria-hidden>
            {[90, 74, 82, 58, 68].map((w) => (
              <div key={w} className="h-3 animate-pulse rounded-full bg-brand-100/70" style={{ width: `${w}%` }} />
            ))}
          </div>
        ) : insights ? (
          <div className={pending ? "opacity-60 transition-opacity" : undefined}>
            <Markdown className="prose-sm max-w-none prose-h2:mt-5 prose-h2:mb-2 prose-h2:text-sm prose-h2:font-semibold prose-h2:tracking-wide prose-h2:text-brand-800 prose-h2:uppercase prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-table:my-2 prose-table:text-sm sm:columns-2 sm:gap-8 [&>:first-child]:mt-0 [&_h2]:break-after-avoid [&_table]:break-inside-avoid [&_ul]:break-inside-avoid">
              {insights.markdown}
            </Markdown>
          </div>
        ) : (
          <p className="text-sm text-zinc-600">
            {!hasConversations
              ? "Once visitors start chatting with the website assistant, you'll be able to analyze their questions here."
              : aiConfigured
                ? "Claude reads recent visitor questions and groups them into themes you can act on."
                : "AI isn't connected yet, so you'll get a rule-based summary from keyword frequency. Add ANTHROPIC_API_KEY for a Claude-written analysis."}
          </p>
        )}
      </div>
    </section>
  );
}
