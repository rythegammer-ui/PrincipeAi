"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import { createContactAction, updateContactProfileAction, type FormState } from "@/app/admin/(panel)/contacts/actions";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { SEGMENTS, SEGMENT_LABELS, STAGE_META, STAGE_ORDER } from "./crm-utils";

type ProfileDefaults = { name?: string | null; email?: string; phone?: string | null; company?: string | null; website?: string | null; segment?: string | null };

function ProfileFields({ defaults, state, prefix }: { defaults: ProfileDefaults; state: FormState; prefix: string }) {
  const v = state.values;
  const fe = state.fieldErrors ?? {};
  const val = (key: keyof ProfileDefaults) => (v ? v[key] : (defaults[key] ?? "")) ?? "";
  const id = (name: string) => `${prefix}-${name}`;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor={id("name")} error={fe.name}>
          <Input id={id("name")} name="name" autoComplete="off" maxLength={120} defaultValue={val("name")} aria-invalid={Boolean(fe.name)} />
        </Field>
        <Field label="Email" htmlFor={id("email")} required error={fe.email}>
          <Input id={id("email")} name="email" type="email" autoComplete="off" required maxLength={254} defaultValue={val("email")} aria-invalid={Boolean(fe.email)} />
        </Field>
        <Field label="Phone" htmlFor={id("phone")} error={fe.phone}>
          <Input id={id("phone")} name="phone" type="tel" autoComplete="off" maxLength={40} defaultValue={val("phone")} aria-invalid={Boolean(fe.phone)} />
        </Field>
        <Field label="Company" htmlFor={id("company")} error={fe.company}>
          <Input id={id("company")} name="company" autoComplete="off" maxLength={120} defaultValue={val("company")} aria-invalid={Boolean(fe.company)} />
        </Field>
        <Field label="Website" htmlFor={id("website")} error={fe.website}>
          <Input id={id("website")} name="website" inputMode="url" autoComplete="off" maxLength={200} placeholder="example.com" defaultValue={val("website")} aria-invalid={Boolean(fe.website)} />
        </Field>
        <Field label="Interested in AI for" htmlFor={id("segment")} error={fe.segment}>
          <Select id={id("segment")} name="segment" defaultValue={val("segment")}>
            <option value="">Not sure yet</option>
            {SEGMENTS.map((s) => (
              <option key={s} value={s}>
                {SEGMENT_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </>
  );
}

export function NewContactForm() {
  const [state, action] = useActionState<FormState, FormData>(createContactAction, {});
  const prefix = useId();
  const v = state.values;
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state.error && (
        <Alert tone="error">
          {state.error}{" "}
          {state.message && fe.email && (
            <Link href={`/admin/contacts/${state.message}`} className="font-medium underline">
              Open the existing contact
            </Link>
          )}
        </Alert>
      )}
      <ProfileFields defaults={{}} state={state} prefix={prefix} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Pipeline stage" htmlFor={`${prefix}-stage`} error={fe.stage}>
          <Select id={`${prefix}-stage`} name="stage" defaultValue={v?.stage ?? "new"}>
            {STAGE_ORDER.map((s) => (
              <option key={s} value={s}>
                {STAGE_META[s].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Estimated deal value (USD)" htmlFor={`${prefix}-deal`} hint="Optional — used for pipeline totals." error={fe.dealValue}>
          <Input id={`${prefix}-deal`} name="dealValue" inputMode="decimal" placeholder="0" defaultValue={v?.dealValue ?? ""} aria-invalid={Boolean(fe.dealValue)} />
        </Field>
      </div>
      <Field label="Tags" htmlFor={`${prefix}-tags`} hint="Comma-separated, e.g. referral, workshop" error={fe.tags}>
        <Input id={`${prefix}-tags`} name="tags" maxLength={400} defaultValue={v?.tags ?? ""} aria-invalid={Boolean(fe.tags)} />
      </Field>
      <Field label="First note" htmlFor={`${prefix}-note`} hint="Optional — how you met, what they need." error={fe.note}>
        <Textarea id={`${prefix}-note`} name="note" rows={3} maxLength={5000} defaultValue={v?.note ?? ""} />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pendingText="Saving…">Create contact</SubmitButton>
        <Link href="/admin/contacts" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          Cancel
        </Link>
      </div>
    </form>
  );
}

export function ContactProfileForm({ contactId, defaults }: { contactId: string; defaults: ProfileDefaults }) {
  const [state, action] = useActionState<FormState, FormData>(updateContactProfileAction, {});
  const prefix = useId();
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="id" value={contactId} />
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}
      <ProfileFields defaults={defaults} state={state.ok ? {} : state} prefix={prefix} />
      <div>
        <SubmitButton size="sm" pendingText="Saving…">
          Save profile
        </SubmitButton>
      </div>
    </form>
  );
}
