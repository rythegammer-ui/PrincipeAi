import { CheckCircle2, CircleAlert, CircleDashed, ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type IntegrationStatus = "ready" | "attention" | "optional";

export type IntegrationItem = {
  id: string;
  title: string;
  /** Environment variables involved (shown under the title; none for a setting made in the admin). */
  envVars: string[];
  status: IntegrationStatus;
  /** Short status text, e.g. "Connected", "Demo mode". */
  statusLabel: string;
  /** What it does / what happens without it. */
  summary: ReactNode;
  steps: ReactNode[];
};

const STATUS: Record<IntegrationStatus, { tone: BadgeTone; Icon: typeof CheckCircle2; iconClass: string }> = {
  ready: { tone: "green", Icon: CheckCircle2, iconClass: "text-emerald-600" },
  attention: { tone: "amber", Icon: CircleAlert, iconClass: "text-amber-600" },
  optional: { tone: "neutral", Icon: CircleDashed, iconClass: "text-zinc-400" },
};

export function Code({ children }: { children: ReactNode }) {
  return <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.8em] break-all text-zinc-800">{children}</code>;
}

export function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-medium text-brand-700 underline-offset-2 hover:underline">
      {children}
      <ExternalLink className="size-3" aria-hidden />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

/**
 * Setup checklist: one disclosure per integration, open by default when it needs attention.
 * `live`: a production site on a real database, where the test checkout and on-page sign-in links are off.
 */
export function IntegrationsChecklist({ items, live = false }: { items: IntegrationItem[]; live?: boolean }) {
  const ready = items.filter((i) => i.status === "ready").length;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-zinc-600">
        <span className="font-semibold text-zinc-900">
          {ready} of {items.length}
        </span>{" "}
        connected.{" "}
        {live
          ? "AI is optional (it falls back to built-in answers), but this live site needs email delivery and payments: without Stripe nobody can buy, and without email students can't sign in."
          : "Everything works without the optional services: AI falls back to built-in answers, payments use a test checkout, and emails are logged instead of sent."}
      </p>
      <ul className="flex flex-col gap-2">
        {items.map((item) => {
          const s = STATUS[item.status];
          return (
            <li key={item.id} id={`integration-${item.id}`} className="scroll-mt-20">
              <details
                className="group rounded-2xl border border-zinc-200/80 bg-white shadow-soft open:shadow-lift"
                open={item.status === "attention" || undefined}
              >
                <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 rounded-2xl px-4 py-3 hover:bg-zinc-50/70 focus-visible:outline-2 focus-visible:outline-brand-500 sm:px-5 [&::-webkit-details-marker]:hidden">
                  <s.Icon className={cn("size-5 shrink-0", s.iconClass)} aria-hidden />
                  {/* On phones the status sits under the title, so a long one ("Required — …") doesn't squeeze it. */}
                  <span className="flex min-w-0 flex-1 flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                    <span className="w-full min-w-0 sm:w-auto sm:flex-1">
                      <span className="block font-medium text-zinc-900">{item.title}</span>
                      {item.envVars.length > 0 && <span className="block truncate text-xs text-zinc-500">{item.envVars.join(" · ")}</span>}
                    </span>
                    <Badge tone={s.tone} className="sm:shrink-0">
                      {item.statusLabel}
                    </Badge>
                  </span>
                  <span aria-hidden className="text-zinc-400 transition-transform group-open:rotate-90">
                    ›
                  </span>
                </summary>
                <div className="border-t border-zinc-100 px-4 pt-3 pb-5 text-sm sm:px-5">
                  <p className="text-zinc-600">{item.summary}</p>
                  <ol className="mt-3 flex list-decimal flex-col gap-1.5 pl-5 text-zinc-700 marker:text-zinc-400">
                    {item.steps.map((step, i) => (
                      <li key={i} className="pl-1 leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
