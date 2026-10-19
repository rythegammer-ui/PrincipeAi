import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it, vi } from "vitest";

// The quiz's server action outside a request: a fresh client IP per submission (so only the per-address cap
// applies), no cookies, and `after()` run straight away so the results email is sent before the test checks it.
const mocks = vi.hoisted(() => ({ ip: 0, pending: [] as Promise<unknown>[] }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": `198.51.100.${(mocks.ip++ % 250) + 1}` }),
  cookies: async () => ({ get: () => undefined, set: () => {} }),
}));
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: (task: () => unknown) => void mocks.pending.push(Promise.resolve().then(task)),
}));

import { submitAssessmentAction } from "@/app/(marketing)/assessment/actions";
import { getDb, schema } from "@/db";
import { type AssessmentAnswers, serializeAnswers } from "@/lib/assessment";

const answers: AssessmentAnswers = {
  role: "owner",
  focus: "business",
  industry: "professional-services",
  teamSize: "2-10",
  usage: "weekly",
  tools: ["chatgpt", "claude"],
  timeDrains: ["email", "writing", "data"],
  goal: "save-time",
  comfort: "3",
  timeline: "month",
  investment: "course",
};

/** Submits the quiz for `email`; returns where the action redirected to. */
async function submit(email: string): Promise<string> {
  const form = new FormData();
  form.set("name", "Someone");
  form.set("email", email);
  form.set("company", "");
  form.set("website", "");
  form.set("answers", JSON.stringify(serializeAnswers(answers)));
  try {
    const state = await submitAssessmentAction({}, form);
    throw new Error(`expected a redirect, got ${JSON.stringify(state)}`);
  } catch (err) {
    const digest = (err as { digest?: string }).digest ?? "";
    if (!digest.startsWith("NEXT_REDIRECT;")) throw err;
    return digest.split(";")[2];
  } finally {
    await Promise.all(mocks.pending.splice(0));
  }
}

describe("assessment submission", () => {
  beforeAll(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("emails the results to one address at most three times a day (anyone can type any address)", async () => {
    const email = "quiz.target@example.com";
    const targets = [];
    for (let i = 0; i < 5; i++) targets.push(await submit(email));

    // Every submission is saved and shown; only the first three are emailed, and the rest say so.
    expect(targets.slice(0, 3).every((t) => /^\/assessment\/results\/[0-9a-f]{32}$/.test(t))).toBe(true);
    expect(targets.slice(3).every((t) => /^\/assessment\/results\/[0-9a-f]{32}\?sent=0$/.test(t))).toBe(true);

    const db = await getDb();
    const sent = await db.select().from(schema.emailLog).where(eq(schema.emailLog.to, email));
    const results = sent.filter((e) => e.kind === "assessment_results");
    expect(results).toHaveLength(3);
    for (const t of targets.slice(0, 3)) expect(results.some((e) => e.html.includes(t))).toBe(true);

    const [contact] = await db.select({ id: schema.contacts.id }).from(schema.contacts).where(eq(schema.contacts.email, email));
    const subs = await db.select().from(schema.quizSubmissions).where(eq(schema.quizSubmissions.contactId, contact.id));
    expect(subs).toHaveLength(5);

    // Another address has its own allowance.
    expect(await submit("quiz.other@example.com")).toMatch(/^\/assessment\/results\/[0-9a-f]{32}$/);
  });
});
