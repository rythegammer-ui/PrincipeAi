import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { BetaMessageParam, BetaTextBlockParam } from "@anthropic-ai/sdk/resources/beta/messages/messages";

/**
 * Claude model used for every AI feature. Defaults to Claude Opus 5.5; override with
 * ANTHROPIC_MODEL (e.g. "claude-sonnet-5-5" or "claude-haiku-5-5" for lower cost).
 */
export const AI_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

/**
 * Server-side refusal fallback: if the model declines for policy reasons, the API
 * re-runs the request on the server-defined fallback model inside the same call.
 */
const FALLBACK_BETA = "server-side-fallback-2026-07-01" as const;

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";
export type AiMessage = { role: "user" | "assistant"; content: string };

export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

/** Default site-wide ceiling on visitor-triggered AI replies per day (see `claimPublicAiReply`). */
export const DEFAULT_AI_DAILY_LIMIT = 2000;

/** The site-wide daily ceiling: AI_DAILY_LIMIT when set to a whole number (0 = no ceiling), else the default. */
export function publicAiDailyLimit(): number {
  const raw = process.env.AI_DAILY_LIMIT?.trim();
  const n = raw ? Number(raw) : Number.NaN;
  return Number.isInteger(n) && n >= 0 ? n : DEFAULT_AI_DAILY_LIMIT;
}

/**
 * Counts one visitor-triggered AI reply (website chat, course tutor) against a site-wide daily ceiling, on top
 * of their per-visitor limits: a cap on spend however many addresses are used. Returns false once the ceiling
 * is spent; the caller then streams its non-AI fallback (`aiStream({ useFallback: true })`) until it resets.
 */
export async function claimPublicAiReply(): Promise<boolean> {
  if (!aiEnabled()) return true;
  const limit = publicAiDailyLimit();
  if (limit === 0) return true;
  const { rateLimit } = await import("@/lib/rate-limit");
  const { ok } = await rateLimit("ai:global:day", limit, 24 * 60 * 60);
  if (!ok) console.warn("[ai] site-wide daily AI reply limit reached; using the non-AI fallback");
  return ok;
}

let client: Anthropic | null = null;
export function anthropic(): Anthropic {
  if (!client) client = new Anthropic({ maxRetries: 2, timeout: 120_000 });
  return client;
}

/** System prompt as a cacheable block (keep it byte-stable across requests for cache hits). */
function systemBlocks(system: string): BetaTextBlockParam[] {
  return [{ type: "text", text: system, cache_control: { type: "ephemeral" } }];
}

function toParams(messages: AiMessage[]): BetaMessageParam[] {
  return messages
    .filter((m) => m.content.trim().length > 0)
    .map((m) => ({ role: m.role, content: m.content }));
}

export const REFUSAL_MESSAGE =
  "I'm not able to help with that one. Feel free to ask me anything else about using AI in your life or business!";

export type AiTextOptions = {
  system: string;
  messages: AiMessage[];
  /** Thinking depth / token spend. "low" for chat, "medium" for analysis. */
  effort?: Effort;
  maxTokens?: number;
};

/**
 * One-shot completion. Returns the response text, or null when AI isn't configured, the
 * request failed or the model declined (callers must provide a non-AI fallback).
 */
export async function aiText(opts: AiTextOptions): Promise<string | null> {
  if (!aiEnabled()) return null;
  try {
    const stream = anthropic().beta.messages.stream({
      model: AI_MODEL,
      max_tokens: opts.maxTokens ?? 16000,
      system: systemBlocks(opts.system),
      messages: toParams(opts.messages),
      output_config: { effort: opts.effort ?? "medium" },
      betas: [FALLBACK_BETA],
      fallbacks: "default",
    });
    const message = await stream.finalMessage();
    if (message.stop_reason === "refusal") {
      // Never hand the visitor-facing refusal sentence to callers as if it were the answer.
      console.warn("[ai] request declined (refusal); using the non-AI fallback");
      return null;
    }
    const text = message.content
      .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
      .map((b) => b.text)
      .join("");
    return text.trim() || null;
  } catch (err) {
    logAiError(err);
    return null;
  }
}

/** How a streamed reply ended (second argument of `aiStream`'s `onComplete`). */
export type AiStreamInfo = {
  /** "ai" = model output; "fallback" = `fallbackText` / `refusalText` was streamed instead. */
  source: "ai" | "fallback";
  /** The model declined. `fullText` is then only the refusal/fallback text (a declined partial is dropped). */
  refused: boolean;
  /** The reply didn't finish: the client disconnected / pressed Stop, or the API failed mid-reply. */
  interrupted: boolean;
};

