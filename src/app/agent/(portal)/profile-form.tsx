"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { PAYOUT_METHODS } from "@/lib/sales/options";
import { updateAgentProfileAction, type AgentProfileState } from "../actions";

/** The agent's payout details, phone and leaderboard choice. */
export function AgentProfileForm({
  payoutMethod,
  payoutHandle,
  phone,
  showOnLeaderboard,
}: {
  payoutMethod: string | null;
  payoutHandle: string | null;
  phone: string | null;
  showOnLeaderboard: boolean;
}) {
  const [state, action] = useActionState<AgentProfileState, FormData>(updateAgentProfileAction, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && (
        <Alert tone="success" role="status">
          Saved.
        </Alert>
      )}
      <Field label="Pay me by" htmlFor="ap-method">
        <Select id="ap-method" name="payoutMethod" defaultValue={payoutMethod ?? ""}>
          <option value="">Choose a method…</option>
          {PAYOUT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Account, handle or email" htmlFor="ap-handle" hint="E.g. @jane-doe on Venmo, or the email on your PayPal account.">
        <Input id="ap-handle" name="payoutHandle" maxLength={120} autoComplete="off" defaultValue={payoutHandle ?? ""} />
      </Field>
      <Field label="Phone" htmlFor="ap-phone">
        <Input id="ap-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={40} defaultValue={phone ?? ""} />
      </Field>
      <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-relaxed text-zinc-700">
        <Checkbox name="showOnLeaderboard" defaultChecked={showOnLeaderboard} className="mt-1" />
        <span>Show me on the team leaderboard and wins feed (as first name, last initial and state)</span>
      </label>
      <SubmitButton className="w-full sm:w-auto sm:self-start" pendingText="Saving…">
        Save profile
      </SubmitButton>
    </form>
  );
}
