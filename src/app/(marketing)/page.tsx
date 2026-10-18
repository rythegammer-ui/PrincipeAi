import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Check,
  ClipboardCheck,
  GraduationCap,
  HeartHandshake,
  Lightbulb,
  MessageSquareText,
  PenLine,
  Rocket,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import { CtaBand, CtaCard } from "@/components/marketing/cta-band";
import { Faq, type FaqItem } from "@/components/marketing/faq";
import { CheckList, FeatureCard } from "@/components/marketing/feature-card";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { JsonLd } from "@/components/marketing/json-ld";
import { OfferLadder } from "@/components/marketing/offer-ladder";
import { Accent, Section, SectionHeading } from "@/components/marketing/section";
import { kitSummary } from "@/components/marketing/starter-kit-utils";
import { Testimonials } from "@/components/marketing/testimonials";
import { TrackedLink } from "@/components/marketing/tracked-link";
import { site } from "@/config/site";
import { starterKit } from "@/content/starter-kit";
import { listPublishedCourses } from "@/lib/courses";
import { getActiveMeetingType } from "@/lib/scheduling";
import { absoluteUrl, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: { absolute: `${site.name} — Practical AI courses, coaching & implementation` },
  description:
    "Learn to use AI with confidence in your life and your business. Plain-English AI courses, 1:1 coaching and done-with-you AI implementation from Principe AI.",
  alternates: { canonical: "/" },
};

const PATHS = [
  {
    key: "life",
    icon: HeartHandshake,
    eyebrow: "For your life",
    title: "Less busywork. More of what matters.",
    body: "Use AI as a patient, always-available helper for the everyday — planning, writing, learning and making better decisions.",
    outcomes: [
      "Plan meals, trips and busy weeks in minutes",
      "Write emails, messages and documents faster — in your own voice",
      "Learn new skills with a tutor that never runs out of patience",
      "Get a clear second opinion on bills, contracts and big decisions",
    ],
    primary: { href: "/courses?for=life", label: "Courses for everyday life", trackId: "home_paths_life_courses" },
    secondary: { href: "/free-guide", label: "Get the free Starter Kit", trackId: "home_paths_life_guide" },
  },
  {
    key: "business",
    icon: BriefcaseBusiness,
    eyebrow: "For your business",
    title: "Put AI to work across your business.",
    body: "Find the highest-value opportunities, then turn them into systems that save time, win customers and support your team.",
    outcomes: [
      "Answer customer questions around the clock with an assistant that knows your business",
      "Turn one idea into a week of posts, emails and content",
      "Automate lead follow-up, scheduling and routine admin",
      "Give your team clear AI workflows, guardrails and training",
    ],
    primary: { href: "/courses?for=business", label: "Courses for business", trackId: "home_paths_business_courses" },
    secondary: { href: "/consulting", label: "Have it built for you", trackId: "home_paths_business_consulting" },
  },
] as const;

const OUTCOMES = [
  { icon: MessageSquareText, title: "Write prompts that work", body: "Give AI the context it needs and get specific, useful answers the first time — not generic filler." },
  { icon: PenLine, title: "Write and edit in your voice", body: "Draft emails, posts, proposals and documents faster, then polish them so they still sound like you." },
  { icon: ScanSearch, title: "Research and summarise fast", body: "Turn long reports, articles and meeting notes into the handful of points that actually matter." },
  { icon: Workflow, title: "Automate repetitive work", body: "Connect AI to the tools you already use so routine tasks happen without you." },
  { icon: Bot, title: "Build your own AI assistants", body: "Set up assistants that know your preferences, your business and how you like things done." },
  { icon: Lightbulb, title: "Spot your best opportunities", body: "Find where AI saves the most time and money in your week or your business — and start there." },
  { icon: ShieldCheck, title: "Use AI safely and responsibly", body: "Know what to share, what not to, how to check facts, and when a human should make the call." },
  { icon: Users, title: "Bring your team along", body: "Roll out AI with simple guidelines and shared workflows so everyone benefits, not just the early adopters." },
] as const;

