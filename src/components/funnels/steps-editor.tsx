"use client";

import { ArrowDown, ArrowUp, Braces, Loader2, Mail, Pencil, Plus, Save, Send, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import {
  deleteStepAction,
  draftStepAction,
  moveStepAction,
  previewStepAction,
  saveStepAction,
  sendTestStepAction,
  type StepData,
} from "@/app/admin/(panel)/sequences/actions";
import { DELAY_MAX_HOURS, PLACEHOLDERS, SAMPLE_PERSON, SUBJECT_MAX, describeStepTiming, stepDays } from "@/components/funnels/automation-utils";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { cn, truncate } from "@/lib/utils";

type Draft = { id: string | null; index: number; delayHours: string; subject: string; body: string; initial: string };
type Notice = { tone: "success" | "error" | "info"; text: string } | null;

const snapshot = (d: Pick<Draft, "delayHours" | "subject" | "body">) => JSON.stringify([d.delayHours, d.subject, d.body]);

/** Plain-text excerpt of a Markdown body for the collapsed step card. */
function excerpt(markdown: string): string {
  const text = markdown
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`>#]+/g, "")
    .replace(/^\s*[-\d.]+\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  return truncate(text, 170);
}

export function StepsEditor({ sequenceId, initialSteps, adminEmail }: { sequenceId: string; initialSteps: StepData[]; adminEmail: string }) {
  const [steps, setSteps] = useState(initialSteps);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, startTransition] = useTransition();
  const days = stepDays(steps.map((s) => s.delayHours));

  const dirty = draft !== null && snapshot(draft) !== draft.initial;
  const confirmDiscard = () => !dirty || window.confirm("Discard your unsaved changes to this email?");

  const open = (step: StepData | null, index: number) => {
    if (!confirmDiscard()) return;
    const base = step
      ? { delayHours: String(step.delayHours), subject: step.subject, body: step.body }
      : { delayHours: steps.length === 0 ? "0" : "48", subject: "", body: "" };
    setNotice(null);
    setDraft({ id: step?.id ?? null, index, ...base, initial: snapshot(base) });
  };

  const run = (fn: () => Promise<{ ok: true; steps: StepData[] } | { ok: false; error: string }>, success: string) =>
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        setSteps(res.steps);
        setNotice({ tone: "success", text: success });
      } else setNotice({ tone: "error", text: res.error });
    });

  const close = () => {
    if (confirmDiscard()) setDraft(null);
  };

  const move = (step: StepData, direction: "up" | "down") => {
    if (!confirmDiscard()) return;
    setDraft(null);
    run(() => moveStepAction(sequenceId, step.id, direction), `Moved “${step.subject}” ${direction}.`);
  };

  return (
    <div className="flex flex-col gap-3">
      <p role="status" aria-live="polite" className="sr-only">
        {notice?.text}
      </p>
      {notice && !draft && (
        <Alert tone={notice.tone === "error" ? "error" : notice.tone === "success" ? "success" : "info"}>{notice.text}</Alert>
      )}

      {steps.length === 0 && !draft && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 px-6 py-10 text-center">
          <Mail className="size-6 text-brand-600" aria-hidden />
          <div>
            <p className="font-semibold text-zinc-900">No emails in this automation yet</p>
            <p className="mt-1 text-sm text-zinc-500">Add the first email. It can go out the moment someone joins, or after a wait.</p>
          </div>
        </div>
      )}

      <ol className="flex flex-col gap-3" aria-label="Emails in this automation">
        {steps.map((step, i) =>
          draft?.id === step.id ? (
            <li key={step.id}>
              <StepEditorPanel
                sequenceId={sequenceId}
                draft={draft}
                total={steps.length}
                adminEmail={adminEmail}
                onChange={setDraft}
                onCancel={close}
                onSaved={(next) => {
                  setSteps(next);
                  setDraft(null);
                  setNotice({ tone: "success", text: `Email ${i + 1} saved.` });
                }}
              />
            </li>
          ) : (
            <li key={step.id} className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-soft sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="flex shrink-0 items-center gap-2 sm:w-20 sm:flex-col sm:items-start">
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700 ring-1 ring-brand-200">
                    {i + 1}
                  </span>
                  <Badge tone="neutral">Day {days[i]}</Badge>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-zinc-500">{describeStepTiming(i, step.delayHours)}</p>
                  <h3 className="mt-0.5 font-semibold text-zinc-900">{step.subject}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{excerpt(step.body)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => open(step, i)} disabled={pending} aria-label={`Edit email ${i + 1}: ${step.subject}`}>
                    <Pencil aria-hidden /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={pending || i === 0}
                    aria-label={`Move email ${i + 1} up`}
                    onClick={() => move(step, "up")}
                  >
                    <ArrowUp aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={pending || i === steps.length - 1}
                    aria-label={`Move email ${i + 1} down`}
                    onClick={() => move(step, "down")}
                  >
                    <ArrowDown aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-700 hover:bg-red-50 hover:text-red-800"
                    disabled={pending}
                    aria-label={`Delete email ${i + 1}`}
                    onClick={() => {
                      if (!window.confirm(`Delete “${step.subject}”? People in this automation will move on to the next email.`)) return;
                      if (draft) setDraft(null);
                      run(() => deleteStepAction(sequenceId, step.id), "Email deleted.");
                    }}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </div>
            </li>
          ),
        )}
        {draft?.id === null && (
          <li>
            <StepEditorPanel
              sequenceId={sequenceId}
              draft={draft}
              total={steps.length + 1}
              adminEmail={adminEmail}
              onChange={setDraft}
              onCancel={close}
              onSaved={(next) => {
                setSteps(next);
                setDraft(null);
                setNotice({ tone: "success", text: "Email added." });
              }}
            />
          </li>
        )}
      </ol>

      {draft?.id !== null && (
        <div>
          <Button variant="secondary" onClick={() => open(null, steps.length)} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Plus aria-hidden />} Add email
          </Button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Editor panel                                                        */
/* ------------------------------------------------------------------ */

function StepEditorPanel({
  sequenceId,
  draft,
  total,
  adminEmail,
  onChange,
  onCancel,
  onSaved,
}: {
  sequenceId: string;
  draft: Draft;
  total: number;
  adminEmail: string;
  onChange: (d: Draft) => void;
  onCancel: () => void;
  onSaved: (steps: StepData[]) => void;
}) {
  const uid = useId();
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const lastField = useRef<"subject" | "body">("body");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState<null | "save" | "draft" | "test">(null);
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const requestId = useRef(0);

  const delay = Number(draft.delayHours);
  const delayValid = draft.delayHours.trim() !== "" && Number.isInteger(delay) && delay >= 0 && delay <= DELAY_MAX_HOURS;
  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch });

  // Live preview: render on the server with the real email layout, debounced.
  useEffect(() => {
    const id = ++requestId.current;
    const t = window.setTimeout(async () => {
      try {
        const res = await previewStepAction({ subject: draft.subject, body: draft.body });
        if (id !== requestId.current) return;
        if (res.ok) {
          setPreview({ subject: res.subject, html: res.html });
          setPreviewError(null);
        } else setPreviewError(res.error);
      } catch {
        if (id === requestId.current) setPreviewError("Preview unavailable. Check your connection.");
      }
    }, 350);
    return () => window.clearTimeout(t);
  }, [draft.subject, draft.body]);

  useEffect(() => {
    subjectRef.current?.focus();
  }, []);

  const insertPlaceholder = (key: string) => {
    const token = `{{${key}}}`;
    const field = lastField.current;
    const el = field === "subject" ? subjectRef.current : bodyRef.current;
    const value = field === "subject" ? draft.subject : draft.body;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + token + value.slice(end);
    set(field === "subject" ? { subject: next } : { body: next });
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const save = async () => {
    setBusy("save");
    setNotice(null);
    try {
      const res = await saveStepAction({ sequenceId, stepId: draft.id, delayHours: delayValid ? delay : -1, subject: draft.subject, body: draft.body });
      if (res.ok) onSaved(res.steps);
      else {
        setErrors(res.fieldErrors ?? {});
        setNotice({ tone: "error", text: res.error });
      }
    } catch {
      setNotice({ tone: "error", text: "Couldn't save. Check your connection and try again." });
    } finally {
      setBusy(null);
    }
  };

  const aiDraft = async () => {
    if ((draft.subject.trim() || draft.body.trim()) && !window.confirm("Replace the current subject and body with a new draft?")) return;
    setBusy("draft");
    setNotice(null);
    try {
      const res = await draftStepAction({ sequenceId, index: draft.index, delayHours: delayValid ? delay : 0, subject: draft.subject });
      if (res.ok) {
        set({ subject: res.draft.subject, body: res.draft.body });
        setErrors({});
        setNotice(
          res.source === "ai"
            ? { tone: "success", text: "Drafted with AI. Read it through and make it yours before saving." }
            : { tone: "info", text: "AI isn't available right now, so we filled in a starter template you can edit." },
        );
      } else setNotice({ tone: "error", text: res.error });
    } catch {
      setNotice({ tone: "error", text: "Couldn't create a draft. Try again in a moment." });
    } finally {
      setBusy(null);
    }
  };

  const sendTest = async () => {
    setBusy("test");
    setNotice(null);
    try {
      const res = await sendTestStepAction({ subject: draft.subject, body: draft.body });
      if (res.ok) {
        setNotice({
          tone: "success",
          text: res.status === "simulated" ? `Test logged for ${res.to} (simulated: email delivery isn't set up yet). Find it in the Email Log.` : `Test sent to ${res.to}.`,
        });
      } else setNotice({ tone: "error", text: res.error });
    } catch {
      setNotice({ tone: "error", text: "Couldn't send the test. Try again in a moment." });
    } finally {
      setBusy(null);
    }
  };

  const title = draft.id ? `Edit email ${draft.index + 1}` : `New email ${draft.index + 1}`;

  return (
    <section aria-label={title} className="rounded-2xl border border-brand-200 bg-white p-4 shadow-lift ring-1 ring-brand-100 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-zinc-900">
          {title} <span className="font-normal text-zinc-500">of {total}</span>
        </h3>
        <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Close editor">
          <X aria-hidden />
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <Field
            label={draft.index === 0 ? "Wait after someone joins (hours)" : "Wait after the previous email (hours)"}
            htmlFor={`${uid}-delay`}
            error={errors.delayHours ?? (!delayValid && draft.delayHours !== "" ? `Enter whole hours from 0 to ${DELAY_MAX_HOURS}.` : null)}
            hint={delayValid ? `${describeStepTiming(draft.index, delay)}.` : undefined}
          >
            <Input
              id={`${uid}-delay`}
              type="number"
              inputMode="numeric"
              min={0}
              max={DELAY_MAX_HOURS}
              step={1}
              value={draft.delayHours}
              onChange={(e) => set({ delayHours: e.target.value })}
              className="max-w-40"
              aria-invalid={!delayValid || Boolean(errors.delayHours)}
            />
          </Field>
          <Field label="Subject line" htmlFor={`${uid}-subject`} error={errors.subject} hint={`${draft.subject.length}/${SUBJECT_MAX} characters`}>
            <Input
              ref={subjectRef}
              id={`${uid}-subject`}
              value={draft.subject}
              maxLength={SUBJECT_MAX}
              onFocus={() => (lastField.current = "subject")}
              onChange={(e) => set({ subject: e.target.value })}
              placeholder="e.g. Your first 10-minute AI win"
              aria-invalid={Boolean(errors.subject)}
            />
          </Field>
          <Field label="Email body (Markdown)" htmlFor={`${uid}-body`} error={errors.body} hint="**bold**, - bullet lists, > quotes and [link text]({{bookUrl}}) all work.">
            <Textarea
              ref={bodyRef}
              id={`${uid}-body`}
              value={draft.body}
              rows={14}
              onFocus={() => (lastField.current = "body")}
              onChange={(e) => set({ body: e.target.value })}
              className="min-h-72 font-mono text-[13px]"
              placeholder={"Hi {{firstName}},\n\n…"}
              aria-invalid={Boolean(errors.body)}
            />
          </Field>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
              <Braces className="size-3.5" aria-hidden /> Placeholders <span className="font-normal text-zinc-500">· click to insert at the cursor</span>
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {PLACEHOLDERS.map((p) => (
                <li key={p.key}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertPlaceholder(p.key)}
                    title={p.description}
                    aria-label={`Insert {{${p.key}}}: ${p.description}`}
                    className="inline-flex min-h-8 items-center rounded-lg border border-zinc-200 bg-white px-2 font-mono text-xs text-zinc-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-brand-500"
                  >
                    {`{{${p.key}}}`}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {notice && <Alert tone={notice.tone === "error" ? "error" : notice.tone === "success" ? "success" : "info"}>{notice.text}</Alert>}

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={save} disabled={busy !== null}>
              {busy === "save" ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />} {draft.id ? "Save email" : "Add email"}
            </Button>
            <Button variant="ghost" onClick={onCancel} disabled={busy !== null}>
              Cancel
            </Button>
            <span className="hidden flex-1 sm:block" />
            <Button variant="secondary" onClick={aiDraft} disabled={busy !== null}>
              {busy === "draft" ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />} Draft with AI
            </Button>
            <Button variant="outline" onClick={sendTest} disabled={busy !== null || !draft.subject.trim() || !draft.body.trim()} title={`Sends to ${adminEmail}`}>
              {busy === "test" ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />} Send test
            </Button>
          </div>
          <p className="-mt-2 text-xs text-zinc-500">Tests go to {adminEmail}. Saved changes apply to everyone from their next email.</p>
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-zinc-800">Preview</p>
            <p className="text-xs text-zinc-500">Shown for a sample contact, {SAMPLE_PERSON.firstName}</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
            <div className="border-b border-zinc-200 bg-white px-3 py-2 text-sm">
              <span className="text-zinc-500">Subject: </span>
              <span className={cn("font-medium", preview?.subject ? "text-zinc-900" : "text-zinc-400")}>{preview?.subject || "(no subject yet)"}</span>
            </div>
            {previewError ? (
              <p className="p-6 text-sm text-red-700" role="alert">
                {previewError}
              </p>
            ) : preview ? (
              <iframe title={`Preview of ${title.toLowerCase()}`} sandbox="" srcDoc={preview.html} className="block h-[34rem] w-full bg-[#f4f4f7]" />
            ) : (
              <p className="flex h-[34rem] items-center justify-center gap-2 text-sm text-zinc-500">
                <Loader2 className="size-4 animate-spin" aria-hidden /> Rendering preview…
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
