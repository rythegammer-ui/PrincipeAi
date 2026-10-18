"use client";

import { ChevronDown, GraduationCap, RotateCcw } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { ChatComposer, SuggestionChips } from "@/components/chat/chat-composer";
import { ChatTranscript } from "@/components/chat/chat-transcript";
import { useStreamingChat } from "@/components/chat/use-streaming-chat";
import { cn } from "@/lib/utils";

const TUTOR_SUGGESTIONS = [
  "Explain this simply",
  "Give me an example for my situation",
  "Quiz me on this lesson",
  "What should I practice?",
] as const;

/**
 * Collapsible AI tutor for a lesson. Answers are grounded in the lesson content and stream in as
 * Markdown. The conversation is remembered per lesson; nothing loads until the panel is opened.
 */
export function AiTutor({ courseSlug, lessonId, lessonTitle }: { courseSlug: string; lessonId: string; lessonTitle: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const inputId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const focusOnOpen = useRef(false);
  const chat = useStreamingChat({
    endpoint: "/api/tutor",
    storageKey: `pa_tutor_${lessonId}`,
    historyUrl: (id) => `/api/tutor?conversationId=${encodeURIComponent(id)}`,
    extraBody: () => ({ courseSlug, lessonId }),
  });
  const hasUserMessages = chat.messages.some((m) => m.role === "user");

  useEffect(() => {
    if (open && focusOnOpen.current) {
      focusOnOpen.current = false;
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [open]);

  const toggle = () => {
    if (!open) {
      void chat.loadHistory();
      // Focus the box on larger screens; on phones keep the keyboard closed until they tap it.
      focusOnOpen.current = window.matchMedia("(min-width: 640px)").matches;
    }
    setOpen((v) => !v);
  };

  const send = (text: string) => {
    void chat.send(text);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-200/70 bg-white shadow-soft print:hidden">
      <h2 className="m-0">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center gap-3 bg-gradient-to-br from-brand-50/90 via-white to-gold-50/50 p-4 text-left transition-colors hover:from-brand-100/70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-500 sm:gap-4 sm:p-5"
        >
          <span aria-hidden className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-900/20">
            <GraduationCap className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-900">
              Ask the AI tutor
              <span className="rounded-md bg-gold-100 px-1.5 py-px text-[10px] font-bold tracking-wide text-gold-700 ring-1 ring-gold-200 ring-inset">AI</span>
            </span>
            <span className="mt-0.5 block text-sm text-zinc-600">Get unstuck, see examples for your situation, or quiz yourself on this lesson.</span>
          </span>
          <ChevronDown className={cn("size-5 shrink-0 text-zinc-400 transition-transform duration-200", open && "rotate-180")} aria-hidden />
        </button>
      </h2>

      <div id={panelId} hidden={!open} className="border-t border-zinc-200/80">
        {open && (
          <>
            <ChatTranscript
              chat={chat}
              intro={`Hi! I'm your AI tutor for **${lessonTitle}**. Ask me anything about this lesson — or pick a starting point below.`}
              assistantLabel="AI tutor"
              typingLabel="The tutor is typing"
              className="max-h-[60vh] min-h-48 bg-zinc-50/70 px-4 py-5 sm:max-h-[30rem] sm:px-5"
            >
              {!hasUserMessages && chat.status !== "loading" && (
                <SuggestionChips suggestions={TUTOR_SUGGESTIONS} onPick={send} disabled={chat.busy} label="Suggested questions for the tutor" className="mt-4 pl-9.5" />
              )}
            </ChatTranscript>
            <div className="border-t border-zinc-200/80 bg-white p-3 sm:p-4">
              <ChatComposer
                id={inputId}
                inputRef={inputRef}
                label="Ask the AI tutor a question about this lesson"
                placeholder="Ask a question about this lesson…"
                busy={chat.busy}
                onSend={send}
                onStop={chat.stop}
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-0.5">
                <p className="text-[11px] text-zinc-500">AI can make mistakes — the lesson is your source of truth.</p>
                {(hasUserMessages || chat.error) && (
                  <button
                    type="button"
                    onClick={() => {
                      chat.reset();
                      inputRef.current?.focus();
                    }}
                    className="inline-flex min-h-8 items-center gap-1 rounded-md text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:underline"
                  >
                    <RotateCcw className="size-3.5" aria-hidden />
                    New conversation
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
