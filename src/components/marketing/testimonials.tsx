import { Quote } from "lucide-react";
import { site } from "@/config/site";
import { Avatar } from "@/components/ui/misc";
import { Section, SectionHeading } from "./section";

/** Real client testimonials from `site.testimonials`. Renders nothing until the owner adds some. */
export function Testimonials({ tone = "white" }: { tone?: "white" | "muted" }) {
  const items = site.testimonials;
  if (!items.length) return null;
  return (
    <Section tone={tone} labelledBy="testimonials-heading">
      <SectionHeading id="testimonials-heading" eyebrow="In their words" title="What clients say" />
      <ul className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((t) => (
          <li key={`${t.name}-${t.quote.slice(0, 24)}`}>
            <figure className="flex h-full flex-col rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-soft">
              <Quote className="size-6 text-brand-300" aria-hidden />
              <blockquote className="mt-4 flex-1 text-[0.9375rem] leading-relaxed text-zinc-700">“{t.quote}”</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <Avatar name={t.name} />
                <span>
                  <span className="block text-sm font-semibold text-zinc-900">{t.name}</span>
                  {t.role && <span className="block text-xs text-zinc-500">{t.role}</span>}
                </span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </Section>
  );
}
