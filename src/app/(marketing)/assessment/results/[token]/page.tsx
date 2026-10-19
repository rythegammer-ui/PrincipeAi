import { ArrowRight, CalendarCheck2, CheckCircle2, Mail, RotateCcw, Sparkles, Target } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NextStepCard } from "@/components/assessment/next-step-card";
import { PlanMarkdown } from "@/components/assessment/plan-markdown";
import { PlanStream } from "@/components/assessment/plan-stream";
import { QuickWinCard } from "@/components/assessment/quick-win-card";
import { ScoreRing } from "@/components/assessment/score-ring";
import { TierScale } from "@/components/assessment/tier-scale";
import { ButtonLink } from "@/components/ui/button";
import { aiEnabled } from "@/lib/ai";
import {
  articleFor,
  type AssessmentResult,
  displayFirstName,
  getTier,
  isRecommendation,
  OFFERS,
  parseAnswers,
  pickQuickWins,
  type Recommendation,
  resultFromStored,
  submittedContact,
  tierForScore,
} from "@/lib/assessment";
import { getSubmissionByToken, loadOffer, loadStrategyCall, withPrefill } from "../../data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your AI readiness results",
  description: "Your AI readiness score, tier and personalized AI action plan.",
  robots: { index: false, follow: false },
};

type View = Pick<AssessmentResult, "score" | "tier" | "recommendation" | "reason" | "strengths" | "gaps" | "quickWins">;

/** Results for a stored submission; degrades to tier defaults if the stored answers can't be read. */
function buildView(submission: { answers: unknown; score: number; tier: string; recommendation: string }): { view: View; canGeneratePlan: boolean } {
  const parsed = parseAnswers(submission.answers);
  if (parsed.ok) return { view: resultFromStored(parsed.answers, submission), canGeneratePlan: true };
  const tier = getTier(submission.tier) ?? tierForScore(submission.score);
  const recommendation: Recommendation = isRecommendation(submission.recommendation) ? submission.recommendation : "ai-essentials";
  return {
    view: {
      score: submission.score,
      tier,
      recommendation,
      reason: OFFERS[recommendation].blurb,
      strengths: tier.strengths,
      gaps: tier.gaps,
      quickWins: pickQuickWins({ focus: "both", timeDrains: [] }),
    },
    canGeneratePlan: false,
  };
}

