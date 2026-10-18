import { describe, expect, it } from "vitest";
import { buildIcs, escapeIcsText, foldIcsLine, formatIcsDate, unfoldIcs } from "@/lib/ics";

const baseEvent = {
  uid: "3f2a9c1e-1111-2222-3333-444455556666@principe.ai",
  start: new Date("2026-06-02T13:00:00Z"),
  end: new Date("2026-06-02T13:30:00Z"),
  dtstamp: new Date("2026-05-20T10:11:12.345Z"),
  summary: "Free AI Strategy Call with Principe AI",
};

const octets = (s: string) => new TextEncoder().encode(s).length;

describe("ics helpers", () => {
  it("formats UTC timestamps", () => {
    expect(formatIcsDate(new Date("2026-06-02T13:00:00.000Z"))).toBe("20260602T130000Z");
    expect(formatIcsDate(new Date("2026-12-31T23:59:59.999Z"))).toBe("20261231T235959Z");
    expect(() => formatIcsDate(new Date("x"))).toThrow();
  });

  it("escapes text values", () => {
    expect(escapeIcsText("a\\b;c,d\ne")).toBe("a\\\\b\\;c\\,d\\ne");
    expect(escapeIcsText("line1\r\nline2\rline3")).toBe("line1\\nline2\\nline3");
    expect(escapeIcsText("plain text: ok")).toBe("plain text: ok");
  });

  it("folds long lines at 75 octets with a leading space on continuations", () => {
    const line = `DESCRIPTION:${"x".repeat(200)}`;
    const folded = foldIcsLine(line);
    const physical = folded.split("\r\n");
    expect(physical.length).toBeGreaterThan(1);
    expect(octets(physical[0])).toBe(75);
    for (const p of physical.slice(1)) {
      expect(p.startsWith(" ")).toBe(true);
      expect(octets(p)).toBeLessThanOrEqual(75);
    }
    expect(unfoldIcs(folded)).toBe(line);
  });

  it("never splits multi-byte characters when folding", () => {
    const line = `SUMMARY:${"é🙂中".repeat(40)}`;
    const folded = foldIcsLine(line);
    for (const p of folded.split("\r\n")) {
      expect(octets(p)).toBeLessThanOrEqual(75);
      expect(p).not.toContain("�");
      // Every physical line must be valid UTF-16 (no lone surrogates).
      expect(p).toBe(p.toWellFormed());
    }
    expect(unfoldIcs(folded)).toBe(line);
  });

  it("leaves short lines alone", () => {
    expect(foldIcsLine("VERSION:2.0")).toBe("VERSION:2.0");
    expect(foldIcsLine("X".repeat(75))).toBe("X".repeat(75));
  });
});

describe("buildIcs", () => {
  it("builds a REQUEST invite with required properties and CRLF endings", () => {
    const ics = buildIcs({
      method: "REQUEST",
      event: {
        ...baseEvent,
        description: "Join: https://meet.example.com/abc\nManage: https://principe.ai/booking/tok",
        location: "Zoom",
        url: "https://principe.ai/booking/tok",
        organizer: { name: "Principe AI", email: "hello@principe.ai" },
        attendees: [{ name: "Ada Lovelace", email: "ada@example.com" }],
        sequence: 0,
        alarmMinutesBefore: 15,
      },
    });
    expect(ics.endsWith("\r\n")).toBe(true);
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/); // only CRLF line breaks
    const lines = unfoldIcs(ics).split("\r\n");
    expect(lines[0]).toBe("BEGIN:VCALENDAR");
    expect(lines).toContain("VERSION:2.0");
    expect(lines).toContain("METHOD:REQUEST");
    expect(lines.some((l) => l.startsWith("PRODID:"))).toBe(true);
    expect(lines).toContain("BEGIN:VEVENT");
    expect(lines).toContain(`UID:${baseEvent.uid}`);
    expect(lines).toContain("DTSTAMP:20260520T101112Z");
    expect(lines).toContain("DTSTART:20260602T130000Z");
    expect(lines).toContain("DTEND:20260602T133000Z");
    expect(lines).toContain("SEQUENCE:0");
    expect(lines).toContain("STATUS:CONFIRMED");
    expect(lines).toContain("SUMMARY:Free AI Strategy Call with Principe AI");
    expect(lines).toContain("DESCRIPTION:Join: https://meet.example.com/abc\\nManage: https://principe.ai/booking/tok");
    expect(lines).toContain("LOCATION:Zoom");
    expect(lines).toContain("URL:https://principe.ai/booking/tok");
    expect(lines).toContain('ORGANIZER;CN="Principe AI":mailto:hello@principe.ai');
    expect(lines).toContain('ATTENDEE;CN="Ada Lovelace";ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=FALSE:mailto:ada@example.com');
    expect(lines).toContain("BEGIN:VALARM");
    expect(lines).toContain("TRIGGER:-PT15M");
    expect(lines.at(-2)).toBe("END:VCALENDAR");
    // BEGIN/END pairs are balanced and properly nested
    expect(lines.indexOf("END:VEVENT")).toBeGreaterThan(lines.indexOf("BEGIN:VEVENT"));
    for (const physical of ics.split("\r\n")) expect(octets(physical)).toBeLessThanOrEqual(75);
  });

  it("builds a CANCEL with STATUS:CANCELLED, bumped SEQUENCE and no alarm", () => {
    const ics = unfoldIcs(buildIcs({ method: "CANCEL", event: { ...baseEvent, sequence: 2, alarmMinutesBefore: 15, attendees: [{ email: "ada@example.com" }] } }));
    expect(ics).toContain("METHOD:CANCEL");
    expect(ics).toContain("STATUS:CANCELLED");
    expect(ics).toContain("SEQUENCE:2");
    expect(ics).toContain("PARTSTAT=DECLINED");
    expect(ics).toContain("ATTENDEE;ROLE=REQ-PARTICIPANT");
    expect(ics).not.toContain("BEGIN:VALARM");
  });

  it("escapes hostile text and strips quotes / line breaks from parameters and URIs", () => {
    const ics = unfoldIcs(
      buildIcs({
        method: "PUBLISH",
        event: {
          ...baseEvent,
          summary: "Call; with, Bob\nEND:VEVENT",
          organizer: { name: 'Evil "Org"\r\nX-INJECT:1', email: "a@b.co\r\nX-INJECT:2" },
          url: "https://x.test/\r\nX-INJECT:3",
        },
      }),
    );
    expect(ics).toContain("SUMMARY:Call\\; with\\, Bob\\nEND:VEVENT");
    expect(ics).not.toMatch(/^X-INJECT/m);
    expect(ics).toContain('ORGANIZER;CN="Evil OrgX-INJECT:1":mailto:a@b.coX-INJECT:2');
    expect(ics.match(/^END:VEVENT$/gm)).toHaveLength(1);
  });

  it("rejects events that end before they start", () => {
    expect(() => buildIcs({ method: "REQUEST", event: { ...baseEvent, end: baseEvent.start } })).toThrow();
  });
});
