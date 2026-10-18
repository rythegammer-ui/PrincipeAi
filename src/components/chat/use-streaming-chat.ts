"use client";

import { useRef, useState } from "react";

export type ChatUiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** "streaming" while tokens arrive; "done" once complete. */
  state: "streaming" | "done";
};

/** idle → (loading history) → waiting (request sent) → streaming (tokens arriving) → idle */
export type ChatStatus = "idle" | "loading" | "waiting" | "streaming";

export type StreamingChatOptions = {
  /** POST endpoint that streams a text reply and returns X-Conversation-Id. */
  endpoint: string;
  /** localStorage key for the conversation id. */
  storageKey: string;
  /** Extra JSON fields sent with every message. */
  extraBody?: () => Record<string, unknown>;
  /** GET URL returning `{ messages }` for a stored conversation. */
  historyUrl?: (conversationId: string) => string;
};

export const MAX_MESSAGE_LENGTH = 2000;

class ChatRequestError extends Error {}

function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string | null) {
  try {
    if (value) window.localStorage.setItem(key, value);
    else window.localStorage.removeItem(key);
  } catch {
    /* storage unavailable (private mode, blocked cookies) — the chat still works for this page view */
  }
}

let seq = 0;
const uid = () => `m${Date.now().toString(36)}${(seq++).toString(36)}`;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function statusMessage(status: number): string {
  if (status === 429) return "You're sending messages quickly — please wait a minute and try again.";
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "This assistant isn't available to you right now.";
  return "Something went wrong on our side. Please try again.";
}

/**
 * Client state for a streaming AI chat: message list, fetch + ReadableStream reading,
 * stop / retry / reset, and conversation-id persistence. Does no network work until
 * `loadHistory()` or `send()` is called.
 */
export function useStreamingChat({ endpoint, storageKey, extraBody, historyUrl }: StreamingChatOptions) {
  const [messages, setMessages] = useState<ChatUiMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const lastPromptRef = useRef<string | null>(null);
  const historyRequestedRef = useRef(false);

  const busy = status !== "idle";

  /** Restores the stored conversation (once). Call when the chat UI is first opened. */
  async function loadHistory() {
    if (historyRequestedRef.current) return;
    historyRequestedRef.current = true;
    const stored = readStored(storageKey);
    if (!stored || !UUID.test(stored)) return;
    conversationIdRef.current = stored;
    if (!historyUrl) return;
    setStatus("loading");
    try {
      const res = await fetch(historyUrl(stored), { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { messages?: { role: string; content: string }[] };
        const restored = (data.messages ?? [])
          .filter((m): m is { role: "user" | "assistant"; content: string } => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
          .map((m) => ({ id: uid(), role: m.role, content: m.content, state: "done" as const }));
        // Don't clobber anything the user sent while history was loading.
        setMessages((prev) => (prev.length ? prev : restored));
      } else if (res.status === 404 || res.status === 400) {
        conversationIdRef.current = null;
        writeStored(storageKey, null);
      }
    } catch {
      /* offline — start fresh, the stored id is kept for next time */
    } finally {
      setStatus((s) => (s === "loading" ? "idle" : s));
    }
  }

  async function send(text: string, mode: "new" | "retry" = "new") {
    const content = text.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!content || controllerRef.current) return;
    setError(null);
    lastPromptRef.current = content;
    const assistantId = uid();
    setMessages((prev) => [
      ...prev,
      ...(mode === "new" ? [{ id: uid(), role: "user" as const, content, state: "done" as const }] : []),
      { id: assistantId, role: "assistant", content: "", state: "streaming" },
    ]);
    setStatus("waiting");

    const controller = new AbortController();
    controllerRef.current = controller;
    const setReply = (reply: string, state: ChatUiMessage["state"]) =>
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: reply, state } : m)));
    const dropReply = () => setMessages((prev) => prev.filter((m) => m.id !== assistantId));

    let received = "";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...extraBody?.(), conversationId: conversationIdRef.current ?? undefined, message: content }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new ChatRequestError(data?.error || statusMessage(res.status));
      }
      const conversationId = res.headers.get("X-Conversation-Id");
      if (conversationId && UUID.test(conversationId)) {
        conversationIdRef.current = conversationId;
        writeStored(storageKey, conversationId);
      }
      setStatus("streaming");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        received += decoder.decode(value, { stream: true });
        setReply(received, "streaming");
      }
      received += decoder.decode();
      if (!received.trim()) throw new ChatRequestError("The assistant didn't send a reply. Please try again.");
      setReply(received, "done");
    } catch (err) {
      if (controller.signal.aborted) {
        // Stopped by the user: keep whatever already arrived.
        if (received.trim()) setReply(received, "done");
        else dropReply();
      } else {
        if (received.trim()) setReply(received, "done");
        else dropReply();
        setError(
          err instanceof ChatRequestError
            ? err.message
            : "We couldn't reach the assistant. Check your connection and try again.",
        );
      }
    } finally {
      controllerRef.current = null;
      setStatus("idle");
    }
  }

  /** Re-sends the last message after an error (without duplicating the user's bubble). */
  function retry() {
    if (lastPromptRef.current) void send(lastPromptRef.current, "retry");
  }

  function stop() {
    controllerRef.current?.abort();
  }

  /** Starts a brand-new conversation. */
  function reset() {
    controllerRef.current?.abort();
    conversationIdRef.current = null;
    lastPromptRef.current = null;
    writeStored(storageKey, null);
    setMessages([]);
    setError(null);
  }

  return { messages, status, busy, error, send, retry, stop, reset, loadHistory, dismissError: () => setError(null) };
}

export type StreamingChat = ReturnType<typeof useStreamingChat>;
