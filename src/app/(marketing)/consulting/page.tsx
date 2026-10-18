import {
  ArrowRight,
  BookOpenText,
  Bot,
  CalendarCheck,
  ClipboardList,
  Compass,
  GraduationCap,
  Hammer,
  LifeBuoy,
  Mail,
  Megaphone,
  PenTool,
  Puzzle,
  Repeat2,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Workflow,
} from "lucide-react";
import type { Metadata } from "next";
import { ApplicationForm } from "@/components/marketing/application-form";
import { Faq, type FaqItem } from "@/components/marketing/faq";
import { CheckList, FeatureCard } from "@/components/marketing/feature-card";
import { PageHero } from "@/components/marketing/page-hero";
import { Accent, Section, SectionHeading } from "@/components/marketing/section";
import { TrackedLink } from "@/components/marketing/tracked-link";
import { buttonVariants } from "@/components/ui/button";
import { site } from "@/config/site";
import { getActiveMeetingType } from "@/lib/scheduling";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "AI Implementation for Business",
  description:
    "Done-with-you AI implementation: AI assistants, workflow automations, content systems, sales follow-up and team training — scoped, built and supported for your business. Apply for a free discovery call.",
  alternates: { canonical: "/consulting" },
  openGraph: {
    title: "Done-with-you AI implementation · Principe AI",
    description: "We design, build and hand over working AI systems for your business — with your team trained to run them.",
  },
};

const PROBLEMS = [
  {
    icon: Puzzle,
    title: "Too many tools, no plan",
    body: "New AI apps launch every week. Without a clear plan, it's hard to know which ones are worth your time, money and data.",
  },
  {
    icon: Repeat2,
    title: "Experiments that never ship",
    body: "A few clever prompts and a trial or two — but nothing that runs reliably inside the business day after day.",
  },
  {
    icon: ShieldAlert,
    title: "A team that's unsure — or unsafe",
    body: "Some people avoid AI entirely while others paste in customer data. Neither gets you results, and one creates real risk.",
  },
];

const SERVICES = [
  {
    icon: Bot,
    title: "AI assistants & chatbots",
    body: "Website and customer-facing assistants that know your services, policies and FAQs — answering questions, qualifying leads and booking calls.",
  },
  {
    icon: Workflow,
    title: "Workflow automations",
    body: "AI connected to your inbox, forms, CRM and documents, so routine sorting, summarising, updating and routing happens on its own.",
  },
  {
    icon: PenTool,
    title: "Content systems",
    body: "Turn your expertise into a steady flow of on-brand posts, newsletters and articles — with you approving the final word.",
  },
  {
    icon: TrendingUp,
    title: "Sales & follow-up automation",
    body: "Instant replies to new enquiries, personalised follow-ups, call summaries and CRM updates, so no lead slips through the cracks.",
  },
  {
    icon: BookOpenText,
    title: "Internal knowledge assistants",
    body: "One place for your team to ask about processes, documents and past work — and get clear answers that point to the source.",
  },
  {
    icon: GraduationCap,
    title: "Team AI training & policy",
    body: "Hands-on workshops, practical playbooks and a clear AI use policy, so everyone uses AI confidently and responsibly.",
  },
];

const PROCESS = [
  { icon: Compass, title: "Discovery", body: "A free call to understand your goals, workflows and tools — and whether AI is genuinely the right fix." },
  { icon: ClipboardList, title: "Blueprint", body: "A written plan with the highest-value opportunities, the recommended solution, a timeline and a clear quote." },
  { icon: Hammer, title: "Build", body: "We build and test with your real workflows and data, keeping you in the loop and approving each step." },
  { icon: GraduationCap, title: "Train", body: "Your team learns how to use, check and improve the system, with simple written guides to keep." },
  { icon: LifeBuoy, title: "Support", body: "We monitor and refine what's live, and help you expand what's working as your business grows." },
];

