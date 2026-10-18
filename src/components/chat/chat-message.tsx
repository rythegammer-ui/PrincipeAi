"use client";

import { Check, Copy, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/utils";
import type { ChatUiMessage } from "./use-streaming-chat";

/** Markdown tuned for narrow chat bubbles: tight spacing, wrapping code blocks for copy-paste prompts. */
const BUBBLE_MARKDOWN =
  "prose-sm text-zinc-800 prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-headings:mt-3 prose-headings:mb-1.5 prose-headings:text-sm prose-pre:my-2 prose-pre:rounded-xl prose-pre:px-3 prose-pre:py-2.5 prose-pre:text-xs prose-pre:leading-relaxed prose-table:text-xs [&_pre]:break-words [&_pre]:whitespace-pre-wrap [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-zinc-100 [&>:first-child]:mt-0 [&>:last-child]:mb-0";

export function AssistantAvatar({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-900/20",
        className,
      )}
    >
      <Sparkles className="size-3.5" />
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          /* clipboard blocked — nothing to do */
        }
      }}
      className="inline-flex min-h-8 items-center gap-1 rounded-md px-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
    >
      {copied ? <Check className="size-3.5 text-emerald-600" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      {copied ? "Copied" : "Copy"}
      <span className="sr-only"> reply</span>
    </button>
  );
}

/** One chat message. Visitor text is rendered as plain text; assistant output as safe Markdown. */
export function ChatBubble({
  message,
  assistantLabel = "Assistant",
  userLabel = "You",
  showCopy = true,
}: {
  message: Pick<ChatUiMessage, "role" | "content" | "state">;
  assistantLabel?: string;
  userLabel?: string;
  showCopy?: boolean;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-brand-600 px-3.5 py-2 text-[15px] leading-relaxed whitespace-pre-wrap text-white shadow-sm shadow-brand-900/10 [overflow-wrap:anywhere] sm:text-sm">
          <span className="sr-only">{userLabel}: </span>
          {message.content}
        </div>
      </div>
    );
  }
  const streaming = message.state === "streaming";
  return (
    <div className="flex items-start gap-2.5">
      <AssistantAvatar className="mt-0.5" />
      <div className="min-w-0 max-w-[calc(100%-2.5rem)]">
        <div className="rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 shadow-soft ring-1 ring-zinc-200/70 [overflow-wrap:anywhere]">
          <span className="sr-only">{assistantLabel}: </span>
          <Markdown className={BUBBLE_MARKDOWN}>{message.content}</Markdown>
        </div>
        {showCopy && !streaming && message.content.trim() && (
          <div className="mt-1 flex">
            <CopyButton text={message.content} />
          </div>
        )}
      </div>
    </div>
  );
}

/** Three-dot "thinking" indicator shown until the first tokens arrive. */
export function TypingIndicator({ label = "Assistant is typing" }: { label?: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <AssistantAvatar className="mt-0.5" />
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-md bg-white px-4 py-3.5 shadow-soft ring-1 ring-zinc-200/70">
        <span className="sr-only">{label}…</span>
        {[0, 150, 300].map((delay) => (
          <span key={delay} aria-hidden className="size-1.5 animate-bounce rounded-full bg-brand-400" style={{ animationDelay: `${delay}ms` }} />
        ))}
      </div>
    </div>
  );
}

/**
 * Click handler for a transcript container: same-site links in AI answers navigate
 * client-side (so the chat keeps its state) instead of reloading the page.
 */
export function useInternalLinkNavigation(onNavigate?: (href: string) => void) {
  const router = useRouter();
  return (event: MouseEvent<HTMLElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = (event.target as HTMLElement).closest("a");
    const href = anchor?.getAttribute("href");
    if (!anchor || !href || anchor.target === "_blank" || !href.startsWith("/") || href.startsWith("//")) return;
    event.preventDefault();
    router.push(href);
    onNavigate?.(href);
  };
}
