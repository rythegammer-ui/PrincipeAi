import { Search, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CleanGetForm } from "@/components/admin/clean-get-form";
import { SEGMENTS, SEGMENT_LABELS } from "@/components/admin/crm-utils";
import { PipelineBoard } from "@/components/admin/pipeline-board";
import { ButtonLink, buttonVariants } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/misc";
import { getPipelineBoard, parsePipelineFilters, PIPELINE_CARDS_PER_STAGE } from "@/lib/crm-queries";

export const metadata: Metadata = { title: "Pipeline" };

export default async function PipelinePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = parsePipelineFilters(await searchParams);
  const board = await getPipelineBoard(filters);
  const hasFilters = Boolean(filters.q || filters.segment || filters.minScore);
  const formKey = `${filters.q}|${filters.segment ?? ""}|${filters.minScore ?? ""}`;

  return (
    <div>
      <PageHeader
        title="Pipeline"
        description="Every lead from first opt-in to paying client. Drag a card to move it — the stage change is logged on the contact’s timeline."
        actions={
          <ButtonLink href="/admin/contacts/new" size="sm" className="h-9">
            <UserPlus aria-hidden /> New contact
          </ButtonLink>
        }
      />

      <CleanGetForm key={formKey} action="/admin/pipeline" label="Filter pipeline" className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <label htmlFor="pipeline-search" className="sr-only">
            Search contacts
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-400" aria-hidden />
          <Input id="pipeline-search" name="q" type="search" defaultValue={filters.q} placeholder="Search name, email or company…" className="h-10 pl-10" maxLength={100} />
        </div>
        <div className="flex gap-2">
          <label htmlFor="pipeline-segment" className="sr-only">
            Interest
          </label>
          <Select id="pipeline-segment" name="segment" defaultValue={filters.segment ?? ""} className="h-10 min-w-0 flex-1 sm:w-44 sm:flex-none">
            <option value="">All interests</option>
            {SEGMENTS.map((s) => (
              <option key={s} value={s}>
                {SEGMENT_LABELS[s]}
              </option>
            ))}
            <option value="none">Not set</option>
          </Select>
          <label htmlFor="pipeline-score" className="sr-only">
            Minimum lead score
          </label>
          <Select id="pipeline-score" name="minScore" defaultValue={filters.minScore ? String(filters.minScore) : ""} className="h-10 min-w-0 flex-1 sm:w-36 sm:flex-none">
            <option value="">Any score</option>
            <option value="30">30+ (warm)</option>
            <option value="60">60+ (hot)</option>
            <option value="80">80+ (very hot)</option>
          </Select>
          <button type="submit" className={buttonVariants({ variant: "secondary", className: "h-10" })}>
            Search
          </button>
        </div>
        {hasFilters && (
          <Link href="/admin/pipeline" className="text-sm font-medium text-brand-700 hover:underline sm:ml-2">
            Clear
          </Link>
        )}
      </CleanGetForm>

      <PipelineBoard cards={board.cards} totals={board.totals} now={new Date().toISOString()} perStageLimit={PIPELINE_CARDS_PER_STAGE} />
    </div>
  );
}
