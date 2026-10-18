/**
 * The free lead magnet: "The AI Starter Kit". Rendered at /guide after opt-in.
 * OWNER: content (AI Essentials) feature.
 */
export type StarterKit = {
  title: string;
  subtitle: string;
  intro: string;
  /** 7-day quick-start plan. */
  days: { day: number; title: string; goal: string; steps: string[]; prompt: string }[];
  /** Copy-paste prompt library grouped by category. */
  promptCategories: { category: string; description: string; prompts: { title: string; prompt: string }[] }[];
  /** Short safety / best-practice tips. */
  tips: string[];
};

export const starterKit: StarterKit = {
  title: "The AI Starter Kit",
  subtitle: "50 copy-paste prompts + a 7-day plan to make AI genuinely useful in your life and work.",
  intro: "Content coming soon.",
  days: [],
  promptCategories: [],
  tips: [],
};
