import { ArrowRight, BookOpen, CalendarDays, Clock, Gauge, Gift, Handshake, Users, type LucideIcon } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { coverGradient, formatDuration } from "@/components/courses/course-utils";
import { PriceTag } from "@/components/courses/price-tag";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { MeetingType } from "@/db/schema";
import type { CourseSummary } from "@/lib/courses";
import { cn, formatMoney, pluralize } from "@/lib/utils";
import { CheckList } from "./feature-card";
import { OfferCard } from "./offer-card";
import { TrackedLink } from "./tracked-link";

export type LadderMeeting = Pick<MeetingType, "slug" | "name" | "description" | "durationMin" | "priceCents">;

function Step({
  n,
  label,
  title,
  description,
  icon: Icon,
  last = false,
  children,
}: {
  n: number;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <li className="relative grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-10">
      {!last && <span className="absolute top-14 -bottom-12 left-[1.375rem] hidden w-px bg-gradient-to-b from-brand-300 to-brand-100 lg:block" aria-hidden />}
      <div className="flex gap-4">
        <span className="relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-brand-700 shadow-soft ring-1 ring-brand-200">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="pt-0.5">
          <p className="text-xs font-semibold tracking-[0.14em] text-brand-600 uppercase">
            Step {n} · {label}
          </p>
          <h3 className="mt-1.5 text-xl font-semibold tracking-tight text-zinc-900">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">{description}</p>
        </div>
      </div>
      <div className="min-w-0">{children}</div>
    </li>
  );
}

function CourseTile({ course }: { course: CourseSummary }) {
  const href = `/courses/${course.slug}`;
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-soft transition-all duration-200 focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2 hover:-translate-y-0.5 hover:shadow-lift",
        course.featured ? "border-gold-300/80" : "border-zinc-200/80",
      )}
    >
      <div className={cn("relative flex h-24 items-center justify-center overflow-hidden bg-gradient-to-br", coverGradient(course.audience))}>
        <div className="bg-grid-dark absolute inset-0 opacity-60" aria-hidden />
        <span className="relative text-4xl drop-shadow-[0_6px_16px_rgba(12,10,29,0.35)]" aria-hidden>
          {course.coverEmoji || "✨"}
        </span>
        {course.featured && (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-gold-400 px-2 py-0.5 text-[0.6875rem] font-semibold text-ink shadow-sm">★ Most popular</span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h4 className="text-[0.9375rem] leading-snug font-semibold tracking-tight text-zinc-900">
          <TrackedLink href={href} trackId={`home_ladder_course_${course.slug}`} className="outline-none after:absolute after:inset-0 after:content-['']">
            {course.title}
          </TrackedLink>
        </h4>
        {course.subtitle && <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-zinc-600">{course.subtitle}</p>}
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1">
            <BookOpen className="size-3.5 text-brand-500" aria-hidden />
            {pluralize(course.lessonCount, "lesson")}
          </span>
          {course.totalMinutes > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5 text-brand-500" aria-hidden />
              {formatDuration(course.totalMinutes)}
            </span>
          )}
          <span>{course.level}</span>
        </p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <PriceTag priceCents={course.priceCents} compareAtCents={course.compareAtCents} size="sm" />
          <ArrowRight className="size-4 text-brand-600 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </div>
      </div>
    </article>
  );
}

/**
 * The value ladder on the home page, built from live data: free offers → published courses
 * (featured first, live prices) → paid 1:1 coaching (price from the meeting type) → done-with-you implementation.
 */