export type AiStreamOptions = AiTextOptions & {
  /** Streamed when AI isn't configured, or the request fails before any text arrived. */
  fallbackText: string;
  /** Stream `fallbackText` without calling the API (e.g. past the daily ceiling of `claimPublicAiReply`). */
  useFallback?: boolean;
  /** Streamed when the model declines. Defaults to `fallbackText` before any output, `REFUSAL_MESSAGE` after. */
  refusalText?: string;
  /**
   * Also call `onComplete` (with `interrupted: true`) when the client disconnects or presses Stop,
   * so a chat keeps the part of the reply the visitor already saw. Off by default, so callers that
   * store only finished output (e.g. plans) never persist a fragment.
   */
  completeOnCancel?: boolean;
  /** Receives the text the client was sent once streaming ends (persist transcripts here). */
  onComplete?: (fullText: string, info: AiStreamInfo) => Promise<void> | void;
};

/**
 * Streams plain-text deltas as a web ReadableStream (for Route Handlers).
 * - If AI isn't configured, streams `fallbackText` instead.
 * - On a refusal, streams `refusalText` (see `AiStreamOptions`).
 * - If the client goes away, the upstream request is aborted (no tokens are wasted).
 * - `onComplete` receives the full text once streaming finishes (persist transcripts here).
 */
export function aiStream(opts: AiStreamOptions): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  // Shared by start() and cancel(): a client disconnect / Stop cancels this stream.
  let cancelled = false;
  let sdkStream: { abort(): void } | null = null;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = "";
      let completeText: string | null = null; // overrides `full` for onComplete (refusals)
      const info: AiStreamInfo = { source: "ai", refused: false, interrupted: false };
      // `full` is what the client was actually sent.
      const push = (t: string) => {
        if (cancelled) return;
        try {
          controller.enqueue(encoder.encode(t));
          full += t;
        } catch {
          cancelled = true; // the consumer is gone
        }
      };

      if (!aiEnabled() || opts.useFallback) {
        info.source = "fallback";
        // Simulate streaming so the UI behaves the same with or without an API key.
        for (const chunk of opts.fallbackText.match(/.{1,24}(\s|$)|.+/gs) ?? [opts.fallbackText]) {
          if (cancelled) break;
          push(chunk);
          await new Promise((r) => setTimeout(r, 15));
        }
      } else {
        try {
          const stream = anthropic().beta.messages.stream({
            model: AI_MODEL,
            max_tokens: opts.maxTokens ?? 64000,
            system: systemBlocks(opts.system),
            messages: toParams(opts.messages),
            output_config: { effort: opts.effort ?? "low" },
            betas: [FALLBACK_BETA],
            fallbacks: "default",
          });
          sdkStream = stream;
          if (cancelled) stream.abort();
          for await (const event of stream) {
            if (cancelled) break;
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              push(event.delta.text);
            }
          }
          if (!cancelled) {
            const final = await stream.finalMessage();
            if (final.stop_reason === "refusal") {
              info.refused = true;
              if (full) {
                // Show the notice after what the visitor already saw, but don't keep the declined partial.
                completeText = opts.refusalText ?? REFUSAL_MESSAGE;
                push(`\n\n${completeText}`);
              } else {
                info.source = "fallback";
                completeText = opts.refusalText ?? opts.fallbackText;
                push(completeText);
              }
            }
          }
        } catch (err) {
          if (!cancelled && !(err instanceof Anthropic.APIUserAbortError)) {
            logAiError(err);
            if (full) {
              info.interrupted = true;
              push("\n\n(Sorry — the connection was interrupted. Please try again.)");
            } else {
              info.source = "fallback";
              push(opts.fallbackText);
            }
          }
        }
      }

      if (cancelled) info.interrupted = true;
      if (!cancelled || opts.completeOnCancel) {
        try {
          await opts.onComplete?.(completeText ?? full, info);
        } catch (err) {
          console.error("[ai] onComplete failed", err);
        }
      }
      if (!cancelled) {
        try {
          controller.close();
        } catch {
          // already closed by a disconnect
        }
      }
    },
    cancel() {
      cancelled = true;
      sdkStream?.abort();
    },
  });
}

/** Response helper for streaming text to the browser. */
export function textStreamResponse(stream: ReadableStream<Uint8Array>, init: ResponseInit = {}): Response {
  return new Response(stream, {
    ...init,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...init.headers,
    },
  });
}

function logAiError(err: unknown) {
  if (err instanceof Anthropic.RateLimitError) console.error("[ai] rate limited");
  else if (err instanceof Anthropic.AuthenticationError) console.error("[ai] invalid ANTHROPIC_API_KEY");
  else if (err instanceof Anthropic.APIError) console.error(`[ai] API error ${err.status}: ${err.message}`);
  else console.error("[ai] request failed", err);
}
