import type { SequenceTrigger } from "../schema";

/**
 * Default email automations. Bodies are Markdown and support placeholders:
 * {{firstName}}, {{name}}, {{siteUrl}}, {{bookUrl}}, {{coursesUrl}}, {{assessmentUrl}}, {{guideUrl}}
 */
export type SeedSequence = {
  name: string;
  description: string;
  trigger: SequenceTrigger;
  steps: { delayHours: number; subject: string; body: string }[];
};

export const seedSequences: SeedSequence[] = [
  {
    name: "Free Guide Nurture",
    description: "Sent to everyone who downloads the AI Starter Kit.",
    trigger: "lead_magnet",
    steps: [
      {
        delayHours: 0,
        subject: "Your AI Starter Kit is inside 🎁",
        body: "Hi {{firstName}},\n\nHere's your AI Starter Kit: {{guideUrl}}\n\nStart with Day 1 today — it takes 10 minutes.\n\nTalk soon,\nThe Principe AI team",
      },
    ],
  },
];
