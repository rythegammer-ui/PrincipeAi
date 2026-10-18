/**
 * Rule-based answers used when Claude isn't configured (no ANTHROPIC_API_KEY) or a request fails:
 * - buildChatFallback: keyword-matched website-assistant replies that always include useful links
 * - buildTutorFallback: lesson key points for the course tutor
 * - buildInsightsFallback: keyword-frequency "insights" for the admin conversations page
 * - extractEmail: finds an email address a visitor typed into the chat
 *
 * Pure functions (no server-only deps) so they are unit-testable.
 */
import type { ChatMessage, Course, MeetingType } from "@/db/schema";
import {
  INSIGHTS_SECTIONS,
  audienceLabel,
  clip,
  implementationCallHref,
  oneLine,
  primaryCallHref,
  priceLabel,
  redactEmails,
  sortCourses,
  sortMeetingTypes,
  starterKitName,
} from "@/lib/ai-prompts";
import { isValidEmail, normalizeEmail } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Email extraction                                                    */
/* ------------------------------------------------------------------ */

const EMAIL_PATTERN = /[a-z0-9][a-z0-9._%+-]*@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}/gi;

/** Returns the first valid email address in `text` (normalized), or null. */
export function extractEmail(text: string): string | null {
  for (const match of text.matchAll(EMAIL_PATTERN)) {
    const candidate = normalizeEmail(match[0]);
    if (candidate.length <= 254 && !candidate.includes("..") && isValidEmail(candidate)) return candidate;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Intent detection                                                    */
/* ------------------------------------------------------------------ */

export type ChatIntent =
  | "prompt"
  | "policy"
  | "human"
  | "booking"
  | "pricing"
  | "consulting"
  | "assessment"
  | "course"
  | "tools"
  | "privacy"
  | "business"
  | "life"
  | "free"
  | "thanks"
  | "greeting";

/** Ordered by priority: the first match decides the main answer. */
const INTENT_PATTERNS: [ChatIntent, RegExp][] = [
  ["prompt", /\bprompts?\b|\btemplates?\b|\bplan my (week|day|month)\b|\bwrite (me )?(a|an|my)\b/i],
  ["policy", /\b(refunds?|money[- ]back|guarantee[sd]?|cancel(lation)?|policy|policies|terms|privacy policy|invoice|receipt)\b/i],
  ["human", /\b(human|real person|actual person|talk to (someone|a person|you)|speak (to|with) (someone|a person)|contact (you|someone|the team)|follow[- ]?up)\b/i],
  ["booking", /\b(book|booking|schedule|appointment|calendar|call|calls|meeting|coaching|coach|1:1|one[- ]on[- ]one|strategy session)\b/i],
  ["pricing", /\b(price|prices|pricing|cost|costs|how much|expensive|cheap|afford|payment|pay|refund|discount|coupon)\b|\$\d/i],
  ["consulting", /\b(done[- ]for[- ]you|done[- ]with[- ]you|implement|implementation|build (it|this|one|me|us|an?)|agency|hire|consult|consulting|consultant|custom (ai|solution|system|build))\b/i],
  ["assessment", /\b(assessment|quiz|readiness|where (do|should|can) i (start|begin)|not sure where|starting point|evaluate|score)\b/i],
  ["course", /\b(course|courses|class|classes|program|training|curriculum|module|lessons?|enrol|enroll|learn|beginner|advanced)\b|which .*\b(right|best)\b/i],
  ["tools", /\b(chatgpt|chat gpt|claude|gemini|copilot|perplexity|midjourney|zapier|which (ai|tool)|best (ai|tool)|ai tools?)\b/i],
  ["privacy", /\b(privacy|private|safe|safety|secure|security|confidential|gdpr|my data)\b/i],
  ["business", /\b(business|company|companies|team|staff|employees?|clients?|customers?|sales|marketing|leads?|revenue|startup|small business|operations|my shop|my firm|agency)\b/i],
  ["life", /\b(personal|life|family|home|everyday|daily|habits?|meals?|recipes?|travel|study|studying|student|kids|health|fitness|productivity)\b/i],
  ["free", /\b(free|guide|starter|resources?|cheat ?sheet|download|ebook|pdf)\b/i],
  ["thanks", /^\s*(thanks|thank you|thx|cheers|great|perfect|awesome|ok(ay)?|cool)\b[\s!.]*$/i],
  ["greeting", /^\s*(hi|hello|hey|hiya|yo|howdy|good (morning|afternoon|evening))\b/i],
];

export function detectIntents(message: string): ChatIntent[] {
  return INTENT_PATTERNS.filter(([, re]) => re.test(message)).map(([intent]) => intent);
}

/* ------------------------------------------------------------------ */
/* Website assistant fallback                                          */
/* ------------------------------------------------------------------ */

export type FallbackCourse = Pick<Course, "slug" | "title" | "subtitle" | "audience" | "level" | "priceCents"> & {
  published?: boolean;
  sortOrder?: number;
};
export type FallbackMeetingType = Pick<MeetingType, "slug" | "name" | "durationMin" | "priceCents"> & {
  active?: boolean;
  sortOrder?: number;
};

type Ctx = { courses: FallbackCourse[]; meetings: FallbackMeetingType[]; callHref: string; message: string };

const ADVANCED_PATTERN = /\b(automat\w*|agents?|workflows?|zapier|make\.com|n8n|api|integrat\w*|advanced)\b/i;

/** "AI Essentials" from "AI Essentials: Use AI in Everyday Life". */
function shortTitle(title: string): string {
  const t = oneLine(title);
  const head = t.split(/:\s/)[0];
  return head.length >= 6 ? head : t;
}

function courseLine(c: FallbackCourse): string {
  const subtitle = c.subtitle.trim() ? ` ${clip(c.subtitle, 140)}` : "";
  return `- **[${shortTitle(c.title)}](/courses/${c.slug})** (${priceLabel(c.priceCents)}, ${oneLine(c.level)}) — best for ${audienceLabel(c.audience).toLowerCase()}.${subtitle}`;
}

function pickCourse(courses: FallbackCourse[], pred: (c: FallbackCourse) => boolean): FallbackCourse | undefined {
  return courses.find(pred);
}

function businessCourse(courses: FallbackCourse[]) {
  return pickCourse(courses, (c) => c.audience === "business") ?? pickCourse(courses, (c) => c.audience === "both");
}

function lifeCourse(courses: FallbackCourse[]) {
  return pickCourse(courses, (c) => c.audience === "life") ?? pickCourse(courses, (c) => c.audience === "both");
}

function advancedCourse(courses: FallbackCourse[]) {
  return pickCourse(courses, (c) => /advanced/i.test(c.level));
}

function courseMention(c: FallbackCourse | undefined, lead: string): string {
  return c ? `\n\n${lead} [${shortTitle(c.title)}](/courses/${c.slug}) (${priceLabel(c.priceCents)}).` : "";
}

const PROMPTS: { test: RegExp; title: string; prompt: string; tip: string }[] = [
  {
    test: /\b(week|weekly|plan my|schedule|priorit|to-?do)/i,
    title: "plan your week",
    prompt: `Act as my productivity coach and help me plan my week.

My fixed commitments: [meetings, appointments, school runs]
My top 3 goals this week: [goal 1], [goal 2], [goal 3]
Everything else on my plate: [paste your to-do list]
Focus time I have each day: [e.g. 2 hours in the morning]

1. Sort my tasks into must-do, should-do and can-wait.
2. Give me a day-by-day plan that protects time for my top 3 goals.
3. Flag anything I could delegate, automate or drop.
Ask me up to 3 questions first if anything is unclear.`,
    tip: "Run it every Monday morning, then paste in Friday's leftovers so the plan keeps improving.",
  },
  {
    test: /\b(email|emails|inbox|reply|replies|respond)\b/i,
    title: "answer emails faster",
    prompt: `You are my email assistant. Draft a reply to the email below.

Goal of my reply: [e.g. politely decline, confirm a time, ask for details]
Tone: [friendly / professional / brief]
Points I must include: [key points]

Email:
"""
[paste the email]
"""

Keep it under 150 words. If anything is ambiguous, list the questions I should answer first.`,
    tip: "Paste one of your own past emails and ask it to match your tone.",
  },
  {
    test: /\b(meeting|meetings|notes|transcript|minutes)\b/i,
    title: "turn meeting notes into action items",
    prompt: `Here are my notes from a meeting about [topic]:
"""
[paste your notes or the transcript]
"""

Turn them into:
1. A 3-sentence summary
2. Decisions we made
3. Action items as a table: task, owner, due date
4. Open questions to follow up on
Only use what's in the notes — don't invent details.`,
    tip: "Remove names and confidential details before pasting if you're using a personal AI account.",
  },
  {
    test: /\b(post|posts|social|content|linkedin|instagram|tiktok|newsletter|blog|video|youtube)\b/i,
    title: "repurpose your content",
    prompt: `Act as a content strategist for [your business and audience].

Here's something I've already created:
"""
[paste a blog post, video transcript or rough notes]
"""

Repurpose it into:
- 3 LinkedIn posts with different hooks (under 150 words each)
- 1 short email newsletter
- 5 ideas for short videos
Match this tone: [describe it, or paste an example]`,
    tip: "Give it one example of a post that performed well so it learns your style.",
  },
  {
    test: /\b(meal|meals|dinner|recipe|recipes|grocery|groceries|cook)\b/i,
    title: "plan meals and groceries",
    prompt: `Plan 5 dinners for this week for [number] people.
Preferences and allergies: [e.g. vegetarian, no nuts]
Time per meal: [e.g. under 30 minutes]
Budget: [e.g. moderate]
Ingredients I already have: [list]

Give me the meal plan, then one combined grocery list grouped by store section.`,
    tip: "Ask a follow-up like \"swap Wednesday for something kid-friendly\" — it will adjust the list too.",
  },
];

const GENERIC_PROMPT = {
  title: "get expert-level help on anything",
  prompt: `Act as an experienced [role, e.g. marketing consultant / project manager / writing coach].

My situation: [2–3 sentences of context]
My goal: [what I want to achieve]
Constraints: [time, budget, tools, preferences]

First ask me 3 clarifying questions. Then give me a step-by-step plan, starting with one action I can take today.`,
  tip: "The more context you give, the better the answer — and you can always reply \"make it simpler\" or \"give me 3 alternatives\".",
};

function promptAnswer(ctx: Ctx): string {
  const p = PROMPTS.find((x) => x.test.test(ctx.message)) ?? GENERIC_PROMPT;
  return `Here's a prompt to ${p.title}. Paste it into ChatGPT, Claude or Gemini and fill in the [brackets]:

\`\`\`text
${p.prompt}
\`\`\`

**Tip:** ${p.tip} Never paste passwords or confidential client data into an AI tool.

Want more like this? The free [${starterKitName()}](/free-guide) is packed with copy-paste prompts.`;
}

function policyAnswer(ctx: Ctx): string {
  return `I don't want to guess about policies like refunds, cancellations or guarantees. Here's where to get an accurate answer:

- **Courses:** check the FAQ on each [course page](/courses).
- **Calls:** your booking confirmation email includes a link to reschedule or cancel.
- **Anything else:** [contact the team](/contact), or share your email here and someone will follow up.

Happy to help with anything else in the meantime${ctx.courses.length ? " — like which course fits you best" : ""}!`;
}

function humanAnswer(ctx: Ctx): string {
  return `I'm an AI assistant, but a real person from the team is happy to help:

- **Talk it through live:** [book a free strategy call](${ctx.callHref}) at a time that suits you.
- **Get a reply by email:** type your email address here and someone will follow up.
- **Send a message:** use the [contact page](/contact).`;
}

function bookingAnswer(ctx: Ctx): string {
  if (!ctx.meetings.length) {
    return `Online booking isn't open right now, but the team would still love to hear from you — send a message via the [contact page](/contact), or share your email here and someone will follow up.`;
  }
  const lines = ctx.meetings.map(
    (m) => `- **${oneLine(m.name)}** — ${m.durationMin} min, ${priceLabel(m.priceCents)} → [choose a time](/book/${m.slug})`,
  );
  const free = ctx.meetings.find((m) => m.priceCents === 0);
  return `Here are the calls you can book:

${lines.join("\n")}

${free ? `Not sure which one? Start with the **${oneLine(free.name)}** — it's free, and we'll point you to the right next step.` : "You can see every option on the [booking page](/book)."}`;
}

function pricingAnswer(ctx: Ctx): string {
  const parts: string[] = ["Here's our current pricing:"];
  if (ctx.courses.length) {
    parts.push(`**Self-paced courses**\n${ctx.courses.map((c) => `- [${oneLine(c.title)}](/courses/${c.slug}) — ${priceLabel(c.priceCents)}`).join("\n")}`);
  }
  if (ctx.meetings.length) {
    parts.push(`**Calls & coaching**\n${ctx.meetings.map((m) => `- [${oneLine(m.name)}](/book/${m.slug}) — ${priceLabel(m.priceCents)} (${m.durationMin} min)`).join("\n")}`);
  }
  const discovery = implementationCallHref(ctx.meetings);
  parts.push(
    `**Done-with-you AI implementation** is scoped per project — ${discovery ? `start with a free [discovery call](${discovery})` : "see [how it works](/consulting)"}.`,
    "For payment options or policies, check the FAQ on each course page or [contact us](/contact).",
  );
  return parts.join("\n\n");
}

function consultingAnswer(ctx: Ctx): string {
  const discovery = implementationCallHref(ctx.meetings) ?? ctx.callHref;
  const diy = advancedCourse(ctx.courses) ?? businessCourse(ctx.courses);
  return `If you'd rather have AI working in your business without building it all yourself, that's what our **done-with-you AI implementation** is for: we design and build AI systems around the way you work, then train your team to run them.

- **See how it works:** [AI implementation](/consulting)
- **Scope your project:** [book a free discovery call](${discovery})${courseMention(diy, "Prefer to build it yourself? Take a look at")}`;
}

function assessmentAnswer(): string {
  return `The best place to start is the free **AI Readiness Assessment**. It takes about 3 minutes and gives you a readiness score, quick wins and a personalized AI action plan.

[Take the free assessment →](/assessment)`;
}

function courseAnswer(ctx: Ctx, intents: ChatIntent[]): string {
  if (!ctx.courses.length) {
    return `Our courses aren't open for enrollment right now. In the meantime, grab the free [${starterKitName()}](/free-guide) or [book a free strategy call](${ctx.callHref}) and we'll help you plan your next step.`;
  }
  let picks = ctx.courses;
  if (ADVANCED_PATTERN.test(ctx.message)) picks = ctx.courses.filter((c) => /advanced/i.test(c.level));
  else if (intents.includes("business") && !intents.includes("life")) picks = ctx.courses.filter((c) => c.audience !== "life");
  else if (intents.includes("life") && !intents.includes("business")) picks = ctx.courses.filter((c) => c.audience !== "business");
  if (!picks.length) picks = ctx.courses;
  const intro =
    picks.length === ctx.courses.length
      ? "Here's a quick guide to our courses:"
      : picks.length === 1
        ? "Based on what you've said, this course looks like the best fit:"
        : "Based on what you've said, these look like the best fit:";
  return `${intro}

${picks.slice(0, 4).map(courseLine).join("\n")}

Still not sure? The free [AI Readiness Assessment](/assessment) recommends the right course for you in about 3 minutes.`;
}

function toolsAnswer(ctx: Ctx): string {
  const automation = advancedCourse(ctx.courses);
  const beginner = lifeCourse(ctx.courses) ?? ctx.courses[0];
  return `There's no single "best" AI tool — it depends on the job. A simple way to choose:

- **General AI assistants** (ChatGPT, Claude, Gemini): writing, brainstorming, research and analysis. Pick one and get really good at it before adding more.
- **AI built into tools you already use** (like Microsoft Copilot or Gemini in Google Workspace): handy for email, documents and meetings.
- **Automation tools** (like Zapier or Make): connect AI to your apps so work happens automatically.

Start with one assistant and one task you repeat every week.${courseMention(beginner, "For a guided start, see")}${automation && automation !== beginner ? ` Ready to automate? See [${shortTitle(automation.title)}](/courses/${automation.slug}).` : ""}`;
}

function privacyAnswer(ctx: Ctx): string {
  return `Great question — using AI safely matters:

- Don't paste passwords, payment details or confidential client data into AI tools.
- Check each tool's data settings (many let you turn off training on your chats) and use business plans for company data.
- Always review AI output before you send or publish it — AI can sound confident and still be wrong.

Want a plan that fits your business? [Book a free strategy call](${ctx.callHref}).`;
}

function businessAnswer(ctx: Ctx): string {
  return `AI can take a lot of repetitive work off your plate. Common places business owners start:

- **Customer emails & FAQs** — draft replies in your tone in seconds.
- **Meetings** — turn notes or transcripts into summaries and action items.
- **Content** — turn one idea into posts, emails and video scripts.
- **Sales follow-up** — personalized follow-ups and proposals from a few bullet points.
- **Processes** — write SOPs and checklists so work runs without you.

To find the biggest wins for *your* business, [take the free assessment](/assessment) or [book a free strategy call](${ctx.callHref}).${courseMention(businessCourse(ctx.courses), "Prefer to learn it yourself? See")}`;
}

function lifeAnswer(ctx: Ctx): string {
  return `AI can be a genuinely useful everyday helper:

- **Planning** — organize your week and prioritize your to-do list.
- **Meals & errands** — meal plans and grocery lists that fit your preferences.
- **Learning** — explain any topic simply, then quiz you on it.
- **Writing** — emails, messages and documents in your own voice.
- **Decisions** — compare options with clear pros and cons.

Try the free [${starterKitName()}](/free-guide) for ready-made prompts.${courseMention(lifeCourse(ctx.courses), "Want a guided start? See")}`;
}

function freeAnswer(ctx: Ctx): string {
  const free = ctx.meetings.find((m) => m.priceCents === 0);
  return `Here's what you can get for free:

- **[${starterKitName()}](/free-guide)** — copy-paste prompts and a quick-start plan.
- **[AI Readiness Assessment](/assessment)** — a 3-minute quiz with a personalized AI action plan.${free ? `\n- **[${oneLine(free.name)}](/book/${free.slug})** — ${free.durationMin} minutes with the team.` : ""}`;
}

function menuAnswer(ctx: Ctx, opener: string): string {
  return `${opener}

- **Not sure where to start?** Take the free [AI Readiness Assessment](/assessment).
- **Want to learn?** [Browse the courses](/courses).
- **Want to talk it through?** [Book a free strategy call](${ctx.callHref}).

You can also share your email here and someone from the team will get back to you.`;
}

function greetingAnswer(): string {
  return `Hi there! I can help you figure out how AI can save you time in your life or business. You could ask me:

- *Which course is right for me?*
- *How can AI help my business?*
- *Give me a prompt to plan my week*`;
}

function answerFor(intent: ChatIntent | undefined, ctx: Ctx, intents: ChatIntent[]): string {
  switch (intent) {
    case "prompt":
      return promptAnswer(ctx);
    case "policy":
      return policyAnswer(ctx);
    case "human":
      return humanAnswer(ctx);
    case "booking":
      return bookingAnswer(ctx);
    case "pricing":
      return pricingAnswer(ctx);
    case "consulting":
      return consultingAnswer(ctx);
    case "assessment":
      return assessmentAnswer();
    case "course":
      return courseAnswer(ctx, intents);
    case "tools":
      return toolsAnswer(ctx);
    case "privacy":
      return privacyAnswer(ctx);
    case "business":
      return businessAnswer(ctx);
    case "life":
      return lifeAnswer(ctx);
    case "free":
      return freeAnswer(ctx);
    case "thanks":
      return menuAnswer(ctx, "You're welcome! Is there anything else I can help with?");
    case "greeting":
      return greetingAnswer();
    default:
      return menuAnswer(ctx, "Thanks for your question! I can't give you a detailed answer to that one right now, but here's how we can help:");
  }
}

/**
 * Rule-based reply for the website assistant. Always includes at least one useful link.
 * `emailCaptured` is the address the visitor just shared (it has been passed to the team).
 */
export function buildChatFallback(input: {
  message: string;
  courses: FallbackCourse[];
  meetingTypes: FallbackMeetingType[];
  emailCaptured?: string | null;
}): string {
  const courses = sortCourses(input.courses);
  const meetings = sortMeetingTypes(input.meetingTypes);
  const message = input.emailCaptured ? input.message.replace(EMAIL_PATTERN, " ") : input.message;
  const ctx: Ctx = { courses, meetings, callHref: primaryCallHref(meetings), message };
  const intents = detectIntents(message);

  if (input.emailCaptured) {
    const ack = `Thanks! I've passed **${input.emailCaptured}** to the team, and someone will follow up with you by email.`;
    const main = intents.find((i) => i !== "human" && i !== "greeting" && i !== "thanks");
    if (main) return `${ack}\n\n${answerFor(main, ctx, intents)}`;
    return `${ack}

While you wait, you might like:
- The free [AI Readiness Assessment](/assessment) — a personalized AI action plan in about 3 minutes.
- The free [${starterKitName()}](/free-guide) — copy-paste prompts you can use today.`;
  }

  return answerFor(intents[0], ctx, intents);
}

/* ------------------------------------------------------------------ */
/* Course tutor fallback                                               */
/* ------------------------------------------------------------------ */

/** Strips Markdown (links, emphasis, code, headings, list markers) to a single line of plain text. */
export function plainText(md: string): string {
  return oneLine(
    md
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/^\s{0,3}(#{1,6}\s+|>\s?|[-*+]\s+|\d+[.)]\s+)/gm, "")
      .replace(/^\[[ xX]\]\s+/gm, "")
      .replace(/[*_`~]+/g, "")
      .replace(/<[^>]+>/g, ""),
  );
}

/** The lesson's key points: top-level bullet items first, then section headings, in document order. */
export function lessonKeyPoints(markdown: string, max = 6): string[] {
  const bullets: string[] = [];
  const headings: string[] = [];
  let inCode = false;
  for (const raw of markdown.split("\n")) {
    if (/^\s*(```|~~~)/.test(raw)) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;
    const bullet = raw.match(/^(?:[-*+]|\d+[.)])\s+(.+)$/);
    const heading = raw.match(/^#{2,4}\s+(.+?)\s*#*\s*$/);
    if (bullet) {
      const text = plainText(bullet[1]);
      if (text.length >= 12) bullets.push(clip(text, 180));
    } else if (heading) {
      const text = plainText(heading[1]);
      if (text.length >= 3) headings.push(clip(text, 120));
    }
  }
  return [...new Set([...bullets, ...headings])].slice(0, max);
}

export function buildTutorFallback(input: { lessonTitle: string; lessonSummary?: string | null; lessonContent: string; message: string }): string {
  const points = lessonKeyPoints(input.lessonContent);
  const summary = input.lessonSummary?.trim() ? `\n\n**In short:** ${oneLine(input.lessonSummary)}` : "";
  const intro = `The AI tutor isn't switched on yet — it needs an AI API key to be connected by the course team — so I can't answer questions about **${oneLine(input.lessonTitle)}** just yet.${summary}`;

  if (!points.length) {
    return `${intro}

**Try this:** write down, in two or three sentences, how you could use this lesson in your own work or life this week — then test the idea with your favorite AI assistant.

Questions about your access or account? [Contact us](/contact).`;
  }

  if (/\b(quiz|test me|check my understanding|questions?)\b/i.test(input.message)) {
    return `${intro}

**Quick self-check** — try explaining each of these out loud or in writing, without looking at the lesson:

${points.slice(0, 4).map((p, i) => `${i + 1}. ${p}`).join("\n")}

Then scroll up and compare your answers with the lesson.`;
  }

  return `${intro}

Here are the lesson's key points to review:

${points.map((p) => `- ${p}`).join("\n")}

**Try this:** pick one key point and write down how you'd apply it in your own work or life this week — then test it with your favorite AI assistant.`;
}

/* ------------------------------------------------------------------ */
/* Admin insights fallback                                             */
/* ------------------------------------------------------------------ */

const TOPICS: { label: string; pattern: RegExp; idea: string }[] = [
  { label: "Pricing & value", pattern: /\b(price|pricing|cost|how much|expensive|afford|worth|discount|refund|payment)\b|\$\d/i, idea: "What you get for the price: an honest breakdown of each course and who it's for" },
  { label: "Choosing a course", pattern: /\b(course|courses|which .*(right|best)|beginner|level|module|lesson|curriculum)\b/i, idea: "Which AI course is right for you? A 2-minute decision guide" },
  { label: "Booking a call", pattern: /\b(book|call|schedule|meeting|appointment|talk to|coaching)\b/i, idea: "What happens on a free AI strategy call (and how to prepare)" },
  { label: "Business use cases", pattern: /\b(business|client|customer|sales|marketing|leads?|team|company|revenue)\b/i, idea: "10 ways small businesses use AI every week — with copy-paste prompts" },
  { label: "Automation & agents", pattern: /\b(automat\w*|workflows?|zapier|make\.com|n8n|agents?|integrat\w*|api)\b/i, idea: "Your first AI automation: a step-by-step walkthrough" },
  { label: "Prompts & how-to", pattern: /\b(prompts?|how (do|can|to)|examples?|templates?)\b/i, idea: "The prompt formula: how to get great answers from any AI assistant" },
  { label: "Personal productivity", pattern: /\b(week|weekly|plan|personal|life|habits?|meals?|family|study|productivity)\b/i, idea: "Plan your whole week with AI in 15 minutes" },
  { label: "AI tools", pattern: /\b(chatgpt|claude|gemini|copilot|perplexity|tools?)\b/i, idea: "ChatGPT vs Claude vs Gemini: which AI assistant should you use for what?" },
  { label: "Privacy & safety", pattern: /\b(privacy|private|safe|safety|secure|security|confidential|data)\b/i, idea: "How to use AI safely with client and company data" },
  { label: "Done-for-you help", pattern: /\b(done for you|done with you|build|implement\w*|consult\w*|hire|agency)\b/i, idea: "DIY vs done-with-you AI: how to decide what to build yourself" },
  { label: "Time & difficulty", pattern: /\b(time|busy|hard|difficult|technical|tech-savvy|overwhelm\w*|confus\w*|complicated)\b/i, idea: "AI for busy, non-technical people: start with 10 minutes a day" },
];

const OBJECTION_PATTERN =
  /\b(too expensive|expensive|can'?t afford|worth it|not sure|unsure|scam|refund|guarantee|no time|too busy|too (hard|technical|complicated)|not (very )?tech|overwhelm\w*|already (use|tried|pay)|tried .* (didn'?t|did not)|skeptic\w*|sceptic\w*|does it (really )?work|replace (me|my|people|jobs))\b/i;

function normalizeQuestion(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isQuestion(text: string): boolean {
  return /\?\s*$/.test(text) || /^(how|what|which|who|where|when|why|can|could|do|does|is|are|should|will|would)\b/i.test(text.trim());
}

/**
 * Keyword-frequency summary of recent assistant conversations, shaped like the AI report
 * (same four sections) plus a topic table.
 */
export function buildInsightsFallback(conversations: { messages: Pick<ChatMessage, "role" | "content">[] }[]): string {
  const withVisitor = conversations
    .map((c) => c.messages.filter((m) => m.role === "user").map((m) => clip(redactEmails(m.content), 220)))
    .filter((msgs) => msgs.length > 0);

  const topicCounts = TOPICS.map((t) => ({ ...t, count: withVisitor.filter((msgs) => msgs.some((m) => t.pattern.test(m))).length }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count || (a.label < b.label ? -1 : 1));

  const questionCounts = new Map<string, { text: string; count: number }>();
  const objections: string[] = [];
  for (const msgs of withVisitor) {
    const seen = new Set<string>();
    for (const m of msgs) {
      if (isQuestion(m) && m.length >= 8) {
        const key = normalizeQuestion(m);
        if (key && !seen.has(key)) {
          seen.add(key);
          const entry = questionCounts.get(key) ?? { text: m, count: 0 };
          entry.count += 1;
          questionCounts.set(key, entry);
        }
      }
      if (OBJECTION_PATTERN.test(m) && objections.length < 5 && !objections.includes(m)) objections.push(m);
    }
  }
  const questions = [...questionCounts.values()].sort((a, b) => b.count - a.count).slice(0, 6);

  const bullet = (items: string[], empty: string) => (items.length ? items.map((i) => `- ${i}`).join("\n") : `- ${empty}`);
  const [topQ, objectionsH, ideasH, gapsH] = INSIGHTS_SECTIONS;

  return [
    `_Rule-based summary (keyword frequency) of ${withVisitor.length} recent ${withVisitor.length === 1 ? "conversation" : "conversations"}. Add an Anthropic API key for a Claude-written analysis._`,
    `## ${topQ}\n${bullet(
      questions.map((q) => `*"${q.text}"*${q.count > 1 ? ` (×${q.count})` : ""}`),
      "Not enough questions yet.",
    )}`,
    `## ${objectionsH}\n${bullet(
      objections.map((o) => `*"${o}"*`),
      "No clear objections found in recent chats.",
    )}`,
    `## ${ideasH}\n${bullet(
      topicCounts.slice(0, 4).map((t) => `${t.idea} — *${t.label.toLowerCase()} came up in ${t.count} ${t.count === 1 ? "chat" : "chats"}*`),
      "Not enough data yet.",
    )}`,
    `## ${gapsH}\n${bullet(
      questions.slice(0, 4).map((q) => `Consider answering *"${q.text}"* on the relevant sales page`),
      "Not enough data yet.",
    )}`,
    topicCounts.length
      ? `## Most mentioned topics\n| Topic | Conversations |\n| --- | ---: |\n${topicCounts.map((t) => `| ${t.label} | ${t.count} |`).join("\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}
