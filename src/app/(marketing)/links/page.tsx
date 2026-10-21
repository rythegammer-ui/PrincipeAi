import { ArrowRight, BriefcaseBusiness, CalendarClock, ClipboardCheck, Gift, GraduationCap } from "lucide-react";
import type { Metadata } from "next";
import { TrackedLink } from "@/components/marketing/tracked-link";
import { site } from "@/config/site";
import { starterKit } from "@/content/starter-kit";
import { getActiveMeetingType } from "@/lib/scheduling";
import { socialProfiles } from "@/lib/social";
import { cn } from "@/lib/utils";

/**
 * Link-in-bio page for social profiles. Point every bio link here with UTM tags
 * (e.g. /links?utm_source=instagram&utm_medium=bio): the proxy records them as first-touch attribution,
 * so Admin → Funnels credits every lead from a bio to its platform. Not indexed: it's a hub, not content.
 */
export const metadata: Metadata = {
  title: "Start here",
  description: `${site.tagline} Free AI resources, courses and calls from ${site.name}.`,
  alternates: { canonical: "/links" },
  robots: { index: false, follow: true },
};

export default async function LinksPage() {
  const strategyCall = await getActiveMeetingType("ai-strategy-call");
  const social = socialProfiles();

  const links = [
    {
      href: "/free-guide",
      trackId: "links_starter_kit",
      icon: Gift,
      title: `Get the free ${starterKit.title.replace(/^The /, "")}`,
      body: starterKit.subtitle,
      featured: true,
    },
    {
      href: "/assessment",
      trackId: "links_assessment",
      icon: ClipboardCheck,
      title: "Take the free AI Readiness Assessment",
      body: "Get your AI readiness score and a personalized AI action plan in about 3 minutes.",
    },
    {
      href: "/courses",
      trackId: "links_courses",
      icon: GraduationCap,
      title: "Browse the courses",
      body: "Plain-English AI courses for your life and your business, with free preview lessons.",
    },
    strategyCall
      ? {
          href: `/book/${strategyCall.slug}`,
          trackId: "links_strategy_call",
          icon: CalendarClock,
          title: `Book a ${strategyCall.name.replace(/^Free /, "free ")}`,
          body: `${strategyCall.durationMin} minutes, one-on-one, focused on your real work.`,
        }
      : {
          href: "/book",
          trackId: "links_book",
          icon: CalendarClock,
          title: "Book a call",
          body: "Pick the conversation that fits where you are today.",
        },
    {
      href: "/consulting",
      trackId: "links_consulting",
      icon: BriefcaseBusiness,
      title: "Have AI built for your business",
      body: "Done-with-you AI implementation, with a written scope and quote before any work begins.",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-zinc-50 py-12 sm:py-16">
      <div aria-hidden className="glow-brand pointer-events-none absolute inset-x-0 top-0 h-72" />
      <div className="relative mx-auto w-full max-w-xl px-4 sm:px-6">
        <div className="animate-fade-up text-center">
          <p className="eyebrow">{site.name}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-4xl">
            Make AI work <span className="font-display text-[1.08em] font-normal text-brand-700 italic">for you</span>
          </h1>
          <p className="mt-3 text-base leading-relaxed text-pretty text-zinc-600">{site.tagline}</p>
        </div>

        <ul className="mt-8 space-y-3">
          {links.map((l) => (
            <li key={l.trackId}>
              <TrackedLink
                href={l.href}
                trackId={l.trackId}
                className={cn(
                  "group flex min-h-16 items-center gap-4 rounded-2xl border p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
                  l.featured ? "border-brand-700 bg-brand-600 text-white" : "border-zinc-200 bg-white text-zinc-900",
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-10 shrink-0 items-center justify-center rounded-xl",
                    l.featured ? "bg-white/15 text-gold-300" : "bg-brand-50 text-brand-700",
                  )}
                >
                  <l.icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{l.title}</span>
                  <span className={cn("mt-0.5 block text-sm leading-snug", l.featured ? "text-brand-100" : "text-zinc-600")}>{l.body}</span>
                </span>
                <ArrowRight
                  className={cn("size-4 shrink-0 transition-transform group-hover:translate-x-0.5", l.featured ? "text-white" : "text-zinc-400")}
                  aria-hidden
                />
              </TrackedLink>
            </li>
          ))}
        </ul>

        {social.length > 0 && (
          <ul aria-label={`${site.name} on social media`} className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2">
            {social.map((s) => (
              <li key={s.key}>
                <a href={s.url} target="_blank" rel="me noopener noreferrer" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-6 text-center text-sm text-zinc-500">
          Questions?{" "}
          <a href={`mailto:${site.contactEmail}`} className="font-medium text-brand-700 hover:underline">
            {site.contactEmail}
          </a>
        </p>
      </div>
    </section>
  );
}
