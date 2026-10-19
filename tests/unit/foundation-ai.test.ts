import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** Scripted fake of the Anthropic SDK's message stream. */
type Script = { deltas: string[]; stopReason: string; delayMs?: number; fail?: Error };
const sdk = vi.hoisted(() => ({ script: { deltas: [], stopReason: "end_turn" } as Script, aborted: 0 }));

vi.mock("@anthropic-ai/sdk", () => {
  class APIUserAbortError extends Error {}
  class APIError extends Error {
    status = 500;
  }
  class Anthropic {
    static APIUserAbortError = APIUserAbortError;
    static APIError = APIError;
    static RateLimitError = class extends APIError {};
    static AuthenticationError = class extends APIError {};
    beta = {
      messages: {
        stream: () => {
          const { deltas, stopReason, delayMs = 0, fail } = sdk.script;
          let aborted = false;
          return {
            abort() {
              aborted = true;
              sdk.aborted++;
            },
            async *[Symbol.asyncIterator]() {
              for (const text of deltas) {
                if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
                if (aborted) throw new APIUserAbortError("aborted");
                yield { type: "content_block_delta", delta: { type: "text_delta", text } };
              }
              if (fail) throw fail;
            },
            async finalMessage() {
              if (aborted) throw new APIUserAbortError("aborted");
              return { stop_reason: stopReason, content: [{ type: "text", text: deltas.join("") }] };
            },
          };
        },
      },
    };
  }
  return { default: Anthropic };
});

const { aiStream, aiText, REFUSAL_MESSAGE } = await import("@/lib/ai");

async function readAll(stream: ReadableStream<Uint8Array>): Promise<string> {
  return new Response(stream).text();
}

beforeEach(() => {
  vi.stubEnv("ANTHROPIC_API_KEY", "sk-test");
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  sdk.aborted = 0;
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("aiText", () => {
  it("returns the model text", async () => {
    sdk.script = { deltas: ["Hello", " there"], stopReason: "end_turn" };
    expect(await aiText({ system: "s", messages: [{ role: "user", content: "hi" }] })).toBe("Hello there");
  });

  it("returns null on a refusal so callers use their own fallback", async () => {
    sdk.script = { deltas: [], stopReason: "refusal" };
    expect(await aiText({ system: "s", messages: [{ role: "user", content: "hi" }] })).toBeNull();
  });
});

describe("aiStream", () => {
  const base = { system: "s", messages: [{ role: "user" as const, content: "hi" }], fallbackText: "FALLBACK PLAN" };

  it("streams the reply and reports it as AI output", async () => {
    sdk.script = { deltas: ["a", "b"], stopReason: "end_turn" };
    const onComplete = vi.fn();
    expect(await readAll(aiStream({ ...base, onComplete }))).toBe("ab");
    expect(onComplete).toHaveBeenCalledWith("ab", { source: "ai", refused: false, interrupted: false });
  });

  it("streams the fallback (or refusalText) when the model declines before writing anything", async () => {
    sdk.script = { deltas: [], stopReason: "refusal" };
    const onComplete = vi.fn();
    expect(await readAll(aiStream({ ...base, onComplete }))).toBe("FALLBACK PLAN");
    expect(onComplete).toHaveBeenCalledWith("FALLBACK PLAN", { source: "fallback", refused: true, interrupted: false });

    const chat = vi.fn();
    expect(await readAll(aiStream({ ...base, refusalText: REFUSAL_MESSAGE, onComplete: chat }))).toBe(REFUSAL_MESSAGE);
  });

  it("drops a declined partial from what gets persisted", async () => {
    sdk.script = { deltas: ["Here is the start"], stopReason: "refusal" };
    const onComplete = vi.fn();
    const shown = await readAll(aiStream({ ...base, refusalText: REFUSAL_MESSAGE, onComplete }));
    expect(shown).toBe(`Here is the start\n\n${REFUSAL_MESSAGE}`);
    expect(onComplete).toHaveBeenCalledWith(REFUSAL_MESSAGE, { source: "ai", refused: true, interrupted: false });
  });

  it("on Stop / disconnect: aborts upstream, doesn't log an API error, and hands over the partial only when asked", async () => {
    for (const completeOnCancel of [true, false]) {
      sdk.script = { deltas: ["chunk0 ", "chunk1 ", "chunk2 ", "chunk3 "], stopReason: "end_turn", delayMs: 20 };
      sdk.aborted = 0;
      const onComplete = vi.fn();
      const reader = aiStream({ ...base, completeOnCancel, onComplete }).getReader();
      const first = await reader.read();
      expect(new TextDecoder().decode(first.value)).toBe("chunk0 ");
      await reader.cancel();
      await new Promise((r) => setTimeout(r, 120));
      expect(sdk.aborted).toBe(1);
      expect(console.error).not.toHaveBeenCalled();
      if (completeOnCancel) {
        expect(onComplete).toHaveBeenCalledTimes(1);
        expect(onComplete.mock.calls[0][0]).toMatch(/^chunk0 /);
        expect(onComplete.mock.calls[0][1]).toMatchObject({ source: "ai", interrupted: true });
      } else {
        expect(onComplete).not.toHaveBeenCalled();
      }
    }
  });

  it("falls back cleanly when the API fails before any output", async () => {
    sdk.script = { deltas: [], stopReason: "end_turn", fail: new Error("boom") };
    const onComplete = vi.fn();
    expect(await readAll(aiStream({ ...base, onComplete }))).toBe("FALLBACK PLAN");
    expect(onComplete).toHaveBeenCalledWith("FALLBACK PLAN", { source: "fallback", refused: false, interrupted: false });
  });
});
