import { describe, expect, it } from "vitest";
import {
  buildAssistantSystemPrompt,
  buildInsightsDigest,
  buildTutorSystemPrompt,
  chatEmailNote,
  clip,
  primaryCallHref,
  redactEmails,
  toModelMessages,
  withNoteOnLastUserMessage,
  type PromptCourse,
  type PromptMeetingType,
} from "@/lib/ai-prompts";
import {
  buildChatFallback,
  buildInsightsFallback,
  buildTutorFallback,
  detectIntents,
  extractEmail,
  extractOwnEmail,
  lessonKeyPoints,
  plainText,
} from "@/lib/chat-fallback";
import type { ChatMessage } from "@/db/schema";

const courses: PromptCourse[] = [
  {
    slug: "ai-essentials",
    title: "AI Essentials: Use AI in Everyday Life",
    subtitle: "Go from curious to confident with AI in 7 days.",
    description: "A friendly beginner course.\n\nNo tech background needed.",
    audience: "life",
    level: "Beginner",
    priceCents: 4700,
    compareAtCents: 9700,
    outcomes: ["Write prompts that work", "Save hours every week"],
    includes: ["Prompt library"],
    faqs: [{ q: "Do I need a paid AI account?", a: "No — free versions work." }],
    sortOrder: 0,
    lessonCount: 10,
    totalMinutes: 125,
  },
  {
    slug: "ai-for-business",
    title: "AI for Business Owners: The Implementation Playbook",
    subtitle: "Find the highest-ROI AI opportunities in your business.",
    description: "For business owners.",
    audience: "business",
    level: "Intermediate",
    priceCents: 29700,
    compareAtCents: null,
    outcomes: [],
    includes: [],
    faqs: [],
    sortOrder: 1,
  },
  {
    slug: "ai-automation-accelerator",
    title: "AI Automation Accelerator: Build Workflows & Agents",
    subtitle: "Connect AI to your tools.",
    description: "",
    audience: "both",
    level: "Advanced",
    priceCents: 49700,
    compareAtCents: 79700,
    outcomes: [],
    includes: [],
    faqs: [],
    sortOrder: 2,
  },
  {
    slug: "secret-draft",
    title: "Unpublished Draft Course",
    subtitle: "",
    description: "",
    audience: "both",
    level: "Beginner",
    priceCents: 100,
    compareAtCents: null,
    outcomes: [],
    includes: [],
    faqs: [],
    published: false,
    sortOrder: 3,
  },
];

const meetingTypes: PromptMeetingType[] = [
  { slug: "ai-strategy-call", name: "Free AI Strategy Call", description: "30 minutes to map where AI helps.", durationMin: 30, priceCents: 0, sortOrder: 0 },
  { slug: "ai-coaching-session", name: "1:1 AI Coaching Session", description: "Hands-on coaching.", durationMin: 60, priceCents: 15000, sortOrder: 1 },
  { slug: "implementation-discovery", name: "AI Implementation Discovery Call", description: "Scope your project.", durationMin: 45, priceCents: 0, sortOrder: 2 },
];

const settings = { businessName: "Principe AI", aiAssistantName: "Principe AI Assistant", aiAssistantInstructions: "" };

function shuffled<T>(items: T[]): T[] {
  return [...items].reverse();
}

describe("extractEmail", () => {
  it("finds and normalizes an email inside a sentence", () => {
    expect(extractEmail("Sure, it's Jane.Doe+ai@Example.COM — thanks!")).toBe("jane.doe+ai@example.com");
  });
  it("ignores trailing punctuation", () => {
    expect(extractEmail("Email me at sam@acme.co.")).toBe("sam@acme.co");
    expect(extractEmail("(reach me: lee@studio.io)")).toBe("lee@studio.io");
  });
  it("returns null when there is no valid email", () => {
    expect(extractEmail("How can AI help my business?")).toBeNull();
    expect(extractEmail("I use @handles and user@localhost")).toBeNull();
    expect(extractEmail("")).toBeNull();
  });
  it("returns the first valid address", () => {
    expect(extractEmail("a@b.com or c@d.com")).toBe("a@b.com");
  });
});

