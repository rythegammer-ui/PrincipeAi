import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../db/schema";

/**
 * How the Leads tab recognizes the same business written two ways (lib/sales/prospects.ts sameBusiness), stored on
 * agent_prospects.name_key / area_key. No "server-only": scripts/migrate.ts re-keys existing rows with it on deploy, so
 * stored keys always match what the app computes.
 */

const SUFFIXES = new Set(["llc", "inc", "co", "corp", "corporation", "ltd", "limited", "pllc", "pc", "company", "incorporated"]);

/** Folds a business name for matching: "The Joe's Café, LLC" → "joescafe". */
export function matchKey(value: string | null | undefined): string {
  const words = (value ?? "")
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
  if (words[0] === "the" && words.length > 1) words.shift();
  while (words.length > 1 && SUFFIXES.has(words[words.length - 1])) words.pop();
  return words.join("");
}

const STATE_CODES = new Set(
  "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY PR".split(" "),
);
const STATE_NAMES = new Set(
  [
    "alabama", "alaska", "arizona", "arkansas", "california", "colorado", "connecticut", "delaware", "florida", "georgia", "hawaii",
    "idaho", "illinois", "indiana", "iowa", "kansas", "kentucky", "louisiana", "maine", "maryland", "massachusetts", "michigan",
    "minnesota", "mississippi", "missouri", "montana", "nebraska", "nevada", "new hampshire", "new jersey", "new mexico", "new york",
    "north carolina", "north dakota", "ohio", "oklahoma", "oregon", "pennsylvania", "rhode island", "south carolina", "south dakota",
    "tennessee", "texas", "utah", "vermont", "virginia", "washington", "west virginia", "wisconsin", "wyoming", "puerto rico",
  ],
);

/**
 * The town part of an area, folded: "Tampa, FL", "Tampa FL 33602" and "tampa florida" → "tampa". A state is only
 * dropped after a town, so "New York, NY" → "newyork" and "Washington, DC" → "washington". "" when there's no town
 * (just a ZIP or a state), which matches any area.
 */
export function areaKeyOf(area: string | null | undefined): string {
  const words = (area ?? "").split(",")[0].trim().split(/\s+/).filter(Boolean);
  for (;;) {
    const last = words[words.length - 1];
    if (!last) break;
    const twoLast = words.slice(-2).join(" ").toLowerCase();
    if (/^\d{5}(-\d{4})?$/.test(last)) words.pop();
    else if (words.length > 2 && STATE_NAMES.has(twoLast)) words.splice(-2);
    // A two-letter state code is never a town, even alone ("TX"); a state name alone may be one ("Indiana, PA").
    else if (last.length === 2 && STATE_CODES.has(last.toUpperCase())) words.pop();
    else if (words.length > 1 && STATE_NAMES.has(last.toLowerCase())) words.pop();
    else break;
  }
  return matchKey(words.join(" "));
}

/** Brings stored keys in line with matchKey/areaKeyOf (rows from before the keys existed or changed). Returns how many changed. */
export async function rekeyProspects(db: PostgresJsDatabase<typeof schema>): Promise<number> {
  const p = schema.agentProspects;
  const rows = await db.select({ id: p.id, name: p.name, area: p.area, nameKey: p.nameKey, areaKey: p.areaKey }).from(p);
  let changed = 0;
  for (const r of rows) {
    const nameKey = matchKey(r.name);
    const areaKey = areaKeyOf(r.area);
    if (nameKey === r.nameKey && areaKey === r.areaKey) continue;
    await db.update(p).set({ nameKey, areaKey }).where(eq(p.id, r.id));
    changed++;
  }
  return changed;
}
