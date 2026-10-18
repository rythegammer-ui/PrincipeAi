/**
 * Sample CRM data so the admin dashboard isn't empty in local dev / demo mode.
 * Every sample contact is tagged "sample" and uses an @example.com address.
 * Never runs against a real Postgres database unless SEED_DEMO_DATA=1.
 *
 * Deterministic: a seeded PRNG drives every choice, so each fresh database gets the same people,
 * journeys and numbers (dates are relative to "now"). Everything is generated in memory and
 * written with a handful of bulk inserts.
 *
 * NOTE: no "server-only" or "@/" imports — this module can also run from scripts via tsx.
 */
import { asc, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { DateTime } from "luxon";
import { scoreBreakdown } from "../components/admin/crm-utils";
import { site } from "../config/site";
import * as schema from "./schema";
import type { ActivityType, BookingStatus, ChatMessage, Stage, UtmParams } from "./schema";

type DB = PostgresJsDatabase<typeof schema>;

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/* ------------------------------------------------------------------ */
/* Seeded randomness                                                   */
/* ------------------------------------------------------------------ */

class Rng {
  private s: number;
  constructor(seed: number) {
    this.s = seed >>> 0;
  }
  /** mulberry32 */
  next(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  chance(p: number): boolean {
    return this.next() < p;
  }
  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }
  weighted<T>(entries: readonly (readonly [T, number])[]): T {
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let r = this.next() * total;
    for (const [value, w] of entries) {
      r -= w;
      if (r <= 0) return value;
    }
    return entries[entries.length - 1][0];
  }
  shuffle<T>(items: T[]): T[] {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  uuid(): string {
    const h = Array.from({ length: 32 }, () => Math.floor(this.next() * 16).toString(16));
    h[12] = "4";
    h[16] = ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16);
    const s = h.join("");
    return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
  }
}

/* ------------------------------------------------------------------ */
/* Sample people + content                                             */
/* ------------------------------------------------------------------ */

const PEOPLE = [
  "Maya Thompson", "Daniel Okafor", "Priya Raman", "Lucas Moreau", "Sofia Alvarez", "James Whitfield", "Aisha Bello",
  "Ethan Brooks", "Hannah Kim", "Marcus Reid", "Olivia Grant", "Diego Santos", "Chloe Martin", "Samuel Adeyemi",
  "Grace Liu", "Noah Patel", "Isabella Rossi", "Kwame Mensah", "Emily Carter", "Ravi Shah", "Zoe Bennett",
  "Tomás Herrera", "Leah Goldberg", "Andre Williams", "Mei Chen", "Jonah Fischer", "Fatima Haddad", "Connor Walsh",
  "Amara Nwosu", "Ben Harper", "Yuki Tanaka", "Rachel Stein", "Omar Farouk", "Lily Evans", "Victor Nguyen",
  "Nadia Petrova", "Caleb Foster", "Elena Costa", "Jamal Hughes", "Sara Lindqvist", "Patrick Nolan", "Anika Desai",
  "Henry Cole", "Julia Novak", "Mateo Rivera",
] as const;

const COMPANIES = [
  "Brightline Dental", "Harbor & Pine Realty", "Northside Physio", "Copperleaf Bakery", "Summit Bookkeeping",
  "Bluebird Travel Co.", "Atlas Landscaping", "Kindred Wellness Studio", "Riverbend Law Group", "Oakridge Property Management",
  "Lumen Marketing", "Fieldstone Construction", "Cedar & Sage Interiors", "Pinecrest Insurance", "Waypoint Logistics",
  "Golden Hour Photography", "Maple Street Coffee", "Evergreen HR Partners", "Ironwood Fitness", "Clearwater Accounting",
  "Silverline Consulting", "Hearth Home Services", "Westfield Veterinary", "Brightpath Tutoring",
] as const;

const TIMEZONES = ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Toronto", "Europe/London"] as const;

type Source = "lead_magnet" | "assessment" | "booking" | "chat" | "checkout" | "contact_form" | "application" | "manual";
type Channel = "google" | "instagram" | "youtube" | "linkedin" | "newsletter" | "direct";

const STAGE_RANK: Record<Stage, number> = { new: 0, engaged: 1, qualified: 2, call_booked: 3, proposal: 4, customer: 5, lost: -1 };

/** Stage mix for the 45 sample contacts. */
const STAGE_PLAN: Stage[] = [
  ...Array<Stage>(12).fill("new"),
  ...Array<Stage>(9).fill("engaged"),
  ...Array<Stage>(7).fill("qualified"),
  ...Array<Stage>(5).fill("call_booked"),
  ...Array<Stage>(4).fill("proposal"),
  ...Array<Stage>(6).fill("customer"),
  ...Array<Stage>(2).fill("lost"),
];

const SOURCE_BY_STAGE: Record<Stage, readonly (readonly [Source, number])[]> = {
  new: [["lead_magnet", 50], ["assessment", 15], ["chat", 10], ["contact_form", 12], ["manual", 13]],
  engaged: [["lead_magnet", 35], ["assessment", 35], ["chat", 20], ["checkout", 10]],
  qualified: [["assessment", 45], ["lead_magnet", 20], ["application", 20], ["chat", 15]],
  call_booked: [["booking", 40], ["assessment", 30], ["lead_magnet", 20], ["application", 10]],
  proposal: [["booking", 30], ["application", 35], ["assessment", 20], ["contact_form", 15]],
  customer: [["checkout", 35], ["lead_magnet", 25], ["assessment", 25], ["booking", 15]],
  lost: [["lead_magnet", 50], ["booking", 50]],
};

/** How long ago (days) contacts in each stage first appeared. */
const AGE_BY_STAGE: Record<Stage, [number, number]> = {
  new: [0, 24],
  engaged: [2, 40],
  qualified: [5, 50],
  call_booked: [6, 45],
  proposal: [12, 55],
  customer: [10, 59],
  lost: [20, 58],
};

const CHANNELS: readonly (readonly [Channel, number])[] = [
  ["google", 25],
  ["instagram", 20],
  ["youtube", 15],
  ["linkedin", 15],
  ["newsletter", 10],
  ["direct", 15],
];

const CHANNEL_META: Record<Channel, { medium?: string; referrer: string | null; campaigns: string[] }> = {
  google: { medium: "cpc", referrer: "https://www.google.com/", campaigns: ["ai-courses-search", "ai-consulting-search"] },
  instagram: { medium: "social", referrer: "https://l.instagram.com/", campaigns: ["reels-ai-tips", "starter-kit-promo"] },
  youtube: { medium: "video", referrer: "https://www.youtube.com/", campaigns: ["ai-for-beginners-series", "automation-walkthrough"] },
  linkedin: { medium: "social", referrer: "https://www.linkedin.com/", campaigns: ["ai-for-owners", "implementation-case-notes"] },
  newsletter: { medium: "email", referrer: null, campaigns: ["weekly-ai-brief"] },
  direct: { referrer: null, campaigns: [] },
};

const LANDING: Record<Source, string | null> = {
  lead_magnet: "/free-guide",
  assessment: "/assessment",
  booking: "/book",
  chat: "/",
  checkout: "/courses",
  contact_form: "/contact",
  application: "/consulting",
  manual: null,
};

const BROWSE_PATHS = ["/", "/courses", "/about", "/assessment", "/courses/ai-essentials", "/courses/ai-for-business", "/consulting", "/book", "/free-guide"];

const QUIZ_GOALS = {
  "Save time on admin & email": ["Drafting replies to routine emails", "Summarising long threads and documents", "Turning meeting notes into action items"],
  "Create content faster": ["Outlining posts, newsletters and videos", "Repurposing one idea into several formats", "Writing first drafts in your own voice"],
  "Automate customer service": ["Drafting answers to frequently asked questions", "Sorting and prioritising incoming requests", "Building a knowledge base your team can search"],
  "Learn AI for my career": ["Writing better prompts for everyday work tasks", "Researching and summarising faster", "Building a small portfolio of AI-assisted projects"],
  "Organise my personal life": ["Meal planning and shopping lists", "Trip and event planning", "Keeping your calendar and to-dos under control"],
} as const;
type QuizGoal = keyof typeof QUIZ_GOALS;

const RECOMMENDATION_TEXT: Record<string, string> = {
  "ai-essentials": "Start with **AI Essentials** — short, practical lessons that build everyday confidence with AI tools.",
  "ai-for-business": "Take **AI for Business Owners** to find your highest-value AI opportunities and put them to work in 30 days.",
  "ai-automation-accelerator": "Join the **AI Automation Accelerator** to connect AI to your tools and build workflows that run on their own.",
  consulting: "Book an **AI Implementation Discovery Call** — you're ready for done-with-you systems built around your business.",
};

const CONTACT_MESSAGES = [
  "Hi — I run a small team and we're curious about using AI for our weekly reporting. Do you offer workshops for teams?",
  "Do you offer any group training for non-technical staff? We'd like everyone on the same page with AI tools.",
  "I saw your video on AI for small businesses. Could you tell me more about how coaching sessions work?",
];

const APPLICATION_PROJECTS = [
  "We spend hours each week writing quotes from customer emails. We'd love an assistant that drafts them in our format.",
  "Our front desk answers the same patient questions all day. Looking for help setting up AI-drafted email replies.",
  "We want to turn our internal SOPs into a searchable AI assistant for new hires.",
  "Looking to automate client onboarding: intake form → summary → welcome email and task list.",
];

const CHAT_SCRIPTS: { path: string; lead: boolean; messages: [ChatMessage["role"], string][] }[] = [
  {
    path: "/",
    lead: true,
    messages: [
      ["user", "Hi! I've barely used ChatGPT. Is there a course for complete beginners?"],
      ["assistant", "Absolutely — **AI Essentials** is built for exactly that. It starts with what AI is (and isn't), then walks you through everyday uses like planning meals, writing emails and organising your week. No tech background needed, and you can go at your own pace."],
      ["user", "Can I do it on my phone?"],
      ["assistant", "Yes — everything works in a mobile browser, and the AI tools we cover have phone apps too. If you'd like a personalised starting point first, the free 3-minute AI assessment is a great option."],
      ["user", "Great, I'll take the assessment first. My email is {email}"],
      ["assistant", "Perfect, thanks! I've noted your email so the team can follow up with anything useful. Your results page will suggest exactly where to start."],
    ],
  },
  {
    path: "/consulting",
    lead: true,
    messages: [
      ["user", "Can AI help my front desk answer patient emails? We're drowning in appointment questions."],
      ["assistant", "It can — this is one of the most common wins for small practices. A typical setup drafts replies to routine questions (opening hours, rescheduling, what to bring) for your team to review and send, so nothing goes out without a human check."],
      ["user", "Do you do the setup or do we have to?"],
      ["assistant", "Both options exist: **AI for Business Owners** shows you how to do it yourself, or our done-with-you implementation service builds it with you. The best next step is a free 30-minute strategy call."],
      ["user", "OK. Send me details at {email}"],
      ["assistant", "Done — I've passed your email to the team. You can also grab a strategy call slot any time on the booking page."],
    ],
  },
  {
    path: "/consulting",
    lead: true,
    messages: [
      ["user", "How long does an AI implementation project usually take?"],
      ["assistant", "It depends on scope. A single workflow — like drafting proposals or summarising intake forms — is much quicker than connecting several systems. On the discovery call we map your process and agree a clear scope and timeline before anything starts."],
      ["user", "We're a 12-person logistics company. Our main pain is quoting. I'm at {email}"],
      ["assistant", "Quoting is a great candidate: AI can pull details from emails, draft a quote in your format and flag anything unusual for review. I'd suggest booking the AI Implementation Discovery Call so we can look at your current process together."],
    ],
  },
  {
    path: "/courses/ai-for-business",
    lead: false,
    messages: [
      ["user", "Is the business course self-paced? I travel a lot."],
      ["assistant", "Yes — it's fully self-paced, so you can work through lessons whenever suits you. Each lesson is short and ends with a practical exercise you apply to your own business."],
      ["user", "And if I get stuck?"],
      ["assistant", "Every lesson has an AI tutor you can ask questions, and you can book a 1:1 coaching session if you'd like hands-on help."],
    ],
  },
  {
    path: "/",
    lead: true,
    messages: [
      ["user", "I run a small bakery Instagram account. Can AI help me post more consistently?"],
      ["assistant", "Definitely. AI is great at turning one idea into a week of captions, planning a content calendar and suggesting posts around seasonal products."],
      ["user", "Which course would you pick for me? Email me at {email}"],
      ["assistant", "If you're new to AI tools, start with **AI Essentials** — it's quick and inexpensive. If you want systems for the business, go for **AI for Business Owners**. I've saved your email so we can send you the details."],
    ],
  },
  {
    path: "/",
    lead: true,
    messages: [
      ["user", "Can you help me automate parts of my bookkeeping workflow?"],
      ["assistant", "Often, yes — categorising receipts, summarising statements and drafting client reminders are good fits. Anything involving final figures should always be reviewed by a person."],
      ["user", "Sounds useful. I'm {email} — what do you need from me?"],
      ["assistant", "Thanks! Book a free strategy call and jot down the tasks that take you the most time each week. That's enough for us to show you where AI can help first."],
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Seed                                                                */
/* ------------------------------------------------------------------ */

type Insert<T extends { $inferInsert: unknown }> = T["$inferInsert"];

async function insertChunked<T>(rows: T[], insert: (chunk: T[]) => Promise<unknown>, size = 400) {
  for (let i = 0; i < rows.length; i += size) await insert(rows.slice(i, i + size));
}

function asciiSlug(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "");
}

export async function seedDemoData(db: DB): Promise<void> {
  const rng = new Rng(20_261_018);
  const now = Date.now();
  const TZ = site.timezone;
  const past = (ms: number) => Math.min(ms, now - 10 * MIN);

  const [courses, meetingTypes, sequences, steps, lessonRows] = await Promise.all([
    db.select({ id: schema.courses.id, slug: schema.courses.slug, title: schema.courses.title, priceCents: schema.courses.priceCents }).from(schema.courses),
    db.select().from(schema.meetingTypes),
    db.select().from(schema.emailSequences),
    db.select().from(schema.sequenceSteps).orderBy(asc(schema.sequenceSteps.position)),
    db
      .select({ id: schema.lessons.id, courseId: schema.lessons.courseId, title: schema.lessons.title })
      .from(schema.lessons)
      .innerJoin(schema.courseModules, eq(schema.courseModules.id, schema.lessons.moduleId))
      .orderBy(asc(schema.courseModules.position), asc(schema.lessons.position)),
  ]);
  const courseBySlug = new Map(courses.map((c) => [c.slug, c]));
  const typeBySlug = new Map(meetingTypes.map((m) => [m.slug, m]));
  const seqByTrigger = new Map(sequences.filter((s) => s.active).map((s) => [s.trigger, s]));
  const stepsBySeq = new Map<string, typeof steps>();
  for (const st of steps) stepsBySeq.set(st.sequenceId, [...(stepsBySeq.get(st.sequenceId) ?? []), st]);
  const lessonsByCourse = new Map<string, typeof lessonRows>();
  for (const l of lessonRows) lessonsByCourse.set(l.courseId, [...(lessonsByCourse.get(l.courseId) ?? []), l]);

  const contacts: Insert<typeof schema.contacts>[] = [];
  const activities: Insert<typeof schema.activities>[] = [];
  const events: Insert<typeof schema.events>[] = [];
  const quizzes: Insert<typeof schema.quizSubmissions>[] = [];
  const bookings: Insert<typeof schema.bookings>[] = [];
  const orders: Insert<typeof schema.orders>[] = [];
  const users: Insert<typeof schema.users>[] = [];
  const enrollments: Insert<typeof schema.enrollments>[] = [];
  const progress: Insert<typeof schema.lessonProgress>[] = [];
  const chats: Insert<typeof schema.chatConversations>[] = [];
  const emails: Insert<typeof schema.emailLog>[] = [];
  const seqEnrollments: Insert<typeof schema.sequenceEnrollments>[] = [];
  const tasks: Insert<typeof schema.tasks>[] = [];

  type Built = {
    id: string;
    name: string;
    first: string;
    email: string;
    company: string | null;
    stage: Stage;
    source: Source;
    createdAt: number;
    upcomingBooking?: { startAt: Date; type: string };
    tz: string;
  };
  const built: Built[] = [];

  const usedSlots = new Set<number>();
  const businessSlot = (dayMs: number, hour: number, minute: number, direction: 1 | -1): Date => {
    let dt = DateTime.fromMillis(dayMs, { zone: TZ }).set({ hour, minute, second: 0, millisecond: 0 });
    while (dt.weekday > 5 || usedSlots.has(dt.toMillis())) dt = dt.plus({ days: direction });
    usedSlots.add(dt.toMillis());
    return dt.toJSDate();
  };

  const stagePlan = rng.shuffle(STAGE_PLAN);
  const companies = rng.shuffle([...COMPANIES]);
  let companyIdx = 0;
  let chatIdx = 0;
  let upcomingIdx = 0;
  const upcomingSlots: [number, number, number][] = [
    [1, 10, 0],
    [1, 14, 30],
    [2, 11, 0],
    [4, 15, 0],
    [6, 9, 30],
  ];

  PEOPLE.forEach((fullName, i) => {
    const stage = stagePlan[i];
    const picked = rng.weighted(SOURCE_BY_STAGE[stage]);
    // Keep the sample to ~10 assessments and ≤ 6 chat transcripts.
    const source: Source = (picked === "chat" && chats.length >= 6) || (picked === "assessment" && quizzes.length >= 11) ? "lead_magnet" : picked;
    const id = rng.uuid();
    const visitorId = source === "manual" ? null : rng.uuid();
    const first = fullName.split(" ")[0];
    const email = `${asciiSlug(fullName)}@example.com`;
    const segment = rng.weighted([
      ["business", source === "application" || source === "booking" ? 80 : 45],
      ["life", source === "application" ? 0 : 35],
      ["both", 20],
    ] as const);
    const company = segment === "life" ? null : companies[companyIdx++ % companies.length];
    const channel: Channel = source === "manual" ? "direct" : rng.weighted(segment === "business" ? CHANNELS.map(([c, w]) => [c, c === "linkedin" ? w * 2 : w] as const) : CHANNELS);
    const cm = CHANNEL_META[channel];
    const utm: UtmParams = channel === "direct" ? {} : { source: channel, ...(cm.medium ? { medium: cm.medium } : {}), ...(cm.campaigns.length ? { campaign: rng.pick(cm.campaigns) } : {}) };
    const landing = LANDING[source];
    const [minAge, maxAge] = AGE_BY_STAGE[stage];
    const t0 = past(now - rng.range(minAge, maxAge) * DAY - rng.range(0, 10) * HOUR);
    const tz = rng.pick(TIMEZONES);
    const phone = rng.chance(segment === "life" ? 0.25 : 0.6) ? `+1 (555) 01${rng.int(10, 99)}-${rng.int(1000, 9999)}` : null;
    const website = company && rng.chance(0.6) ? `${asciiSlug(company).replace(/\./g, "")}.example.com` : null;

    const acts: Insert<typeof schema.activities>[] = [];
    let cursor = t0;
    let current: Stage = "new";
    let dealValueCents = 0;
    let lifetimeValueCents = 0;
    let unsubscribed = false;
    let notes: string | null = null;
    const tags = new Set<string>(["sample"]);
    // Held in an object so TypeScript doesn't narrow it to `null` (it's assigned inside closures).
    const state: { quiz: { score: number; tier: string; boost: number; recommendation: string } | null } = { quiz: null };

    const act = (type: ActivityType, title: string, when: number, opts: { body?: string; meta?: Record<string, unknown> } = {}) => {
      acts.push({ id: rng.uuid(), contactId: id, type, title, body: opts.body ?? null, meta: opts.meta ?? {}, createdAt: new Date(when) });
    };
    const ev = (name: string, when: number, path: string | null, props: Record<string, unknown> = {}) => {
      if (!visitorId) return;
      events.push({ visitorId, contactId: id, name, path, referrer: name === "page_view" && path === landing ? cm.referrer : null, utm, props, createdAt: new Date(when) });
    };
    /** Moves the cursor forward by a random amount, never past "now". */
    const advance = (minH: number, maxH: number) => {
      const room = now - 20 * MIN - cursor;
      cursor += Math.max(5 * MIN, Math.min(rng.range(minH, maxH) * HOUR, room * 0.45));
      return cursor;
    };
    const moveTo = (to: Stage, when: number, auto = true) => {
      if (to === current) return;
      act("stage_changed", `Stage → ${to.replace("_", " ")}`, when, { meta: { from: current, to, ...(auto ? { auto: true } : {}) } });
      current = to;
    };
    const emailOut = (subject: string, kind: string, when: number) => {
      emails.push({ contactId: id, to: email, subject, kind, status: "simulated", html: `<p>${subject.replace(/[<>&"]/g, "")}</p><p>(Sample email generated with the demo data.)</p>`, createdAt: new Date(when) });
    };
    const enrolled = new Set<string>();
    const enroll = (trigger: schema.SequenceTrigger, when: number) => {
      const seq = seqByTrigger.get(trigger);
      const seqSteps = seq ? stepsBySeq.get(seq.id) ?? [] : [];
      if (!seq || !seqSteps.length || enrolled.has(seq.id)) return;
      enrolled.add(seq.id);
      let t = when;
      let sent = 0;
      for (const st of seqSteps) {
        const due = t + st.delayHours * HOUR;
        if (due > now - 5 * MIN) break;
        t = due;
        const subject = st.subject.replace(/\{\{\s*firstName\s*\}\}/g, first).replace(/\{\{\s*\w+\s*\}\}/g, "");
        emails.push({ contactId: id, to: email, subject, kind: "sequence", status: "simulated", html: `<p>${subject.replace(/[<>&"]/g, "")}</p>`, createdAt: new Date(due) });
        act("email_sent", `Email sent: ${subject}`, due, { meta: { sequenceId: seq.id, sequence: seq.name, step: sent } });
        sent++;
      }
      const next = seqSteps[sent];
      seqEnrollments.push({
        sequenceId: seq.id,
        contactId: id,
        nextStep: sent,
        nextRunAt: next ? new Date(Math.max(t + next.delayHours * HOUR, now + 2 * HOUR)) : null,
        status: next ? "active" : "completed",
        createdAt: new Date(when),
      });
    };
    const takeQuiz = (when: number, highIntent: boolean) => {
      const goal = rng.pick(Object.keys(QUIZ_GOALS) as QuizGoal[]);
      const experience = rng.pick(["Never used AI tools", "Tried ChatGPT a few times", "Use AI weekly", "Use AI daily"]);
      const timeline = highIntent ? rng.pick(["This month", "Next 3 months"]) : rng.pick(["Exploring", "Next 3 months"]);
      const budget = segment === "life" ? rng.pick(["Under $500", "$500–$2,000"]) : highIntent ? rng.pick(["$2,000–$10,000", "$10,000+"]) : rng.pick(["Under $500", "$500–$2,000"]);
      const teamSize = segment === "life" ? "Just me" : rng.pick(["Just me", "2–10", "11–50"]);
      const score = Math.min(96, ["Never used AI tools", "Tried ChatGPT a few times", "Use AI weekly", "Use AI daily"].indexOf(experience) * 16 + (highIntent ? 30 : 12) + rng.int(0, 14));
      const tier = score >= 80 ? "scaler" : score >= 60 ? "implementer" : score >= 35 ? "experimenter" : "explorer";
      const boost = Math.min(20, (timeline === "This month" ? 10 : timeline === "Next 3 months" ? 5 : 0) + (budget === "$10,000+" ? 10 : budget === "$2,000–$10,000" ? 8 : 0));
      const recommendation =
        segment === "life" ? "ai-essentials" : highIntent && tier !== "explorer" ? (budget === "$10,000+" ? "consulting" : "ai-automation-accelerator") : tier === "explorer" ? "ai-essentials" : "ai-for-business";
      const answers = {
        role: segment === "life" ? rng.pick(["Employee", "Freelancer", "Retired", "Student"]) : rng.pick(["Business owner", "Manager", "Founder"]),
        goal,
        experience,
        team_size: teamSize,
        timeline,
        budget,
      };
      const bullets = QUIZ_GOALS[goal];
      const plan = [
        `## Your AI plan, ${first}`,
        "",
        `**Readiness:** ${score}/100 — ${tier.charAt(0).toUpperCase()}${tier.slice(1)}`,
        "",
        "### Where AI can help you first",
        ...bullets.map((b) => `- ${b}`),
        "",
        "### Your next 30 days",
        "1. **Week 1 — Set up your tools.** Pick one AI assistant and save three prompts you'll reuse.",
        `2. **Week 2 — One quick win.** Use AI for “${bullets[0].toLowerCase()}” every day and note the time it saves.`,
        `3. **Week 3 — Build a routine.** Turn your best prompts into templates${teamSize === "Just me" ? "" : " and share them with your team"}.`,
        "4. **Week 4 — Review and expand.** Choose the next task to hand over to AI.",
        "",
        "### Recommended next step",
        RECOMMENDATION_TEXT[recommendation] ?? RECOMMENDATION_TEXT["ai-essentials"],
      ].join("\n");
      ev("quiz_started", when - rng.int(3, 6) * MIN, "/assessment");
      ev("quiz_completed", when, "/assessment", { score, tier });
      act("quiz_completed", `Completed the AI readiness assessment (${score}/100)`, when, { meta: { score, tier, recommendation, scoreBoost: boost } });
      quizzes.push({ id: rng.uuid(), contactId: id, answers, score, tier, recommendation, plan, createdAt: new Date(when) });
      emailOut(`${first}, your AI readiness results are ready`, "quiz_results", when + MIN);
      state.quiz = { score, tier, boost, recommendation };
      tags.add(`tier:${tier}`);
      enroll("quiz_completed", when);
    };
    const chatWith = (when: number) => {
      const script = CHAT_SCRIPTS[chatIdx++ % CHAT_SCRIPTS.length];
      const msgs: ChatMessage[] = script.messages.map(([role, content], mi) => ({ role, content: content.replace("{email}", email), at: new Date(when + mi * 40_000).toISOString() }));
      ev("chat_opened", when - MIN, script.path);
      ev("chat_started", when, script.path);
      if (script.lead) ev("chat_lead", when + 3 * MIN, script.path);
      chats.push({ id: rng.uuid(), visitorId: visitorId ?? `contact:${id}`, contactId: id, kind: "assistant", messages: msgs, path: script.path, createdAt: new Date(when), updatedAt: new Date(when + msgs.length * 40_000) });
      act("chat", script.lead ? "Shared their email in the AI assistant chat" : "Chatted with the AI assistant", when + 3 * MIN, { body: msgs.find((m) => m.role === "user")?.content });
    };
    const book = (slug: string, startAt: Date, createdAt: number, status: BookingStatus) => {
      const mt = typeBySlug.get(slug) ?? meetingTypes[0];
      if (!mt) return null;
      const answers: Record<string, string> =
        slug === "implementation-discovery"
          ? { company: company ?? `${first}'s business`, project: rng.pick(APPLICATION_PROJECTS), budget: rng.pick(["$2,000–$5,000", "$5,000–$10,000", "$10,000+"]) }
          : slug === "ai-coaching-session"
            ? { agenda: "Build a weekly content workflow with AI and set up reusable prompts." }
            : { goal: rng.pick(["Save time on email and admin", "Figure out which AI tools are worth paying for", "Automate client onboarding", "Create content faster"]), business: company ?? "" };
      const bookingId = rng.uuid();
      bookings.push({
        id: bookingId,
        meetingTypeId: mt.id,
        contactId: id,
        startAt,
        endAt: new Date(startAt.getTime() + mt.durationMin * MIN),
        timezone: tz,
        status,
        answers,
        createdAt: new Date(createdAt),
        updatedAt: new Date(createdAt),
        reminderSentAt: status === "completed" ? new Date(startAt.getTime() - DAY) : null,
      });
      ev("booking_viewed", createdAt - rng.int(2, 8) * MIN, `/book/${mt.slug}`);
      ev("booking_created", createdAt, `/book/${mt.slug}`, { meetingType: mt.slug });
      act("booking_created", `Booked: ${mt.name}`, createdAt, { meta: { meetingType: mt.name, startAt: startAt.toISOString() } });
      emailOut(`Confirmed: ${mt.name}`, "booking_confirmation", createdAt + MIN);
      enroll("call_booked", createdAt);
      return { id: bookingId, mt };
    };
    const purchase = (slug: string, when: number) => {
      const course = courseBySlug.get(slug);
      if (!course) return null;
      const orderId = rng.uuid();
      ev("checkout_started", when - rng.int(3, 10) * MIN, `/courses/${slug}`, { course: slug });
      ev("purchase", when, "/checkout/success", { course: slug, amountCents: course.priceCents });
      orders.push({
        id: orderId,
        contactId: id,
        email,
        name: fullName,
        itemType: "course",
        courseId: course.id,
        description: course.title,
        amountCents: course.priceCents,
        currency: "usd",
        status: "paid",
        isTest: true,
        paidAt: new Date(when),
        createdAt: new Date(when - 5 * MIN),
        updatedAt: new Date(when),
      });
      act("purchase", `Purchased ${course.title}`, when, { meta: { amountCents: course.priceCents, course: course.slug } });
      emailOut(`Your receipt — ${course.title}`, "receipt", when + MIN);
      emailOut(`You're in: ${course.title}`, "course_access", when + 2 * MIN);
      lifetimeValueCents += course.priceCents;
      return { orderId, course };
    };

    /* ---- First touch ---- */
    if (visitorId && landing) {
      if (rng.chance(0.3)) ev("page_view", t0 - rng.range(1, 6) * DAY, "/");
      ev("page_view", t0 - rng.int(3, 25) * MIN, landing);
    }
    act("created", `Contact created via ${source.replace(/_/g, " ")}`, t0, {
      meta: { source, utm, referrer: cm.referrer, landingPage: landing },
    });
    switch (source) {
      case "lead_magnet":
        ev("optin", t0, "/free-guide");
        ev("guide_viewed", t0 + 2 * MIN, "/guide");
        act("optin", "Downloaded the free AI Starter Kit", t0);
        tags.add("starter-kit");
        enroll("lead_magnet", t0);
        break;
      case "assessment":
        takeQuiz(t0, STAGE_RANK[stage] >= 2 && rng.chance(0.75));
        break;
      case "chat":
        chatWith(t0);
        break;
      case "contact_form": {
        const msg = rng.pick(CONTACT_MESSAGES);
        ev("contact_form", t0, "/contact");
        act("form", "Sent a message through the contact form", t0, { body: msg });
        enroll("contact_form", t0);
        if (stage === "new") tasks.push({ contactId: id, title: `Reply to ${first}'s contact form message`, description: msg, dueAt: new Date(now + 3 * HOUR), priority: "high", origin: "contact_form", createdAt: new Date(t0) });
        break;
      }
      case "application": {
        const project = rng.pick(APPLICATION_PROJECTS);
        ev("application", t0, "/consulting");
        act("form", "Applied for done-with-you AI implementation", t0, { body: project, meta: { budget: rng.pick(["$2,000–$5,000", "$5,000–$10,000", "$10,000+"]) } });
        tags.add("implementation");
        break;
      }
      case "checkout":
        ev("cta_click", t0 - 4 * MIN, "/courses", { cta: "course_card" });
        if (stage !== "customer") {
          ev("checkout_started", t0, "/courses/ai-essentials", { course: "ai-essentials" });
          act("form", "Started checkout for AI Essentials (not completed)", t0);
        }
        break;
      case "manual":
        act("note", "Note", t0, { body: rng.pick(["Met at the local chamber of commerce breakfast — interested in AI for their admin work.", "Referred by a past workshop attendee. Wants to explore AI for client communication."]), meta: { by: "admin" } });
        tags.add("referral");
        break;
      case "booking":
        break;
    }

    /* ---- Progression ---- */
    const rank = stage === "lost" ? 3 : STAGE_RANK[stage];
    const isCourseBuyer = stage === "customer" && source !== "booking";
    /** Booked a call (or bought) on the first visit — no warm-up steps before it. */
    const direct = source === "booking" || (source === "checkout" && stage === "customer");

    if (!direct && rank >= 1) {
      const when = advance(4, 72);
      if (!state.quiz && source !== "chat" && quizzes.length < 9 && rng.chance(0.5)) takeQuiz(when, rank >= 2);
      else if (source !== "chat" && chats.length < 3 && rng.chance(0.5)) chatWith(when);
      else ev("page_view", when, rng.pick(BROWSE_PATHS));
      moveTo("engaged", when + MIN);
      for (let k = rng.int(1, 4); k > 0; k--) ev("page_view", advance(1, 30), rng.pick(BROWSE_PATHS));
    }
    if (!direct && rank >= 2 && !isCourseBuyer) {
      const when = advance(6, 96);
      if (rank >= 3 && !state.quiz && quizzes.length < 13) {
        takeQuiz(when - 30 * MIN, true);
      } else if (source !== "application" && segment !== "life" && (state.quiz?.boost ?? 0) < 10 && rng.chance(0.5)) {
        ev("application", when, "/consulting");
        act("form", "Applied for done-with-you AI implementation", when, { body: rng.pick(APPLICATION_PROJECTS) });
        tags.add("implementation");
      }
      moveTo("qualified", when + MIN);
      dealValueCents = rng.pick([49_700, 99_700, 150_000]);
    }
    if (rank >= 3 && !isCourseBuyer) {
      const created = direct ? t0 : advance(6, 72);
      const slug = segment === "life" ? "ai-strategy-call" : rng.chance(0.55) ? "implementation-discovery" : "ai-strategy-call";
      if (stage === "call_booked" && upcomingIdx < upcomingSlots.length) {
        const [days, h, m] = upcomingSlots[upcomingIdx++];
        const startAt = businessSlot(now + days * DAY, h, m, 1);
        const b = book(slug, startAt, created, "confirmed");
        if (b) built.push({ id, name: fullName, first, email, company, stage, source, createdAt: t0, upcomingBooking: { startAt, type: b.mt.name }, tz });
        dealValueCents = rng.pick([150_000, 250_000, 350_000]);
      } else {
        const target = Math.max(t0 + 2 * DAY, Math.min(created + rng.range(1.5, 5) * DAY, now - 1.5 * DAY));
        const startAt = businessSlot(target, rng.pick([10, 11, 14, 15]), 0, -1);
        const status: BookingStatus = stage === "lost" && rng.chance(0.5) ? "no_show" : stage === "call_booked" ? "confirmed" : "completed";
        book(slug, startAt, Math.max(t0, Math.min(created, startAt.getTime() - DAY)), status);
        if (!dealValueCents) dealValueCents = rng.pick([99_700, 150_000, 250_000]);
        cursor = Math.max(cursor, startAt.getTime() + HOUR);
        if (status === "completed") {
          act("call", "Call logged — Connected", startAt.getTime() + 50 * MIN, {
            body: rng.pick([
              "Walked through their current workflow. Biggest time sinks: email triage and writing proposals. Interested in a done-with-you build.",
              "Good call. They want their team trained first, then automate client onboarding. Budget approved for this quarter.",
              "Mapped three quick wins. They'd like a proposal covering setup and two follow-up coaching sessions.",
            ]),
            meta: { by: "admin", outcome: "Connected" },
          });
        }
      }
      moveTo("call_booked", created + MIN);
    }
    if (rank >= 4 && stage !== "customer") {
      if (stage === "proposal") {
        const when = advance(12, 48);
        dealValueCents = rng.pick([250_000, 450_000, 650_000, 750_000]);
        act("note", "Note", when, { body: `Sent proposal for a done-with-you AI implementation (${(dealValueCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}).`, meta: { by: "admin" } });
        emailOut(`Your AI implementation proposal, ${first}`, "manual", when);
        act("email_sent", `Email sent: Your AI implementation proposal, ${first}`, when, { meta: { by: "admin", delivery: "simulated" } });
        moveTo("proposal", when + MIN, false);
        tags.add("proposal-sent");
      }
    }
    if (stage === "customer") {
      if (source === "booking") {
        // Paid coaching session customer.
        const created = advance(6, 48);
        const startAt = businessSlot(Math.max(created + DAY, Math.min(created + 3 * DAY, now - DAY)), 13, 0, -1);
        const b = book("ai-coaching-session", startAt, Math.min(created, startAt.getTime() - DAY), "completed");
        if (b) {
          orders.push({
            id: rng.uuid(),
            contactId: id,
            email,
            name: fullName,
            itemType: "booking",
            bookingId: b.id,
            description: b.mt.name,
            amountCents: b.mt.priceCents || 15_000,
            currency: "usd",
            status: "paid",
            isTest: true,
            paidAt: new Date(Math.min(created, startAt.getTime() - DAY)),
            createdAt: new Date(Math.min(created, startAt.getTime() - DAY) - 5 * MIN),
          });
          act("purchase", `Paid for ${b.mt.name}`, Math.min(created, startAt.getTime() - DAY) + MIN, { meta: { amountCents: b.mt.priceCents || 15_000 } });
          lifetimeValueCents += b.mt.priceCents || 15_000;
          moveTo("call_booked", Math.min(created, startAt.getTime() - DAY) + 2 * MIN);
        }
        cursor = Math.max(cursor, startAt.getTime() + HOUR);
        moveTo("customer", cursor);
        dealValueCents = lifetimeValueCents;
      } else {
        const when = direct ? t0 + 6 * MIN : advance(12, 120);
        const slugs = segment === "life" ? ["ai-essentials"] : segment === "both" ? ["ai-essentials", "ai-for-business"] : [rng.pick(["ai-for-business", "ai-automation-accelerator"])];
        const userId = rng.uuid();
        let firstOrder: string | null = null;
        let t = when;
        for (const slug of slugs) {
          const p = purchase(slug, t);
          if (!p) continue;
          firstOrder ??= p.orderId;
          enrollments.push({ userId, courseId: p.course.id, source: "purchase", orderId: p.orderId, createdAt: new Date(t) });
          const courseLessons = lessonsByCourse.get(p.course.id) ?? [];
          const done = Math.min(courseLessons.length, rng.int(1, 4));
          for (let k = 0; k < done; k++) {
            const lt = past(t + (k + 1) * rng.range(6, 30) * HOUR);
            progress.push({ userId, lessonId: courseLessons[k].id, completedAt: new Date(lt) });
            act("lesson_completed", `Completed lesson: ${courseLessons[k].title}`, lt, { meta: { course: p.course.title } });
          }
          t = past(t + rng.range(2, 6) * DAY);
        }
        moveTo("customer", when + 2 * MIN);
        const loginAt = past(when + rng.range(0.2, 2) * DAY);
        users.push({ id: userId, email, name: fullName, contactId: id, lastLoginAt: new Date(loginAt), createdAt: new Date(when) });
        act("login", "Logged in to the course portal", loginAt);
        tags.add("student");
        dealValueCents = lifetimeValueCents;
        void firstOrder;
      }
      enroll("purchase", cursor);
    }
    if (stage === "lost") {
      const when = advance(48, 200);
      act("note", "Note", when, {
        body: rng.pick(["Decided to revisit AI projects next quarter — budget is committed elsewhere for now.", "Missed the call and hasn't replied to two follow-ups. Parking for now."]),
        meta: { by: "admin" },
      });
      moveTo("lost", when + MIN, false);
      dealValueCents = rng.pick([150_000, 250_000]);
      if (rng.chance(0.5)) unsubscribed = true;
    }
    if (stage === "new" && i % 9 === 4) unsubscribed = true;

    if (rank >= 2 && rng.chance(0.4)) {
      notes = rng.pick([
        "Prefers email over phone. Decision maker, but wants their operations lead involved.",
        "Interested in team training for their staff before any automation work.",
        "Uses Google Workspace. Main goal: get hours back from admin each week.",
        "Mentioned a busy season coming up — follow up before then.",
      ]);
    }

    const lastActivity = acts.reduce((m, a) => Math.max(m, (a.createdAt as Date).getTime()), t0);
    const score = scoreBreakdown({ name: fullName, phone, company, unsubscribed }, acts.map((a) => ({ type: a.type, meta: a.meta }))).total;
    contacts.push({
      id,
      email,
      name: fullName,
      phone,
      company,
      website,
      stage: current,
      score,
      tags: [...tags],
      source,
      utm,
      referrer: source === "manual" ? null : cm.referrer,
      landingPage: landing,
      visitorId,
      segment,
      dealValueCents,
      lifetimeValueCents,
      notes,
      unsubscribed,
      lastActivityAt: new Date(lastActivity),
      createdAt: new Date(t0),
      updatedAt: new Date(lastActivity),
    });
    activities.push(...acts);
    if (!built.some((b) => b.id === id)) built.push({ id, name: fullName, first, email, company, stage: current, source, createdAt: t0, tz });
  });

  // Stop nurture sequences for customers + unsubscribed contacts (mirrors stopAutomations()).
  const stopFor = new Set(contacts.filter((c) => c.stage === "customer" || c.unsubscribed).map((c) => c.id));
  const purchaseSeq = seqByTrigger.get("purchase")?.id;
  for (const e of seqEnrollments) {
    const isPurchaseSeq = e.sequenceId === purchaseSeq;
    if (e.status === "active" && stopFor.has(e.contactId) && (!isPurchaseSeq || contacts.find((c) => c.id === e.contactId)?.unsubscribed)) {
      e.status = "stopped";
      e.nextRunAt = null;
    }
  }

  /* ---- Tasks ---- */
  const byStage = (s: Stage) => built.filter((b) => b.stage === s);
  const pickN = <T,>(items: T[], n: number) => items.slice(0, n);
  for (const b of byStage("call_booked")) {
    if (!b.upcomingBooking) continue;
    tasks.push({
      contactId: b.id,
      title: `Prep for ${b.upcomingBooking.type} with ${b.first}`,
      description: "Review their assessment answers and booking notes; bring two or three quick AI wins.",
      dueAt: new Date(b.upcomingBooking.startAt.getTime() - 2 * HOUR),
      priority: "normal",
      origin: "booking",
      createdAt: new Date(now - 2 * DAY),
    });
  }
  for (const [k, b] of pickN(byStage("proposal"), 3).entries()) {
    tasks.push({
      contactId: b.id,
      title: k === 0 ? `Follow up on the proposal with ${b.first}` : k === 1 ? `Send recap and next steps to ${b.first}` : `Check whether ${b.first} has questions on scope`,
      dueAt: new Date(now - (k + 1) * DAY + 3 * HOUR),
      priority: k === 0 ? "high" : "normal",
      origin: k === 1 ? "booking" : "manual",
      createdAt: new Date(now - 6 * DAY),
    });
  }
  for (const [k, b] of pickN(byStage("qualified"), 4).entries()) {
    const titles = [`Invite ${b.first} to a strategy call`, `Send ${b.first} the AI for Business Owners overview`, `Call ${b.first} about team training`, `Share an automation idea with ${b.first}`];
    const due = [now + 2 * HOUR, now + 2 * DAY, now - DAY, null][k];
    tasks.push({
      contactId: b.id,
      title: titles[k],
      dueAt: due === null ? null : new Date(due),
      priority: k === 0 ? "high" : k === 3 ? "low" : "normal",
      origin: k === 0 ? "quiz_hot_lead" : "manual",
      createdAt: new Date(now - 3 * DAY),
    });
  }
  for (const [k, b] of pickN(byStage("customer"), 3).entries()) {
    tasks.push({
      contactId: b.id,
      title: [`Check in on ${b.first}'s course progress`, `Ask ${b.first} what they've put into practice`, `Offer ${b.first} a coaching session`][k],
      dueAt: k === 2 ? null : new Date(now + (k === 0 ? 4 * HOUR : 5 * DAY)),
      priority: k === 1 ? "low" : "normal",
      origin: "manual",
      completedAt: null,
      createdAt: new Date(now - 4 * DAY),
    });
  }
  for (const [k, b] of pickN(byStage("engaged"), 3).entries()) {
    tasks.push({
      contactId: b.id,
      title: [`Send ${b.first} a personal note about their assessment`, `Answer ${b.first}'s chat question about course access`, `Add ${b.first} to the next live Q&A invite list`][k],
      dueAt: new Date(now - (k + 3) * DAY),
      priority: "normal",
      origin: "manual",
      completedAt: new Date(now - (k + 2) * DAY),
      createdAt: new Date(now - (k + 5) * DAY),
    });
  }
  tasks.push({ title: "Plan next month's free AI workshop", description: "Pick a topic from the most common assessment goals.", dueAt: new Date(now + 9 * DAY), priority: "low", origin: "manual", createdAt: new Date(now - DAY) });

  /* ---- Anonymous visitors (funnel drop-offs) ---- */
  const LANDINGS: readonly (readonly [string, number])[] = [
    ["/", 30],
    ["/free-guide", 20],
    ["/assessment", 20],
    ["/courses", 15],
    ["/book", 8],
    ["/consulting", 7],
  ];
  for (let v = 0; v < 280; v++) {
    const visitorId = rng.uuid();
    const when = past(now - Math.pow(rng.next(), 1.3) * 60 * DAY);
    const channel = rng.weighted(CHANNELS);
    const cm = CHANNEL_META[channel];
    const utm: UtmParams = channel === "direct" ? {} : { source: channel, ...(cm.medium ? { medium: cm.medium } : {}), ...(cm.campaigns.length ? { campaign: rng.pick(cm.campaigns) } : {}) };
    const landing = rng.weighted(LANDINGS);
    const push = (name: string, t: number, path: string, props: Record<string, unknown> = {}) =>
      events.push({ visitorId, contactId: null, name, path, referrer: name === "page_view" && path === landing ? cm.referrer : null, utm, props, createdAt: new Date(past(t)) });
    push("page_view", when, landing);
    if (rng.chance(0.4)) push("page_view", when + rng.int(1, 8) * MIN, rng.pick(BROWSE_PATHS));
    if (landing === "/assessment" && rng.chance(0.45)) push("quiz_started", when + 2 * MIN, "/assessment");
    if (landing === "/book" && rng.chance(0.6)) push("booking_viewed", when + MIN, "/book/ai-strategy-call");
    if (landing === "/courses") {
      if (rng.chance(0.3)) push("cta_click", when + MIN, "/courses", { cta: "course_card" });
      if (rng.chance(0.08)) push("checkout_started", when + 4 * MIN, "/courses/ai-essentials", { course: "ai-essentials" });
    }
    if (landing === "/" && rng.chance(0.12)) push("chat_opened", when + MIN, "/");
    if (landing === "/" && rng.chance(0.25)) push("cta_click", when + 30_000, "/", { cta: "hero_assessment" });
  }

  /* ---- Write everything ---- */
  await db.transaction(async (tx) => {
    await tx.insert(schema.contacts).values(contacts);
    await insertChunked(activities, (rows) => tx.insert(schema.activities).values(rows));
    await insertChunked(events, (rows) => tx.insert(schema.events).values(rows));
    if (quizzes.length) await tx.insert(schema.quizSubmissions).values(quizzes);
    if (bookings.length) await tx.insert(schema.bookings).values(bookings);
    if (orders.length) await tx.insert(schema.orders).values(orders);
    if (users.length) await tx.insert(schema.users).values(users);
    if (enrollments.length) await tx.insert(schema.enrollments).values(enrollments);
    if (progress.length) await tx.insert(schema.lessonProgress).values(progress);
    if (chats.length) await tx.insert(schema.chatConversations).values(chats);
    await insertChunked(emails, (rows) => tx.insert(schema.emailLog).values(rows));
    if (seqEnrollments.length) await tx.insert(schema.sequenceEnrollments).values(seqEnrollments);
    if (tasks.length) await tx.insert(schema.tasks).values(tasks);
  });
}
