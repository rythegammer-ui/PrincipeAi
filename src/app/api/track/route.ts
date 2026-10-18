import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rateLimitByIp } from "@/lib/rate-limit";
import { CLIENT_EVENTS, trackEvent } from "@/lib/tracking";

const Body = z.object({
  name: z.enum(CLIENT_EVENTS),
  path: z.string().max(500).optional(),
  props: z.record(z.string(), z.unknown()).optional(),
});

/** Browser analytics beacon. Only whitelisted client events are accepted. */
export async function POST(request: NextRequest) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const limit = await rateLimitByIp("track", 120, 60);
  if (!limit.ok) return NextResponse.json({ ok: false }, { status: 429 });
  const { name, path, props = {} } = parsed.data;
  // Keep props small + flat.
  const safeProps = Object.fromEntries(
    Object.entries(props)
      .slice(0, 12)
      .map(([k, v]) => [k.slice(0, 40), typeof v === "string" ? v.slice(0, 300) : typeof v === "number" || typeof v === "boolean" ? v : null]),
  );
  await trackEvent({
    name,
    path,
    props: safeProps,
    referrer: typeof safeProps.referrer === "string" ? safeProps.referrer : null,
  });
  return NextResponse.json({ ok: true });
}
