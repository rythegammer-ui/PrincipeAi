/**
 * Loads everything the course kit is built from: the course catalog seed (lessons as Markdown), the lesson quizzes
 * and video links in deliverables/, and the video scripts. Lesson Markdown is rendered to HTML once here, so the
 * offline app and the PDF course book show exactly the same lesson.
 */
import fs from "node:fs";
import path from "node:path";
import { Marked } from "marked";
import { seedCourses, type SeedCourse } from "../../src/db/seed-content/courses";

export const ROOT = path.resolve(__dirname, "../..");
export const DELIVERABLES = path.join(ROOT, "deliverables");

export type QuizQuestion = { q: string; options: string[]; answer: number; explain: string };

export type KitBlock = { lang: string; text: string };

export type KitLesson = {
  n: number;
  slug: string;
  title: string;
  summary: string;
  durationMin: number;
  module: number;
  moduleTitle: string;
  /** Rendered lesson body, with each "##" section wrapped in <section class="sec sec-…">. */
  html: string;
  /** Plain text of the lesson, for search. */
  text: string;
  /** Every ~~~ block in the lesson: prompts, templates and code. */
  blocks: KitBlock[];
  quiz: QuizQuestion[];
  videoUrl: string | null;
};

export type KitModule = { n: number; title: string; lessons: KitLesson[] };

export type KitCourse = {
  slug: string;
  title: string;
  /** The title before the colon, e.g. "AI Essentials". */
  shortTitle: string;
  subtitle: string;
  level: string;
  emoji: string;
  descriptionHtml: string;
  outcomes: string[];
  modules: KitModule[];
  lessons: KitLesson[];
  totalMin: number;
  siteUrl: string;
  contactEmail: string;
  licensee: string | null;
  welcomeVideoUrl: string | null;
};

const marked = new Marked({ gfm: true });

export function renderMarkdown(md: string): string {
  return marked.parse(md, { async: false });
}

const SECTION_KINDS: [RegExp, string][] = [
  [/^(try it now|do this now|build it)\b/i, "exercise"],
  [/^key takeaways/i, "takeaways"],
  [/^common mistakes/i, "mistakes"],
];

/** Wraps the intro and each <h2> section of rendered lesson HTML so the app and the book can style them. */
export function wrapSections(html: string): string {
  const parts = html.split(/(?=<h2[ >])/);
  return parts
    .map((part) => {
      const heading = part.match(/^<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1].replace(/<[^>]+>/g, "").trim();
      if (heading === undefined) return `<section class="sec sec-intro">${part}</section>`;
      const kind = SECTION_KINDS.find(([re]) => re.test(heading))?.[1] ?? "default";
      return `<section class="sec sec-${kind}">${part}</section>`;
    })
    .join("\n");
}

/** Site links in lessons are relative (e.g. /consulting); a downloaded file needs absolute ones. */
export function absolutizeLinks(html: string, siteUrl: string): string {
  return html.replace(/href="\/(?!\/)/g, `href="${siteUrl}/`);
}

export function htmlToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractBlocks(md: string): KitBlock[] {
  return [...md.matchAll(/^~~~([^\n]*)\n([\s\S]*?)^~~~[ \t]*$/gm)].map((m) => ({
    lang: m[1].trim(),
    text: m[2].replace(/\n$/, ""),
  }));
}

function readJson<T>(file: string, fallback: T): T {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function loadQuiz(courseSlug: string, n: number, slug: string): QuizQuestion[] {
  const file = path.join(DELIVERABLES, "quizzes", courseSlug, `${String(n).padStart(2, "0")}-${slug}.json`);
  const data = readJson<{ questions?: QuizQuestion[] }>(file, {});
  return data.questions ?? [];
}

export type VideoLinks = Record<string, Record<string, string>>;

export function loadVideoLinks(): VideoLinks {
  return readJson<VideoLinks>(path.join(DELIVERABLES, "videos.json"), {});
}

export function loadCourse(
  seed: SeedCourse,
  opts: { siteUrl: string; contactEmail: string; licensee: string | null; videos: VideoLinks },
): KitCourse {
  const videos = opts.videos[seed.slug] ?? {};
  const lessons: KitLesson[] = [];
  const modules: KitModule[] = seed.modules.map((m, mi) => ({
    n: mi + 1,
    title: m.title,
    lessons: m.lessons.map((l) => {
      const html = absolutizeLinks(wrapSections(renderMarkdown(l.content)), opts.siteUrl);
      const lesson: KitLesson = {
        n: lessons.length + 1,
        slug: l.slug,
        title: l.title,
        summary: l.summary,
        durationMin: l.durationMin,
        module: mi + 1,
        moduleTitle: m.title,
        html,
        text: htmlToText(html),
        blocks: extractBlocks(l.content),
        quiz: [],
        videoUrl: videos[l.slug] || l.videoUrl || null,
      };
      lesson.quiz = loadQuiz(seed.slug, lesson.n, l.slug);
      lessons.push(lesson);
      return lesson;
    }),
  }));
  return {
    slug: seed.slug,
    title: seed.title,
    shortTitle: seed.title.split(":")[0].trim(),
    subtitle: seed.subtitle,
    level: seed.level,
    emoji: seed.coverEmoji,
    descriptionHtml: absolutizeLinks(renderMarkdown(seed.description), opts.siteUrl),
    outcomes: seed.outcomes,
    modules,
    lessons,
    totalMin: lessons.reduce((sum, l) => sum + l.durationMin, 0),
    siteUrl: opts.siteUrl,
    contactEmail: opts.contactEmail,
    licensee: opts.licensee,
    welcomeVideoUrl: videos._welcome || null,
  };
}

export function allSeedCourses(): SeedCourse[] {
  return seedCourses;
}

export type VideoScript = { file: string; title: string; markdown: string };

/** The course's video scripts in recording order (00-welcome first). */
export function loadVideoScripts(courseSlug: string): VideoScript[] {
  const dir = path.join(DELIVERABLES, "video-scripts", courseSlug);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /^\d\d-.*\.md$/.test(f))
    .sort()
    .map((file) => {
      const markdown = fs.readFileSync(path.join(dir, file), "utf8");
      return { file, title: markdown.match(/^# (.+)$/m)?.[1].trim() ?? file, markdown };
    });
}

export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m} min`;
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
