"use client";

import { ArrowRight, Lock } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { startCourseCheckoutAction, type EnrollState } from "@/app/(marketing)/courses/actions";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

/** Email + name → secure checkout. Rendered inside the sales page buy box. */
export function EnrollForm({
  courseId,
  courseSlug,
  ctaLabel,
  mode,
  defaultEmail,
  defaultName,
}: {
  courseId: string;
  courseSlug: string;
  ctaLabel: string;
  mode: "stripe" | "test" | "free" | "disabled";
  defaultEmail?: string;
  defaultName?: string;
}) {
  const [state, action] = useActionState<EnrollState, FormData>(startCourseCheckoutAction, {});
  const idPrefix = `enroll-${courseSlug}`;

  return (
    <form action={action} className="flex flex-col gap-3.5" noValidate>
      <input type="hidden" name="courseId" value={courseId} />
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.alreadyOwned && (
        <Alert tone="info" title="You already have this course">
          <Link href={`/login?next=${encodeURIComponent(`/learn/${courseSlug}`)}`} className="font-medium underline">
            Sign in to start learning
          </Link>{" "}
          — we&apos;ll email you a one-click link.
        </Alert>
      )}
      <Field label="Your name" htmlFor={`${idPrefix}-name`} error={state.fieldErrors?.name}>
        <Input
          id={`${idPrefix}-name`}
          name="name"
          autoComplete="name"
          placeholder="Alex Rivera"
          required
          maxLength={120}
          defaultValue={state.values?.name ?? defaultName ?? ""}
          aria-invalid={state.fieldErrors?.name ? true : undefined}
        />
      </Field>
      <Field label="Email" htmlFor={`${idPrefix}-email`} error={state.fieldErrors?.email} hint="Your course access link is sent here.">
        <Input
          id={`${idPrefix}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          maxLength={254}
          defaultValue={state.values?.email ?? defaultEmail ?? ""}
          aria-invalid={state.fieldErrors?.email ? true : undefined}
        />
      </Field>
      <SubmitButton size="lg" variant="gold" className="mt-1 w-full" pendingText={mode === "free" ? "Getting you set up…" : "Starting secure checkout…"}>
        {ctaLabel} <ArrowRight aria-hidden />
      </SubmitButton>
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-zinc-500">
        <Lock className="size-3" aria-hidden />
        {mode === "stripe"
          ? "Secure checkout powered by Stripe"
          : mode === "free"
            ? "Free — no card needed"
            : "Test mode — no real payment will be taken"}
      </p>
    </form>
  );
}
