import type { BadgeTone } from "@/components/ui/badge";
import type { AgentStatus } from "@/db/schema";

/** How each agent status reads in Admin → Sales Team. */
export const STATUS_META: Record<AgentStatus, { label: string; tone: BadgeTone }> = {
  applied: { label: "Applied", tone: "amber" },
  approved: { label: "Active", tone: "green" },
  paused: { label: "Paused", tone: "neutral" },
  rejected: { label: "Declined", tone: "red" },
  removed: { label: "Removed", tone: "red" },
};
