import { describe, expect, it } from "vitest";
import {
  answersSummary,
  type AssessmentAnswers,
  buildFallbackPlan,
  buildOwnerNotification,
  buildPlanPrompt,
  buildResultsEmail,
  computeAssessment,
  describeAnswers,
  escapeMarkdownText,
  getContactSchema,
  getQuestion,
  intentBoost,
  isHotLead,
  isQuestionVisible,
  MAX_TIME_DRAINS,
  OFFERS,
  parseAnswers,
  pickQuickWins,
  plainText,
  QUESTIONS,
  QUICK_WINS,
  readinessBreakdown,
  readinessScore,
  recommend,
  resultFromStored,
  serializeAnswers,
  serializeSubmission,
  shouldStorePlan,
  submittedContact,
  TIERS,
  tierForScore,
  TIME_DRAINS,
  toggleMultiValue,
  validateQuestion,
  visibleQuestions,
  withArticle,
} from "@/lib/assessment";

const base: AssessmentAnswers = {
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

const answers = (patch: Partial<AssessmentAnswers> = {}): AssessmentAnswers => ({ ...base, ...patch });

const REQUIRED_SECTIONS = [
  "## Your AI snapshot",
  "## 3 quick wins for this week",
  "## Your 30-day roadmap",
  "## Tools worth trying",
  "## Watch-outs",
  "## Your recommended next step",
];

describe("question set", () => {
  it("has unique ids and options for every question", () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const q of QUESTIONS) {
      expect(q.options.length).toBeGreaterThan(1);
      expect(new Set(q.options.map((o) => o.value)).size).toBe(q.options.length);
    }
  });

  it("only asks industry when business is in focus", () => {
    expect(isQuestionVisible("industry", { focus: "life" })).toBe(false);
    expect(isQuestionVisible("industry", { focus: "business" })).toBe(true);
    expect(isQuestionVisible("industry", { focus: "both" })).toBe(true);
    expect(isQuestionVisible("industry", {})).toBe(false);
  });

  it("skips team size for individuals focused on everyday life", () => {
    expect(isQuestionVisible("teamSize", { role: "individual", focus: "life" })).toBe(false);
    expect(isQuestionVisible("teamSize", { role: "owner", focus: "life" })).toBe(true);
    expect(isQuestionVisible("teamSize", { role: "individual", focus: "business" })).toBe(true);
  });

  it("keeps the quiz between 9 and 11 questions", () => {
    expect(visibleQuestions({ role: "individual", focus: "life" })).toHaveLength(9);
    expect(visibleQuestions({ role: "owner", focus: "business" })).toHaveLength(11);
  });

  it("validates each step", () => {
    const role = getQuestion("role");
    expect(validateQuestion(role, {})).toMatch(/choose/i);
    expect(validateQuestion(role, { role: "owner" })).toBeNull();
    const drains = getQuestion("timeDrains");
    expect(validateQuestion(drains, { timeDrains: [] })).toMatch(/at least one/i);
    expect(validateQuestion(drains, { timeDrains: ["email", "writing", "data", "research"] })).toMatch(/up to/i);
    expect(validateQuestion(getQuestion("industry"), { industry: undefined })).toMatch(/list/i);
  });

  it("toggles multi-select answers with an exclusive 'none' option and a maximum", () => {
    const tools = getQuestion("tools");
    expect(toggleMultiValue(tools, ["chatgpt"], "none")).toEqual(["none"]);
    expect(toggleMultiValue(tools, ["none"], "claude")).toEqual(["claude"]);
    expect(toggleMultiValue(tools, ["claude"], "claude")).toEqual([]);
    const drains = getQuestion("timeDrains");
    expect(toggleMultiValue(drains, ["email", "writing", "data"], "research")).toEqual(["email", "writing", "data"]);
    expect(toggleMultiValue(drains, ["email"], "research")).toEqual(["email", "research"]);
  });
});

