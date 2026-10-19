"use client";

import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { summarizeContactAction } from "@/app/admin/(panel)/contacts/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/ui/markdown";

function formatStamp(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: tz }).format(new Date(iso));
}

/** AI sales brief for a contact, stored on the contact and regenerated on demand. */
export function AiBrief({
  contactId,
  summary,
  summaryAt,
  aiConfigured,
  tz,
}: {
  contactId: string;
  summary: string | null;
  summaryAt: string | null;
  aiConfigured: boolean;
  tz: string;
}) {
  const [local, setLocal] = useState<{ summary: string; at: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const current = local && (!summaryAt || local.at >= summaryAt) ? local : summary && summaryAt ? { summary, at: summaryAt } : null;
  const ruleBased = current?.summary.includes("Rule-based brief");

  const run = () => {
    setError(null);
    startTransition(async () => {
      const res = await summarizeContactAction(contactId);
      if (res.ok) setLocal({ summary: res.summary, at: res.at });
      else setError(res.error);
    });
  };

  return (
    <section aria-labelledby="ai-brief-title" className="relative overflow-hidden rounded-2xl border border-brand-200/70 bg-gradient-to-br from-brand-50/80 via-white to-gold-50/40 shadow-soft">
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <span aria-hidden className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-900/20">
            <Sparkles className="size-4" />
          </span>
          <div>
            <h2 id="ai-brief-title" className="text-base font-semibold tracking-tight text-zinc-900">
              AI sales brief
            </h2>
            <p className="text-sm text-zinc-500">
              {current ? (
                <>
                  Updated <time dateTime={current.at}>{formatStamp(current.at, tz)}</time>
                </>
              ) : (
                "Who they are, what they want, buying signals and the next best action — in seconds."
              )}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {current && <Badge tone={ruleBased ? "neutral" : "brand"}>{ruleBased ? "Rule-based" : "Claude"}</Badge>}
          <Button size="sm" variant={current ? "outline" : "primary"} onClick={run} disabled={pending} aria-busy={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : current ? <RefreshCw aria-hidden /> : <Sparkles aria-hidden />}
            {pending ? "Analyzing…" : current ? "Regenerate" : "Summarize contact"}
          </Button>
        </div>
      </div>
      <div className="px-5 pb-5 sm:px-6 sm:pb-6" aria-live="polite" aria-busy={pending}>
        {error && (
          <p role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
        {pending && !current ? (
          <div className="space-y-2.5" aria-hidden>
            {[92, 78, 85, 60].map((w) => (
              <div key={w} className="h-3 animate-pulse rounded-full bg-brand-100/70" style={{ width: `${w}%` }} />
            ))}
          </div>
        ) : current ? (
          <div className={pending ? "opacity-60 transition-opacity" : undefined}>
            <Markdown untrusted className="prose-sm prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5">{current.summary}</Markdown>
          </div>
        ) : (
          <p className="text-sm text-zinc-600">
            {aiConfigured
              ? "Claude reads the profile, timeline, assessment, chats, bookings and orders, then writes a brief you can act on."
              : "AI isn't connected yet, so you'll get a rule-based brief built from the CRM data. Add ANTHROPIC_API_KEY for a Claude-written analysis."}
          </p>
        )}
      </div>
    </section>
  );
}
