/**
 * Builds the offline course app: one self-contained HTML file (styles, fonts, script and course data inline) that a
 * customer opens by double-clicking. See app/app.js for the app itself.
 */
import fs from "node:fs";
import path from "node:path";
import { escapeHtml, type KitCourse } from "./content";
import { fontFaceCss } from "./fonts";

const FAVICON =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a5af8"/><stop offset="1" stop-color="#4a1fb8"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="url(#g)"/><path fill="#fff" d="M16 6.7l1.6 4.7 4.7 1.6-4.7 1.6L16 19.3l-1.6-4.7-4.7-1.6 4.7-1.6z"/></svg>',
  );

/** JSON that is safe to place inside a <script> element. */
function scriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

export function buildAppHtml(course: KitCourse, builtAt: Date): string {
  const css = fs.readFileSync(path.join(__dirname, "app", "app.css"), "utf8");
  const js = fs.readFileSync(path.join(__dirname, "app", "app.js"), "utf8");
  const data = {
    slug: course.slug,
    title: course.title,
    shortTitle: course.shortTitle,
    subtitle: course.subtitle,
    level: course.level,
    emoji: course.emoji,
    descriptionHtml: course.descriptionHtml,
    outcomes: course.outcomes,
    modules: course.modules.map((m) => ({ n: m.n, title: m.title, lessons: m.lessons.map((l) => l.slug) })),
    lessons: course.lessons.map((l) => ({
      n: l.n,
      slug: l.slug,
      title: l.title,
      summary: l.summary,
      durationMin: l.durationMin,
      module: l.module,
      moduleTitle: l.moduleTitle,
      html: l.html,
      text: l.text,
      blocks: l.blocks,
      quiz: l.quiz,
      videoUrl: l.videoUrl,
    })),
    totalMin: course.totalMin,
    siteUrl: course.siteUrl,
    contactEmail: course.contactEmail,
    licensee: course.licensee,
    welcomeVideoUrl: course.welcomeVideoUrl,
    builtAt: builtAt.toISOString(),
  };
  // Applies the saved or system theme before first paint, so dark-mode users don't see a white flash.
  const themeBoot = `try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(`principe-course:${course.slug}`)})||"{}").theme;var d=s==="dark"||((!s||s==="system")&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light"}catch(e){}`;
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(course.title)} · Principe AI</title>
<meta name="description" content="${escapeHtml(course.subtitle)}">
<meta name="robots" content="noindex">
<meta name="generator" content="Principe AI course kit">
<link rel="icon" href="${FAVICON}">
<script>${themeBoot}</script>
<style>
${fontFaceCss()}
${css}
</style>
</head>
<body>
<noscript><p style="max-width:560px;margin:15vh auto;padding:0 20px;font:17px/1.6 system-ui,sans-serif">This course app needs JavaScript. Open it in Chrome, Edge, Safari or Firefox, or read the PDF course book that came with it.</p></noscript>
<div id="root"></div>
<script type="application/json" id="course-data">${scriptJson(data)}</script>
<script>
${js}
</script>
</body>
</html>
`;
}
