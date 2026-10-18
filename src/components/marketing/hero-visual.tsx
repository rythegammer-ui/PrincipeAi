import { ArrowUp, CalendarCheck2, Check, Database, Inbox, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const MENU = [
  { day: "Mon", meal: "Lemon garlic chicken traybake" },
  { day: "Tue", meal: "Veggie fried rice" },
  { day: "Wed", meal: "Turkey tacos with crunchy slaw" },
];

const FLOW = [
  { icon: Inbox, label: "New enquiry from your website", done: true },
  { icon: Sparkles, label: "AI drafts a personal reply", done: true },
  { icon: Database, label: "Contact added to your CRM", done: true },
  { icon: CalendarCheck2, label: "Discovery call booked", done: false },
];

/**
 * Decorative hero illustration: an AI assistant chat (life) + a lead follow-up automation (business).
 * Pure HTML/CSS — no images. Exposed to assistive tech as a single labelled image.
 */
export function HeroVisual({ className }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="Illustration: an AI assistant planning a week of quick dinners, next to an automation that replies to a new business enquiry, updates the CRM and books a call."
      className={cn("relative mx-auto w-full max-w-[28rem] select-none sm:pb-36 lg:max-w-none lg:pb-36 lg:pl-10", className)}
    >
      {/* glow */}
      <div className="pointer-events-none absolute -inset-x-10 -top-10 bottom-0 -z-10" aria-hidden>
        <div className="absolute top-6 right-0 size-72 rounded-full bg-brand-500/25 blur-[90px]" />
        <div className="absolute bottom-10 left-0 size-56 rounded-full bg-gold-300/25 blur-[80px]" />
      </div>

      {/* Chat card */}
      <div className="relative ml-auto w-full rounded-[1.4rem] border border-zinc-200/80 bg-white/95 shadow-lift ring-1 ring-black/[0.02] backdrop-blur lg:max-w-[26.5rem]">
        <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3.5 sm:px-5">
          <span className="relative flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-900/30">
            <Sparkles className="size-4" />
            <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full bg-emerald-400 ring-2 ring-white" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900">Your AI assistant</p>
            <p className="text-xs text-zinc-500">Knows your preferences</p>
          </div>
          <span className="ml-auto rounded-full bg-zinc-100 px-2 py-0.5 text-[0.6875rem] font-medium text-zinc-600">Life</span>
        </div>

        <div className="space-y-3.5 px-4 py-4 sm:px-5 sm:py-5">
          <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-brand-600 px-3.5 py-2.5 text-[0.8125rem] leading-relaxed text-white shadow-sm shadow-brand-900/20">
            Plan dinners for this week — 30 minutes max, and no mushrooms please.
          </div>
          <div className="w-fit max-w-[92%] rounded-2xl rounded-bl-md bg-zinc-100/90 px-3.5 py-3 text-[0.8125rem] leading-relaxed text-zinc-700">
            <p>Here&apos;s a 5-night plan with one shared shopping list:</p>
            <ul className="mt-2 space-y-1.5">
              {MENU.map((m) => (
                <li key={m.day} className="flex items-center gap-2">
                  <span className="inline-flex w-9 shrink-0 justify-center rounded-md bg-white px-1.5 py-0.5 text-[0.6875rem] font-semibold text-brand-700 ring-1 ring-zinc-200">
                    {m.day}
                  </span>
                  <span className="truncate">{m.meal}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-zinc-500">+ 2 more nights · shopping list ready</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["Sort the list by aisle", "Make Thursday vegetarian"].map((s) => (
              <span key={s} className="rounded-full border border-brand-200 bg-brand-50/70 px-2.5 py-1 text-[0.6875rem] font-medium text-brand-700">
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-zinc-100 px-4 py-3 sm:px-5">
          <span className="flex h-10 flex-1 items-center rounded-xl bg-zinc-50 px-3 text-[0.8125rem] text-zinc-400 ring-1 ring-zinc-200">
            Ask anything…
          </span>
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
            <ArrowUp className="size-4" />
          </span>
        </div>
      </div>

      {/* Workflow card */}
      <div className="relative mt-4 w-full rounded-[1.4rem] bg-ink p-4 text-white shadow-lift ring-1 ring-white/10 sm:absolute sm:bottom-0 sm:left-0 sm:mt-0 sm:w-[18rem] sm:p-5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-gold-400/15 text-gold-300 ring-1 ring-gold-300/25">
            <Zap className="size-4" />
          </span>
          <p className="text-sm font-semibold">Lead follow-up</p>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[0.6875rem] font-medium text-emerald-300 ring-1 ring-emerald-400/20">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
            Running
          </span>
        </div>
        <ol className="relative mt-4 space-y-3">
          <span className="absolute top-3 bottom-3 left-[0.8125rem] w-px bg-gradient-to-b from-brand-400/60 via-brand-400/30 to-transparent" />
          {FLOW.map((step) => (
            <li key={step.label} className="relative flex items-center gap-3">
              <span
                className={cn(
                  "relative flex size-[1.625rem] shrink-0 items-center justify-center rounded-full ring-1",
                  step.done ? "bg-brand-600 text-white ring-brand-400/40" : "bg-ink-2 text-gold-300 ring-gold-300/40",
                )}
              >
                {step.done ? <Check className="size-3.5" /> : <step.icon className="size-3.5" />}
              </span>
              <span className={cn("text-[0.8125rem] leading-snug", step.done ? "text-zinc-300" : "font-medium text-white")}>{step.label}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Floating chip */}
      <div className="absolute right-2 bottom-8 hidden items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-lift ring-1 ring-zinc-200/80 xl:flex">
        <span className="flex size-5 items-center justify-center rounded-full bg-gold-100 text-gold-700">
          <Check className="size-3" />
        </span>
        Reply drafted in your voice
      </div>
    </div>
  );
}
