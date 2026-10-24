"use client";

import { Plus } from "lucide-react";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { addManualProspectAction, type ManualAddState } from "./actions";

/** A business the agent found themselves (in person, on Google Maps, through a friend). */
export function AddProspectForm({ defaultArea }: { defaultArea: string }) {
  const [state, action] = useActionState<ManualAddState, FormData>(addManualProspectAction, {});
  const v = state.values ?? {};
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {state.error && (
        <Alert tone="error" className="sm:col-span-2">
          {state.error}
        </Alert>
      )}
      <Field label="Business name" htmlFor="add-name" required className="sm:col-span-2">
        <Input id="add-name" name="name" required minLength={2} maxLength={200} defaultValue={v.name ?? ""} />
      </Field>
      <Field label="Kind of business" htmlFor="add-category" hint="e.g. dental practice">
        <Input id="add-category" name="category" maxLength={100} defaultValue={v.category ?? ""} />
      </Field>
      <Field label="Where" htmlFor="add-area" hint="City and state">
        <Input id="add-area" name="area" maxLength={120} defaultValue={v.area ?? defaultArea} />
      </Field>
      <Field label="Website" htmlFor="add-website" hint="Optional, e.g. example.com">
        <Input id="add-website" name="website" inputMode="url" maxLength={300} defaultValue={v.website ?? ""} />
      </Field>
      <Field label="Business phone" htmlFor="add-phone" hint="Optional">
        <Input id="add-phone" name="phone" type="tel" maxLength={40} defaultValue={v.phone ?? ""} />
      </Field>
      <Field label="Business email" htmlFor="add-email" hint="Optional: a public business address, or one they gave you" className="sm:col-span-2">
        <Input id="add-email" name="email" type="email" maxLength={254} defaultValue={v.email ?? ""} />
      </Field>
      <Field label="Notes" htmlFor="add-notes" hint="Anything useful for your first message: who you met, what they mentioned" className="sm:col-span-2">
        <Textarea id="add-notes" name="notes" rows={3} maxLength={2000} defaultValue={v.notes ?? ""} />
      </Field>
      <div className="sm:col-span-2">
        <SubmitButton pendingText="Adding…">
          <Plus aria-hidden /> Add business
        </SubmitButton>
      </div>
    </form>
  );
}
