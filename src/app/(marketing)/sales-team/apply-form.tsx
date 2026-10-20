"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { Honeypot } from "@/components/marketing/honeypot";
import { Alert } from "@/components/ui/alert";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { EXPERIENCE_OPTIONS, HOURS_OPTIONS, US_STATES } from "@/lib/sales/options";
import { applyToSalesTeamAction, type SalesApplyState } from "./actions";

/** Sales-team application → saved for review; the owner or an admin approves it. */
export function SalesApplyForm({ contactEmail }: { contactEmail: string }) {
  const [state, action] = useActionState<SalesApplyState, FormData>(applyToSalesTeamAction, {});
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
          We read every application ourselves and will email you within 2 business days. Questions in the meantime? Write to{" "}
          <a href={`mailto:${contactEmail}`} className="font-medium text-brand-700 underline underline-offset-2">
            {contactEmail}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="relative flex flex-col gap-5">
      <Honeypot />
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="sa-name" error={err.name} required>
          <Input id="sa-name" name="name" autoComplete="name" maxLength={120} required defaultValue={v.name ?? ""} aria-invalid={invalid("name")} />
        </Field>
        <Field label="Email" htmlFor="sa-email" error={err.email} required>
          <Input
            id="sa-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={254}
            required
            placeholder="you@example.com"
            defaultValue={v.email ?? ""}
            aria-invalid={invalid("email")}
          />
        </Field>
        <Field label="Phone" htmlFor="sa-phone" error={err.phone} required>
          <Input id="sa-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={40} required defaultValue={v.phone ?? ""} aria-invalid={invalid("phone")} />
        </Field>
        <Field label="City" htmlFor="sa-city" error={err.city} required>
          <Input id="sa-city" name="city" autoComplete="address-level2" maxLength={80} required defaultValue={v.city ?? ""} aria-invalid={invalid("city")} />
        </Field>
        <Field label="State" htmlFor="sa-state" error={err.state} required>
          <Select id="sa-state" name="state" autoComplete="address-level1" required defaultValue={v.state ?? ""} aria-invalid={invalid("state")}>
            <option value="" disabled>
              Choose your state…
            </option>
            {US_STATES.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Time you can give it" htmlFor="sa-hours" error={err.hours} required>
          <Select id="sa-hours" name="hours" required defaultValue={v.hours ?? ""} aria-invalid={invalid("hours")}>
            <option value="" disabled>
              Choose one…
            </option>
            {HOURS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <fieldset aria-describedby={err.experience ? "sa-experience-error" : undefined}>
        <legend className="text-sm font-medium text-zinc-800">
          Sales experience<span className="ml-0.5 text-brand-600">*</span>
        </legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {EXPERIENCE_OPTIONS.map((o) => (
            <label
              key={o.value}
              className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-700 transition-colors hover:border-brand-300 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-900"
            >
              <input type="radio" name="experience" value={o.value} defaultChecked={v.experience === o.value} className="size-4 accent-brand-600" required />
              {o.label}
            </label>
          ))}
        </div>
        {err.experience && (
          <p id="sa-experience-error" className="mt-1.5 text-xs font-medium text-red-600" role="alert">
            {err.experience}
          </p>
        )}
      </fieldset>

      <Field
        label="How would you find customers?"
        htmlFor="sa-channels"
        error={err.channels}
        hint="E.g. “I know a lot of small-business owners through my church and local chamber of commerce” or “I post about productivity on Instagram.”"
        required
      >
        <Textarea id="sa-channels" name="channels" rows={4} maxLength={1500} required defaultValue={v.channels ?? ""} aria-invalid={invalid("channels")} />
      </Field>

      <Field label="Why do you want to join?" htmlFor="sa-why" error={err.why} hint="Optional">
        <Textarea id="sa-why" name="why" rows={3} maxLength={1500} defaultValue={v.why ?? ""} aria-invalid={invalid("why")} />
      </Field>

      <div className="flex flex-col gap-3">
        <div>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-relaxed text-zinc-700">
            <Checkbox name="agree" value="yes" required defaultChecked={v.agree === "yes"} className="mt-1" aria-invalid={invalid("agree")} />
            <span>
              I&apos;ve read and agree to the{" "}
              <Link href="/sales-team/terms" target="_blank" className="font-medium text-brand-700 underline underline-offset-2">
                Sales Agent Program Terms
                <span className="sr-only"> (opens in a new tab)</span>
              </Link>
              , including always telling people I earn a commission.
            </span>
          </label>
          {err.agree && (
            <p className="text-xs font-medium text-red-600" role="alert">
              {err.agree}
            </p>
          )}
        </div>
        <div>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-relaxed text-zinc-700">
            <Checkbox name="adult" value="yes" required defaultChecked={v.adult === "yes"} className="mt-1" aria-invalid={invalid("adult")} />
            <span>I&apos;m 18 or older and live in the United States.</span>
          </label>
          {err.adult && (
            <p className="text-xs font-medium text-red-600" role="alert">
              {err.adult}
            </p>
          )}
        </div>
      </div>

      <SubmitButton size="lg" className="mt-1 w-full sm:w-auto sm:self-start" pendingText="Sending your application…">
        Send my application <ArrowRight aria-hidden />
      </SubmitButton>
      <p className="text-xs leading-relaxed text-zinc-500">
        We only use your answers to review your application and, if you join, to run the program, and we never sell them. If you join, your first name,
        last initial and state appear on the team leaderboard unless you opt out.
      </p>
    </form>
  );
}
