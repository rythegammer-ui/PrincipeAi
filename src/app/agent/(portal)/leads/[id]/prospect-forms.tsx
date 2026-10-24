"use client";

import { Check, ExternalLink, Globe, MapPin, Phone, Sparkles, Wand2 } from "lucide-react";
import { useActionState, useState } from "react";
import { CopyButton } from "@/components/marketing/copy-button";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ProspectStatus } from "@/db/schema";
import {
  placeDetailsAction,
  updateProspectAction,
  writeMessageAction,
  type DetailsState,
  type MessageState,
  type UpdateState,
} from "../actions";

type Channel = { value: string; label: string; hint: string };

/** Writes the first message for this business; the agent copies it, sends it themselves, then marks it contacted. */
export function MessageWriter({ id, channels, disabled }: { id: string; channels: Channel[]; disabled: boolean }) {
  const [state, action] = useActionState<MessageState, FormData>(writeMessageAction, {});
  const [channel, setChannel] = useState(channels[0]?.value ?? "email");
  const full = state.body ? (state.subject ? `Subject: ${state.subject}\n\n${state.body}` : state.body) : "";

  return (
    <div>
      <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <input type="hidden" name="id" value={id} />
        <Field label="How you'll reach out" htmlFor="message-channel" className="sm:w-64">
          <Select id="message-channel" name="channel" value={channel} onChange={(e) => setChannel(e.target.value)} disabled={disabled}>
            {channels.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
        <SubmitButton className="min-h-11" pendingText="Writing…" disabled={disabled}>
          <Wand2 aria-hidden /> {state.body ? "Write another version" : "Write my message"}
        </SubmitButton>
      </form>
      <p className="mt-2 text-xs text-zinc-500">{channels.find((c) => c.value === channel)?.hint}</p>

      {state.error && (
        <Alert tone="error" className="mt-4">
          {state.error}
        </Alert>
      )}

      {state.body && (
        <div className="mt-4 rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
              <Sparkles className="size-4 text-brand-600" aria-hidden /> {state.ai ? "Your message (written with AI: read it and make it yours)" : "Your message"}
            </p>
            <div className="flex flex-wrap gap-2">
              {state.subject && <CopyButton text={state.subject} label="Copy subject" srLabel="Copy the subject line" className="min-h-11 sm:min-h-9" />}
              <CopyButton text={state.subject ? state.body : full} label={state.subject ? "Copy email" : "Copy"} srLabel="Copy the message" className="min-h-11 sm:min-h-9" />
            </div>
          </div>
          {state.subject && (
            <p className="mt-3 text-sm text-zinc-700">
              <span className="font-medium text-zinc-900">Subject:</span> {state.subject}
            </p>
          )}
          <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-zinc-700">{state.body}</p>
          <p className="mt-3 text-xs text-zinc-500">
            Edit it so it sounds like you, but keep the link, the commission line and (in email) the opt-out line and address. Then send it yourself and mark the
            business as contacted below.
          </p>
          <MarkContacted id={id} />
        </div>
      )}
    </div>
  );
}

function MarkContacted({ id }: { id: string }) {
  const [state, action] = useActionState<UpdateState, FormData>(updateProspectAction, {});
  if (state.ok) {
    return (
      <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-emerald-700">
        <Check className="size-4" aria-hidden /> Marked as contacted. We&apos;ll remind you to follow up in a few days.
      </p>
    );
  }
  return (
    <form action={action} className="mt-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value="contacted" />
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
  { value: "not_interested", label: "Not interested" },
  { value: "do_not_contact", label: "Do not contact (asked us to stop)" },
];

/** Status, follow-up date and notes (plus contact details for businesses the agent added by hand). */
export function ProspectUpdateForm({
  prospect,
  manual,
}: {
  prospect: { id: string; status: ProspectStatus; notes: string | null; nextFollowUp: string; website: string | null; phone: string | null; email: string | null };
  manual: boolean;
}) {
  const [state, action] = useActionState<UpdateState, FormData>(updateProspectAction, {});
  const locked = prospect.status === "do_not_contact";
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="id" value={prospect.id} />
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
      <Field label="Status" htmlFor="prospect-status" hint={locked ? "Only an admin can change Do not contact." : undefined}>
        <Select id="prospect-status" name="status" defaultValue={prospect.status} disabled={locked}>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Next follow-up" htmlFor="prospect-follow-up" hint="Leave empty for no reminder">
        <Input id="prospect-follow-up" name="nextFollowUp" type="date" defaultValue={prospect.nextFollowUp} disabled={locked} />
      </Field>
      {manual && (
        <>
          <Field label="Website" htmlFor="prospect-website">
            <Input id="prospect-website" name="website" inputMode="url" maxLength={300} defaultValue={prospect.website ?? ""} />
          </Field>
          <Field label="Business phone" htmlFor="prospect-phone">
            <Input id="prospect-phone" name="phone" type="tel" maxLength={40} defaultValue={prospect.phone ?? ""} />
          </Field>
          <Field label="Business email" htmlFor="prospect-email" className="sm:col-span-2">
            <Input id="prospect-email" name="email" type="email" maxLength={254} defaultValue={prospect.email ?? ""} />
          </Field>
        </>
      )}
      <Field label="Notes" htmlFor="prospect-notes" hint="Private to you (admins can see them). Used as context when writing messages." className="sm:col-span-2">
        <Textarea id="prospect-notes" name="notes" rows={4} maxLength={2000} defaultValue={prospect.notes ?? ""} />
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
            </a>
          ) : (
            "No website listed"
          )}
        </li>
        <li className="flex items-start gap-2">
          <Phone className="mt-0.5 size-4 shrink-0 text-zinc-400" aria-hidden />
          {d.phone ? <a href={`tel:${d.phone.replace(/[^\d+]/g, "")}`} className="text-brand-700 hover:underline">{d.phone}</a> : "No phone listed"}
        </li>
        {d.mapsUrl && (
          <li>
            <a href={d.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
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
