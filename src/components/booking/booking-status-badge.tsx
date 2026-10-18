import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { BookingStatus } from "@/db/schema";

const STATUS: Record<BookingStatus, { tone: BadgeTone; label: string }> = {
  confirmed: { tone: "green", label: "Confirmed" },
  pending_payment: { tone: "amber", label: "Awaiting payment" },
  cancelled: { tone: "red", label: "Cancelled" },
  completed: { tone: "blue", label: "Completed" },
  no_show: { tone: "neutral", label: "No-show" },
};

export function bookingStatusLabel(status: BookingStatus): string {
  return STATUS[status]?.label ?? status;
}

export function BookingStatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  const s = STATUS[status] ?? { tone: "neutral" as const, label: status };
  return (
    <Badge tone={s.tone} className={className}>
      {s.label}
    </Badge>
  );
}
