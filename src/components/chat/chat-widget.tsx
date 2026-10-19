"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useEffectEvent, useId, useRef, useState, useSyncExternalStore } from "react";
import { track } from "@/components/analytics/page-view-tracker";
import { cn } from "@/lib/utils";
import { ChatPanel } from "./chat-panel";
import { useStreamingChat } from "./use-streaming-chat";

/**
 * Dispatch this from anywhere on the marketing site to open the assistant, optionally with a question:
 * `window.dispatchEvent(new CustomEvent("principe:open-chat", { detail: { message: "…" } }))`
 */
export const OPEN_CHAT_EVENT = "principe:open-chat";

const STORAGE_KEY = "pa_chat_conversation";
const SMALL_SCREEN = "(max-width: 639.98px)";

function subscribeSmallScreen(onChange: () => void) {
  const mq = window.matchMedia(SMALL_SCREEN);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function useIsSmallScreen(): boolean {
  return useSyncExternalStore(
    subscribeSmallScreen,
    () => window.matchMedia(SMALL_SCREEN).matches,
    () => false,
  );
}

/**
 * Floating AI assistant: a compact launcher pill (bottom-right, safe-area aware) that opens the chat panel.
 * Nothing is fetched until the visitor opens it for the first time.
 */
export function ChatWidget({ assistantName, greeting }: { assistantName: string; greeting: string }) {
  const [open, setOpen] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const trackedRef = useRef(false);
  const panelId = useId();
  const smallScreen = useIsSmallScreen();
  const chat = useStreamingChat({
    endpoint: "/api/chat",
    storageKey: STORAGE_KEY,
    historyUrl: (id) => `/api/chat?conversationId=${encodeURIComponent(id)}`,
    extraBody: () => ({ path: window.location.pathname }),
  });

  const openChat = (initialMessage?: string) => {
    setOpen(true);
    if (!trackedRef.current) {
      trackedRef.current = true;
      track("chat_opened", { path: window.location.pathname });
    }
    void chat.loadHistory().then(() => {
      if (initialMessage?.trim()) void chat.send(initialMessage);
    });
  };

  const closeChat = () => {
    setOpen(false);
    requestAnimationFrame(() => launcherRef.current?.focus());
  };

  const onOpenRequest = useEffectEvent((event: Event) => {
    const detail = (event as CustomEvent<{ message?: unknown } | undefined>).detail;
    openChat(typeof detail?.message === "string" ? detail.message.slice(0, 2000) : undefined);
  });

  useEffect(() => {
    const handler = (event: Event) => onOpenRequest(event);
    window.addEventListener(OPEN_CHAT_EVENT, handler);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, handler);
  }, []);

  return (
    <>
      {/*
        `visibility` is only transitioned while hiding (so the launcher still fades out when the chat opens). When the
        chat closes it must flip back to visible at once: closeChat() focuses the launcher on the next frame, and the
        browser ignores focus() on an element that is still visibility:hidden (focus would fall back to <body>).
      */}
      <button
        ref={launcherRef}
        type="button"
        onClick={() => openChat()}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className={cn(
          "group fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 inline-flex h-12 items-center gap-2 rounded-full bg-ink py-1.5 pr-4 pl-1.5 text-sm font-semibold text-white shadow-lift ring-1 ring-white/15 transition-[translate,scale,opacity,background-color] duration-200 print:hidden",
          "hover:-translate-y-0.5 hover:bg-ink-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 active:scale-[0.97]",
          open && "invisible translate-y-2 opacity-0 transition-[translate,scale,opacity,background-color,visibility]",
        )}
      >
        <span aria-hidden className="relative inline-flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700">
          <Sparkles className="size-4 transition-transform duration-300 group-hover:rotate-12" />
          <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-gold-400 ring-2 ring-ink" />
        </span>
        <span>
          Ask AI<span className="sr-only"> — chat with {assistantName}</span>
        </span>
      </button>

      {open && <ChatPanel id={panelId} chat={chat} assistantName={assistantName} greeting={greeting} modal={smallScreen} onClose={closeChat} />}
    </>
  );
}
