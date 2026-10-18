import { NextResponse, type NextRequest } from "next/server";
import { authorizeCron, runScheduledJobs } from "@/lib/jobs";

// Always run on request; never cache the result.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Scheduled maintenance (Vercel Cron, see vercel.json): automation emails, booking reminders,
 * expired holds / checkouts and cleanup. Requires `Authorization: Bearer <CRON_SECRET>`.
 */
export async function GET(request: NextRequest) {
  const auth = authorizeCron(request.headers.get("authorization"));
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const summary = await runScheduledJobs();
  return NextResponse.json(summary, { status: summary.ok ? 200 : 500, headers: { "Cache-Control": "no-store" } });
}
