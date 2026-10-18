import { DateTime } from "luxon";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getBookingDetails } from "@/lib/booking-service";
import { rateLimitByIp } from "@/lib/rate-limit";
import { getAvailability } from "@/lib/scheduling";

// Availability changes with every booking — never cache.
export const dynamic = "force-dynamic";

const MAX_SPAN_DAYS = 45;

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .refine((v) => DateTime.fromISO(v, { zone: "utc" }).isValid, "Invalid date");

const Query = z
  .object({
    type: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/, "Invalid meeting type"),
    from: isoDate,
    to: isoDate,
    /** Manage token of a booking being rescheduled: its own time is treated as free. */
    reschedule: z
      .string()
      .regex(/^[0-9a-f]{32}$/i)
      .optional(),
  })
  .refine(
    (q) => {
      const span = DateTime.fromISO(q.to, { zone: "utc" }).diff(DateTime.fromISO(q.from, { zone: "utc" }), "days").days;
      return span >= 0 && span <= MAX_SPAN_DAYS;
    },
    { message: `The date range must be between 0 and ${MAX_SPAN_DAYS} days`, path: ["to"] },
  );

/** GET /api/slots?type=<slug>&from=YYYY-MM-DD&to=YYYY-MM-DD → { slots: ISO UTC strings, businessTimezone } */
export async function GET(request: NextRequest) {
  const parsed = Query.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const limit = await rateLimitByIp("slots", 120, 60);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429, headers: { "Retry-After": "60" } });
  }

  const { type, from, to, reschedule } = parsed.data;
  let excludeBookingId: string | undefined;
  if (reschedule) {
    const existing = await getBookingDetails({ token: reschedule });
    if (existing && existing.meetingType.slug === type && existing.booking.status === "confirmed") {
      excludeBookingId = existing.booking.id;
    }
  }

  try {
    const result = await getAvailability(type, from, to, { excludeBookingId, includeInactive: Boolean(excludeBookingId) });
    if (!result) return NextResponse.json({ error: "This meeting type isn't available." }, { status: 404 });
    return NextResponse.json(
      { slots: result.slots, businessTimezone: result.businessTimezone },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[api/slots] failed", err);
    return NextResponse.json({ error: "Couldn't load availability. Please try again." }, { status: 500 });
  }
}
