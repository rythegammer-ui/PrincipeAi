/**
 * Builds the downloadable course kit for each course into deliverables/dist/:
 *   - <Course>-Course-App.html   offline course app (open by double-clicking; works without internet)
 *   - <Course>-Course-Book.pdf   printable course book with quizzes and answer key
 *   - <Course>-Video-Scripts.pdf the lesson video scripts, for the course owner
 *   - <Course>.zip               what you send a customer: the app, the book and a "Start here" note
 *
 *   npx tsx scripts/course-kit/build.ts                               all courses
 *   npx tsx scripts/course-kit/build.ts --course ai-essentials        one course
 *   npx tsx scripts/course-kit/build.ts --licensee "Jane Doe"         personalised copy → deliverables/dist/licensed/
 *   npx tsx scripts/course-kit/build.ts --site-url https://example.com   links to another domain
 *
 * Needs Chromium for Playwright (PLAYWRIGHT_CHROMIUM_EXECUTABLE to use a specific one) and, for page numbers on the
 * contents pages, `pdftotext` (poppler-utils).
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { site } from "../../src/config/site";
import { buildAppHtml } from "./app";
import { buildCourseBook, buildScriptsBook } from "./book";
import { allSeedCourses, DELIVERABLES, loadCourse, loadVideoLinks, loadVideoScripts, type KitCourse } from "./content";
import { writeZip } from "./zip";

/** The live site; override with --site-url or NEXT_PUBLIC_SITE_URL. */
const DEFAULT_SITE_URL = "https://principeai.com";

function args() {
  const out: { course?: string; licensee?: string; siteUrl?: string } = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const [flag, inline] = argv[i].split("=", 2);
    const value = inline ?? argv[++i];
    if (flag === "--course") out.course = value;
    else if (flag === "--licensee") out.licensee = value?.trim();
    else if (flag === "--site-url") out.siteUrl = value;
    else throw new Error(`Unknown option ${argv[i]}`);
  }
  return out;
}

const fileBase = (c: KitCourse) => c.shortTitle.replace(/[^A-Za-z0-9]+/g, "-");
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const kb = (n: number) => `${Math.round(n / 1024).toLocaleString()} KB`;

function startHere(c: KitCourse, year: number): string {
  return `${c.title}
${"=".repeat(c.title.length)}

Thanks for joining! Here's how to get started.

1. UNZIP THIS FOLDER FIRST
   Extract it somewhere you'll keep it, like your Documents folder.

2. OPEN "${c.shortTitle} - Course App.html"
   Double-click it. It opens in your web browser (Chrome, Edge, Safari or Firefox)
   and works offline: no account, no login, no internet needed.
   Your progress, quiz answers and notes are saved in that browser on that computer,
   so always open the same copy of the file with the same browser.

3. PREFER TO READ OR PRINT? OPEN "${c.shortTitle} - Course Book.pdf"
   Every lesson, prompt and exercise, with the quiz answers at the back.
   This is the best option on an iPhone or iPad.

Questions? Email ${c.contactEmail}. We're happy to help.
${c.siteUrl}

(c) ${year} Principe Consults. ${c.licensee ? `Licensed to ${c.licensee}` : "Licensed to the purchaser"} for personal use.
Please don't share, resell or republish these files.
`.replace(/\n/g, "\r\n");
}

async function main() {
  const opts = args();
  const siteUrl = (opts.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, "");
  const licensee = opts.licensee || null;
  const builtAt = new Date();
  const year = builtAt.getFullYear();
  const videos = loadVideoLinks();
  const courses = allSeedCourses().map((seed) => loadCourse(seed, { siteUrl, contactEmail: site.contactEmail, licensee, videos }));
  const selected = opts.course ? courses.filter((c) => c.slug === opts.course) : courses;
  if (!selected.length) throw new Error(`No course "${opts.course}". Choose one of: ${courses.map((c) => c.slug).join(", ")}`);

  const readme = fs.readFileSync(path.join(DELIVERABLES, "video-scripts", "README.md"), "utf8");
  const howTo = readme.split("## How to record")[1]?.split("\n## ")[0] ?? "";
  const distRoot = path.join(DELIVERABLES, "dist", ...(licensee ? ["licensed"] : []));
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined });
  console.log(`Building ${selected.length} course kit(s) for ${siteUrl}${licensee ? `, licensed to ${licensee}` : ""}`);

  try {
    for (const c of selected) {
      const base = fileBase(c);
      const name = licensee ? `${base}-${slugify(licensee)}` : base;
      const dir = path.join(distRoot, licensee ? name : c.slug);
      fs.mkdirSync(dir, { recursive: true });
      console.log(`\n${c.title}`);

      const quizzes = c.lessons.filter((l) => l.quiz.length).length;
      if (quizzes < c.lessons.length) console.warn(`  ! ${c.lessons.length - quizzes} lesson(s) have no quiz yet`);

      const app = buildAppHtml(c, builtAt);
      fs.writeFileSync(path.join(dir, `${base}-Course-App.html`), app);
      console.log(`  app    ${kb(Buffer.byteLength(app))}`);

      const book = await buildCourseBook(browser, c, courses.filter((o) => o.slug !== c.slug), year);
      fs.writeFileSync(path.join(dir, `${base}-Course-Book.pdf`), book.pdf);
      console.log(`  book   ${kb(book.pdf.length)}${book.numbered ? "" : " (no page numbers in contents: install pdftotext)"}`);

      if (!licensee) {
        const scripts = loadVideoScripts(c.slug);
        if (scripts.length) {
          const sb = await buildScriptsBook(browser, c, scripts, howTo, year);
          fs.writeFileSync(path.join(dir, `${base}-Video-Scripts.pdf`), sb.pdf);
          console.log(`  scripts ${scripts.length} → ${kb(sb.pdf.length)}`);
        }
      }

      const folder = licensee ? `${c.shortTitle} (${licensee})` : c.shortTitle;
      const zipPath = path.join(distRoot, `${name}.zip`);
      writeZip(zipPath, [
        { name: `${folder}/Start here.txt`, data: Buffer.from(startHere(c, year), "utf8") },
        { name: `${folder}/${c.shortTitle} - Course App.html`, data: Buffer.from(app, "utf8") },
        { name: `${folder}/${c.shortTitle} - Course Book.pdf`, data: book.pdf },
      ]);
      console.log(`  zip    ${path.relative(process.cwd(), zipPath)} (${kb(fs.statSync(zipPath).size)})`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
