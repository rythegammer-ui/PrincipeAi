import type { Metadata } from "next";
import { StarterKitGuide } from "@/components/marketing/starter-kit-guide";
import { starterKit } from "@/content/starter-kit";
import { getGuideAccess } from "@/lib/leads";
import { firstName } from "@/lib/utils";

export const metadata: Metadata = {
  title: starterKit.title,
  description: starterKit.subtitle,
  // The kit is gated content — /free-guide is the page we want in search results.
  robots: { index: false, follow: true },
};

type Search = { src?: string | string[]; welcome?: string | string[] };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

/** Soft-gated Starter Kit: unlocked by the opt-in cookie, a known contact, or ?src=email. */
export default async function GuidePage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const { unlocked, contact } = await getGuideAccess(one(sp.src));
  return (
    <StarterKitGuide
      kit={starterKit}
      unlocked={unlocked}
      greetingName={contact?.name ? firstName(contact.name) : null}
      welcome={unlocked && one(sp.welcome) === "1"}
    />
  );
}
