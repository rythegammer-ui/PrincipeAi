import type { StarterKit } from "@/content/starter-kit";

/** Counts derived from the Starter Kit content (every array may be empty while content is being written). */
export function kitStats(kit: StarterKit) {
  const prompts = kit.promptCategories.reduce((sum, c) => sum + c.prompts.length, 0);
  return {
    days: kit.days.length,
    prompts,
    categories: kit.promptCategories.length,
    tips: kit.tips.length,
  };
}

/** One-line description of the kit, e.g. "A 7-day plan and 50 copy-paste prompts". */
export function kitSummary(kit: StarterKit): string {
  const { days, prompts } = kitStats(kit);
  if (days && prompts) return `A ${days}-day plan and ${prompts} copy-paste prompts`;
  if (days) return `A ${days}-day quick-start plan with ready-to-use prompts`;
  if (prompts) return `${prompts} copy-paste prompts for everyday life and work`;
  return "A simple quick-start plan and copy-paste prompts";
}

/** Stable anchor id for a prompt category. */
export function categoryAnchor(category: string, index: number): string {
  const slug = category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `prompts-${slug || index + 1}`;
}
