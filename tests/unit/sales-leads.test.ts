import { randomUUID } from "node:crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// next/headers outside a request: an in-memory cookie jar (the visitor's referral cookies).
const mocks = vi.hoisted(() => ({ jar: new Map<string, string>(), aiReply: null as string | null }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (mocks.jar.has(name) ? { name, value: mocks.jar.get(name) } : undefined),
    set: (name: string, value: string) => void mocks.jar.set(name, value),
    delete: (name: string) => void mocks.jar.delete(name),
  }),
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.9" }),
}));
vi.mock("@/lib/ai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/ai")>()),
  claimAiReply: async () => true,
  aiText: async () => mocks.aiReply,
}));

import { site } from "@/config/site";
import { getDb, schema } from "@/db";
import type { SalesAgent } from "@/db/schema";
import { captureLead, setMarketingSubscription } from "@/lib/crm";
import { runScheduledJobs } from "@/lib/jobs";
import { DISCLOSURE, MISSING_ADDRESS, writeOutreach } from "@/lib/sales/outreach";
import { areaKeyOf, rekeyProspects } from "@/lib/sales/match-keys";
import { placeDetails, placesSiteKey, searchPlaces } from "@/lib/sales/places";
import {
  addProspect,
  adminMarkDoNotContact,
  adminReleaseProspect,
  blockedByDoNotContact,
  claimDomain,
  claimExpired,
  claimStatesForPlaces,
  CLAIM_DAYS,
  DEFAULT_FOLLOW_UP_DAYS,
  getProspect,
  HOLD_DAYS,
  listProspects,
  markProspectContacted,
  matchKey,
  MAX_ACTIVE_PROSPECTS,
  MAX_CONTACTS,
  messageAllowed,
  normalizeDomain,
  normalizeWebsite,
  prospectInputSchema,
  prospectLink,
  prospectTokenValid,
  prospectUpdateSchema,
  updateProspect,
} from "@/lib/sales/prospects";
import { AGENT_COOKIE, assignContactToAgent, claimContactForAgent, followUpConsentFrom, listWarmLeads, PROSPECT_COOKIE } from "@/lib/sales/referrals";
import { updateSettings } from "@/lib/settings";

type DB = Awaited<ReturnType<typeof getDb>>;
const DAY = 86_400_000;
const unique = (label: string) => `${label}-${randomUUID().slice(0, 8)}@example.com`;
const placeId = () => `ChIJ${randomUUID().replace(/-/g, "")}`;
let codeSeq = 0;

describe("lead generator rules (pure)", () => {
  it("normalizes websites to one domain per business", () => {
    expect(normalizeDomain("https://www.Example.com/about")).toBe("example.com");
    expect(normalizeDomain("example.com")).toBe("example.com");
    expect(normalizeDomain("shop.example.co.uk.")).toBe("shop.example.co.uk");
    expect(normalizeDomain("javascript:alert(1)")).toBeNull();
    expect(normalizeDomain("not a site")).toBeNull();
    expect(normalizeDomain("")).toBeNull();
    expect(normalizeWebsite("example.com/menu")).toBe("https://example.com/menu");
    expect(normalizeWebsite("ftp://example.com")).toBeNull();
  });

  it("lets a claim run out after the agent stops working it, except do-not-contact and sign-ups", () => {
    const now = Date.now();
    const at = (days: number) => new Date(now - days * DAY);
    expect(claimExpired({ status: "contacted", contactId: null, activeAt: at(CLAIM_DAYS - 1) }, now)).toBe(false);
    expect(claimExpired({ status: "contacted", contactId: null, activeAt: at(CLAIM_DAYS) }, now)).toBe(true);
    expect(claimExpired({ status: "not_interested", contactId: null, activeAt: at(CLAIM_DAYS + 5) }, now)).toBe(false);
    expect(claimExpired({ status: "not_interested", contactId: null, activeAt: at(HOLD_DAYS) }, now)).toBe(true);
    expect(claimExpired({ status: "do_not_contact", contactId: null, activeAt: at(1000) }, now)).toBe(false);
    // A sign-up holds the business longer, but not for ever (a throwaway sign-up mustn't lock a business for good).
    expect(claimExpired({ status: "new", contactId: randomUUID(), activeAt: at(CLAIM_DAYS + 5) }, now)).toBe(false);
    expect(claimExpired({ status: "new", contactId: randomUUID(), activeAt: at(HOLD_DAYS) }, now)).toBe(true);
  });

  it("matches the same business however it was typed, but not shared hosts", () => {
    expect(matchKey("The Joe's Café, LLC")).toBe("joescafe");
    expect(matchKey("JOES CAFE")).toBe("joescafe");
    expect(matchKey("Joe’s Cafe Inc.")).toBe("joescafe");
    expect(matchKey("The")).toBe("the");
    expect(claimDomain("https://www.facebook.com/joescafe")).toBeNull();
    expect(claimDomain("instagram.com/joescafe")).toBeNull();
    expect(claimDomain("joes.square.site")).toBe("joes.square.site");
    expect(claimDomain("www.joescafe.com/menu")).toBe("joescafe.com");
    // Any subdomain of a shared host, and booking/ordering pages.
    expect(claimDomain("https://web.facebook.com/joescafe")).toBeNull();
    expect(claimDomain("m.yelp.com/biz/joes-cafe")).toBeNull();
    expect(claimDomain("order.toasttab.com/online/joes")).toBeNull();
    expect(claimDomain("www.vagaro.com/joessalon")).toBeNull();
    expect(claimDomain("square.site")).toBeNull();
  });

  it("folds areas to the town, whatever the state or ZIP", () => {
    for (const a of ["Austin, TX", "Austin TX", "Austin Texas", "Austin, TX 78701", "austin"]) expect(areaKeyOf(a)).toBe("austin");
    expect(areaKeyOf("78701")).toBe("");
    expect(areaKeyOf("TX")).toBe("");
    expect(areaKeyOf("Virginia Beach VA")).toBe("virginiabeach");
    expect(areaKeyOf("The Woodlands, TX")).toBe("woodlands");
    // Towns named after states keep their name.
    expect(areaKeyOf("New York, NY")).toBe("newyork");
    expect(areaKeyOf("New York NY")).toBe("newyork");
    expect(areaKeyOf("Washington, DC")).toBe("washington");
    expect(areaKeyOf("Indiana, PA")).toBe("indiana");
  });

  it("only takes real calendar dates for follow-ups", () => {
    expect(prospectUpdateSchema.safeParse({ nextFollowUp: "2026-11-02" }).success).toBe(true);
    expect(prospectUpdateSchema.safeParse({ nextFollowUp: "" }).success).toBe(true);
    expect(prospectUpdateSchema.safeParse({ nextFollowUp: "2026-02-30" }).success).toBe(false);
    expect(prospectUpdateSchema.safeParse({ nextFollowUp: "2026-13-01" }).success).toBe(false);
    expect(prospectUpdateSchema.safeParse({ nextFollowUp: "0000-01-01" }).success).toBe(false);
  });

  it("validates what agents type in", () => {
    expect(prospectInputSchema.safeParse({ name: "Joe's Bakery", website: "joesbakery.com", email: "hi@joesbakery.com" }).success).toBe(true);
    expect(prospectInputSchema.safeParse({ name: "J" }).success).toBe(false);
    expect(prospectInputSchema.safeParse({ name: "Joe's", website: "not a website" }).success).toBe(false);
    expect(prospectInputSchema.safeParse({ name: "Joe's", placeId: "bad id/../" }).success).toBe(false);
  });

  it("reads the follow-up consent box only when it's ticked", () => {
    const fd = (entries: Record<string, string>) => {
      const f = new FormData();
      for (const [k, v] of Object.entries(entries)) f.set(k, v);
      return f;
    };
    expect(followUpConsentFrom(fd({ agentFollowUp: "on", agentFollowUpCode: "jane27" }))).toBe("JANE27");
    expect(followUpConsentFrom(fd({ agentFollowUpCode: "JANE27" }))).toBeNull();
    expect(followUpConsentFrom(fd({ agentFollowUp: "on", agentFollowUpCode: "<script>" }))).toBeNull();
  });
});

