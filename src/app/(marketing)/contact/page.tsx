import { ArrowRight, CalendarDays, Gauge, Handshake, Mail } from "lucide-react";
import type { Metadata } from "next";
import { ContactForm } from "@/components/marketing/contact-form";
import { Accent } from "@/components/marketing/section";
import { TrackedLink } from "@/components/marketing/tracked-link";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Questions about AI courses, coaching or implementation? Send ${site.name} a message or book a free strategy call.`,
  alternates: { canonical: "/contact" },
};

const SHORTCUTS = [
  {
    icon: CalendarDays,
    title: "Book a free strategy call",
    body: "Talk through your goals and get an honest recommendation.",
    href: "/book",
    trackId: "contact_book",
  },
  {
    icon: Gauge,
    title: "Take the AI assessment",
    body: "A personalised plan and your best next step, in minutes.",
    href: "/assessment",
    trackId: "contact_assessment",
  },
  {
    icon: Handshake,
    title: "Apply for AI implementation",
    body: "Want AI systems built for your business? Start here.",
    href: "/consulting#apply",
    trackId: "contact_consulting",
  },
];

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string | string[] }> }) {
  const { topic } = await searchParams;
  const defaultTopic = Array.isArray(topic) ? topic[0] : topic;

  return (
    <section className="relative isolate overflow-hidden bg-white">
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" aria-hidden />
      <div className="pointer-events-none absolute -top-48 left-1/2 -z-10 h-[30rem] w-[52rem] max-w-[150vw] -translate-x-1/2 rounded-full bg-brand-400/20 blur-[110px]" aria-hidden />
      <div className="container-page grid gap-12 py-16 sm:py-20 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16 lg:py-24">
        <div className="animate-fade-up">
          <p className="eyebrow">Contact</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-5xl">
            Let&apos;s <Accent>talk</Accent>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-pretty text-zinc-600">
            Questions about a course, coaching or bringing AI into your business? Send a message and a real person will get back to you by email.
          </p>

          <a
            href={`mailto:${site.contactEmail}`}
            className="mt-8 flex items-center gap-4 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-soft transition-colors hover:border-brand-200 hover:bg-brand-50/40"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
              <Mail className="size-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm text-zinc-500">Email us directly</span>
              <span className="block truncate font-semibold text-zinc-900">{site.contactEmail}</span>
            </span>
          </a>

          <h2 className="mt-10 text-sm font-semibold text-zinc-900">Looking for something specific?</h2>
          <ul className="mt-4 space-y-3">
            {SHORTCUTS.map((s) => (
              <li key={s.href}>
                <TrackedLink
                  href={s.href}
                  trackId={s.trackId}
                  className="group flex items-center gap-4 rounded-2xl p-3 transition-colors hover:bg-zinc-50 focus-visible:bg-zinc-50"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 transition-colors group-hover:bg-brand-50 group-hover:text-brand-600">
                    <s.icon className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-zinc-900">{s.title}</span>
                    <span className="block text-sm text-zinc-500">{s.body}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" aria-hidden />
                </TrackedLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-fade-up rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-lift [animation-delay:120ms] sm:p-8 lg:self-start">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Send us a message</h2>
          <p className="mt-1 text-sm text-zinc-500">All fields are required.</p>
          <div className="mt-6">
            <ContactForm defaultTopic={defaultTopic} />
          </div>
        </div>
      </div>
    </section>
  );
}
