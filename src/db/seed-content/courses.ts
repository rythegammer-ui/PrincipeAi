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
  /**
   * Optional "was" price, shown struck through with a "Save NN%" badge. Only set a price the course has
   * genuinely sold at; the default catalog leaves it unset so a new site makes no former-price claim.
   */
  compareAtCents?: number;
  coverEmoji: string;
  /** Highlights this course in the catalog and offer ladder (one recommended option). */
  featured?: boolean;
  outcomes: string[];
  includes: string[];
  faqs: { q: string; a: string }[];
  modules: SeedModule[];
};

import { aiAutomationAccelerator } from "./course-ai-automation-accelerator";
import { aiEssentials } from "./course-ai-essentials";
import { aiForBusiness } from "./course-ai-for-business";

/** Catalog order = display order. Each course lives in its own file. */
export const seedCourses: SeedCourse[] = [aiEssentials, aiForBusiness, aiAutomationAccelerator];
