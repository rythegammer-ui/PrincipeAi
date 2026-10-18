/**
 * Structured data (schema.org JSON-LD). Content is serialised with `<` escaped so a value can
 * never close the script tag.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
