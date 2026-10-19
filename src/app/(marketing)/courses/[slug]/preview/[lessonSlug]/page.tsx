import { ArrowLeft, ArrowRight, Check, ChevronRight, Clock, Eye } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatDuration } from "@/components/courses/course-utils";
import { LessonVideo } from "@/components/courses/lesson-video";
import { PriceTag } from "@/components/courses/price-tag";
import { ButtonLink } from "@/components/ui/button";
import { Markdown } from "@/components/ui/markdown";
import { getStudent } from "@/lib/auth";
import { getCourseWithCurriculum, getLesson, isEnrolled } from "@/lib/courses";
import { pluralize, truncate } from "@/lib/utils";

type Params = { slug: string; lessonSlug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug, lessonSlug } = await params;
  const data = await getCourseWithCurriculum(slug);
  const lesson = data?.lessons.find((l) => l.slug === lessonSlug && l.isPreview);
  if (!data || !lesson) return { title: "Lesson not found" };
  return {
    title: `${lesson.title} (free lesson) — ${data.course.title}`,
    description: truncate(lesson.summary || data.course.subtitle, 160),
    alternates: { canonical: `/courses/${slug}/preview/${lessonSlug}` },
  };
}

export default async function PreviewLessonPage({ params }: { params: Promise<Params> }) {
  const { slug, lessonSlug } = await params;
  const data = await getCourseWithCurriculum(slug);
  if (!data) notFound();
  const { course, lessons, lessonCount, totalMinutes } = data;
  const lesson = await getLesson(course.id, lessonSlug);
  if (!lesson) notFound();
  if (!lesson.isPreview) redirect(`/courses/${course.slug}`);

  const student = await getStudent();
  const owned = student ? await isEnrolled(student.id, course.id) : false;
  const otherPreviews = lessons.filter((l) => l.isPreview && l.id !== lesson.id);
  const remaining = Math.max(0, lessonCount - 1);

  return (
    <article className="bg-white">
      <div className="border-b border-zinc-200/70 bg-zinc-50">
        <div className="container-narrow py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm text-zinc-500">
            <Link href="/courses" className="hover:text-zinc-900">
              Courses
            </Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <Link href={`/courses/${course.slug}`} className="truncate hover:text-zinc-900">
              {course.title}
            </Link>
          </nav>
          <p className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 ring-inset">
            <Eye className="size-3.5" aria-hidden /> Free preview lesson
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-4xl">{lesson.title}</h1>
          {lesson.summary && <p className="mt-3 text-lg leading-relaxed text-zinc-600">{lesson.summary}</p>}
          <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-zinc-500">
            <Clock className="size-4" aria-hidden /> {formatDuration(lesson.durationMin)}
          </p>
        </div>
      </div>

      <div className="container-narrow py-10 sm:py-14">
        <LessonVideo url={lesson.videoUrl} title={lesson.title} className="mb-10" />
        {lesson.content.trim() ? (
          <Markdown className="[&>:first-child]:mt-0">{lesson.content}</Markdown>
        ) : (
          <p className="text-zinc-500">This lesson&apos;s written notes are coming soon.</p>
        )}

        <aside aria-labelledby="upgrade-heading" className="relative mt-14 overflow-hidden rounded-2xl bg-ink p-6 text-white shadow-lift sm:p-10">
          <div className="bg-grid-dark pointer-events-none absolute inset-0" aria-hidden />
          <div className="glow-brand pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative">
            {owned ? (
              <>
                <h2 id="upgrade-heading" className="text-2xl font-semibold tracking-tight">
                  You already own this course
                </h2>
                <p className="mt-2 text-zinc-300">Continue in your student portal, where your progress and the AI tutor live.</p>
                <ButtonLink href={`/learn/${course.slug}/${lesson.slug}`} variant="gold" size="lg" className="mt-6">
                  Open in my course <ArrowRight aria-hidden />
                </ButtonLink>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold tracking-[0.14em] text-gold-300 uppercase">Enjoyed this lesson?</p>
                <h2 id="upgrade-heading" className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                  Get the full course: {course.title}
                </h2>
                <ul className="mt-5 grid grid-cols-1 gap-2 text-sm text-zinc-300 sm:grid-cols-2">
                  <li className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-gold-300" aria-hidden />
                    {pluralize(remaining, "more lesson")}
                    {totalMinutes > lesson.durationMin && ` (${formatDuration(totalMinutes - lesson.durationMin)})`}
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-gold-300" aria-hidden />
                    An AI tutor inside every lesson
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-gold-300" aria-hidden />
                    Progress tracking & lifetime access
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-gold-300" aria-hidden />
                    Learn at your own pace
                  </li>
                </ul>
                <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <ButtonLink href={`/courses/${course.slug}#enroll`} variant="gold" size="lg">
                    Enroll now <ArrowRight aria-hidden />
                  </ButtonLink>
                  <PriceTag priceCents={course.priceCents} compareAtCents={course.compareAtCents} tone="dark" showSavings />
                </div>
              </>
            )}
          </div>
        </aside>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href={`/courses/${course.slug}`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
            <ArrowLeft className="size-4" aria-hidden /> Back to course overview
          </Link>
          {otherPreviews.length > 0 && (
            <Link
              href={`/courses/${course.slug}/preview/${otherPreviews[0].slug}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
            >
              Another free lesson: {otherPreviews[0].title} <ArrowRight className="size-4" aria-hidden />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
