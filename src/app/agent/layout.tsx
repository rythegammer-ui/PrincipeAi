import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Agent dashboard", template: "%s · Principe AI Sales Team" },
  robots: { index: false, follow: false },
};
// The agent portal always shows live sales and earnings.
export const dynamic = "force-dynamic";

export default function AgentRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
