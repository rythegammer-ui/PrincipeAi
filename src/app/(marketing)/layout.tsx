import { Suspense } from "react";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";
import { ChatWidget } from "@/components/chat/chat-widget";
import { AnnouncementBar } from "@/components/marketing/announcement-bar";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { getSettings } from "@/lib/settings";

// Marketing pages read live data (prices, availability, settings) — render per request.
export const dynamic = "force-dynamic";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <>
      <AnnouncementBar text={settings.announcement} href={settings.announcementHref} />
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      {settings.aiAssistantEnabled && <ChatWidget assistantName={settings.aiAssistantName} greeting={settings.aiAssistantGreeting} />}
    </>
  );
}
