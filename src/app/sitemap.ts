import type { MetadataRoute } from "next";
import { listPublishedCourses } from "@/lib/courses";
import { absoluteUrl } from "@/lib/utils";

// Reads published courses from the database on every request.
export const dynamic = "force-dynamic";

type Entry = MetadataRoute.Sitemap[number];

const STATIC_ROUTES: { path: string; changeFrequency: Entry["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/courses", changeFrequency: "weekly", priority: 0.9 },
  { path: "/assessment", changeFrequency: "monthly", priority: 0.9 },
  { path: "/free-guide", changeFrequency: "monthly", priority: 0.8 },
  { path: "/consulting", changeFrequency: "monthly", priority: 0.8 },
  { path: "/book", changeFrequency: "monthly", priority: 0.7 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/sales-team", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/sales-team/terms", changeFrequency: "yearly", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: absoluteUrl(r.path),
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  try {
    const courses = await listPublishedCourses();
    for (const c of courses) {
      entries.push({
        url: absoluteUrl(`/courses/${c.slug}`),
        lastModified: c.updatedAt,
        changeFrequency: "monthly",
        priority: c.featured ? 0.85 : 0.75,
      });
    }
  } catch (err) {
    // A database hiccup should never take the sitemap down — static routes are still useful.
    console.error("[sitemap] failed to load courses", err);
  }
  return entries;
}
