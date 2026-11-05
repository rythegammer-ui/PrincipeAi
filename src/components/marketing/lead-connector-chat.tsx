import Script from "next/script";

const LEAD_CONNECTOR_LOADER_URL = "https://widgets.leadconnectorhq.com/loader.js";
const LEAD_CONNECTOR_RESOURCES_URL = "https://widgets.leadconnectorhq.com/chat-widget/loader.js";

/**
 * HighLevel (LeadConnector) live-chat widget: the loader script from its embed code, with the same data attributes.
 * Loaded after the page becomes interactive so it never delays the first render.
 */
export function LeadConnectorChat({ widgetId }: { widgetId: string }) {
  return (
    <Script
      id="leadconnector-chat-widget"
      src={LEAD_CONNECTOR_LOADER_URL}
      strategy="afterInteractive"
      data-resources-url={LEAD_CONNECTOR_RESOURCES_URL}
      data-widget-id={widgetId}
      data-source="WEB_USER"
    />
  );
}
