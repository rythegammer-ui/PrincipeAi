import { ArrowLeft, Compass, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { ButtonLink } from "@/components/ui/button";
import { getOrderDetails } from "@/lib/payments";

export const metadata: Metadata = { title: "Checkout cancelled", robots: { index: false, follow: false } };

export default async function CheckoutCancelledPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order: orderId } = await searchParams;
  const details = orderId && z.uuid().safeParse(orderId).success ? await getOrderDetails(orderId) : null;
  const course = details?.course ?? null;
  const isBooking = details?.order.itemType === "booking";

  return (
    <section className="relative overflow-hidden bg-zinc-50 py-14 sm:py-24">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" aria-hidden />
      <div className="relative mx-auto w-full max-w-xl px-4 sm:px-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-lift sm:p-10">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">No problem — you haven&apos;t been charged</h1>
          <p className="mx-auto mt-3 max-w-md text-zinc-600">
            {course
              ? `Your checkout for ${course.title} was cancelled. Whenever you're ready, you can pick up right where you left off.`
              : isBooking
                ? "Your payment was cancelled, so the session isn't confirmed yet. Time slots are held briefly — you can pick a time again whenever you're ready."
                : "Your checkout was cancelled. Whenever you're ready, you can pick up right where you left off."}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {course ? (
              <ButtonLink href={`/courses/${course.slug}`}>
                <ArrowLeft aria-hidden /> Back to the course
              </ButtonLink>
            ) : isBooking ? (
              <ButtonLink href="/book">
                <ArrowLeft aria-hidden /> Choose a time
              </ButtonLink>
            ) : (
              <ButtonLink href="/courses">
                <ArrowLeft aria-hidden /> Browse courses
              </ButtonLink>
            )}
            <ButtonLink href="/book" variant="outline">
              Talk to us first
            </ButtonLink>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link href="/assessment" className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft transition-shadow hover:shadow-lift">
            <Compass className="size-5 text-brand-600" aria-hidden />
            <p className="mt-3 font-semibold text-zinc-900 group-hover:text-brand-700">Not sure what&apos;s right for you?</p>
            <p className="mt-1 text-sm text-zinc-600">Take the free 3-minute AI Readiness Assessment for a personalised recommendation.</p>
          </Link>
          <Link href="/contact" className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft transition-shadow hover:shadow-lift">
            <MessageCircle className="size-5 text-brand-600" aria-hidden />
            <p className="mt-3 font-semibold text-zinc-900 group-hover:text-brand-700">Have a question?</p>
            <p className="mt-1 text-sm text-zinc-600">Ask us anything about our courses or coaching — a real person will get back to you.</p>
          </Link>
        </div>
      </div>
    </section>
  );
}
