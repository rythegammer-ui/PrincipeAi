import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { ProspectStatus } from "@/db/schema";

const STATUS: Record<ProspectStatus, { label: string; tone: BadgeTone }> = {
  new: { label: "New", tone: "neutral" },
  contacted: { label: "Contacted", tone: "blue" },
  replied: { label: "Replied", tone: "brand" },
  not_interested: { label: "Not interested", tone: "amber" },
  do_not_contact: { label: "Do not contact", tone: "red" },
};

/** The prospect's status, plus what the business did through the agent's link. */
export function ProspectBadges({ p }: { p: { status: ProspectStatus; signedUp: boolean; tookAssessment: boolean; customer: boolean } }) {
  const s = STATUS[p.status];
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <Badge tone={s.tone}>{s.label}</Badge>
      {p.customer ? <Badge tone="green">Customer</Badge> : p.tookAssessment ? <Badge tone="gold">Took the assessment</Badge> : p.signedUp ? <Badge tone="green">Signed up</Badge> : null}
    </span>
  );
}

export const SOURCE_LABELS: Record<string, string> = {
  lead_magnet: "AI Starter Kit",
  assessment: "AI Readiness Assessment",
  contact_form: "Contact form",
};