const ENGAGEMENTS = [
  {
    icon: Target,
    name: "Quick-start build",
    body: "One focused system — such as a website assistant or a lead follow-up automation — designed, built and launched.",
    bestFor: "Getting a first, visible AI win live",
    points: ["Single, well-defined use case", "Set up around your existing tools", "Handover session and written guide"],
  },
  {
    icon: Sparkles,
    name: "Implementation project",
    body: "A connected set of assistants and automations across several parts of your business, plus training for your team.",
    bestFor: "Businesses ready to transform a whole workflow",
    points: ["Discovery and written blueprint", "Phased build so value arrives early", "Team training and AI use policy"],
    featured: true,
  },
  {
    icon: LifeBuoy,
    name: "Ongoing AI partner",
    body: "Continued improvements, new automations and on-call advice as your needs — and the technology — evolve.",
    bestFor: "Teams that want a long-term AI partner",
    points: ["Regular check-ins and improvements", "New use cases as you grow", "Advice on new tools before you buy"],
  },
];

const FAQS: FaqItem[] = [
  {
    q: "Do we need technical staff to work with you?",
    a: "No. We handle the technical side and explain everything in plain English. You bring the knowledge of your business; we'll make sure your team is confident running what we build.",
  },
  {
    q: "Which AI tools and platforms do you use?",
    a: "We choose tools to fit your business rather than forcing one platform — typically leading AI models such as Claude or ChatGPT, automation platforms, and the software you already use. Wherever possible, systems are set up in accounts your business owns.",
  },
  {
    q: "How much does implementation cost?",
    a: "It depends on the scope, so we don't publish fixed prices. After the discovery call you'll receive a written blueprint with a clear quote before any work begins. If a course or coaching would serve you better, we'll say so.",
  },
  {
    q: "How long does a project take?",
    a: "That depends on what we're building, and you'll see a timeline in your blueprint before you commit. Larger projects are split into phases so you start seeing value early instead of waiting for one big launch.",
  },
  {
    q: "How do you handle our data and privacy?",
    a: "We agree up front which information AI may and may not use, give each system only the access it needs, and work within the data policies of the AI providers involved. Sensitive data handling is part of the blueprint, not an afterthought.",
  },
  {
    q: "Can we just get training for our team?",
    a: "Yes. Team workshops and AI use policies are available on their own. Mention it in your application and we'll tailor the discovery call to training.",
  },
];

function minutesLabel(min: number): string {
  if (min < 60) return `${min}-minute`;
  const h = min / 60;
  return Number.isInteger(h) ? `${h}-hour` : `${min}-minute`;
}

