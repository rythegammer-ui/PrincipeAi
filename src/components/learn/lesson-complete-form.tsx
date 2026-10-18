import { ArrowRight, Check, RotateCcw } from "lucide-react";
import { setLessonCompleteAction } from "@/app/learn/actions";
import { SubmitButton } from "@/components/ui/submit-button";

/** "Complete & continue" / "Mark incomplete" controls for a lesson (works without JS). */
export function LessonCompleteForm({ lessonId, completed, hasNext }: { lessonId: string; completed: boolean; hasNext: boolean }) {
  if (completed) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-50 px-4 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200 ring-inset">
          <Check className="size-4" aria-hidden /> Lesson completed
        </span>
        <form action={setLessonCompleteAction}>
          <input type="hidden" name="lessonId" value={lessonId} />
          <input type="hidden" name="complete" value="0" />
          <SubmitButton variant="ghost" size="sm" pendingText="Updating…">
            <RotateCcw aria-hidden /> Mark as not complete
          </SubmitButton>
        </form>
      </div>
    );
  }
  return (
    <form action={setLessonCompleteAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="lessonId" value={lessonId} />
      <input type="hidden" name="complete" value="1" />
      {hasNext ? (
        <>
          <SubmitButton name="advance" value="1" size="lg" pendingText="Saving…">
            Complete &amp; continue <ArrowRight aria-hidden />
          </SubmitButton>
          <SubmitButton name="advance" value="0" variant="outline" size="lg" pendingText="Saving…">
            <Check aria-hidden /> Mark complete
          </SubmitButton>
        </>
      ) : (
        <SubmitButton name="advance" value="0" size="lg" pendingText="Saving…">
          <Check aria-hidden /> Mark complete
        </SubmitButton>
      )}
    </form>
  );
}
