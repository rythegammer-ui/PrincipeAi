import type { Metadata } from "next";
import { NotFoundContent } from "@/components/marketing/not-found-content";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

/** 404 for marketing pages that call notFound() — rendered inside the marketing layout (header/footer already present). */
export default function MarketingNotFound() {
  return <NotFoundContent />;
}
