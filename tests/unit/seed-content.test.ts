import { describe, expect, it } from "vitest";
import { seedCourses } from "@/db/seed-content/courses";

describe("default course catalog seed", () => {
  it("ships no fabricated 'was' prices", () => {
    // A compare-at price renders as a struck-through "Regular price" with a "Save NN%" badge. A new site has never
    // charged those prices, so the default catalog must not claim them; the owner can add a real one in Admin → Courses.
    for (const course of seedCourses) {
      expect(course.compareAtCents, course.slug).toBeUndefined();
    }
  });

  it("highlights at most one course", () => {
    expect(seedCourses.filter((c) => c.featured).length).toBeLessThanOrEqual(1);
  });

  it("has unique course slugs and unique lesson slugs within each course", () => {
    const courseSlugs = seedCourses.map((c) => c.slug);
    expect(new Set(courseSlugs).size).toBe(courseSlugs.length);
    for (const course of seedCourses) {
      const lessonSlugs = course.modules.flatMap((m) => m.lessons.map((l) => l.slug));
      expect(new Set(lessonSlugs).size, course.slug).toBe(lessonSlugs.length);
    }
  });
});
