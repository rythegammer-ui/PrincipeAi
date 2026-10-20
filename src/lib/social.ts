import { site } from "@/config/site";

/** Display order and labels for `site.social`. Profiles left blank in `src/config/site.ts` are skipped. */
const PLATFORMS = [
  { key: "youtube", label: "YouTube" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "x", label: "X" },
  { key: "threads", label: "Threads" },
  { key: "facebook", label: "Facebook" },
  { key: "pinterest", label: "Pinterest" },
  { key: "bluesky", label: "Bluesky" },
] as const;

export type SocialProfile = { key: string; label: string; url: string };

/**
 * The social profiles to link to (footer, Organization `sameAs`), in display order.
 * Only full https:// URLs are kept, so a half-filled entry (a bare "@handle") never renders as a broken link.
 */
export function socialProfiles(social: Record<string, string> = site.social): SocialProfile[] {
  const out: SocialProfile[] = [];
  for (const { key, label } of PLATFORMS) {
    const raw = social[key]?.trim();
    if (!raw) continue;
    try {
      const url = new URL(raw);
      if (url.protocol === "https:") out.push({ key, label, url: url.href });
    } catch {
      // Not a URL: skip it.
    }
  }
  return out;
}
