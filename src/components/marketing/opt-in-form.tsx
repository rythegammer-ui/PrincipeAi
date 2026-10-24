"use client";

import { ArrowRight, Lock } from "lucide-react";
import { useActionState } from "react";
import { optInAction, type OptInState } from "@/app/(marketing)/free-guide/actions";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";
import { AgentFollowUpConsent, type ReferringAgent } from "./agent-follow-up-consent";
import { Honeypot } from "./honeypot";
import { INTEREST_OPTIONS, type OptInPlacement } from "./lead-options";

/** Starter Kit opt-in: name, email and where they want AI's help → unlocks /guide. */
export function OptInForm({
  placement,
  submitLabel = "Send me the free kit",
  className,
  referrer,
}: {
  placement: OptInPlacement;
  submitLabel?: string;
  className?: string;
  /** The sales agent whose link brought the visitor: shows the optional follow-up consent box. */
  referrer?: ReferringAgent | null;
}) {
  const [state, action] = useActionState<OptInState, FormData>(optInAction, {});
  const id = (field: string) => `optin-${placement}-${field}`;
  const interest = state.values?.interest || "both";

  return (
    <form action={action} noValidate className={cn("relative flex flex-col gap-4", className)}>
      <input type="hidden" name="placement" value={placement} />
      <Honeypot />
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <Field label="First name" htmlFor={id("name")} error={state.fieldErrors?.name} required>
        <Input
          id={id("name")}
          name="name"
          autoComplete="given-name"
          placeholder="Your first name"
          required
          maxLength={120}
          defaultValue={state.values?.name ?? ""}
          aria-invalid={state.fieldErrors?.name ? true : undefined}
        />
      </Field>
      <Field label="Email" htmlFor={id("email")} error={state.fieldErrors?.email} required>
        <Input
          id={id("email")}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          maxLength={254}
          defaultValue={state.values?.email ?? ""}
          aria-invalid={state.fieldErrors?.email ? true : undefined}
        />
      </Field>

      <fieldset aria-describedby={state.fieldErrors?.interest ? id("interest-error") : undefined}>
        <legend className="text-sm font-medium text-zinc-800">
          Where would you like AI to help most?<span className="ml-0.5 text-brand-600">*</span>
        </legend>
        <div className="mt-2 grid grid-cols-3 gap-2" key={interest}>
          {INTEREST_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="relative flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-zinc-300 bg-white px-1.5 py-2.5 text-center text-[0.8125rem] font-medium whitespace-nowrap sm:text-sm text-zinc-700 shadow-xs transition-colors hover:border-brand-300 hover:bg-brand-50/50 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-800 has-[:checked]:ring-2 has-[:checked]:ring-brand-500/20 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-500"
            >
              <input type="radio" name="interest" value={opt.value} defaultChecked={opt.value === interest} className="sr-only" />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
        {state.fieldErrors?.interest && (
          <p id={id("interest-error")} className="mt-1.5 text-xs font-medium text-red-600" role="alert">
            {state.fieldErrors.interest}
          </p>
        )}
      </fieldset>

      <AgentFollowUpConsent agent={referrer} id={id("agent-follow-up")} />

      <SubmitButton size="lg" className="mt-1 w-full" pendingText="Unlocking your kit…">
        {submitLabel} <ArrowRight aria-hidden />
      </SubmitButton>
      <p className="flex items-start justify-center gap-1.5 text-center text-xs leading-relaxed text-zinc-500">
        <Lock className="mt-0.5 size-3 shrink-0" aria-hidden />
        <span>Free, instant access. We&apos;ll also email you a few short tips — unsubscribe anytime.</span>
      </p>
    </form>
  );
}
