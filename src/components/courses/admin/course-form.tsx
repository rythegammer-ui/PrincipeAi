"use client";

import { Loader2, Save } from "lucide-react";
import { startTransition, useActionState } from "react";
import { updateCourseAction, type FormState } from "@/app/admin/(panel)/courses/actions";
import { LEVELS } from "@/components/courses/course-utils";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { CourseCover } from "../course-cover";
import { FaqEditor } from "./faq-editor";
import { MarkdownField } from "./markdown-field";

export type CourseFormValues = {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  audience: string;
  level: string;
  priceCents: number;
  compareAtCents: number | null;
  coverEmoji: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  outcomes: string[];
  includes: string[];
  faqs: { q: string; a: string }[];
};

const dollars = (cents: number | null) => (cents === null ? "" : cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2));

/** Full course editor. Submits without resetting the form so validation errors never lose edits. */
export function CourseForm({ course }: { course: CourseFormValues }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(updateCourseAction, {});
  const fe = state.fieldErrors ?? {};
  const levels: readonly string[] = LEVELS.includes(course.level as (typeof LEVELS)[number]) ? LEVELS : [...LEVELS, course.level];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="flex flex-col gap-6"
      noValidate
    >
      <input type="hidden" name="id" value={course.id} />
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales page</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <Field label="Title" htmlFor="title" error={fe.title} required>
                <Input id="title" name="title" defaultValue={course.title} maxLength={160} aria-invalid={fe.title ? true : undefined} />
              </Field>
              <Field label="URL" htmlFor="slug" error={fe.slug} hint="Changing this breaks old links to the course.">
                <div className="flex items-center overflow-hidden rounded-xl border border-zinc-300 bg-zinc-50 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/15">
                  <span className="pl-3.5 text-sm text-zinc-500">/courses/</span>
                  <input
                    id="slug"
                    name="slug"
                    defaultValue={course.slug}
                    maxLength={80}
                    aria-invalid={fe.slug ? true : undefined}
                    className="h-11 min-w-0 flex-1 bg-white px-2 text-sm text-zinc-900 outline-none"
                  />
                </div>
              </Field>
              <Field label="Subtitle" htmlFor="subtitle" error={fe.subtitle} hint="One sentence promise shown under the title and on course cards.">
                <Textarea id="subtitle" name="subtitle" defaultValue={course.subtitle} rows={2} maxLength={240} />
              </Field>
              <MarkdownField
                name="description"
                label="Description"
                defaultValue={course.description}
                rows={10}
                error={fe.description}
                hint="Markdown supported: **bold**, lists, ## headings, [links](https://…)."
              />
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Field label="Outcomes" htmlFor="outcomes" hint="One per line — what students will be able to do." error={fe.outcomes}>
                  <Textarea id="outcomes" name="outcomes" defaultValue={course.outcomes.join("\n")} rows={6} />
                </Field>
                <Field label="What's included" htmlFor="includes" hint="One per line — e.g. Lifetime access, templates, bonuses." error={fe.includes}>
                  <Textarea id="includes" name="includes" defaultValue={course.includes.join("\n")} rows={6} />
                </Field>
              </div>
              <FaqEditor defaultValue={course.faqs} error={fe.faqs} />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Visibility</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <label className="flex items-start gap-3 text-sm">
                <Checkbox name="published" defaultChecked={course.published} className="mt-0.5" />
                <span>
                  <span className="font-medium text-zinc-900">Published</span>
                  <span className="block text-xs text-zinc-500">Visible in the catalog and open for enrollment.</span>
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm">
                <Checkbox name="featured" defaultChecked={course.featured} className="mt-0.5" />
                <span>
                  <span className="font-medium text-zinc-900">Featured</span>
                  <span className="block text-xs text-zinc-500">Shows a “Most popular” ribbon.</span>
                </span>
              </label>
              <Field label="Catalog order" htmlFor="sortOrder" hint="Lower numbers appear first." error={fe.sortOrder}>
                <Input id="sortOrder" name="sortOrder" type="number" min={0} max={999} defaultValue={course.sortOrder} />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field label="Price (USD)" htmlFor="price" error={fe.price} required hint="Use 0 for a free course.">
                <Input id="price" name="price" inputMode="decimal" defaultValue={dollars(course.priceCents)} aria-invalid={fe.price ? true : undefined} />
              </Field>
              <Field label="Compare-at price (USD)" htmlFor="compareAt" error={fe.compareAt} hint="Optional “was” price, shown struck through.">
                <Input id="compareAt" name="compareAt" inputMode="decimal" defaultValue={dollars(course.compareAtCents)} aria-invalid={fe.compareAt ? true : undefined} />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audience & cover</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field label="Audience" htmlFor="audience" error={fe.audience} hint="Drives the catalog filters and recommendations.">
                <Select id="audience" name="audience" defaultValue={course.audience}>
                  <option value="life">Everyday life</option>
                  <option value="business">Business</option>
                  <option value="both">Life & business</option>
                </Select>
              </Field>
              <Field label="Level" htmlFor="level" error={fe.level}>
                <Select id="level" name="level" defaultValue={course.level}>
                  {levels.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="flex items-end gap-3">
                <Field label="Cover emoji" htmlFor="coverEmoji" error={fe.coverEmoji} className="flex-1">
                  <Input id="coverEmoji" name="coverEmoji" defaultValue={course.coverEmoji} maxLength={16} />
                </Field>
                <CourseCover emoji={course.coverEmoji} audience={course.audience} size="sm" className="size-11 shrink-0 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-end gap-3 border-t border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        {state.ok && !pending && <span className="text-sm text-emerald-700">Saved</span>}
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
          {pending ? "Saving…" : "Save course"}
        </Button>
      </div>
    </form>
  );
}
