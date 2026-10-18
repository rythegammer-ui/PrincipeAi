/**
 * Lesson video helpers. Pure functions (no server-only) so they work in client components and tests.
 *
 * Only YouTube, Vimeo and Loom are supported. Anything else is rejected so we never iframe an
 * arbitrary third-party page inside the student portal.
 */

export type VideoProvider = "youtube" | "vimeo" | "loom";

export type VideoEmbed = { provider: VideoProvider; id: string; embedUrl: string };

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^\d{5,12}$/;
const VIMEO_HASH = /^[A-Za-z0-9]{6,20}$/;
const LOOM_ID = /^[A-Za-z0-9]{16,64}$/;

function parseUrl(raw: string): URL | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

/** YouTube start offsets look like "90", "90s" or "1m30s". Returns seconds, or null. */
function parseStart(value: string | null): number | null {
  if (!value) return null;
  if (/^\d+$/.test(value)) return Number(value);
  const m = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!m || !m[0]) return null;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

function youtube(url: URL): VideoEmbed | null {
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = url.pathname.split("/")[1] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else if (["embed", "shorts", "live", "v"].includes(parts[0] ?? "")) id = parts[1] ?? null;
  } else {
    return null;
  }
  if (!id || !YOUTUBE_ID.test(id)) return null;
  const start = parseStart(url.searchParams.get("t") ?? url.searchParams.get("start"));
  const params = new URLSearchParams({ rel: "0", modestbranding: "1" });
  if (start) params.set("start", String(start));
  return { provider: "youtube", id, embedUrl: `https://www.youtube-nocookie.com/embed/${id}?${params}` };
}

function vimeo(url: URL): VideoEmbed | null {
  const host = url.hostname.replace(/^www\./, "");
  const parts = url.pathname.split("/").filter(Boolean);
  let id: string | undefined;
  let hash: string | null = url.searchParams.get("h");
  if (host === "player.vimeo.com" && parts[0] === "video") {
    id = parts[1];
  } else if (host === "vimeo.com") {
    // vimeo.com/123456789, vimeo.com/123456789/abcdef (unlisted), vimeo.com/channels/x/123456789
    const idx = parts.findIndex((p) => VIMEO_ID.test(p));
    if (idx === -1) return null;
    id = parts[idx];
    if (!hash && parts[idx + 1] && VIMEO_HASH.test(parts[idx + 1])) hash = parts[idx + 1];
  } else {
    return null;
  }
  if (!id || !VIMEO_ID.test(id)) return null;
  const params = new URLSearchParams({ dnt: "1" });
  if (hash && VIMEO_HASH.test(hash)) params.set("h", hash);
  return { provider: "vimeo", id, embedUrl: `https://player.vimeo.com/video/${id}?${params}` };
}

function loom(url: URL): VideoEmbed | null {
  const host = url.hostname.replace(/^www\./, "");
  if (host !== "loom.com") return null;
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] !== "share" && parts[0] !== "embed") return null;
  const id = parts[1];
  if (!id || !LOOM_ID.test(id)) return null;
  return { provider: "loom", id, embedUrl: `https://www.loom.com/embed/${id}` };
}

/** Parses a YouTube / Vimeo / Loom URL (watch, share, short or embed form). Returns null for anything else. */
export function parseVideoUrl(raw: string | null | undefined): VideoEmbed | null {
  if (!raw) return null;
  const url = parseUrl(raw);
  if (!url) return null;
  return youtube(url) ?? vimeo(url) ?? loom(url);
}

/** Converts a supported video URL into its privacy-friendly embed URL, or null when unsupported. */
export function toEmbedUrl(raw: string | null | undefined): string | null {
  return parseVideoUrl(raw)?.embedUrl ?? null;
}

export const VIDEO_PROVIDER_LABELS: Record<VideoProvider, string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  loom: "Loom",
};
