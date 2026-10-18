import { ArrowRight, Check, Compass, GraduationCap, HandHeart, Hammer, Languages, Scale, ShieldCheck, Sparkles, Sprout, Users, Wrench } from "lucide-react";
import type { Metadata } from "next";
import { CtaBand } from "@/components/marketing/cta-band";
import { FeatureCard } from "@/components/marketing/feature-card";
import { PageHero } from "@/components/marketing/page-hero";
import { Accent, Section, SectionHeading } from "@/components/marketing/section";
import { TrackedLink } from "@/components/marketing/tracked-link";
import { buttonVariants } from "@/components/ui/button";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "About",
  description: `${site.name} by ${site.company} helps everyday people and business owners use AI with confidence — through practical courses, 1:1 coaching and done-with-you implementation.`,
  alternates: { canonical: "/about" },
};

const WHAT_WE_DO = [
  {
    icon: GraduationCap,
    title: "Teach",
    body: "Short, practical courses that take you from curious to confident — for everyday life and for business.",
    href: "/courses",
    cta: "Explore courses",
  },
  {
    icon: Users,
    title: "Coach",
    body: "One-on-one sessions where we work through your real tasks together and build what you need, live.",
    href: "/book",
    cta: "Book a session",
  },
  {
    icon: Hammer,
    title: "Build",
    body: "Done-with-you AI implementation: assistants, automations and training, designed around your business.",
    href: "/consulting",
    cta: "AI implementation",
  },
];

