import { Lightbulb, Lock, ShieldCheck } from "lucide-react";
import type { StarterKit } from "@/content/starter-kit";
import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";
import { categoryAnchor } from "./starter-kit-utils";

type Day = StarterKit["days"][number];
type Category = StarterKit["promptCategories"][number];

/** A prompt in a dark "code" panel with a copy button. */
export function PromptBlock({ title, prompt, className }: { title: string; prompt: string; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl bg-ink ring-1 ring-ink", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2">
        <p className="text-[0.6875rem] font-semibold tracking-[0.12em] text-gold-300 uppercase">Prompt</p>
        <CopyButton text={prompt} tone="dark" srLabel={`Copy prompt: ${title}`} />
      </div>
      <p className="px-4 py-4 font-mono text-[0.8125rem] leading-relaxed break-words whitespace-pre-line text-zinc-100">{prompt}</p>
    </div>
  );
}

/** One day of the quick-start plan. */
export function DayCard({ day }: { day: Day }) {
  return (
    <article id={`day-${day.day}`} className="scroll-mt-24 rounded-2xl border border-zinc-200/80 bg-white shadow-soft">
      <div className="grid gap-5 p-6 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-6 sm:p-8">
        <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-1">
          <span className="text-xs font-semibold tracking-[0.14em] text-brand-600 uppercase">Day</span>
          <span className="bg-gradient-to-br from-brand-500 to-brand-800 bg-clip-text text-4xl leading-none font-semibold tracking-tight text-transparent tabular-nums sm:text-5xl">{day.day}</span>
        </div>
        <div className="min-w-0">
          <h3 className="text-xl font-semibold tracking-tight text-zinc-900">{day.title}</h3>
          {day.goal && (
            <p className="mt-2 text-zinc-600">
              <span className="font-medium text-zinc-800">Goal: </span>
              {day.goal}
            </p>
          )}
          {day.steps.length > 0 && (
            <ol className="mt-5 space-y-3">
              {day.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-[0.9375rem] leading-relaxed text-zinc-700">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">
                    {i + 1}
                  </span>
                  <span className="min-w-0">{step}</span>
                </li>
              ))}
            </ol>
          )}
          {day.prompt && <PromptBlock title={`Day ${day.day}: ${day.title}`} prompt={day.prompt} className="mt-6" />}
        </div>
      </div>
    </article>
  );
}

/** Day cards that are visible but locked (titles only). */
export function LockedDays({ days }: { days: Day[] }) {
  if (!days.length) return null;
  return (
    // grid-cols-1 (minmax(0,1fr)) rather than an implicit auto track, so the nowrap titles truncate instead of widening the page.
    <ul className="grid grid-cols-1 gap-2.5">
      {days.map((d) => (
        <li key={d.day} className="flex items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-white/70 px-4 py-3 text-sm">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 font-semibold text-zinc-500 tabular-nums">{d.day}</span>
          <span className="min-w-0 flex-1 truncate font-medium text-zinc-700">{d.title}</span>
          <Lock className="size-4 shrink-0 text-zinc-400" aria-hidden />
          <span className="sr-only">(locked)</span>
        </li>
      ))}
    </ul>
  );
}

/** Prompt library grouped by category, with jump links. */
export function PromptLibrary({ categories }: { categories: Category[] }) {
  const withPrompts = categories.filter((c) => c.prompts.length);
  if (!withPrompts.length) return null;
  return (
    <div>
      <nav aria-label="Prompt categories" className="flex flex-wrap gap-2">
        {withPrompts.map((c, i) => (
          <a
            key={c.category}
            href={`#${categoryAnchor(c.category, i)}`}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-white px-3.5 text-sm font-medium text-zinc-700 shadow-xs ring-1 ring-zinc-200 transition-colors hover:bg-brand-50 hover:text-brand-800 hover:ring-brand-200"
          >
            {c.category}
            <span className="text-xs text-zinc-400 tabular-nums">{c.prompts.length}</span>
          </a>
        ))}
      </nav>
      <div className="mt-12 space-y-14">
        {withPrompts.map((c, i) => (
          <section key={c.category} id={categoryAnchor(c.category, i)} aria-labelledby={`${categoryAnchor(c.category, i)}-heading`} className="scroll-mt-24">
            <div className="flex flex-col gap-1 border-b border-zinc-200 pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
              <div>
                <h3 id={`${categoryAnchor(c.category, i)}-heading`} className="text-xl font-semibold tracking-tight text-zinc-900">
                  {c.category}
                </h3>
                {c.description && <p className="mt-1 text-sm text-zinc-600">{c.description}</p>}
              </div>
              <p className="shrink-0 text-xs font-medium text-zinc-500">
                {c.prompts.length} {c.prompts.length === 1 ? "prompt" : "prompts"}
              </p>
            </div>
            <ul className="mt-6 grid gap-4 md:grid-cols-2">
              {c.prompts.map((p) => (
                <li key={p.title} className="flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-soft">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="pt-1.5 font-semibold text-zinc-900">{p.title}</h4>
                    <CopyButton text={p.prompt} srLabel={`Copy prompt: ${p.title}`} />
                  </div>
                  <p className="mt-3 flex-1 rounded-xl bg-zinc-50 p-3.5 font-mono text-[0.8125rem] leading-relaxed break-words whitespace-pre-line text-zinc-700 ring-1 ring-zinc-100">
                    {p.prompt}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

/** Numbered best-practice / safety tips. */
export function TipsGrid({ tips }: { tips: string[] }) {
  if (!tips.length) return null;
  return (
    <ol className="grid gap-4 sm:grid-cols-2">
      {tips.map((tip, i) => {
        const Icon = i % 2 === 0 ? ShieldCheck : Lightbulb;
        return (
          <li key={i} className="flex gap-4 rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gold-400/10 text-gold-300 ring-1 ring-gold-300/20">
              <Icon className="size-4" aria-hidden />
            </span>
            <p className="text-[0.9375rem] leading-relaxed text-zinc-200">{tip}</p>
          </li>
        );
      })}
    </ol>
  );
}
