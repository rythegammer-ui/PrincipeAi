/**
 * Builds the PDF course book (for customers) and the video-script book (for the course owner) with headless
 * Chromium. Contents pages get real page numbers: the PDF is rendered once, each chapter's first page is found in
 * its text (needs `pdftotext` from poppler-utils), and the PDF is rendered again with the numbers filled in.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Browser } from "@playwright/test";
import { escapeHtml, formatDuration, renderMarkdown, type KitCourse, type VideoScript } from "./content";
import { fontFaceCss } from "./fonts";

const LOGO_MARK =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" opacity=".7"/></svg>';
const LOGO = `<div class="logo"><span class="mark">${LOGO_MARK}</span><span>Principe <b>AI</b></span></div>`;

/** Page number of each chapter, or null on the first pass (placeholders keep the layout identical). */
type PageMap = Map<string, number> | null;
type Marker = { id: string; text: string };

function css(footer: string): string {
  const book = fs.readFileSync(path.join(__dirname, "book", "book.css"), "utf8");
  const footerRule = `@page { @bottom-left { content: ${JSON.stringify(footer)}; font: 500 8pt "Geist", sans-serif; color: #8d8aa6; } }`;
  return `${fontFaceCss()}\n${book}\n${footerRule}`;
}

function doc(title: string, footer: string, body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${css(footer)}</style></head><body>${body}</body></html>`;
}

function splitTitle(t: string): string {
  const i = t.indexOf(":");
  return i < 0 ? escapeHtml(t) : `${escapeHtml(t.slice(0, i + 1))} <em>${escapeHtml(t.slice(i + 1).trim())}</em>`;
}

function pageNo(pages: PageMap, id: string): string {
  if (!pages) return "000";
  return String(pages.get(id) ?? "");
}

function tocRow(href: string, num: string, label: string, page: string, cls = ""): string {
  return `<li class="${cls}"><a href="#${href}"><span class="num">${num}</span><span>${label}</span><span class="dots"></span><span class="pg">${page}</span></a></li>`;
}

const host = (url: string) => url.replace(/^https?:\/\//, "");
const LETTERS = "ABCD";

/* ── Course book ───────────────────────────────────────── */

function courseBookHtml(c: KitCourse, others: KitCourse[], pages: PageMap, year: number): string {
  const licensee = c.licensee ? `Licensed to ${c.licensee}` : "Licensed to the purchaser";
  const footer = `Principe AI · ${c.shortTitle}${c.licensee ? ` · Licensed to ${c.licensee}` : ""}`;
  const hasQuiz = c.lessons.some((l) => l.quiz.length);
  const exerciseName = c.slug === "ai-automation-accelerator" ? "“Build it”" : "“Try it now” or “Do this now”";

  const cover = `<section class="cover">${LOGO}
    <div class="cover-main">
      <div class="cover-emoji">${escapeHtml(c.emoji)}</div>
      <p class="kicker">Course book</p>
      <h1>${splitTitle(c.title)}</h1>
      <p class="sub">${escapeHtml(c.subtitle)}</p>
      <div class="cover-meta"><span>${escapeHtml(c.level)}</span><span>${c.modules.length} modules</span><span>${c.lessons.length} lessons</span><span>${formatDuration(c.totalMin)}</span></div>
    </div>
    <div class="cover-foot"><span><b>Principe AI</b> · a Principe Consults company<br>${escapeHtml(host(c.siteUrl))}</span><span>${escapeHtml(licensee)} for personal use<br>© ${year} Principe Consults</span></div>
  </section>`;

  const welcome = `<section class="page intro">
    <p class="kicker">Welcome</p>
    <h1 class="title">${splitTitle(c.title)}</h1>
    ${c.descriptionHtml}
    <h2 class="h">What you'll be able to do</h2>
    <ul class="checks">${c.outcomes.map((o) => `<li>${escapeHtml(o)}</li>`).join("")}</ul>
    <h2 class="h">How to use this course book</h2>
    <div class="howto">
      <div><b>Work in order</b><span>Each lesson builds on the last. One lesson a day is a great pace.</span></div>
      <div><b>Keep an AI assistant open</b><span>Copy the prompts in the shaded boxes into Claude, ChatGPT, Gemini or Copilot, then adapt the details in brackets.</span></div>
      <div><b>Do the exercise</b><span>Every lesson has a hands-on ${exerciseName} section. Tick the boxes as you go.</span></div>
      <div><b>Check yourself</b><span>${hasQuiz ? "Answer the three questions at the end of each lesson. The answers are at the back." : "Finish each lesson with its key takeaways."}</span></div>
    </div>
    <div class="app-note"><b>Prefer an interactive version?</b> Open the course app that came with this book. It tracks your progress, copies any prompt in one click, quizzes you as you go and unlocks your certificate of completion.</div>
  </section>`;

  const toc = `<section class="page"><p class="kicker">Contents</p><h1 class="title">What's inside</h1><ul class="toc">
    ${c.modules
      .map(
        (m) =>
          tocRow(`module-${m.n}`, `Module ${m.n}`, escapeHtml(m.title), pageNo(pages, `module-${m.n}`), "tm") +
          m.lessons.map((l) => tocRow(`lesson-${l.n}`, String(l.n), escapeHtml(l.title), pageNo(pages, `lesson-${l.n}`))).join(""),
      )
      .join("")}
    ${hasQuiz ? tocRow("answers", "", "Answer key", pageNo(pages, "answers"), "tm") : ""}
    ${tocRow("next", "", "What's next", pageNo(pages, "next"), "tm")}
  </ul></section>`;

  const body = c.modules
    .map((m) => {
      const opener = `<section class="page opener" id="module-${m.n}">
        <p class="kicker">Module ${m.n} of ${c.modules.length}</p>
        <div class="big">${m.n}</div>
        <h1>${escapeHtml(m.title)}</h1>
        <p class="muted">${m.lessons.length} lessons · ${formatDuration(m.lessons.reduce((s, l) => s + l.durationMin, 0))}</p>
        <ol>${m.lessons.map((l) => `<li><span class="n">${l.n}</span><span class="t">${escapeHtml(l.title)}</span><span class="d">${l.durationMin} min</span></li>`).join("")}</ol>
      </section>`;
      const lessons = m.lessons
        .map((l) => {
          const quiz = l.quiz.length
            ? `<section class="check"><h2>Check your understanding</h2><p>Answers on page ${pageNo(pages, "answers")}.</p><ol>${l.quiz
                .map((q) => `<li>${escapeHtml(q.q)}<ul>${q.options.map((o, i) => `<li><b>${LETTERS[i]}</b><span>${escapeHtml(o)}</span></li>`).join("")}</ul></li>`)
                .join("")}</ol></section>`
            : "";
          return `<article class="page lesson" id="lesson-${l.n}">
            <div class="l-eyebrow"><span class="pill">Lesson ${l.n} of ${c.lessons.length}</span><span>Module ${m.n} · ${escapeHtml(m.title)} · ${l.durationMin} min</span></div>
            <h1 class="l-title">${escapeHtml(l.title)}</h1>
            <p class="l-lead">${escapeHtml(l.summary)}</p>
            <div class="prose">${l.html}</div>
            ${quiz}
          </article>`;
        })
        .join("");
      return opener + lessons;
    })
    .join("");

  const answers = hasQuiz
    ? `<section class="page answers" id="answers"><p class="kicker">Appendix</p><h1 class="title">Answer key</h1>
      ${c.lessons
        .filter((l) => l.quiz.length)
        .map(
          (l) => `<div class="a-lesson"><h3>Lesson ${l.n} · ${escapeHtml(l.title)}</h3>${l.quiz
            .map((q, i) => `<p><b>${i + 1}. ${LETTERS[q.answer]}</b> · ${escapeHtml(q.explain)}</p>`)
            .join("")}</div>`,
        )
        .join("")}</section>`
    : "";

  const closing = `<section class="page closing" id="next"><p class="kicker">You made it</p><h1 class="title">What's next</h1>
    <p>You've worked through every lesson of <b>${escapeHtml(c.title)}</b>. The real gains come from using it every week, so here's how to keep going.</p>
    <div class="steps">
      <div><b>Keep practicing.</b> Go back to the exercises that mattered most to you and run them on real work this week.</div>
      <div><b>Get your certificate.</b> Mark each lesson complete in the course app to unlock your certificate of completion.</div>
      <div><b>Questions?</b> Email <a href="mailto:${escapeHtml(c.contactEmail)}">${escapeHtml(c.contactEmail)}</a>, or book a free strategy call at <a href="${escapeHtml(c.siteUrl)}/book">${escapeHtml(host(c.siteUrl))}/book</a>.</div>
      ${others.length ? `<div><b>Keep learning.</b> ${others.map((o) => `<a href="${escapeHtml(o.siteUrl)}/courses/${o.slug}">${escapeHtml(o.title)}</a> (${escapeHtml(o.level.toLowerCase())})`).join(" and ")}.</div>` : ""}
    </div>
    <div class="legal">© ${year} Principe Consults. All rights reserved. ${escapeHtml(licensee)} for personal use. Please don't share, resell or republish this book or the course app.
    This course is educational and isn't legal, financial, medical or other professional advice. AI tools change quickly: always check important facts and follow the data and privacy rules that apply to you.</div>
  </section>`;

  return doc(`${c.title} — Course Book`, footer, cover + welcome + toc + body + answers + closing);
}

export function courseBookMarkers(c: KitCourse): Marker[] {
  // In document order: pages are searched forward from the previous marker.
  return [
    ...c.modules.flatMap((m) => [
      { id: `module-${m.n}`, text: `Module ${m.n} of ${c.modules.length}` },
      ...m.lessons.map((l) => ({ id: `lesson-${l.n}`, text: `Lesson ${l.n} of ${c.lessons.length}` })),
    ]),
    { id: "answers", text: "Answer key" },
    { id: "next", text: "What's next" },
  ];
}

/* ── Video-script book ─────────────────────────────────── */

function markCues(html: string): string {
  return html
    .replace(/<p><strong>\[OPTIONAL PERSONAL EXAMPLE/g, '<p class="cue personal"><strong>[OPTIONAL PERSONAL EXAMPLE')
    .replace(/<p><strong>\[/g, '<p class="cue"><strong>[');
}

function spokenWords(markdown: string): number {
  const script = markdown.split("## Script")[1]?.split("## On-screen text")[0] ?? "";
  return script
    .replace(/^~~~[^\n]*\n[\s\S]*?^~~~\s*$/gm, " ")
    .split("\n")
    .filter((line) => line.trim() && !/^\s*(#|\*\*\[|\|)/.test(line))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function scriptsBookHtml(c: KitCourse, scripts: VideoScript[], howTo: string, pages: PageMap, year: number): string {
  const totalWords = scripts.reduce((s, x) => s + spokenWords(x.markdown), 0);
  const cover = `<section class="cover">${LOGO}
    <div class="cover-main">
      <div class="cover-emoji">🎬</div>
      <p class="kicker">Video scripts · for recording</p>
      <h1>${splitTitle(c.title)}</h1>
      <p class="sub">${scripts.length} scripts: a welcome video and one video per lesson, ready for camera.</p>
      <div class="cover-meta"><span>${scripts.length} videos</span><span>~${Math.round(totalWords / 140 / 6) / 10 || 0} hours of talk time</span><span>Internal · not for customers</span></div>
    </div>
    <div class="cover-foot"><span><b>Principe AI</b> · ${escapeHtml(host(c.siteUrl))}</span><span>© ${year} Principe Consults</span></div>
  </section>`;
  const intro = `<section class="page intro scripts"><p class="kicker">Before you start</p><h1 class="title">How to record</h1><div class="prose">${renderMarkdown(howTo)}</div></section>`;
  const toc = `<section class="page"><p class="kicker">Contents</p><h1 class="title">The scripts</h1><ul class="toc">${scripts
    .map((s, i) => tocRow(`script-${i}`, i === 0 ? "" : String(i), escapeHtml(s.title), pageNo(pages, `script-${i}`)))
    .join("")}</ul></section>`;
  const body = scripts
    .map(
      (s, i) => `<article class="page scripts" id="script-${i}">
        <div class="l-eyebrow"><span class="pill">Script ${i + 1} of ${scripts.length}</span><span>${escapeHtml(c.shortTitle)}</span></div>
        <h1 class="l-title script-head">${escapeHtml(s.title)}</h1>
        <div class="prose spoken">${markCues(renderMarkdown(s.markdown))}</div>
      </article>`,
    )
    .join("");
  return doc(`${c.title} — Video Scripts`, `Principe AI · ${c.shortTitle} · Video scripts`, cover + intro + toc + body);
}

export function scriptMarkers(scripts: VideoScript[]): Marker[] {
  return scripts.map((_, i) => ({ id: `script-${i}`, text: `Script ${i + 1} of ${scripts.length}` }));
}

/* ── Rendering ─────────────────────────────────────────── */

async function renderPdf(browser: Browser, html: string): Promise<Buffer> {
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    return await page.pdf({ printBackground: true, preferCSSPageSize: true, outline: true, tagged: true });
  } finally {
    await page.close();
  }
}

function hasPdftotext(): boolean {
  try {
    execFileSync("pdftotext", ["-v"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** First page (1-based) on which each marker appears, searching forward from the previous marker. */
function findPages(pdf: Buffer, markers: Marker[]): Map<string, number> {
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "course-kit-")), "pass1.pdf");
  fs.writeFileSync(tmp, pdf);
  const text = execFileSync("pdftotext", ["-enc", "UTF-8", tmp, "-"], { maxBuffer: 64 * 1024 * 1024 }).toString("utf8");
  fs.rmSync(path.dirname(tmp), { recursive: true, force: true });
  // Labels are set in letter-spaced capitals with CSS, which the extracted text keeps ("M O D U L E 1"), so compare
  // lower-cased with all whitespace removed.
  const norm = (s: string) => s.replace(/\s+/g, "").replace(/[‘’]/g, "'").toLowerCase();
  const pageTexts = text.split("\f").map(norm);
  const found = new Map<string, number>();
  let from = 3; // skip the cover, front matter and contents
  for (const m of markers) {
    const idx = pageTexts.findIndex((t, i) => i >= from && t.includes(norm(m.text)));
    if (idx >= 0) {
      found.set(m.id, idx + 1);
      from = idx;
    }
  }
  return found;
}

async function renderWithToc(browser: Browser, html: (pages: PageMap) => string, markers: Marker[]): Promise<{ pdf: Buffer; numbered: boolean }> {
  const first = await renderPdf(browser, html(null));
  if (!hasPdftotext()) return { pdf: await renderPdf(browser, html(new Map())), numbered: false };
  const pages = findPages(first, markers);
  const missing = markers.filter((m) => !pages.has(m.id)).map((m) => m.id);
  if (missing.length) console.warn(`  ! couldn't locate ${missing.join(", ")} for the contents page`);
  const pdf = await renderPdf(browser, html(pages));
  const check = findPages(pdf, markers);
  if ([...pages].some(([id, n]) => check.get(id) !== n)) console.warn("  ! page numbers moved between passes; check the contents page");
  return { pdf, numbered: true };
}

export async function buildCourseBook(browser: Browser, c: KitCourse, others: KitCourse[], year: number) {
  return renderWithToc(browser, (pages) => courseBookHtml(c, others, pages, year), courseBookMarkers(c));
}

export async function buildScriptsBook(browser: Browser, c: KitCourse, scripts: VideoScript[], howTo: string, year: number) {
  return renderWithToc(browser, (pages) => scriptsBookHtml(c, scripts, howTo, pages, year), scriptMarkers(scripts));
}