const VALUES = [
  {
    icon: Wrench,
    title: "Practical over hype",
    body: "We only teach and build what earns its place in your day. If something is a gimmick, we'll say so.",
  },
  {
    icon: Languages,
    title: "Plain English, always",
    body: "No jargon, no gatekeeping. If you can send an email, you can learn to use AI well.",
  },
  {
    icon: Compass,
    title: "Your goals first",
    body: "We start with what you want more time for — then choose the tools. Sometimes the honest answer is a simpler fix.",
  },
  {
    icon: ShieldCheck,
    title: "Responsible by default",
    body: "Privacy, accuracy and human judgement come built in. AI should support your decisions, not quietly make them.",
  },
  {
    icon: Sprout,
    title: "Learn by doing",
    body: "Every lesson and session ends with something you can use the same day, because confidence comes from results.",
  },
  {
    icon: HandHeart,
    title: "Here for the long run",
    body: "AI keeps changing. We keep our material current and stay in your corner as the tools evolve.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow={`About ${site.name}`}
        title={
          <>
            AI should make life <Accent>easier</Accent> — for everyone.
          </>
        }
        description={`${site.name} is the AI education and implementation practice of ${site.company}. We help everyday people and business owners understand AI, use it with confidence and put it to work where it genuinely helps.`}
        aside={<PrinciplesCard />}
      >
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <TrackedLink href="/assessment" trackId="about_hero_assessment" className={buttonVariants({ size: "lg", className: "w-full sm:w-auto" })}>
            Take the free assessment <ArrowRight aria-hidden />
          </TrackedLink>
          <TrackedLink href="/contact" trackId="about_hero_contact" className={buttonVariants({ variant: "outline", size: "lg", className: "w-full sm:w-auto" })}>
            Get in touch
          </TrackedLink>
        </div>
      </PageHero>

      <Section labelledBy="mission-heading">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
          <SectionHeading
            id="mission-heading"
            align="left"
            eyebrow="Our mission"
            title={
              <>
                Close the gap between AI&apos;s promise and <Accent>everyday results</Accent>
              </>
            }
          />
          <div className="space-y-5 text-lg leading-relaxed text-zinc-700">
            <p>
              AI is one of the most useful tools ever made available to ordinary people. Yet for most of us it still feels confusing, overhyped or
              like something meant for tech companies.
            </p>
            <p>
              We exist to change that. Our job is to make AI understandable, practical and safe — so a parent can plan a busy week in minutes, a
              professional can reclaim hours of writing and research, and a small business can serve customers the way much larger companies do.
            </p>
            <p className="font-medium text-zinc-900">
              Whether you want to learn it yourself or have it built for you, we meet you where you are and help you take the next useful step.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="muted" labelledBy="what-heading">
        <SectionHeading
          id="what-heading"
          eyebrow="What we do"
          title={
            <>
              Teach. Coach. <Accent>Build.</Accent>
            </>
          }
          description="Three ways to work with us, depending on how hands-on you want to be."
        />
        <ul className="mt-14 grid gap-6 md:grid-cols-3">
          {WHAT_WE_DO.map((item) => (
            <li key={item.title} className="flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-7 shadow-soft">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-900/20">
                <item.icon className="size-6" aria-hidden />
              </span>
              <h3 className="mt-6 text-xl font-semibold tracking-tight text-zinc-900">{item.title}</h3>
              <p className="mt-2 flex-1 leading-relaxed text-zinc-600">{item.body}</p>
              <TrackedLink
                href={item.href}
                trackId={`about_what_${item.title.toLowerCase()}`}
                className="mt-6 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                {item.cta} <ArrowRight className="size-4" aria-hidden />
              </TrackedLink>
            </li>
          ))}
        </ul>
      </Section>

      <Section labelledBy="values-heading">
        <SectionHeading
          id="values-heading"
          eyebrow="How we work"
          title={
            <>
              The principles behind <Accent>everything we do</Accent>
            </>
          }
        />
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((v) => (
            <li key={v.title}>
              <FeatureCard icon={v.icon} title={v.title}>
                {v.body}
              </FeatureCard>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="muted" labelledBy="approach-heading" narrow>
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-8 shadow-soft sm:p-12">
          <Scale className="size-8 text-brand-600" aria-hidden />
          <h2 id="approach-heading" className="mt-5 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Our promise on <Accent>honesty</Accent>
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-zinc-700">
            We&apos;ll always recommend the simplest thing that works for you — even when that&apos;s a free resource rather than a paid course or project.
            AI is powerful, but it isn&apos;t magic, and you deserve straight answers about what it can and can&apos;t do.
          </p>
        </div>
      </Section>

      <CtaBand
        headingId="about-cta-heading"
        eyebrow="Start where you are"
        title={
          <>
            Let&apos;s find your <Accent tone="gold">first AI win</Accent>
          </>
        }
        description="Take the free assessment for a personalised plan, or book a free strategy call and talk it through with us."
        primary={{ href: "/assessment", label: "Take the free assessment", trackId: "about_band_assessment" }}
        secondary={{ href: "/book", label: "Book a free strategy call", trackId: "about_band_book" }}
      />
    </>
  );
}

/** Hero aside: the three commitments behind every course, session and project. */
function PrinciplesCard() {
  const lines = ["Practical over hype", "Plain English, always", "Your goals before our tools", "Responsible by default"];
  return (
    <div className="relative mx-auto max-w-md lg:ml-auto">
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-400/30 via-transparent to-gold-300/30 blur-2xl" aria-hidden />
      <div className="relative isolate overflow-hidden rounded-3xl bg-ink p-7 text-white shadow-lift sm:p-9">
        <div className="bg-grid-dark pointer-events-none absolute inset-0 -z-10 opacity-70" aria-hidden />
        <div className="pointer-events-none absolute -top-20 -right-20 -z-10 size-64 rounded-full bg-brand-600/50 blur-[80px]" aria-hidden />
        <span className="flex size-11 items-center justify-center rounded-xl bg-white/10 text-gold-300 ring-1 ring-white/15">
          <Sparkles className="size-5" aria-hidden />
        </span>
        <p className="mt-6 font-display text-3xl leading-tight italic sm:text-[2.1rem]">&ldquo;The simplest thing that genuinely works for you.&rdquo;</p>
        <p className="mt-3 text-sm text-zinc-400">The test we apply to every recommendation we make.</p>
        <ul className="mt-7 space-y-3 border-t border-white/10 pt-6">
          {lines.map((l) => (
            <li key={l} className="flex items-center gap-3 text-sm text-zinc-200">
              <span className="flex size-6 items-center justify-center rounded-full bg-gold-400/15 text-gold-300">
                <Check className="size-3.5" aria-hidden />
              </span>
              {l}
            </li>
          ))}
        </ul>
        <p className="mt-7 text-xs tracking-[0.14em] text-zinc-500 uppercase">
          {site.name} · by {site.company}
        </p>
      </div>
    </div>
  );
}
