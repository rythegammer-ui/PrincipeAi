"use client";

import { Save } from "lucide-react";
import { useActionState, useState } from "react";
import { createSequenceAction, updateSequenceAction, type FormState } from "@/app/admin/(panel)/sequences/actions";
import { TRIGGERS, TRIGGER_META } from "@/components/funnels/automation-utils";
import { Alert } from "@/components/ui/alert";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import type { SequenceTrigger } from "@/db/schema";

type SequenceValues = { id?: string; name: string; description: string; trigger: SequenceTrigger; active: boolean };

/** Create / edit an automation's name, description, trigger and on/off state. */
export function SequenceForm({ sequence, mode }: { sequence: SequenceValues; mode: "create" | "edit" }) {
  const [state, action] = useActionState<FormState, FormData>(mode === "create" ? createSequenceAction : updateSequenceAction, {});
  const v = state.values;
  const fe = state.fieldErrors ?? {};
  const [trigger, setTrigger] = useState<string>(v?.trigger ?? sequence.trigger);
  const hint = TRIGGER_META[trigger as SequenceTrigger]?.description;
  const idp = mode === "create" ? "new-seq" : "seq";

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {sequence.id && <input type="hidden" name="id" value={sequence.id} />}
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}
      <Field label="Name" htmlFor={`${idp}-name`} error={fe.name} required>
        <Input
          id={`${idp}-name`}
          name="name"
          defaultValue={v?.name ?? sequence.name}
          maxLength={120}
          required
          placeholder="e.g. Webinar follow-up"
          aria-invalid={Boolean(fe.name)}
        />
      </Field>
      <Field label="Description" htmlFor={`${idp}-description`} error={fe.description} hint="For you and your team. Contacts never see this.">
        <Textarea
          id={`${idp}-description`}
          name="description"
          defaultValue={v?.description ?? sequence.description}
          maxLength={500}
          rows={2}
          className="min-h-16"
          aria-invalid={Boolean(fe.description)}
        />
      </Field>
      <Field label="Starts when someone…" htmlFor={`${idp}-trigger`} error={fe.trigger} hint={hint} required>
        <Select id={`${idp}-trigger`} name="trigger" value={trigger} onChange={(e) => setTrigger(e.target.value)} aria-invalid={Boolean(fe.trigger)}>
          {TRIGGERS.map((t) => (
            <option key={t} value={t}>
              {TRIGGER_META[t].label}
            </option>
          ))}
        </Select>
      </Field>
      <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3">
        <Checkbox name="active" defaultChecked={v ? v.active === "on" : sequence.active} className="mt-0.5" />
        <span className="text-sm">
          <span className="font-medium text-zinc-900">Automation is on</span>
          <span className="block text-zinc-500">When it&apos;s off, nobody new joins and anyone in progress stops at their next email.</span>
        </span>
      </label>
      <div>
        <SubmitButton pendingText={mode === "create" ? "Creating…" : "Saving…"}>
          <Save aria-hidden /> {mode === "create" ? "Create automation" : "Save changes"}
        </SubmitButton>
      </div>
    </form>
  );
}
