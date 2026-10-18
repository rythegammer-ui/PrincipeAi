"use client";

import { CheckCircle2, Loader2, Save, TriangleAlert } from "lucide-react";
import { startTransition, useActionState, useState } from "react";
import { saveLessonAction, type FormState } from "@/app/admin/(panel)/courses/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { VIDEO_PROVIDER_LABELS, parseVideoUrl } from "@/lib/video";
import { MarkdownField } from "./markdown-field";

export type LessonFormValues = {
  id?: string;
  moduleId: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  videoUrl: string;
  durationMin: number;
  isPreview: boolean;
};

const LESSON_TEMPLATE = `## What you'll learn

-

## The idea

Explain the concept in plain English with one concrete example.

## Try it now

1.
2.

> **Prompt to copy:** …

## Key takeaway

`;

export function LessonForm({
  courseId,
  modules,
  lesson,
}: {
  courseId: string;
  modules: { id: string; title: string }[];
  lesson: LessonFormValues;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveLessonAction, {});
  const [videoUrl, setVideoUrl] = useState(lesson.videoUrl);
  const fe = state.fieldErrors ?? {};
  const video = videoUrl.trim() ? parseVideoUrl(videoUrl) : null;
  const isNew = !lesson.id;

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
      <input type="hidden" name="courseId" value={courseId} />
      {lesson.id && <input type="hidden" name="lessonId" value={lesson.id} />}
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}

      <Card>
        <CardContent className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Field label="Lesson title" htmlFor="title" error={fe.title} required className="lg:col-span-2">
            <Input id="title" name="title" defaultValue={lesson.title} maxLength={200} aria-invalid={fe.title ? true : undefined} autoFocus={isNew} />
          </Field>
          <Field label="Module" htmlFor="moduleId" error={fe.moduleId}>
            <Select id="moduleId" name="moduleId" defaultValue={lesson.moduleId}>
              {modules.map((m, i) => (
                <option key={m.id} value={m.id}>
                  {i + 1}. {m.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="URL slug" htmlFor="slug" error={fe.slug} hint={isNew ? "Leave blank to generate from the title." : "Changing this breaks bookmarks to the lesson."}>
            <Input id="slug" name="slug" defaultValue={lesson.slug} maxLength={80} placeholder="e.g. writing-better-prompts" aria-invalid={fe.slug ? true : undefined} />
          </Field>
          <Field label="Summary" htmlFor="summary" error={fe.summary} hint="One line shown in the curriculum and at the top of the lesson." className="lg:col-span-2">
            <Textarea id="summary" name="summary" defaultValue={lesson.summary} rows={2} maxLength={400} />
          </Field>
          <Field
            label="Video URL"
            htmlFor="videoUrl"
            error={fe.videoUrl}
            hint={
              video ? (
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <CheckCircle2 className="size-3.5" aria-hidden /> {VIDEO_PROVIDER_LABELS[video.provider]} video detected — it will be embedded above the lesson.
                </span>
              ) : videoUrl.trim() ? (
                <span className="inline-flex items-center gap-1 text-amber-700">
                  <TriangleAlert className="size-3.5" aria-hidden /> Only YouTube, Vimeo and Loom links can be embedded.
                </span>
              ) : (
                "Optional. Paste a YouTube, Vimeo or Loom link."
              )
            }
          >
            <Input
              id="videoUrl"
              name="videoUrl"
              type="url"
              inputMode="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              aria-invalid={fe.videoUrl ? true : undefined}
            />
          </Field>
          <div className="grid grid-cols-2 gap-5">
            <Field label="Duration (min)" htmlFor="durationMin" error={fe.durationMin}>
              <Input id="durationMin" name="durationMin" type="number" min={1} max={600} defaultValue={lesson.durationMin} />
            </Field>
            <div className="flex flex-col justify-end pb-2.5">
              <label className="flex items-start gap-2.5 text-sm">
                <Checkbox name="isPreview" defaultChecked={lesson.isPreview} className="mt-0.5" />
                <span>
                  <span className="font-medium text-zinc-900">Free preview</span>
                  <span className="block text-xs text-zinc-500">Anyone can watch it from the sales page.</span>
                </span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <MarkdownField
            name="content"
            label="Lesson content"
            defaultValue={lesson.content || (isNew ? LESSON_TEMPLATE : "")}
            rows={24}
            allowSplit
            error={fe.content}
            hint="Markdown: ## headings, **bold**, lists, > quotes, `code`, tables and links. Raw HTML is never rendered."
          />
        </CardContent>
      </Card>

      <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-end gap-3 border-t border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        {state.ok && !pending && <span className="text-sm text-emerald-700">Saved</span>}
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
          {pending ? "Saving…" : isNew ? "Create lesson" : "Save lesson"}
        </Button>
      </div>
    </form>
  );
}
