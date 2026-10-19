import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { site } from "@/config/site";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/** Anything a greeting name may not contain (it keeps letters, combining marks, apostrophes and hyphens). */
const NOT_NAME_CHAR = /[^\p{L}\p{M}'’-]+/u;
const MAX_FIRST_NAME = 40;

/** First run of name characters that contains a letter, capped in length. */
function nameRun(text: string): string | undefined {
  const run = text.split(NOT_NAME_CHAR).find((part) => /\p{L}/u.test(part));
  return run ? Array.from(run).slice(0, MAX_FIRST_NAME).join("") : undefined;
}

/**
 * Display first name for greetings ("Hi Ada,"). Names are visitor-supplied, so only plain
 * name characters survive: no Markdown, URL or HTML can reach an email or page through it
 * ("[Reset](https://evil…)" → "Reset", "J.R." → "JR"). Falls back to the email's local
 * part ("sam.smith@…" → "sam"), then "there".
 */
export function firstName(name?: string | null, email?: string | null): string {
  const n = nameRun(name?.trim().split(/\s+/)[0]?.replace(/\./g, "") ?? "");
  if (n) return n.charAt(0).toUpperCase() + n.slice(1);
  return nameRun(email?.split("@")[0] ?? "") ?? "there";
}

export function initials(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.split("@")[0] || "?";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
}

export function formatMoney(cents: number, currency: string = site.currency): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function formatDate(date: Date | string, opts: Intl.DateTimeFormatOptions = {}, timeZone?: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone, ...opts }).format(d);
}

export function formatDateTime(date: Date | string, timeZone?: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(d);
}

export function timeAgo(date: Date | string, now: Date = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const sec = Math.round((now.getTime() - d.getTime()) / 1000);
  const abs = Math.abs(sec);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, s] of units) {
    if (abs >= s) return rtf.format(-Math.round(sec / s), unit);
  }
  return "just now";
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Absolute URL on this site (for emails, Stripe redirects, ICS files). */
export function absoluteUrl(path = "/"): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : site.url)).replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Only allow same-site relative redirects (prevents open redirects). */
export function safeRedirectPath(path: string | null | undefined, fallback = "/"): string {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return fallback;
  return path;
}

export function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function pluralize(n: number, singular: string, plural = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : plural}`;
}
