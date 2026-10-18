import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { JsonLd } from "./json-ld";

export type FaqItem = { q: string; a: string };

/**
 * Accessible FAQ accordion (native details/summary — keyboard and screen-reader friendly, no JS)
 * plus FAQPage structured data for search engines.
 */
export function Faq({ items, className, structuredData = true }: { items: readonly FaqItem[]; className?: string; structuredData?: boolean }) {
  if (!items.length) return null;
  return (
    <>
      <div className={cn("divide-y divide-zinc-200/80 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-soft", className)}>
        {items.map((item) => (
          <details key={item.q} className="group">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left font-medium text-zinc-900 transition-colors hover:bg-zinc-50/80 sm:px-6 [&::-webkit-details-marker]:hidden">
              <span className="text-[0.9375rem] sm:text-base">{item.q}</span>
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition-transform duration-200 group-open:rotate-45">
                <Plus className="size-4" aria-hidden />
              </span>
            </summary>
            <p className="px-5 pb-5 text-sm leading-relaxed whitespace-pre-line text-zinc-600 sm:px-6 sm:text-[0.9375rem]">{item.a}</p>
          </details>
        ))}
      </div>
      {structuredData && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: items.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          }}
        />
      )}
    </>
  );
}
