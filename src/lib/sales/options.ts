/**
 * Option lists for the sales-team application and agent profile. Pure module: safe in client components,
 * server actions and tests.
 */

export const US_STATES = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"], ["CO", "Colorado"],
  ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"], ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"],
  ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"],
  ["ME", "Maine"], ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"],
  ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"],
  ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"],
  ["OR", "Oregon"], ["PA", "Pennsylvania"], ["PR", "Puerto Rico"], ["RI", "Rhode Island"], ["SC", "South Carolina"],
  ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"],
  ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
] as const satisfies readonly (readonly [string, string])[];

export type UsState = (typeof US_STATES)[number][0];
export const US_STATE_CODES = US_STATES.map(([code]) => code) as readonly string[];

export function stateName(code: string | null | undefined): string | null {
  return US_STATES.find(([c]) => c === code)?.[1] ?? null;
}

export const EXPERIENCE_OPTIONS = [
  { value: "none", label: "New to sales" },
  { value: "some", label: "Some sales or customer-facing experience" },
  { value: "pro", label: "Experienced salesperson" },
] as const;

export const HOURS_OPTIONS = [
  { value: "under-5", label: "Under 5 hours a week" },
  { value: "5-10", label: "5–10 hours a week" },
  { value: "10-20", label: "10–20 hours a week" },
  { value: "20-plus", label: "20+ hours a week" },
] as const;

export const PAYOUT_METHODS = [
  { value: "paypal", label: "PayPal" },
  { value: "venmo", label: "Venmo" },
  { value: "zelle", label: "Zelle" },
  { value: "cashapp", label: "Cash App" },
  { value: "bank", label: "Bank transfer" },
] as const;
export type PayoutMethod = (typeof PAYOUT_METHODS)[number]["value"];

export function optionLabel(options: readonly { value: string; label: string }[], value: string | null | undefined): string {
  return options.find((o) => o.value === value)?.label ?? value ?? "";
}
