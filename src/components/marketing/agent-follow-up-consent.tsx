import type { ChangeEvent } from "react";
import { Checkbox } from "@/components/ui/form";

/** The sales agent whose link the visitor followed (lib/sales/referrals.ts referringAgent). */
export type ReferringAgent = { code: string; firstName: string };

/**
 * Optional "OK for <agent> to follow up with me" box on lead forms, shown only to visitors who came through a sales
 * agent's link. Unticked by default. Ticking it lets that agent see the person's name and email in their portal
 * (Leads → Warm leads); the hidden code makes sure consent only counts for the agent named here.
 */
export function AgentFollowUpConsent({
  agent,
  id,
  defaultChecked,
  checked,
  onCheckedChange,
}: {
  agent: ReferringAgent | null | undefined;
  id: string;
  /** Uncontrolled forms: ticked again after a submission that came back with an error. */
  defaultChecked?: boolean;
  /** Controlled forms (the assessment keeps its fields in state). */
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  if (!agent) return null;
  const control = checked === undefined ? { defaultChecked } : { checked, onChange: (e: ChangeEvent<HTMLInputElement>) => onCheckedChange?.(e.target.checked) };
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-2.5">
      <input type="hidden" name="agentFollowUpCode" value={agent.code} />
      <Checkbox id={id} name="agentFollowUp" className="mt-0.5 size-5 shrink-0 sm:size-4" {...control} />
      <label htmlFor={id} className="text-xs leading-relaxed text-zinc-600">
        Optional: it&apos;s OK for <strong className="font-semibold text-zinc-800">{agent.firstName}</strong>, the independent sales agent who
        shared this link, to see my name and email and follow up with me personally.
      </label>
    </div>
  );
}
