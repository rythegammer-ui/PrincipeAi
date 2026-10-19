import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, Clock, Gauge, MailCheck } from "lucide-react";
import type { Metadata } from "next";
import { coverGradient, formatDuration } from "@/components/courses/course-utils";
import { PriceTag } from "@/components/courses/price-tag";
import { CheckList } from "@/components/marketing/feature-card";
import { OfferCard } from "@/components/marketing/offer-card";
import { Accent, Section } from "@/components/marketing/section";
import { TrackedLink } from "@/components/marketing/tracked-link";
import { buttonVariants } from "@/components/ui/button";
import { listPublishedCourses, type CourseSummary } from "@/lib/courses";
import { getActiveMeetingType } from "@/lib/scheduling";
import { cn, pluralize } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Your AI Starter Kit is ready",
  robots: { index: false, follow: true },
};

const TRIPWIRE_SLUG = "ai-essentials";

/** The natural next step after the free kit: AI Essentials, else the most affordable published course. */
function pickTripwire(courses: CourseSummary[]): CourseSummary | null {
  return (
    courses.find((c) => c.slug === TRIPWIRE_SLUG) ??
    [...courses].filter((c) => c.priceCents > 0).sort((a, b) => a.priceCents - b.priceCents)[0] ??
    null
  );
}

type Search = { sent?: string | string[] };

export default async function FreeGuideThankYouPage({ searchParams }: { searchParams: Promise<Search> }) {
  const [courses, strategyCall, sp] = await Promise.all([listPublishedCourses(), getActiveMeetingType("ai-strategy-call"), searchParams]);
  const course = pickTripwire(courses);
  // The opt-in adds ?sent=0 when no link email went out (e.g. a repeat request for the same address within a day).
  const emailed = (Array.isArray(sp.sent) ? sp.sent[0] : sp.sent) !== "0";

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-zinc-200/70 bg-white">
        <div className="bg-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" aria-hidden />
        <div className="pointer-events-none absolute -top-48 left-1/2 -z-10 h-[30rem] w-[52rem] max-w-[150vw] -translate-x-1/2 rounded-full bg-brand-400/20 blur-[110px]" aria-hidden />
        <div className="container-narrow animate-fade-up py-16 text-center sm:py-24">
          <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-soft ring-1 ring-emerald-200">
            <CheckCircle2 className="size-8" aria-hidden />
          </span>
          <p className="mt-6 eyebrow">You&apos;re in</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-5xl lg:text-6xl">
            Your kit is <Accent>ready.</Accent>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-pretty text-zinc-600">
            Open it now and start with Day 1 — it only takes a few minutes. Bookmark the page so you can come back to the prompt library anytime.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <TrackedLink href="/guide" trackId="thanks_open_guide" className={buttonVariants({ size: "lg", className: "w-full sm:w-auto" })}>
              Open the Starter Kit <ArrowRight aria-hidden />
            </TrackedLink>
          </div>
          {emailed && (
            <p className="mt-6 inline-flex items-center gap-2 text-sm text-zinc-500">
              <MailCheck className="size-4 text-brand-500" aria-hidden />
              We&apos;re also sending a link to your inbox. If you don&apos;t see it, check your promotions or spam folder.
            </p>
          )}
        </div>
      </section>

      <Section tone="muted" labelledBy="next-step-heading" className="py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Your next step</p>
          <h2 id="next-step-heading" className="mt-3 text-3xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-4xl">
            Want to go from tips to <Accent>real confidence?</Accent>
          </h2>
          <p className="mt-4 text-zinc-600">The kit gets you started. These are the best ways to keep the momentum going.</p>
        </div>

        {course && (
          <article className="relative mx-auto mt-12 grid max-w-4xl overflow-hidden rounded-3xl border border-gold-300/70 bg-white shadow-lift focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <div className={cn("relative flex min-h-48 items-center justify-center overflow-hidden bg-gradient-to-br", coverGradient(course.audience))}>
              <div className="bg-grid-dark absolute inset-0 opacity-60" aria-hidden />
              <div className="absolute -top-1/3 left-1/2 size-2/3 -translate-x-1/2 rounded-full bg-white/20 blur-3xl" aria-hidden />
              <span className="relative text-7xl drop-shadow-[0_8px_24px_rgba(12,10,29,0.35)]" aria-hidden>
                {course.coverEmoji || "✨"}
              </span>
              <span className="absolute top-4 left-4 rounded-full bg-gold-400 px-3 py-1 text-xs font-semibold text-ink shadow-sm">Recommended next</span>
            </div>
            <div className="flex flex-col p-6 sm:p-8">
              <p className="eyebrow">{course.level} course</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">{course.title}</h3>
              {course.subtitle && <p className="mt-2 leading-relaxed text-zinc-600">{course.subtitle}</p>}
              {course.outcomes.length > 0 && <CheckList className="mt-5" items={course.outcomes.slice(0, 4)} />}
              <p className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="size-4 text-brand-500" aria-hidden />
                  {pluralize(course.lessonCount, "lesson")}
                </span>
                {course.totalMinutes > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-4 text-brand-500" aria-hidden />
                    {formatDuration(course.totalMinutes)}
                  </span>
                )}
              </p>
              <div className="mt-6 flex flex-col gap-4 border-t border-zinc-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <PriceTag priceCents={course.priceCents} compareAtCents={course.compareAtCents} size="lg" showSavings />
                <TrackedLink
                  href={`/courses/${course.slug}`}
                  trackId={`thanks_tripwire_${course.slug}`}
                  className={buttonVariants({ variant: "gold", size: "lg", className: "w-full after:absolute after:inset-0 after:content-[''] sm:w-auto" })}
                >
                  See the course <ArrowRight aria-hidden />
                </TrackedLink>
              </div>
            </div>
          </article>
        )}

        <div className="mx-auto mt-6 grid max-w-4xl gap-5 sm:grid-cols-2">
          <OfferCard icon={Gauge} title="Take the AI Readiness Assessment" price="Free" cta="Start" href="/assessment" trackId="thanks_assessment">
            Get your readiness score and a personalised action plan in a few minutes.
          </OfferCard>
          <OfferCard
            icon={CalendarDays}
            title={strategyCall ? `Book a ${strategyCall.name.replace(/^Free\s+/i, "free ")}` : "Book a free strategy call"}
            price="Free"
            cta="Book"
            href={strategyCall ? `/book/${strategyCall.slug}` : "/book"}
            trackId="thanks_strategy_call"
          >
            {strategyCall
              ? `A ${strategyCall.durationMin}-minute one-on-one to map where AI can help you most.`
              : "A one-on-one conversation to map where AI can help you most."}
          </OfferCard>
        </div>
      </Section>
    </>
  );
}
