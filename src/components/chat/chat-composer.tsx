"use client";

import { ArrowUp, Square } from "lucide-react";
import { useState, type FormEvent, type KeyboardEvent, type Ref } from "react";
import { cn } from "@/lib/utils";
import { MAX_MESSAGE_LENGTH } from "./use-streaming-chat";

const MAX_TEXTAREA_PX = 144;

function autosize(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_PX)}px`;
}

/** Message box: Enter sends, Shift+Enter adds a line. Shows a stop button while a reply streams. */
export function ChatComposer({
  id,
  label,
  placeholder,
  busy,
  disabled,
  onSend,
  onStop,
  inputRef,
  className,
}: {
  id: string;
  label: string;
  placeholder: string;
  busy: boolean;
  disabled?: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  inputRef?: Ref<HTMLTextAreaElement>;
  className?: string;
}) {
  const [text, setText] = useState("");
  const remaining = MAX_MESSAGE_LENGTH - text.length;

  const submit = (form: HTMLFormElement | null) => {
    const value = text.trim();
    if (!value || busy || disabled) return;
    onSend(value);
    setText("");
    const el = form?.querySelector("textarea");
    if (el) {
      el.style.height = "auto";
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit(e.currentTarget);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit(e.currentTarget.form);
    }
  };

  return (
    <form onSubmit={onSubmit} className={cn("flex items-end gap-2", className)}>
      <div className="relative min-w-0 flex-1">
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <textarea
          id={id}
          ref={inputRef}
          rows={1}
          value={text}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder={placeholder}
          enterKeyHint="send"
          disabled={disabled}
          aria-describedby={remaining < 200 ? `${id}-count` : undefined}
          onChange={(e) => {
            setText(e.target.value);
            autosize(e.target);
          }}
          onKeyDown={onKeyDown}
          className="block max-h-36 min-h-11 w-full resize-none rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-base leading-snug text-zinc-900 shadow-xs transition-colors placeholder:text-zinc-400 hover:border-zinc-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 focus:outline-none disabled:cursor-not-allowed disabled:bg-zinc-50 sm:text-sm"
        />
        {remaining < 200 && (
          <span id={`${id}-count`} className="pointer-events-none absolute right-2.5 bottom-1 text-[10px] text-zinc-400 tabular-nums" aria-live="polite">
            {remaining} characters left
          </span>
        )}
      </div>
      {busy ? (
        <button
          type="button"
          onClick={onStop}
          aria-label="Stop generating"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-zinc-300 bg-white text-zinc-700 shadow-xs transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          <Square className="size-3.5 fill-current" aria-hidden />
        </button>
      ) : (
        <button
          type="submit"
          aria-label="Send message"
          disabled={!text.trim() || disabled}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-900/20 transition-all hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 active:scale-95 disabled:opacity-40"
        >
          <ArrowUp className="size-4.5" aria-hidden />
        </button>
      )}
    </form>
  );
}

/** Starter questions shown before the first message. */
export function SuggestionChips({
  suggestions,
  onPick,
  disabled,
  label = "Suggested questions",
  className,
}: {
  suggestions: readonly string[];
  onPick: (text: string) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {suggestions.map((s) => (
        <button
          key={s}
          type="button"
          disabled={disabled}
          onClick={() => onPick(s)}
          className="min-h-9 rounded-full border border-brand-200 bg-white px-3 py-1.5 text-left text-sm font-medium text-brand-800 shadow-xs transition-colors hover:border-brand-300 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
