import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TrackedLink } from "./tracked-link";

export type CtaLink = { href: string; label: string; trackId: string };

/** Dark "ink" call-to-action band with a violet glow and grid texture. */
export function CtaBand({
  eyebrow,
  title,
  description,
  primary,
  secondary,
  note,
  children,
  className,
  headingId,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  primary: CtaLink;
  secondary?: CtaLink;
  /** Small reassurance line under the buttons. */
  note?: ReactNode;
  /** Optional extra content (e.g. a list of what's included) shown under the copy. */
  children?: ReactNode;
  className?: string;
  headingId?: string;
}) {
  return (
    <section aria-labelledby={headingId} className={cn("relative isolate overflow-hidden bg-ink py-20 text-white sm:py-28", className)}>
      <div className="bg-grid-dark pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" aria-hidden />
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[28rem] w-[46rem] max-w-[140vw] -translate-x-1/2 rounded-full bg-brand-600/30 blur-[120px]" aria-hidden />
      <div className="pointer-events-none absolute -bottom-48 left-[10%] -z-10 h-80 w-80 rounded-full bg-gold-400/10 blur-[100px]" aria-hidden />
      <div className="container-narrow text-center">
        {eyebrow && <p className="text-xs font-semibold tracking-[0.14em] text-gold-300 uppercase">{eyebrow}</p>}
        <h2 id={headingId} className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl lg:leading-[1.08]">
          {title}
        </h2>
        {description && <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-pretty text-zinc-300 sm:text-lg">{description}</p>}
        {children}
        <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <TrackedLink href={primary.href} trackId={primary.trackId} className={buttonVariants({ variant: "gold", size: "lg", className: "w-full sm:w-auto" })}>
            {primary.label} <ArrowRight aria-hidden />
          </TrackedLink>
          {secondary && (
            <TrackedLink
              href={secondary.href}
              trackId={secondary.trackId}
              className={buttonVariants({ variant: "ghost", size: "lg", className: "w-full text-white ring-1 ring-white/15 hover:bg-white/10 hover:text-white sm:w-auto" })}
            >
              {secondary.label}
            </TrackedLink>
          )}
        </div>
        {note && <p className="mt-5 text-sm text-zinc-400">{note}</p>}
      </div>
    </section>
  );
}

/**
 * Violet gradient call-to-action card on a white band — the lighter sibling of <CtaBand>,
 * used to close a page (up to three actions: gold, white, outline).
 */
export function CtaCard({
  title,
  description,
  actions,
  headingId,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions: [CtaLink, ...CtaLink[]];
  headingId: string;
}) {
  const variants = ["gold", "white", "ghost"] as const;
  return (
    <section aria-labelledby={headingId} className="bg-white py-20 sm:py-24">
      <div className="container-page">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 px-6 py-14 text-center text-white shadow-lift sm:px-12 sm:py-20">
          <div className="bg-grid-dark pointer-events-none absolute inset-0 -z-10 opacity-60" aria-hidden />
          <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-64 w-[36rem] max-w-[120%] -translate-x-1/2 rounded-full bg-white/20 blur-[90px]" aria-hidden />
          <div className="pointer-events-none absolute -right-24 -bottom-32 -z-10 size-72 rounded-full bg-gold-300/20 blur-[100px]" aria-hidden />
          <h2 id={headingId} className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl sm:leading-[1.08]">
            {title}
          </h2>
          {description && <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-brand-100 sm:text-lg">{description}</p>}
          <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            {actions.slice(0, 3).map((a, i) => (
              <TrackedLink
                key={a.trackId}
                href={a.href}
                trackId={a.trackId}
                className={buttonVariants({
                  variant: variants[i],
                  size: "lg",
                  className: cn("w-full sm:w-auto", i === 2 && "text-white ring-1 ring-white/25 hover:bg-white/10 hover:text-white"),
                })}
              >
                {a.label}
                {i === 0 && <ArrowRight aria-hidden />}
              </TrackedLink>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
