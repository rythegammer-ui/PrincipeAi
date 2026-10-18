# Principe AI — Architecture & Conventions

A complete AI-education business platform on **Next.js 16 (App Router) + Drizzle ORM + Postgres**, deployed on Vercel:
marketing funnels → lead capture → AI readiness assessment → booking → checkout → student portal, with a CRM,
funnel analytics, email automations and Claude-powered AI throughout.

> **Next.js 16 is NOT the version in your training data.** Before using a Next API you're unsure of, read the guide in
> `node_modules/next/dist/docs/` (e.g. `01-app/03-api-reference/03-file-conventions/proxy.md`). Key differences:
> `middleware.ts` is now **`src/proxy.ts`**; `params`/`searchParams`/`cookies()`/`headers()` are **async** (await them);
> `next lint` is gone (use `npx eslint <paths>`). We do **not** use Cache Components (`cacheComponents` is off), so the
> classic `export const dynamic = "force-dynamic"` segment config is used.

## Stack

| Concern | Choice | Where |
|---|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript strict | `src/app` |
| Styling | Tailwind CSS v4 (tokens in `src/app/globals.css`) + `@tailwindcss/typography` | |
| UI kit | In-house components (no shadcn/radix) | `src/components/ui/*` |
| Database | Postgres via Drizzle. **Local dev/demo uses embedded PGlite automatically** (no setup) | `src/db` |
| Auth | Admin: env credentials + signed JWT cookie. Students: passwordless magic link | `src/lib/auth.ts`, `src/proxy.ts` |
| AI | Anthropic Claude via `@anthropic-ai/sdk` (default model `claude-opus-5-5`) | `src/lib/ai.ts` |
| Payments | Stripe Checkout (inline `price_data`), test checkout fallback | `src/lib/payments.ts` |
| Email | Resend REST API, every email logged to `email_log` (simulated when no key) | `src/lib/email.ts` |
| Scheduling | Built-in availability + slots (Luxon), ICS invites | `src/lib/scheduling.ts` |
| Cron | Vercel Cron → `/api/cron` (daily on Hobby) | `vercel.json` |

## Directory map (who owns what)

```
src/
  app/
    layout.tsx                 root (fonts, metadata)            [foundation]
    globals.css                design tokens                     [foundation]
    (marketing)/layout.tsx     header/footer/announcement/chat    [foundation]
    (marketing)/page.tsx       home                               [marketing]
    (marketing)/about|contact|privacy|terms|free-guide|guide|consulting  [marketing]
    (marketing)/assessment/**  AI readiness quiz + results        [assessment]
    (marketing)/book/**        public booking pages               [scheduling]
    (marketing)/booking/**     manage booking (cancel/reschedule) [scheduling]
    (marketing)/courses/**     catalog + sales pages              [courses]
    (marketing)/checkout/**    checkout success/test/cancel       [courses]
    (marketing)/unsubscribe/** one-click unsubscribe              [automations]
    learn/**                   student portal                     [courses]
    login, auth/verify         magic-link login                   [foundation]
    admin/login                admin login                        [foundation]
    admin/(panel)/layout.tsx   admin shell + auth                 [foundation]
    admin/(panel)/page.tsx     dashboard                          [crm]
    admin/(panel)/contacts|pipeline|tasks/**                      [crm]
    admin/(panel)/bookings|scheduling/**                          [scheduling]
    admin/(panel)/courses|orders/**                               [courses]
    admin/(panel)/funnels|sequences|emails|settings/**            [automations]
    admin/(panel)/conversations/**                                [ai]
    api/track                  analytics beacon                   [foundation]
    api/chat, api/tutor        AI assistant + course tutor        [ai]
    api/assessment/**          AI plan streaming                  [assessment]
    api/bookings/**, api/slots                                    [scheduling]
    api/checkout, api/stripe/webhook                              [courses]
    api/cron                                                       [automations]
    api/admin/**               admin-only APIs (CSV export, AI)   [crm / ai]
  components/ui/*              UI kit                             [foundation]
  components/marketing/*       header/footer + marketing sections [foundation + marketing]
  components/admin/*           admin widgets                      [crm (admin-nav.tsx = foundation)]
  components/booking/*                                            [scheduling]
  components/learn/*           (ai-tutor.tsx = ai)                [courses]
  components/chat/*            chat widget                        [ai]
  components/analytics/*       page-view tracker + charts         [foundation; charts = crm]
  config/site.ts               brand, nav                          [foundation — read-only]
  content/starter-kit.ts       lead-magnet content                [content]
  db/schema.ts                 ALL tables                          [foundation — read-only]
  db/seed*.ts, db/seed-content/*                                   [seed.ts foundation; seed-demo.ts crm; seed-content/* content]
  lib/*                        see "Core libraries"
drizzle/                       generated SQL migrations           [foundation — read-only]
tests/unit/*.test.ts           vitest                             [each feature adds its own]
tests/e2e/*.spec.ts            playwright                         [integration]
```

