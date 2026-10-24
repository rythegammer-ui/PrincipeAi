"use client";

import { Ban, Check, ExternalLink, MapPin, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { addFromSearchAction, searchBusinessesAction, type AddState, type SearchResultView, type SearchState } from "./actions";

/** Find businesses with Google search, then add the ones to reach out to. Results aren't stored (Google's terms). */
export function SearchPanel({ defaultWhere, enabled }: { defaultWhere: string; enabled: boolean }) {
  const [state, action] = useActionState<SearchState, FormData>(searchBusinessesAction, {});
  const results = state.results;

  return (
    <div>
      {!enabled && (
        <Alert tone="info" title="Business search isn't switched on yet" className="mb-4">
          You can still add businesses you find yourself (for example on Google Maps) with &ldquo;Add a business you found yourself&rdquo; below.
        </Alert>
      )}
      <form action={action} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="What kind of business" htmlFor="lead-what">
          <Input id="lead-what" name="what" placeholder="e.g. dentists, salons, real estate" maxLength={80} defaultValue={state.what ?? ""} disabled={!enabled} required />
        </Field>
        <Field label="Where" htmlFor="lead-where">
          <Input id="lead-where" name="where" placeholder="e.g. Tampa, FL" maxLength={120} defaultValue={state.where ?? defaultWhere} disabled={!enabled} required />
        </Field>
        <SubmitButton className="min-h-11" pendingText="Searching…" disabled={!enabled}>
          <Search aria-hidden /> Search
        </SubmitButton>
      </form>

      {state.error && (
        <Alert tone="error" className="mt-4">
          {state.error}
        </Alert>
      )}
      <p role="status" className="sr-only">
        {results ? (results.length ? `${results.length} businesses found.` : "No businesses found.") : ""}
      </p>

      {results && (
        <div className="mt-5">
          {results.length === 0 ? (
            <p className="text-sm text-zinc-600">No businesses found. Try a broader kind of business or a nearby city.</p>
          ) : (
            <>
              <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
                {results.map((r) => (
                  <ResultRow key={r.placeId} result={r} what={state.what ?? ""} where={state.where ?? ""} />
                ))}
              </ul>
              <p className="mt-2 text-xs text-zinc-500">
                Results from <span className="font-medium text-zinc-700">Google Maps</span>. Check each business before you reach out.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ResultRow({ result, what, where }: { result: SearchResultView; what: string; where: string }) {
  const [state, action] = useActionState<AddState, FormData>(addFromSearchAction, {});
  const added = state.result === "added" || state.result === "already_yours" || result.claim === "mine";
  const blocked = result.claim === "claimed" || result.claim === "do_not_contact" || state.result === "claimed" || state.result === "do_not_contact";

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium text-zinc-900">{result.name}</p>
        <p className="mt-0.5 flex items-start gap-1 text-sm text-zinc-500">
          <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>{result.address || "Address not listed"}</span>
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {result.category && <Badge>{result.category}</Badge>}
          {!result.operational && <Badge tone="amber">May be closed</Badge>}
          {result.mapsUrl && (
            <a
              href={result.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1 text-xs font-medium text-brand-700 hover:underline sm:min-h-0"
            >
              Open in Google Maps <ExternalLink className="size-3" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
        </div>
        {state.error && !blocked && (
          <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">
            {state.error}
          </p>
        )}
      </div>
      <div className="shrink-0">
        {added ? (
          state.prospectId ? (
            <Link href={`/agent/leads/${state.prospectId}`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline sm:min-h-9">
              <Check className="size-4" aria-hidden /> In your prospects: open
            </Link>
          ) : (
            <Badge tone="green">
              <Check aria-hidden /> In your prospects
            </Badge>
          )
        ) : blocked ? (
          <Badge tone={result.claim === "do_not_contact" || state.result === "do_not_contact" ? "red" : "neutral"}>
            <Ban aria-hidden />
            {result.claim === "do_not_contact" || state.result === "do_not_contact" ? "Do not contact" : "Another agent has this one"}
          </Badge>
        ) : (
          <form action={action}>
            <input type="hidden" name="placeId" value={result.placeId} />
            <input type="hidden" name="name" value={result.name} />
            <input type="hidden" name="what" value={what} />
            <input type="hidden" name="where" value={where} />
            <SubmitButton variant="outline" className="min-h-11 sm:min-h-9" pendingText="Adding…">
              <Plus aria-hidden /> Add to my prospects
            </SubmitButton>
          </form>
        )}
      </div>
    </li>
  );
}
