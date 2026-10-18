import type { Metadata } from "next";
import { NotFoundContent } from "@/components/marketing/not-found-content";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

/**
 * Branded 404 for unknown URLs (rendered in the root layout only) and the fallback for any segment
 * without its own not-found file. When it ends up nested inside another layout's <main> (e.g. the
 * admin or student shells), the site header/footer hide themselves via the `[main_&]:hidden` variant
 * so that layout's own chrome isn't duplicated.
 */
export default function NotFound() {
  return (
    <>
      <div className="contents [main_&]:hidden">
        <SiteHeader />
      </div>
      <main id="main" className="flex-1">
        <NotFoundContent />
      </main>
      <div className="contents [main_&]:hidden">
        <SiteFooter />
      </div>
    </>
  );
}
