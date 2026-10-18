import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { getSubmissionByToken, loadOffer, loadStrategyCall, withPrefill } from "@/app/(marketing)/assessment/data";
import { aiStream, REFUSAL_MESSAGE, textStreamResponse } from "@/lib/ai";
import { buildFallbackPlan, buildPlanPrompt, parseAnswers, PLAN_SYSTEM_PROMPT, resultFromStored } from "@/lib/assessment";
import { rateLimitByIp } from "@/lib/rate-limit";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";
// Plan generation streams for well under a minute; stay within every Vercel plan's limit.
export const maxDuration = 60;

/** Marker aiStream appends when a stream breaks part-way — never persist those plans. */
const INTERRUPTED_MARKER = "the connection was interrupted";

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

  const [offer, call] = await Promise.all([loadOffer(result.recommendation), loadStrategyCall()]);
  const person = { name: contact.name, email: contact.email };
  const ctx = {
    name: contact.name,
    company: contact.company,
    offerTitle: offer.title,
    offerPrice: offer.priceLabel ?? undefined,
    offerUrl: absoluteUrl(offer.href),
    strategyCallUrl: absoluteUrl(call.href),
  };

  const stream = aiStream({
    system: PLAN_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildPlanPrompt(answers, result, ctx) }],
    effort: "medium",
    maxTokens: 8000,
    // On-site links stay relative (and booking links pre-filled) in the fallback plan.
    fallbackText: buildFallbackPlan(answers, result, {
      name: contact.name,
      offerTitle: offer.title,
      offerUrl: withPrefill(offer.href, person),
      strategyCallUrl: withPrefill(call.href, person),
    }),
    onComplete: async (text) => {
      const plan = text.trim();
      if (plan.length < 400 || plan.includes(INTERRUPTED_MARKER) || plan.includes(REFUSAL_MESSAGE)) return;
      const db = await getDb();
      await db
        .update(schema.quizSubmissions)
        .set({ plan })
        .where(and(eq(schema.quizSubmissions.id, submission.id), isNull(schema.quizSubmissions.plan)));
    },
  });

  return textStreamResponse(stream);
}
