import { ArrowDown, BookOpenCheck, BriefcaseBusiness, CalendarRange, Coffee, Library, ShieldCheck, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { StarterKit } from "@/content/starter-kit";
import { pluralize } from "@/lib/utils";
import { CopyButton } from "./copy-button";
import { Faq, type FaqItem } from "./faq";
import { CheckList, FeatureCard } from "./feature-card";
import type { ReferringAgent } from "./agent-follow-up-consent";
import { OptInForm } from "./opt-in-form";
import { PageHero } from "./page-hero";
import { Accent, Section, SectionHeading } from "./section";
import { kitStats } from "./starter-kit-utils";


const AUDIENCE = [
  {
    icon: Coffee,
    title: "Curious beginners",
    body: "You keep hearing about AI and want a calm, practical way in — no jargon, no coding, no pressure.",
  },
  {
    icon: CalendarRange,
    title: "Busy professionals & parents",
    body: "You want to write, plan, research and decide faster, and win back time for the things that matter.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Business owners & teams",
    body: "You want quick, safe wins in marketing, customer service and admin before investing in bigger systems.",
  },
];

const FAQS: FaqItem[] = [
  {
    q: "Is it really free?",
    a: "Yes. Enter your name and email and you'll get instant access to the full kit. There's no card required and nothing to cancel.",
  },
  {
    q: "Do I need to pay for an AI tool?",
    a: "No. Every prompt works with the free versions of popular AI assistants like ChatGPT, Claude or Gemini. Paid plans can be faster or handle longer documents, but you don't need one to start.",
  },
  {
    q: "What will you do with my email?",
    a: "We'll send you the kit plus a short series of practical tips to help you use it. You can unsubscribe with one click at any time, and we never sell your details.",
  },
  {
    q: "I'm not technical. Is this for me?",
    a: "Absolutely — it was written for you. Everything is in plain English, and each day's task is short enough to fit around a busy schedule.",
  },
];

/** The /free-guide opt-in landing page, driven by the Starter Kit content (any array may be empty). */
export function FreeGuideLanding({ kit, referrer }: { kit: StarterKit; referrer?: ReferringAgent | null }) {
  const stats = kitStats(kit);
  const included = [
    stats.days > 0 && {
      icon: CalendarRange,
      title: `A ${stats.days}-day quick-start plan`,
      body: "One small, practical win each day, so using AI becomes a habit rather than a novelty.",
    },
    stats.prompts > 0 && {
      icon: Library,
      title: `${stats.prompts} copy-paste prompts`,
      body:
        stats.categories > 0
          ? `Organised into ${pluralize(stats.categories, "category", "categories")} for everyday life and work — just fill in the blanks.`
          : "Ready-made wording for everyday life and work — just fill in the blanks.",
    },
    stats.tips > 0 && {
      icon: ShieldCheck,
      title: `${pluralize(stats.tips, "safety & quality tip")}`,
      body: "How to protect your privacy, check facts and get better answers every time.",
    },
  ].filter((x): x is { icon: typeof CalendarRange; title: string; body: string } => Boolean(x));
  const whatsInside =
    included.length > 0
      ? included
      : [
          { icon: CalendarRange, title: "A day-by-day quick-start plan", body: "Small, practical wins that make AI part of your routine." },
          { icon: Library, title: "Copy-paste prompts", body: "Ready-made wording for everyday life and work — just fill in the blanks." },
          { icon: ShieldCheck, title: "Safety & quality tips", body: "Protect your privacy, check facts and get better answers." },
        ];

  const samplePrompt = kit.promptCategories.find((c) => c.prompts.length)?.prompts[0] ?? (kit.days[0] ? { title: kit.days[0].title, prompt: kit.days[0].prompt } : null);

  return (
    <>
      <PageHero
        eyebrow="Free AI Starter Kit"
        title={
          <>
            Start using AI <Accent>this week</Accent> — without the overwhelm
          </>
        }
        description={kit.subtitle}
        aside={
          <div id="get-the-kit" className="relative scroll-mt-24">
            <div className="pointer-events-none absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-400/30 via-transparent to-gold-300/30 blur-xl" aria-hidden />
            <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-lift sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
                  <Sparkles className="size-5" aria-hidden />
                </span>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Get instant access</h2>
                  <p className="text-sm text-zinc-500">Free · opens straight away</p>
                </div>
              </div>
              <OptInForm placement="free-guide" className="mt-6" referrer={referrer} />
            </div>
          </div>
        }
      >
        <ul className="mt-8 space-y-4">
          {whatsInside.map((item) => (
            <li key={item.title} className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                <item.icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block font-semibold text-zinc-900">{item.title}</span>
                <span className="block text-sm leading-relaxed text-zinc-600">{item.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </PageHero>

      <Section tone="muted" labelledBy="inside-heading">
        <SectionHeading
          id="inside-heading"
          eyebrow="A look inside"
          title={
            <>
              Practical from <Accent>day one</Accent>
            </>
          }
          description="No theory, no jargon — just simple daily actions and prompts you can copy, paste and adapt."
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-soft sm:p-8">
            <h3 className="flex items-center gap-2 font-semibold text-zinc-900">
              <BookOpenCheck className="size-5 text-brand-600" aria-hidden />
              {stats.days > 0 ? `Your ${stats.days}-day plan` : "Your quick-start plan"}
            </h3>
            {kit.days.length > 0 ? (
              <ol className="mt-5 divide-y divide-zinc-100">
                {kit.days.map((d) => (
                  <li key={d.day} className="flex gap-4 py-3.5 first:pt-0 last:pb-0">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm font-semibold text-brand-700 tabular-nums">
                      {d.day}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium text-zinc-900">{d.title}</span>
                      <span className="block text-sm leading-relaxed text-zinc-600">{d.goal}</span>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <CheckList
                className="mt-5"
                items={[
                  "Set up a free AI assistant and have your first useful conversation",
                  "Learn the simple prompt formula behind every good answer",
                  "Use AI for writing, planning, learning and decisions",
                  "Build the habit with one small win a day",
                ]}
              />
            )}
          </div>

          <div className="flex flex-col gap-6">
            {kit.promptCategories.length > 0 && (
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-soft sm:p-8">
                <h3 className="flex items-center gap-2 font-semibold text-zinc-900">
                  <Library className="size-5 text-brand-600" aria-hidden />
                  Prompt library
                </h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {kit.promptCategories.map((c) => (
                    <li key={c.category} className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-800 ring-1 ring-brand-100">
                      {c.category}
                      <span className="ml-1.5 text-brand-500 tabular-nums">{c.prompts.length}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {samplePrompt && (
              <div className="relative isolate overflow-hidden rounded-2xl bg-ink p-6 text-white shadow-lift sm:p-8">
                <div className="pointer-events-none absolute -top-16 -right-16 -z-10 size-56 rounded-full bg-brand-600/40 blur-[70px]" aria-hidden />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold tracking-[0.14em] text-gold-300 uppercase">Try one now</p>
                  <CopyButton text={samplePrompt.prompt} tone="dark" srLabel={`Copy prompt: ${samplePrompt.title}`} />
                </div>
                <h3 className="mt-3 font-semibold">{samplePrompt.title}</h3>
                <p className="mt-3 rounded-xl bg-white/[0.06] p-4 font-mono text-[0.8125rem] leading-relaxed whitespace-pre-line text-zinc-200 ring-1 ring-white/10">
                  {samplePrompt.prompt}
                </p>
              </div>
            )}
          </div>
        </div>
      </Section>

      <Section labelledBy="for-heading">
        <SectionHeading id="for-heading" eyebrow="Who it's for" title="Made for real people, not tech experts" />
        <ul className="mt-14 grid gap-5 md:grid-cols-3">
          {AUDIENCE.map((a) => (
            <li key={a.title}>
              <FeatureCard icon={a.icon} title={a.title}>
                {a.body}
              </FeatureCard>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="muted" labelledBy="guide-faq-heading" narrow>
        <SectionHeading id="guide-faq-heading" eyebrow="Questions" title="Before you grab it" />
        <Faq items={FAQS} className="mt-12" />
        <div className="mt-12 text-center">
          <a href="#get-the-kit" className={buttonVariants({ size: "lg" })}>
            Get the free Starter Kit <ArrowDown aria-hidden />
          </a>
        </div>
      </Section>
    </>
  );
}
