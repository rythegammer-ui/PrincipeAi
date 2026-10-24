// Writes ../scripts.md (all 30 videos, scene by scene, ready to paste into HeyGen) from videos.json and the
// cards-manifest.json that render-cards.mjs writes. Run render-cards.mjs first, then:
//   node deliverables/social-launch/ai-avatar/source/build-scripts.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const { videos, layouts } = JSON.parse(readFileSync(join(here, "videos.json"), "utf8"));
const manifest = JSON.parse(readFileSync(join(here, "cards-manifest.json"), "utf8"));

const code = (s) => `\`\`\`text\n${s}\n\`\`\``;
const card = (f) => `[cards/${f}](cards/${f})`;
const heading = (v) => `${v.id} · ${v.title} (about ${v.est_seconds} s)`;
// GitHub's heading anchors: lower case, punctuation dropped, each space a hyphen.
const anchor = (v) => heading(v).toLowerCase().replace(/[^a-z0-9 _-]/g, "").replace(/ /g, "-");

// Splits a scene's spoken text in two for a prompt split over two cards: before the word that opens card b
// if the avatar says it, else at the sentence end (or, for one sentence, the comma) nearest `ratio` of the way in.
function splitSpoken(text, ratio, partB) {
  const first = (partB.match(/[A-Za-z]+/) || [""])[0].toLowerCase();
  const word = first.length > 3 ? text.toLowerCase().search(new RegExp(`\\b${first}\\b`)) : -1;
  if (word > 0) return [text.slice(0, word).trim(), text.slice(word).trim()];
  const cuts = (re) => [...text.matchAll(re)].map((m) => m.index + m[0].length).filter((i) => i < text.length);
  let points = cuts(/[.?!]["')]* (?=\S)/g);
  if (!points.length) points = cuts(/, (?=\S)/g);
  const at = points.reduce((best, p) => (Math.abs(p / text.length - ratio) < Math.abs(best / text.length - ratio) ? p : best));
  return [text.slice(0, at).trim(), text.slice(at).trim()];
}

// The cut that runs on TikTok until the bio link is live (kit 1.7): the last sentence that sends people to
// the profile is swapped for the TikTok ending.
function tiktokLast(video) {
  const last = video.scenes[video.scenes.length - 1].spoken;
  const sentences = last.match(/[^.?!]+[.?!]+["')]*\s*/g) || [last];
  const i = sentences.map((s) => /profile/.test(s)).lastIndexOf(true);
  if (i === -1) throw new Error(`${video.id}: no profile CTA in the last scene`);
  sentences[i] = `${video.tiktok_ending}${sentences[i].match(/\s*$/)[0]}`;
  return sentences.join("").trim();
}

const needs = (item) =>
  item.startsWith("AI label:")
    ? "AI label ON on every platform for this avatar video. The kit's section 2.6 \"off / No\" was written for real footage and doesn't apply here ([README, section 4](README.md#4-label-every-video))."
    : item;

const out = [];
out.push(`# HeyGen scripts: all 30 videos, scene by scene

> **What this is:** every short video from the [short-video kit](../03-short-video-kit.md), cut into HeyGen scenes. One numbered scene here = one scene in HeyGen. The avatar's lines are word for word from the kit.
>
> **How to use it:** follow [the production guide](README.md), section 3. For each scene, copy the grey box into that HeyGen scene's script, set the layout, and add the on-screen text or the card image. Then do the **Needs you** list before you click Generate.
>
> **Rules for the grey boxes:** paste them exactly. Only change a box where **Needs you** says so (\`[YOUR NAME]\`-style placeholders and CONFIRM choices). The avatar reads everything in the box aloud, including brackets.

Back to the [production guide](README.md). Captions, hashtags and links for each video are still in the [kit](../03-short-video-kit.md).

**Layouts**

| Layout | What it looks like | In HeyGen |
|---|---|---|
| Avatar | You, full screen, talking | Avatar layout full screen; nothing else |
| Avatar + text | You, full screen, with the on-screen text | Add the text with the Text tool (see README, 3.4) |
| Prompt card | The prompt full screen while your voice keeps going | Upload the card image; see README, 3.5 |
| Text card | Key words full screen while your voice keeps going | Same as a prompt card |
| Screen recording (yours) | Your real phone recording of the AI or the site | Upload your clip; use it like a card. No clip? Leave the avatar full screen |

When a card has an on-screen text line, it's already printed on the card. When a prompt is split over two cards (-a and -b), make two HeyGen scenes, as shown.

**Videos**

${videos.map((v) => `- [${v.id} · ${v.title}](#${anchor(v)}) · about ${v.est_seconds} s`).join("\n")}

---
`);

for (const v of videos) {
  out.push(`## ${heading(v)}\n`);
  for (const s of v.scenes) {
    const layout = layouts[s.layout];
    const m = manifest[`${v.id}-${s.n}`];
    const onCard = s.on_screen_text ? "on the card" : "";
    if (s.layout === "prompt_card" || s.layout === "text_card") {
      if (!m) throw new Error(`${v.id}-${s.n}: no card in the manifest`);
      if (m.files.length === 2) {
        const total = m.parts.reduce((a, p) => a + p.length, 0);
        const [a, b] = splitSpoken(s.spoken, m.parts[0].length / total, m.parts[1]);
        out.push(`**Scene ${s.n} · ${layout}, over two cards** · make it two HeyGen scenes, one per card (the voice runs on across them)${s.on_screen_text ? " · on-screen text: on the cards" : ""}\n`);
        out.push(`Scene ${s.n}a · card ${card(m.files[0])}\n\n${code(a)}\n`);
        out.push(`Scene ${s.n}b · card ${card(m.files[1])}\n\n${code(b)}\n`);
        continue;
      }
      out.push(`**Scene ${s.n} · ${layout}** · card ${card(m.files[0])}${onCard ? ` · on-screen text: ${onCard}` : ""}${s.confirm ? ` · **CONFIRM: ${s.confirm}**` : ""}\n`);
    } else if (s.layout === "screen_recording") {
      out.push(`**Scene ${s.n} · ${layout}** · show: ${s.visual}\n`);
    } else {
      out.push(`**Scene ${s.n} · ${layout}**${s.on_screen_text ? ` · on-screen text: "${s.on_screen_text}"` : ""}\n`);
    }
    if (s.confirm) {
      out.push(`Version A, only if the ${s.confirm.replace(/^AI key/, "AI key is")}:\n\n${code(s.spoken)}\n`);
      out.push(`Version B, if it isn't:\n\n${code(s.alt_spoken)}\n`);
    } else {
      out.push(`${code(s.spoken)}\n`);
    }
  }
  out.push(`**TikTok cut** (only while your TikTok bio link isn't live; kit 1.7). Duplicate the project and replace the last scene's box with:\n\n${code(tiktokLast(v))}\n`);
  // LD-01's alternative line is already shown in its scene as version B.
  if (v.alternates && !v.scenes.some((s) => s.alt_spoken)) out.push(`**Alternates:** ${v.alternates}\n`);
  out.push(`**Needs you**\n\n${v.needs_owner.map((x) => `- [ ] ${needs(x)}`).join("\n")}\n\n---\n`);
}
out.push(`What changed from the converted scripts, and why: [CHANGELOG.md](CHANGELOG.md).\n`);
writeFileSync(join(here, "..", "scripts.md"), out.join("\n"));
console.log("Wrote scripts.md");
