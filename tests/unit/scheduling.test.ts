import { describe, expect, it } from "vitest";
import { computeSlots, defaultStepMin, describeTime, formatDuration, isValidTimezone, type ComputeSlotsInput } from "@/lib/scheduling";

const NY = "America/New_York";
const weekdays9to17 = [1, 2, 3, 4, 5].map((weekday) => ({ weekday, startMinute: 540, endMinute: 1020 }));

/** Defaults: NY business hours Mon–Fri 9–5, 30 min meetings, no buffer/notice, 60-day horizon. */
function slots(overrides: Partial<ComputeSlotsInput> = {}): string[] {
  return computeSlots({
    rules: weekdays9to17,
    blockedDates: [],
    busy: [],
    durationMin: 30,
    bufferMin: 0,
    minNoticeHours: 0,
    maxDaysAhead: 60,
    businessTz: NY,
    now: "2026-06-01T00:00:00Z",
    ...overrides,
  });
}

/** Restrict to one business-tz day (NY offset given explicitly, e.g. "-04:00"). */
function onDay(date: string, offset: string, overrides: Partial<ComputeSlotsInput> = {}) {
  const from = new Date(`${date}T00:00:00${offset}`);
  const to = new Date(from.getTime() + 24 * 3_600_000);
  return slots({ from, to, ...overrides });
}

describe("computeSlots — basics", () => {
  it("offers 30-minute slots across a 9–5 window, ending exactly at close", () => {
    // Tue 2 Jun 2026 (EDT, UTC-4)
    const day = onDay("2026-06-02", "-04:00");
    expect(day).toHaveLength(16);
    expect(day[0]).toBe("2026-06-02T13:00:00.000Z"); // 9:00 EDT
    expect(day.at(-1)).toBe("2026-06-02T20:30:00.000Z"); // 4:30 EDT → ends 5:00
  });

  it("returns sorted, unique UTC ISO strings", () => {
    const all = slots({ rules: [...weekdays9to17, ...weekdays9to17] }); // duplicate rules
    expect(all).toEqual([...new Set(all)].sort());
    for (const s of all) expect(s).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\.000Z$/);
  });

  it("skips days without rules (weekends)", () => {
    expect(onDay("2026-06-06", "-04:00")).toEqual([]); // Saturday
    expect(onDay("2026-06-07", "-04:00")).toEqual([]); // Sunday
  });

  it("uses ISO weekdays (7 = Sunday)", () => {
    const sundayOnly = [{ weekday: 7, startMinute: 600, endMinute: 660 }];
    expect(onDay("2026-06-07", "-04:00", { rules: sundayOnly })).toEqual(["2026-06-07T14:00:00.000Z", "2026-06-07T14:30:00.000Z"]);
    expect(onDay("2026-06-08", "-04:00", { rules: sundayOnly })).toEqual([]);
  });

  it("supports multiple windows per day", () => {
    const split = [
      { weekday: 2, startMinute: 540, endMinute: 660 }, // 9–11
      { weekday: 2, startMinute: 780, endMinute: 900 }, // 13–15
    ];
    const day = onDay("2026-06-02", "-04:00", { rules: split, durationMin: 60 });
    expect(day).toEqual([
      "2026-06-02T13:00:00.000Z", // 9:00
      "2026-06-02T13:30:00.000Z", // 9:30
      "2026-06-02T14:00:00.000Z", // 10:00 (ends 11:00)
      "2026-06-02T17:00:00.000Z", // 13:00
      "2026-06-02T17:30:00.000Z", // 13:30
      "2026-06-02T18:00:00.000Z", // 14:00 (ends 15:00)
    ]);
  });

  it("only offers slots that fit entirely inside a window not divisible by the duration", () => {
    // 9:00–10:40 with 45 min meetings on 30 min steps → 9:00, 9:30 (ends 10:15); 10:00 would end 10:45.
    const rules = [{ weekday: 2, startMinute: 540, endMinute: 640 }];
    expect(onDay("2026-06-02", "-04:00", { rules, durationMin: 45 })).toEqual(["2026-06-02T13:00:00.000Z", "2026-06-02T13:30:00.000Z"]);
  });

  it("aligns slot starts to step boundaries when a window starts off-boundary", () => {
    const rules = [{ weekday: 2, startMinute: 550, endMinute: 660 }]; // 9:10–11:00
    expect(onDay("2026-06-02", "-04:00", { rules })).toEqual([
      "2026-06-02T13:30:00.000Z", // 9:30
      "2026-06-02T14:00:00.000Z",
      "2026-06-02T14:30:00.000Z", // 10:30 → ends 11:00
    ]);
  });

  it("uses 15-minute steps for short meetings and honours an explicit stepMin", () => {
    expect(defaultStepMin(15)).toBe(15);
    expect(defaultStepMin(20)).toBe(15);
    expect(defaultStepMin(30)).toBe(30);
    const rules = [{ weekday: 2, startMinute: 540, endMinute: 600 }];
    expect(onDay("2026-06-02", "-04:00", { rules, durationMin: 15 })).toHaveLength(4);
    expect(onDay("2026-06-02", "-04:00", { rules, durationMin: 30, stepMin: 10 })).toHaveLength(4); // 9:00,9:10,9:20,9:30
  });

  it("handles a window that runs to midnight (endMinute 1440)", () => {
    const rules = [{ weekday: 2, startMinute: 1380, endMinute: 1440 }]; // 23:00–24:00
    expect(onDay("2026-06-02", "-04:00", { rules })).toEqual(["2026-06-03T03:00:00.000Z", "2026-06-03T03:30:00.000Z"]);
  });

  it("ignores invalid rules and durations", () => {
    expect(slots({ rules: [{ weekday: 2, startMinute: 600, endMinute: 600 }] })).toEqual([]);
    expect(slots({ rules: [{ weekday: 2, startMinute: 700, endMinute: 600 }] })).toEqual([]);
    expect(slots({ durationMin: 0 })).toEqual([]);
  });

  it("rejects an invalid business timezone", () => {
    expect(() => slots({ businessTz: "Mars/Olympus_Mons" })).toThrow(/timezone/i);
    expect(isValidTimezone("Europe/London")).toBe(true);
    expect(isValidTimezone("nope")).toBe(false);
  });
});

