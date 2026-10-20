# Principe AI

A complete website and business platform for selling AI courses, coaching and done-with-you AI implementation,
built with Next.js and designed to deploy on Vercel.

- **Marketing site and funnels**: home page, free *AI Starter Kit* opt-in funnel, *AI Readiness Assessment* quiz
  with a Claude-written personalized plan, consulting application, and course sales pages.
- **Scheduling**: booking pages for free strategy calls and paid coaching, with availability rules, timezone-aware
  slots, calendar invites (.ics), reminders, and self-serve cancel or reschedule.
- **Client tracking (CRM)**: every opt-in, quiz, chat, booking and purchase lands on a contact with full timeline,
  lead score, pipeline stage, tasks, attribution (UTM, referrer, landing page) and AI summaries or follow-up drafts.
- **Courses and payments**: Stripe Checkout, automatic enrollment, magic-link student login, lesson player with
  progress tracking and an AI tutor in every lesson.
- **AI everywhere**: site chat assistant that answers questions and books calls, course tutor, contact summaries,
  email drafting, and conversation insights, all powered by Claude.
- **Automations and analytics**: email sequences triggered by funnel events, funnel conversion analytics, an email log,
  and a daily cron job.

> Architecture, conventions and file map: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Quick start (local)

```bash
npm install
npm run dev
```

Open http://localhost:3000. No setup is needed: an embedded Postgres (PGlite) is created in `.data/pglite`,
migrated and seeded with the course catalog, booking types, email automations and **sample CRM data** (tagged `sample`).

- Admin dashboard: http://localhost:3000/admin with `admin@principe.ai` / `demo1234`
- Without a Resend key, emails are logged (Admin → Email Log) instead of sent, and the student login page shows the
  sign-in link directly.
- Without Stripe keys, purchases go through a built-in **test checkout** (no real payment).
- Without an Anthropic key, AI features use built-in fallback answers.

Reset the local database with `npm run db:reset-local`.

## Deploy to Vercel

