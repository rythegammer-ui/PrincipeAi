"use client";

import { ArrowRight, CalendarCheck, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { applyForImplementationAction, type ApplicationState } from "@/app/(marketing)/consulting/actions";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { BUDGET_OPTIONS, TEAM_SIZE_OPTIONS, TIMELINE_OPTIONS } from "./lead-options";
import { Honeypot } from "./honeypot";

/** Implementation application → qualified lead → book the discovery call. */
export function ApplicationForm({
  contactEmail,
  discoveryCall,
}: {
  contactEmail: string;
  /** e.g. "a free 45-minute discovery call" — null when online booking for it is switched off. */
  discoveryCall: string | null;
}) {
  const [state, action] = useActionState<ApplicationState, FormData>(applyForImplementationAction, {});
  const err = state.fieldErrors ?? {};
  const v = state.values ?? {};
  const invalid = (k: keyof typeof err) => (err[k] ? true : undefined);

  if (state.ok) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center" role="status">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
          <CheckCircle2 className="size-7" aria-hidden />
        </span>
        <h3 className="text-xl font-semibold tracking-tight text-zinc-900">Thanks, {state.firstName ?? "there"} — application received</h3>
        <p className="max-w-md text-sm leading-relaxed text-zinc-600">
          We&apos;ll review your answers and email you to arrange a discovery call. If anything is urgent, reach us at{" "}
          <a href={`mailto:${contactEmail}`} className="font-medium text-brand-700 underline underline-offset-2">
            {contactEmail}
          </a>
          .
        </p>
        <Link href="/book" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
          <CalendarCheck className="size-4" aria-hidden /> See all ways to book a call
        </Link>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="relative flex flex-col gap-5">
      <Honeypot />
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" htmlFor="apply-name" error={err.name} required>
          <Input id="apply-name" name="name" autoComplete="name" maxLength={120} required defaultValue={v.name ?? ""} aria-invalid={invalid("name")} />
        </Field>
        <Field label="Work email" htmlFor="apply-email" error={err.email} required>
          <Input
            id="apply-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={254}
            required
            placeholder="you@company.com"
            defaultValue={v.email ?? ""}
            aria-invalid={invalid("email")}
          />
        </Field>
        <Field label="Company" htmlFor="apply-company" error={err.company} required>
          <Input id="apply-company" name="company" autoComplete="organization" maxLength={160} required defaultValue={v.company ?? ""} aria-invalid={invalid("company")} />
        </Field>
        <Field label="Website" htmlFor="apply-website" error={err.website} hint="Optional">
          <Input
            id="apply-website"
            name="website"
            inputMode="url"
            autoComplete="url"
            placeholder="example.com"
            maxLength={300}
            defaultValue={v.website ?? ""}
            aria-invalid={invalid("website")}
          />
        </Field>
        <Field label="Team size" htmlFor="apply-team" error={err.teamSize} required>
          <Select id="apply-team" name="teamSize" required defaultValue={v.teamSize ?? ""} aria-invalid={invalid("teamSize")}>
            <option value="" disabled>
              Choose one…
            </option>
            {TEAM_SIZE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Ideal timeline" htmlFor="apply-timeline" error={err.timeline} required>
          <Select id="apply-timeline" name="timeline" required defaultValue={v.timeline ?? ""} aria-invalid={invalid("timeline")}>
            <option value="" disabled>
              Choose one…
            </option>
            {TIMELINE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="What would you like AI to automate or build?"
        htmlFor="apply-goals"
        error={err.goals}
        hint="E.g. “Answer common customer questions on our website and book appointments” or “Turn our sales calls into follow-up emails and CRM notes.”"
        required
      >
        <Textarea id="apply-goals" name="goals" rows={5} maxLength={4000} required defaultValue={v.goals ?? ""} aria-invalid={invalid("goals")} />
      </Field>

      <Field label="Budget range for this project" htmlFor="apply-budget" error={err.budget} hint="This just helps us suggest the right scope — there's no wrong answer." required>
        <Select id="apply-budget" name="budget" required defaultValue={v.budget ?? ""} aria-invalid={invalid("budget")}>
          <option value="" disabled>
            Choose one…
          </option>
          {BUDGET_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>

      <SubmitButton size="lg" className="mt-1 w-full sm:w-auto sm:self-start" pendingText="Sending your application…">
        {discoveryCall ? "Continue to pick a call time" : "Send my application"} <ArrowRight aria-hidden />
      </SubmitButton>
      <p className="text-xs leading-relaxed text-zinc-500">
        {discoveryCall ? `Next, you'll choose a time for ${discoveryCall}. ` : "We'll review your answers and email you about next steps. "}
        Your answers stay private and are only used to prepare for our conversation.
      </p>
    </form>
  );
}
