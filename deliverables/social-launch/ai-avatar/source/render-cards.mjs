// Renders every prompt-card and text-card scene in videos.json to a 1080x1920 PNG in ../cards/, plus
// ../cards-overview.png (contact sheet), ../overlays/ai-avatar-label.png and cards-manifest.json (which file
// belongs to which scene; build-scripts.mjs reads it).
// Run from the repo root:
//   CHROMIUM_PATH=/opt/pw-browsers/chromium node deliverables/social-launch/ai-avatar/source/render-cards.mjs
// Each card gets the largest font size that fits the safe box. A prompt that won't fit at 28 px mono is split
// over two cards (<id>-<n>-a.png, <id>-<n>-b.png) rather than cut.
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const cardsDir = join(root, "cards");
const { videos } = JSON.parse(readFileSync(join(here, "videos.json"), "utf8"));

// Font sizes to try, largest first. Prompts never go below 28 px (the readable floor for mono on a phone).
const SIZES = {
  prompt: [52, 50, 48, 46, 44, 42, 40, 38, 36, 34, 32, 30, 28],
  list: [88, 84, 80, 76, 72, 68, 64, 60, 56, 52, 48, 44],
  quote: [104, 100, 96, 92, 88, 84, 80, 76, 72, 68, 64, 60, 56, 52, 48],
  statement: [160, 150, 140, 130, 120, 112, 104, 96, 88, 80, 72, 64, 56],
};

// The kit hard-wraps some prompts at about 70 characters for its code blocks. Re-join those wrapped lines so
// the card wraps them to its own width; real line breaks (list items, sections, """ blocks) stay.
function reflow(text) {
  const out = [];
  const structural = /^(- |\d+\. |\[|<|\{|"""|…)/;
  for (const line of text.split("\n")) {
    const prev = out.length ? out[out.length - 1] : null;
    const join =
      prev && line &&
      !/^(- |\d+\. )/.test(prev) && !/^(<|"""|\{\{)/.test(prev) &&
      !structural.test(line) &&
      (/[a-z0-9,;]$/.test(prev) || /^[a-z]/.test(line));
    if (join) out[out.length - 1] = `${prev} ${line}`;
    else out.push(line);
  }
  return out.join("\n");
}

function templateRows(text) {
  const rows = [];
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z][A-Z ]*:)\s+(.*)$/);
    if (m) rows.push({ key: m[1], value: m[2] });
    else rows[rows.length - 1].value += `\n${line.trim()}`;
  }
  return rows;
}

function specFor(video, scene) {
  const type = scene.layout;
  const headline = scene.on_screen_text && scene.on_screen_text !== scene.card_text ? scene.on_screen_text : "";
  const base = { id: video.id, n: scene.n, type, headline };
  if (type === "prompt_card" || scene.card_kind === "template") {
    if (scene.card_kind === "template")
      return { ...base, type: "prompt_card", kind: "template", rows: templateRows(scene.card_text), highlightRows: scene.card_highlight_rows };
    return { ...base, kind: "prompt", text: reflow(scene.card_text) };
  }
  const style = scene.card_text.includes(" · ") ? "list" : scene.card_style || "statement";
  return { ...base, style, text: scene.card_text, highlight: scene.card_highlight };
}

