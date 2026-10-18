import { ArrowDown, Clock, Compass, FileText, Gauge, Gift, Layers, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { AssessmentQuiz } from "@/components/assessment/assessment-quiz";
import { ButtonLink } from "@/components/ui/button";
import { TIERS } from "@/lib/assessment";

export const metadata: Metadata = {
  title: "Free AI Readiness Assessment",
  description:
    "How ready are you to put AI to work? Answer a few quick questions and get your AI readiness score, your tier and a personalized AI action plan — free, in about 3 minutes.",
  alternates: { canonical: "/assessment" },
  openGraph: {
    title: "Free AI Readiness Assessment · Principe AI",
    description: "Get your AI readiness score and a personalized AI action plan in about 3 minutes.",
    url: "/assessment",
  },
};

const WHAT_YOU_GET = [
  {
    icon: Gauge,
    title: "Your AI readiness score",
    body: "A score out of 100 based on how you use AI today, the tools you know and how clear your goals are.",
  },
  {
    icon: Layers,
    title: "Your readiness tier",
    body: "Explorer, Experimenter, Implementer or Scaler — with your strengths and the gaps worth closing first.",
  },
  {
    icon: FileText,
    title: "A personalized AI action plan",
    body: "Three quick wins with copy-paste prompts, a 30-day roadmap and the tools worth trying, written for your situation.",
  },
  {
    icon: Compass,
    title: "Your recommended next step",
    body: "An honest recommendation — a course, a strategy call or done-with-you help — based on your goals and budget.",
  },
];

const FAQS = [
  {
    q: "Who is the assessment for?",
    a: "Anyone who wants to get more from AI: business owners, team leaders, professionals, and people who simply want AI to make everyday life easier. You don't need any technical background.",
  },
  {
    q: "Is it really free?",
    a: "Yes. The assessment, your score and your action plan are free. If a course or a call would help, we'll suggest one — there's no obligation to take it.",
  },
  {
    q: "How is my plan created?",
    a: "Your score is calculated from your answers. Your action plan is generated from those same answers — using Claude, Anthropic's AI assistant — so it reflects your goals, tools and time drains. As with anything AI writes, use your judgement and double-check anything important.",
  },
  {
    q: "What happens to my information?",
    a: "We use your answers to personalize your results and recommendations, and we email you a private link so you can come back to them. We don't sell your information, and you can unsubscribe from our emails at any time.",
  },
];

export default function AssessmentPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="bg-grid-dark pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]" aria-hidden />
        <div className="glow-brand pointer-events-none absolute inset-x-0 top-0 h-[28rem]" aria-hidden />
        <div className="container-page relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:py-24">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-gold-300 uppercase ring-1 ring-white/15 ring-inset">
              Free AI Readiness Assessment
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              How ready are you to put AI <span className="font-display font-normal text-gold-300 italic">to work?</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-pretty text-zinc-300">
              Answer a few quick questions about how you work today. You&apos;ll get an honest read on where you stand, and a personalized
              plan with prompts you can use this week — whether AI is for your business, your career or your everyday life.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2 text-sm text-zinc-200" aria-label="At a glance">
              <li className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10 ring-inset">
                <Clock className="size-4 text-gold-300" aria-hidden /> 3 minutes
              </li>
              <li className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10 ring-inset">
                <Gift className="size-4 text-gold-300" aria-hidden /> Free
              </li>
              <li className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10 ring-inset">
                <ShieldCheck className="size-4 text-gold-300" aria-hidden /> No tech skills needed
              </li>
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink href="#quiz" variant="gold" size="lg">
                Start the assessment <ArrowDown aria-hidden />
              </ButtonLink>
              <p className="text-sm text-zinc-400">3 minutes · free · instant results</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-lift backdrop-blur-sm sm:p-8">
            <h2 className="text-sm font-semibold tracking-[0.14em] text-zinc-300 uppercase">What you&apos;ll get</h2>
            <ul className="mt-6 space-y-6">
              {WHAT_YOU_GET.map((item) => (
                <li key={item.title} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/20 text-brand-200 ring-1 ring-brand-400/30 ring-inset">
                    <item.icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-semibold text-white">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-400">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="quiz" className="scroll-mt-16 bg-zinc-50 py-12 sm:py-20" aria-labelledby="quiz-heading">
        <div className="container-narrow">
          <div className="mb-6 text-center sm:mb-8">
            <p className="eyebrow">The assessment</p>
            <h2 id="quiz-heading" className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              Let&apos;s see where you are <span className="font-display font-normal text-brand-700 italic">today</span>
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-zinc-600">
              There are no wrong answers. Pick whatever is closest — you can go back and change anything before you see your results.
            </p>
          </div>
          <AssessmentQuiz />
        </div>
      </section>

      <section className="bg-white py-20 sm:py-28" aria-labelledby="tiers-heading">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Four stages of AI readiness</p>
            <h2 id="tiers-heading" className="mt-3 text-3xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-4xl">
              Wherever you are, there&apos;s a <span className="font-display font-normal text-brand-700 italic">clear next step</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-600">
              Most people sit somewhere on this path. Your results show which stage fits you best and exactly what will move you forward.
            </p>
          </div>
          <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TIERS.map((tier, i) => (
              <li key={tier.id} className="relative flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700 ring-1 ring-brand-200 ring-inset">
                    {i + 1}
                  </span>
                  <span className="text-xs font-medium text-zinc-500 tabular-nums">
                    {tier.min}–{tier.max}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-zinc-900">{tier.label}</h3>
                <p className="mt-1 text-sm font-medium text-brand-700">{tier.headline}</p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">{tier.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-zinc-200/70 bg-zinc-50 py-20 sm:py-24" aria-labelledby="faq-heading">
        <div className="container-narrow">
          <h2 id="faq-heading" className="text-center text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Questions, answered
          </h2>
          <div className="mt-10 divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-soft">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium text-zinc-900 hover:bg-zinc-50 sm:px-6 [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <span
                    aria-hidden
                    className="flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-zinc-600 sm:px-6">{faq.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-10 text-center">
            <ButtonLink href="#quiz" variant="primary" size="lg">
              Take the assessment
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
