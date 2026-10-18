import { NextResponse, type NextRequest } from "next/server";
import { bookingIcs, getBookingDetails, isManageToken, rescheduleCount } from "@/lib/booking-service";
import { rateLimitByIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** GET /api/bookings/<manageToken>/ics → downloadable calendar file for the booking. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isManageToken(token)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const limit = await rateLimitByIp("booking-ics", 60, 60);
  if (!limit.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });

  const details = await getBookingDetails({ token });
  if (!details) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cancelled = details.booking.status === "cancelled";
  const sequence = await rescheduleCount(details.booking.id);
  const ics = bookingIcs(details, cancelled ? "CANCEL" : "PUBLISH", sequence + (cancelled ? 1 : 0));
  const filename = `${details.meetingType.slug}-${details.booking.startAt.toISOString().slice(0, 10)}.ics`;

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