describe("computeSlots — notice, horizon and range", () => {
  it("respects minimum notice", () => {
    // now = Tue 2 Jun 10:05 EDT, 2h notice → first slot 12:30 EDT
    const day = onDay("2026-06-02", "-04:00", { now: "2026-06-02T14:05:00Z", minNoticeHours: 2 });
    expect(day[0]).toBe("2026-06-02T16:30:00.000Z");
  });

  it("never offers slots in the past", () => {
    const day = onDay("2026-06-02", "-04:00", { now: "2026-06-02T19:00:00Z" }); // 3pm EDT
    expect(day).toEqual(["2026-06-02T19:00:00.000Z", "2026-06-02T19:30:00.000Z", "2026-06-02T20:00:00.000Z", "2026-06-02T20:30:00.000Z"]);
  });

  it("stops after maxDaysAhead calendar days (business tz), inclusive", () => {
    // now = Mon 1 Jun 2026 09:00 EDT; 3 days ahead → through Thu 4 Jun.
    const all = slots({ now: "2026-06-01T13:00:00Z", maxDaysAhead: 3 });
    expect(all[0]).toBe("2026-06-01T13:00:00.000Z");
    expect(all.at(-1)).toBe("2026-06-04T20:30:00.000Z");
    expect(all.some((s) => s.startsWith("2026-06-05"))).toBe(false);
  });

  it("maxDaysAhead 0 means today only", () => {
    const all = slots({ now: "2026-06-02T12:00:00Z", maxDaysAhead: 0 });
    expect(all).toHaveLength(16);
    expect(all.every((s) => s.startsWith("2026-06-02"))).toBe(true);
  });

  it("filters by from (inclusive) and to (exclusive)", () => {
    const res = slots({ from: "2026-06-02T14:00:00Z", to: "2026-06-02T15:00:00Z" });
    expect(res).toEqual(["2026-06-02T14:00:00.000Z", "2026-06-02T14:30:00.000Z"]);
    expect(slots({ from: "2026-06-03T00:00:00Z", to: "2026-06-02T00:00:00Z" })).toEqual([]);
  });

  it("interprets 'today' in the business timezone, not UTC", () => {
    // 02:00Z on 3 Jun is still 2 Jun in New York; with maxDaysAhead 0 nothing remains today (it's 10pm).
    expect(slots({ now: "2026-06-03T02:00:00Z", maxDaysAhead: 0 })).toEqual([]);
  });
});

