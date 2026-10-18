import {
  ArrowRightLeft,
  CalendarClock,
  CalendarPlus,
  CalendarX,
  CheckSquare,
  ClipboardCheck,
  CreditCard,
  Download,
  FileText,
  GraduationCap,
  LogIn,
  Mail,
  MessageSquare,
  Phone,
  Sparkles,
  StickyNote,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Icon + colour per timeline activity type (literal classes so Tailwind picks them up). */
export const ACTIVITY_STYLES: Record<string, { Icon: LucideIcon; className: string; label: string }> = {
  created: { Icon: UserPlus, className: "bg-zinc-100 text-zinc-600 ring-zinc-200", label: "Contact created" },
  optin: { Icon: Download, className: "bg-brand-50 text-brand-700 ring-brand-200", label: "Opt-in" },
  quiz_completed: { Icon: ClipboardCheck, className: "bg-gold-50 text-gold-700 ring-gold-200", label: "Assessment" },
  booking_created: { Icon: CalendarPlus, className: "bg-emerald-50 text-emerald-700 ring-emerald-200", label: "Booking" },
  booking_cancelled: { Icon: CalendarX, className: "bg-red-50 text-red-700 ring-red-200", label: "Booking cancelled" },
  booking_rescheduled: { Icon: CalendarClock, className: "bg-sky-50 text-sky-700 ring-sky-200", label: "Booking rescheduled" },
  purchase: { Icon: CreditCard, className: "bg-emerald-50 text-emerald-700 ring-emerald-200", label: "Purchase" },
  email_sent: { Icon: Mail, className: "bg-sky-50 text-sky-700 ring-sky-200", label: "Email" },
  chat: { Icon: MessageSquare, className: "bg-brand-50 text-brand-700 ring-brand-200", label: "AI chat" },
  note: { Icon: StickyNote, className: "bg-amber-50 text-amber-800 ring-amber-200", label: "Note" },
  call: { Icon: Phone, className: "bg-emerald-50 text-emerald-700 ring-emerald-200", label: "Call" },
  stage_changed: { Icon: ArrowRightLeft, className: "bg-brand-50 text-brand-700 ring-brand-200", label: "Stage change" },
  task: { Icon: CheckSquare, className: "bg-zinc-100 text-zinc-700 ring-zinc-200", label: "Task" },
  form: { Icon: FileText, className: "bg-sky-50 text-sky-700 ring-sky-200", label: "Form" },
  login: { Icon: LogIn, className: "bg-zinc-100 text-zinc-600 ring-zinc-200", label: "Login" },
  lesson_completed: { Icon: GraduationCap, className: "bg-brand-50 text-brand-700 ring-brand-200", label: "Lesson" },
  ai: { Icon: Sparkles, className: "bg-gold-50 text-gold-700 ring-gold-200", label: "AI" },
};

export function activityStyle(type: string) {
  return ACTIVITY_STYLES[type] ?? ACTIVITY_STYLES.created;
}

export function ActivityIcon({ type, className }: { type: string; className?: string }) {
  const { Icon, className: tone } = activityStyle(type);
  return (
    <span aria-hidden className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-full ring-1 ring-inset", tone, className)}>
      <Icon className="size-4" />
    </span>
  );
}
