// Renders every frame in stories.html to a 1080x1920 PNG, plus an overview sheet.
// Run from the repo root: node deliverables/social-launch/stories/source/render.mjs
// Uses the repo's Playwright; set CHROMIUM_PATH to use a specific Chromium build.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..");
const page_url = pathToFileURL(join(here, "stories.html")).href;

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const written = [];

for (const agent of [false, true]) {
  await page.goto(page_url);
  await page.evaluate(async (on) => {
    document.body.classList.toggle("agent", on);
    await document.fonts.ready;
  }, agent);
  const frames = await page.locator(agent ? ".frame[data-agent]" : ".frame").all();
  for (const frame of frames) {
    let out = await frame.getAttribute("data-out");
    if (agent) out = out.replace(/^launch\//, "launch-for-agents/");
    const path = join(outDir, out);
    mkdirSync(dirname(path), { recursive: true });
    await frame.screenshot({ path });
    written.push(out);
  }
}

// Overview: every Story frame side by side, a quick way to review or share the set (feed images have other sizes).
const stories = written.filter((f) => !f.startsWith("feed/"));
const rows = [...new Set(stories.map((f) => dirname(f)))].map((dir) => stories.filter((f) => dirname(f) === dir));
const thumbs = rows
  .map((row) => `<div class="row"><h2>${dirname(row[0])}</h2><div>${row.map((f) => `<img src="${pathToFileURL(join(outDir, f)).href}">`).join("")}</div></div>`)
  .join("");
await page.setViewportSize({ width: 6 * 270 + 7 * 24, height: 400 });
await page.setContent(`<style>body{margin:0;padding:24px;background:#0c0a1d;font-family:sans-serif;color:#fec84b}
  h2{margin:8px 0 14px;font-size:22px;letter-spacing:.1em;text-transform:uppercase}.row div{display:flex;gap:24px;margin-bottom:24px}
  img{width:270px;height:480px;border-radius:14px}</style>${thumbs}`);
await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode())));
await page.screenshot({ path: join(outDir, "overview.png"), fullPage: true });

await browser.close();
console.log(`Wrote ${written.length} frames and overview.png to ${outDir}`);