const HOW_IT_WORKS = [
  {
    icon: ClipboardCheck,
    title: "Assess",
    body: "Take the free AI Readiness Assessment. You'll get a readiness score, a personalised plan and an honest recommendation for where to start.",
    link: { href: "/assessment", label: "Take the assessment", trackId: "home_how_assess" },
  },
  {
    icon: GraduationCap,
    title: "Learn",
    body: "Follow short, practical lessons with an AI tutor beside you — or get 1:1 coaching on your real work when you want a guide.",
    link: { href: "/courses", label: "Browse courses", trackId: "home_how_learn" },
  },
  {
    icon: Rocket,
    title: "Implement",
    body: "Put AI to work. Use your new workflows straight away, or have us design and build the systems with your team.",
    link: { href: "/consulting", label: "AI implementation", trackId: "home_how_implement" },
  },
] as const;

const FAQS: FaqItem[] = [
  {
    q: "Do I need a technical background?",
    a: "Not at all. Everything is taught in plain English and starts from the basics. If you can send an email and use a web browser, you have all the skills you need to begin.",
  },
  {
    q: "Which AI tools will I learn to use?",
    a: "We focus on skills that work across the major AI assistants — such as ChatGPT, Claude and Gemini — and show you how to pick the right tool for each job, so you're never locked into one app. Business courses and implementation projects also cover connecting AI to the tools you already use.",
  },
  {
    q: "Is it safe to use AI with personal or business information?",
    a: "It can be, when you know the rules. We teach what's safe to share, which settings to check, how to verify AI answers, and how to set simple guidelines for a team. For implementation projects, data handling is part of the plan from day one.",
  },
  {
    q: "How is this different from free videos online?",
    a: "Free content is great for ideas, but it's scattered and rarely about your situation. Our courses give you a clear path with practical exercises, an AI tutor inside every lesson, and real people to talk to when you want help applying it to your own work or business.",
  },
  {
    q: "Should I take a course, get coaching or have you build it?",
    a: "Take a course if you want to learn and do it yourself at your own pace. Choose 1:1 coaching if you want hands-on help with your real tasks. Choose implementation if you'd rather have AI systems designed and built for your business. Not sure? The free assessment recommends a starting point, or you can book a free strategy call.",
  },
  {
    q: "How quickly will I see results?",
    a: "Our lessons are built around small, practical wins, so you should be able to use something from your very first one. The free Starter Kit follows a simple day-by-day plan designed to make AI part of your routine within a week.",
  },
  {
    q: "What does AI implementation cost?",
    a: "Every business is different, so we don't publish one-size-fits-all prices. After a free discovery call you'll receive a clear written scope and quote before any work begins — and if a course or coaching would serve you better, we'll tell you.",
  },
  {
    q: "Can I get help choosing the right option?",
    a: "Yes. Book a free strategy call or send us a message, and you'll get an honest recommendation — including when the free resources are all you need.",
  },
];

