import { ChevronDown, Eye, FileText, Lock, PlayCircle } from "lucide-react";
import Link from "next/link";
import type { CurriculumModule } from "@/lib/courses";
import { pluralize } from "@/lib/utils";
import { formatDuration } from "./course-utils";

/** Public curriculum (modules → lessons). Preview lessons link to their free preview page. */
export function CurriculumAccordion({ courseSlug, modules }: { courseSlug: string; modules: CurriculumModule[] }) {
  if (!modules.length) {
    return <p className="rounded-2xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500">The full curriculum is being finalised — check back soon.</p>;
  }
  return (
    <div className="divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-soft">
      {modules.map((m, i) => {
        const minutes = m.lessons.reduce((s, l) => s + l.durationMin, 0);
        return (
          <details key={m.id} className="group" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 transition-colors hover:bg-zinc-50 sm:px-6 [&::-webkit-details-marker]:hidden">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm font-semibold text-brand-700 tabular-nums">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-zinc-900">{m.title}</span>
                <span className="mt-0.5 block text-xs text-zinc-500">
                  {pluralize(m.lessons.length, "lesson")}
                  {minutes > 0 && ` · ${formatDuration(minutes)}`}
                </span>
              </span>
              <ChevronDown className="size-5 shrink-0 text-zinc-400 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <ol className="border-t border-zinc-100 bg-zinc-50/50 px-3 py-2 sm:px-4">
              {m.lessons.map((l) => {
                const Icon = l.videoUrl ? PlayCircle : FileText;
                return (
                  <li key={l.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5 sm:px-3">
                    <Icon className="size-4 shrink-0 text-zinc-400" aria-hidden />
                    <span className="min-w-0 flex-1">
                      {l.isPreview ? (
                        <Link href={`/courses/${courseSlug}/preview/${l.slug}`} className="text-sm font-medium text-zinc-800 hover:text-brand-700 hover:underline">
                          {l.title}
                        </Link>
                      ) : (
                        <span className="text-sm text-zinc-700">{l.title}</span>
                      )}
                      {l.summary && <span className="mt-0.5 hidden text-xs text-zinc-500 sm:block">{l.summary}</span>}
                      {l.isPreview && (
                        <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-700 sm:hidden">
                          <Eye className="size-3" aria-hidden /> Free preview
                        </span>
                      )}
                    </span>
                    {l.isPreview ? (
                      <Link
                        href={`/courses/${courseSlug}/preview/${l.slug}`}
                        className="hidden shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-200 ring-inset hover:bg-brand-100 sm:inline-flex"
                        aria-label={`Preview “${l.title}” for free`}
                      >
                        <Eye className="size-3" aria-hidden /> Free preview
                      </Link>
                    ) : (
                      <span className="shrink-0 text-zinc-300">
                        <Lock className="size-3.5" aria-hidden />
                        <span className="sr-only">Included with enrollment</span>
                      </span>
                    )}
                    <span className="w-14 shrink-0 text-right text-xs text-zinc-500 tabular-nums">{formatDuration(l.durationMin)}</span>
                  </li>
                );
              })}
              {!m.lessons.length && <li className="px-3 py-3 text-sm text-zinc-500">Lessons coming soon.</li>}
            </ol>
          </details>
        );
      })}
    </div>
  );
}
