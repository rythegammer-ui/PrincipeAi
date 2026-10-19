/**
 * A stand-in for the Anthropic Messages API, so the `ai` Playwright project exercises the app's real Claude code path
 * (src/lib/ai.ts → @anthropic-ai/sdk → HTTP) with no network and no API key. playwright.config.ts starts it as a web
 * server and points the AI app server at it with ANTHROPIC_BASE_URL:
 *
 *   npx tsx tests/e2e/mock-anthropic.ts        # listens on 127.0.0.1:${E2E_MOCK_ANTHROPIC_PORT ?? 3402}
 *
 * - POST /v1/messages, stream: true  → a valid SSE stream: message_start, an empty "thinking" block, one text block
 *   sent as several text_delta events, message_delta (stop_reason "end_turn"), message_stop.
 * - POST /v1/messages, stream: false → the same message as one JSON response.
 *   Every reply contains MOCK_CLAUDE_MARKER. When the system prompt asks for "SUBJECT: … BODY: …" (email drafts), the
 *   reply uses that format so the app's parsers accept it.
 * - GET /__requests → every recorded request ({ id, method, path, headers, body }), oldest first.
 *   DELETE /__requests clears them. GET /health → 200 (Playwright's readiness check).
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { MOCK_ANTHROPIC_PORT, MOCK_CLAUDE_MARKER } from "./env";

type RecordedRequest = { id: number; method: string; path: string; headers: Record<string, string>; body: unknown };

const MAX_RECORDED = 1000;
const DELTA_DELAY_MS = 15;
const recorded: RecordedRequest[] = [];
let nextId = 1;

function systemText(system: unknown): string {
  if (typeof system === "string") return system;
  if (Array.isArray(system)) return system.map((b) => (b && typeof b === "object" && "text" in b ? String(b.text) : "")).join("\n");
  return "";
}

/** The reply's text: long enough for every caller (stored assessment plans need 400+ characters). */
function replyText(body: Record<string, unknown>, id: number): string {
  if (/SUBJECT:/.test(systemText(body.system))) {
    return [
      `SUBJECT: ${MOCK_CLAUDE_MARKER} subject line for you`,
      "BODY:",
      "Hi {{firstName}},",
      "",
      `This email was drafted by the ${MOCK_CLAUDE_MARKER} stand-in for Claude, so the end-to-end tests can check the real AI code path.`,
      "",
      "Pick one task you do every week and try it with an AI assistant today. [Book a free call]({{bookUrl}}) if you'd like a hand.",
      "",
      "Talk soon,",
      "The {{businessName}} team",
    ].join("\n");
  }
  return [
    `## ${MOCK_CLAUDE_MARKER} reply ${id}`,
    "",
    `This answer comes from the ${MOCK_CLAUDE_MARKER} stand-in for the Anthropic API, streamed in several pieces like a real Claude reply.`,
    "",
    "**Who they are**",
    "- A visitor exploring how AI can save them time each week.",
    "",
    "**Next best action**",
    "- Start with one repetitive task, write a clear prompt for it, and review the result before relying on it.",
    "- Keep a short list of the prompts that work, so the whole team can reuse them.",
    "",
    "That's a practical first step that builds confidence quickly, without new tools or a big budget.",
  ].join("\n");
}

function usage(body: Record<string, unknown>, outputTokens: number) {
  const input = Math.max(1, Math.round(JSON.stringify(body.messages ?? []).length / 4));
  return { input_tokens: input, output_tokens: outputTokens, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 };
}

function message(body: Record<string, unknown>, id: number, text: string) {
  return {
    id: `msg_mock_${id}`,
    type: "message",
    role: "assistant",
    model: typeof body.model === "string" ? body.model : "claude-opus-5-5",
    content: [
      { type: "thinking", thinking: "", signature: `mock-signature-${id}` },
      { type: "text", text },
    ],
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: usage(body, Math.ceil(text.length / 4)),
  };
}