export default async function AssessmentResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ sent?: string | string[] }>;
}) {
  const [{ token }, sp] = await Promise.all([params, searchParams]);
  // The quiz adds ?sent=0 when no results email went out (several submissions for one address in a day).
  const emailed = (Array.isArray(sp.sent) ? sp.sent[0] : sp.sent) !== "0";
  const row = await getSubmissionByToken(token);
  if (!row) notFound();
  const { submission, contact } = row;
  const { view, canGeneratePlan } = buildView(submission);
  const [offer, call] = await Promise.all([loadOffer(view.recommendation), loadStrategyCall()]);

  // Greet and pre-fill with the name typed into this submission, never the CRM contact's stored name:
  // anyone can submit someone else's email address.
  const entered = submittedContact(submission.answers);
  const person = { name: entered.name, email: contact.email };
  const first = displayFirstName(entered.name);
  const offerHref = withPrefill(offer.href, person);
  const callHref = withPrefill(call.href, person);
  // Without an Anthropic key the plan is rule-based, so don't present it as AI-written.
  const aiOn = aiEnabled();

  return (
    <>
      {/* Score */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="bg-grid-dark pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]" aria-hidden />
        <div className="glow-brand pointer-events-none absolute inset-0" aria-hidden />
        <div className="container-page relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
          <div className="animate-fade-up order-2 min-w-0 lg:order-1">
            <p className="text-xs font-semibold tracking-[0.14em] text-gold-300 uppercase">Your AI readiness results</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
              {first ? `${first}, you're` : "You're"} {articleFor(view.tier.label)}{" "}
              <span className="font-display font-normal text-gold-300 italic">{view.tier.label}</span>
            </h1>
            <p className="mt-2 text-lg font-medium text-zinc-200">{view.tier.headline}</p>
            <p className="mt-4 max-w-2xl leading-relaxed text-pretty text-zinc-300">{view.tier.description}</p>
            <TierScale current={view.tier.id} className="mt-8 max-w-xl" />
          </div>
          <div className="order-1 flex justify-center lg:order-2">
            <ScoreRing score={view.score} />
          </div>
        </div>
      </section>

      {/* Strengths & gaps */}
      <section className="bg-white py-14 sm:py-20" aria-labelledby="snapshot-heading">
        <div className="container-page">
          <h2 id="snapshot-heading" className="sr-only">
            Your strengths and gaps
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-soft sm:p-8">
              <h3 className="flex items-center gap-2.5 text-lg font-semibold text-zinc-900">
                <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 ring-inset">
                  <CheckCircle2 className="size-5" aria-hidden />
                </span>
                What&apos;s working for you
              </h3>
              <ul className="mt-5 space-y-3">
                {view.strengths.map((s) => (
                  <li key={s} className="flex gap-3 text-sm leading-relaxed text-zinc-700">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-soft sm:p-8">
              <h3 className="flex items-center gap-2.5 text-lg font-semibold text-zinc-900">
                <span className="flex size-9 items-center justify-center rounded-xl bg-gold-50 text-gold-600 ring-1 ring-gold-200 ring-inset">
                  <Target className="size-5" aria-hidden />
                </span>
                Where to focus next
              </h3>
              <ul className="mt-5 space-y-3">
                {view.gaps.map((g) => (
                  <li key={g} className="flex gap-3 text-sm leading-relaxed text-zinc-700">
                    <ArrowRight className="mt-0.5 size-4 shrink-0 text-gold-500" aria-hidden />
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Quick wins */}
      <section className="bg-zinc-50 py-14 sm:py-20" aria-labelledby="wins-heading">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="eyebrow">Start this week</p>
            <h2 id="wins-heading" className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              Your 3 quick wins
            </h2>
            <p className="mt-3 leading-relaxed text-zinc-600">
              Copy a prompt into Claude, ChatGPT or any AI assistant, replace the <span className="font-mono text-sm">[bracketed]</span> parts
              with your details, and see what comes back. Remove anything confidential before you paste.
            </p>
          </div>
          <ol className="mt-8 grid gap-5 lg:grid-cols-3">
            {view.quickWins.map((win, i) => (
              <QuickWinCard key={win.id} win={win} index={i} />
            ))}
          </ol>
        </div>
      </section>

      {/* Recommended next step */}
      <section className="bg-white py-14 sm:py-20" aria-labelledby="next-step-heading">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="eyebrow">Your recommended next step</p>
            <h2 id="next-step-heading" className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              Where to go <span className="font-display font-normal text-brand-700 italic">from here</span>
            </h2>
          </div>
          <div className="mt-8">
            <NextStepCard offer={offer} offerHref={offerHref} reason={view.reason} strategyCallHref={callHref} strategyCallMinutes={call.durationMin} />
          </div>
        </div>
      </section>

      {/* Personalized plan */}
      <section className="bg-zinc-50 py-14 sm:py-20" aria-labelledby="plan-heading">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
          <div className="text-center">
            <p className="eyebrow inline-flex items-center gap-1.5">
              <Sparkles className="size-3.5" aria-hidden /> Written for you
            </p>
            <h2 id="plan-heading" className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              Your personalized AI action plan
            </h2>
          </div>
          <article className="mt-8 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-soft sm:p-10">
            {submission.plan ? (
              <PlanMarkdown>{submission.plan}</PlanMarkdown>
            ) : canGeneratePlan ? (
              <PlanStream token={submission.resultToken} />
            ) : (
              <p className="text-zinc-600">
                We couldn&apos;t build a plan from these results. Book a free strategy call and we&apos;ll put one together with you.
              </p>
            )}
          </article>
          <p className="mt-4 text-center text-xs leading-relaxed text-zinc-500">
            Generated from your answers.{aiOn ? " AI can make mistakes — use your judgement and double-check anything important." : ""}
          </p>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative overflow-hidden bg-ink py-16 text-white sm:py-20">
        <div className="glow-brand pointer-events-none absolute inset-0" aria-hidden />
        <div className="container-narrow relative text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
            Want help putting this plan <span className="font-display font-normal text-gold-300 italic">into action?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-zinc-300">
            Book a free AI strategy call. We&apos;ll walk through your results together and agree the next steps that make sense for you.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href={callHref} variant="gold" size="lg" className="w-full sm:w-auto">
              <CalendarCheck2 aria-hidden /> Book a free AI strategy call
            </ButtonLink>
            <ButtonLink href={offerHref} variant="white" size="lg" className="h-auto min-h-12 w-full py-2.5 text-center whitespace-normal sm:w-auto">
              {offer.cta}
            </ButtonLink>
          </div>
          <div className="mt-10 flex flex-col items-center justify-center gap-x-6 gap-y-2 text-sm text-zinc-400 sm:flex-row">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="size-4" aria-hidden /> {emailed ? "We've emailed you a link to this page." : "Bookmark this page to come back to your results."}
            </span>
            <Link href="/assessment#quiz" className="inline-flex min-h-11 items-center gap-1.5 font-medium text-zinc-200 underline-offset-4 hover:text-white hover:underline">
              <RotateCcw className="size-4" aria-hidden /> Retake the assessment
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
