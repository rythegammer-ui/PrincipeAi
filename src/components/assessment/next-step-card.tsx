import { ArrowRight, CalendarCheck2, Clock, Handshake } from "lucide-react";
import type { OfferDetails } from "@/app/(marketing)/assessment/data";
import { CourseCover } from "@/components/courses/course-cover";
import { PriceTag } from "@/components/courses/price-tag";
import { ButtonLink } from "@/components/ui/button";

/** The recommended offer (course or implementation) plus the free strategy call as a secondary option. */
export function NextStepCard({
  offer,
  offerHref,
  reason,
  strategyCallHref,
  strategyCallMinutes,
}: {
  offer: OfferDetails;
  /** Offer URL (booking links pre-filled with the visitor's details). */
  offerHref: string;
  reason: string;
  strategyCallHref: string;
  strategyCallMinutes: number | null;
}) {
  const isCourse = offer.kind === "course";
  return (
    <div className="overflow-hidden rounded-2xl border border-gold-300/70 bg-white shadow-lift">
      <div className="grid md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
        {isCourse ? (
          <CourseCover emoji={offer.coverEmoji ?? "✨"} audience={offer.audience ?? "both"} className="aspect-[16/7] md:aspect-auto md:h-full" />
        ) : (
          <div className="relative isolate flex aspect-[16/7] items-center justify-center overflow-hidden bg-gradient-to-br from-ink via-brand-950 to-brand-800 md:aspect-auto md:h-full">
            <div className="bg-grid-dark absolute inset-0 -z-10 opacity-70" aria-hidden />
            <span className="flex size-16 items-center justify-center rounded-2xl bg-gold-400 text-ink shadow-lg">
              <Handshake className="size-8" aria-hidden />
            </span>
          </div>
        )}
        <div className="p-6 sm:p-8">
          <p className="eyebrow">Recommended for you</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-2xl">{offer.title}</h3>
          {offer.subtitle && <p className="mt-2 text-sm leading-relaxed text-zinc-600">{offer.subtitle}</p>}
          <p className="mt-4 rounded-xl bg-brand-50/70 p-4 text-sm leading-relaxed text-brand-950 ring-1 ring-brand-100 ring-inset">
            <span className="font-semibold">Why this fits: </span>
            {reason}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            {isCourse && offer.priceCents !== null ? (
              <PriceTag priceCents={offer.priceCents} compareAtCents={offer.compareAtCents} showSavings />
            ) : offer.durationMin ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700">
                <Clock className="size-4 text-brand-600" aria-hidden />
                {offer.priceLabel ?? `${offer.durationMin}-minute call`}
              </span>
            ) : null}
            {isCourse && offer.level && <span className="text-sm text-zinc-500">{offer.level} level</span>}
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ButtonLink href={offerHref} size="lg" className="h-auto min-h-12 w-full py-2.5 text-center whitespace-normal sm:w-auto">
              {offer.cta} <ArrowRight aria-hidden />
            </ButtonLink>
            <ButtonLink href={strategyCallHref} variant="outline" size="lg" className="h-auto min-h-12 w-full py-2.5 text-center whitespace-normal sm:w-auto">
              <CalendarCheck2 aria-hidden /> Book a free AI strategy call
            </ButtonLink>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Not sure yet? The {strategyCallMinutes ? `${strategyCallMinutes}-minute ` : ""}strategy call is free, with no obligation — we&apos;ll look at your
            results together and map out the right next step.
          </p>
        </div>
      </div>
    </div>
  );
}
