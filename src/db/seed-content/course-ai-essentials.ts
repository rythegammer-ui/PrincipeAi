import type { SeedCourse } from "./courses";

export const aiEssentials: SeedCourse = {
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
};
