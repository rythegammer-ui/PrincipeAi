/**
 * Minimal RFC 5545 (iCalendar) generator for booking invites.
 *
 * - CRLF line endings, lines folded at 75 octets (UTF-8 aware, never splits a character)
 * - TEXT values escaped (\\, \;, \,, \n)
 * - All times emitted in UTC ("Z" form), so no VTIMEZONE block is needed
 *
 * Pure module (no server/DB imports) so it can be unit tested and reused anywhere.
 */

export type IcsMethod = "REQUEST" | "CANCEL" | "PUBLISH";
export type IcsStatus = "CONFIRMED" | "TENTATIVE" | "CANCELLED";

export type IcsPerson = { name?: string | null; email: string };

export type IcsEvent = {
  /** Globally unique, stable across updates (e.g. `<bookingId>@principe.ai`). */
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  description?: string | null;
  location?: string | null;
  url?: string | null;
  organizer?: IcsPerson | null;
  attendees?: IcsPerson[];
  status?: IcsStatus;
  /** Revision number; increment on every update so calendars replace the old version. */
  sequence?: number;
  /** When this copy was generated. Defaults to now. */
  dtstamp?: Date;
  /** Minutes before start for a display alarm (omitted for cancellations). */
  alarmMinutesBefore?: number | null;
};

export type BuildIcsInput = {
  method: IcsMethod;
  event: IcsEvent;
  /** Product identifier, e.g. "-//Principe AI//Booking//EN". */
  prodId?: string;
};

const CRLF = "\r\n";
const MAX_OCTETS = 75;

/** Escapes a TEXT property value (RFC 5545 §3.3.11). */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

/** Formats a Date as a UTC DATE-TIME, e.g. 20260310T140000Z. */
export function formatIcsDate(date: Date): string {
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date for ICS");
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function utf8Length(codePoint: number): number {
  if (codePoint < 0x80) return 1;
  if (codePoint < 0x800) return 2;
  if (codePoint < 0x10000) return 3;
  return 4;
}

/**
 * Folds a content line so no physical line exceeds 75 octets (RFC 5545 §3.1).
 * Continuation lines start with a single space, which counts toward their 75 octets.
 */
export function foldIcsLine(line: string): string {
  const parts: string[] = [];
  let current = "";
  let octets = 0;
  let limit = MAX_OCTETS;
  for (const ch of line) {
    const size = utf8Length(ch.codePointAt(0) ?? 0);
    if (octets + size > limit) {
      parts.push(current);
      current = "";
      octets = 0;
      limit = MAX_OCTETS - 1;
    }
    current += ch;
    octets += size;
  }
  parts.push(current);
  return parts.join(`${CRLF} `);
}

/** Parameter values (e.g. CN) are always quoted; quotes and control characters are stripped. */
function paramValue(value: string): string {
  return `"${value.replace(/["\u0000-\u001f\u007f]/g, "").trim()}"`;
}

/** URIs are not TEXT-escaped, but must never contain line breaks. */
function uriValue(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, "").trim();
}

function personLine(prop: "ORGANIZER" | "ATTENDEE", person: IcsPerson, extraParams: string[] = []): string {
  const params = [...(person.name?.trim() ? [`CN=${paramValue(person.name)}`] : []), ...extraParams];
  return `${prop}${params.length ? `;${params.join(";")}` : ""}:mailto:${uriValue(person.email)}`;
}

/** Builds a complete VCALENDAR document containing one VEVENT. Returns CRLF-terminated text. */
export function buildIcs({ method, event, prodId = "-//Principe AI//Booking//EN" }: BuildIcsInput): string {
  if (event.end.getTime() <= event.start.getTime()) throw new Error("ICS event must end after it starts");
  const status: IcsStatus = event.status ?? (method === "CANCEL" ? "CANCELLED" : "CONFIRMED");
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    `PRODID:${prodId}`,
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    `METHOD:${method}`,
    "BEGIN:VEVENT",
    `UID:${uriValue(event.uid)}`,
    `DTSTAMP:${formatIcsDate(event.dtstamp ?? new Date())}`,
    `DTSTART:${formatIcsDate(event.start)}`,
    `DTEND:${formatIcsDate(event.end)}`,
    `SEQUENCE:${Math.max(0, Math.floor(event.sequence ?? 0))}`,
    `STATUS:${status}`,
    `SUMMARY:${escapeIcsText(event.summary)}`,
  ];
  if (event.description) lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
  if (event.location) lines.push(`LOCATION:${escapeIcsText(event.location)}`);
  if (event.url) lines.push(`URL:${uriValue(event.url)}`);
  if (event.organizer) lines.push(personLine("ORGANIZER", event.organizer));
  for (const attendee of event.attendees ?? []) {
    lines.push(
      personLine("ATTENDEE", attendee, [
        "ROLE=REQ-PARTICIPANT",
        `PARTSTAT=${status === "CANCELLED" ? "DECLINED" : "ACCEPTED"}`,
        "RSVP=FALSE",
      ]),
    );
  }
  lines.push(`TRANSP:${status === "CANCELLED" ? "TRANSPARENT" : "OPAQUE"}`);
  if (method !== "CANCEL" && event.alarmMinutesBefore && event.alarmMinutesBefore > 0) {
    lines.push(
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeIcsText(event.summary)}`,
      `TRIGGER:-PT${Math.floor(event.alarmMinutesBefore)}M`,
      "END:VALARM",
    );
  }
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.map(foldIcsLine).join(CRLF) + CRLF;
}

/** Undoes line folding (useful for tests and parsing). */
export function unfoldIcs(text: string): string {
  return text.replace(/\r\n[ \t]/g, "");
}
