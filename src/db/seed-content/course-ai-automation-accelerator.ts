import type { SeedCourse } from "./courses";

export const aiAutomationAccelerator: SeedCourse = {
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
};
