/** IANA timezones offered in Settings (the runtime's supported list, plus UTC). */
export function supportedTimezones(): string[] {
  let zones: string[] = [];
  try {
    zones = Intl.supportedValuesOf("timeZone");
  } catch {
    zones = [];
  }
  return [...new Set([...zones, "UTC"])].sort();
}

let cache: Set<string> | null = null;

export function isSupportedTimezone(value: string): boolean {
  cache ??= new Set(supportedTimezones());
  return cache.has(value);
}

/** Groups "America/New_York" style zones by region for <optgroup>s. */
export function groupTimezones(zones: string[]): { region: string; zones: string[] }[] {
  const groups = new Map<string, string[]>();
  for (const z of zones) {
    const region = z.includes("/") ? z.split("/")[0] : "Other";
    groups.set(region, [...(groups.get(region) ?? []), z]);
  }
  return [...groups.entries()].map(([region, list]) => ({ region, zones: list }));
}
