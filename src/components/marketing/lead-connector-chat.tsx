const LEAD_CONNECTOR_LOADER_URL = "https://widgets.leadconnectorhq.com/loader.js";
const LEAD_CONNECTOR_RESOURCES_URL = "https://widgets.leadconnectorhq.com/chat-widget/loader.js";

/**
 * HighLevel (LeadConnector) live-chat widget: the loader script from its embed code, with the same data attributes.
 * It is a plain async <script>, so it is in the server-rendered HTML (HighLevel's compliance check reads the page
 * source without running JavaScript) and React also loads it after client-side navigation, without blocking render.
 */
export function LeadConnectorChat({ widgetId }: { widgetId: string }) {
  return (
    <script
      async
      src={LEAD_CONNECTOR_LOADER_URL}
      data-resources-url={LEAD_CONNECTOR_RESOURCES_URL}
      data-widget-id={widgetId}
      data-source="WEB_USER"
    />
  );
}
