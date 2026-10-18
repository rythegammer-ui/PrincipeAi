"use client";

import { Send, X } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { isValidEmail } from "@/lib/utils";

/**
 * Inline "Get a human follow-up" form. Posts a normal chat message containing the email,
 * which the chat API turns into a CRM lead and owner notification.
 */
export function FollowUpForm({ disabled, onSubmit, onCancel }: { disabled?: boolean; onSubmit: (email: string) => void; onCancel: () => void }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!isValidEmail(value)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    onSubmit(value);
  };

  return (
    <form onSubmit={submit} noValidate className="rounded-xl border border-brand-200 bg-brand-50/70 p-3" aria-labelledby={`${id}-title`}>
      <div className="flex items-start justify-between gap-2">
        <p id={`${id}-title`} className="text-sm font-semibold text-zinc-900">
          Get a reply from a real person
        </p>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close follow-up form"
          className="-mt-1 -mr-1 inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-white hover:text-zinc-800"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <p className="mt-0.5 text-xs text-zinc-600">Leave your email and someone from the team will follow up about this conversation.</p>
      <div className="mt-2.5 flex gap-2">
        <label htmlFor={`${id}-email`} className="sr-only">
          Your email
        </label>
        <input
          id={`${id}-email`}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          maxLength={254}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-10 min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 focus:outline-none aria-[invalid=true]:border-red-400 sm:text-sm"
        />
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-sm font-medium text-white hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50"
        >
          <Send className="size-3.5" aria-hidden />
          Send
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