1. **Import the repository** at [vercel.com/new](https://vercel.com/new) and choose this GitHub repo. The framework
   preset is detected automatically; `vercel.json` sets the build command (`npm run vercel-build`, which runs
   database migrations and then `next build`) and a daily cron job.
2. **Add a Postgres database**: in the project, open **Storage** (Marketplace), add **Neon** (or Supabase) and connect it
   to the project. It injects `DATABASE_URL` / `POSTGRES_URL` automatically.
   *Until a database is connected the deployed site refuses to start (every page that needs data shows an error), so
   it never runs as an open demo by accident. For a throwaway preview without a database, set `DEMO_MODE=1`: the site
   then runs in **demo mode** on in-memory data that resets, with the public demo login `admin@principe.ai` / `demo1234`
   (offered only while `ADMIN_PASSWORD` is unset and no Resend, Stripe or Anthropic key is set). Don't take real
   payments in demo mode: orders live in memory and are lost. Remove `DEMO_MODE` once the database is connected.*
3. **Set environment variables** (Project → Settings → Environment Variables). See `.env.example`:

   | Variable | Required | Purpose |
   |---|---|---|
   | `DATABASE_URL` | yes | Postgres connection (added by the Neon/Supabase integration) |
   | `AUTH_SECRET` | yes | Signs login sessions (at least 16 characters): `openssl rand -base64 32`. Changing it signs **everyone** out, admin and students |
   | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | yes | Your admin dashboard login. The password must be at least 12 characters (use a long, unique one); admin login stays disabled until it and `AUTH_SECRET` are set. Changing the password signs out every admin session |
   | `ADMIN_SESSION_VERSION` | optional | Change it to any new value (e.g. `2`) and redeploy to sign out every admin session without changing the password, e.g. after a lost laptop |
   | `NEXT_PUBLIC_SITE_URL` | yes | e.g. `https://principe.ai` (used in emails, Stripe redirects, invites) |
   | `CRON_SECRET` | yes (scheduled jobs) | Any random string (`openssl rand -base64 32`). Vercel Cron sends it to `/api/cron`; **without it every cron run is refused in production**, so follow-up automation emails, booking reminders and hold/checkout cleanup never run |
   | `ANTHROPIC_API_KEY` | for AI | From [console.anthropic.com](https://console.anthropic.com) |
   | `ANTHROPIC_MODEL` | optional | Defaults to `claude-opus-5-5`; set `claude-sonnet-5-5` or `claude-haiku-5-5` to lower cost |
   | `AI_DAILY_LIMIT` | optional | Site-wide ceiling on AI replies in the website chat per day, which also covers the course tutor for students of a free course (default `2000`, `0` = none). Past it the chat answers with the built-in fallback until the count resets at midnight UTC. Also set a monthly spend limit in the Anthropic console |
   | `AI_TUTOR_DAILY_LIMIT` | optional | The same ceiling for the course tutor of students who paid (or whom you gave access), counted separately so website chat traffic and free sign-ups can never switch off the tutor your students paid for (default `2000`, `0` = none; each student is also limited to 150 questions a day) |
   | `STRIPE_SECRET_KEY` | yes (to sell) | Stripe secret key. Without it checkout is turned off in production (the built-in test checkout only runs locally and in demo mode) |
   | `STRIPE_WEBHOOK_SECRET` | optional | Signing secret of a webhook endpoint you create yourself (step 4). Leave it unset and the site creates its own endpoint |
   | `RESEND_API_KEY`, `EMAIL_FROM` | yes (production) | Resend key and a verified sender, e.g. `Principe AI <hello@yourdomain.com>`. Without it no email is delivered in production: students (paying ones too) can't sign in, and receipts, booking confirmations and your notifications never arrive (locally and in demo mode the login page shows the sign-in link instead) |
   | `CONTACT_EMAIL` | optional | Public contact address (contact, booking, terms and privacy pages, footer, calendar invites) and the reply-to address of customer emails. Defaults to `principeconsults@gmail.com` |
   | `BUSINESS_TIMEZONE` | optional | Default `America/New_York` (also editable in Admin → Settings) |
   | `CRON_INTERVAL_HOURS` | optional | How often the cron runs, in hours (default `24`). Set `1` if you switch `vercel.json` to an hourly schedule |
   | `DEMO_MODE` | optional | `1` runs a deployment without a database as a throwaway demo (see step 2). Leave unset in production |

4. **Stripe payment links and webhook**: nothing to do by hand. On every production deploy with `STRIPE_SECRET_KEY`
   set, the build creates or updates a Stripe Product, Price and Payment Link for each paid, published course. It
   also creates the webhook endpoint `https://YOUR-DOMAIN/api/stripe/webhook` and keeps its signing secret in the
   database. **Admin → Courses → Payment links** lists the links and has a **Sync with Stripe** button that does the
   same at any time. In an email, write `{{buy_link:course-slug}}` (automations and contact emails): each reader gets
   `/buy/course-slug?email=…`, which opens that course's Stripe checkout with their email filled in. Buyers are
   enrolled and emailed their access automatically, as with the site's own checkout.
   To use a webhook endpoint of your own instead, add `https://YOUR-DOMAIN/api/stripe/webhook` in the Stripe dashboard
   with events `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`, `charge.dispute.created`,
   `charge.dispute.closed`, and copy its signing secret into `STRIPE_WEBHOOK_SECRET`. Once your endpoint receives every
   one of those events and has delivered one, the site removes its own; until then both deliver and each event is
   handled once.
   The daily scheduled job re-syncs the links (and retries a sync that failed), and the first run after this feature
   ships adds course buy links to the two default sales emails, unless you've edited them.
   **Rolling back** to a deployment from before payment links: switch the links off in Stripe (Payment links →
   deactivate) and delete the endpoint the site created (Developers → Webhooks, described as created automatically by
   the site), and remove `{{buy_link:…}}` from your automation emails, since older code can't fill it in.
5. **Redeploy**, then sign in at `/admin` and visit **Settings**: it shows which integrations are connected and walks
   you through anything missing.
6. **Speed Insights** (optional): in the Vercel project, open **Speed Insights** and enable it. The site already includes
   the `<SpeedInsights />` component, so real-visitor performance data starts appearing after the next deployment.
   Private links and query strings are removed from page URLs before they're sent.

### Upgrading an existing deployment

The catalog is seeded only into an empty database, so a database created before an update keeps its old course data.
After this update, open **Admin → Courses** and clear the **Compare-at price** of *AI Essentials*, *AI for Business*
and *AI Automation Accelerator* (the old seed set $97 / $497 / $797 “was” prices that were never charged). Only show a
compare-at price you have actually charged.

Also add the `checkout.session.async_payment_failed`, `charge.dispute.created` and `charge.dispute.closed` events to your
Stripe webhook endpoint (step 4), so failed delayed payments and chargebacks reach the app: a failed bank payment marks
its order failed and tells the buyer, a new dispute alerts you, and a lost one marks the order refunded and removes its
course access.

This update also tightens production security. Check these **before** you redeploy:

- **Admin password and `AUTH_SECRET` length.** Admin login is now disabled in production unless `ADMIN_PASSWORD` is at
  least 12 characters and `AUTH_SECRET` at least 16 (the login page says which one is missing). Lengthen them in Vercel
  first if needed.
- **You will be signed out once.** Admin sessions are now tied to the current admin login, so every admin session from
  before the update ends; sign in again. From now on changing `ADMIN_PASSWORD` or `ADMIN_SESSION_VERSION` signs every
  admin out.
- **A deployment without a database no longer runs as a demo.** Without `DATABASE_URL` (or `POSTGRES_URL`) a Vercel
  deployment now refuses to serve pages instead of silently running on in-memory data. Connect a database (step 2), or
  set `DEMO_MODE=1` if it really is a throwaway demo.
- **The demo login is withdrawn once a live key is set.** A demo deployment offers `admin@principe.ai` / `demo1234` only
  while no Resend, Stripe or Anthropic key is configured. If you set any of them, also set `ADMIN_EMAIL`,
  `ADMIN_PASSWORD` and `AUTH_SECRET`.
- **AI reply ceilings.** `AI_DAILY_LIMIT` now covers the website chat only and resets at midnight UTC; the course tutor
  has its own `AI_TUTOR_DAILY_LIMIT` (default `2000`). If you lowered `AI_DAILY_LIMIT` to cap spend, set both.

### Cron

`vercel.json` runs `/api/cron` once a day (the Hobby plan limit). It sends due automation emails, booking reminders,
and releases unpaid booking holds. **Set `CRON_SECRET`** in the project's environment variables: Vercel then sends it
with each cron call, and in production `/api/cron` rejects every call without it (the admin dashboard shows a
warning until it is set). On Vercel Pro you can change the schedule to hourly (`0 * * * *`) for faster
reminders; then also set the optional `CRON_INTERVAL_HOURS=1` (default `24`) so short booking-reminder windows are
honoured. Otherwise the reminder window is widened to the cron interval, so with the daily cron every reminder goes out
at the last run before the call (up to 24 hours ahead). You can also trigger it manually from Admin → Settings →
*Run automations now*.

## Customize

- **Brand, nav**: `src/config/site.ts` (the public contact email and the reply-to of customer emails: `CONTACT_EMAIL`)
- **Business name in emails and the AI assistant**: Admin → Settings → Business
- **Colors and fonts**: `src/app/globals.css`
- **Courses and lessons**: Admin → Courses (or edit the seed files in `src/db/seed-content/` before first deploy)
- **Booking types and availability**: Admin → Availability
- **Email automations**: Admin → Email Automations
- **AI assistant name, greeting and extra instructions**: Admin → Settings
- **Testimonials**: add real ones to `site.testimonials` in `src/config/site.ts` (sections stay hidden while empty)

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server with the embedded database |
| `npm run build` / `npm start` | Production build / server |
| `npm run typecheck` | Generate route types and run TypeScript |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) against a production build in demo mode |
| `npm run db:generate` | Generate a SQL migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` and seed the catalog if empty |

### End-to-end tests

The Playwright suite in `tests/e2e/` drives the real site in a browser: every public page, the free-guide funnel, the
assessment, booking (book, reschedule, cancel), a paid coaching session through the test checkout (including backing
out of checkout and paying later from the manage page), a course purchase and the student portal, the AI course tutor
(enrolled and not-enrolled students), the AI chat widget, the admin dashboard (contacts, notes, tasks, pipeline,
settings, automations, CSV export) and security checks (admin-only actions and exports, the cron secret, open
redirects). It needs no accounts or keys.

```bash
npx playwright install chromium   # once
npx next build                    # the suite runs against a production build
npm run test:e2e                  # starts the servers below and runs every test
```

- Playwright starts the app itself (`next start` on port 3400) with a throwaway in-memory database, the built-in test
  checkout, simulated email and the non-AI fallback answers, and switches off any `DATABASE_URL`, Resend, Stripe or
  Anthropic key set in your shell. It also sets its own admin login, `AUTH_SECRET` and `CRON_SECRET` (see `tests/e2e/env.ts`).
- Emails are read from **Admin → Email Log**. One-time sign-in links are stored redacted there, so student sign-in
  uses the link the login page shows when no email provider is configured.
- Three projects run:
  - `desktop`: every spec except the AI one, on the server without an AI key (so replies are the non-AI fallbacks).
  - `mobile` (390px wide): the tests tagged `@mobile`.
  - `ai`: `tests/e2e/ai-claude.spec.ts`, which runs the **real Claude code path** (`src/lib/ai.ts` and the Anthropic
    SDK) against a mock Anthropic API. Playwright also starts `tests/e2e/mock-anthropic.ts` (a small Node server for
    `POST /v1/messages` on port 3402, streaming and non-streaming, that records every request) and a second app server
    on port 3401 with `ANTHROPIC_API_KEY=test-key` and `ANTHROPIC_BASE_URL` pointing at the mock. The tests check the
    chat widget, the assessment plan (and that it's stored), Admin → contact **Summarize** and an automation's
    **Draft with AI**, plus what the app sent: the model (`claude-opus-5-5`, or your `ANTHROPIC_MODEL`), `effort`,
    no sampling parameters or thinking budget, the server-side fallback beta and the cached system prompt.
- Run one project with `npm run test:e2e -- --project=desktop` (only the servers that project needs are started), or
  one file with `npm run test:e2e -- tests/e2e/booking.spec.ts`. Ports: `E2E_PORT`, `E2E_AI_PORT`, `E2E_MOCK_ANTHROPIC_PORT`.
- To use a Chromium that's already installed, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/path/to/chrome`.
- To test a server that's already running, set `E2E_BASE_URL` (plus `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`,
  `E2E_CRON_SECRET` and `E2E_AUTH_SECRET` for that server; tests that need a secret you leave out are skipped). The `ai`
  project is then skipped unless you also set `E2E_AI_BASE_URL` (a server whose `ANTHROPIC_BASE_URL` is the mock) and
  `E2E_MOCK_ANTHROPIC_URL`. The suite creates contacts, bookings and orders, so never point it at production.
- On failure, traces and screenshots are saved in `test-results/` (`npx playwright show-trace <trace.zip>`).
