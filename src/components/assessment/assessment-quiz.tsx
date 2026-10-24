"use client";

import { ArrowLeft, ArrowRight, Lock, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { type ChangeEvent, type FormEvent, type RefObject, useActionState, useEffect, useId, useMemo, useRef, useState } from "react";
import { type AssessmentFormState, submitAssessmentAction } from "@/app/(marketing)/assessment/actions";
import { track } from "@/components/analytics/page-view-tracker";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { type AnswerDraft, type Question, validateQuestion, visibleQuestions } from "@/lib/assessment";
import { cn } from "@/lib/utils";
import { AgentFollowUpConsent, type ReferringAgent } from "@/components/marketing/agent-follow-up-consent";
import { QuestionField } from "./question-field";

const AUTO_ADVANCE_MS = 320;
const INITIAL_STATE: AssessmentFormState = {};

/** Direction-aware step transition (disabled for prefers-reduced-motion via motion-safe + globals.css). */
const TRANSITION_CSS = `
@keyframes pa-quiz-in-next { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: none; } }
@keyframes pa-quiz-in-prev { from { opacity: 0; transform: translateX(-28px); } to { opacity: 1; transform: none; } }
`;

type Contact = { name: string; email: string; company: string };

/** The AI readiness quiz: one question per step, then contact details → server action → results page. */
export function AssessmentQuiz({ referrer }: { referrer?: ReferringAgent | null } = {}) {
  const [answers, setAnswers] = useState<AnswerDraft>({});
  const [step, setStep] = useState(0);
  /** null until the visitor first moves between steps (no entrance animation on page load). */
  const [direction, setDirection] = useState<"next" | "prev" | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [contact, setContact] = useState<Contact>({ name: "", email: "", company: "" });
  const [state, formAction] = useActionState(submitAssessmentAction, INITIAL_STATE);
  /** A server response the visitor has already acted on (e.g. "start again"), so it isn't shown twice. */
  const [dismissedState, setDismissedState] = useState<AssessmentFormState | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const navigated = useRef(false);
  const started = useRef(false);
  const advanceTimer = useRef<number | null>(null);
  const uid = useId();

  const questions = useMemo(() => visibleQuestions(answers), [answers]);
  const total = questions.length + 1;
  const onContactStep = step >= questions.length;
  const question: Question | null = onContactStep ? null : questions[step];
  const percent = Math.round((Math.min(step, total) / total) * 100);

  // Move focus to the new question (not on first load) so screen readers announce it.
  useEffect(() => {
    if (!navigated.current) return;
    headingRef.current?.focus({ preventScroll: true });
    const card = cardRef.current;
    if (card && card.getBoundingClientRect().top < 0) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      card.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    }
  }, [step]);

  useEffect(
    () => () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    },
    [],
  );

  function clearTimer() {
    if (advanceTimer.current) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  }

  function goTo(next: number, dir: "next" | "prev") {
    clearTimer();
    navigated.current = true;
    setDirection(dir);
    setStepError(null);
    setStep(Math.max(0, next));
  }

  function handleAnswer(q: Question, value: string | string[], viaPointer: boolean) {
    if (!started.current) {
      started.current = true;
      track("quiz_started", { path: "/assessment" });
    }
    setAnswers((prev) => ({ ...prev, [q.id]: value }) as AnswerDraft);
    setStepError(null);
    // Tapping a single-choice card moves on automatically; keyboard users press Next / Enter.
    if (viaPointer && (q.kind === "single" || q.kind === "scale")) {
      clearTimer();
      const from = step;
      advanceTimer.current = window.setTimeout(() => goTo(from + 1, "next"), AUTO_ADVANCE_MS);
    }
  }

  function handleNext(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!question) return;
    const error = validateQuestion(question, answers);
    if (error) {
      setStepError(error);
      return;
    }
    goTo(step + 1, "next");
  }

  function restart() {
    setDismissedState(state);
    setAnswers({});
    goTo(0, "prev");
  }

  const headingId = `${uid}-heading`;
  const helpId = `${uid}-help`;
  const errorId = `${uid}-error`;
  const describedBy = [question?.help ? helpId : null, stepError ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div ref={cardRef} className="relative scroll-mt-24 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-lift">
      <style href="pa-assessment-quiz" precedence="default">
        {TRANSITION_CSS}
      </style>

      <div className="border-b border-zinc-100 px-5 pt-5 pb-4 sm:px-8 sm:pt-6">
        <div className="flex items-center justify-between gap-3 text-xs font-medium text-zinc-500">
          <span>{onContactStep ? "Last step" : `Question ${step + 1} of ${questions.length}`}</span>
          <span className="tabular-nums">{percent}% complete</span>
        </div>
        <div
          role="progressbar"
          aria-label="Assessment progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-valuetext={onContactStep ? "Last step: your details" : `Question ${step + 1} of ${questions.length}`}
          className="mt-2.5 h-2 overflow-hidden rounded-full bg-zinc-100"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 via-brand-600 to-gold-400 transition-[width] duration-500 ease-out"
            style={{ width: `${Math.max(percent, 4)}%` }}
          />
        </div>
      </div>

      <div
        key={step}
        className={cn(
          "px-5 py-6 sm:px-8 sm:py-8",
          direction === "next" && "motion-safe:[animation:pa-quiz-in-next_.38s_cubic-bezier(.22,1,.36,1)_both]",
          direction === "prev" && "motion-safe:[animation:pa-quiz-in-prev_.38s_cubic-bezier(.22,1,.36,1)_both]",
        )}
      >
        {question ? (
          <form onSubmit={handleNext} noValidate>
            <h2 ref={headingRef} id={headingId} tabIndex={-1} className="text-xl font-semibold tracking-tight text-balance text-zinc-900 outline-none sm:text-2xl">
              {question.title}
            </h2>
            {question.help && (
              <p id={helpId} className="mt-1.5 text-sm text-zinc-500">
                {question.help}
              </p>
            )}
            <div className="mt-6">
              <QuestionField
                question={question}
                value={answers[question.id]}
                onChange={(value, viaPointer) => handleAnswer(question, value, viaPointer)}
                labelledBy={headingId}
                describedBy={describedBy}
              />
            </div>
            {stepError && (
              <p id={errorId} role="alert" className="mt-4 text-sm font-medium text-red-600">
                {stepError}
              </p>
            )}
            <div className="mt-8 flex items-center justify-between gap-3">
              {step > 0 ? (
                <Button variant="ghost" size="lg" className="-ml-3 px-3" onClick={() => goTo(step - 1, "prev")}>
                  <ArrowLeft aria-hidden /> Back
                </Button>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
                  <Lock className="size-3.5" aria-hidden /> Private · about 3 minutes
                </span>
              )}
              <Button type="submit" size="lg" className="min-w-32">
                Next <ArrowRight aria-hidden />
              </Button>
            </div>
          </form>
        ) : (
          <ContactStep
            headingRef={headingRef}
            headingId={headingId}
            answers={answers}
            contact={contact}
            onContactChange={setContact}
            state={state === dismissedState ? INITIAL_STATE : state}
            formAction={formAction}
            onBack={() => goTo(step - 1, "prev")}
            onRestart={restart}
            referrer={referrer}
          />
        )}
      </div>
    </div>
  );
}

