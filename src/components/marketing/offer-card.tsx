import { ArrowRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrackedLink } from "./tracked-link";

/**
 * Compact offer tile: icon, price label, title, copy and a CTA. The whole card is clickable
 * (the CTA's link stretches over it) while keeping a single, clearly named link for assistive tech.
 */
export function OfferCard({
  icon: Icon,
  badge,
  price,
  title,
  children,
  cta,
  href,
  trackId,
  highlight = false,
  className,
}: {
  icon?: LucideIcon;
  badge?: ReactNode;
  /** e.g. "Free", "$47" — or a <PriceTag>. */
  price?: ReactNode;
  title: string;
  children?: ReactNode;
  cta: string;
  href: string;
  trackId: string;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-2xl border bg-white p-5 shadow-soft transition-all duration-200 focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2 hover:-translate-y-0.5 hover:shadow-lift sm:p-6",
        highlight ? "border-gold-300/80" : "border-zinc-200/80",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {Icon && (
          <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <Icon className="size-5" aria-hidden />
          </span>
        )}
        {badge}
      </div>
      <h3 className="mt-4 text-base font-semibold tracking-tight text-zinc-900">{title}</h3>
      {children && <div className="mt-1.5 text-sm leading-relaxed text-zinc-600">{children}</div>}
      <div className="mt-auto flex items-end justify-between gap-3 pt-5">
        {price ? <div className="text-lg font-semibold tracking-tight text-zinc-900 tabular-nums">{price}</div> : <span />}
        <TrackedLink
          href={href}
          trackId={trackId}
          className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand-700 outline-none after:absolute after:inset-0 after:rounded-2xl after:content-[''] hover:text-brand-800"
        >
          {cta}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </TrackedLink>
      </div>
    </article>
  );
}
