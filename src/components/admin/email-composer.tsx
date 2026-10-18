"use client";

import { Eye, Loader2, Pencil, Send, Sparkles, Wand2 } from "lucide-react";
import { useActionState, useId, useState, useTransition } from "react";
import { draftFollowUpAction, sendContactEmailAction, type FormState } from "@/app/admin/(panel)/contacts/actions";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Markdown } from "@/components/ui/markdown";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";
import { FOLLOW_UP_PURPOSES, type FollowUpPurpose } from "./crm-utils";

/**
 * One-to-one email composer: draft a follow-up with Claude (or a smart template without AI),
 * edit it, preview the Markdown, and send. Every send is logged to the email log + timeline.
 */
export function EmailComposer({
  contactId,
  contactEmail,
  unsubscribed,
  aiConfigured,
}: {
  contactId: string;
  contactEmail: string;
  unsubscribed: boolean;
  aiConfigured: boolean;
}) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [purpose, setPurpose] = useState<FollowUpPurpose>("next_step");
  const [guidance, setGuidance] = useState("");
  const [draftSource, setDraftSource] = useState<"ai" | "template" | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [drafting, startDraft] = useTransition();

  const [state, action] = useActionState<FormState, FormData>(async (prev, fd) => {
    const res = await sendContactEmailAction(prev, fd);
    if (res.ok) {
      setSubject("");
      setBody("");
      setDraftSource(null);
      setPreview(false);
    }
    return res;
  }, {});

  const draft = () => {
    setDraftError(null);
    startDraft(async () => {
      const res = await draftFollowUpAction(contactId, purpose, guidance);
      if (res.ok) {
        setSubject(res.subject);
        setBody(res.body);
        setDraftSource(res.source);
        setPreview(false);
      } else setDraftError(res.error);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-brand-100 bg-brand-50/50 p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label="Email goal" htmlFor={id("purpose")} className="sm:w-56">
            <Select id={id("purpose")} value={purpose} onChange={(e) => setPurpose(e.target.value as FollowUpPurpose)} className="h-10 bg-white">
              {Object.entries(FOLLOW_UP_PURPOSES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Guidance (optional)" htmlFor={id("guidance")} className="flex-1">
            <Input
              id={id("guidance")}
              value={guidance}
              maxLength={500}
              onChange={(e) => setGuidance(e.target.value)}
              placeholder="e.g. mention the automation ideas we discussed"
              className="h-10 bg-white"
            />
          </Field>
          <Button onClick={draft} disabled={drafting} variant="secondary" className="h-10 bg-white ring-1 ring-brand-200 hover:bg-brand-50" aria-busy={drafting}>
            {drafting ? <Loader2 className="animate-spin" aria-hidden /> : aiConfigured ? <Sparkles aria-hidden /> : <Wand2 aria-hidden />}
            {drafting ? "Drafting…" : aiConfigured ? "Draft with AI" : "Draft from template"}
          </Button>
        </div>
        {draftError && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {draftError}
          </p>
        )}
        {!aiConfigured && <p className="text-xs text-zinc-500">AI isn’t connected, so drafts come from smart templates based on the contact’s stage. Add ANTHROPIC_API_KEY for personalised drafts.</p>}
      </div>

      <form action={action} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="id" value={contactId} />
        {unsubscribed && (
          <Alert tone="warning" title="This contact unsubscribed from marketing email">
            One-to-one replies are fine, but keep it personal and relevant.
          </Alert>
        )}
        {state.error && <Alert tone="error">{state.error}</Alert>}
        {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}
        <p className="text-sm text-zinc-500">
          To: <span className="font-medium text-zinc-800">{contactEmail}</span>
        </p>
        <Field label="Subject" htmlFor={id("subject")} required error={state.fieldErrors?.subject}>
          <Input id={id("subject")} name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} required aria-invalid={Boolean(state.fieldErrors?.subject)} />
        </Field>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor={id("body")} className="text-sm font-medium text-zinc-800">
              Message<span className="ml-0.5 text-brand-600">*</span>
            </label>
            <div className="flex items-center gap-2">
              {draftSource && <Badge tone={draftSource === "ai" ? "brand" : "neutral"}>{draftSource === "ai" ? "Drafted by Claude" : "Template draft"}</Badge>}
              <button
                type="button"
                onClick={() => setPreview((p) => !p)}
                aria-pressed={preview}
                className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-brand-500"
              >
                {preview ? <Pencil className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
                {preview ? "Edit" : "Preview"}
              </button>
            </div>
          </div>
          <Textarea
            id={id("body")}
            name="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            maxLength={20000}
            required
            className={cn("min-h-52 font-normal", preview && "sr-only")}
            aria-invalid={Boolean(state.fieldErrors?.body)}
            placeholder={"Hi …,\n\nWrite your message in plain text or Markdown — **bold**, lists and [links](https://…) work."}
          />
          {preview && (
            <div className="min-h-52 rounded-xl border border-zinc-200 bg-white p-4">
              {body.trim() ? <Markdown className="prose-sm">{body}</Markdown> : <p className="text-sm text-zinc-400">Nothing to preview yet.</p>}
            </div>
          )}
          {state.fieldErrors?.body && (
            <p role="alert" className="text-xs font-medium text-red-600">
              {state.fieldErrors.body}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton pendingText="Sending…" disabled={!subject.trim() || !body.trim()}>
            <Send aria-hidden /> Send email
          </SubmitButton>
          <p className="text-xs text-zinc-500">Sent from your business address and logged on the timeline.</p>
        </div>
      </form>
    </div>
  );
}
