"use client";

import { RotateCcw, Sparkles, UserRound, X } from "lucide-react";
import { useEffect, useEffectEvent, useId, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { ChatComposer, SuggestionChips } from "./chat-composer";
import { ChatTranscript } from "./chat-transcript";
import { FollowUpForm } from "./follow-up-form";
import type { StreamingChat } from "./use-streaming-chat";

export const CHAT_SUGGESTIONS = [
  "Which course is right for me?",
  "How can AI help my business?",
  "Give me a prompt to plan my week",
  "Book a free strategy call",
] as const;

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The assistant's chat window. Full-screen modal sheet on phones (focus trapped, page scroll locked);
 * a floating non-modal panel from the `sm` breakpoint up. Escape closes it.
 */
export function ChatPanel({
  id,
  chat,
  assistantName,
  greeting,
  modal,
  onClose,
}: {
  id: string;
  chat: StreamingChat;
  assistantName: string;
  greeting: string;
  modal: boolean;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const titleId = useId();
  const descId = useId();
  const inputId = useId();
  const hasUserMessages = chat.messages.some((m) => m.role === "user");

  // On phones, focus the sheet (not the textarea) so the keyboard doesn't cover the greeting.
  useEffect(() => {
    if (modal) panelRef.current?.focus();
    else inputRef.current?.focus();
  }, [modal]);

  // Escape also closes the panel when focus has dropped back to the page body.
  const closeFromDocument = useEffectEvent(() => onClose());
  useEffect(() => {
    const onDocumentKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const active = document.activeElement;
      if (!active || active === document.body || panelRef.current?.contains(active)) closeFromDocument();
    };
    document.addEventListener("keydown", onDocumentKeyDown);
    return () => document.removeEventListener("keydown", onDocumentKeyDown);
  }, []);

  // Lock page scroll behind the full-screen sheet.
  useEffect(() => {
    if (!modal) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [modal]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key !== "Tab" || !modal || !panelRef.current) return;
    const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const send = (text: string) => {
    void chat.send(text);
    if (!modal) inputRef.current?.focus();
  };

  return (
    <div
      id={id}
      ref={panelRef}
      role="dialog"
      aria-modal={modal || undefined}
      aria-labelledby={titleId}
      aria-describedby={descId}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className={cn(
        "fixed inset-0 z-[60] flex flex-col bg-white outline-none print:hidden motion-safe:animate-fade-up",
        "sm:inset-auto sm:right-[max(1.25rem,env(safe-area-inset-right))] sm:bottom-[max(1.25rem,env(safe-area-inset-bottom))] sm:h-[min(680px,calc(100dvh_-_2.5rem))] sm:w-[400px] sm:overflow-hidden sm:rounded-2xl sm:border sm:border-zinc-200/80 sm:shadow-lift",
      )}
    >
      <header className="relative flex items-center gap-3 overflow-hidden bg-ink px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 text-white sm:pt-3">
        <div aria-hidden className="glow-brand pointer-events-none absolute inset-0 opacity-70" />
        <span aria-hidden className="relative inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm shadow-black/30">
          <Sparkles className="size-4" />
        </span>
        <div className="relative min-w-0 flex-1">
          <h2 id={titleId} className="flex items-center gap-2 text-sm font-semibold">
            <span className="truncate">{assistantName}</span>
            <span className="shrink-0 rounded-md bg-gold-400 px-1.5 py-px text-[10px] font-bold tracking-wide text-ink">AI</span>
          </h2>
          <p id={descId} className="truncate text-xs text-zinc-400">
            Instant answers about AI for your life and business
          </p>
        </div>
        <div className="relative flex shrink-0 items-center gap-1">
          {(hasUserMessages || chat.error) && (
            <button
              type="button"
              onClick={() => {
                chat.reset();
                setShowFollowUp(false);
                inputRef.current?.focus();
              }}
              aria-label="Start a new conversation"
              title="New conversation"
              className="inline-flex size-11 items-center justify-center rounded-xl text-zinc-300 transition-colors hover:bg-white/10 hover:text-white sm:size-9"
            >
              <RotateCcw className="size-4" aria-hidden />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="inline-flex size-11 items-center justify-center rounded-xl text-zinc-300 transition-colors hover:bg-white/10 hover:text-white sm:size-9"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
      </header>

      <ChatTranscript
        chat={chat}
        intro={greeting}
        assistantLabel={assistantName}
        onNavigate={() => {
          if (modal) onClose();
        }}
        className="flex-1 bg-zinc-50/80 px-4 py-5"
      >
        {!hasUserMessages && chat.status !== "loading" && (
          <SuggestionChips suggestions={CHAT_SUGGESTIONS} onPick={send} disabled={chat.busy} className="mt-4 pl-9.5" />
        )}
      </ChatTranscript>

      <div className="border-t border-zinc-200/80 bg-white px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3">
        {showFollowUp && (
          <div className="mb-3">
            <FollowUpForm
              disabled={chat.busy}
              onCancel={() => setShowFollowUp(false)}
              onSubmit={(email) => {
                setShowFollowUp(false);
                send(`Please have someone follow up with me by email: ${email}`);
              }}
            />
          </div>
        )}
        <ChatComposer
          id={inputId}
          inputRef={inputRef}
          label={`Message ${assistantName}`}
          placeholder="Ask about AI, courses or booking…"
          busy={chat.busy}
          onSend={send}
          onStop={chat.stop}
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-0.5">
          {!showFollowUp ? (
            <button
              type="button"
              onClick={() => setShowFollowUp(true)}
              className="inline-flex min-h-8 items-center gap-1 rounded-md text-xs font-medium text-brand-700 hover:text-brand-800 hover:underline"
            >
              <UserRound className="size-3.5" aria-hidden />
              Get a human follow-up
            </button>
          ) : (
            <span />
          )}
          <p className="text-[11px] text-zinc-500">AI can make mistakes. Check important info.</p>
        </div>
      </div>
    </div>
  );
}