describe("computeSlots — blocked dates and busy time", () => {
  it("skips blocked dates (business-tz date strings)", () => {
    const res = slots({ blockedDates: ["2026-06-02"], from: "2026-06-02T00:00:00-04:00", to: "2026-06-04T00:00:00-04:00" });
    expect(res.some((s) => s.startsWith("2026-06-02"))).toBe(false);
    expect(res.filter((s) => s.startsWith("2026-06-03"))).toHaveLength(16);
  });

  it("removes slots overlapping a busy interval", () => {
    const busy = [{ start: "2026-06-02T14:00:00Z", end: "2026-06-02T14:30:00Z" }]; // 10:00–10:30 EDT
    const day = onDay("2026-06-02", "-04:00", { busy });
    expect(day).not.toContain("2026-06-02T14:00:00.000Z");
    expect(day).toContain("2026-06-02T13:30:00.000Z"); // ends exactly when busy starts
    expect(day).toContain("2026-06-02T14:30:00.000Z"); // starts exactly when busy ends
    expect(day).toHaveLength(15);
  });

  it("removes every slot a longer meeting would collide with", () => {
    const busy = [{ start: new Date("2026-06-02T15:00:00Z"), end: new Date("2026-06-02T16:00:00Z") }]; // 11–12
    const day = onDay("2026-06-02", "-04:00", { busy, durationMin: 60 });
    // 10:00 ends 11:00 (ok), 10:30 overlaps, 11:00, 11:30 overlap, 12:00 ok
    expect(day).toContain("2026-06-02T14:00:00.000Z");
    expect(day).not.toContain("2026-06-02T14:30:00.000Z");
    expect(day).not.toContain("2026-06-02T15:00:00.000Z");
    expect(day).not.toContain("2026-06-02T15:30:00.000Z");
    expect(day).toContain("2026-06-02T16:00:00.000Z");
  });

  it("expands busy intervals by the buffer on both sides", () => {
    const busy = [{ start: "2026-06-02T15:00:00Z", end: "2026-06-02T15:30:00Z" }]; // 11:00–11:30 EDT
    const day = onDay("2026-06-02", "-04:00", { busy, bufferMin: 15 });
    // Blocked zone 10:45–11:45 → 10:30 (ends 11:00) collides, 10:00 ok, 11:30 collides, 12:00 ok
    expect(day).toContain("2026-06-02T14:00:00.000Z");
    expect(day).not.toContain("2026-06-02T14:30:00.000Z");
    expect(day).not.toContain("2026-06-02T15:00:00.000Z");
    expect(day).not.toContain("2026-06-02T15:30:00.000Z");
    expect(day).toContain("2026-06-02T16:00:00.000Z");
  });

  it("ignores malformed busy intervals", () => {
    const busy = [{ start: "nonsense", end: "2026-06-02T15:30:00Z" }, { start: "2026-06-02T16:00:00Z", end: "2026-06-02T15:00:00Z" }];
    expect(onDay("2026-06-02", "-04:00", { busy })).toHaveLength(16);
  });
});

