import { ArrowRight, Award, PartyPopper } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

/** Shown on every lesson once the whole course is complete. */
export function CourseCompleteCard({ courseSlug, courseTitle }: { courseSlug: string; courseTitle: string }) {
  return (
    <section
      aria-labelledby="course-complete-heading"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-gold-500 p-6 text-white shadow-lift sm:p-8"
    >
      <div className="bg-grid-dark pointer-events-none absolute inset-0 opacity-70" aria-hidden />
      <div className="relative">
        <PartyPopper className="size-8 text-gold-200" aria-hidden />
        <h2 id="course-complete-heading" className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          You finished <span className="font-display font-normal italic">{courseTitle}</span>!
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85">
          That&apos;s a real achievement. The best way to lock it in is to use one thing you learned this week — and if you&apos;d like help
          putting AI to work on your own projects, we&apos;re here.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={`/learn/${courseSlug}/certificate`} variant="white">
            <Award aria-hidden /> Get your certificate
          </ButtonLink>
          <ButtonLink href="/learn" variant="ghost" className="text-white hover:bg-white/15 hover:text-white">
            Find your next course <ArrowRight aria-hidden />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
