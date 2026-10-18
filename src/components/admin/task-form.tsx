"use client";

import { Plus } from "lucide-react";
import { useActionState, useId } from "react";
import { createTaskAction, type TaskFormState } from "@/app/admin/(panel)/tasks/actions";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

export type ContactOption = { id: string; name: string | null; email: string };

/**
 * Create-task form. Pass `contact` to pin the task to one contact (contact page); otherwise the
 * admin picks a contact by typing a name or email (native datalist suggestions).
 */
export function TaskForm({
  contacts = [],
  contact,
  tz,
  compact = false,
  className,
}: {
  contacts?: ContactOption[];
  contact?: { id: string; label: string };
  tz: string;
  compact?: boolean;
  className?: string;
}) {
  const [state, action] = useActionState<TaskFormState, FormData>(createTaskAction, {});
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const v = state.values ?? {};
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className={cn("flex flex-col gap-4", className)} noValidate>
      {contact && <input type="hidden" name="contactId" value={contact.id} />}
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}
      <Field label="Task" htmlFor={id("title")} required error={fe.title}>
        <Input
          id={id("title")}
          name="title"
          required
          maxLength={200}
          placeholder={contact ? "e.g. Send the implementation proposal" : "e.g. Follow up on the strategy call"}
          defaultValue={state.ok ? "" : v.title}
          aria-invalid={Boolean(fe.title)}
        />
      </Field>
      {!compact && (
        <Field label="Details" htmlFor={id("description")} error={fe.description}>
          <Textarea id={id("description")} name="description" rows={2} maxLength={2000} className="min-h-16" defaultValue={state.ok ? "" : v.description} />
        </Field>
      )}
      {!contact && (
        <Field label="Contact" htmlFor={id("contact")} hint="Optional — start typing a name or email." error={fe.contact}>
          <Input
            id={id("contact")}
            name="contact"
            list={id("contacts")}
            autoComplete="off"
            placeholder="name@company.com"
            defaultValue={state.ok ? "" : v.contact}
            aria-invalid={Boolean(fe.contact)}
          />
          <datalist id={id("contacts")}>
            {contacts.map((c) => (
              <option key={c.id} value={c.email}>
                {c.name ?? c.email}
              </option>
            ))}
          </datalist>
        </Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Due" htmlFor={id("dueAt")} hint={`Time zone: ${tz.replace(/_/g, " ")}`} error={fe.dueAt}>
          <Input id={id("dueAt")} name="dueAt" type="datetime-local" defaultValue={state.ok ? "" : v.dueAt} aria-invalid={Boolean(fe.dueAt)} />
        </Field>
        <Field label="Priority" htmlFor={id("priority")} error={fe.priority}>
          <Select id={id("priority")} name="priority" defaultValue={state.ok ? "normal" : v.priority || "normal"}>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </Select>
        </Field>
      </div>
      <div>
        <SubmitButton pendingText="Adding…">
          <Plus aria-hidden /> Add task
        </SubmitButton>
      </div>
    </form>
  );
}
