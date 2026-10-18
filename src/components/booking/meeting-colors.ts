/** Accent styles for meeting types (stored as a color name). Literal class names so Tailwind picks them up. */
export const MEETING_COLORS = {
  violet: { label: "Violet", dot: "bg-brand-500", bar: "from-brand-500 to-brand-700", soft: "bg-brand-50 text-brand-700 ring-brand-200", border: "border-l-brand-500" },
  amber: { label: "Gold", dot: "bg-gold-400", bar: "from-gold-300 to-gold-500", soft: "bg-gold-50 text-gold-700 ring-gold-200", border: "border-l-gold-400" },
  emerald: { label: "Emerald", dot: "bg-emerald-500", bar: "from-emerald-400 to-emerald-600", soft: "bg-emerald-50 text-emerald-700 ring-emerald-200", border: "border-l-emerald-500" },
  sky: { label: "Sky", dot: "bg-sky-500", bar: "from-sky-400 to-sky-600", soft: "bg-sky-50 text-sky-700 ring-sky-200", border: "border-l-sky-500" },
  rose: { label: "Rose", dot: "bg-rose-500", bar: "from-rose-400 to-rose-600", soft: "bg-rose-50 text-rose-700 ring-rose-200", border: "border-l-rose-500" },
  zinc: { label: "Graphite", dot: "bg-zinc-600", bar: "from-zinc-500 to-zinc-700", soft: "bg-zinc-100 text-zinc-700 ring-zinc-200", border: "border-l-zinc-600" },
} as const;

export type MeetingColor = keyof typeof MEETING_COLORS;

export const MEETING_COLOR_NAMES = Object.keys(MEETING_COLORS) as MeetingColor[];

export function meetingColor(name: string | null | undefined) {
  return MEETING_COLORS[(name ?? "violet") as MeetingColor] ?? MEETING_COLORS.violet;
}