## Ground rules for feature work

1. **Never edit** `src/db/schema.ts`, `drizzle/**`, `package.json`, `package-lock.json`, `next.config.ts`,
   `src/config/site.ts`, `src/app/layout.tsx`, `src/app/globals.css`, or another feature's files. Use the jsonb
   `meta`/`props`/`answers` columns for extra data. If you truly need a schema/package change, explain it in your final report.
2. You may make a **minimal bug fix** in a foundation lib (`src/lib/*.ts` that you don't own) only if it blocks you;
   describe it in your final report.
3. Any page/layout/route that reads the database must be dynamic: the marketing, admin and learn layouts already set
   `export const dynamic = "force-dynamic"`; for pages outside those groups (and for route handlers that read the DB on GET)
   add it yourself. Never query the DB at module top level.
4. Every **admin server action / admin API route** must call `await assertAdmin()` first (pages/layouts use
   `requireAdmin()` — the panel layout already does). Every public mutation must validate input with **zod** and be
   **rate limited** (`rateLimitByIp(bucket, limit, windowSec)` from `src/lib/rate-limit.ts`).
5. Server Actions are the default for forms (`"use server"` files named `actions.ts` next to the page). Use
   `useActionState` + `<SubmitButton>` for pending/error UI. Revalidate with `revalidatePath` after admin mutations.
6. Never render untrusted HTML. Use `<Markdown>` (`src/components/ui/markdown.tsx`) for lesson content and any AI output.
7. Money is integer **cents**; format with `formatMoney()`. Times are stored as `timestamptz` (UTC `Date`); display with
   `formatDateTime(date, tz)` or Luxon.
8. Keep pages accessible: labels on inputs, `aria-*` on custom widgets, focus states, semantic headings, 44px touch targets
   on mobile, responsive down to 360px wide.
9. Graceful degradation: every feature must work with **no** `ANTHROPIC_API_KEY`, **no** Stripe keys and **no**
   `RESEND_API_KEY` (AI → sensible non-AI fallback text; Stripe → built-in test checkout when `testCheckoutAllowed()`;
   email → logged as "simulated").

## Core libraries (`src/lib`)

| File | Exports | Notes |
|---|---|---|
| `db/index.ts` | `getDb()`, `schema`, `dbMode()`, `isDemoMode()` | `const db = await getDb()` inside handlers. Drizzle query builder (`db.select().from(schema.x)…`, `db.insert`, `db.update`, `db.transaction`, `db.execute(sql\`…\`)`) |
| `auth.ts` | `requireAdmin()`, `assertAdmin()`, `getAdminSession()`, `getStudent()`, `requireStudent(next)`, `upsertStudent(email,name)`, `createLoginToken(email, redirectTo)`, `startStudentSession(user)` | Magic link URL: `absoluteUrl("/auth/verify?token=" + token)` |
| `crm.ts` | **`captureLead(input)`** (the one entry point for every conversion), `upsertContact`, `logActivity`, `advanceStage`, `setStage`, `addTags`, `recomputeScore`, `createTask`, `addLifetimeValue`, `contactForVisitor` | `captureLead` = upsert contact + activity + funnel event + stage + score + automations + owner notification |
| `tracking.ts` | `trackEvent({name,…})`, `getVisitorContext()`, `FUNNEL_EVENTS`, `CLIENT_EVENTS` | Server-side funnel events. Client: `track(name, props)` from `components/analytics/page-view-tracker.tsx` (only `CLIENT_EVENTS`) |
| `email.ts` | `sendEmail({to, subject, markdown, kind, contactId, attachments…})`, `notifyOwner`, `fillTemplate`, `defaultTemplateVars`, `markdownToEmailHtml` | Always send Markdown; layout + logging handled for you |
| `automations.ts` | `triggerAutomations(trigger, contactId)`, `stopAutomations`, `processDueEnrollments()` | Triggers: `lead_magnet`, `quiz_completed`, `call_booked`, `purchase`, `contact_form`, `manual` |
| `ai.ts` | `aiEnabled()`, `aiText({system, messages, effort, maxTokens})`, `aiStream({…, fallbackText, onComplete})`, `textStreamResponse(stream)`, `AI_MODEL` | Opus 5.5 with server-side refusal fallback. `aiText` returns `null` when AI is unavailable → use your fallback. Effort: `"low"` for chat, `"medium"` for analysis/plans |
| `settings.ts` | `getSettings()`, `updateSettings(patch)`, `DEFAULT_SETTINGS` | Business tz, notification toggles, assistant name/greeting/instructions, announcement bar |
| `rate-limit.ts` | `rateLimit(key, limit, windowSec)`, `rateLimitByIp(bucket, limit, windowSec)`, `clientIp()` | |
| `integrations.ts` | `integrations()`, `testCheckoutAllowed()` | Which services are configured |
| `utils.ts` | `cn`, `formatMoney`, `formatDate`, `formatDateTime`, `timeAgo`, `absoluteUrl`, `safeRedirectPath`, `normalizeEmail`, `isValidEmail`, `firstName`, `slugify`, `truncate`, `pluralize` | |
| `payments.ts` | `createCheckout(input)`, `fulfillOrder(orderId, payment)` | owned by **courses**; stubs until implemented |
| `courses.ts` | `enrollInCourse({email,name,courseId,source,orderId})` | owned by **courses** |
| `booking-service.ts` | `confirmPaidBooking(bookingId)`, `sendDueBookingReminders()`, `releaseExpiredHolds()` | owned by **scheduling**; cron calls the latter two |

### Pipeline stages
`new → engaged → qualified → call_booked → proposal → customer` (+ `lost`). `advanceStage` only moves forward.
Typical automatic moves: opt-in → `new`; assessment / chat lead / checkout started → `engaged`; high-intent assessment or
consulting application → `qualified`; booking → `call_booked`; purchase → `customer`.

### Funnel events (`events.name`)
`page_view, cta_click, quiz_started, booking_viewed, guide_viewed, chat_opened` (client) and
`optin, quiz_completed, booking_created, checkout_started, purchase, chat_started, chat_lead, contact_form, application` (server).

### Lead score
`recomputeScore` (0–100) — profile completeness + engagement (opt-in 10, quiz 15 + `meta.scoreBoost` ≤ 20, form 10,
chat 5, booking 25, purchase 30, logins, lessons). Pass `meta: { scoreBoost }` on the `quiz_completed` activity for buying intent.

## Design system

- Brand: royal violet `brand-50…950` (primary `brand-600`), accent gold `gold-50…700`, dark bands `bg-ink` / `bg-ink-2`,
  neutrals `zinc`. Fonts: `font-sans` (Geist), `font-display` (Instrument Serif — use for large headline accents,
  often italic), `font-mono`.
- Helpers: `.container-page`, `.container-narrow`, `.eyebrow`, `.text-gradient`, `.text-gradient-light`, `.bg-grid`,
  `.bg-grid-dark`, `.glow-brand`, `.prose-content`, `shadow-soft`, `shadow-lift`, `animate-fade-up`.
- Components: `Button`/`ButtonLink`/`buttonVariants` (variants primary, secondary, outline, ghost, danger, gold, white),
  `SubmitButton`, `Card*`, `Input`, `Textarea`, `Select`, `Label`, `Field`, `Checkbox`, `Badge` (tones), `Alert`,
  `Table/THead/TBody/TR/TH/TD`, `EmptyState`, `PageHeader`, `StatCard`, `Avatar`, `Progress`, `Logo`, `Markdown`.
- Icons: `lucide-react`. Marketing sections alternate white / `zinc-50` / `ink` backgrounds; generous spacing
  (`py-20 sm:py-28`); rounded-2xl cards with `shadow-soft`. Admin is dense, calm, zinc-on-white.
- Copy voice: confident, warm, plain-English, outcome-focused, no hype or fabricated stats/testimonials
  (`site.testimonials` is empty until the owner adds real ones — hide such sections when empty).

## Running locally

```bash
npm install
npm run dev                       # http://localhost:3000 — embedded Postgres in .data/pglite, auto-migrated + seeded
# isolated extra dev server (doesn't clash with another one):
NEXT_DIST_DIR=.next-x PGLITE_DIR=memory:// npx next dev -p 3111
npx tsc --noEmit                  # typecheck
npx eslint src/app/... src/lib/...# lint specific paths
npx vitest run tests/unit/x.test.ts
```
Admin login in dev: `admin@principe.ai` / `demo1234`. Without Resend, the magic-link page shows the link directly.