/** Splits text into word-boundary pieces of roughly `size` characters (several text_delta events). */
function pieces(text: string, size = 60): string[] {
  return text.match(new RegExp(`[\\s\\S]{1,${size}}(?=\\s|$)|[\\s\\S]+?$`, "g"))?.filter(Boolean) ?? [text];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function streamMessage(res: ServerResponse, body: Record<string, unknown>, id: number, text: string) {
  const full = message(body, id, text);
  res.writeHead(200, { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache", "request-id": `req_mock_${id}` });
  const send = (event: string, data: unknown) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  send("message_start", { type: "message_start", message: { ...full, content: [], stop_reason: null, usage: { ...full.usage, output_tokens: 1 } } });
  // Adaptive thinking with nothing to show: an empty thinking block that only carries its signature.
  send("content_block_start", { type: "content_block_start", index: 0, content_block: { type: "thinking", thinking: "", signature: "" } });
  send("content_block_delta", { type: "content_block_delta", index: 0, delta: { type: "signature_delta", signature: `mock-signature-${id}` } });
  send("content_block_stop", { type: "content_block_stop", index: 0 });
  send("ping", { type: "ping" });
  send("content_block_start", { type: "content_block_start", index: 1, content_block: { type: "text", text: "" } });
  for (const piece of pieces(text)) {
    if (res.destroyed) return; // the app aborted the request (visitor pressed Stop / disconnected)
    send("content_block_delta", { type: "content_block_delta", index: 1, delta: { type: "text_delta", text: piece } });
    await sleep(DELTA_DELAY_MS);
  }
  send("content_block_stop", { type: "content_block_stop", index: 1 });
  send("message_delta", { type: "message_delta", delta: { stop_reason: "end_turn", stop_sequence: null }, usage: { output_tokens: full.usage.output_tokens } });
  send("message_stop", { type: "message_stop" });
  res.end();
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(data));
}

function apiError(res: ServerResponse, status: number, type: string, msg: string) {
  json(res, status, { type: "error", error: { type, message: msg } });
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

async function handle(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", "http://mock.invalid");
  if (url.pathname === "/health") return json(res, 200, { ok: true });
  if (url.pathname === "/__requests") {
    if (req.method === "DELETE") {
      recorded.length = 0;
      return json(res, 200, { ok: true });
    }
    return json(res, 200, recorded);
  }
  if (url.pathname !== "/v1/messages" || req.method !== "POST") return apiError(res, 404, "not_found_error", `No mock for ${req.method} ${url.pathname}`);

  const raw = await readBody(req);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return apiError(res, 400, "invalid_request_error", "Request body is not valid JSON.");
  }
  const id = nextId++;
  const headers = Object.fromEntries(Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v.join(", ") : (v ?? "")]));
  recorded.push({ id, method: req.method, path: url.pathname + url.search, headers, body });
  if (recorded.length > MAX_RECORDED) recorded.splice(0, recorded.length - MAX_RECORDED);

  if (!headers["x-api-key"] && !headers.authorization) return apiError(res, 401, "authentication_error", "Missing API key.");
  if (typeof body.model !== "string" || !Array.isArray(body.messages) || typeof body.max_tokens !== "number") {
    return apiError(res, 400, "invalid_request_error", "model, messages and max_tokens are required.");
  }

  const text = replyText(body, id);
  if (body.stream === true) return streamMessage(res, body, id, text);
  return json(res, 200, message(body, id, text));
}

const server = createServer((req, res) => {
  handle(req, res).catch((err: unknown) => {
    console.error("[mock-anthropic]", err);
    if (!res.headersSent) apiError(res, 500, "api_error", "Mock server error.");
    else res.end();
  });
});

server.listen(MOCK_ANTHROPIC_PORT, "127.0.0.1", () => {
  console.log(`[mock-anthropic] listening on http://127.0.0.1:${MOCK_ANTHROPIC_PORT}`);
});

function shutdown() {
  server.close(() => process.exit(0));
  server.closeAllConnections();
  setTimeout(() => process.exit(0), 1_000).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
