import { ArrowRight, Award, BookOpen, CalendarClock, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CourseCard } from "@/components/courses/course-card";
import { CourseCover } from "@/components/courses/course-cover";
import { formatDuration } from "@/components/courses/course-utils";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Progress } from "@/components/ui/misc";
import { requireStudent } from "@/lib/auth";
import { getStudentCourses, recommendedCoursesFor, type StudentCourse } from "@/lib/courses";
import { firstName, pluralize } from "@/lib/utils";

export const metadata: Metadata = { title: "My courses" };

function EnrolledCourse({ item }: { item: StudentCourse }) {
  const { course, progress, continueLesson, totalMinutes } = item;
  const finished = progress.total > 0 && progress.completed === progress.total;
  const started = progress.completed > 0;
  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-soft sm:flex-row">
      <CourseCover emoji={course.coverEmoji} audience={course.audience} className="aspect-[16/7] sm:aspect-auto sm:w-48 sm:shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-lg leading-snug font-semibold tracking-tight text-zinc-900">
              <Link href={`/learn/${course.slug}`} className="hover:text-brand-700">
                {course.title}
              </Link>
            </h3>
            <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1">
                <BookOpen className="size-3.5" aria-hidden /> {pluralize(progress.total, "lesson")}
              </span>
              {totalMinutes > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" aria-hidden /> {formatDuration(totalMinutes)}
                </span>
              )}
            </p>
          </div>
          {finished ? <Badge tone="green">Completed</Badge> : started ? <Badge tone="brand">In progress</Badge> : <Badge>Not started</Badge>}
        </div>
        <div>
          <Progress value={progress.percent} />
          <p className="mt-2 text-xs text-zinc-500">
            {progress.completed} of {pluralize(progress.total, "lesson")} complete · {progress.percent}%
          </p>
        </div>
        <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {continueLesson ? (
            <p className="min-w-0 truncate text-sm text-zinc-600">
              {finished ? "Revisit: " : started ? "Up next: " : "Start with: "}
              <span className="font-medium text-zinc-900">{continueLesson.title}</span>
            </p>
          ) : (
            <p className="text-sm text-zinc-500">Lessons are being added — check back soon.</p>
          )}
          <div className="flex shrink-0 flex-wrap gap-2">
            {finished && (
              <ButtonLink href={`/learn/${course.slug}/certificate`} variant="outline" size="sm">
                <Award aria-hidden /> Certificate
              </ButtonLink>
            )}
            {continueLesson && (
              <ButtonLink href={`/learn/${course.slug}/${continueLesson.slug}`} size="sm" variant={finished ? "secondary" : "primary"}>
                {finished ? "Review course" : started ? "Continue" : "Start course"} <ArrowRight aria-hidden />
              </ButtonLink>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

export default async function LearnDashboardPage() {
  const student = await requireStudent("/learn");
  const [courses, recommended] = await Promise.all([getStudentCourses(student.id), recommendedCoursesFor(student)]);
  const inProgress = courses.find((c) => c.progress.completed > 0 && c.progress.completed < c.progress.total);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Student portal</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Welcome back, <span className="font-display font-normal text-brand-700 italic">{firstName(student.name, student.email)}</span>
          </h1>
          <p className="mt-2 text-zinc-600">
            {courses.length
              ? inProgress
                ? `Pick up where you left off in ${inProgress.course.title}.`
                : "Everything you've enrolled in lives here. Learn at your own pace."
              : "Your courses will appear here as soon as you enroll."}
          </p>
        </div>
        {inProgress?.continueLesson && (
          <ButtonLink href={`/learn/${inProgress.course.slug}/${inProgress.continueLesson.slug}`} size="lg">
            Continue learning <ArrowRight aria-hidden />
          </ButtonLink>
        )}
      </div>

      <section aria-labelledby="my-courses" className="mt-10">
        <h2 id="my-courses" className="text-lg font-semibold tracking-tight text-zinc-900">
          My courses
        </h2>
        {courses.length ? (
          <ul className="mt-4 grid grid-cols-1 gap-5">
            {courses.map((item) => (
              <EnrolledCourse key={item.course.id} item={item} />
            ))}
          </ul>
        ) : (
          <EmptyState
            className="mt-4 bg-white"
            icon={BookOpen}
            title="You're not enrolled in any courses yet"
            description={`Signed in as ${student.email}. If you bought a course with a different email, sign out and sign in with that one.`}
            action={<ButtonLink href="/courses">Browse courses</ButtonLink>}
          />
        )}
      </section>

      {recommended.length > 0 && (
        <section aria-labelledby="recommended" className="mt-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="recommended" className="text-lg font-semibold tracking-tight text-zinc-900">
                Recommended for you
              </h2>
              <p className="mt-1 text-sm text-zinc-500">The natural next steps from where you are now.</p>
            </div>
            <Link href="/courses" className="hidden text-sm font-medium text-brand-700 hover:underline sm:block">
              View all courses
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </section>
      )}

      <section className="relative mt-14 overflow-hidden rounded-2xl bg-ink p-6 text-white sm:p-10">
        <div className="bg-grid-dark pointer-events-none absolute inset-0" aria-hidden />
        <div className="glow-brand pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <CalendarClock className="size-6 text-gold-300" aria-hidden />
            <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">Want help applying this to your work?</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">
              Book a 1:1 session and we&apos;ll build your prompts, workflows or automations together, live — using your real tasks.
            </p>
          </div>
          <ButtonLink href="/book" variant="gold" size="lg" className="shrink-0">
            Book a session <ArrowRight aria-hidden />
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
