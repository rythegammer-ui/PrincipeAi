import { Mail } from "lucide-react";
import { site } from "@/config/site";
import { Markdown } from "@/components/ui/markdown";

/** Shared layout for policy pages: title, last-updated date and Markdown body. */
export function LegalPage({ title, updated, summary, markdown }: { title: string; updated: string; summary: string; markdown: string }) {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-zinc-200/70 bg-white">
        <div className="bg-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" aria-hidden />
        <div className="container-narrow py-14 sm:py-20">
          <p className="eyebrow">Legal</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">{title}</h1>
          <p className="mt-4 text-sm text-zinc-500">
            Last updated <time>{updated}</time>
          </p>
          <p className="mt-5 text-lg leading-relaxed text-zinc-600">{summary}</p>
        </div>
      </section>
      <section className="bg-white py-14 sm:py-20">
        <div className="container-narrow">
          <Markdown className="prose-headings:scroll-mt-24 prose-h2:mt-12 prose-h2:text-2xl prose-h3:text-lg">{markdown}</Markdown>
          <div className="mt-14 flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50 p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-600">Questions about this page? We&apos;re happy to help.</p>
            <a href={`mailto:${site.contactEmail}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800">
              <Mail className="size-4" aria-hidden />
              {site.contactEmail}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