describe("extractOwnEmail", () => {
  it("accepts an address sent on its own or with a few filler words", () => {
    expect(extractOwnEmail("jo@example.com")).toBe("jo@example.com");
    expect(extractOwnEmail("  Jo@Example.com. ")).toBe("jo@example.com");
    expect(extractOwnEmail("Sure, it's Jane.Doe+ai@Example.COM — thanks!")).toBe("jane.doe+ai@example.com");
    expect(extractOwnEmail("Here you go: jo@example.com")).toBe("jo@example.com");
    expect(extractOwnEmail("Email: jo@example.com")).toBe("jo@example.com");
  });

  it("accepts first-person phrasing around the address", () => {
    expect(extractOwnEmail("My email is jo@example.com")).toBe("jo@example.com");
    expect(extractOwnEmail("Great course list! My work email address: jo@acme.co, and I'd love a call.")).toBe("jo@acme.co");
    expect(extractOwnEmail("You can reach me at sam@acme.co if that's easier.")).toBe("sam@acme.co");
    expect(extractOwnEmail("(reach me: lee@studio.io)")).toBe("lee@studio.io");
    expect(extractOwnEmail("Please contact me. lee@studio.io")).toBe("lee@studio.io");
    expect(extractOwnEmail("I’m at lee@studio.io")).toBe("lee@studio.io");
    expect(extractOwnEmail("lee@studio.io is my email, thanks")).toBe("lee@studio.io");
  });

  it("accepts the follow-up form's message", () => {
    expect(extractOwnEmail("Please have someone follow up with me by email: jo@example.com")).toBe("jo@example.com");
    expect(extractOwnEmail("Please follow up with me at jo@example.com")).toBe("jo@example.com");
  });

  it("ignores other people's addresses", () => {
    const reminder = "Can you write me a polite payment reminder email to my client jane.doe@clientco.com? Her invoice is 30 days late.";
    expect(extractEmail(reminder)).toBe("jane.doe@clientco.com");
    expect(extractOwnEmail(reminder)).toBeNull();
    expect(extractOwnEmail("Write an email to my client jane@acme.com about the delay")).toBeNull();
    expect(extractOwnEmail("Draft a reply to my contact jane@acme.com")).toBeNull();
    expect(extractOwnEmail("Can you proofread my email? jane@acme.com wrote to ask about pricing.")).toBeNull();
    expect(extractOwnEmail("Can you email me a template I can send to jane@acme.com?")).toBeNull();
    expect(extractOwnEmail("jane@acme.com keeps ignoring my invoices")).toBeNull();
    expect(extractOwnEmail("How can AI help my business?")).toBeNull();
    expect(extractOwnEmail("Send the guide to jane@acme.com")).toBeNull();
    expect(extractOwnEmail("cc jane@acme.com")).toBeNull();
    expect(extractOwnEmail("To: jane@acme.com Subject: invoice")).toBeNull();
    expect(extractOwnEmail("Write her a thank-you note. jane@acme.com")).toBeNull();
    expect(extractOwnEmail("Jane’s email is jane@acme.com")).toBeNull();
    expect(extractOwnEmail("Can you forward this to my colleague? jane@acme.com")).toBeNull();
    expect(extractOwnEmail("What do you think about jane@acme.com")).toBeNull();
    expect(extractOwnEmail("Is this a valid address: jane@acme.com?")).toBeNull();
  });

  it("accepts a short message that ends with its only address", () => {
    expect(extractOwnEmail("Hi, I would like a call about AI for my team. jo3.lead@example.com")).toBe("jo3.lead@example.com");
    expect(extractOwnEmail("I’d like to talk to a human, jo@example.com")).toBe("jo@example.com");
    expect(extractOwnEmail("jo@example.com please follow up")).toBe("jo@example.com");
    expect(extractOwnEmail("jo@example.com - get back to me asap, thanks")).toBe("jo@example.com");
    expect(extractOwnEmail("Hola, quiero hablar con alguien sobre IA. jo@ejemplo.com")).toBe("jo@ejemplo.com");
  });

  it("does not treat a lone address in a long message as the visitor's own", () => {
    const long = `${"I have a long question about how AI could help with many different parts of the work we do every single week at the office. ".repeat(2)}jo@example.com`;
    expect(extractOwnEmail(long)).toBeNull();
    expect(extractOwnEmail(`${long}. My email is jo@example.com`)).toBe("jo@example.com");
  });

  it("picks the visitor's own address when several are mentioned", () => {
    expect(extractOwnEmail("Draft a note to jane@acme.com, then email me at jo@example.com")).toBe("jo@example.com");
    expect(extractOwnEmail("jo@example.com or jane@acme.com")).toBeNull();
  });
});

describe("intent detection", () => {
  it("maps the widget's suggestion chips to the right intents", () => {
    expect(detectIntents("Which course is right for me?")[0]).toBe("course");
    expect(detectIntents("How can AI help my business?")[0]).toBe("business");
    expect(detectIntents("Give me a prompt to plan my week")[0]).toBe("prompt");
    expect(detectIntents("Book a free strategy call")[0]).toBe("booking");
  });
  it("recognizes pricing, consulting and assessment questions", () => {
    expect(detectIntents("How much does it cost?")[0]).toBe("pricing");
    expect(detectIntents("Can you build an AI system done-for-you?")[0]).toBe("consulting");
    expect(detectIntents("I'm not sure where to start")[0]).toBe("assessment");
  });
});

