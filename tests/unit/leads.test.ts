import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { BUDGET_OPTIONS, INTEREST_OPTIONS, optionLabel, optionValues } from "@/components/marketing/lead-options";
import { categoryAnchor, kitStats, kitSummary } from "@/components/marketing/starter-kit-utils";
import type { StarterKit } from "@/content/starter-kit";
import { getDb, schema } from "@/db";
import {
  applicationSchema,
  captureApplication,
  captureContactMessage,
  captureGuideOptIn,
  contactSchema,
  escapeMarkdown,
  fieldErrorsOf,
  formatApplication,
  isSpam,
  normalizeWebsite,
  optInSchema,
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
    expect(escapeMarkdown("[click](http://evil)")).toBe("\\[click\\]\\(http://evil\\)");
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

describe("lead captures (PGlite)", () => {
  it("captures a Starter Kit opt-in as a new, tagged lead with a welcome email", async () => {
    const contact = await captureGuideOptIn({ name: "Olivia Optin", email: "olivia.leads@example.com", interest: "business" }, "/free-guide");
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