describe("parseAnswers", () => {
  it("accepts a complete answer set and round-trips through storage", () => {
    const parsed = parseAnswers(serializeAnswers(base));
    expect(parsed).toEqual({ ok: true, answers: base });
  });

  it("requires industry and team size when they are shown", () => {
    expect(parseAnswers({ ...serializeAnswers(base), industry: undefined }).ok).toBe(false);
    const { teamSize: _omit, ...rest } = serializeAnswers(base);
    void _omit;
    expect(parseAnswers(rest).ok).toBe(false);
  });

  it("drops hidden answers and defaults team size for life-focused individuals", () => {
    const parsed = parseAnswers({ ...serializeAnswers(base), role: "individual", focus: "life", teamSize: "51+" });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.answers.industry).toBeUndefined();
      expect(parsed.answers.teamSize).toBe("solo");
    }
  });

  it("rejects unknown values, too many time drains and empty multi-selects", () => {
    expect(parseAnswers({ ...serializeAnswers(base), usage: "hourly" }).ok).toBe(false);
    expect(parseAnswers({ ...serializeAnswers(base), comfort: "6" }).ok).toBe(false);
    expect(parseAnswers({ ...serializeAnswers(base), tools: [] }).ok).toBe(false);
    expect(parseAnswers({ ...serializeAnswers(base), timeDrains: ["email", "writing", "data", "research"] }).ok).toBe(false);
    expect(parseAnswers(null).ok).toBe(false);
    expect(parseAnswers("nope").ok).toBe(false);
  });

  it("dedupes arrays and removes 'none' when real tools were picked", () => {
    const parsed = parseAnswers({ ...serializeAnswers(base), tools: ["none", "claude", "claude"], timeDrains: ["email", "email"] });
    expect(parsed.ok && parsed.answers.tools).toEqual(["claude"]);
    expect(parsed.ok && parsed.answers.timeDrains).toEqual(["email"]);
  });
});

describe("readiness score", () => {
  it("scores the lowest possible profile near zero", () => {
    const s = readinessBreakdown(answers({ usage: "never", tools: ["none"], comfort: "1", goal: "learn-skill", timeDrains: ["email"] }));
    expect(s).toMatchObject({ usage: 0, tools: 0, comfort: 0, clarity: 6, total: 6 });
  });

  it("scores the strongest possible profile at exactly 100", () => {
    const top = answers({ usage: "daily", tools: ["chatgpt", "claude", "gemini", "copilot", "image", "automation"], comfort: "5" });
    expect(readinessScore(top)).toBe(100);
  });

  it("caps tool breadth at four tools plus the automation bonus", () => {
    const four = readinessBreakdown(answers({ tools: ["chatgpt", "claude", "gemini", "copilot"] })).tools;
    const six = readinessBreakdown(answers({ tools: ["chatgpt", "claude", "gemini", "copilot", "image", "automation"] })).tools;
    expect(four).toBe(20);
    expect(six).toBe(25);
  });

  it("keeps people who have never used AI in the Explorer tier, however confident", () => {
    const r = computeAssessment(answers({ usage: "never", tools: ["none"], comfort: "5" }));
    expect(r.score).toBe(30);
    expect(r.tier.id).toBe("explorer");
  });

  it("increases with usage", () => {
    const scores = (["never", "tried", "weekly", "daily"] as const).map((usage) => readinessScore(answers({ usage })));
    expect([...scores].sort((a, b) => a - b)).toEqual(scores);
    expect(new Set(scores).size).toBe(4);
  });
});

