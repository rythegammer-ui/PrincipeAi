import { ArrowRight, BarChart3, BookOpen, Clock } from "lucide-react";
import Link from "next/link";
import type { CourseSummary } from "@/lib/courses";
import { cn, pluralize } from "@/lib/utils";
import { CourseCover } from "./course-cover";
import { AUDIENCE_LABELS, asAudience, formatDuration } from "./course-utils";
import { PriceTag } from "./price-tag";

/** Catalog card. The whole card is clickable via the title link's overlay. */
export function CourseCard({ course, className }: { course: CourseSummary; className?: string }) {
  const href = `/courses/${course.slug}`;
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2",
        course.featured && "border-gold-300/70",
        className,
      )}
    >
      <CourseCover emoji={course.coverEmoji} audience={course.audience} className="aspect-[16/9]">
        <span className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-zinc-800 shadow-sm backdrop-blur">
          {course.level}
        </span>
        {course.featured && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-gold-400 px-2.5 py-1 text-xs font-semibold text-ink shadow-sm">
            ★ Most popular
          </span>
        )}
      </CourseCover>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="eyebrow">{AUDIENCE_LABELS[asAudience(course.audience)]}</p>
        <h3 className="mt-2 text-lg leading-snug font-semibold tracking-tight text-zinc-900">
          <Link href={href} className="outline-none after:absolute after:inset-0 after:content-['']">
            {course.title}
          </Link>
        </h3>
        {course.subtitle && <p className="mt-2 text-sm leading-relaxed text-zinc-600">{course.subtitle}</p>}
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-500" aria-label="Course details">
          <li className="inline-flex items-center gap-1.5">
            <BookOpen className="size-3.5 text-brand-500" aria-hidden />
            {pluralize(course.lessonCount, "lesson")}
          </li>
          {course.totalMinutes > 0 && (
            <li className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5 text-brand-500" aria-hidden />
              {formatDuration(course.totalMinutes)}
            </li>
          )}
          <li className="inline-flex items-center gap-1.5">
            <BarChart3 className="size-3.5 text-brand-500" aria-hidden />
            {course.level}
          </li>
        </ul>
        <div className="mt-auto flex items-end justify-between gap-3 pt-6">
          <PriceTag priceCents={course.priceCents} compareAtCents={course.compareAtCents} size="md" />
          <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 transition-transform group-hover:translate-x-0.5" aria-hidden>
            View course <ArrowRight className="size-4" />
          </span>
        </div>
      </div>
    </article>
  );
}
