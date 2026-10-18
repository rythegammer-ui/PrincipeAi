import { ArrowRight, Check, MessageCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import type { Course } from "@/db/schema";
import { cn, pluralize } from "@/lib/utils";
import { formatDuration } from "./course-utils";
import { EnrollForm } from "./enroll-form";
import { PriceTag } from "./price-tag";

/** Sticky purchase card on the sales page. */
export function BuyBox({
  course,
  lessonCount,
  totalMinutes,
  owned,
  mode,
  defaultEmail,
  defaultName,
  className,
}: {
  course: Course;
  lessonCount: number;
  totalMinutes: number;
  owned: boolean;
  mode: "stripe" | "test" | "disabled";
  defaultEmail?: string;
  defaultName?: string;
  className?: string;
}) {
  return (
    <div id="enroll" className={cn("scroll-mt-24 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lift", className)}>
      <div className="border-b border-zinc-100 bg-gradient-to-br from-brand-50 via-white to-gold-50/60 p-6">
        <p className="text-sm font-medium text-zinc-600">{owned ? "You're enrolled" : "One-time payment · lifetime access"}</p>
        <PriceTag priceCents={course.priceCents} compareAtCents={course.compareAtCents} size="lg" showSavings className="mt-2" />
        <p className="mt-2 text-xs text-zinc-500">
          {pluralize(lessonCount, "lesson")}
          {totalMinutes > 0 && ` · ${formatDuration(totalMinutes)} of content`} · {course.level}
        </p>
      </div>
      <div className="p-6">
        {owned ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-zinc-600">This course is already in your library. Pick up right where you left off.</p>
            <ButtonLink href={`/learn/${course.slug}`} size="lg" className="w-full">
              Go to course <ArrowRight aria-hidden />
            </ButtonLink>
          </div>
        ) : mode === "disabled" && course.priceCents > 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-zinc-600">Online enrollment is opening soon. Get in touch and we&apos;ll get you set up personally.</p>
            <ButtonLink href="/contact" size="lg" className="w-full">
              Contact us to enroll
            </ButtonLink>
          </div>
        ) : (
          <EnrollForm
            courseId={course.id}
            courseSlug={course.slug}
            mode={course.priceCents > 0 ? mode : "free"}
            ctaLabel={course.priceCents > 0 ? "Enroll now" : "Get free access"}
            defaultEmail={defaultEmail}
            defaultName={defaultName}
          />
        )}

        {course.includes.length > 0 && (
          <div className="mt-6 border-t border-zinc-100 pt-5">
            <p className="text-sm font-semibold text-zinc-900">What&apos;s included</p>
            <ul className="mt-3 space-y-2">
              {course.includes.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-zinc-700">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 border-t border-zinc-100 pt-5 text-xs text-zinc-500">
          <p className="flex items-center gap-2">
            <ShieldCheck className="size-4 shrink-0 text-brand-500" aria-hidden />
            Questions before you buy?{" "}
            <Link href="/contact" className="font-medium text-brand-700 hover:underline">
              Ask us
            </Link>
          </p>
          <p className="flex items-center gap-2">
            <MessageCircle className="size-4 shrink-0 text-brand-500" aria-hidden />
            Prefer to talk it through?{" "}
            <Link href="/book" className="font-medium text-brand-700 hover:underline">
              Book a free call
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
