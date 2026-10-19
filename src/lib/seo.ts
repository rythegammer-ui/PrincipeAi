import type { Metadata } from "next";
import { site } from "@/config/site";

/**
 * Social-share metadata helpers.
 *
 * Next merges metadata shallowly: a page that sets its own `openGraph` or `twitter` object replaces the root
 * layout's one entirely — including the file-based `opengraph-image`. Pages that customise their share card
 * use `shareMetadata()` so the site image (and siteName / large-card type) come along.
 */

/** The root `src/app/opengraph-image.tsx` (1200×630), resolved against the root `metadataBase`. */
export const OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: `${site.name} — ${site.tagline}` } as const;

export function shareMetadata(input: {
  title: string;
  description: string;
  /** Canonical path of the page, e.g. `/courses/ai-essentials`. */
  url?: string;
  type?: "website" | "article";
}): Pick<Metadata, "openGraph" | "twitter"> {
  const { title, description, url, type = "website" } = input;
  return {
    openGraph: { type, siteName: site.name, title, description, ...(url ? { url } : {}), images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title, description, images: [{ url: OG_IMAGE.url, alt: OG_IMAGE.alt }] },
  };
}
