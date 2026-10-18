import { ArrowLeft, ArrowRight, ChevronRight, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatDuration } from "@/components/courses/course-utils";
import { LessonVideo } from "@/components/courses/lesson-video";
import { AiTutor } from "@/components/learn/ai-tutor";
import { CourseCompleteCard } from "@/components/learn/course-complete-card";
import { CurriculumSidebar } from "@/components/learn/curriculum-sidebar";
import { LessonCompleteForm } from "@/components/learn/lesson-complete-form";
import { Markdown } from "@/components/ui/markdown";
import { requireStudent } from "@/lib/auth";
import { courseProgress, getCourseWithCurriculum, getLesson, isEnrolled } from "@/lib/courses";

type Params = { courseSlug: string; lessonSlug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { courseSlug, lessonSlug } = await params;
  const data = await getCourseWithCurriculum(courseSlug, { includeUnpublished: true });
  const lesson = data?.lessons.find((l) => l.slug === lessonSlug);
  return { title: lesson && data ? `${lesson.title} — ${data.course.title}` : "Lesson" };
}

export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { courseSlug, lessonSlug } = await params;
  const student = await requireStudent(`/learn/${courseSlug}/${lessonSlug}`);
  const data = await getCourseWithCurriculum(courseSlug, { includeUnpublished: true });
  if (!data) notFound();
  const { course, modules, lessons } = data;
  if (!(await isEnrolled(student.id, course.id))) {
    if (course.published) redirect(`/courses/${course.slug}`);
    notFound();
  }
  const lesson = await getLesson(course.id, lessonSlug);
  if (!lesson) notFound();

  const progress = await courseProgress(student.id, course.id, lessons);
  const idx = lessons.findIndex((l) => l.id === lesson.id);
  const prev = idx > 0 ? lessons[idx - 1] : null;
  const next = idx >= 0 && idx < lessons.length - 1 ? lessons[idx + 1] : null;
  const currentModule = modules.find((m) => m.id === lesson.moduleId);
  const completed = progress.completedLessonIds.includes(lesson.id);
  const courseDone = progress.total > 0 && progress.completed === progress.total;

  return (
    <div className="mx-auto w-full max-w-7xl lg:grid lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="border-b border-zinc-200 lg:sticky lg:top-16 lg:h-[calc(100dvh-4rem)] lg:overflow-y-auto lg:border-r lg:border-b-0">
        <CurriculumSidebar
          courseSlug={course.slug}
          courseTitle={course.title}
          modules={modules}
          progress={progress}
          currentLessonId={lesson.id}
        />
      </aside>

      <div className="min-w-0 px-4 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div className="mx-auto max-w-3xl">
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm text-zinc-500">
            <Link href="/learn" className="shrink-0 hover:text-zinc-900">
              My courses
            </Link>
            <ChevronRight className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{course.title}</span>
          </nav>

          <header className="mt-6">
            {currentModule && (
              <p className="eyebrow">
                Module {modules.indexOf(currentModule) + 1} · {currentModule.title}
              </p>
            )}
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-4xl">{lesson.title}</h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
              <span>
                Lesson {idx + 1} of {lessons.length}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-4" aria-hidden /> {formatDuration(lesson.durationMin)}
              </span>
            </p>
            {lesson.summary && <p className="mt-4 text-lg leading-relaxed text-zinc-600">{lesson.summary}</p>}
          </header>

          <LessonVideo url={lesson.videoUrl} title={lesson.title} className="mt-8" />

          <div className="mt-8 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-soft sm:p-8">
            {lesson.content.trim() ? (
              <Markdown className="[&>:first-child]:mt-0">{lesson.content}</Markdown>
            ) : (
              <p className="text-zinc-500">The written notes for this lesson are coming soon.</p>
            )}
          </div>

          <div className="mt-8">
            <LessonCompleteForm lessonId={lesson.id} completed={completed} hasNext={Boolean(next)} />
          </div>

          {courseDone && (
            <div className="mt-8">
              <CourseCompleteCard courseSlug={course.slug} courseTitle={course.title} />
            </div>
          )}

          <nav aria-label="Lesson navigation" className="mt-8 grid grid-cols-1 gap-3 border-t border-zinc-200 pt-6 sm:grid-cols-2">
            {prev ? (
              <Link
                href={`/learn/${course.slug}/${prev.slug}`}
                className="group flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-soft transition-colors hover:border-brand-300"
              >
                <ArrowLeft className="size-4 shrink-0 text-zinc-400 group-hover:text-brand-600" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-xs text-zinc-500">Previous</span>
                  <span className="block truncate text-sm font-medium text-zinc-900">{prev.title}</span>
                </span>
              </Link>
            ) : (
              <span className="hidden sm:block" />
            )}
            {next && (
              <Link
                href={`/learn/${course.slug}/${next.slug}`}
                className="group flex items-center justify-end gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-right shadow-soft transition-colors hover:border-brand-300"
              >
                <span className="min-w-0">
                  <span className="block text-xs text-zinc-500">Next</span>
                  <span className="block truncate text-sm font-medium text-zinc-900">{next.title}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-zinc-400 group-hover:text-brand-600" aria-hidden />
              </Link>
            )}
          </nav>

          <section aria-label="AI tutor" className="mt-10">
            <AiTutor courseSlug={course.slug} lessonId={lesson.id} lessonTitle={lesson.title} />
          </section>
        </div>
      </div>
    </div>
  );
}
