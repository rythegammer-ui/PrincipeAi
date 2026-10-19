import { ArrowRight, CalendarClock, ClipboardList, Compass, Mail } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { MeetingTypeCard } from "@/components/booking/meeting-type-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { site } from "@/config/site";
import { checkoutMode } from "@/lib/payments";
import { listActiveMeetingTypes } from "@/lib/scheduling";

export const metadata: Metadata = {
  title: "Book a call",
  description:
    "Book a free AI strategy call, a 1:1 AI coaching session or an implementation discovery call. Pick a time that suits you. Times are shown in your timezone.",
};

const STEPS = [
  {
    icon: CalendarClock,
    title: "Pick a time that suits you",
    body: "Times are shown in your own timezone, and you can reschedule or cancel from your confirmation email.",
  },
  {
    icon: ClipboardList,
    title: "Share what you're working on",
    body: "A couple of quick questions help us come prepared, so we spend the call on your real work.",
  },
  {
    icon: Compass,
    title: "Leave with a clear next step",
    body: "Practical ideas you can use straight away, whether you go it alone, take a course or have us build it with you.",
  },
];

export default async function BookPage() {
  const meetingTypes = await listActiveMeetingTypes();
  // Paid sessions can't be booked online while there's no way to pay (see /book/[slug]).
  const paymentsOff = checkoutMode() === "disabled";

  return (
    <>
      <section className="relative overflow-hidden border-b border-zinc-200/70 bg-white">
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div aria-hidden className="glow-brand pointer-events-none absolute inset-x-0 top-0 h-80" />
        <div className="container-page relative py-16 sm:py-20">
          <div className="max-w-2xl animate-fade-up">
            <p className="eyebrow">Book a call</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-5xl">
              Let&apos;s find where AI fits in{" "}
              <span className="font-display text-[1.08em] font-normal text-brand-700 italic">your</span> work
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-pretty text-zinc-600">
              Pick the conversation that fits where you are today. Every session is one-on-one, practical and focused on your actual tasks
              and goals, not generic AI hype.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-zinc-50 py-14 sm:py-20">
        <div className="container-page">
          {meetingTypes.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {meetingTypes.map((mt) => (
                <MeetingTypeCard key={mt.id} meetingType={mt} paymentsOff={paymentsOff} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Mail}
              title="Online booking is paused right now"
              description={
                <>
                  We&apos;re updating our calendar. Email{" "}
                  <a href={`mailto:${site.contactEmail}`} className="font-medium text-brand-700 hover:underline">
                    {site.contactEmail}
                  </a>{" "}
                  and we&apos;ll find a time with you directly.
                </>
              }
            />
          )}

          <div className="mt-16">
            <h2 className="text-center text-sm font-semibold tracking-[0.14em] text-zinc-500 uppercase">How it works</h2>
            <ol className="mt-8 grid gap-6 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-soft">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                      <s.icon className="size-5" aria-hidden />
                    </span>
                    <span className="font-display text-2xl text-zinc-300 italic" aria-hidden>
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold text-zinc-900">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-ink py-16 text-white sm:py-20">
        <div aria-hidden className="bg-grid-dark pointer-events-none absolute inset-0" />
        <div className="container-page relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Not ready to talk <span className="font-display font-normal text-gold-300 italic">yet?</span>
            </h2>
            <p className="mt-3 leading-relaxed text-zinc-300">
              Take the free 3-minute AI Readiness Assessment for a personalised action plan, or start learning at your own pace with our
              courses.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <ButtonLink href="/assessment" variant="gold" size="lg">
              Take the free assessment <ArrowRight />
            </ButtonLink>
            <Link
              href="/courses"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 px-6 text-base font-medium text-white transition-colors hover:bg-white/10"
            >
              Browse courses
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
