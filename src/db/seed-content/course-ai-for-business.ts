import type { SeedCourse } from "./courses";

export const aiForBusiness: SeedCourse = {
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
};
