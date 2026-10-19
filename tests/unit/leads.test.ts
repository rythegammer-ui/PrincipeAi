import { and, eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { BUDGET_OPTIONS, INTEREST_OPTIONS, optionLabel, optionValues } from "@/components/marketing/lead-options";
import { categoryAnchor, kitStats, kitSummary } from "@/components/marketing/starter-kit-utils";
import type { StarterKit } from "@/content/starter-kit";
import { getDb, schema } from "@/db";
import {
  DISCOVERY_PREFILL_COOKIE,
  applicationSchema,
  captureApplication,
  captureContactMessage,
  captureGuideOptIn,
  contactSchema,
  discoveryPrefillFrom,
  encodeDiscoveryPrefill,
  escapeMarkdown,
  fieldErrorsOf,
  formatApplication,
  isSpam,
  normalizeWebsite,
  optInSchema,
  parseDiscoveryPrefill,
  readFields,
} from "@/lib/leads";

const emptyKit: StarterKit = { title: "Kit", subtitle: "", intro: "", days: [], promptCategories: [], tips: [] };

function form(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

const validApplication = {
  name: "Avery Applicant",
  email: "avery@example.com",
  company: "Acme Bakery",
  website: "acmebakery.com",
  teamSize: "2-10",
  goals: "Answer customer questions on our website and follow up with catering enquiries.",
  budget: "5k-15k",
  timeline: "1-3-months",
};

describe("lead options", () => {
  it("maps values to labels and builds enum tuples", () => {
    expect(optionValues(INTEREST_OPTIONS)).toEqual(["life", "business", "both"]);
    expect(optionLabel(BUDGET_OPTIONS, "5k-15k")).toBe("$5,000 – $15,000");
    expect(optionLabel(BUDGET_OPTIONS, "unknown")).toBe("unknown");
    expect(optionLabel(BUDGET_OPTIONS, null)).toBe("");
  });
});

describe("form helpers", () => {
  it("normalises websites and rejects junk", () => {
    expect(normalizeWebsite("")).toBeNull();
    expect(normalizeWebsite("   ")).toBeNull();
    expect(normalizeWebsite("example.com")).toBe("https://example.com");
    expect(normalizeWebsite("http://www.example.com/about/")).toBe("http://www.example.com/about");
    expect(normalizeWebsite("not a site")).toBeUndefined();
    expect(normalizeWebsite("localhost")).toBeUndefined();
    expect(normalizeWebsite("javascript:alert(1)")).toBeUndefined();
  });

  it("reads, trims and lowercases form fields", () => {
    const fd = form({ name: "  Ann  ", email: " Ann@Example.COM ", extra: "x" });
    expect(readFields(fd, ["name", "email", "missing"] as const)).toEqual({ name: "Ann", email: "ann@example.com", missing: "" });
  });

  it("detects the honeypot", () => {
    expect(isSpam(form({ company_url: "http://spam" }))).toBe(true);
    expect(isSpam(form({ company_url: "" }))).toBe(false);
    expect(isSpam(form({}))).toBe(false);
  });

  it("escapes markdown so visitor input can't inject links or formatting", () => {
    expect(escapeMarkdown("[click](http://evil)")).toBe("\\[click\\]\\(http\\://evil\\)");
    expect(escapeMarkdown("**bold** <b>")).toBe("\\*\\*bold\\*\\* \\<b\\>");
    expect(escapeMarkdown("a\n\n\n\nb")).toBe("a\n\nb");
  });
});

describe("validation schemas", () => {
  it("validates the opt-in", () => {
    expect(optInSchema.safeParse({ name: "Ann", email: "ann@example.com", interest: "life" }).success).toBe(true);
    const bad = optInSchema.safeParse({ name: "", email: "nope", interest: "pets" });
    expect(bad.success).toBe(false);
    if (!bad.success) {
      expect(fieldErrorsOf(bad.error, ["name", "email", "interest"] as const)).toEqual({
        name: "Please tell us your name.",
        email: "Please enter a valid email address.",
        interest: "Choose where you'd like AI to help most.",
      });
    }
  });

  it("validates and normalises the application", () => {
    const ok = applicationSchema.safeParse(validApplication);
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.website).toBe("https://acmebakery.com");
    expect(applicationSchema.safeParse({ ...validApplication, website: "" }).success).toBe(true);
    const bad = applicationSchema.safeParse({ ...validApplication, website: "not a site", goals: "help", budget: "" });
    expect(bad.success).toBe(false);
    if (!bad.success) {
      const errs = fieldErrorsOf(bad.error, ["website", "goals", "budget"] as const);
      expect(Object.keys(errs).sort()).toEqual(["budget", "goals", "website"]);
    }
  });

  it("validates the contact form", () => {
    expect(contactSchema.safeParse({ name: "Ann", email: "ann@example.com", topic: "courses", message: "Which course should I start with?" }).success).toBe(true);
    expect(contactSchema.safeParse({ name: "Ann", email: "ann@example.com", topic: "courses", message: "hi" }).success).toBe(false);
  });

  it("formats an application as plain text", () => {
    const parsed = applicationSchema.parse(validApplication);
    const text = formatApplication(parsed);
    expect(text).toContain("Company: Acme Bakery");
    expect(text).toContain("Team size: 2–10 people");
    expect(text).toContain("Budget: $5,000 – $15,000");
    expect(text).toContain("Timeline: In the next 1–3 months");
    expect(text).toContain(validApplication.goals);
  });
});

describe("starter kit helpers", () => {
  it("handles an empty kit", () => {
    expect(kitStats(emptyKit)).toEqual({ days: 0, prompts: 0, categories: 0, tips: 0 });
    expect(kitSummary(emptyKit)).toBe("A simple quick-start plan and copy-paste prompts");
  });

  it("counts days, prompts and tips", () => {
    const kit: StarterKit = {
      ...emptyKit,
      days: [{ day: 1, title: "Start", goal: "g", steps: [], prompt: "p" }],
      promptCategories: [
        { category: "Writing", description: "", prompts: [{ title: "a", prompt: "a" }, { title: "b", prompt: "b" }] },
        { category: "Planning", description: "", prompts: [{ title: "c", prompt: "c" }] },
      ],
      tips: ["t"],
    };
    expect(kitStats(kit)).toEqual({ days: 1, prompts: 3, categories: 2, tips: 1 });
    expect(kitSummary(kit)).toBe("A 1-day plan and 3 copy-paste prompts");
    expect(categoryAnchor("Writing & Email!", 0)).toBe("prompts-writing-email");
    expect(categoryAnchor("✨", 2)).toBe("prompts-3");
  });
});

describe("discovery-call prefill", () => {
  const discovery = {
    slug: "implementation-discovery",
    questions: [
      { id: "company", label: "Company name and website", required: true },
      { id: "project", label: "What would you like to automate or build with AI?", required: true },
      { id: "budget", label: "Rough budget range", required: false },
    ],
  };

  it("maps an application to the discovery call's answers", () => {
    const prefill = discoveryPrefillFrom(applicationSchema.parse(validApplication));
    expect(prefill).toEqual({
      company: "Acme Bakery · https://acmebakery.com",
      project: validApplication.goals,
      budget: "$5,000 – $15,000",
    });
    expect(discoveryPrefillFrom(applicationSchema.parse({ ...validApplication, website: "" })).company).toBe("Acme Bakery");
  });

  it("round-trips through the cookie into booking-form values", () => {
    const raw = encodeDiscoveryPrefill(discoveryPrefillFrom(applicationSchema.parse(validApplication)));
    expect(parseDiscoveryPrefill(raw, discovery)).toEqual({
      q_company: "Acme Bakery · https://acmebakery.com",
      q_project: validApplication.goals,
      q_budget: "$5,000 – $15,000",
    });
  });

  it("keeps the encoded cookie under the browser size limit", () => {
    const long = { company: "Ünïcödé Café 🍰".repeat(10), project: "Automatisierung für unsere Bäckerei 🥐, bitte! ".repeat(60), budget: "Not sure yet" };
    const raw = encodeDiscoveryPrefill(long);
    expect(DISCOVERY_PREFILL_COOKIE.length + 1 + encodeURIComponent(raw).length).toBeLessThanOrEqual(3800);
    const parsed = parseDiscoveryPrefill(raw, discovery);
    expect(parsed.q_company).toBe(long.company);
    expect(parsed.q_budget).toBe("Not sure yet");
    expect(parsed.q_project.length).toBeGreaterThan(200);
    expect(long.project.startsWith(parsed.q_project)).toBe(true);
    // Never ends on half an emoji.
    expect(() => encodeURIComponent(parsed.q_project)).not.toThrow();
    // Short answers are left alone.
    expect(JSON.parse(encodeDiscoveryPrefill({ company: "A", project: "B", budget: "C" }))).toEqual({ company: "A", project: "B", budget: "C" });
  });

  it("only fills the discovery call's own questions and ignores bad cookies", () => {
    const raw = JSON.stringify({ company: "  Acme  ", project: "x".repeat(2500), budget: 5, notes: "extra" });
    expect(parseDiscoveryPrefill(raw, discovery)).toEqual({ q_company: "Acme", q_project: "x".repeat(2000) });
    // The owner edited the questions: only matching ids are prefilled.
    expect(parseDiscoveryPrefill(raw, { ...discovery, questions: [{ id: "company" }, { id: "agenda" }] })).toEqual({ q_company: "Acme" });
    expect(parseDiscoveryPrefill(raw, { ...discovery, slug: "ai-strategy-call" })).toEqual({});
    // Inherited properties are never read.
    expect(parseDiscoveryPrefill(raw, { ...discovery, questions: [{ id: "constructor" }, { id: "toString" }] })).toEqual({});
    for (const bad of [undefined, null, "", "not json", "[1,2]", "null", '"str"', "42"]) {
      expect(parseDiscoveryPrefill(bad, discovery)).toEqual({});
    }
  });
});

describe("lead captures (PGlite)", () => {
  it("captures a Starter Kit opt-in as a new, tagged lead with a welcome email", async () => {
    const { contact, emailed } = await captureGuideOptIn({ name: "Olivia Optin", email: "olivia.leads@example.com", interest: "business" }, "/free-guide");
    expect(emailed).toBe(true);
    expect(contact.stage).toBe("new");
    expect(contact.source).toBe("lead_magnet");
    expect(contact.segment).toBe("business");
    expect(contact.tags).toContain("starter-kit");
    expect(contact.score).toBeGreaterThan(0);

    const db = await getDb();
    const acts = await db.select().from(schema.activities).where(eq(schema.activities.contactId, contact.id));
    expect(acts.some((a) => a.type === "optin" && a.title === "Downloaded the AI Starter Kit")).toBe(true);
    // (The "optin" funnel event needs a request's visitor cookie, so it's covered by the dev-server flow, not here.)
    const emails = await db.select().from(schema.emailLog);
    expect(emails.some((e) => e.subject === "[Principe AI] New lead: Olivia Optin downloaded the Starter Kit")).toBe(true);
    // The welcome sequence's first step carries the kit link, so no separate link email.
    const own = emails.filter((e) => e.to === "olivia.leads@example.com");
    expect(own.map((e) => e.subject)).toEqual(["Your AI Starter Kit is here, Olivia"]);
  });

  it("emails the kit link again on a repeat opt-in, at most once a day per address", async () => {
    const email = "nina.repeat@example.com";
    const optIn = () => captureGuideOptIn({ name: "Nina Name", email, interest: "life" }, "/free-guide");
    expect((await optIn()).emailed).toBe(true);
    expect((await optIn()).emailed).toBe(true);
    // Second repeat the same day: no email, so the confirmation mustn't promise one.
    expect((await optIn()).emailed).toBe(false);
    expect((await optIn()).emailed).toBe(false);

    // The cap lasts a day, not an hour: still refused 23 hours on, allowed again after 24.
    const db = await getDb();
    const key = eq(schema.rateLimits.key, `guide-link:${email}`);
    await db.update(schema.rateLimits).set({ windowStart: sql`now() - interval '23 hours'` }).where(key);
    expect((await optIn()).emailed).toBe(false);
    await db.update(schema.rateLimits).set({ windowStart: sql`now() - interval '25 hours'` }).where(key);
    expect((await optIn()).emailed).toBe(true);

    const sent = await db.select().from(schema.emailLog).where(eq(schema.emailLog.to, email));
    expect(sent.filter((e) => e.kind === "sequence").map((e) => e.subject)).toEqual(["Your AI Starter Kit is here, Nina"]);
    const links = sent.filter((e) => e.kind === "guide_link");
    expect(links).toHaveLength(2);
    expect(links[0].subject).toBe("Here's your link to the AI Starter Kit");
    expect(links[0].html).toContain("/guide?src=email");
    expect(links[0].html).not.toContain("/unsubscribe/");
    // The owner is told the sequence wasn't restarted.
    const alerts = await db.select().from(schema.emailLog).where(eq(schema.emailLog.subject, "[Principe AI] New lead: Nina Name downloaded the Starter Kit"));
    expect(alerts.some((e) => e.html.includes("the welcome sequence wasn"))).toBe(true);
  });

  it("never emails the kit link to an unsubscribed contact (anyone can type their address)", async () => {
    const email = "dana.unsub@example.com";
    const first = await captureGuideOptIn({ name: "Dana Customer", email, interest: "business" }, "/free-guide");
    const db = await getDb();
    await db.update(schema.contacts).set({ unsubscribed: true }).where(eq(schema.contacts.id, first.contact.id));
    const again = await captureGuideOptIn({ name: "Dana Customer", email, interest: "business" }, "/guide");
    // No email, so the confirmation doesn't promise one (the kit is still unlocked in the browser that asked).
    expect(again.emailed).toBe(false);
    const links = await db.select().from(schema.emailLog).where(and(eq(schema.emailLog.to, email), eq(schema.emailLog.kind, "guide_link")));
    expect(links).toHaveLength(0);
    // ...and the opt-in doesn't quietly resubscribe them.
    const [fresh] = await db.select().from(schema.contacts).where(eq(schema.contacts.id, first.contact.id));
    expect(fresh.unsubscribed).toBe(true);
  });

  it("emails the kit link when the welcome sequence is paused", async () => {
    const db = await getDb();
    const seq = schema.emailSequences;
    const active = await db.select({ id: seq.id }).from(seq).where(and(eq(seq.trigger, "lead_magnet"), eq(seq.active, true)));
    expect(active.length).toBeGreaterThan(0);
    await db.update(seq).set({ active: false }).where(eq(seq.trigger, "lead_magnet"));
    try {
      const email = "paula.paused@example.com";
      const { emailed } = await captureGuideOptIn({ name: "Paula", email, interest: "both" }, "/");
      expect(emailed).toBe(true);
      const sent = await db.select().from(schema.emailLog).where(eq(schema.emailLog.to, email));
      expect(sent.map((e) => e.kind)).toEqual(["guide_link"]);
    } finally {
      for (const { id } of active) await db.update(seq).set({ active: true }).where(eq(seq.id, id));
    }
  });

  it("captures an application as a qualified lead with a deal value and a high-priority task", async () => {
    const contact = await captureApplication(applicationSchema.parse({ ...validApplication, email: "avery.leads@example.com" }));
    const db = await getDb();
    const [fresh] = await db.select().from(schema.contacts).where(eq(schema.contacts.id, contact.id));
    expect(fresh.stage).toBe("qualified");
    expect(fresh.company).toBe("Acme Bakery");
    expect(fresh.website).toBe("https://acmebakery.com");
    expect(fresh.segment).toBe("business");
    expect(fresh.tags).toContain("implementation");
    expect(fresh.dealValueCents).toBe(1_000_000);

    const [task] = await db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.contactId, contact.id), eq(schema.tasks.origin, "application")));
    expect(task.priority).toBe("high");
    expect(task.title).toBe("Review implementation application — Acme Bakery");
    expect(task.dueAt!.getTime()).toBeGreaterThan(Date.now() + 23 * 3_600_000);

    const acts = await db.select().from(schema.activities).where(eq(schema.activities.contactId, contact.id));
    const app = acts.find((a) => a.type === "form");
    expect(app?.title).toBe("Implementation application");
    expect(app?.meta).toMatchObject({ company: "Acme Bakery", budget: "$5,000 – $15,000" });
  });

  it("captures a contact message with a reply task", async () => {
    const contact = await captureContactMessage({ name: "Casey Contact", email: "casey.leads@example.com", topic: "workshop", message: "Do you run team workshops?" });
    expect(contact.source).toBe("contact_form");
    expect(contact.segment).toBe("business");
    const db = await getDb();
    const tasks = await db.select().from(schema.tasks).where(eq(schema.tasks.contactId, contact.id));
    expect(tasks).toHaveLength(1);
    expect(tasks[0].origin).toBe("contact_form");
  });
});
