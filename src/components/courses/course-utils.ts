/** Pure display helpers for courses (safe in server and client components). */

export type Audience = "life" | "business" | "both";

export const AUDIENCE_LABELS: Record<Audience, string> = {
  life: "For everyday life",
  business: "For business",
  both: "For life & business",
};

export const AUDIENCE_SHORT: Record<Audience, string> = {
  life: "Life",
  business: "Business",
  both: "Life & business",
};

export const LEVELS = ["Beginner", "Intermediate", "Advanced", "All levels"] as const;

export function asAudience(value: string | null | undefined): Audience {
  return value === "life" || value === "business" ? value : "both";
}

/** 95 → "1h 35m", 40 → "40 min", 120 → "2h". */
export function formatDuration(totalMinutes: number): string {
  const m = Math.max(0, Math.round(totalMinutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h}h ${rest}m` : `${h}h`;
}

/** Whole-percent saving vs. the compare-at price, or null when there's no real discount. */
export function savingsPercent(priceCents: number, compareAtCents: number | null | undefined): number | null {
  if (!compareAtCents || compareAtCents <= priceCents || priceCents < 0) return null;
  return Math.round(((compareAtCents - priceCents) / compareAtCents) * 100);
}

/** Brand gradient used as course cover art, varied by audience so the catalog doesn't look uniform. */
export function coverGradient(audience: string): string {
  switch (asAudience(audience)) {
    case "life":
      return "from-brand-500 via-brand-600 to-gold-400";
    case "business":
      return "from-ink via-brand-900 to-brand-600";
    default:
      return "from-brand-700 via-brand-600 to-brand-400";
  }
}

/** Plain-English "who it's for" bullets, based on the course audience. */
export function whoItsFor(audience: string): { title: string; body: string }[] {
  const life = [
    { title: "Curious beginners", body: "You've heard about AI everywhere and want a calm, practical way in — no jargon, no coding." },
    { title: "Busy professionals", body: "You want to write, research, plan and decide faster, and win back hours every week." },
    { title: "Parents, students & lifelong learners", body: "You want AI to help with everyday life — planning, learning, health, money and home." },
  ];
  const business = [
    { title: "Business owners & founders", body: "You want AI to save real time and money across marketing, sales, operations and support." },
    { title: "Operators & team leads", body: "You need a clear, safe way to roll AI out to your team with SOPs and guardrails." },
    { title: "Consultants & freelancers", body: "You want to deliver more for clients with the same hours — and know which tools are worth it." },
  ];
  switch (asAudience(audience)) {
    case "life":
      return life;
    case "business":
      return business;
    default:
      return [life[0], life[1], business[0]];
  }
}
