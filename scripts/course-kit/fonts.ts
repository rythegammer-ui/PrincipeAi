/**
 * The site's brand fonts (Geist, Geist Mono, Instrument Serif; SIL Open Font License, see fonts/OFL-*.txt), embedded
 * as data URIs so the offline app and the PDFs look the same on every machine without a network connection.
 */
import fs from "node:fs";
import path from "node:path";

const FONTS: { family: string; file: string; style: string; weight: string }[] = [
  { family: "Geist", file: "geist-latin.woff2", style: "normal", weight: "100 900" },
  { family: "Geist Mono", file: "geist-mono-latin.woff2", style: "normal", weight: "100 900" },
  { family: "Instrument Serif", file: "instrument-serif-latin.woff2", style: "normal", weight: "400" },
  { family: "Instrument Serif", file: "instrument-serif-italic-latin.woff2", style: "italic", weight: "400" },
];

let cached: string | null = null;

export function fontFaceCss(): string {
  cached ??= FONTS.map((f) => {
    const data = fs.readFileSync(path.join(__dirname, "fonts", f.file)).toString("base64");
    return `@font-face{font-family:"${f.family}";font-style:${f.style};font-weight:${f.weight};font-display:swap;src:url(data:font/woff2;base64,${data}) format("woff2")}`;
  }).join("\n");
  return cached;
}
