import type { Metadata } from "next";
import { FreeGuideLanding } from "@/components/marketing/free-guide-landing";
import { starterKit } from "@/content/starter-kit";
import { shareMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Free AI Starter Kit",
  description: `${starterKit.subtitle} Free instant access from Principe AI.`,
  alternates: { canonical: "/free-guide" },
  ...shareMetadata({ title: "The free AI Starter Kit · Principe AI", description: starterKit.subtitle, url: "/free-guide" }),
};

export default function FreeGuidePage() {
  return <FreeGuideLanding kit={starterKit} />;
}