function ContactStep({
  headingRef,
  headingId,
  answers,
  contact,
  onContactChange,
  state,
  formAction,
  onBack,
  onRestart,
  referrer,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>;
  headingId: string;
  answers: AnswerDraft;
  contact: Contact;
  onContactChange: (c: Contact) => void;
  state: AssessmentFormState;
  formAction: (formData: FormData) => void;
  onBack: () => void;
  onRestart: () => void;
  referrer?: ReferringAgent | null;
}) {
  const set = (key: keyof Contact) => (e: ChangeEvent<HTMLInputElement>) => onContactChange({ ...contact, [key]: e.target.value });
  const showCompany = answers.focus !== "life" || (answers.role !== undefined && answers.role !== "individual");
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} aria-labelledby={headingId}>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-50 px-2.5 py-1 text-xs font-semibold text-gold-700 ring-1 ring-gold-200 ring-inset">
        <Sparkles className="size-3.5" aria-hidden /> Your results are ready
      </span>
      <h2 ref={headingRef} id={headingId} tabIndex={-1} className="mt-3 text-xl font-semibold tracking-tight text-balance text-zinc-900 outline-none sm:text-2xl">
        Where should we send your results?
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
        You&apos;ll see your score, tier and personalized AI action plan on the next screen — and we&apos;ll email you a link so you can come back to it.
      </p>

      <input type="hidden" name="answers" value={JSON.stringify(answers)} />
      {/* Honeypot: hidden from people, tempting for bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="First name" htmlFor="assessment-name" required error={fe.name}>
          <Input
            id="assessment-name"
            name="name"
            autoComplete="given-name"
            required
            maxLength={80}
            value={contact.name}
            onChange={set("name")}
            aria-invalid={fe.name ? true : undefined}
            className="text-base sm:text-sm"
          />
        </Field>
        <Field label="Email" htmlFor="assessment-email" required error={fe.email}>
          <Input
            id="assessment-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            maxLength={254}
            value={contact.email}
            onChange={set("email")}
            aria-invalid={fe.email ? true : undefined}
            className="text-base sm:text-sm"
          />
        </Field>
        {showCompany && (
          <Field label="Company" htmlFor="assessment-company" hint="Optional" error={fe.company} className="sm:col-span-2">
            <Input
              id="assessment-company"
              name="company"
              autoComplete="organization"
              maxLength={120}
              value={contact.company}
              onChange={set("company")}
              aria-invalid={fe.company ? true : undefined}
              className="text-base sm:text-sm"
            />
          </Field>
        )}
      </div>

      {state.error && (
        <Alert tone="error" className="mt-5">
          {state.error}
          {state.invalidAnswers && (
            <button type="button" onClick={onRestart} className="mt-2 inline-flex items-center gap-1.5 font-semibold underline underline-offset-2">
              <RotateCcw className="size-3.5" aria-hidden /> Start again
            </button>
          )}
        </Alert>
      )}

      {referrer && (
        <div className="mt-5">
          <AgentFollowUpConsent agent={referrer} id="assessment-agent-follow-up" />
        </div>
      )}

      <p className="mt-5 text-xs leading-relaxed text-zinc-500">
        We&apos;ll email your results and occasional practical AI tips. No spam, and you can unsubscribe at any time. See our{" "}
        <Link href="/privacy" className="font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900">
          privacy policy
        </Link>
        .
      </p>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" size="lg" className="sm:-ml-3 sm:px-3" onClick={onBack}>
          <ArrowLeft aria-hidden /> Back
        </Button>
        <SubmitButton size="lg" pendingText="Scoring your answers…" className="w-full sm:w-auto">
          See my results <ArrowRight aria-hidden />
        </SubmitButton>
      </div>
    </form>
  );
}
