import type { Metadata } from "next";
import { FreeGuideLanding } from "@/components/marketing/free-guide-landing";
import { starterKit } from "@/content/starter-kit";

export const metadata: Metadata = {
  title: "Free AI Starter Kit",
  description: `${starterKit.subtitle} Free instant access from Principe AI.`,
  alternates: { canonical: "/free-guide" },
  openGraph: { title: "The free AI Starter Kit · Principe AI", description: starterKit.subtitle },
};

export default function FreeGuidePage() {
  return <FreeGuideLanding kit={starterKit} />;
}
