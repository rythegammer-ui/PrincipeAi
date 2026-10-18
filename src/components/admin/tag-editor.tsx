"use client";

import { Plus, X } from "lucide-react";
import { useId, useOptimistic, useRef, useState, useTransition } from "react";
import { addContactTagAction, removeContactTagAction } from "@/app/admin/(panel)/contacts/actions";

type TagOp = { type: "add" | "remove"; tag: string };

/** Tag chips with add / remove (optimistic). */
export function TagEditor({ contactId, tags }: { contactId: string; tags: string[] }) {
  const id = useId();
  const [list, apply] = useOptimistic(tags, (state: string[], op: TagOp) =>
    op.type === "add" ? (state.includes(op.tag) ? state : [...state, op.tag]) : state.filter((t) => t !== op.tag),
  );
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const run = (op: TagOp) => {
    setError(null);
    startTransition(async () => {
      apply(op);
      const res = op.type === "add" ? await addContactTagAction(contactId, op.tag) : await removeContactTagAction(contactId, op.tag);
      if (!res.ok) setError(res.error);
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
        {list.length === 0 && <li className="text-sm text-zinc-500">No tags yet.</li>}
        {list.map((tag) => (
          <li key={tag} className="inline-flex items-center gap-0.5 rounded-full bg-zinc-100 py-0.5 pr-0.5 pl-2.5 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200 ring-inset">
            {tag}
            <button
              type="button"
              onClick={() => run({ type: "remove", tag })}
              className="inline-flex size-5 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-brand-500"
              aria-label={`Remove tag ${tag}`}
            >
              <X className="size-3" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="flex items-center gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          const tag = inputRef.current?.value.trim().toLowerCase() ?? "";
          if (!tag) return;
          run({ type: "add", tag });
          if (inputRef.current) inputRef.current.value = "";
        }}
      >
        <label htmlFor={id} className="sr-only">
          Add a tag
        </label>
        <input
          ref={inputRef}
          id={id}
          maxLength={40}
          placeholder="Add a tag…"
          className="h-8 w-full max-w-48 rounded-lg border border-zinc-300 bg-white px-2.5 text-sm placeholder:text-zinc-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 focus:outline-none"
        />
        <button type="submit" className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-sm font-medium text-brand-700 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-500">
          <Plus className="size-3.5" aria-hidden /> Add
        </button>
      </form>
      {error && <p role="alert" className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
