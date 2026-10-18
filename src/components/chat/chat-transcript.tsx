"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChatBubble, TypingIndicator, useInternalLinkNavigation } from "./chat-message";
import type { StreamingChat } from "./use-streaming-chat";

/**
 * Scrollable conversation: intro message, messages, typing indicator and error/retry.
 * Sticks to the bottom while new content streams in, unless the reader scrolled up.
 * The log is aria-busy while a reply streams, so screen readers announce the finished answer once.
 */
export function ChatTranscript({
  chat,
  intro,
  assistantLabel,
  typingLabel,
  onNavigate,
  className,
  children,
}: {
  chat: StreamingChat;
  intro?: string;
  assistantLabel: string;
  typingLabel?: string;
  onNavigate?: (href: string) => void;
  className?: string;
  children?: ReactNode;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const countRef = useRef(0);
  const onLinkClick = useInternalLinkNavigation(onNavigate);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const grew = chat.messages.length > countRef.current;
    countRef.current = chat.messages.length;
    if (grew) stickRef.current = true;
    if (stickRef.current) el.scrollTop = el.scrollHeight;
  }, [chat.messages, chat.status, chat.error]);

  const last = chat.messages[chat.messages.length - 1];
  const waiting = chat.status === "waiting" || (last?.role === "assistant" && last.state === "streaming" && !last.content);
  const visible = chat.messages.filter((m) => !(m.role === "assistant" && m.state === "streaming" && !m.content));

  return (
    <div
      ref={scrollerRef}
      onScroll={(e) => {
        const el = e.currentTarget;
        stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      }}
      className={cn("overflow-y-auto overscroll-contain", className)}
    >
      <p className="sr-only" role="status">
        {waiting ? `${typingLabel ?? `${assistantLabel} is typing`}…` : ""}
      </p>
      <div role="log" aria-label="Conversation" aria-busy={chat.busy} onClick={onLinkClick} className="flex flex-col gap-4">
        {intro && <ChatBubble message={{ role: "assistant", content: intro, state: "done" }} assistantLabel={assistantLabel} showCopy={false} />}
        {chat.status === "loading" && <p className="text-center text-xs text-zinc-500">Loading your conversation…</p>}
        {visible.map((m) => (
          <ChatBubble key={m.id} message={m} assistantLabel={assistantLabel} />
        ))}
        {waiting && <TypingIndicator label={typingLabel ?? `${assistantLabel} is typing`} />}
        {chat.error && (
          <div role="alert" className="flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
            <p>{chat.error}</p>
            <button
              type="button"
              onClick={chat.retry}
              className="inline-flex min-h-8 shrink-0 items-center gap-1.5 self-start rounded-lg px-2 font-semibold text-red-800 hover:bg-red-100 sm:self-auto"
            >
              <RotateCcw className="size-3.5" aria-hidden /> Try again
            </button>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
