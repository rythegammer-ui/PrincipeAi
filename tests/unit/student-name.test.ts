import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";

// Run the admin server action outside a request: signed in, without a Next cache.
vi.mock("@/lib/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth")>()),
  assertAdmin: async () => ({ sub: "admin", role: "admin", email: "admin@example.com" }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

import { updateContactProfileAction } from "@/app/admin/(panel)/contacts/actions";
import { getDb, schema } from "@/db";
import { upsertStudent } from "@/lib/auth";
import { upsertContact } from "@/lib/crm";

async function userName(email: string) {
  const db = await getDb();
  const [user] = await db.select({ name: schema.users.name }).from(schema.users).where(eq(schema.users.email, email));
  return user?.name ?? null;
}

describe("student names (certificates, portal greeting)", () => {
  it("fills a missing name on a later sign-in or purchase, but never overwrites one", async () => {
    await upsertStudent("nameless-1@example.com");
    expect(await userName("nameless-1@example.com")).toBeNull();
    await upsertStudent("nameless-1@example.com", "Nora Student");
    expect(await userName("nameless-1@example.com")).toBe("Nora Student");
    await upsertStudent("nameless-1@example.com", "Someone Else");
    expect(await userName("nameless-1@example.com")).toBe("Nora Student");
  });

  it("takes the CRM contact's name when the student account has none", async () => {
    await upsertStudent("granted-1@example.com");
    expect(await userName("granted-1@example.com")).toBeNull();
    await upsertContact({ email: "granted-1@example.com", name: "Gwen Granted", source: "manual" });
    // e.g. the next magic-link sign-in
    await upsertStudent("granted-1@example.com");
    expect(await userName("granted-1@example.com")).toBe("Gwen Granted");
  });

  it("follows a name corrected in the CRM", async () => {
    const { contact } = await upsertContact({ email: "nora.crm@example.com", source: "manual" });
    const user = await upsertStudent("nora.crm@example.com");
    expect(user.contactId).toBe(contact.id);
    expect(user.name).toBeNull();

    const form = new FormData();
    for (const [k, v] of Object.entries({ id: contact.id, name: "Nora Student", email: contact.email, phone: "", company: "", website: "", segment: "" })) {
      form.set(k, v);
    }
    expect(await updateContactProfileAction({}, form)).toMatchObject({ ok: true });
    expect(await userName("nora.crm@example.com")).toBe("Nora Student");

    // Clearing the contact's name leaves the student's name alone.
    form.set("name", "");
    expect(await updateContactProfileAction({}, form)).toMatchObject({ ok: true });
    expect(await userName("nora.crm@example.com")).toBe("Nora Student");
  });
});
