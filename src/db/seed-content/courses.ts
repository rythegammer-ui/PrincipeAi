/**
 * Course catalog seed content. Edit freely — on a fresh database these are inserted once.
 * Lesson `content` is Markdown. Keep lesson slugs unique within a course.
 */
export type SeedLesson = {
  slug: string;
  title: string;
  summary: string;
  durationMin: number;
  isPreview?: boolean;
  videoUrl?: string;
  content: string;
};

export type SeedModule = { title: string; lessons: SeedLesson[] };

export type SeedCourse = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  audience: "life" | "business" | "both";
  level: string;
  priceCents: number;
  compareAtCents?: number;
  coverEmoji: string;
  featured?: boolean;
  outcomes: string[];
  includes: string[];
  faqs: { q: string; a: string }[];
  modules: SeedModule[];
};

export const seedCourses: SeedCourse[] = [
  {
    slug: "ai-essentials",
    title: "AI Essentials: Use AI in Everyday Life",
    subtitle: "Go from curious to confident with AI in 7 days — no tech background needed.",
    description:
      "A friendly, practical course that teaches you how to use AI assistants like Claude and ChatGPT to save hours every week — at home, at work, and everywhere in between.",
    audience: "life",
    level: "Beginner",
    priceCents: 4700,
    compareAtCents: 9700,
    coverEmoji: "🌱",
    outcomes: [
      "Write prompts that get great answers on the first try",
      "Use AI to plan, research, write, and decide faster",
      "Build a personal AI toolkit you'll actually use every day",
      "Know what AI is good at, where it fails, and how to stay safe",
    ],
    includes: ["Lifetime access", "Copy-paste prompt library", "AI tutor inside every lesson", "Certificate of completion"],
    faqs: [
      { q: "Do I need any technical skills?", a: "No. If you can send an email, you can take this course." },
      { q: "Which AI tools do I need?", a: "A free account with any major AI assistant is enough. We show you exactly how to set it up." },
    ],
    modules: [
      {
        title: "Getting Started",
        lessons: [
          {
            slug: "what-ai-really-is",
            title: "What AI Really Is (and Isn't)",
            summary: "A plain-English mental model for how AI assistants work.",
            durationMin: 8,
            isPreview: true,
            content: "## What AI really is\n\nLesson content coming soon.",
          },
        ],
      },
    ],
  },
  {
    slug: "ai-for-business",
    title: "AI for Business Owners: The Implementation Playbook",
    subtitle: "Find the highest-ROI AI opportunities in your business and implement them in 30 days.",
    description:
      "A step-by-step playbook for owners and operators who want real results from AI — not hype. Audit your workflows, pick the right use cases, and roll out AI safely across marketing, sales, operations, and customer service.",
    audience: "business",
    level: "Intermediate",
    priceCents: 29700,
    compareAtCents: 49700,
    coverEmoji: "🚀",
    featured: true,
    outcomes: [
      "Run an AI opportunity audit across your whole business",
      "Deploy AI for marketing, sales, support, and operations",
      "Create SOPs and guardrails so your team uses AI safely",
      "Measure ROI and know exactly what's working",
    ],
    includes: ["Lifetime access", "AI Opportunity Audit workbook", "Prompt + SOP templates", "AI tutor inside every lesson", "Bonus: 30-day rollout plan"],
    faqs: [
      { q: "Is this for my industry?", a: "Yes — the framework works for service businesses, e-commerce, agencies, local businesses, and professional practices." },
      { q: "Do I need to hire developers?", a: "No. Everything in the course uses off-the-shelf tools. If you want us to build custom systems, see AI Implementation." },
    ],
    modules: [
      {
        title: "The AI Opportunity Audit",
        lessons: [
          {
            slug: "where-ai-pays-off",
            title: "Where AI Actually Pays Off",
            summary: "The four categories of business work where AI produces measurable ROI.",
            durationMin: 12,
            isPreview: true,
            content: "## Where AI actually pays off\n\nLesson content coming soon.",
          },
        ],
      },
    ],
  },
  {
    slug: "ai-automation-accelerator",
    title: "AI Automation Accelerator: Build Workflows & Agents",
    subtitle: "Connect AI to your tools and build automations that work while you sleep.",
    description:
      "For builders, operators, and ambitious owners. Learn to design AI workflows, connect them to your apps with no-code tools, and build simple AI agents that handle real work end-to-end.",
    audience: "both",
    level: "Advanced",
    priceCents: 49700,
    compareAtCents: 79700,
    coverEmoji: "⚡",
    outcomes: [
      "Design reliable AI workflows with clear inputs, outputs, and checks",
      "Automate lead follow-up, content, reporting, and inbox triage",
      "Build AI agents with tools, memory, and human-in-the-loop review",
      "Ship automations your team trusts — with monitoring and fallbacks",
    ],
    includes: ["Lifetime access", "Automation blueprint library", "AI tutor inside every lesson", "Bonus: Agent design canvas"],
    faqs: [
      { q: "Do I need to code?", a: "No, but it helps to be comfortable with tools like Zapier or Make. Optional code examples are included for the curious." },
      { q: "What will I build?", a: "At least three working automations for your own life or business, plus a simple AI agent." },
    ],
    modules: [
      {
        title: "Automation Foundations",
        lessons: [
          {
            slug: "anatomy-of-an-ai-workflow",
            title: "Anatomy of an AI Workflow",
            summary: "Triggers, context, model, actions, and checks — the five parts of every AI automation.",
            durationMin: 14,
            isPreview: true,
            content: "## Anatomy of an AI workflow\n\nLesson content coming soon.",
          },
        ],
      },
    ],
  },
];
