/**
 * Central brand + business configuration. Edit this file to rebrand the site.
 * Everything user-facing (header, footer, emails, AI system prompts, SEO) reads from here.
 */
export const site = {
  name: "Principe AI",
  company: "Principe Consults",
  tagline: "Learn AI. Implement AI. Grow with AI.",
  description:
    "Practical AI education and implementation for business owners, professionals, and everyday people. Courses, coaching, and done-with-you AI systems.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  contactEmail: process.env.CONTACT_EMAIL ?? "principeconsults@gmail.com",
  /**
   * The business's postal address (a P.O. box works). CAN-SPAM requires it in promotional email, including the emails
   * sales agents send for us (their toolkit's email script shows it). Empty until BUSINESS_POSTAL_ADDRESS is set.
   */
  postalAddress: process.env.BUSINESS_POSTAL_ADDRESS ?? "",
  /** Default "from" address for outgoing email (must be a verified Resend domain in production). */
  emailFrom: process.env.EMAIL_FROM ?? "Principe AI <onboarding@resend.dev>",
  /** Owner's timezone — availability rules for scheduling are interpreted in this zone. */
  timezone: process.env.BUSINESS_TIMEZONE ?? "America/New_York",
  currency: "usd",
  /** Full profile URLs (https://…). Filled ones are linked in the footer and in search-engine structured data. */
  social: {
    youtube: "https://www.youtube.com/@PrincipeAi",
    instagram: "https://www.instagram.com/principe.ai/",
    linkedin: "",
    x: "https://x.com/PrincipeAi",
    tiktok: "https://www.tiktok.com/@principeai",
    threads: "https://www.threads.com/@principe.ai",
    facebook: "https://www.facebook.com/profile.php?id=61595512175708",
    pinterest: "https://www.pinterest.com/principeconsults/",
    bluesky: "https://bsky.app/profile/principeai.bsky.social",
  },
  /** Add real client testimonials here. Sections that use them are hidden while this is empty. */
  testimonials: [] as { quote: string; name: string; role: string }[],
} as const;

export const marketingNav = [
  { href: "/courses", label: "Courses" },
  { href: "/consulting", label: "AI Implementation" },
  { href: "/assessment", label: "Free AI Assessment" },
  { href: "/free-guide", label: "Free Guide" },
  { href: "/about", label: "About" },
] as const;

export const adminNav = [
  { href: "/admin", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/admin/contacts", label: "Contacts", icon: "Users" },
  { href: "/admin/pipeline", label: "Pipeline", icon: "KanbanSquare" },
  { href: "/admin/tasks", label: "Tasks", icon: "CheckSquare" },
  { href: "/admin/bookings", label: "Bookings", icon: "CalendarDays" },
  { href: "/admin/scheduling", label: "Availability", icon: "Clock" },
  { href: "/admin/funnels", label: "Funnels", icon: "Filter" },
  { href: "/admin/sequences", label: "Email Automations", icon: "Mail" },
  { href: "/admin/conversations", label: "AI Conversations", icon: "MessageSquare" },
  { href: "/admin/courses", label: "Courses", icon: "GraduationCap" },
  { href: "/admin/orders", label: "Orders", icon: "Receipt" },
  { href: "/admin/sales", label: "Sales Team", icon: "Trophy" },
  { href: "/admin/emails", label: "Email Log", icon: "Inbox" },
  { href: "/admin/team", label: "Admin Team", icon: "ShieldCheck" },
  { href: "/admin/settings", label: "Settings", icon: "Settings" },
] as const;

export type AdminIconName = (typeof adminNav)[number]["icon"];
