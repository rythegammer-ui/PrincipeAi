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
   *Without a database the site still deploys in **demo mode** (in-memory data that resets), which is handy for a first look.*
3. **Set environment variables** (Project → Settings → Environment Variables). See `.env.example`:

   | Variable | Required | Purpose |
   |---|---|---|
   | `DATABASE_URL` | yes | Postgres connection (added by the Neon/Supabase integration) |
   | `AUTH_SECRET` | yes | Signs login sessions: `openssl rand -base64 32` |
   | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | yes | Your admin dashboard login |
   | `NEXT_PUBLIC_SITE_URL` | yes | e.g. `https://principe.ai` (used in emails, Stripe redirects, invites) |
   | `ANTHROPIC_API_KEY` | for AI | From [console.anthropic.com](https://console.anthropic.com) |
   | `ANTHROPIC_MODEL` | optional | Defaults to `claude-opus-5-5`; set `claude-sonnet-5-5` or `claude-haiku-5-5` to lower cost |
   | `STRIPE_SECRET_KEY` | for payments | Stripe secret key |
   | `STRIPE_WEBHOOK_SECRET` | for payments | From the webhook endpoint below |
   | `RESEND_API_KEY`, `EMAIL_FROM` | for email | Resend key and a verified sender, e.g. `Principe AI <hello@yourdomain.com>` |
   | `CRON_SECRET` | recommended | Protects `/api/cron` (Vercel sends it automatically) |
   | `BUSINESS_TIMEZONE` | optional | Default `America/New_York` (also editable in Admin → Settings) |

4. **Stripe webhook**: in the Stripe dashboard, add an endpoint `https://YOUR-DOMAIN/api/stripe/webhook` with events
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`,
   `charge.refunded`. Copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
5. **Redeploy**, then sign in at `/admin` and visit **Settings**: it shows which integrations are connected and walks
   you through anything missing.

### Cron

`vercel.json` runs `/api/cron` once a day (the Hobby plan limit). It sends due automation emails, booking reminders,
and releases unpaid booking holds. On Vercel Pro you can change the schedule to hourly (`0 * * * *`) for faster
reminders. You can also trigger it manually from Admin → Settings → *Run automations now*.

## Customize

- **Brand, contact email, nav**: `src/config/site.ts`
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
