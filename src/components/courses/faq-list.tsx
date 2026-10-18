import { Plus } from "lucide-react";

/** Accessible FAQ accordion (native details/summary, no JS). Answers are plain text. */
export function FaqList({ faqs }: { faqs: { q: string; a: string }[] }) {
  if (!faqs.length) return null;
  return (
    <div className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white shadow-soft">
      {faqs.map((f, i) => (
        <details key={`${i}-${f.q}`} className="group px-5 sm:px-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium text-zinc-900 [&::-webkit-details-marker]:hidden">
            {f.q}
            <Plus className="size-4 shrink-0 text-brand-600 transition-transform group-open:rotate-45" aria-hidden />
          </summary>
          <p className="pb-5 text-sm leading-relaxed whitespace-pre-line text-zinc-600">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