describe("computeSlots — DST (America/New_York)", () => {
  it("keeps 9:00 local on spring-forward day (Sun 8 Mar 2026) and the following Monday", () => {
    const rules = [1, 7].map((weekday) => ({ weekday, startMinute: 540, endMinute: 600 }));
    const res = slots({ rules, now: "2026-03-01T00:00:00Z", from: "2026-03-07T00:00:00Z", to: "2026-03-10T12:00:00Z" });
    expect(res).toEqual([
      "2026-03-08T13:00:00.000Z", // Sun 9:00 EDT (UTC-4)
      "2026-03-08T13:30:00.000Z",
      "2026-03-09T13:00:00.000Z", // Mon 9:00 EDT
      "2026-03-09T13:30:00.000Z",
    ]);
    // The Sunday before the switch is still EST (UTC-5)
    const before = slots({ rules, now: "2026-02-20T00:00:00Z", from: "2026-03-01T00:00:00Z", to: "2026-03-02T12:00:00Z" });
    expect(before[0]).toBe("2026-03-01T14:00:00.000Z");
  });

  it("never offers times inside the spring-forward gap (2:00–3:00 doesn't exist)", () => {
    const rules = [{ weekday: 7, startMinute: 0, endMinute: 300 }]; // 00:00–05:00 local = 4 real hours
    const res = slots({ rules, now: "2026-03-01T00:00:00Z", from: "2026-03-08T00:00:00-05:00", to: "2026-03-09T00:00:00-04:00" });
    expect(res).toEqual([
      "2026-03-08T05:00:00.000Z", // 00:00 EST
      "2026-03-08T05:30:00.000Z", // 00:30
      "2026-03-08T06:00:00.000Z", // 01:00
      "2026-03-08T06:30:00.000Z", // 01:30 EST (ends 03:00 EDT)
      "2026-03-08T07:00:00.000Z", // 03:00 EDT
      "2026-03-08T07:30:00.000Z", // 03:30
      "2026-03-08T08:00:00.000Z", // 04:00
      "2026-03-08T08:30:00.000Z", // 04:30 → ends 05:00 EDT
    ]);
  });

  it("starts a window that begins inside the gap at the first real time", () => {
    const rules = [{ weekday: 7, startMinute: 150, endMinute: 270 }]; // 02:30–04:30 local
    const res = slots({ rules, now: "2026-03-01T00:00:00Z", from: "2026-03-08T00:00:00-05:00", to: "2026-03-09T00:00:00-04:00" });
    expect(res).toEqual(["2026-03-08T07:30:00.000Z", "2026-03-08T08:00:00.000Z"]); // 03:30, 04:00 EDT
  });

  it("offers the repeated hour on fall-back day (Sun 1 Nov 2026) once per real instant", () => {
    const rules = [{ weekday: 7, startMinute: 0, endMinute: 180 }]; // 00:00–03:00 local = 4 real hours
    const res = slots({ rules, now: "2026-10-25T00:00:00Z", from: "2026-11-01T00:00:00-04:00", to: "2026-11-02T00:00:00-05:00" });
    expect(res).toEqual([
      "2026-11-01T04:00:00.000Z", // 00:00 EDT
      "2026-11-01T04:30:00.000Z",
      "2026-11-01T05:00:00.000Z", // 01:00 EDT
      "2026-11-01T05:30:00.000Z", // 01:30 EDT
      "2026-11-01T06:00:00.000Z", // 01:00 EST
      "2026-11-01T06:30:00.000Z", // 01:30 EST
      "2026-11-01T07:00:00.000Z", // 02:00 EST
      "2026-11-01T07:30:00.000Z", // 02:30 EST → ends 03:00 EST
    ]);
  });

  it("keeps business hours at 9–5 local across the fall-back weekend", () => {
    const res = slots({ now: "2026-10-25T00:00:00Z", from: "2026-10-30T00:00:00Z", to: "2026-11-03T12:00:00Z" });
    const fri = res.filter((s) => s.startsWith("2026-10-30"));
    const mon = res.filter((s) => s.startsWith("2026-11-02"));
    expect(fri[0]).toBe("2026-10-30T13:00:00.000Z"); // 9:00 EDT
    expect(mon[0]).toBe("2026-11-02T14:00:00.000Z"); // 9:00 EST
    expect(mon.at(-1)).toBe("2026-11-02T21:30:00.000Z"); // 4:30 EST
    expect(fri).toHaveLength(16);
    expect(mon).toHaveLength(16);
  });

  it("counts min notice in real hours across the DST switch", () => {
    // Sat 7 Mar 23:00 EST + 10h notice = Sun 8 Mar 10:00 EDT (only 9 wall-clock hours later)
    const rules = [{ weekday: 7, startMinute: 540, endMinute: 720 }];
    const res = slots({ rules, now: "2026-03-08T04:00:00Z", minNoticeHours: 10, maxDaysAhead: 1 });
    expect(res[0]).toBe("2026-03-08T14:00:00.000Z"); // 10:00 EDT
  });

  it("works for a southern-hemisphere zone (Australia/Sydney, DST ends 5 Apr 2026)", () => {
    const rules = [{ weekday: 7, startMinute: 540, endMinute: 600 }];
    const res = slots({ rules, businessTz: "Australia/Sydney", now: "2026-03-20T00:00:00Z", maxDaysAhead: 30 });
    expect(res).toContain("2026-03-28T22:00:00.000Z"); // Sun 29 Mar 9:00 AEDT (UTC+11)
    expect(res).toContain("2026-04-04T23:00:00.000Z"); // Sun 5 Apr 9:00 AEST (UTC+10)
  });
});

describe("formatting helpers", () => {
  it("describes a time in the requested zone", () => {
    const d = describeTime(new Date("2026-06-02T13:00:00Z"), new Date("2026-06-02T13:30:00Z"), NY);
    expect(d.dateLabel).toBe("Tuesday, June 2, 2026");
    expect(d.timeLabel).toBe("9:00 – 9:30 AM");
    expect(d.zoneAbbr).toBe("EDT");
    const pm = describeTime(new Date("2026-06-02T15:30:00Z"), new Date("2026-06-02T16:30:00Z"), NY);
    expect(pm.timeLabel).toBe("11:30 AM – 12:30 PM");
  });
  it("formats durations", () => {
    expect(formatDuration(30)).toBe("30 min");
    expect(formatDuration(60)).toBe("1 hr");
    expect(formatDuration(90)).toBe("1 hr 30 min");
    expect(formatDuration(120)).toBe("2 hrs");
  });
});
