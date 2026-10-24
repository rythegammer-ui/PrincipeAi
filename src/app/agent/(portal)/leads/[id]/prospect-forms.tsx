"use client";

import { Check, ExternalLink, Globe, MapPin, Phone, Sparkles, Wand2 } from "lucide-react";
import { useActionState, useState } from "react";
import { CopyButton } from "@/components/marketing/copy-button";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ProspectStatus } from "@/db/schema";
import { formatDate } from "@/lib/utils";
import {
  markContactedAction,
  placeDetailsAction,
  updateProspectAction,
  writeMessageAction,
  type ContactedState,
  type DetailsState,
  type MessageState,
  type UpdateState,
} from "../actions";

type Channel = { value: string; label: string; hint: string };

/** Writes the first message for this business; the agent copies it, sends it themselves, then marks it contacted. */
export function MessageWriter({ id, channels, disabled }: { id: string; channels: Channel[]; disabled: boolean }) {
  const [state, action, pending] = useActionState<MessageState, FormData>(writeMessageAction, {});
  const [channel, setChannel] = useState(channels[0]?.value ?? "email");
  const full = state.body ? (state.subject ? `Subject: ${state.subject}\n\n${state.body}` : state.body) : "";
  const overLimit = state.body && !state.replied && state.sent !== undefined && state.maxSent !== undefined && state.sent >= state.maxSent;

  return (
    <div>
      {/* The channel picker sits outside the form, so the form's reset after each message doesn't switch it back. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field label="How you'll reach out" htmlFor="message-channel" className="sm:w-64">
          <Select id="message-channel" value={channel} onChange={(e) => setChannel(e.target.value)} disabled={disabled}>
            {channels.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="channel" value={channel} />
          <SubmitButton className="min-h-11 w-full sm:w-auto" pendingText="Writing…" disabled={disabled}>
            <Wand2 aria-hidden /> {state.body ? "Write another version" : "Write my message"}
          </SubmitButton>
        </form>
      </div>
      <p className="mt-2 text-xs text-zinc-500">{channels.find((c) => c.value === channel)?.hint}</p>
      {/* Emptied while writing, so each new version is announced again. */}
      <p role="status" className="sr-only">
        {!pending && state.body ? "Your message is ready below." : ""}
      </p>

      {state.error && (
        <Alert tone="error" className="mt-4">
          {state.error}
        </Alert>
      )}

      {state.body && (
        <section aria-label="Your message" className="mt-4 rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
              <Sparkles className="size-4 text-brand-600" aria-hidden /> {state.ai ? "Your message (written with AI: read it and make it yours)" : "Your message"}
            </p>
            <div className="flex flex-wrap gap-2">
              {state.subject && <CopyButton text={state.subject} label="Copy subject" srLabel="Copy the subject line" className="min-h-11 sm:min-h-9" />}
              <CopyButton text={state.subject ? state.body : full} label={state.subject ? "Copy email" : "Copy"} srLabel="Copy the message" className="min-h-11 sm:min-h-9" />
            </div>
          </div>
          {state.addressMissing && (
            <Alert tone="warning" className="mt-3">
              Our mailing address isn&apos;t set yet, so this email has a placeholder where it goes. Ask the team for it before you send the email: the law
              requires it in every promotional email.
            </Alert>
          )}
          {overLimit && (
            <Alert tone="warning" className="mt-3">
              You&apos;ve already reached out {state.sent} times. The rules allow a first message and two follow-ups: if they haven&apos;t replied, mark this
              business Closed and move on.
            </Alert>
          )}
          {state.subject && (
            <p className="mt-3 text-sm text-zinc-700">
              <span className="font-medium text-zinc-900">Subject:</span> {state.subject}
            </p>
          )}
          <p className="mt-3 text-sm leading-relaxed break-words whitespace-pre-line text-zinc-700">{state.body}</p>
          <p className="mt-3 text-xs text-zinc-500">
            Edit it so it sounds like you, but keep the link, the commission line and (in email) the opt-out line and address. Then send it yourself and mark it
            as sent below.
          </p>
          <MarkContacted key={state.body} id={id} />
        </section>
      )}
    </div>
  );
}

