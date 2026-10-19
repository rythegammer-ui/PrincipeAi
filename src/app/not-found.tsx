import type { Metadata } from "next";
import { NotFoundContent } from "@/components/marketing/not-found-content";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

/**
 * Branded 404 for unknown URLs and for `notFound()` in any segment without a closer not-found file.
 * It renders directly in the root layout (above the marketing/admin/learn layouts), so it brings its
 * own header and footer. Shells that need their own chrome on a 404 add a not-found file of their
 * own (e.g. `admin/(panel)/not-found.tsx`). The `[main_&]:hidden` wrappers are a safety net in case
 * this component is ever rendered inside another layout's <main>.
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
