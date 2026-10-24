"use client";

import { CheckCircle2, Send } from "lucide-react";
import { useActionState } from "react";
import { sendContactMessageAction, type ContactState } from "@/app/(marketing)/contact/actions";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { AgentFollowUpConsent, type ReferringAgent } from "./agent-follow-up-consent";
import { Honeypot } from "./honeypot";
import { CONTACT_TOPIC_OPTIONS } from "./lead-options";

/** Contact form with an inline success state. */
export function ContactForm({ defaultTopic, referrer }: { defaultTopic?: string; referrer?: ReferringAgent | null }) {
  const [state, action] = useActionState<ContactState, FormData>(sendContactMessageAction, {});
  const err = state.fieldErrors ?? {};
  const v = state.values ?? {};
  const topicDefault = v.topic || (CONTACT_TOPIC_OPTIONS.some((o) => o.value === defaultTopic) ? defaultTopic : "") || "";

  if (state.ok) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center" role="status">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
          <CheckCircle2 className="size-7" aria-hidden />
        </span>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Thanks, {state.firstName ?? "there"} — your message is on its way</h2>
        <p className="max-w-md text-sm leading-relaxed text-zinc-600">
          A real person reads every message, and we&apos;ll reply by email. While you wait, the free assessment is a quick way to see where AI could help you most.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <ButtonLink href="/assessment" size="lg">
            Take the free assessment
          </ButtonLink>
          <ButtonLink href="/free-guide" size="lg" variant="outline">
            Get the free Starter Kit
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="relative flex flex-col gap-5">
      <Honeypot />
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" htmlFor="contact-name" error={err.name} required>
          <Input id="contact-name" name="name" autoComplete="name" maxLength={120} required defaultValue={v.name ?? ""} aria-invalid={err.name ? true : undefined} />
        </Field>
        <Field label="Email" htmlFor="contact-email" error={err.email} required>
          <Input
            id="contact-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            maxLength={254}
            required
            defaultValue={v.email ?? ""}
            aria-invalid={err.email ? true : undefined}
          />
        </Field>
      </div>
      <Field label="What's this about?" htmlFor="contact-topic" error={err.topic} required>
        <Select id="contact-topic" name="topic" required defaultValue={topicDefault} aria-invalid={err.topic ? true : undefined}>
          <option value="" disabled>
            Choose a topic…
          </option>
          {CONTACT_TOPIC_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Message" htmlFor="contact-message" error={err.message} required>
        <Textarea
          id="contact-message"
          name="message"
          rows={6}
          maxLength={5000}
          required
          placeholder="Tell us a little about what you're hoping AI can help with."
          defaultValue={v.message ?? ""}
          aria-invalid={err.message ? true : undefined}
        />
      </Field>
      <AgentFollowUpConsent agent={referrer} id="contact-agent-follow-up" />

      <SubmitButton size="lg" className="w-full sm:w-auto sm:self-start" pendingText="Sending…">
        Send message <Send aria-hidden />
      </SubmitButton>
    </form>
  );
}
