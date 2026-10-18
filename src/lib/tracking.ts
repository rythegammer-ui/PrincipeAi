import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb, schema } from "@/db";
import type { UtmParams } from "@/db/schema";

/** Cookie names — set by src/proxy.ts on the first page view. */
export const VISITOR_COOKIE = "pa_vid";
export const UTM_COOKIE = "pa_utm";
export const REFERRER_COOKIE = "pa_ref";
export const LANDING_COOKIE = "pa_land";

/** Event names accepted from the browser via /api/track. Server code may record any FunnelEventName. */
export const CLIENT_EVENTS = ["page_view", "cta_click", "quiz_started", "booking_viewed", "guide_viewed", "chat_opened"] as const;

export const FUNNEL_EVENTS = [
  ...CLIENT_EVENTS,
  "optin",
  "quiz_completed",
  "booking_created",
  "checkout_started",
  "purchase",
  "chat_started",
  "chat_lead",
  "contact_form",
  "application",
] as const;
export type FunnelEventName = (typeof FUNNEL_EVENTS)[number];

export type VisitorContext = {
  visitorId: string | null;
  utm: UtmParams;
  referrer: string | null;
  landingPage: string | null;
};

function parseUtm(raw: string | undefined): UtmParams {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw) as Record<string, unknown>;
    const out: UtmParams = {};
    for (const k of ["source", "medium", "campaign", "term", "content"] as const) {
      if (typeof v[k] === "string") out[k] = (v[k] as string).slice(0, 200);
    }
    return out;
  } catch {
    return {};
  }
}

/** Attribution data for the current request (first-touch UTM, referrer, landing page). */
export async function getVisitorContext(): Promise<VisitorContext> {
  const c = await cookies();
  const vid = c.get(VISITOR_COOKIE)?.value;
  return {
    visitorId: vid && /^[a-zA-Z0-9-]{8,64}$/.test(vid) ? vid : null,
    utm: parseUtm(c.get(UTM_COOKIE)?.value),
    referrer: c.get(REFERRER_COOKIE)?.value?.slice(0, 500) ?? null,
    landingPage: c.get(LANDING_COOKIE)?.value?.slice(0, 500) ?? null,
  };
}

/** Records a funnel event. Never throws — analytics must not break user flows. */
export async function trackEvent(input: {
  name: FunnelEventName;
  path?: string | null;
  props?: Record<string, unknown>;
  contactId?: string | null;
  visitorId?: string | null;
  referrer?: string | null;
}): Promise<void> {
  try {
    const ctx = input.visitorId ? null : await getVisitorContext();
    const visitorId = input.visitorId ?? ctx?.visitorId ?? (input.contactId ? `contact:${input.contactId}` : null);
    if (!visitorId) return;
    const db = await getDb();
    await db.insert(schema.events).values({
      visitorId,
      contactId: input.contactId ?? null,
      name: input.name,
      path: input.path?.slice(0, 500) ?? null,
      referrer: input.referrer?.slice(0, 500) ?? ctx?.referrer ?? null,
      utm: ctx?.utm ?? {},
      props: input.props ?? {},
    });
  } catch (err) {
    console.error("[tracking] failed to record event", input.name, err);
  }
}

/** Attaches a visitor's anonymous events to a contact once they identify themselves. */
export async function linkVisitorToContact(visitorId: string | null, contactId: string): Promise<void> {
  if (!visitorId) return;
  const db = await getDb();
  await db
    .update(schema.events)
    .set({ contactId })
    .where(and(eq(schema.events.visitorId, visitorId), isNull(schema.events.contactId)));
}