export default async function HomePage() {
  const [courses, strategyCall, coaching] = await Promise.all([
    listPublishedCourses(),
    getActiveMeetingType("ai-strategy-call"),
    getActiveMeetingType("ai-coaching-session"),
  ]);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: site.name,
          url: absoluteUrl("/"),
          email: site.contactEmail,
          description: site.description,
          slogan: site.tagline,
          parentOrganization: { "@type": "Organization", name: site.company },
        }}
      />

      {/* (a) Hero */}
      <section className="relative isolate overflow-hidden border-b border-zinc-200/70 bg-white">
        <div className="bg-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" aria-hidden />
        <div className="pointer-events-none absolute -top-56 right-[-10%] -z-10 h-[36rem] w-[40rem] max-w-[120vw] rounded-full bg-brand-400/20 blur-[120px]" aria-hidden />
        <div className="container-page grid items-center gap-14 pt-12 pb-16 sm:pt-16 sm:pb-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8 lg:pt-20 lg:pb-24">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50/80 px-3 py-1 text-xs font-semibold text-brand-800 shadow-xs">
              <Sparkles className="size-3.5 text-brand-600" aria-hidden />
              AI education &amp; implementation
            </p>
            <h1 className="mt-6 text-[2.5rem] leading-[1.05] font-semibold tracking-tight text-balance text-zinc-900 sm:text-[3.5rem] lg:text-[3.6rem] xl:text-[3.85rem]">
              Make AI work <Accent tone="gradient" className="whitespace-nowrap">for you</Accent> — in your life and your business.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-zinc-600">
              Practical, plain-English AI education for everyday people and business owners — plus hands-on coaching and done-with-you
              implementation when you want AI working for you, fast.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <TrackedLink href="/assessment" trackId="home_hero_assessment" className={buttonVariants({ size: "lg", className: "w-full sm:w-auto" })}>
                Take the free AI assessment <ArrowRight aria-hidden />
              </TrackedLink>
              <TrackedLink href="/courses" trackId="home_hero_courses" className={buttonVariants({ variant: "outline", size: "lg", className: "w-full sm:w-auto" })}>
                Explore courses
              </TrackedLink>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-600" aria-label="Why people choose us">
              {["No tech background needed", "Practical, not hype", "Learn at your own pace"].map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <Check className="size-4 text-brand-600" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <HeroVisual className="animate-fade-up [animation-delay:150ms]" />
        </div>
      </section>

      {/* (b) Two paths */}
      <Section tone="muted" labelledBy="paths-heading">
        <SectionHeading
          id="paths-heading"
          eyebrow="Two paths, one goal"
          title={
            <>
              AI that fits <Accent>your</Accent> world
            </>
          }
          description="Whether you want more time in your day or a business that runs smarter, you'll learn the same core skill: getting AI to do genuinely useful work for you."
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {PATHS.map((p) => {
            const dark = p.key === "business";
            return (
              <article
                key={p.key}
                className={cn(
                  "relative isolate flex flex-col overflow-hidden rounded-3xl p-7 sm:p-10",
                  dark ? "bg-ink text-white shadow-lift" : "border border-zinc-200/80 bg-white shadow-soft",
                )}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute -top-24 -right-24 -z-10 size-72 rounded-full blur-[90px]",
                    dark ? "bg-brand-600/40" : "bg-gold-200/50",
                  )}
                  aria-hidden
                />
                <span
                  className={cn(
                    "flex size-12 items-center justify-center rounded-2xl ring-1",
                    dark ? "bg-white/10 text-gold-300 ring-white/15" : "bg-brand-50 text-brand-600 ring-brand-100",
                  )}
                >
                  <p.icon className="size-6" aria-hidden />
                </span>
                <p className={cn("mt-6 eyebrow", dark && "text-gold-300")}>{p.eyebrow}</p>
                <h3 className={cn("mt-2 text-2xl font-semibold tracking-tight sm:text-3xl", dark ? "text-white" : "text-zinc-900")}>{p.title}</h3>
                <p className={cn("mt-3 leading-relaxed", dark ? "text-zinc-300" : "text-zinc-600")}>{p.body}</p>
                <CheckList items={p.outcomes} tone={dark ? "dark" : "light"} className="mt-7 mb-9" />
                <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <TrackedLink
                    href={p.primary.href}
                    trackId={p.primary.trackId}
                    className={buttonVariants({ variant: dark ? "gold" : "primary", size: "lg", className: "w-full sm:w-auto" })}
                  >
                    {p.primary.label} <ArrowRight aria-hidden />
                  </TrackedLink>
                  <TrackedLink
                    href={p.secondary.href}
                    trackId={p.secondary.trackId}
                    className={buttonVariants({
                      variant: dark ? "ghost" : "outline",
                      size: "lg",
                      className: cn("w-full sm:w-auto", dark && "text-white ring-1 ring-white/15 hover:bg-white/10 hover:text-white"),
                    })}
                  >
                    {p.secondary.label}
                  </TrackedLink>
                </div>
              </article>
            );
          })}
        </div>
      </Section>

      {/* (c) Outcomes */}
      <Section labelledBy="outcomes-heading">
        <SectionHeading
          id="outcomes-heading"
          eyebrow="What you'll be able to do"
          title={
            <>
              Skills you&apos;ll use <Accent>every single week</Accent>
            </>
          }
          description="No theory for its own sake. Each skill is something you can put to work the same day you learn it."
        />
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {OUTCOMES.map((o) => (
            <li key={o.title}>
              <FeatureCard icon={o.icon} title={o.title}>
                {o.body}
              </FeatureCard>
            </li>
          ))}
        </ul>
      </Section>

      {/* (d) Offer ladder */}
      <Section tone="muted" labelledBy="offers-heading">
        <SectionHeading
          id="offers-heading"
          eyebrow="Ways to work with us"
          title={
            <>
              Start free. Go as far as <Accent>you want.</Accent>
            </>
          }
          description="Every step stands on its own — take what you need, when you need it."
        />
        <div className="mt-16">
          <OfferLadder courses={courses} strategyCall={strategyCall} coaching={coaching} starterKitSummary={kitSummary(starterKit)} />
        </div>
      </Section>

      {/* (e) How it works */}
      <Section labelledBy="how-heading">
        <SectionHeading
          id="how-heading"
          eyebrow="How it works"
          title={
            <>
              Assess. Learn. <Accent>Implement.</Accent>
            </>
          }
          description="A simple path from curious to confident — at whatever pace suits you."
        />
        <ol className="relative mt-16 grid gap-6 md:grid-cols-3">
          <span
            className="pointer-events-none absolute top-8 right-[16%] left-[16%] hidden border-t-2 border-dashed border-brand-200 md:block"
            aria-hidden
          />
          {HOW_IT_WORKS.map((step, i) => (
            <li key={step.title} className="relative flex flex-col items-center rounded-2xl px-4 text-center">
              <span className="relative flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lift ring-8 ring-white">
                <step.icon className="size-7" aria-hidden />
                <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-gold-400 text-xs font-bold text-ink ring-2 ring-white">
                  {i + 1}
                </span>
              </span>
              <h3 className="mt-6 text-xl font-semibold tracking-tight text-zinc-900">{step.title}</h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-600">{step.body}</p>
              <TrackedLink
                href={step.link.href}
                trackId={step.link.trackId}
                className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                {step.link.label} <ArrowRight className="size-4" aria-hidden />
              </TrackedLink>
            </li>
          ))}
        </ol>
      </Section>

      {/* (f) Assessment CTA band */}
      <CtaBand
        headingId="assessment-cta-heading"
        eyebrow="Free AI Readiness Assessment"
        title={
          <>
            How ready are you for AI? Find out in <Accent tone="gold">three minutes.</Accent>
          </>
        }
        description="Answer a few quick questions about your goals and how you work today. You'll get your readiness score, a personalised action plan and your best next step."
        primary={{ href: "/assessment", label: "Take the free assessment", trackId: "home_band_assessment" }}
        secondary={{ href: "/book", label: "Or book a free strategy call", trackId: "home_band_book" }}
      >
        <ul className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-2">
          {["Your AI readiness score", "A personalised action plan", "Your best next step"].map((item) => (
            <li key={item} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-sm text-zinc-200 ring-1 ring-white/10">
              <Check className="size-3.5 text-gold-300" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </CtaBand>

      {/* (i) Testimonials — only once real ones are added */}
      <Testimonials />

      {/* (g) FAQ */}
      <Section tone="muted" labelledBy="faq-heading">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading
              id="faq-heading"
              align="left"
              eyebrow="Questions"
              title={
                <>
                  Good questions, <Accent>straight answers</Accent>
                </>
              }
              description="Can't find what you're looking for? We're happy to help."
            />
            <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <TrackedLink href="/contact" trackId="home_faq_contact" className={buttonVariants({ variant: "outline" })}>
                Contact us
              </TrackedLink>
              <TrackedLink href="/book" trackId="home_faq_book" className={buttonVariants({ variant: "ghost" })}>
                Book a free call <ArrowRight aria-hidden />
              </TrackedLink>
            </div>
          </div>
          <Faq items={FAQS} />
        </div>
      </Section>

      {/* (h) Final CTA */}
      <CtaCard
        headingId="final-cta-heading"
        title={
          <>
            Ready to make AI work <Accent tone="gold">for you?</Accent>
          </>
        }
        description="Start with the free assessment, grab the Starter Kit, or talk it through with us. Whichever you choose, you'll leave with a clear next step."
        actions={[
          { href: "/assessment", label: "Take the free assessment", trackId: "home_final_assessment" },
          { href: "/free-guide", label: "Get the free Starter Kit", trackId: "home_final_guide" },
          { href: "/book", label: "Book a free call", trackId: "home_final_book" },
        ]}
      />
    </>
  );
}
