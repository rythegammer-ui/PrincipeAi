import { ArrowRight, CalendarRange, Library, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Markdown } from "@/components/ui/markdown";
import { EmptyState } from "@/components/ui/misc";
import type { StarterKit } from "@/content/starter-kit";
import { pluralize } from "@/lib/utils";
import { CtaCard } from "./cta-band";
import { DayCard, LockedDays, PromptLibrary, TipsGrid } from "./guide-sections";
import { GuideViewTracker } from "./guide-view-tracker";
import { OptInForm } from "./opt-in-form";
import { Accent, Section, SectionHeading } from "./section";
import { kitStats } from "./starter-kit-utils";
import { TrackedLink } from "./tracked-link";

/**
 * The Starter Kit reader (/guide). Unlocked: intro, day-by-day plan, prompt library, tips and CTAs.
 * Locked: Day 1 as a free preview plus the opt-in form. Every content array may be empty.
 */
export function StarterKitGuide({
  kit,
  unlocked,
  greetingName,
  welcome,
}: {
  kit: StarterKit;
  unlocked: boolean;
  greetingName: string | null;
  /** Just opted in from the gate — show a confirmation banner. */
  welcome: boolean;
}) {
  const stats = kitStats(kit);
  const hasContent = stats.days > 0 || stats.prompts > 0 || stats.tips > 0;
  const [firstDay, ...otherDays] = kit.days;
  const titleWords = kit.title.trim().split(/\s+/);
  const titleLast = titleWords.pop() ?? "";
  const titleLead = titleWords.join(" ");

  const nav = [
    stats.days > 0 && { href: "#plan", label: `${stats.days}-day plan`, icon: CalendarRange },
    stats.prompts > 0 && { href: "#prompts", label: `${stats.prompts} prompts`, icon: Library },
    stats.tips > 0 && { href: "#tips", label: pluralize(stats.tips, "tip"), icon: ShieldCheck },
  ].filter((x): x is { href: string; label: string; icon: typeof Library } => Boolean(x));

  return (
    <>
      <GuideViewTracker unlocked={unlocked} />

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <div className="bg-grid-dark pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]" aria-hidden />
        <div className="pointer-events-none absolute -top-48 left-1/2 -z-10 h-[30rem] w-[52rem] max-w-[150vw] -translate-x-1/2 rounded-full bg-brand-600/40 blur-[120px]" aria-hidden />
        <div className="container-narrow animate-fade-up py-16 text-center sm:py-24">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1 text-xs font-semibold text-gold-300 ring-1 ring-white/10">
            <Sparkles className="size-3.5" aria-hidden />
            {unlocked ? (greetingName ? `Welcome, ${greetingName}` : "Your free kit") : "Free from Principe AI"}
          </p>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {titleLead} <Accent tone="gold">{titleLast}</Accent>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-zinc-300">{kit.subtitle}</p>
          {unlocked && nav.length > 0 && (
            <nav aria-label="Jump to" className="mt-9 flex flex-wrap justify-center gap-2">
              {nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/[0.08] px-4 text-sm font-medium text-white ring-1 ring-white/15 transition-colors hover:bg-white/15"
                >
                  <item.icon className="size-4 text-gold-300" aria-hidden />
                  {item.label}
                </a>
              ))}
            </nav>
          )}
          {!unlocked && (
            <a href="#unlock" className={buttonVariants({ variant: "gold", size: "lg", className: "mt-9" })}>
              <Lock aria-hidden /> Unlock the full kit — free
            </a>
          )}
        </div>
      </section>


      {!hasContent ? (
        <Section narrow>
          <EmptyState
            icon={Sparkles}
            title="The Starter Kit is getting a refresh"
            description="We're updating the plan and prompts right now. In the meantime, the free assessment will give you a personalised plan."
            action={
              <TrackedLink href="/assessment" trackId="guide_empty_assessment" className={buttonVariants()}>
                Take the free assessment <ArrowRight aria-hidden />
              </TrackedLink>
            }
          />
        </Section>
      ) : unlocked ? (
        <>
          {(welcome || kit.intro.trim()) && (
            <Section narrow className="pb-0 sm:pb-0">
              {welcome && (
                <Alert tone="success" title="You're in — the full kit is unlocked." className="mb-6">
                  We&apos;re also emailing you a link so you can come back to it anytime.
                </Alert>
              )}
              {kit.intro.trim() && (
                <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-soft sm:p-8">
                  <p className="eyebrow">Start here</p>
                  <Markdown className="mt-3">{kit.intro}</Markdown>
                </div>
              )}
            </Section>
          )}

          {stats.days > 0 && (
            <Section id="plan" labelledBy="plan-heading" containerClassName="max-w-4xl">
              <SectionHeading
                id="plan-heading"
                eyebrow="The plan"
                title={
                  <>
                    Your {stats.days}-day <Accent>quick start</Accent>
                  </>
                }
                description="One small, practical win per day. Do them in order — each day builds on the last."
              />
              <ol className="mt-12 space-y-6">
                {kit.days.map((d) => (
                  <li key={d.day}>
                    <DayCard day={d} />
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {stats.prompts > 0 && (
            <Section id="prompts" tone="muted" labelledBy="prompts-heading">
              <SectionHeading
                id="prompts-heading"
                eyebrow="Prompt library"
                title={
                  <>
                    Copy, paste, <Accent>personalise</Accent>
                  </>
                }
                description="Replace anything in [brackets] with your own details. The more context you give, the better the answer."
              />
              <div className="mt-12">
                <PromptLibrary categories={kit.promptCategories} />
              </div>
            </Section>
          )}

          {stats.tips > 0 && (
            <Section id="tips" tone="ink" labelledBy="tips-heading" className="isolate overflow-hidden">
              <div className="pointer-events-none absolute -top-40 right-0 -z-10 size-96 rounded-full bg-brand-600/30 blur-[110px]" aria-hidden />
              <SectionHeading
                id="tips-heading"
                tone="dark"
                eyebrow="Use AI well"
                title={
                  <>
                    Tips for <Accent tone="gold">safer, better</Accent> results
                  </>
                }
              />
              <div className="mx-auto mt-12 max-w-5xl">
                <TipsGrid tips={kit.tips} />
              </div>
            </Section>
          )}

          <CtaCard
            headingId="guide-next-heading"
            title={
              <>
                Ready to go <Accent tone="gold">beyond the basics?</Accent>
              </>
            }
            description="Find out exactly where AI can help you most with the free assessment — or go deeper with a short, practical course."
            actions={[
              { href: "/assessment", label: "Take the free assessment", trackId: "guide_cta_assessment" },
              { href: "/courses", label: "Browse courses", trackId: "guide_cta_courses" },
              { href: "/book", label: "Book a free call", trackId: "guide_cta_book" },
            ]}
          />
        </>
      ) : (
        <Section tone="muted" labelledBy="preview-heading" containerClassName="max-w-5xl">
          <SectionHeading
            id="preview-heading"
            eyebrow="Free preview"
            title={
              <>
                Try <Accent>Day 1</Accent> right now
              </>
            }
            description="Here's the first day of the plan. Unlock the full kit to get every day, the complete prompt library and our safety tips."
          />
          {firstDay && (
            <div className="mt-12">
              <DayCard day={firstDay} />
            </div>
          )}
          <div id="unlock" className="mt-10 grid scroll-mt-24 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Unlock everything else</h2>
              <p className="mt-2 text-zinc-600">
                {[
                  otherDays.length > 0 && `${pluralize(otherDays.length, "more day")} of the plan`,
                  stats.prompts > 0 && `${stats.prompts} copy-paste prompts`,
                  stats.tips > 0 && pluralize(stats.tips, "safety & quality tip"),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <div className="mt-6">
                <LockedDays days={otherDays} />
              </div>
            </div>
            <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-lift sm:p-8">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Get free, instant access</h2>
              <p className="mt-1 text-sm text-zinc-500">Already signed up? Open the link in your welcome email, or simply enter your details again.</p>
              <OptInForm placement="guide" submitLabel="Unlock the full kit" className="mt-6" />
            </div>
          </div>
        </Section>
      )}
    </>
  );
}
