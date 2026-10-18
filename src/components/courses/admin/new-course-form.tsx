"use client";

import { ArrowRight } from "lucide-react";
import { useActionState } from "react";
import { createCourseAction, type FormState } from "@/app/admin/(panel)/courses/actions";
import { Field, Input, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function NewCourseForm() {
  const [state, action] = useActionState<FormState, FormData>(createCourseAction, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <Field label="Course title" htmlFor="title" error={fe.title} required hint="You can change everything later.">
        <Input id="title" name="title" placeholder="e.g. AI for Real Estate Agents" maxLength={160} autoFocus aria-invalid={fe.title ? true : undefined} />
      </Field>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Price (USD)" htmlFor="price" error={fe.price} required>
          <Input id="price" name="price" inputMode="decimal" placeholder="97" aria-invalid={fe.price ? true : undefined} />
        </Field>
        <Field label="Audience" htmlFor="audience" error={fe.audience}>
          <Select id="audience" name="audience" defaultValue="both">
            <option value="life">Everyday life</option>
            <option value="business">Business</option>
            <option value="both">Life & business</option>
          </Select>
        </Field>
      </div>
      <p className="text-xs text-zinc-500">New courses start as drafts, so nobody sees them until you publish.</p>
      <div>
        <SubmitButton pendingText="Creating…">
          Create draft course <ArrowRight aria-hidden />
        </SubmitButton>
      </div>
    </form>
  );
}
