import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/utils";

/** Private, transactional and per-visitor pages stay out of search results. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/learn", "/agent", "/api", "/booking", "/assessment/results", "/checkout", "/unsubscribe", "/auth"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
