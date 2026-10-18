import { ArrowRight, Bot, Clock, Infinity as InfinityIcon, ListChecks } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CourseCard } from "@/components/courses/course-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { listPublishedCourses } from "@/lib/courses";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "AI Courses",
  description:
    "Practical, plain-English AI courses for everyday life and for business. Short lessons, real examples, and an AI tutor inside every lesson.",
  openGraph: {
    title: "AI Courses · Principe AI",
    description: "Practical, plain-English AI courses for everyday life and for business.",
  },
};

const FILTERS = [
  { key: "all", label: "All courses" },
  { key: "life", label: "For life" },
  { key: "business", label: "For business" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

const FEATURES = [
  { icon: ListChecks, title: "Short, practical lessons", body: "Every lesson ends with something you can use the same day — no theory for its own sake." },
  { icon: Bot, title: "An AI tutor in every lesson", body: "Stuck, or want to apply it to your own situation? Ask the built-in tutor right next to the lesson." },
  { icon: Clock, title: "Learn at your own pace", body: "Watch, read and practise when it suits you. Your progress is saved automatically." },
  { icon: InfinityIcon, title: "Lifetime access", body: "Buy once and keep access, including updates as the tools and best practices evolve." },
];

export default async function CoursesPage({ searchParams }: { searchParams: Promise<{ for?: string }> }) {
  const { for: forParam } = await searchParams;
  const filter: FilterKey = forParam === "life" || forParam === "business" ? forParam : "all";
  const courses = await listPublishedCourses();
  const visible = filter === "all" ? courses : courses.filter((c) => c.audience === filter || c.audience === "both");

  return (
    <>
      <section className="relative overflow-hidden border-b border-zinc-200/70 bg-white">
        <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" aria-hidden />
        <div className="glow-brand pointer-events-none absolute inset-x-0 top-0 h-80" aria-hidden />
        <div className="container-page relative py-16 text-center sm:py-24">
          <p className="eyebrow">Courses</p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-5xl lg:text-6xl">
            Practical AI skills, <span className="font-display font-normal text-brand-700 italic">taught in plain English</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-pretty text-zinc-600 sm:text-lg">
            Whether you want AI to lighten your everyday load or to transform how your business runs, there&apos;s a course built for
            exactly where you are — no coding and no jargon required.
          </p>
        </div>
      </section>

      <section className="bg-zinc-50 py-12 sm:py-16" aria-labelledby="catalog-heading">
        <div className="container-page">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <h2 id="catalog-heading" className="text-xl font-semibold tracking-tight text-zinc-900">
              {filter === "all" ? "All courses" : filter === "life" ? "Courses for everyday life" : "Courses for business"}
            </h2>
            <nav aria-label="Filter courses" className="-mx-1 flex max-w-full gap-1 overflow-x-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-xs">
              {FILTERS.map((f) => {
                const active = f.key === filter;
                return (
                  <Link
                    key={f.key}
                    href={f.key === "all" ? "/courses" : `/courses?for=${f.key}`}
                    scroll={false}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-10 items-center rounded-lg px-3.5 text-sm font-medium whitespace-nowrap transition-colors",
                      active ? "bg-brand-600 text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                    )}
                  >
                    {f.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {visible.length ? (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-8 bg-white"
              title="New courses are on the way"
              description="We're putting the finishing touches on courses for this track. In the meantime, the free assessment will point you to the best next step."
              action={
                <ButtonLink href="/assessment" variant="outline">
                  Take the free assessment
                </ButtonLink>
              }
            />
          )}
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20" aria-labelledby="how-heading">
        <div className="container-page">
          <h2 id="how-heading" className="sr-only">
            How our courses work
          </h2>
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <li key={f.title} className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-soft">
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <f.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold text-zinc-900">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{f.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="relative overflow-hidden bg-ink py-20 text-white sm:py-24">
        <div className="bg-grid-dark pointer-events-none absolute inset-0" aria-hidden />
        <div className="glow-brand pointer-events-none absolute inset-0" aria-hidden />
        <div className="container-narrow relative text-center">
          <p className="text-xs font-semibold tracking-[0.14em] text-gold-300 uppercase">Not sure where to start?</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Find your best first step in <span className="font-display font-normal text-gold-300 italic">three minutes</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-300">
            Take the free AI Readiness Assessment and get a personalised plan — including which course (if any) is the right fit for you.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/assessment" variant="gold" size="lg" className="w-full sm:w-auto">
              Take the free assessment <ArrowRight aria-hidden />
            </ButtonLink>
            <ButtonLink href="/book" variant="ghost" size="lg" className="w-full text-white hover:bg-white/10 hover:text-white sm:w-auto">
              Or book a free strategy call
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