describe("tiers", () => {
  it("covers 0–100 with no gaps or overlaps", () => {
    for (let s = 0; s <= 100; s++) {
      expect(TIERS.filter((t) => s >= t.min && s <= t.max)).toHaveLength(1);
    }
  });

  it.each([
    [0, "explorer"],
    [30, "explorer"],
    [31, "experimenter"],
    [55, "experimenter"],
    [56, "implementer"],
    [80, "implementer"],
    [81, "scaler"],
    [100, "scaler"],
    [-5, "explorer"],
    [140, "scaler"],
    [30.4, "explorer"],
    [55.6, "implementer"],
  ])("score %s → %s", (score, tier) => {
    expect(tierForScore(score).id).toBe(tier);
  });

  it("every tier has a description, strengths and gaps", () => {
    for (const t of TIERS) {
      expect(t.description.length).toBeGreaterThan(40);
      expect(t.strengths.length).toBeGreaterThanOrEqual(3);
      expect(t.gaps.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("uses the right article for tier names", () => {
    expect(withArticle("Explorer")).toBe("an Explorer");
    expect(withArticle("Experimenter")).toBe("an Experimenter");
    expect(withArticle("Implementer", true)).toBe("an **Implementer**");
    expect(withArticle("Scaler")).toBe("a Scaler");
  });
});

describe("intent boost", () => {
  it("is zero for an explorer with a DIY budget working alone", () => {
    expect(intentBoost(answers({ timeline: "exploring", investment: "diy", teamSize: "solo" }))).toBe(0);
  });

  it("maxes out at 20", () => {
    expect(intentBoost(answers({ timeline: "asap", investment: "dfy", teamSize: "51+" }))).toBe(20);
  });

  it("flags hot leads from intent or a consulting recommendation", () => {
    expect(isHotLead({ scoreBoost: 12, recommendation: "ai-for-business" })).toBe(true);
    expect(isHotLead({ scoreBoost: 11, recommendation: "ai-for-business" })).toBe(false);
    expect(isHotLead({ scoreBoost: 0, recommendation: "consulting" })).toBe(true);
    expect(computeAssessment(answers({ timeline: "month", investment: "coaching", teamSize: "solo" })).scoreBoost).toBe(12);
  });
});

describe("recommendations", () => {
  it("recommends consulting for done-for-you budgets", () => {
    expect(recommend(answers({ investment: "dfy", focus: "life", role: "individual" }), 10)).toBe("consulting");
  });

  it("recommends consulting for teams over 10 that want to start ASAP", () => {
    expect(recommend(answers({ teamSize: "11-50", timeline: "asap", investment: "diy" }), 40)).toBe("consulting");
    expect(recommend(answers({ teamSize: "51+", timeline: "asap", investment: "course" }), 90)).toBe("consulting");
    expect(recommend(answers({ teamSize: "11-50", timeline: "month", investment: "course" }), 40)).toBe("ai-for-business");
    expect(recommend(answers({ teamSize: "2-10", timeline: "asap", investment: "course" }), 40)).toBe("ai-for-business");
  });

  it("recommends the accelerator for ready people who want to automate operations", () => {
    expect(recommend(answers({ goal: "automate-ops" }), 56)).toBe("ai-automation-accelerator");
    expect(recommend(answers({ goal: "automate-ops" }), 55)).toBe("ai-for-business");
    expect(recommend(answers({ goal: "save-time" }), 90)).toBe("ai-for-business");
  });

  it("recommends AI Essentials for life focus or beginners", () => {
    expect(recommend(answers({ focus: "life" }), 50)).toBe("ai-essentials");
    expect(recommend(answers({ focus: "business" }), 30)).toBe("ai-essentials");
    expect(recommend(answers({ focus: "both" }), 31)).toBe("ai-for-business");
  });

  it("sends life-focused Scalers to the accelerator instead of a beginner course", () => {
    expect(recommend(answers({ focus: "life", goal: "save-time" }), 81)).toBe("ai-automation-accelerator");
  });

  it("has an offer for every recommendation", () => {
    for (const rec of ["ai-essentials", "ai-for-business", "ai-automation-accelerator", "consulting"] as const) {
      expect(OFFERS[rec].href.startsWith("/")).toBe(true);
    }
    expect(OFFERS.consulting.href).toBe("/book/implementation-discovery");
  });
});

describe("result", () => {
  it("returns three strengths, three gaps and three quick wins", () => {
    for (const a of [base, answers({ usage: "never", tools: ["none"], comfort: "1" }), answers({ usage: "daily", comfort: "5" })]) {
      const r = computeAssessment(a);
      expect(r.strengths).toHaveLength(3);
      expect(r.gaps).toHaveLength(3);
      expect(r.quickWins).toHaveLength(3);
      expect(new Set(r.strengths).size).toBe(3);
      expect(r.segment).toBe(a.focus);
    }
  });

  it("maps quick wins from the visitor's time drains first, then fills with defaults", () => {
    expect(pickQuickWins({ focus: "business", timeDrains: ["data", "email", "research"] }).map((w) => w.id)).toEqual(["data", "email", "research"]);
    expect(pickQuickWins({ focus: "life", timeDrains: ["research"] }).map((w) => w.id)).toEqual(["research", "personal-planning", "learning"]);
    expect(pickQuickWins({ focus: "business", timeDrains: ["email"] }).map((w) => w.id)).toEqual(["email", "writing", "research"]);
  });

  it("has a copy-paste prompt for every time drain", () => {
    for (const id of TIME_DRAINS) {
      expect(QUICK_WINS[id].prompt).toContain("[");
      expect(QUICK_WINS[id].prompt).not.toContain("```");
    }
    expect(MAX_TIME_DRAINS).toBe(3);
  });

  it("keeps the stored score, tier and recommendation authoritative", () => {
    const r = resultFromStored(base, { score: 42, tier: "experimenter", recommendation: "consulting" });
    expect(r.score).toBe(42);
    expect(r.tier.id).toBe("experimenter");
    expect(r.recommendation).toBe("consulting");
    const fallback = resultFromStored(base, { score: 90, tier: "mystery", recommendation: "unknown" });
    expect(fallback.tier.id).toBe("scaler");
    expect(fallback.recommendation).toBe(computeAssessment(base).recommendation);
  });
});

describe("fallback plan", () => {
  it.each([
    ["beginner, life", answers({ role: "individual", focus: "life", industry: undefined, teamSize: "solo", usage: "never", tools: ["none"], comfort: "2" })],
    ["implementer, business", base],
    ["scaler, consulting", answers({ usage: "daily", tools: ["claude", "automation", "chatgpt"], comfort: "5", investment: "dfy", teamSize: "11-50" })],
  ])("contains every required section (%s)", (_label, a) => {
    const result = computeAssessment(a);
    const plan = buildFallbackPlan(a, result, { name: "ada lovelace" });
    let last = -1;
    for (const heading of REQUIRED_SECTIONS) {
      const at = plan.indexOf(heading);
      expect(at, heading).toBeGreaterThan(last);
      last = at;
    }
    expect(plan.match(/^### \d\. /gm)).toHaveLength(3);
    expect(plan.match(/^```text$/gm)).toHaveLength(3);
    expect(plan).toContain("**Week 1");
    expect(plan).toContain("**Week 4");
    expect(plan).toContain(`**${result.score}/100**`);
    expect(plan).toContain("Ada, you scored");
    expect(plan).toContain(OFFERS[result.recommendation].href);
    expect(plan).toContain("/book/ai-strategy-call");
    const words = plan.split(/\s+/).length;
    expect(words).toBeGreaterThan(450);
    expect(words).toBeLessThan(1300);
  });

  it("uses the offer title and absolute URLs when given", () => {
    const result = computeAssessment(base);
    const plan = buildFallbackPlan(base, result, {
      offerTitle: "AI for Business Owners: The Implementation Playbook",
      offerUrl: "https://example.com/courses/ai-for-business",
      strategyCallUrl: "https://example.com/book/ai-strategy-call",
    });
    expect(plan).toContain("[AI for Business Owners: The Implementation Playbook](https://example.com/courses/ai-for-business)");
    expect(plan).toContain("(https://example.com/book/ai-strategy-call)");
    expect(plan.startsWith("## Your AI snapshot\n\nYou scored")).toBe(true);
  });

  it("adds team guidelines only for people with a team", () => {
    expect(buildFallbackPlan(base, computeAssessment(base))).toContain("Agree on simple team rules");
    const solo = answers({ teamSize: "solo" });
    expect(buildFallbackPlan(solo, computeAssessment(solo))).not.toContain("Agree on simple team rules");
  });
});

describe("storing the plan", () => {
  const plan = buildFallbackPlan(base, computeAssessment(base));
  const ai = { source: "ai", refused: false, interrupted: false } as const;
  const fallback = { source: "fallback", refused: false, interrupted: false } as const;

  it("stores a complete Claude-written plan", () => {
    expect(shouldStorePlan(plan, ai, true)).toBe(true);
  });

  it("stores the deterministic plan when AI isn't configured", () => {
    expect(shouldStorePlan(plan, fallback, false)).toBe(true);
  });

  it("doesn't store the fallback streamed because Claude failed, so the next visit retries", () => {
    expect(shouldStorePlan(plan, fallback, true)).toBe(false);
  });

  it("stores the fallback when the model declined (a retry won't change that)", () => {
    expect(shouldStorePlan(plan, { ...fallback, refused: true }, true)).toBe(true);
  });

  it("never stores interrupted, declined part-way or too-short plans", () => {
    expect(shouldStorePlan(plan, { ...ai, interrupted: true }, true)).toBe(false);
    expect(shouldStorePlan(plan, { ...fallback, interrupted: true }, false)).toBe(false);
    expect(shouldStorePlan(plan, { ...ai, refused: true }, true)).toBe(false);
    expect(shouldStorePlan("## Your AI snapshot\n\nToo short.", ai, true)).toBe(false);
  });
});

describe("summaries", () => {
  it("describes the answers the visitor saw in order", () => {
    const rows = describeAnswers(base);
    expect(rows[0]).toEqual(["Role", "Business owner or founder"]);
    expect(rows.map(([label]) => label)).toContain("Industry");
    expect(rows.find(([l]) => l === "Tech comfort")?.[1]).toMatch(/^3\/5/);
    const life = describeAnswers(answers({ role: "individual", focus: "life", industry: undefined, teamSize: "solo" }));
    expect(life.map(([label]) => label)).not.toContain("Industry");
    expect(life.map(([label]) => label)).not.toContain("Team size");
  });

  it("summarizes the answers as plain text for the CRM", () => {
    const summary = answersSummary(base);
    const lines = summary.split("\n");
    expect(lines).toHaveLength(describeAnswers(base).length);
    expect(lines[0]).toBe("Role: Business owner or founder");
    expect(summary).not.toMatch(/\*\*|^- /m);
  });

  it("strips Markdown and HTML from user-supplied text", () => {
    expect(plainText("[Click](https://evil.example) <b>Ada</b>")).toBe("Click https://evil.example b Ada /b");
    expect(plainText("  Ada \n Lovelace  ")).toBe("Ada Lovelace");
    expect(plainText(null)).toBe("");
  });

  it("builds a structured AI prompt with the recommendation and links", () => {
    const result = computeAssessment(base);
    const prompt = buildPlanPrompt(base, result, { name: "Ada", company: "Analytical Engines", offerUrl: "https://x.test/courses/ai-for-business" });
    expect(prompt).toContain("First name: Ada");
    expect(prompt).toContain("Company: Analytical Engines");
    expect(prompt).toContain(`Readiness score: ${result.score}/100`);
    expect(prompt).toContain("URL: https://x.test/courses/ai-for-business");
    expect(prompt).toContain("<assessment>");
  });

  it("builds the owner notification and results email", () => {
    const result = computeAssessment(answers({ investment: "dfy" }));
    const note = buildOwnerNotification({ name: "Ada", email: "ada@example.com", answers: base, result, resultsUrl: "https://x.test/r" });
    expect(note).toContain("hot lead");
    expect(note).toContain("[View their results page](https://x.test/r)");
    const email = buildResultsEmail({ name: "ada", result, resultsUrl: "https://x.test/r", offerTitle: "Course", offerUrl: "https://x.test/c", strategyCallUrl: "https://x.test/b" });
    expect(email.subject).toBe(`Your AI readiness results: ${result.score}/100 (${result.tier.label})`);
    expect(email.markdown).toContain("Hi Ada,");
    expect(email.markdown).toContain("Thanks for taking the free AI Readiness Assessment.");
    // The brand name already ends in "AI": never "Principe AI AI Readiness Assessment".
    expect(email.markdown).not.toMatch(/\bAI AI\b/);
    expect(email.markdown).toContain("(https://x.test/r)");
    // Signed with Settings → Business name (escaped), else the site name.
    expect(email.markdown).toMatch(/\nThe Principe AI team$/);
    const branded = buildResultsEmail({ name: "ada", result, resultsUrl: "https://x.test/r", offerTitle: "Course", offerUrl: "https://x.test/c", strategyCallUrl: "https://x.test/b", businessName: " Ada's *Studio* " });
    expect(branded.markdown).toMatch(/\nThe Ada's \\\*Studio\\\* team$/);
  });
});

describe("submitted contact details", () => {
  it("keeps the name and company entered with a submission beside the answers", () => {
    const stored = serializeSubmission(base, { name: "Visitor Test", company: "Acme" });
    expect(stored).toMatchObject({ ...serializeAnswers(base), _name: "Visitor Test", _company: "Acme" });
    expect(submittedContact(stored)).toEqual({ name: "Visitor Test", company: "Acme" });
    expect(serializeSubmission(base, { name: "Ada" })).not.toHaveProperty("_company");
  });

  it("still parses the answers and never shows the extra keys as answers", () => {
    const stored = serializeSubmission(base, { name: "Visitor Test", company: "Acme" });
    const parsed = parseAnswers(JSON.parse(JSON.stringify(stored)));
    expect(parsed).toEqual({ ok: true, answers: base });
    expect(answersSummary(base)).not.toContain("Visitor");
  });

  it("returns nothing for older submissions and malformed values", () => {
    expect(submittedContact(serializeAnswers(base))).toEqual({ name: null, company: null });
    expect(submittedContact(null)).toEqual({ name: null, company: null });
    expect(submittedContact(["Ada"])).toEqual({ name: null, company: null });
    expect(submittedContact({ _name: ["Ada"], _company: "   " })).toEqual({ name: null, company: null });
    expect(submittedContact({ _name: `  ${"a".repeat(200)} ` }).name).toHaveLength(80);
  });
});

describe("contact step", () => {
  const parse = (email: string) => getContactSchema().safeParse({ name: "Ada", email, company: "", website: "" });

  it("accepts ordinary addresses and normalizes them", () => {
    for (const email of ["ada@example.com", "Ada.O'Brien+ai@Example.co.uk", "first_last-1@mail.example.org"]) {
      const result = parse(email);
      expect(result.success, email).toBe(true);
      expect(result.data?.email).toBe(email.toLowerCase());
    }
  });

  it("rejects addresses carrying Markdown or HTML", () => {
    for (const email of ["[Open](https://example.org/x)@example.com", "<b>a</b>@example.com", "a@example.com\\", '"a b"@example.com', "a:b@example.com"]) {
      expect(parse(email).success, email).toBe(false);
    }
  });
});

describe("escaping visitor text", () => {
  it("backslash-escapes link, autolink and HTML characters", () => {
    expect(escapeMarkdownText("[Open](https://evil.example)@x.com")).toBe("\\[Open\\]\\(https\\://evil\\.example\\)\\@x\\.com");
    expect(escapeMarkdownText("Ada Lovelace")).toBe("Ada Lovelace");
  });

  it("escapes the visitor's name in the results email greeting", () => {
    const result = computeAssessment(base);
    const email = buildResultsEmail({ name: "www.evil.example", result, resultsUrl: "https://x.test/r", offerTitle: "Course", offerUrl: "https://x.test/c", strategyCallUrl: "https://x.test/b" });
    expect(email.markdown).toContain("Hi Www\\.evil\\.example,");
  });

  it("escapes the name in the fallback plan", () => {
    const plan = buildFallbackPlan(base, computeAssessment(base), { name: "www.evil.example" });
    expect(plan).toContain("Www\\.evil\\.example, you scored");
  });
});