function MarkContacted({ id }: { id: string }) {
  const [state, action] = useActionState<ContactedState, FormData>(markContactedAction, {});
  if (state.ok) {
    return (
      <p className="mt-3 flex items-start gap-1.5 text-sm font-medium text-emerald-700" role="status">
        <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
        {state.followUpAt
          ? `Marked as sent. We'll remind you to follow up on ${formatDate(new Date(state.followUpAt), { dateStyle: undefined, month: "short", day: "numeric" })}.`
          : "Marked as sent. That was your last follow-up: if they don't reply, mark this business Closed and move on."}
      </p>
    );
  }
  return (
    <form action={action} className="mt-3">
      <input type="hidden" name="id" value={id} />
      <SubmitButton variant="outline" className="min-h-11 sm:min-h-9" pendingText="Saving…">
        <Check aria-hidden /> I sent it: mark as contacted
      </SubmitButton>
      {state.error && (
        <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}

const STATUSES: { value: ProspectStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "replied", label: "Replied" },
  { value: "not_interested", label: "Closed (not a fit, or no reply after follow-ups)" },
  { value: "do_not_contact", label: "Do not contact (they said no or asked us to stop)" },
];

/**
 * Status, follow-up date and notes (plus contact details for businesses the agent added by hand). baseStatus and
 * baseFollowUp tell the server what the form was showing, so fields left as they were aren't saved over newer values.
 */
export function ProspectUpdateForm({
  prospect,
  manual,
}: {
  prospect: { id: string; status: ProspectStatus; notes: string | null; nextFollowUp: string; website: string | null; phone: string | null; email: string | null };
  manual: boolean;
}) {
  const [state, action] = useActionState<UpdateState, FormData>(updateProspectAction, {});
  const locked = prospect.status === "do_not_contact";
  // After an error the form shows what the agent submitted; after a save, what's stored. A submitted status or date
  // only while the prospect still is as the form showed it (not after "I sent it" changed it, say).
  const v = state.error ? (state.values ?? {}) : {};
  const fresh = v.baseStatus === prospect.status && v.baseFollowUp === prospect.nextFollowUp;
  const status = (fresh ? (v.status as ProspectStatus | undefined) : undefined) ?? prospect.status;
  const followUp = (fresh ? v.nextFollowUp : undefined) ?? prospect.nextFollowUp;
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="id" value={prospect.id} />
      <input type="hidden" name="baseStatus" value={prospect.status} />
      <input type="hidden" name="baseFollowUp" value={prospect.nextFollowUp} />
      {state.error && (
        <Alert tone="error" className="sm:col-span-2">
          {state.error}
        </Alert>
      )}
      {state.ok && (
        <Alert tone="success" className="sm:col-span-2">
          Saved.
        </Alert>
      )}
      <Field
        label="Status"
        htmlFor="prospect-status"
        hint={locked ? "Only an admin can change Do not contact." : "If they said no or asked you to stop, choose Do not contact."}
      >
        {/* A select doesn't pick up a new defaultValue: the key remounts it with the saved (or submitted) status. */}
        <Select key={`${prospect.status}:${status}`} id="prospect-status" name="status" defaultValue={status} disabled={locked}>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Next follow-up" htmlFor="prospect-follow-up" hint="Leave empty for no reminder">
        {/* Remounted when the stored date changes, so a date the server just set isn't shown (and saved) stale. */}
        <Input key={`${prospect.nextFollowUp}:${followUp}`} id="prospect-follow-up" name="nextFollowUp" type="date" defaultValue={followUp} disabled={locked} />
      </Field>
      {manual && (
        <>
          <Field label="Website" htmlFor="prospect-website">
            <Input id="prospect-website" name="website" inputMode="url" maxLength={300} defaultValue={v.website ?? prospect.website ?? ""} disabled={locked} />
          </Field>
          <Field label="Business phone" htmlFor="prospect-phone">
            <Input id="prospect-phone" name="phone" type="tel" maxLength={40} defaultValue={v.phone ?? prospect.phone ?? ""} disabled={locked} />
          </Field>
          <Field label="Business email" htmlFor="prospect-email" className="sm:col-span-2">
            <Input id="prospect-email" name="email" type="email" maxLength={254} defaultValue={v.email ?? prospect.email ?? ""} disabled={locked} />
          </Field>
        </>
      )}
      <Field label="Notes" htmlFor="prospect-notes" hint="Private to you (admins can see them). Used as context when writing messages." className="sm:col-span-2">
        <Textarea id="prospect-notes" name="notes" rows={4} maxLength={2000} defaultValue={v.notes ?? prospect.notes ?? ""} />
      </Field>
      <div className="sm:col-span-2">
        <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
      </div>
    </form>
  );
}

/** Loads the Google listing's address, website and phone on request (fetched fresh, never stored). */
export function PlaceDetailsLoader({ id }: { id: string }) {
  const [state, action] = useActionState<DetailsState, FormData>(placeDetailsAction, {});
  const d = state.details;
  if (d) {
    return (
      <ul className="flex flex-col gap-2 text-sm text-zinc-700">
        <li className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0 text-zinc-400" aria-hidden /> {d.address || "Address not listed"}
        </li>
        <li className="flex items-start gap-2">
          <Globe className="mt-0.5 size-4 shrink-0 text-zinc-400" aria-hidden />
          {d.website ? (
            <a href={d.website} target="_blank" rel="noopener noreferrer" className="break-all text-brand-700 hover:underline">
              {d.website}
              <ExternalLink className="ml-1 inline size-3" aria-hidden />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            "No website listed"
          )}
        </li>
        <li className="flex items-start gap-2">
          <Phone className="mt-0.5 size-4 shrink-0 text-zinc-400" aria-hidden />
          {d.phone ? (
            <a href={`tel:${d.phone.replace(/[^\d+]/g, "")}`} className="text-brand-700 hover:underline">
              {d.phone}
            </a>
          ) : (
            "No phone listed"
          )}
        </li>
        {d.mapsUrl && (
          <li>
            <a
              href={d.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1 text-xs font-medium text-brand-700 hover:underline sm:min-h-0"
            >
              Open in Google Maps <ExternalLink className="size-3" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        )}
        <li className="text-xs text-zinc-500">From Google Maps. Not saved: load it again next time.</li>
      </ul>
    );
  }
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton variant="outline" className="min-h-11 sm:min-h-9" pendingText="Loading…">
        <Globe aria-hidden /> Show address, website and phone
      </SubmitButton>
      {state.error && (
        <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
