import { toCsv } from "@/components/admin/crm-utils";
import { assertAdmin } from "@/lib/auth";
import { exportContacts, parseContactFilters } from "@/lib/crm-queries";

export const dynamic = "force-dynamic";

const HEADER = [
  "email",
  "name",
  "phone",
  "company",
  "website",
  "stage",
  "lead_score",
  "segment",
  "source",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "referrer",
  "landing_page",
  "tags",
  "deal_value_usd",
  "lifetime_value_usd",
  "unsubscribed",
  "created_at",
  "last_activity_at",
];

/** GET /api/admin/contacts/export?<contact list filters> — CSV of the filtered contacts (admin only). */
export async function GET(request: Request) {
  try {
    await assertAdmin();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const filters = parseContactFilters(new URL(request.url).searchParams);
  const rows = await exportContacts(filters);
  const csv = toCsv(
    HEADER,
    rows.map((r) => [
      r.email,
      r.name,
      r.phone,
      r.company,
      r.website,
      r.stage,
      r.score,
      r.segment,
      r.source,
      r.utm?.source,
      r.utm?.medium,
      r.utm?.campaign,
      r.referrer,
      r.landingPage,
      r.tags,
      r.dealValueCents / 100,
      r.lifetimeValueCents / 100,
      r.unsubscribed,
      r.createdAt,
      r.lastActivityAt,
    ]),
  );
  const date = new Date().toISOString().slice(0, 10);
  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="principe-contacts-${date}.csv"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