describe("buildChatFallback", () => {
  const reply = (message: string, emailCaptured?: string) => buildChatFallback({ message, courses, meetingTypes, emailCaptured });

  it("answers pricing questions with exact live prices and links", () => {
    const text = reply("What are your prices?");
    expect(text).toContain("$47");
    expect(text).toContain("$297");
    expect(text).toContain("$497");
    expect(text).toContain("$150");
    expect(text).toContain("/courses/ai-essentials");
    expect(text).toContain("/book/ai-coaching-session");
    expect(text).not.toContain("Unpublished Draft Course");
  });

  it("lists bookable calls for booking requests", () => {
    const text = reply("Book a free strategy call");
    expect(text).toContain("/book/ai-strategy-call");
    expect(text).toContain("Free AI Strategy Call");
    expect(text).toContain("Free");
  });

  it("recommends courses that fit the visitor", () => {
    const business = reply("Which course is best for my small business?");
    expect(business).toContain("/courses/ai-for-business");
    expect(business).not.toContain("/courses/ai-essentials)");
    const advanced = reply("Which course teaches automation and agents?");
    expect(advanced).toContain("/courses/ai-automation-accelerator");
    expect(reply("Which course is right for me?")).toContain("/assessment");
  });

  it("points to consulting and the discovery call for done-for-you work", () => {
    const text = reply("I want someone to implement AI for my company");
    expect(text).toContain("/consulting");
    expect(text).toContain("/book/implementation-discovery");
  });

  it("gives a copy-paste prompt for prompt requests", () => {
    const text = reply("Give me a prompt to plan my week");
    expect(text).toMatch(/```text\n[\s\S]*plan my week[\s\S]*```/i);
    expect(text).toContain("/free-guide");
  });

  it("never guesses about policies", () => {
    const text = reply("What's your refund policy?");
    expect(detectIntents("What's your refund policy?")[0]).toBe("policy");
    expect(text).toMatch(/don't want to guess/);
    expect(text).toContain("/contact");
    expect(text).not.toMatch(/\d+[- ]day/);
  });

  it("always includes useful links, even for unknown questions", () => {
    const text = reply("Tell me about quantum gravity");
    expect(text).toContain("/assessment");
    expect(text).toContain("/courses");
    expect(text).toContain("/book/ai-strategy-call");
  });

  it("says when an address in the message was not passed to the team", () => {
    const text = buildChatFallback({
      message: "I'd like to talk to a human about my client jane@acme.com",
      courses,
      meetingTypes,
      emailInMessage: "jane@acme.com",
    });
    expect(text).toMatch(/^I haven't passed \*\*jane@acme\.com\*\* to the team/);
    expect(text).toContain("/contact");
    expect(text).not.toMatch(/someone will follow up with you by email/);
    // The request for a human is answered by the notice itself, not by "type your email address here".
    expect(text).not.toContain("Get a reply by email");
    expect(text).toContain("/book/ai-strategy-call");
  });

  it("keeps answering the question alongside the not-passed notice, ignoring the address's domain", () => {
    const text = buildChatFallback({ message: "What are your prices? jo@coaching.io", courses, meetingTypes, emailInMessage: "jo@coaching.io" });
    expect(text).toMatch(/^I haven't passed \*\*jo@coaching\.io\*\*/);
    expect(text).toContain("$297");
    expect(detectIntents("Tell me more jo@coaching.io")[0]).toBe("booking");
    expect(buildChatFallback({ message: "Tell me more jo@coaching.io", courses, meetingTypes })).not.toContain("Here are the calls you can book");
  });

  it("points to the contact page when the visitor's own address couldn't be passed on", () => {
    const text = buildChatFallback({
      message: "My email is jo@example.com, please follow up",
      courses,
      meetingTypes,
      emailInMessage: "jo@example.com",
      emailCaptureFailed: true,
    });
    expect(text).toMatch(/^I couldn't pass \*\*jo@example\.com\*\* to the team just now/);
    expect(text).toContain("/contact");
    expect(text).not.toMatch(/reply with just the address|type your email|Get a reply by email/);
  });

  it("acknowledges a shared email without asking again", () => {
    const text = reply("Please follow up with me at jo@example.com", "jo@example.com");
    expect(text).toContain("jo@example.com");
    expect(text).toMatch(/follow up/i);
    expect(text).toContain("/assessment");
  });

  it("falls back gracefully with no catalog data", () => {
    const text = buildChatFallback({ message: "What courses do you have?", courses: [], meetingTypes: [] });
    expect(text).toContain("/free-guide");
    expect(text).toContain("/book");
  });
});

describe("buildAssistantSystemPrompt", () => {
  it("is deterministic regardless of input order", () => {
    const a = buildAssistantSystemPrompt({ settings, courses, meetingTypes });
    const b = buildAssistantSystemPrompt({ settings, courses: shuffled(courses), meetingTypes: shuffled(meetingTypes) });
    expect(a).toBe(b);
    expect(a).not.toMatch(/\d{4}-\d{2}-\d{2}T/); // no timestamps (prompt caching)
  });

  it("includes the persona, exact prices and the right links", () => {
    const prompt = buildAssistantSystemPrompt({ settings, courses, meetingTypes });
    expect(prompt).toContain("You are Principe AI Assistant");
    expect(prompt).toContain("/courses/ai-essentials");
    expect(prompt).toContain("Price: $47 (the sales page shows a compare-at price of $97)");
    expect(prompt).toContain("Price: $297");
    expect(prompt).toContain("/book/ai-strategy-call");
    expect(prompt).toContain("60 min, $150");
    expect(prompt).toContain("/assessment");
    expect(prompt).toContain("/free-guide");
    expect(prompt).toContain("/consulting");
    expect(prompt).toContain("10 lessons, about 2 hours");
    expect(prompt).toContain("Do I need a paid AI account?");
    expect(prompt).not.toContain("Unpublished Draft Course");
    expect(prompt).toMatch(/never guess/i);
    expect(prompt).toMatch(/AI assistant, not a human/);
  });

  it("appends the owner's extra instructions at the very end", () => {
    const prompt = buildAssistantSystemPrompt({ settings: { ...settings, aiAssistantInstructions: "Always mention the spring workshop." }, courses, meetingTypes });
    expect(prompt.trimEnd().endsWith("Always mention the spring workshop.")).toBe(true);
    expect(buildAssistantSystemPrompt({ settings, courses, meetingTypes })).not.toContain("Additional instructions");
  });

  it("handles an empty catalog", () => {
    const prompt = buildAssistantSystemPrompt({ settings, courses: [], meetingTypes: [] });
    expect(prompt).toContain("No courses are open for enrollment");
    expect(prompt).toContain("/contact");
    expect(primaryCallHref([])).toBe("/book");
  });
});

describe("buildTutorSystemPrompt", () => {
  const course = { title: "AI Essentials", subtitle: "Confident with AI", level: "Beginner", audience: "life" };
  const lesson = { title: "Prompting 101", summary: "How to write clear prompts.", content: "## The formula\n\n- Give context\n- Say the format you want" };

  it("grounds the tutor in the lesson content", () => {
    const prompt = buildTutorSystemPrompt({ course, lesson });
    expect(prompt).toContain('"Prompting 101"');
    expect(prompt).toContain("<lesson_content>\n## The formula");
    expect(prompt).toContain("Say the format you want");
    expect(prompt).toMatch(/quiz/i);
    expect(prompt).toBe(buildTutorSystemPrompt({ course, lesson }));
  });

  it("explains when a lesson has no notes", () => {
    expect(buildTutorSystemPrompt({ course, lesson: { ...lesson, content: "  " } })).toContain("no written notes");
  });
});

describe("toModelMessages", () => {
  const msg = (role: ChatMessage["role"], content: string): ChatMessage => ({ role, content, at: "2026-01-01T00:00:00.000Z" });

  it("keeps the last N messages and always starts with the user", () => {
    const history = Array.from({ length: 30 }, (_, i) => msg(i % 2 === 0 ? "user" : "assistant", `m${i}`));
    const out = toModelMessages(history, 20);
    expect(out.length).toBeLessThanOrEqual(20);
    expect(out[0].role).toBe("user");
    expect(out[out.length - 1].content).toBe("m29");
    expect(out.every((m) => !("at" in m))).toBe(true);
  });

  it("merges consecutive same-role messages and drops empty ones", () => {
    const out = toModelMessages([msg("assistant", "hello"), msg("user", "a"), msg("user", " "), msg("user", "b"), msg("assistant", "c")]);
    expect(out).toEqual([
      { role: "user", content: "a\n\nb" },
      { role: "assistant", content: "c" },
    ]);
  });
});

describe("chat email note", () => {
  const msg = (role: ChatMessage["role"], content: string): ChatMessage => ({ role, content, at: "2026-01-01T00:00:00.000Z" });

  it("says whether an address was passed to the team", () => {
    expect(chatEmailNote({ emailInMessage: false, emailCaptured: false })).toBeNull();
    expect(chatEmailNote({ emailInMessage: true, emailCaptured: true })).toMatch(/was passed to the team/);
    expect(chatEmailNote({ emailInMessage: true, emailCaptured: false })).toMatch(/not passed to the team, so do not promise a follow-up/);
    const failed = chatEmailNote({ emailInMessage: true, emailCaptured: false, captureFailed: true });
    expect(failed).toMatch(/could not be passed to the team right now/);
    expect(failed).toMatch(/do not ask them to send it again/);
    expect(failed).toContain("/contact");
  });

  it("appends the note to the last user message only, without touching stored history", () => {
    const history = [msg("user", "hi"), msg("assistant", "Hello!"), msg("user", "my email is jo@example.com")];
    const messages = toModelMessages(history);
    const out = withNoteOnLastUserMessage(messages, "[System note: x]");
    expect(out).toEqual([
      { role: "user", content: "hi" },
      { role: "assistant", content: "Hello!" },
      { role: "user", content: "my email is jo@example.com\n\n[System note: x]" },
    ]);
    expect(messages[2].content).toBe("my email is jo@example.com");
    expect(history[2].content).toBe("my email is jo@example.com");
    expect(withNoteOnLastUserMessage(messages, null)).toBe(messages);
  });

  it("keeps the system prompt free of capture claims", () => {
    const prompt = buildAssistantSystemPrompt({ settings, courses, meetingTypes });
    expect(prompt).not.toMatch(/passed to the team automatically/);
    expect(prompt).toMatch(/Only when the note says it was/);
    expect(prompt).toContain("Get a human follow-up");
  });
});

describe("tutor fallback", () => {
  const content = `Intro paragraph.

## Why context matters
- Give the AI your role, goal and audience before asking.
- Ask for a specific format, like a table or bullet list.

\`\`\`
- this bullet is inside a code block and must be ignored
\`\`\`

## Practice
1. Rewrite one of your recent prompts using the formula.`;

  it("extracts key points from bullets, then headings", () => {
    const points = lessonKeyPoints(content);
    expect(points[0]).toBe("Give the AI your role, goal and audience before asking.");
    expect(points).toContain("Why context matters");
    expect(points.join(" ")).not.toContain("inside a code block");
  });

  it("explains the missing API key and lists key points", () => {
    const text = buildTutorFallback({ lessonTitle: "Prompting 101", lessonSummary: "Clear prompts.", lessonContent: content, message: "Explain this simply" });
    expect(text).toMatch(/API key/);
    expect(text).toContain("Give the AI your role");
    const quiz = buildTutorFallback({ lessonTitle: "Prompting 101", lessonContent: content, message: "Quiz me on this lesson" });
    expect(quiz).toContain("self-check");
  });
});

describe("conversation insights", () => {
  const conv = (...texts: string[]) => ({ path: "/", messages: texts.map((content) => ({ role: "user" as const, content })) });

  it("redacts emails from the analysis digest", () => {
    expect(redactEmails("mail me at a@b.com please")).toBe("mail me at [email] please");
    const digest = buildInsightsDigest([conv("Is it worth it? me@x.io")], ["Do I need a paid AI account?"]);
    expect(digest).not.toContain("me@x.io");
    expect(digest).toContain("Do I need a paid AI account?");
  });

  it("builds a keyword-frequency summary with all four sections", () => {
    const text = buildInsightsFallback([
      conv("How much does the business course cost?", "Is it too expensive for a small team?"),
      conv("How much does the business course cost?"),
      conv("Can AI automate my client onboarding workflow?"),
      { messages: [{ role: "assistant" as const, content: "Hi!" }] },
    ]);
    expect(text).toContain("## Top questions");
    expect(text).toContain("## Objections & hesitations");
    expect(text).toContain("## Content ideas");
    expect(text).toContain("## FAQ gaps");
    expect(text).toContain("(×2)");
    expect(text).toContain("3 recent conversations");
    expect(text).toMatch(/\| Pricing & value \| 2 \|/);
    expect(text).toContain("too expensive");
  });

  it("turns Markdown previews into plain text", () => {
    expect(plainText("## Hi\n- **Bold** and [a link](/x) with `code`")).toBe("Hi Bold and a link with code");
  });

  it("clips text deterministically", () => {
    expect(clip("one two three four five", 12)).toBe("one two…");
    expect(clip("short", 12)).toBe("short");
  });
});