export function OfferLadder({
  courses,
  strategyCall,
  coaching,
  starterKitSummary,
}: {
  courses: CourseSummary[];
  strategyCall: LadderMeeting | null;
  coaching: LadderMeeting | null;
  /** e.g. "A 7-day plan and 50 copy-paste prompts" */
  starterKitSummary: string;
}) {
  const ordered = [...courses].sort((a, b) => Number(b.featured) - Number(a.featured));
  const shown = ordered.slice(0, 3);
  const steps: { key: string; node: (n: number, last: boolean) => ReactNode }[] = [];

  steps.push({
    key: "free",
    node: (n, last) => (
      <Step
        n={n}
        label="Start free"
        icon={Gift}
        last={last}
        title="Get clarity before you spend a cent"
        description="See where AI fits for you, try it with ready-made prompts, and talk it through with a real person."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <OfferCard icon={Gift} title="AI Starter Kit" price="Free" cta="Get the kit" href="/free-guide" trackId="home_ladder_free_guide">
            {starterKitSummary} — yours instantly.
          </OfferCard>
          <OfferCard icon={Gauge} title="AI Readiness Assessment" price="Free" cta="Start" href="/assessment" trackId="home_ladder_assessment">
            Your readiness score, a personalised action plan and an honest next-step recommendation.
          </OfferCard>
          <OfferCard
            icon={CalendarDays}
            title={strategyCall?.name ?? "Strategy call"}
            price={strategyCall && strategyCall.priceCents > 0 ? formatMoney(strategyCall.priceCents) : "Free"}
            cta="Book"
            href={strategyCall ? `/book/${strategyCall.slug}` : "/book"}
            trackId="home_ladder_strategy_call"
            className="sm:col-span-2 xl:col-span-1"
          >
            {strategyCall
              ? `A ${strategyCall.durationMin}-minute one-on-one to map where AI can save you the most time.`
              : "A one-on-one conversation to map where AI can save you the most time."}
          </OfferCard>
        </div>
      </Step>
    ),
  });

  if (shown.length) {
    steps.push({
      key: "courses",
      node: (n, last) => (
        <Step
          n={n}
          label="Learn"
          icon={BookOpen}
          last={last}
          title="Build real skills at your own pace"
          description="Short, practical lessons with an AI tutor beside you. Buy once, keep lifetime access."
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((c) => (
              <CourseTile key={c.id} course={c} />
            ))}
          </div>
          {ordered.length > shown.length && (
            <TrackedLink href="/courses" trackId="home_ladder_all_courses" className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
              See all {ordered.length} courses <ArrowRight className="size-4" aria-hidden />
            </TrackedLink>
          )}
        </Step>
      ),
    });
  }

  if (coaching) {
    steps.push({
      key: "coaching",
      node: (n, last) => (
        <Step
          n={n}
          label="Get coached"
          icon={Users}
          last={last}
          title="Work through your real tasks, together"
          description="When you'd rather not figure it out alone, bring your work and we'll build it with you live."
        >
          <div className="flex flex-col gap-6 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-soft sm:p-7 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-lg font-semibold tracking-tight text-zinc-900">{coaching.name}</h4>
                <Badge tone="brand">{coaching.durationMin} min</Badge>
              </div>
              {coaching.description && <p className="mt-2 text-sm leading-relaxed text-zinc-600">{coaching.description}</p>}
              <CheckList
                className="mt-4 grid gap-2.5 space-y-0 sm:grid-cols-2"
                items={["Bring your real work, not hypotheticals", "Prompts and workflows built around your tasks", "Honest advice on which tools are worth paying for", "Book one session, or come back as you grow"]}
              />
            </div>
            <div className="shrink-0 border-t border-zinc-100 pt-5 md:border-t-0 md:border-l md:pt-0 md:pl-8 md:text-right">
              <p className="text-3xl font-semibold tracking-tight text-zinc-900 tabular-nums">
                {coaching.priceCents > 0 ? formatMoney(coaching.priceCents) : "Free"}
              </p>
              <p className="text-sm text-zinc-500">per {coaching.durationMin}-minute session</p>
              <TrackedLink href={`/book/${coaching.slug}`} trackId="home_ladder_coaching" className={buttonVariants({ className: "mt-4 w-full md:w-auto" })}>
                Book a session <ArrowRight aria-hidden />
              </TrackedLink>
            </div>
          </div>
        </Step>
      ),
    });
  }

  steps.push({
    key: "implementation",
    node: (n, last) => (
      <Step
        n={n}
        label="Done with you"
        icon={Handshake}
        last={last}
        title="Have the AI systems built for you"
        description="For businesses that want results without the learning curve: we design, build and hand over working AI systems."
      >
        <div className="relative isolate overflow-hidden rounded-2xl bg-ink p-6 text-white shadow-lift sm:p-8">
          <div className="pointer-events-none absolute -top-24 -right-16 -z-10 size-72 rounded-full bg-brand-600/40 blur-[90px]" aria-hidden />
          <div className="bg-grid-dark pointer-events-none absolute inset-0 -z-10 opacity-70" aria-hidden />
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-semibold tracking-[0.14em] text-gold-300 uppercase">Done-with-you</p>
              <h4 className="mt-2 text-xl font-semibold tracking-tight">AI Implementation</h4>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                AI assistants, workflow automations, content systems and team training — scoped to your business, built with your team, and supported after launch.
              </p>
            </div>
            <div className="shrink-0 md:text-right">
              <p className="text-2xl font-semibold tracking-tight">Custom quote</p>
              <p className="text-sm text-zinc-400">after a free discovery call</p>
              <TrackedLink href="/consulting" trackId="home_ladder_implementation" className={buttonVariants({ variant: "gold", className: "mt-4 w-full md:w-auto" })}>
                Explore implementation <ArrowRight aria-hidden />
              </TrackedLink>
            </div>
          </div>
        </div>
      </Step>
    ),
  });

  return (
    <ol className="flex flex-col gap-12">
      {steps.map((s, i) => (
        <Fragment key={s.key}>{s.node(i + 1, i === steps.length - 1)}</Fragment>
      ))}
    </ol>
  );
}