// Splits a prompt (or template) into two balanced halves, preferring a line break over a sentence break.
function split(spec) {
  if (spec.kind === "template") {
    const len = (rows) => rows.reduce((a, r) => a + r.key.length + r.value.length + 20, 0);
    const total = len(spec.rows);
    let best = 1;
    for (let i = 1; i < spec.rows.length; i++)
      if (Math.abs(len(spec.rows.slice(0, i)) - total / 2) < Math.abs(len(spec.rows.slice(0, best)) - total / 2)) best = i;
    return [{ ...spec, rows: spec.rows.slice(0, best) }, { ...spec, rows: spec.rows.slice(best) }];
  }
  // Units: each line, and each sentence inside a long line, with the separator that follows it.
  const units = [];
  spec.text.split("\n").forEach((line, li, lines) => {
    const sentences = line.match(/[^.?!]+[.?!]+["')\]]*\s*|[^.?!]+$/g) || [line];
    sentences.forEach((s, si) => {
      const last = si === sentences.length - 1;
      units.push({ text: s.trimEnd(), sep: last ? (li === lines.length - 1 ? "" : "\n") : " " });
    });
  });
  const total = units.reduce((a, u) => a + u.text.length, 0);
  let best = null;
  let acc = 0;
  for (let i = 0; i < units.length - 1; i++) {
    acc += units[i].text.length;
    const next = units[i + 1].text.trim();
    // Never cut inside a """ block, right after a heading line ("CONSTRAINTS:"), or next to a blank line.
    const quotesBefore = units.slice(0, i + 1).filter((u) => u.text.trim() === '"""').length;
    if (!next || quotesBefore % 2 === 1 || /:$/.test(units[i].text.trim()) || units[i].text === "") continue;
    const cost = Math.abs(acc - total / 2) + (units[i].sep === " " ? total * 0.12 : 0);
    if (!best || cost < best.cost) best = { i, cost };
  }
  const joinUnits = (us) => us.map((u, k) => u.text + (k < us.length - 1 ? u.sep : "")).join("").replace(/^\n+|\n+$/g, "");
  return [
    { ...spec, text: joinUnits(units.slice(0, best.i + 1)) },
    { ...spec, text: joinUnits(units.slice(best.i + 1)) },
  ];
}

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(join(here, "cards.html")).href);
await page.evaluate(async () => {
  await Promise.all([
    document.fonts.load('600 40px "Geist"'),
    document.fonts.load('400 40px "Geist Mono"'),
    document.fonts.load('italic 40px "Instrument Serif"'),
  ]);
  await document.fonts.ready;
});

const sizesFor = (spec) => (spec.type === "prompt_card" ? SIZES.prompt : SIZES[spec.style]);
async function bestSize(spec) {
  for (const size of sizesFor(spec)) if (await page.evaluate(([s, z]) => window.renderCard(s, z), [spec, size])) return size;
  return 0;
}

rmSync(cardsDir, { recursive: true, force: true });
mkdirSync(cardsDir, { recursive: true });
const manifest = {};
const written = [];
for (const video of videos) {
  for (const scene of video.scenes) {
    if (!(scene.layout === "prompt_card" || scene.layout === "text_card") || !scene.card_text) continue;
    const spec = specFor(video, scene);
    const key = `${video.id}-${scene.n}`;
    let parts = [spec];
    let size = await bestSize(spec);
    if (!size) {
      if (spec.type !== "prompt_card") throw new Error(`${key}: text card doesn't fit at the smallest size`);
      parts = split(spec).map((p, i) => ({ ...p, part: `${i + 1} of 2` }));
      const sizes = [];
      for (const p of parts) sizes.push(await bestSize(p));
      if (sizes.includes(0)) throw new Error(`${key}: doesn't fit even split over two cards`);
      size = Math.min(...sizes);
    }
    const files = [];
    for (const [i, p] of parts.entries()) {
      const file = parts.length === 1 ? `${key}.png` : `${key}-${"ab"[i]}.png`;
      await page.evaluate(([s, z]) => window.renderCard(s, z), [p, size]);
      await page.locator("#frame").screenshot({ path: join(cardsDir, file) });
      files.push(file);
      written.push(file);
    }
    manifest[key] = {
      files,
      font_px: size,
      parts: parts.length > 1 ? parts.map((p) => p.text ?? p.rows.map((r) => `${r.key} ${r.value}`).join("\n")) : undefined,
    };
    console.log(`${files.join(" + ")}  ${size}px`);
  }
}
writeFileSync(join(here, "cards-manifest.json"), `${JSON.stringify(manifest, null, 1)}\n`);

// The on-screen AI disclosure tag, transparent background, for scene 1 of every video.
mkdirSync(join(root, "overlays"), { recursive: true });
await page.evaluate(() => window.renderTag("AI avatar · AI voice"));
await page.locator("#tag").screenshot({ path: join(root, "overlays", "ai-avatar-label.png"), omitBackground: true });

// Contact sheet: every card in order, labelled with its file name.
const files = readdirSync(cardsDir).filter((f) => f.endsWith(".png"));
const order = (f) => written.indexOf(f);
files.sort((a, b) => order(a) - order(b));
const cols = 8;
await page.setViewportSize({ width: cols * 216 + (cols + 1) * 20, height: 400 });
await page.setContent(`<style>body{margin:0;padding:20px;background:#0c0a1d;font-family:sans-serif;color:#fec84b}
  h1{margin:4px 0 18px;font-size:26px;letter-spacing:.1em;text-transform:uppercase}
  .g{display:grid;grid-template-columns:repeat(${cols},216px);gap:20px}figure{margin:0}
  img{width:216px;height:384px;border-radius:12px;display:block}figcaption{color:#fff;font-size:17px;margin-top:6px;text-align:center}</style>
  <h1>Principe AI · HeyGen avatar cards (${files.length})</h1><div class="g">${files
    .map((f) => `<figure><img src="${pathToFileURL(join(cardsDir, f)).href}"><figcaption>${f}</figcaption></figure>`)
    .join("")}</div>`);
await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
await page.screenshot({ path: join(root, "cards-overview.png"), fullPage: true });

await browser.close();
console.log(`Wrote ${written.length} cards, cards-overview.png and overlays/ai-avatar-label.png`);
