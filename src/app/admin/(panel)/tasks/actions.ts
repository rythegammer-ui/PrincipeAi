"use server";

import { eq } from "drizzle-orm";
import { DateTime } from "luxon";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { assertAdmin } from "@/lib/auth";
import { createTask, logActivity } from "@/lib/crm";
import { getBusinessTimezone } from "@/lib/scheduling";
import { isValidEmail, normalizeEmail, truncate } from "@/lib/utils";

export type TaskFormState = {
  ok?: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string | undefined>;
  values?: Record<string, string>;
};
export type TaskActionResult = { ok: true } | { ok: false; error: string };

const str = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
};

const TaskSchema = z.object({
  title: z.string().trim().min(1, "Give the task a title.").max(200, "Keep the title under 200 characters."),
  description: z.string().trim().max(2000, "Keep the description under 2,000 characters."),
  contactId: z.union([z.literal(""), z.uuid()]).catch(""),
  contact: z.string().trim().max(254),
  dueAt: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(v), "Pick a valid date and time."),
  priority: z.enum(["low", "normal", "high"], { message: "Choose a priority." }),
});

const KEYS = ["title", "description", "contact", "dueAt", "priority"];

export async function createTaskAction(_prev: TaskFormState, formData: FormData): Promise<TaskFormState> {
  await assertAdmin();
  const values = Object.fromEntries(KEYS.map((k) => [k, str(formData, k)]));
  const parsed = TaskSchema.safeParse({ ...values, contactId: str(formData, "contactId"), priority: values.priority || "normal" });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { error: "Please fix the highlighted fields.", fieldErrors, values };
  }
  const input = parsed.data;
  const db = await getDb();

  let contactId: string | null = null;
  if (input.contactId) {
    const [row] = await db.select({ id: schema.contacts.id }).from(schema.contacts).where(eq(schema.contacts.id, input.contactId)).limit(1);
    if (!row) return { error: "That contact no longer exists.", values };
    contactId = row.id;
  } else if (input.contact) {
    if (!isValidEmail(input.contact)) return { error: "Please fix the highlighted fields.", fieldErrors: { contact: "Pick a contact from the list or type their email." }, values };
    const [row] = await db
      .select({ id: schema.contacts.id })
      .from(schema.contacts)
      .where(eq(schema.contacts.email, normalizeEmail(input.contact)))
      .limit(1);
    if (!row) return { error: "Please fix the highlighted fields.", fieldErrors: { contact: "No contact with that email. Add them first, or leave this blank." }, values };
    contactId = row.id;
  }

  let dueAt: Date | null = null;
  if (input.dueAt) {
    const tz = await getBusinessTimezone();
    const dt = DateTime.fromISO(input.dueAt.length === 10 ? `${input.dueAt}T09:00` : input.dueAt, { zone: tz });
    if (!dt.isValid) return { error: "Please fix the highlighted fields.", fieldErrors: { dueAt: "Pick a valid date and time." }, values };
    dueAt = dt.toJSDate();
  }

  await createTask({
    title: input.title,
    description: input.description || null,
    contactId,
    dueAt,
    priority: input.priority,
    origin: "manual",
  });
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Task added." };
}

export async function setTaskDoneAction(taskId: string, done: boolean): Promise<TaskActionResult> {
  await assertAdmin();
  const parsed = z.object({ id: z.uuid(), done: z.boolean() }).safeParse({ id: taskId, done });
  if (!parsed.success) return { ok: false, error: "Invalid task." };
  const db = await getDb();
  const t = schema.tasks;
  const [task] = await db
    .update(t)
    .set({ completedAt: parsed.data.done ? new Date() : null })
    .where(eq(t.id, parsed.data.id))
    .returning({ id: t.id, title: t.title, contactId: t.contactId });
  if (!task) return { ok: false, error: "This task no longer exists." };
  if (parsed.data.done && task.contactId) {
    await logActivity(task.contactId, "task", `Task completed: ${truncate(task.title, 140)}`, { meta: { by: "admin" } });
  }
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function deleteTaskAction(taskId: string): Promise<TaskActionResult> {
  await assertAdmin();
  const id = z.uuid().safeParse(taskId);
  if (!id.success) return { ok: false, error: "Invalid task." };
  const db = await getDb();
  await db.delete(schema.tasks).where(eq(schema.tasks.id, id.data));
  revalidatePath("/admin", "layout");
  return { ok: true };
}
