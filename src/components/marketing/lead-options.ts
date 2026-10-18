/**
 * Option lists + shared form types for the marketing lead forms (opt-in, consulting application, contact).
 * Pure module — safe to import from client components, server actions and tests.
 */

export type LeadFormState<F extends string = string> = {
  /** True once the submission was accepted (forms that stay on the page show a success state). */
  ok?: boolean;
  /** Form-level error (rate limit, unexpected failure). */
  error?: string;
  fieldErrors?: Partial<Record<F, string>>;
  /** Echo of the submitted values so the form can be re-filled after a validation error. */
  values?: Partial<Record<F, string>>;
  /** First name, for a friendly success message. */
  firstName?: string;
};

type Option<V extends string> = { value: V; label: string; hint?: string };

export const INTEREST_OPTIONS = [
  { value: "life", label: "My life", hint: "Everyday tasks, learning, planning" },
  { value: "business", label: "My business", hint: "Marketing, sales, operations, team" },
  { value: "both", label: "Both", hint: "A bit of everything" },
] as const satisfies readonly Option<string>[];
export type Interest = (typeof INTEREST_OPTIONS)[number]["value"];

export const TEAM_SIZE_OPTIONS = [
  { value: "solo", label: "Just me" },
  { value: "2-10", label: "2–10 people" },
  { value: "11-50", label: "11–50 people" },
  { value: "51-200", label: "51–200 people" },
  { value: "200-plus", label: "More than 200 people" },
] as const satisfies readonly Option<string>[];
export type TeamSize = (typeof TEAM_SIZE_OPTIONS)[number]["value"];

export const BUDGET_OPTIONS = [
  { value: "under-2k", label: "Under $2,000" },
  { value: "2k-5k", label: "$2,000 – $5,000" },
  { value: "5k-15k", label: "$5,000 – $15,000" },
  { value: "15k-plus", label: "$15,000 or more" },
  { value: "unsure", label: "Not sure yet" },
] as const satisfies readonly Option<string>[];
export type Budget = (typeof BUDGET_OPTIONS)[number]["value"];

export const TIMELINE_OPTIONS = [
  { value: "asap", label: "As soon as possible" },
  { value: "1-3-months", label: "In the next 1–3 months" },
  { value: "3-6-months", label: "In 3–6 months" },
  { value: "exploring", label: "Just exploring for now" },
] as const satisfies readonly Option<string>[];
export type Timeline = (typeof TIMELINE_OPTIONS)[number]["value"];

export const CONTACT_TOPIC_OPTIONS = [
  { value: "general", label: "A general question" },
  { value: "courses", label: "Courses & enrollment" },
  { value: "coaching", label: "1:1 AI coaching" },
  { value: "implementation", label: "AI implementation for my business" },
  { value: "workshop", label: "Team training or a workshop" },
  { value: "other", label: "Something else" },
] as const satisfies readonly Option<string>[];
export type ContactTopic = (typeof CONTACT_TOPIC_OPTIONS)[number]["value"];

/** Where an opt-in form lives — decides the funnel path recorded and where the visitor goes next. */
export const OPT_IN_PLACEMENTS = ["free-guide", "guide", "home"] as const;
export type OptInPlacement = (typeof OPT_IN_PLACEMENTS)[number];

export function optionValues<const T extends readonly { value: string }[]>(options: T): [T[number]["value"], ...T[number]["value"][]] {
  return options.map((o) => o.value) as [T[number]["value"], ...T[number]["value"][]];
}

/** Human label for an option value (falls back to the raw value). */
export function optionLabel(options: readonly { value: string; label: string }[], value: string | null | undefined): string {
  if (!value) return "";
  return options.find((o) => o.value === value)?.label ?? value;
}
