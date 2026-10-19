"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { getDb, schema } from "@/db";
import {
  answersSummary,
  type AssessmentResult,
  buildOwnerNotification,
  buildResultsEmail,
  computeAssessment,
  getContactSchema,
  isHotLead,
  OFFERS,
  parseAnswers,
  plainText,
  serializeSubmission,
} from "@/lib/assessment";
import { captureLead, createTask } from "@/lib/crm";
import { emailBusinessName, sendEmail } from "@/lib/email";
import { rateLimit, rateLimitByIp } from "@/lib/rate-limit";
import { absoluteUrl } from "@/lib/utils";
import { loadOffer, loadStrategyCall, withPrefill } from "./data";

export type AssessmentFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "company", string>>;
  /** The answers didn't validate (e.g. a stale tab) — the quiz offers to start again. */
  invalidAnswers?: boolean;
};

/** Results emails one address can be sent per day: anyone can take the quiz with anyone's address. */
const RESULTS_EMAILS_PER_DAY = 3;

const CONTACT_FIELDS = ["name", "email", "company"] as const;
type ContactField = (typeof CONTACT_FIELDS)[number];
const isContactField = (key: unknown): key is ContactField => CONTACT_FIELDS.includes(key as ContactField);

function text(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

/**
 * Quiz submission: validates, scores, captures the lead in the CRM, stores the submission,
 * creates a follow-up task for hot leads, emails the results link and redirects to the results page (with `sent=0`
 * when no email went out, so the page doesn't say one did).
 */
export async function submitAssessmentAction(_prev: AssessmentFormState, formData: FormData): Promise<AssessmentFormState> {
  const contact = getContactSchema().safeParse({
    name: text(formData, "name"),
    email: text(formData, "email"),
    company: text(formData, "company"),
    website: text(formData, "website"),
  });
  if (!contact.success) {
    const fieldErrors: AssessmentFormState["fieldErrors"] = {};
    for (const issue of contact.error.issues) {
      const key = issue.path[0];
      if (isContactField(key) && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    // Only the honeypot can fail without a field error.
    return Object.keys(fieldErrors).length ? { fieldErrors } : { error: "Something went wrong. Please refresh the page and try again." };
  }

  let rawAnswers: unknown = null;
  try {
    rawAnswers = JSON.parse(text(formData, "answers"));
  } catch {
    rawAnswers = null;
  }
  const parsed = parseAnswers(rawAnswers);
  if (!parsed.ok) {
    return { error: "Some of your answers are missing or out of date. Please start the assessment again.", invalidAnswers: true };
  }

  const limit = await rateLimitByIp("assessment", 6, 10 * 60);
  if (!limit.ok) {
    return { error: "You've submitted the assessment several times in a row. Please wait a few minutes and try again." };
  }

  const { name, email, company } = contact.data;
  const answers = parsed.answers;
  const result = computeAssessment(answers);
  const hot = isHotLead(result);
  const resultToken = randomBytes(16).toString("hex");
  const resultsPath = `/assessment/results/${resultToken}`;
  const resultsUrl = absoluteUrl(resultsPath);
  // Plain text: the CRM timeline and task descriptions don't render Markdown.
  const summary = answersSummary(answers);

  let emailed = false;
  try {
    const { contact: lead } = await captureLead({
      email,
      name,
      company: company ?? null,
      source: "assessment",
      segment: result.segment,
      tags: ["assessment", result.tier.label.toLowerCase()],
      activity: {
        type: "quiz_completed",
        title: `Completed AI assessment — ${result.score}/100 (${result.tier.label})`,
        body: summary,
        meta: {
          score: result.score,
          tier: result.tier.id,
          scoreBoost: result.scoreBoost,
          recommendation: result.recommendation,
          resultToken,
          resultsPath,
        },
      },
      event: { name: "quiz_completed", path: "/assessment", props: { score: result.score, tier: result.tier.id } },
      stage: hot ? "qualified" : "engaged",
      automation: "quiz_completed",
      notify: {
        kind: "lead",
        subject: `New assessment: ${plainText(name, 60)} scored ${result.score} (${result.tier.label})`,
        markdown: buildOwnerNotification({ name, email, company, answers, result, resultsUrl }),
      },
    });

    const db = await getDb();
    await db.insert(schema.quizSubmissions).values({
      contactId: lead.id,
      // Keeps the name/company typed in here: the results page shows these, not the contact's stored details.
      answers: serializeSubmission(answers, { name, company }),
      score: result.score,
      tier: result.tier.id,
      recommendation: result.recommendation,
      resultToken,
    });

    if (hot) {
      await createTask({
        contactId: lead.id,
        title: `Follow up with ${plainText(name, 60)} — hot assessment lead (${result.score}/100, ${result.tier.label})`,
        description: [
          `Buying intent ${result.scoreBoost}/20 · recommended: ${OFFERS[result.recommendation].name}.`,
          "",
          summary,
          "",
          `Results page: ${resultsUrl}`,
        ].join("\n"),
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        priority: "high",
        origin: "quiz_hot_lead",
      }).catch((err) => console.error("[assessment] failed to create follow-up task", err));
    }

    // Email the results link without holding up the redirect, a few times a day per address at most.
    const perAddress = await rateLimit(`assessment-results:${email}`, RESULTS_EMAILS_PER_DAY, 24 * 60 * 60).catch((err) => {
      console.error("[assessment] results email rate limit failed", err);
      return { ok: false };
    });
    if (perAddress.ok) {
      after(() => sendResultsEmail({ contactId: lead.id, name, email, result, resultsUrl }));
      emailed = true;
    }
  } catch (err) {
    console.error("[assessment] submission failed", err);
    return { error: "We couldn't save your results just now. Please try again in a moment." };
  }

  redirect(emailed ? resultsPath : `${resultsPath}?sent=0`);
}

async function sendResultsEmail(input: {
  contactId: string;
  name: string;
  email: string;
  result: AssessmentResult;
  resultsUrl: string;
}): Promise<void> {
  try {
    const [offer, call, businessName] = await Promise.all([
      loadOffer(input.result.recommendation),
      loadStrategyCall(),
      emailBusinessName(),
    ]);
    const person = { name: input.name, email: input.email };
    const message = buildResultsEmail({
      name: input.name,
      result: input.result,
      resultsUrl: input.resultsUrl,
      offerTitle: offer.title,
      offerUrl: absoluteUrl(withPrefill(offer.href, person)),
      strategyCallUrl: absoluteUrl(withPrefill(call.href, person)),
      businessName,
    });
    await sendEmail({
      to: input.email,
      subject: message.subject,
      preheader: message.preheader,
      markdown: message.markdown,
      kind: "assessment_results",
      contactId: input.contactId,
    });
  } catch (err) {
    console.error("[assessment] failed to send results email", err);
  }
}
