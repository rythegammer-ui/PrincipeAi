import { ArrowRight, BarChart3, Bot, BookOpen, CheckCircle2, ChevronRight, Clock, Compass, Layers, PlayCircle, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyBox } from "@/components/courses/buy-box";
import { CourseCover } from "@/components/courses/course-cover";
import { AUDIENCE_LABELS, asAudience, formatDuration, whoItsFor } from "@/components/courses/course-utils";
import { CurriculumAccordion } from "@/components/courses/curriculum-accordion";
import { FaqList } from "@/components/courses/faq-list";
import { PriceTag } from "@/components/courses/price-tag";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Markdown } from "@/components/ui/markdown";
import { getAdminSession, getStudent } from "@/lib/auth";
import { getCourseWithCurriculum, isEnrolled } from "@/lib/courses";
import { checkoutMode } from "@/lib/payments";
import { shareMetadata } from "@/lib/seo";
import { pluralize, truncate } from "@/lib/utils";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCourseWithCurriculum(slug);
  if (!data) return { title: "Course not found" };
  const { course } = data;
  const description = truncate(course.subtitle || course.description.replace(/[#*_>`[\]()]/g, ""), 160);
  return {
    title: course.title,
    description,
    alternates: { canonical: `/courses/${course.slug}` },
    // Courses have no cover image of their own (just an emoji), so they share the site image.
    ...shareMetadata({ title: course.title, description, url: `/courses/${course.slug}` }),
  };
}

export default async function CourseSalesPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ checkout?: string }>;
}) {
  const [{ slug }, { checkout }] = await Promise.all([params, searchParams]);
  // Admins can preview draft courses before publishing them.
  const isAdmin = Boolean(await getAdminSession());
  const data = await getCourseWithCurriculum(slug, { includeUnpublished: isAdmin });
  if (!data) notFound();
  const { course, modules, lessons, lessonCount, totalMinutes } = data;

  const student = await getStudent();
  const owned = student ? await isEnrolled(student.id, course.id) : false;
  const mode = checkoutMode();
  const preview = lessons.find((l) => l.isPreview);
  const audience = asAudience(course.audience);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="bg-grid-dark pointer-events-none absolute inset-0" aria-hidden />
        <div className="glow-brand pointer-events-none absolute inset-0" aria-hidden />
        <div className="container-page relative grid grid-cols-1 items-center gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_340px] lg:py-20">
          <div className="animate-fade-up min-w-0">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-zinc-400">
              <Link href="/courses" className="hover:text-white">
                Courses
              </Link>
              <ChevronRight className="size-3.5" aria-hidden />
              <span className="truncate text-zinc-300" aria-current="page">
                {course.title}
              </span>
            </nav>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-zinc-200 ring-1 ring-white/15 ring-inset">
                {AUDIENCE_LABELS[audience]}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-zinc-200 ring-1 ring-white/15 ring-inset">{course.level}</span>
              {course.featured && <span className="rounded-full bg-gold-400 px-3 py-1 text-xs font-semibold text-ink">★ Recommended</span>}
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-balance sm:text-5xl">{course.title}</h1>
            {course.subtitle && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-pretty text-zinc-300">{course.subtitle}</p>}
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-300" aria-label="Course details">
              <li className="inline-flex items-center gap-1.5">
                <Layers className="size-4 text-gold-300" aria-hidden />
                {pluralize(modules.length, "module")}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <BookOpen className="size-4 text-gold-300" aria-hidden />
                {pluralize(lessonCount, "lesson")}
              </li>
              {totalMinutes > 0 && (
                <li className="inline-flex items-center gap-1.5">
                  <Clock className="size-4 text-gold-300" aria-hidden />
                  {formatDuration(totalMinutes)}
                </li>
              )}
              <li className="inline-flex items-center gap-1.5">
                <Bot className="size-4 text-gold-300" aria-hidden />
                AI tutor included
              </li>
            </ul>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              {owned ? (
                <ButtonLink href={`/learn/${course.slug}`} variant="gold" size="lg">
                  Go to course <ArrowRight aria-hidden />
                </ButtonLink>
              ) : (
                <>
                  <ButtonLink href="#enroll" variant="gold" size="lg">
                    Enroll now <ArrowRight aria-hidden />
                  </ButtonLink>
                  <PriceTag priceCents={course.priceCents} compareAtCents={course.compareAtCents} tone="dark" showSavings />
                </>
              )}
            </div>
            {preview && !owned && (
              <Link
                href={`/courses/${course.slug}/preview/${preview.slug}`}
                className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-zinc-200 underline-offset-4 hover:text-white hover:underline"
              >
                <PlayCircle className="size-4 text-gold-300" aria-hidden />
                Try a free lesson first: {preview.title}
              </Link>
            )}
          </div>
          <CourseCover
            emoji={course.coverEmoji}
            audience={course.audience}
            size="lg"
            className="hidden aspect-square rounded-3xl shadow-lift ring-1 ring-white/10 lg:block"
          />
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="container-page">
          {!course.published && (
            <Alert tone="warning" title="Draft preview — only admins can see this page" className="mb-8">
              Publish the course from the admin panel to open it for enrollment.
            </Alert>
          )}
          {checkout === "cancelled" && !owned && (
            <Alert tone="info" title="Checkout cancelled — you haven't been charged" className="mb-8">
              Your spot isn&apos;t going anywhere. When you&apos;re ready, you can enroll below, or book a free call if you have questions first.
            </Alert>
          )}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14">
            <aside className="min-w-0 lg:order-last" aria-label="Enroll">
              <div className="lg:sticky lg:top-24">
                <BuyBox
                  course={course}
                  lessonCount={lessonCount}
                  totalMinutes={totalMinutes}
                  owned={owned}
                  mode={mode}
                  defaultEmail={student?.email}
                  defaultName={student?.name ?? undefined}
                />
              </div>
            </aside>

            <div className="flex min-w-0 flex-col gap-16">
              {course.outcomes.length > 0 && (
                <section aria-labelledby="outcomes-heading">
                  <p className="eyebrow">Outcomes</p>
                  <h2 id="outcomes-heading" className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
                    What you&apos;ll be able to do
                  </h2>
                  <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {course.outcomes.map((o) => (
                      <li key={o} className="flex gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 text-sm leading-relaxed text-zinc-800">
                        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
                        {o}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {course.description && (
                <section aria-labelledby="about-heading">
                  <p className="eyebrow">About this course</p>
                  <h2 id="about-heading" className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
                    Why this course
                  </h2>
                  <Markdown className="mt-5">{course.description}</Markdown>
                </section>
              )}

              <section aria-labelledby="curriculum-heading">
                <p className="eyebrow">Curriculum</p>
                <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <h2 id="curriculum-heading" className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
                    What&apos;s inside
                  </h2>
                  <p className="text-sm text-zinc-500">
                    {pluralize(modules.length, "module")} · {pluralize(lessonCount, "lesson")}
                    {totalMinutes > 0 && ` · ${formatDuration(totalMinutes)}`}
                  </p>
                </div>
                <div className="mt-6">
                  <CurriculumAccordion courseSlug={course.slug} modules={modules} />
                </div>
              </section>

              <section aria-labelledby="who-heading">
                <p className="eyebrow">Who it&apos;s for</p>
                <h2 id="who-heading" className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
                  Built for people like you
                </h2>
                <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {whoItsFor(course.audience).map((w) => (
                    <li key={w.title} className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-soft">
                      <Users className="size-5 text-brand-600" aria-hidden />
                      <h3 className="mt-3 font-semibold text-zinc-900">{w.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{w.body}</p>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 flex items-start gap-2 text-sm text-zinc-500">
                  <BarChart3 className="mt-0.5 size-4 shrink-0 text-zinc-400" aria-hidden />
                  Level: {course.level}. No coding or technical background needed.
                </p>
              </section>

              {course.faqs.length > 0 && (
                <section aria-labelledby="faq-heading">
                  <p className="eyebrow">FAQ</p>
                  <h2 id="faq-heading" className="mt-2 mb-6 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
                    Questions, answered
                  </h2>
                  <FaqList faqs={course.faqs} />
                </section>
              )}

              <section
                aria-labelledby="unsure-heading"
                className="relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-gold-50 p-6 sm:p-8"
              >
                <Compass className="size-6 text-brand-600" aria-hidden />
                <h2 id="unsure-heading" className="mt-3 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
                  Not sure this is the right fit?
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600">
                  Take the free 3-minute AI Readiness Assessment for a personalised recommendation, or book a free strategy call and we&apos;ll
                  help you choose — even if the answer is a different course.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <ButtonLink href="/assessment" variant="primary">
                    Take the free assessment
                  </ButtonLink>
                  <ButtonLink href="/book" variant="outline">
                    Book a free call
                  </ButtonLink>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>

      {!owned && (
        <section className="relative overflow-hidden bg-ink py-16 text-white sm:py-20">
          <div className="bg-grid-dark pointer-events-none absolute inset-0" aria-hidden />
          <div className="container-narrow relative text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
              Ready to put AI to work <span className="font-display font-normal text-gold-300 italic">for you</span>?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-zinc-300">
              Start {course.title} today. Lifetime access, at your own pace, with an AI tutor beside every lesson.
            </p>
            <ButtonLink href="#enroll" variant="gold" size="lg" className="mt-8">
              Enroll now <ArrowRight aria-hidden />
            </ButtonLink>
          </div>
        </section>
      )}
    </>
  );
}
