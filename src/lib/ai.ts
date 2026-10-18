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
 * One-shot completion. Returns the response text, or null when AI isn't configured
 * or the request failed (callers must provide a non-AI fallback).
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
    if (message.stop_reason === "refusal") return REFUSAL_MESSAGE;
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

/**
 * Streams plain-text deltas as a web ReadableStream (for Route Handlers).
 * - If AI isn't configured, streams `fallbackText` instead.
 * - `onComplete` receives the full text once streaming finishes (persist transcripts here).
 */
export function aiStream(
  opts: AiTextOptions & { fallbackText: string; onComplete?: (fullText: string) => Promise<void> | void },
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = "";
      const push = (t: string) => {
        full += t;
        controller.enqueue(encoder.encode(t));
      };
      if (!aiEnabled()) {
        // Simulate streaming so the UI behaves the same with or without an API key.
        for (const chunk of opts.fallbackText.match(/.{1,24}(\s|$)|.+/gs) ?? [opts.fallbackText]) {
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
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              push(event.delta.text);
            }
          }
          const final = await stream.finalMessage();
          if (final.stop_reason === "refusal") push(full ? `\n\n${REFUSAL_MESSAGE}` : REFUSAL_MESSAGE);
        } catch (err) {
          logAiError(err);
          push(full ? "\n\n(Sorry — the connection was interrupted. Please try again.)" : opts.fallbackText);
        }
      }
      try {
        await opts.onComplete?.(full);
      } catch (err) {
        console.error("[ai] onComplete failed", err);
      }
      controller.close();
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
