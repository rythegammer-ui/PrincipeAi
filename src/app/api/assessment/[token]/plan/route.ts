import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { claimPlanGeneration, getSubmissionByToken, loadOffer, loadStrategyCall, withPrefill } from "@/app/(marketing)/assessment/data";
import { aiEnabled, aiStream, textStreamResponse } from "@/lib/ai";
import {
  buildFallbackPlan,
  buildPlanPrompt,
  parseAnswers,
  PLAN_SYSTEM_PROMPT,
  resultFromStored,
  shouldStorePlan,
  submittedContact,
} from "@/lib/assessment";
import { rateLimitByIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
// Plan generation streams for well under a minute; stay within every Vercel plan's limit.
export const maxDuration = 60;

function streamText(text: string): ReadableStream<Uint8Array> {
  const bytes = new TextEncoder().encode(text);
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

/**
 * Streams the personalized AI action plan for a results token.
 * Returns the stored plan instantly when it exists; otherwise generates it with Claude
 * (or the deterministic fallback when AI isn't configured) and stores the first complete one.
 * A fallback streamed because Claude was briefly unavailable is not stored, so the next visit retries.
 * Claude generations are single-flight per submission and capped per submission, per IP and per day
 * (see PLAN_LIMITS); past a cap the deterministic plan is streamed instead, unsaved.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const limit = await rateLimitByIp("assessment-plan", 20, 10 * 60);
  if (!limit.ok) return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429 });

  const row = await getSubmissionByToken(token);
  if (!row) return NextResponse.json({ error: "We couldn't find these results." }, { status: 404 });
  const { submission, contact } = row;

  if (submission.plan) return textStreamResponse(streamText(submission.plan));

  const parsed = parseAnswers(submission.answers);
  if (!parsed.ok) return NextResponse.json({ error: "These results can't generate a plan." }, { status: 422 });
  const answers = parsed.answers;
  const result = resultFromStored(answers, submission);

  // Only what was typed in with this submission: the CRM contact's stored name may be someone else's.
  const entered = submittedContact(submission.answers);
  const [offer, call] = await Promise.all([loadOffer(result.recommendation), loadStrategyCall()]);
  const person = { name: entered.name, email: contact.email };
  // On-site links stay relative (and booking links pre-filled) in the fallback plan.
  const fallbackText = buildFallbackPlan(answers, result, {
    name: entered.name,
    offerTitle: offer.title,
    offerUrl: withPrefill(offer.href, person),
    strategyCallUrl: withPrefill(call.href, person),
  });

  if (aiEnabled()) {
    const claim = await claimPlanGeneration(submission.id, rateLimitByIp);
    if (!claim.ok) {
      if (claim.reason === "daily_limit") console.warn("[assessment] daily AI plan limit reached; serving the standard plan");
      return textStreamResponse(streamText(fallbackText));
    }
  }

  const ctx = {
    name: entered.name,
    company: entered.company,
    offerTitle: offer.title,
    offerPrice: offer.priceLabel ?? undefined,
    // The plan is only ever shown on this site, so links stay relative: untrusted-Markdown rendering keeps
    // relative links clickable whatever the deployment's site URL (absoluteUrl may fall back to VERCEL_URL).
    offerUrl: offer.href,
    strategyCallUrl: call.href,
  };

  const stream = aiStream({
    system: PLAN_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildPlanPrompt(answers, result, ctx) }],
    effort: "medium",
    maxTokens: 8000,
    fallbackText,
    onComplete: async (text, info) => {
      if (!shouldStorePlan(text, info, aiEnabled())) return;
      const plan = text.trim();
      const db = await getDb();
      await db
        .update(schema.quizSubmissions)
        .set({ plan })
        .where(and(eq(schema.quizSubmissions.id, submission.id), isNull(schema.quizSubmissions.plan)));
    },
  });

  return textStreamResponse(stream);
}
