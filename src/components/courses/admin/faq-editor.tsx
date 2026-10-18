"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/form";

type Faq = { key: number; q: string; a: string };

/** Editable list of FAQ question/answer pairs, submitted as JSON in a hidden `faqs` field. */
export function FaqEditor({ name = "faqs", defaultValue, error }: { name?: string; defaultValue: { q: string; a: string }[]; error?: string }) {
  const nextKey = useRef(defaultValue.length);
  const [items, setItems] = useState<Faq[]>(() => defaultValue.map((f, i) => ({ key: i, ...f })));

  const update = (key: number, patch: Partial<Faq>) => setItems((list) => list.map((f) => (f.key === key ? { ...f, ...patch } : f)));
  const move = (index: number, delta: number) =>
    setItems((list) => {
      const j = index + delta;
      if (j < 0 || j >= list.length) return list;
      const copy = [...list];
      [copy[index], copy[j]] = [copy[j], copy[index]];
      return copy;
    });
  const add = () => setItems((list) => [...list, { key: nextKey.current++, q: "", a: "" }]);
  const remove = (key: number) => setItems((list) => list.filter((f) => f.key !== key));

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium text-zinc-800">FAQs</legend>
      <input type="hidden" name={name} value={JSON.stringify(items.map(({ q, a }) => ({ q, a })))} />
      {items.length === 0 && <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">No FAQs yet. Answer the questions buyers ask before they enroll.</p>}
      {items.map((f, i) => (
        <div key={f.key} className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 sm:p-4">
          <div className="flex items-start gap-2">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <label className="sr-only" htmlFor={`faq-q-${f.key}`}>
                Question {i + 1}
              </label>
              <Input id={`faq-q-${f.key}`} value={f.q} onChange={(e) => update(f.key, { q: e.target.value })} placeholder="Question" maxLength={300} />
              <label className="sr-only" htmlFor={`faq-a-${f.key}`}>
                Answer {i + 1}
              </label>
              <Textarea id={`faq-a-${f.key}`} value={f.a} onChange={(e) => update(f.key, { a: e.target.value })} placeholder="Answer" rows={2} maxLength={3000} />
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              <Button variant="ghost" size="icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move question ${i + 1} up`}>
                <ArrowUp aria-hidden />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={`Move question ${i + 1} down`}>
                <ArrowDown aria-hidden />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => remove(f.key)} aria-label={`Remove question ${i + 1}`} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                <Trash2 aria-hidden />
              </Button>
            </div>
          </div>
        </div>
      ))}
      <div>
        <Button variant="outline" size="sm" onClick={add} disabled={items.length >= 30}>
          <Plus aria-hidden /> Add question
        </Button>
      </div>
      {error && (
        <p className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
