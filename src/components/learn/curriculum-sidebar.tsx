import { CheckCircle2, Circle, PlayCircle } from "lucide-react";
import Link from "next/link";
import { formatDuration } from "@/components/courses/course-utils";
import { Progress } from "@/components/ui/misc";
import type { CourseProgress, CurriculumModule } from "@/lib/courses";
import { cn, pluralize } from "@/lib/utils";
import { CurriculumDrawer } from "./curriculum-drawer";

/** Student-portal curriculum with completion checks; the current lesson is highlighted. */
export function CurriculumSidebar({
  courseSlug,
  courseTitle,
  modules,
  progress,
  currentLessonId,
}: {
  courseSlug: string;
  courseTitle: string;
  modules: CurriculumModule[];
  progress: CourseProgress;
  currentLessonId: string;
}) {
  const done = new Set(progress.completedLessonIds);
  return (
    <div className="bg-white">
      <div className="hidden border-b border-zinc-100 p-5 lg:block">
        <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">Course</p>
        <Link href={`/learn/${courseSlug}`} className="mt-1 block leading-snug font-semibold text-zinc-900 hover:text-brand-700">
          {courseTitle}
        </Link>
        <Progress value={progress.percent} className="mt-4" label="Course progress" />
        <p className="mt-2 text-xs text-zinc-500">
          {progress.completed} of {pluralize(progress.total, "lesson")} complete · {progress.percent}%
        </p>
      </div>
      <CurriculumDrawer
        summary={
          <>
            Course content
            <span className="ml-2 font-normal text-zinc-500">
              {progress.completed}/{progress.total} complete
            </span>
          </>
        }
      >
        <nav aria-label="Course curriculum" className="pb-6">
          {modules.map((m, mi) => (
            <div key={m.id} className="pt-4">
              <p className="px-5 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                <span className="text-brand-600 tabular-nums">{String(mi + 1).padStart(2, "0")}</span> · {m.title}
              </p>
              <ol className="mt-2 space-y-0.5 px-2">
                {m.lessons.map((l) => {
                  const complete = done.has(l.id);
                  const current = l.id === currentLessonId;
                  return (
                    <li key={l.id}>
                      <Link
                        href={`/learn/${courseSlug}/${l.slug}`}
                        aria-current={current ? "page" : undefined}
                        className={cn(
                          "flex min-h-11 items-start gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                          current ? "bg-brand-50 text-brand-900" : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900",
                        )}
                      >
                        {complete ? (
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                        ) : current ? (
                          <PlayCircle className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                        ) : (
                          <Circle className="mt-0.5 size-4 shrink-0 text-zinc-300" aria-hidden />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className={cn("block leading-snug", current && "font-medium")}>{l.title}</span>
                          <span className="mt-0.5 block text-xs text-zinc-500">
                            {formatDuration(l.durationMin)}
                            {complete && <span className="sr-only"> · completed</span>}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </nav>
      </CurriculumDrawer>
    </div>
  );
}
