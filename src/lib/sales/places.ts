import "server-only";
import { inArray, sql } from "drizzle-orm";
import { DateTime } from "luxon";
import { getDb, schema } from "@/db";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Google Places API (New) for the agent portal's business search (Agent portal → Leads). Needs `GOOGLE_MAPS_API_KEY`
 * (a Google Cloud key with "Places API (New)" enabled and billing on); without it, search is off and agents add
 * businesses by hand. Every call is metered, so each agent has a daily allowance and the whole site a monthly one
 * (env overrides below); both fail closed. The site allowance counts per calendar month in Pacific time, like Google's
 * billing (and its free monthly allowance). A call Google refused, or one the allowance stopped, isn't counted.
 *
 * Google's terms: results are shown with Google Maps attribution and a link to the place on Google Maps; we store only
 * place IDs (plus the name the agent saves), and fetch details again when they're needed.
 */

const SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const DETAILS_URL = "https://places.googleapis.com/v1/places/";
const TIMEOUT_MS = 8000;

// Text Search: only fields from the cheaper "Pro" tier. Details: website and phone (the "Enterprise" tier), one place at a time.
const SEARCH_FIELDS = "places.id,places.displayName,places.formattedAddress,places.primaryTypeDisplayName,places.businessStatus,places.googleMapsUri";
const DETAILS_FIELDS = "id,displayName,formattedAddress,websiteUri,nationalPhoneNumber,googleMapsUri,businessStatus";

/** Google place IDs: letters, digits, "-" and "_" (we also use them in URLs and as database keys). */
export const PLACE_ID_RE = /^[A-Za-z0-9_-]{10,300}$/;

export type PlaceResult = {
  placeId: string;
  name: string;
  address: string;
  category: string | null;
  mapsUrl: string | null;
  /** False for businesses Google lists as closed. */
  operational: boolean;
};

export type PlaceDetails = PlaceResult & { website: string | null; phone: string | null };

export type PlacesError = "not_configured" | "agent_limit" | "site_limit" | "unavailable";
export type PlacesResponse<T> = { ok: true; data: T } | { ok: false; error: PlacesError };

function envInt(name: string, fallback: number): number {
  const n = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** Allowances: per agent per day, and for the whole site per 30 days. */
export function placesLimits() {
  return {
    searchesPerAgentPerDay: envInt("PLACES_SEARCHES_PER_AGENT_PER_DAY", 25),
    detailsPerAgentPerDay: envInt("PLACES_DETAILS_PER_AGENT_PER_DAY", 60),
    searchesPerMonth: envInt("PLACES_SEARCHES_PER_MONTH", 1000),
    detailsPerMonth: envInt("PLACES_DETAILS_PER_MONTH", 1000),
  };
}

export function placesConfigured(): boolean {
  return Boolean(process.env.GOOGLE_MAPS_API_KEY?.trim());
}

type Kind = "search" | "details";

/** rate_limits keys of the site-wide monthly counters start with this (lib/jobs.ts keeps them for the whole month). */
export const PLACES_SITE_KEY_PREFIX = "places-site:";
/** How long the cleanup job keeps a monthly counter: longer than any month. */
export const PLACES_SITE_RETENTION_MS = 35 * 24 * 60 * 60 * 1000;

/** The site counter for `kind` in the current Google billing month (Pacific time), e.g. "places-site:search:2026-10". */
export function placesSiteKey(kind: Kind, now = new Date()): string {
  return `${PLACES_SITE_KEY_PREFIX}${kind}:${DateTime.fromJSDate(now).setZone("America/Los_Angeles").toFormat("yyyy-MM")}`;
}

/** Gives back counted calls (best effort). */
async function refund(keys: string[]): Promise<void> {
  try {
    const db = await getDb();
    await db
      .update(schema.rateLimits)
      .set({ count: sql`greatest(${schema.rateLimits.count} - 1, 0)` })
      .where(inArray(schema.rateLimits.key, keys));
  } catch (err) {
    console.error("[places] refund failed", err);
  }
}

/** Spends one call from the agent's daily and the site's monthly allowance; on success, the keys to refund if Google refuses it. */
async function spend(kind: Kind, agentId: string): Promise<{ error: PlacesError } | { keys: string[] }> {
  const limits = placesLimits();
  const perAgent = kind === "search" ? limits.searchesPerAgentPerDay : limits.detailsPerAgentPerDay;
  const perMonth = kind === "search" ? limits.searchesPerMonth : limits.detailsPerMonth;
  const agentKey = `places-${kind}:${agentId}`;
  const agent = await rateLimit(agentKey, perAgent, 24 * 60 * 60);
  if (!agent.ok) {
    await refund([agentKey]);
    return { error: "agent_limit" };
  }
  const siteKey = placesSiteKey(kind);
  // A month-long window on a per-month key: the count only starts over with next month's key.
  const site = await rateLimit(siteKey, perMonth, 32 * 24 * 60 * 60);
  if (!site.ok) {
    await refund([agentKey, siteKey]);
    return { error: "site_limit" };
  }
  return { keys: [agentKey, siteKey] };
}

type RawPlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  primaryTypeDisplayName?: { text?: string };
  businessStatus?: string;
  googleMapsUri?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
};