export default async function ConsultingPage() {
  const discovery = await getActiveMeetingType("implementation-discovery");
  const discoveryCall = discovery ? `a ${discovery.priceCents === 0 ? "free " : ""}${minutesLabel(discovery.durationMin)} discovery call` : null;

  return (
    <>
      <PageHero
        tone="dark"
        eyebrow="Done-with-you AI implementation"
        title={
          <>
            We build the AI systems your business <Accent tone="gold">runs on.</Accent>
          </>
        }
        description="From customer-facing assistants to behind-the-scenes automations, we design, build and launch practical AI systems — then train your team to run them with confidence."
        aside={<RoadmapVisual />}
      >
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <TrackedLink href="#apply" trackId="consulting_hero_apply" className={buttonVariants({ variant: "gold", size: "lg", className: "w-full sm:w-auto" })}>
            Apply for a discovery call <ArrowRight aria-hidden />
          </TrackedLink>
          <a
            href="#services"
            className={buttonVariants({ variant: "ghost", size: "lg", className: "w-full text-white ring-1 ring-white/15 hover:bg-white/10 hover:text-white sm:w-auto" })}
          >
            See what we build
          </a>
        </div>
        <p className="mt-6 text-sm text-zinc-400">Custom-scoped for your business · Clear quote before any work begins</p>
      </PageHero>

      <Section labelledBy="problem-heading">
        <SectionHeading
          id="problem-heading"
          eyebrow="The problem"
          title={
            <>
              AI is everywhere. Results <Accent>aren&apos;t — yet.</Accent>
            </>
          }
          description="Most businesses know AI could save them time and money. The hard part is turning that potential into systems that work every day."
        />
        <ul className="mt-14 grid gap-5 md:grid-cols-3">
          {PROBLEMS.map((p) => (
            <li key={p.title}>
              <FeatureCard icon={p.icon} title={p.title}>
                {p.body}
              </FeatureCard>
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-10 max-w-2xl text-center text-lg leading-relaxed text-zinc-700">
          We close that gap: we find the opportunities that matter most, build the systems properly, and make sure your people can use them.
        </p>
      </Section>

      <Section id="services" tone="muted" labelledBy="services-heading">
        <SectionHeading
          id="services-heading"
          eyebrow="What we build"
          title={
            <>
              Practical AI, built around <Accent>how you work</Accent>
            </>
          }
          description="Every system is tailored to your business, connected to the tools you already use, and designed to keep a human in control."
        />
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <li key={s.title}>
              <FeatureCard icon={s.icon} title={s.title}>
                {s.body}
              </FeatureCard>
            </li>
          ))}
        </ul>
      </Section>

      <Section labelledBy="process-heading">
        <SectionHeading
          id="process-heading"
          eyebrow="How we work"
          title={
            <>
              A clear process, <Accent>start to finish</Accent>
            </>
          }
          description="You always know what's happening, what it costs and what comes next."
        />
        <ol className="relative mt-16 grid gap-8 lg:grid-cols-5 lg:gap-6">
          <span className="pointer-events-none absolute top-7 right-[10%] left-[10%] hidden h-px bg-gradient-to-r from-brand-200 via-brand-300 to-brand-200 lg:block" aria-hidden />
          {PROCESS.map((step, i) => (
            <li key={step.title} className="relative flex gap-4 lg:flex-col lg:items-center lg:text-center">
              {i < PROCESS.length - 1 && <span className="absolute top-14 bottom-[-2rem] left-7 w-px bg-brand-100 lg:hidden" aria-hidden />}
              <span className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-soft ring-1 ring-brand-200">
                <step.icon className="size-6" aria-hidden />
              </span>
              <div className="lg:mt-5">
                <p className="text-xs font-semibold tracking-[0.14em] text-brand-600 uppercase">Step {i + 1}</p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="muted" labelledBy="engagements-heading">
        <SectionHeading
          id="engagements-heading"
          eyebrow="Ways to engage"
          title={
            <>
              Start small or go <Accent>all in</Accent>
            </>
          }
          description="Every engagement is scoped to your goals. You'll receive a custom quote after your discovery call, before any work begins."
        />
        <ul className="mt-14 grid gap-6 lg:grid-cols-3">
          {ENGAGEMENTS.map((e) => (
            <li
              key={e.name}
              className={cn(
                "relative flex flex-col rounded-2xl p-6 sm:p-8",
                e.featured ? "bg-ink text-white shadow-lift ring-1 ring-brand-500/30" : "border border-zinc-200/80 bg-white shadow-soft",
              )}
            >
              {e.featured && (
                <span className="absolute -top-3 left-6 rounded-full bg-gold-400 px-3 py-1 text-xs font-semibold text-ink shadow-sm">Most comprehensive</span>
              )}
              <span
                className={cn(
                  "flex size-11 items-center justify-center rounded-xl ring-1",
                  e.featured ? "bg-white/10 text-gold-300 ring-white/15" : "bg-brand-50 text-brand-600 ring-brand-100",
                )}
              >
                <e.icon className="size-5" aria-hidden />
              </span>
              <h3 className={cn("mt-5 text-xl font-semibold tracking-tight", e.featured ? "text-white" : "text-zinc-900")}>{e.name}</h3>
              <p className={cn("mt-2 text-sm leading-relaxed", e.featured ? "text-zinc-300" : "text-zinc-600")}>{e.body}</p>
              <p className={cn("mt-4 text-sm", e.featured ? "text-zinc-300" : "text-zinc-700")}>
                <span className={cn("font-semibold", e.featured ? "text-gold-300" : "text-brand-700")}>Best for: </span>
                {e.bestFor}
              </p>
              <CheckList items={e.points} tone={e.featured ? "dark" : "light"} className="mt-5 mb-8" />
              <div className={cn("mt-auto border-t pt-5", e.featured ? "border-white/10" : "border-zinc-100")}>
                <p className={cn("text-lg font-semibold", e.featured ? "text-white" : "text-zinc-900")}>Custom quote</p>
                <p className={cn("text-sm", e.featured ? "text-zinc-400" : "text-zinc-500")}>after a free discovery call</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section labelledBy="consulting-faq-heading" narrow>
        <SectionHeading id="consulting-faq-heading" eyebrow="Questions" title="Implementation FAQ" />
        <Faq items={FAQS} className="mt-12" />
      </Section>

      <section id="apply" aria-labelledby="apply-heading" className="relative isolate scroll-mt-16 overflow-hidden bg-ink py-20 text-white sm:py-28">
        <div className="bg-grid-dark pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_left,black,transparent_70%)]" aria-hidden />
        <div className="pointer-events-none absolute -top-40 -left-40 -z-10 size-[32rem] rounded-full bg-brand-600/35 blur-[120px]" aria-hidden />
        <div className="container-page grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-gold-300 uppercase">Apply</p>
            <h2 id="apply-heading" className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Tell us what you&apos;d like AI to <Accent tone="gold">take off your plate</Accent>
            </h2>
            <p className="mt-4 leading-relaxed text-zinc-300">
              A few quick questions help us come to the call prepared, so we can spend the time on your business — not on basics.
            </p>
            <ol className="mt-10 space-y-6">
              {[
                { icon: ClipboardList, title: "Share a few details", body: "Takes about two minutes." },
                {
                  icon: CalendarCheck,
                  title: discoveryCall ? `Book ${discoveryCall}` : "We'll be in touch",
                  body: discoveryCall ? "Pick a time that suits you straight after applying." : "We'll email you to arrange a discovery call.",
                },
                { icon: Megaphone, title: "Get your blueprint", body: "A clear plan, timeline and quote — with no obligation." },
              ].map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-gold-300 ring-1 ring-white/10">
                    <s.icon className="size-5" aria-hidden />
                    <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-brand-500 text-[0.6875rem] font-bold text-white">
                      {i + 1}
                    </span>
                  </span>
                  <span>
                    <span className="block font-semibold text-white">{s.title}</span>
                    <span className="block text-sm text-zinc-400">{s.body}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-10 flex items-center gap-2 text-sm text-zinc-400">
              <Mail className="size-4 text-zinc-500" aria-hidden />
              Prefer email?{" "}
              <a href={`mailto:${site.contactEmail}`} className="font-medium text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
                {site.contactEmail}
              </a>
            </p>
          </div>
          <div className="rounded-3xl bg-white p-6 text-zinc-900 shadow-lift sm:p-8">
            <ApplicationForm contactEmail={site.contactEmail} discoveryCall={discoveryCall} />
          </div>
        </div>
      </section>
    </>
  );
}

/** Decorative "AI roadmap" card for the hero (HTML/CSS only). */
function RoadmapVisual() {
  const rows = [
    { icon: Bot, label: "Website assistant answers FAQs and books calls", stage: "Live", tone: "text-emerald-300 bg-emerald-400/10 ring-emerald-400/20" },
    { icon: TrendingUp, label: "New enquiries get a personal reply in minutes", stage: "Live", tone: "text-emerald-300 bg-emerald-400/10 ring-emerald-400/20" },
    { icon: Workflow, label: "Call notes summarised straight into the CRM", stage: "Building", tone: "text-gold-300 bg-gold-400/10 ring-gold-300/25" },
    { icon: GraduationCap, label: "Team workshop and AI use policy", stage: "Planned", tone: "text-brand-200 bg-brand-400/10 ring-brand-300/25" },
  ];
  return (
    <div
      role="img"
      aria-label="Illustration: an example AI roadmap with a website assistant and lead replies live, CRM call summaries being built, and team training planned."
      className="relative mx-auto w-full max-w-md select-none lg:max-w-none"
    >
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-500/30 via-transparent to-gold-400/20 blur-2xl" aria-hidden />
      <div className="rounded-[1.4rem] bg-white/[0.06] p-5 ring-1 ring-white/15 backdrop-blur sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-white">Your AI roadmap</p>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[0.6875rem] font-medium text-zinc-300">Example</span>
        </div>
        <ul className="mt-5 space-y-3">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center gap-3 rounded-xl bg-ink/60 p-3 ring-1 ring-white/10">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.08] text-white">
                <r.icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1 text-[0.8125rem] leading-snug text-zinc-200">{r.label}</span>
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium ring-1", r.tone)}>{r.stage}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-center gap-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 p-3.5">
          <Sparkles className="size-4 shrink-0 text-gold-300" />
          <p className="text-[0.8125rem] font-medium text-white">Next: review progress together and pick the next win</p>
        </div>
      </div>
    </div>
  );
}
