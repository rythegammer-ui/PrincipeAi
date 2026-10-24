import "server-only";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Google Places API (New) for the agent portal's business search (Agent portal → Leads). Needs `GOOGLE_MAPS_API_KEY`
 * (a Google Cloud key with "Places API (New)" enabled and billing on); without it, search is off and agents add
 * businesses by hand. Every call is metered, so each agent has a daily allowance and the whole site a monthly one
 * (env overrides below); both fail closed.
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

/** Spends one call from the agent's daily and the site's monthly allowance. */
async function spend(kind: "search" | "details", agentId: string): Promise<PlacesError | null> {
  const limits = placesLimits();
  const perAgent = kind === "search" ? limits.searchesPerAgentPerDay : limits.detailsPerAgentPerDay;
  const perMonth = kind === "search" ? limits.searchesPerMonth : limits.detailsPerMonth;
  const agent = await rateLimit(`places-${kind}:${agentId}`, perAgent, 24 * 60 * 60);
  if (!agent.ok) return "agent_limit";
  const site = await rateLimit(`places-${kind}:site`, perMonth, 30 * 24 * 60 * 60);
  if (!site.ok) return "site_limit";
  return null;
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

async function call(url: string, init: RequestInit, fieldMask: string): Promise<unknown | null> {
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
  const blocked = await spend("search", agentId);
  if (blocked) return { ok: false, error: blocked };
  const json = (await call(
    SEARCH_URL,
    { method: "POST", body: JSON.stringify({ textQuery: `${what} in ${where}`, pageSize: 20, regionCode: "US", languageCode: "en" }) },
    SEARCH_FIELDS,
  )) as { places?: RawPlace[] } | null;
  if (!json) return { ok: false, error: "unavailable" };
  const results = (json.places ?? []).map(toResult).filter((p): p is PlaceResult => p !== null);
  return { ok: true, data: results };
}

/** One business's address, website and phone, fetched fresh (not stored). */
export async function placeDetails(agentId: string, placeId: string): Promise<PlacesResponse<PlaceDetails>> {
  if (!placesConfigured()) return { ok: false, error: "not_configured" };
  if (!PLACE_ID_RE.test(placeId)) return { ok: false, error: "unavailable" };
  const blocked = await spend("details", agentId);
  if (blocked) return { ok: false, error: blocked };
  const json = (await call(`${DETAILS_URL}${encodeURIComponent(placeId)}`, { method: "GET" }, DETAILS_FIELDS)) as RawPlace | null;
  const base = json ? toResult(json) : null;
  if (!json || !base) return { ok: false, error: "unavailable" };
  return { ok: true, data: { ...base, website: safeUrl(json.websiteUri), phone: json.nationalPhoneNumber?.slice(0, 40) ?? null } };
}

/** What to tell the agent when a call didn't go through. */
export function placesErrorMessage(error: PlacesError): string {
  switch (error) {
    case "not_configured":
      return "Business search isn't switched on yet. You can still add businesses yourself below.";
    case "agent_limit":
      return "You've reached today's search limit. It resets in 24 hours; you can still add businesses yourself.";
    case "site_limit":
      return "Business search has reached this month's limit for the team. You can still add businesses yourself.";
    default:
      return "Google search isn't responding right now. Please try again in a minute.";
  }
}