describe("lead generator", () => {
  let db: DB;

  beforeAll(async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    db = await getDb();
  }, 60_000);

  beforeEach(() => {
    mocks.jar.clear();
    mocks.aiReply = null;
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  async function newAgent(name = "Jane Tester"): Promise<SalesAgent> {
    const code = `LD${(Date.now() % 1_000_000).toString().padStart(6, "0")}${++codeSeq}`;
    const [agent] = await db.insert(schema.salesAgents).values({ email: unique("agent"), name, code, status: "approved" }).returning();
    return agent;
  }

  // A different name each time: a do-not-contact in one test blocks a same-named listing in the same town in the next.
  const business = (extra: Partial<Parameters<typeof prospectInputSchema.parse>[0]> = {}) =>
    prospectInputSchema.parse({ name: `Joe's Bakery ${randomUUID().slice(0, 6)}`, category: "Bakery", area: "Austin, TX", ...extra });

  it("gives each business to one agent at a time, by Google place or by website", async () => {
    const jane = await newAgent();
    const sam = await newAgent("Sam Other");
    const place = placeId();

    const added = await addProspect(jane, business({ placeId: place }));
    expect(added.status).toBe("added");
    if (added.status !== "added") return;
    expect(added.prospect.linkToken).toMatch(/^[A-Za-z0-9_-]{12}$/);
    expect((await addProspect(jane, business({ placeId: place }))).status).toBe("already_yours");
    expect((await addProspect(sam, business({ placeId: place }))).status).toBe("claimed");

    // Added by hand: the website is the business's identity.
    const site1 = `${randomUUID().slice(0, 8)}.example.com`;
    expect((await addProspect(jane, business({ name: "Main St Dental", website: `https://www.${site1}/team` }))).status).toBe("added");
    expect((await addProspect(sam, business({ name: "Main Street Dental", website: site1 }))).status).toBe("claimed");

    const other = placeId();
    const states = await claimStatesForPlaces(
      sam.id,
      [
        { placeId: place, name: "Joe's Bakery" },
        // Another Joe's Bakery listing on Google is a different business.
        { placeId: other, name: "Joe's Bakery" },
      ],
      "Austin, TX",
    );
    expect(states.get(place)).toBe("claimed");
    expect(states.get(other)).toBe("available");
    expect((await claimStatesForPlaces(jane.id, [{ placeId: place, name: "Joe's Bakery" }], "Austin, TX")).get(place)).toBe("mine");

    // Jane stops working it: after CLAIM_DAYS it's free, and her row becomes history.
    await db.update(schema.agentProspects).set({ activeAt: new Date(Date.now() - (CLAIM_DAYS + 1) * DAY) }).where(eq(schema.agentProspects.id, added.prospect.id));
    expect((await claimStatesForPlaces(sam.id, [{ placeId: place, name: "Joe's Bakery" }], "Austin, TX")).get(place)).toBe("available");
    const taken = await addProspect(sam, business({ placeId: place }));
    expect(taken.status).toBe("added");
    const [old] = await db.select().from(schema.agentProspects).where(eq(schema.agentProspects.id, added.prospect.id));
    expect(old.releaseReason).toBe("expired");
    expect(await getProspect(jane.id, added.prospect.id)).toBeNull();
  });

  it("blocks a do-not-contact business for the whole team until an admin clears it", async () => {
    const jane = await newAgent();
    const sam = await newAgent("Sam Other");
    const place = placeId();
    const added = await addProspect(jane, business({ placeId: place }));
    if (added.status !== "added") throw new Error("not added");

    expect(await updateProspect(jane.id, added.prospect.id, { status: "do_not_contact", notes: undefined, website: undefined, phone: undefined, email: undefined })).toBe("ok");
    expect(await updateProspect(jane.id, added.prospect.id, { status: "contacted", notes: undefined, website: undefined, phone: undefined, email: undefined })).toBe("locked");
    // Never runs out.
    await db.update(schema.agentProspects).set({ activeAt: new Date(Date.now() - 400 * DAY) }).where(eq(schema.agentProspects.id, added.prospect.id));
    expect((await addProspect(sam, business({ placeId: place }))).status).toBe("do_not_contact");
    expect((await claimStatesForPlaces(sam.id, [{ placeId: place, name: "Joe's Bakery" }], "Austin, TX")).get(place)).toBe("do_not_contact");

    expect(await adminReleaseProspect(added.prospect.id, "released by owner@example.com")).toBe(true);
    expect((await addProspect(sam, business({ placeId: place }))).status).toBe("added");
  });

  it("recognizes a do-not-contact business added the other way (by hand vs from Google), and the agent can't undo it", async () => {
    const jane = await newAgent();
    const sam = await newAgent("Sam Other");
    const name = `Maple Dental ${randomUUID().slice(0, 6)}`;
    const none = { notes: undefined, website: undefined, phone: undefined, email: undefined };

    // From Google, then the owner says stop.
    const google = await addProspect(jane, business({ name, placeId: placeId(), area: "Austin, TX" }));
    if (google.status !== "added") throw new Error("not added");
    await updateProspect(jane.id, google.prospect.id, { status: "do_not_contact", ...none });
    // By hand, written differently, even in another town: still blocked.
    expect((await addProspect(sam, business({ name: `the ${name.toUpperCase()}, LLC`, area: "Round Rock, TX" }))).status).toBe("do_not_contact");

    // By hand first, then found on Google.
    const handName = `Oak Street Gym ${randomUUID().slice(0, 6)}`;
    const handSite = `${randomUUID().slice(0, 8)}.example.com`;
    const hand = await addProspect(jane, business({ name: handName, website: handSite, email: "Front@Desk.example.com", phone: "(512) 555-0199" }));
    if (hand.status !== "added") throw new Error("not added");
    const found = placeId();
    expect((await claimStatesForPlaces(sam.id, [{ placeId: found, name: handName }], "Austin, TX")).get(found)).toBe("claimed");
    expect((await addProspect(sam, business({ name: handName, placeId: found }))).status).toBe("claimed");
    // Same email or phone, another name: the same business.
    expect((await addProspect(sam, business({ name: "OSG", email: "front@desk.example.com" }))).status).toBe("claimed");
    expect((await addProspect(sam, business({ name: "OSG Fitness", phone: "512.555.0199" }))).status).toBe("claimed");
    // Same name in another town, added by hand: a different business.
    expect((await addProspect(sam, business({ name: handName, area: "Dallas, TX" }))).status).toBe("added");

    await updateProspect(jane.id, hand.prospect.id, { status: "do_not_contact", ...none });
    expect((await claimStatesForPlaces(sam.id, [{ placeId: found, name: handName }], "Austin, TX")).get(found)).toBe("do_not_contact");
    // Do not contact is final for the agent: the details it's matched by can't change, nor can the status or reminder.
    expect(await updateProspect(jane.id, hand.prospect.id, { ...none, website: null })).toBe("locked");
    expect(await updateProspect(jane.id, hand.prospect.id, { ...none, website: "other.example.com" })).toBe("locked");
    expect(await updateProspect(jane.id, hand.prospect.id, { ...none, nextFollowUp: "2026-12-01" })).toBe("locked");
    expect(await updateProspect(jane.id, hand.prospect.id, { ...none, notes: "Owner asked us to stop on 10/24." })).toBe("ok");
    expect(await getProspect(jane.id, hand.prospect.id)).toMatchObject({ status: "do_not_contact", domain: handSite, notes: "Owner asked us to stop on 10/24." });
    expect(await markProspectContacted(jane.id, hand.prospect.id)).toEqual({ status: "locked" });

    // A shared host (a Facebook page) isn't a business's identity: two businesses can both use one.
    expect((await addProspect(jane, business({ name: `Pine Bakery ${randomUUID().slice(0, 6)}`, website: "facebook.com/pinebakery" }))).status).toBe("added");
    expect((await addProspect(sam, business({ name: `Elm Salon ${randomUUID().slice(0, 6)}`, website: "facebook.com/elmsalon" }))).status).toBe("added");
  });

  it("stops every agent's copy of a business once one is do-not-contact, and checks edited contact details", async () => {
    const jane = await newAgent();
    const sam = await newAgent("Sam Other");
    const none = { notes: undefined, website: undefined, phone: undefined, email: undefined };
    const name = `Oak Dental ${randomUUID().slice(0, 6)}`;
    // Added in different towns (the Google row's area is the search), so both rows exist.
    const samRow = await addProspect(sam, business({ name, area: "Tampa" }));
    const janeRow = await addProspect(jane, business({ name, placeId: placeId(), area: "Brandon, FL" }));
    if (samRow.status !== "added" || janeRow.status !== "added") throw new Error("not added");
    await updateProspect(sam.id, samRow.prospect.id, { ...none, nextFollowUp: "2026-12-01" });
    expect(await blockedByDoNotContact(samRow.prospect)).toBe(false);
    await updateProspect(jane.id, janeRow.prospect.id, { status: "do_not_contact", ...none });
    // Sam's copy can't be messaged, marked as sent or opened through its link any more.
    const samNow = (await getProspect(sam.id, samRow.prospect.id))!;
    expect(await blockedByDoNotContact(samNow)).toBe(true);
    expect(await messageAllowed(sam.id, samNow)).toBe("blocked");
    expect(await markProspectContacted(sam.id, samRow.prospect.id)).toEqual({ status: "locked" });
    expect(await prospectTokenValid(sam.id, samNow.linkToken)).toBe(false);

    // A Google do-not-contact listing also blocks a duplicate listing (new place ID) of the same name in the same town.
    const dup = placeId();
    const dupStates = await claimStatesForPlaces(sam.id, [{ placeId: dup, name }], "Brandon, FL");
    expect(dupStates.get(dup)).toBe("do_not_contact");
    expect((await addProspect(sam, business({ name, placeId: dup, area: "Brandon FL 33511" }))).status).toBe("do_not_contact");
    // A branch of the same name in another town is a different business (also when the blocked listing's town is New York).
    const branch = placeId();
    expect((await claimStatesForPlaces(sam.id, [{ placeId: branch, name }], "Orlando, FL")).get(branch)).toBe("available");
    const nyName = `Joe's Pizza ${randomUUID().slice(0, 6)}`;
    const ny = await addProspect(jane, business({ name: nyName, placeId: placeId(), area: "New York, NY" }));
    if (ny.status !== "added") throw new Error("not added");
    await updateProspect(jane.id, ny.prospect.id, { status: "do_not_contact", ...none });
    const seattle = placeId();
    expect((await claimStatesForPlaces(sam.id, [{ placeId: seattle, name: nyName }], "Seattle, WA")).get(seattle)).toBe("available");
    // Sam's own reminder for the blocked business is cleared.
    expect((await getProspect(sam.id, samRow.prospect.id))?.nextFollowUpAt).toBeNull();

    // Contact details typed in later are checked too.
    const blockedSite = `${randomUUID().slice(0, 8)}.example.com`;
    const blockedRow = await addProspect(jane, business({ name: `Blocked ${randomUUID().slice(0, 6)}`, website: blockedSite, email: "owner@blocked.example.com" }));
    if (blockedRow.status !== "added") throw new Error("not added");
    await updateProspect(jane.id, blockedRow.prospect.id, { status: "do_not_contact", ...none });
    const other = await addProspect(sam, business({ name: `Another ${randomUUID().slice(0, 6)}` }));
    if (other.status !== "added") throw new Error("not added");
    expect(await updateProspect(sam.id, other.prospect.id, { ...none, email: "Owner@Blocked.example.com" })).toBe("blocked");
    expect(await updateProspect(sam.id, other.prospect.id, { ...none, website: blockedSite })).toBe("blocked");
    const claimedRow = await addProspect(jane, business({ name: `Claimed ${randomUUID().slice(0, 6)}`, phone: "(813) 555-0142" }));
    if (claimedRow.status !== "added") throw new Error("not added");
    expect(await updateProspect(sam.id, other.prospect.id, { ...none, phone: "813-555-0142" })).toBe("taken");
    expect(await getProspect(sam.id, other.prospect.id)).toMatchObject({ email: null, website: null, phone: null });
    // Recording an opt-out always works, even if the same save typed in colliding details (those are ignored).
    expect(await updateProspect(sam.id, other.prospect.id, { ...none, status: "do_not_contact", email: "owner@blocked.example.com" })).toBe("ok");
    expect(await getProspect(sam.id, other.prospect.id)).toMatchObject({ status: "do_not_contact", email: null });
    // Another agent's lapsed claim on the details typed in ends (no two active claims on one business).
    await db.update(schema.agentProspects).set({ activeAt: new Date(Date.now() - (CLAIM_DAYS + 1) * DAY) }).where(eq(schema.agentProspects.id, claimedRow.prospect.id));
    const third = await addProspect(sam, business({ name: `Third ${randomUUID().slice(0, 6)}` }));
    if (third.status !== "added") throw new Error("not added");
    expect(await updateProspect(sam.id, third.prospect.id, { ...none, phone: "813-555-0142" })).toBe("ok");
    const [lapsed] = await db.select().from(schema.agentProspects).where(eq(schema.agentProspects.id, claimedRow.prospect.id));
    expect(lapsed.releaseReason).toBe("expired");
  });

  it("re-keys stored names and areas to match the app (rows from before the keys existed)", async () => {
    const jane = await newAgent();
    const name = `The Smile Studio ${randomUUID().slice(0, 6)}, LLC`;
    const [row] = await db
      .insert(schema.agentProspects)
      .values({ agentId: jane.id, name, area: "Austin TX 78701", nameKey: "wrong", areaKey: "wrong", status: "do_not_contact", linkToken: randomUUID().replace(/-/g, "").slice(0, 12) })
      .returning();
    expect(await rekeyProspects(db)).toBeGreaterThanOrEqual(1);
    const [after] = await db.select().from(schema.agentProspects).where(eq(schema.agentProspects.id, row.id));
    expect(after).toMatchObject({ nameKey: matchKey(name), areaKey: "austin" });
    expect(await rekeyProspects(db)).toBe(0);
    const sam = await newAgent("Sam Other");
    expect((await addProspect(sam, business({ name: name.replace(/^The /, "").replace(", LLC", "") }))).status).toBe("do_not_contact");
  });

  it("lets an admin mark a business do-not-contact when it asked us directly", async () => {
    const jane = await newAgent();
    const sam = await newAgent("Sam Other");
    const place = placeId();
    const added = await addProspect(jane, business({ placeId: place }));
    if (added.status !== "added") throw new Error("not added");
    expect(await adminMarkDoNotContact(added.prospect.id)).toBe(true);
    expect(await getProspect(jane.id, added.prospect.id)).toMatchObject({ status: "do_not_contact", nextFollowUpAt: null });
    expect((await addProspect(sam, business({ placeId: place }))).status).toBe("do_not_contact");
    expect(await adminMarkDoNotContact("not-a-uuid")).toBe(false);
  });

  it("tracks status and follow-ups, and only lets agents edit details they typed in", async () => {
    const jane = await newAgent();
    const sam = await newAgent("Sam Other");
    const google = await addProspect(jane, business({ placeId: placeId() }));
    const manual = await addProspect(jane, business({ name: "Corner Gym", website: `${randomUUID().slice(0, 8)}.example.com` }));
    if (google.status !== "added" || manual.status !== "added") throw new Error("not added");
    const none = { notes: undefined, website: undefined, phone: undefined, email: undefined };

    const before = Date.now();
    // Moving it to Contacted in the form counts one message; the reminder is what the form says (empty: none).
    expect(await updateProspect(jane.id, google.prospect.id, { status: "contacted", nextFollowUp: "", ...none })).toBe("ok");
    let row = await getProspect(jane.id, google.prospect.id);
    expect(row?.lastContactedAt?.getTime()).toBeGreaterThanOrEqual(before - 1000);
    expect(row).toMatchObject({ contactCount: 1, nextFollowUpAt: null });
    // Saving it again as Contacted doesn't count another message.
    const firstContact = row!.lastContactedAt!.getTime();
    expect(await updateProspect(jane.id, google.prospect.id, { status: "contacted", nextFollowUp: "", ...none })).toBe("ok");
    row = await getProspect(jane.id, google.prospect.id);
    expect(row).toMatchObject({ contactCount: 1, nextFollowUpAt: null });
    expect(row!.lastContactedAt!.getTime()).toBe(firstContact);

    expect(await updateProspect(jane.id, google.prospect.id, { nextFollowUp: "2026-11-02", ...none })).toBe("ok");
    expect((await getProspect(jane.id, google.prospect.id))?.nextFollowUpAt?.toISOString()).toBe("2026-11-02T14:00:00.000Z");
    expect(await updateProspect(jane.id, google.prospect.id, { status: "not_interested", ...none })).toBe("ok");
    expect((await getProspect(jane.id, google.prospect.id))?.nextFollowUpAt).toBeNull();

    // A form that sends only the status keeps everything else.
    await updateProspect(jane.id, manual.prospect.id, prospectUpdateSchema.parse({ notes: "Met the owner at the chamber mixer", phone: "555-0100" }));
    expect(await updateProspect(jane.id, manual.prospect.id, prospectUpdateSchema.parse({ status: "replied" }))).toBe("ok");
    expect(await getProspect(jane.id, manual.prospect.id)).toMatchObject({ status: "replied", notes: "Met the owner at the chamber mixer", phone: "555-0100" });
    expect((await getProspect(jane.id, manual.prospect.id))?.website).toMatch(/^https:\/\//);
    // An emptied field is cleared.
    await updateProspect(jane.id, manual.prospect.id, prospectUpdateSchema.parse({ notes: "" }));
    expect((await getProspect(jane.id, manual.prospect.id))?.notes).toBeNull();

    // Google businesses keep Google's details (fetched live); hand-added ones take the agent's.
    await updateProspect(jane.id, google.prospect.id, { ...none, phone: "555-0101", email: "x@example.com" });
    row = await getProspect(jane.id, google.prospect.id);
    expect(row).toMatchObject({ phone: null, email: null });
    await updateProspect(jane.id, manual.prospect.id, { ...none, phone: "555-0102", email: "Owner@Example.com" });
    expect(await getProspect(jane.id, manual.prospect.id)).toMatchObject({ phone: "555-0102", email: "owner@example.com" });

    // A website another agent's prospect already has.
    const samSite = `${randomUUID().slice(0, 8)}.example.com`;
    expect((await addProspect(sam, business({ name: "Sam's Shop", website: samSite }))).status).toBe("added");
    expect(await updateProspect(jane.id, manual.prospect.id, { ...none, website: samSite })).toBe("taken");

    // Someone else's prospect isn't reachable.
    expect(await updateProspect(sam.id, manual.prospect.id, { status: "contacted", ...none })).toBe("not_found");
    expect(await getProspect(sam.id, manual.prospect.id)).toBeNull();
  });

  it("counts a first message and two follow-ups, then stops reminding", async () => {
    const jane = await newAgent();
    const added = await addProspect(jane, business({ placeId: placeId() }));
    if (added.status !== "added") throw new Error("not added");
    for (let n = 1; n <= MAX_CONTACTS; n++) {
      const before = Date.now();
      const res = await markProspectContacted(jane.id, added.prospect.id);
      expect(res).toMatchObject({ status: "ok", count: n });
      if (res.status !== "ok") return;
      if (n < MAX_CONTACTS) expect(res.followUpAt!.getTime() - before).toBeGreaterThanOrEqual(DEFAULT_FOLLOW_UP_DAYS * DAY - 1000);
      else expect(res.followUpAt).toBeNull();
    }
    expect(await getProspect(jane.id, added.prospect.id)).toMatchObject({ status: "contacted", contactCount: MAX_CONTACTS, nextFollowUpAt: null });
    // A reply isn't turned back into Contacted by another message, and a conversation keeps its reminders.
    await updateProspect(jane.id, added.prospect.id, prospectUpdateSchema.parse({ status: "replied" }));
    const reply = await markProspectContacted(jane.id, added.prospect.id);
    expect(reply).toMatchObject({ status: "ok", count: MAX_CONTACTS + 1 });
    expect(reply.status === "ok" && reply.followUpAt).toBeTruthy();
    expect((await getProspect(jane.id, added.prospect.id))?.status).toBe("replied");
    // Setting it back to Contacted in the form doesn't count as another message.
    await updateProspect(jane.id, added.prospect.id, prospectUpdateSchema.parse({ status: "contacted" }));
    expect((await getProspect(jane.id, added.prospect.id))?.contactCount).toBe(MAX_CONTACTS + 1);
  });

  it("caps the businesses in progress, not closed, blocked or expired ones", async () => {
    const jane = await newAgent();
    const sam = await newAgent("Sam Other");
    const token = () => randomUUID().replace(/-/g, "").slice(0, 12);
    await db.insert(schema.agentProspects).values(
      Array.from({ length: MAX_ACTIVE_PROSPECTS }, (_, i) => ({ agentId: jane.id, name: `Biz ${i}`, linkToken: token() })),
    );
    // Sam's claim on this business ran out.
    const place = placeId();
    const samRow = await addProspect(sam, business({ placeId: place }));
    if (samRow.status !== "added") throw new Error("not added");
    await db.update(schema.agentProspects).set({ activeAt: new Date(Date.now() - (CLAIM_DAYS + 1) * DAY) }).where(eq(schema.agentProspects.id, samRow.prospect.id));

    expect((await addProspect(jane, business({ placeId: place }))).status).toBe("limit");
    // A refused add changes nothing: Sam's old claim isn't released.
    const [stillSams] = await db.select().from(schema.agentProspects).where(eq(schema.agentProspects.id, samRow.prospect.id));
    expect(stillSams.releasedAt).toBeNull();

    // Closing one (or marking it do-not-contact) makes room.
    const [one] = await db.select().from(schema.agentProspects).where(and(eq(schema.agentProspects.agentId, jane.id), eq(schema.agentProspects.name, "Biz 0")));
    await updateProspect(jane.id, one.id, prospectUpdateSchema.parse({ status: "not_interested" }));
    expect((await addProspect(jane, business({ placeId: place }))).status).toBe("added");
    // ...and reopening a closed one past the cap is refused, from the form or by sending a message.
    expect(await updateProspect(jane.id, one.id, prospectUpdateSchema.parse({ status: "contacted" }))).toBe("limit");
    expect(await markProspectContacted(jane.id, one.id)).toEqual({ status: "limit" });
    expect(await messageAllowed(jane.id, (await getProspect(jane.id, one.id))!)).toBe("limit");
    // Notes on a closed one are fine.
    expect(await updateProspect(jane.id, one.id, prospectUpdateSchema.parse({ notes: "Try again in spring" }))).toBe("ok");
  });

  it("marks a business signed up when someone comes through its link, and credits the agent", async () => {
    const { GET } = await import("@/app/r/[code]/route");
    const jane = await newAgent();
    const sam = await newAgent("Sam Other");
    const added = await addProspect(jane, business({ placeId: placeId() }));
    if (added.status !== "added") throw new Error("not added");
    const link = new URL(prospectLink(jane.code!, added.prospect.linkToken));
    expect(link.pathname).toBe(`/r/${jane.code}`);
    expect(link.searchParams.get("to")).toBe("/assessment");

    const call = (code: string, token: string) =>
      GET(new Request(`http://localhost:3000/r/${code}?to=%2Fassessment&p=${token}`), { params: Promise.resolve({ code }) });
    const res = await call(jane.code!, added.prospect.linkToken);
    expect(res.headers.get("location")).toBe("http://localhost:3000/assessment");
    const cookies = res.headers.getSetCookie();
    expect(cookies.some((c) => c.startsWith(`${PROSPECT_COOKIE}=${added.prospect.linkToken};`) && c.includes("HttpOnly"))).toBe(true);
    // Someone else's code with Jane's token, or a made-up token: no prospect remembered.
    const remembers = (r: Response) => r.headers.getSetCookie().some((c) => c.startsWith(`${PROSPECT_COOKIE}=`) && !c.startsWith(`${PROSPECT_COOKIE}=;`));
    expect(remembers(await call(sam.code!, added.prospect.linkToken))).toBe(false);
    expect(remembers(await call(jane.code!, "../../etc"))).toBe(false);

    mocks.jar.set(AGENT_COOKIE, jane.code!);
    mocks.jar.set(PROSPECT_COOKIE, added.prospect.linkToken);
    const { contact } = await captureLead({ email: unique("owner"), name: "Joe Baker", source: "assessment", activity: { type: "quiz_completed", title: "Took the assessment" } });
    const row = await getProspect(jane.id, added.prospect.id);
    expect(row).toMatchObject({ contactId: contact.id, signedUp: true });
    expect(row?.signedUpAt).toBeInstanceOf(Date);
    const [ref] = await db.select().from(schema.agentReferrals).where(eq(schema.agentReferrals.contactId, contact.id));
    expect(ref.agentId).toBe(jane.id);
    // A signed-up business stays the agent's for longer than the usual claim...
    await db.update(schema.agentProspects).set({ activeAt: new Date(Date.now() - (CLAIM_DAYS + 5) * DAY) }).where(eq(schema.agentProspects.id, added.prospect.id));
    expect((await addProspect(sam, business({ placeId: added.prospect.placeId! }))).status).toBe("claimed");
    expect((await listProspects(jane.id)).some((p) => p.id === added.prospect.id)).toBe(true);
    // ...but not for ever.
    await db.update(schema.agentProspects).set({ activeAt: new Date(Date.now() - (HOLD_DAYS + 1) * DAY) }).where(eq(schema.agentProspects.id, added.prospect.id));
    expect((await addProspect(sam, business({ placeId: added.prospect.placeId! }))).status).toBe("added");

    // A later link without a prospect clears the remembered one.
    const plain = await GET(new Request(`http://localhost:3000/r/${jane.code}`), { params: Promise.resolve({ code: jane.code! }) });
    expect(plain.headers.getSetCookie().some((c) => c.startsWith(`${PROSPECT_COOKIE}=;`) && c.includes("Max-Age=0"))).toBe(true);
  });

  it("shows an agent a warm lead only with that person's consent, for that agent", async () => {
    const jane = await newAgent();
    const sam = await newAgent("Sam Other");
    const lead = (email: string, consent: string | null) => {
      mocks.jar.set(AGENT_COOKIE, jane.code!);
      return captureLead({ email, name: "Pat Lead", source: "lead_magnet", activity: { type: "optin", title: "Opt-in" }, agentFollowUpConsent: consent });
    };

    const yes = await lead(unique("yes"), jane.code!);
    const no = await lead(unique("no"), null);
    const wrong = await lead(unique("wrong"), sam.code!);
    let warm = await listWarmLeads(jane.id);
    expect(warm.map((w) => w.contactId)).toContain(yes.contact.id);
    expect(warm.map((w) => w.contactId)).not.toContain(no.contact.id);
    expect(warm.map((w) => w.contactId)).not.toContain(wrong.contact.id);
    expect((await listWarmLeads(sam.id)).map((w) => w.contactId)).not.toContain(wrong.contact.id);

    // Someone already in the CRM: the form neither moves them nor shares them.
    mocks.jar.clear();
    const existing = await captureLead({ email: unique("existing"), source: "contact_form", activity: { type: "form", title: "Contact" } });
    await lead(existing.contact.email, jane.code!);
    expect((await listWarmLeads(jane.id)).map((w) => w.contactId)).not.toContain(existing.contact.id);

    // Unsubscribing withdraws the OK for good: subscribing again doesn't show them to the agent again.
    const [{ token }] = await db.select({ token: schema.contacts.unsubscribeToken }).from(schema.contacts).where(eq(schema.contacts.id, yes.contact.id));
    await setMarketingSubscription(token, false, "unsubscribe_link");
    expect((await listWarmLeads(jane.id)).map((w) => w.contactId)).not.toContain(yes.contact.id);
    await setMarketingSubscription(token, true, "unsubscribe_link");
    expect((await listWarmLeads(jane.id)).map((w) => w.contactId)).not.toContain(yes.contact.id);
    // A warm lead shows only what the person agreed to share.
    expect(Object.keys(warm.find((w) => w.contactId === yes.contact.id)!).sort()).toEqual(["consentedAt", "contactId", "email", "name", "source"]);

    // Their consent was for Jane: if the customer moves to another agent, it doesn't go with them.
    const moved = await lead(unique("moved"), jane.code!);
    await assignContactToAgent(moved.contact.id, sam.id);
    expect((await listWarmLeads(sam.id)).map((w) => w.contactId)).not.toContain(moved.contact.id);
    const lapsed = await lead(unique("lapsed"), jane.code!);
    await db.update(schema.agentReferrals).set({ createdAt: new Date(Date.now() - 400 * DAY) }).where(eq(schema.agentReferrals.contactId, lapsed.contact.id));
    expect(await claimContactForAgent(lapsed.contact.id, sam.code)).toBe(true);
    warm = await listWarmLeads(sam.id);
    expect(warm.map((w) => w.contactId)).not.toContain(lapsed.contact.id);
  });

  it("writes outreach with the link, the commission disclosure and (email) the opt-out and address", async () => {
    await updateSettings({ mailingAddress: "123 Main St\nAustin, TX 78701" });
    const link = prospectLink("JANE27", "abcdefghijkl");
    const input = { agentName: "Jane Tester", businessName: "Joe's Bakery", category: "Bakery", area: "Austin, TX", notes: null, link };

    const email = await writeOutreach({ ...input, channel: "email" });
    expect(email.ai).toBe(false);
    expect(email.subject).toBeTruthy();
    expect(email.body).toContain(link);
    expect(email.body).toContain(DISCLOSURE);
    expect(email.body).toContain('Reply "stop"');
    expect(email.body).toContain(`${site.company}, 123 Main St, Austin, TX 78701`);
    expect(email.body).toContain("Jane");

    const dm = await writeOutreach({ ...input, channel: "message" });
    expect(dm.subject).toBeNull();
    expect(dm.body).toContain(link);
    expect(dm.body).toContain(DISCLOSURE);
    const call = await writeOutreach({ ...input, channel: "call" });
    expect(call.body).toContain(link);
    expect(call.body).toContain("commission");

    // The model's text, minus any link it added anyway; the real link and footer still go on.
    mocks.aiReply = "Subject: Quick AI idea for Joe's Bakery\n\nHi Joe's Bakery team,\n\nI help bakeries answer customer emails faster with AI. See https://evil.example/x or www.evil.example for more.\n\nWould a free check-up help?\n\nJane";
    const ai = await writeOutreach({ ...input, channel: "email" });
    expect(ai).toMatchObject({ ai: true, subject: "Quick AI idea for Joe's Bakery" });
    expect(ai.body).not.toContain("evil.example");
    expect(ai.body).toContain(link);
    expect(ai.body).toContain(DISCLOSURE);
    expect(ai.body).toContain('Reply "stop"');

    // No mailing address set yet: a placeholder (and a flag for the warning), never an email without one.
    await updateSettings({ mailingAddress: "" });
    const noAddress = await writeOutreach({ ...input, channel: "email" });
    expect(noAddress.addressMissing).toBe(true);
    expect(noAddress.body).toContain(`${site.company}, ${MISSING_ADDRESS}`);
    expect(email.addressMissing).toBe(false);
  });

  it("searches Google only with a key, within each agent's and the team's allowance", async () => {
    const jane = await newAgent();
    expect(await searchPlaces(jane.id, "bakery", "Austin, TX")).toEqual({ ok: false, error: "not_configured" });

    vi.stubEnv("GOOGLE_MAPS_API_KEY", "test-key");
    vi.stubEnv("PLACES_SEARCHES_PER_AGENT_PER_DAY", "2");
    const good = placeId();
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      const u = String(url);
      if (u.includes(":searchText")) {
        expect(JSON.parse(String(init?.body))).toMatchObject({ textQuery: "bakery in Austin, TX", regionCode: "US" });
        expect(new Headers(init?.headers).get("X-Goog-FieldMask")).not.toContain("websiteUri");
        return Response.json({
          places: [
            { id: good, displayName: { text: "Joe's Bakery" }, formattedAddress: "1 Main St", googleMapsUri: "https://maps.google.com/?cid=1", businessStatus: "OPERATIONAL" },
            { id: "bad id", displayName: { text: "Broken" } },
            { id: placeId(), displayName: { text: "Closed Cafe" }, googleMapsUri: "javascript:alert(1)", businessStatus: "CLOSED_PERMANENTLY" },
          ],
        });
      }
      return Response.json({ id: good, displayName: { text: "Joe's Bakery" }, websiteUri: "javascript:alert(1)", nationalPhoneNumber: "(512) 555-0100" });
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await searchPlaces(jane.id, "bakery", "Austin, TX");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.map((p) => p.name)).toEqual(["Joe's Bakery", "Closed Cafe"]);
    expect(res.data[1]).toMatchObject({ operational: false, mapsUrl: null });
    expect((await searchPlaces(jane.id, "bakery", "Austin, TX")).ok).toBe(true);
    expect(await searchPlaces(jane.id, "bakery", "Austin, TX")).toEqual({ ok: false, error: "agent_limit" });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const details = await placeDetails(jane.id, good);
    expect(details).toMatchObject({ ok: true, data: { website: null, phone: "(512) 555-0100" } });
    expect(await placeDetails(jane.id, "../secrets")).toEqual({ ok: false, error: "unavailable" });

    // A listing Google no longer has: its own answer, not "try again".
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 404 })));
    expect(await placeDetails(jane.id, good)).toEqual({ ok: false, error: "not_found" });

    // Google down: a clear error, not a crash, and the refused call isn't counted.
    const count = async (key: string) => (await db.select().from(schema.rateLimits).where(eq(schema.rateLimits.key, key)))[0]?.count ?? 0;
    const detailsBefore = await count(`places-details:${jane.id}`);
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 500 })));
    expect(await placeDetails(jane.id, good)).toEqual({ ok: false, error: "unavailable" });
    expect(await count(`places-details:${jane.id}`)).toBe(detailsBefore);
  });

  it("stops search for everyone once the team's monthly allowance is spent", async () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "test-key");
    const fetchMock = vi.fn(async () => Response.json({ places: [] }));
    vi.stubGlobal("fetch", fetchMock);
    // The site-wide counter is shared with other tests in this file: set it straight to the cap.
    vi.stubEnv("PLACES_SEARCHES_PER_MONTH", "1");
    const siteKey = placesSiteKey("search");
    expect(siteKey).toMatch(/^places-site:search:\d{4}-\d{2}$/);
    await db.execute(sql`insert into rate_limits (key, count, window_start) values (${siteKey}, 1, now()) on conflict (key) do update set count = 1, window_start = now()`);
    const sam = await newAgent("Sam Other");
    expect(await searchPlaces(sam.id, "gym", "Austin, TX")).toEqual({ ok: false, error: "site_limit" });
    expect(fetchMock).not.toHaveBeenCalled();
    // The refusal used up none of Sam's own allowance.
    const [samRow] = await db.select().from(schema.rateLimits).where(eq(schema.rateLimits.key, `places-search:${sam.id}`));
    expect(samRow?.count ?? 0).toBe(0);

    // The daily cleanup keeps this month's counter (it used to vanish after two days, resetting the cap).
    await db.update(schema.rateLimits).set({ windowStart: new Date(Date.now() - 20 * DAY) }).where(eq(schema.rateLimits.key, siteKey));
    await runScheduledJobs();
    expect((await db.select().from(schema.rateLimits).where(eq(schema.rateLimits.key, siteKey))).length).toBe(1);
    expect(await searchPlaces(sam.id, "gym", "Austin, TX")).toEqual({ ok: false, error: "site_limit" });
    await db.update(schema.rateLimits).set({ windowStart: new Date(Date.now() - 40 * DAY) }).where(eq(schema.rateLimits.key, siteKey));
    await runScheduledJobs();
    expect((await db.select().from(schema.rateLimits).where(eq(schema.rateLimits.key, siteKey))).length).toBe(0);
  });

  it("lists only the agent's own active prospects", async () => {
    const jane = await newAgent();
    const sam = await newAgent("Sam Other");
    const a = await addProspect(jane, business({ placeId: placeId() }));
    await addProspect(sam, business({ placeId: placeId() }));
    if (a.status !== "added") throw new Error("not added");
    const mine = await listProspects(jane.id);
    expect(mine.map((p) => p.id)).toEqual([a.prospect.id]);
    const active = await db.select().from(schema.agentProspects).where(and(eq(schema.agentProspects.agentId, jane.id), isNull(schema.agentProspects.releasedAt)));
    expect(active).toHaveLength(1);
  });
});
