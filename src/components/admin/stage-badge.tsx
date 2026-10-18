import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STAGE_META, isStageValue } from "./crm-utils";

export function StageBadge({ stage, className }: { stage: string; className?: string }) {
  const meta = isStageValue(stage) ? STAGE_META[stage] : null;
  return (
    <Badge tone={meta?.tone ?? "neutral"} className={cn("whitespace-nowrap", className)}>
      {meta?.label ?? stage}
    </Badge>
  );
}