/** Only http(s) links leave this module (they're rendered as hrefs). */
function safeUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function toResult(p: RawPlace): PlaceResult | null {
  const placeId = p.id ?? "";
  const name = p.displayName?.text?.trim() ?? "";
  if (!PLACE_ID_RE.test(placeId) || !name) return null;
  return {
    placeId,
    name: name.slice(0, 200),
    address: (p.formattedAddress ?? "").slice(0, 300),
    category: p.primaryTypeDisplayName?.text?.slice(0, 100) ?? null,
    mapsUrl: safeUrl(p.googleMapsUri),
    operational: !p.businessStatus || p.businessStatus === "OPERATIONAL",
  };
}

/** Calls Google. A call Google answered with an error is given back to the allowance (`keys`); a timeout isn't, as it may have been served. */
async function call(url: string, init: RequestInit, fieldMask: string, keys: string[]): Promise<unknown | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!key) return null;
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": fieldMask, ...(init.headers ?? {}) },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[places] request failed", res.status, (await res.text().catch(() => "")).slice(0, 300));
      await refund(keys);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("[places] request error", err);
    return null;
  }
}

/** Businesses matching "what" near "where" (US only), at most 20. */
export async function searchPlaces(agentId: string, what: string, where: string): Promise<PlacesResponse<PlaceResult[]>> {
  if (!placesConfigured()) return { ok: false, error: "not_configured" };
  const spent = await spend("search", agentId);
  if ("error" in spent) return { ok: false, error: spent.error };
  const json = (await call(
    SEARCH_URL,
    { method: "POST", body: JSON.stringify({ textQuery: `${what} in ${where}`, pageSize: 20, regionCode: "US", languageCode: "en" }) },
    SEARCH_FIELDS,
    spent.keys,
  )) as { places?: RawPlace[] } | null;
  if (!json) return { ok: false, error: "unavailable" };
  const results = (json.places ?? []).map(toResult).filter((p): p is PlaceResult => p !== null);
  return { ok: true, data: results };
}

/** One business's address, website and phone, fetched fresh (not stored). */
export async function placeDetails(agentId: string, placeId: string): Promise<PlacesResponse<PlaceDetails>> {
  if (!placesConfigured()) return { ok: false, error: "not_configured" };
  if (!PLACE_ID_RE.test(placeId)) return { ok: false, error: "unavailable" };
  const spent = await spend("details", agentId);
  if ("error" in spent) return { ok: false, error: spent.error };
  const json = (await call(`${DETAILS_URL}${encodeURIComponent(placeId)}`, { method: "GET" }, DETAILS_FIELDS, spent.keys)) as RawPlace | null;
  const base = json ? toResult(json) : null;
  if (!json || !base) return { ok: false, error: "unavailable" };
  return { ok: true, data: { ...base, website: safeUrl(json.websiteUri), phone: json.nationalPhoneNumber?.slice(0, 40) ?? null } };
}

/** What to tell the agent when loading a business's contact details didn't go through. */
export function placeDetailsErrorMessage(error: PlacesError): string {
  switch (error) {
    case "not_configured":
      return "Contact details from Google aren't available right now.";
    case "agent_limit":
      return "You've looked up the most businesses allowed today. Try again tomorrow, or open the business on Google Maps.";
    case "site_limit":
      return "Contact details from Google have reached this month's limit for the team. Open the business on Google Maps instead.";
    default:
      return "Google isn't responding right now. Please try again in a minute.";
  }
}

/** What to tell the agent when a search didn't go through. */
export function placesErrorMessage(error: PlacesError): string {
  switch (error) {
    case "not_configured":
      return "Business search isn't switched on yet. You can still add businesses yourself with \"Add a business you found yourself\" below.";
    case "agent_limit":
      return "You've reached today's search limit. It resets in 24 hours; you can still add businesses yourself.";
    case "site_limit":
      return "Business search has reached this month's limit for the team. You can still add businesses yourself.";
    default:
      return "Google search isn't responding right now. Please try again in a minute.";
  }
}
