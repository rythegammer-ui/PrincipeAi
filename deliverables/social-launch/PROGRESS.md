# Launch progress tracker

> **What this file is:** where we are in the step-by-step launch, what's waiting on something, and notes to come back to. Updated as steps finish. The plan itself is in [README.md](README.md) and [02-launch-calendar.md](02-launch-calendar.md).

Last updated: Wed Oct 21, 2026 (L-20).

## Steps

| Step | Task | Status |
|---|---|---|
| 1 | Reserve handles on every platform, two-factor login on | Done |
| 2 | Connect every channel to Postiz; profile pictures and covers uploaded | Done, except the **LinkedIn Company Page** in Postiz (see below) |
| 3 | Website update live (`/links`, footer social links, preview share cards, mailing-address setting) | Done: [rythegammer-ui/PrincipeAi#4](https://github.com/rythegammer-ui/PrincipeAi/pull/4) merged, `/links` loads |
| 4 | Mailing address in marketing emails (CAN-SPAM) | Done (owner reported) |
| 5 | Instagram profile | Done |
| 6 | Facebook Page | Done |
| 7 | TikTok profile | Done; **business verification pending** |
| 8 | YouTube channel | Done; **ID/advanced-features verification pending** |
| 9 | LinkedIn personal profile | Done |
| 10 | LinkedIn Company Page | **Blocked:** see "LinkedIn Company Page" below |
| 11 | Threads, X, Bluesky, Pinterest website link | In progress (Bluesky and X via Claude in Chrome; Threads in the app) |
| 12 | Reddit (personal account About and link; brand account reserved only) | Not started |

## Waiting on something

### LinkedIn Company Page (Step 10)

Claude in Chrome couldn't create the Page on Oct 21. LinkedIn requires:

1. **At least 2 connections** on the personal profile. Send or accept invites from people you know.
2. **A personal account older than about 24 hours.** If it's newer, wait a day, then rerun the Step 10 Claude in Chrome prompt.
3. On the retry, have these ready:
   - **Company size and organization type.** Both are required. For a solo business: size "0–1 employees". Type "Self-employed" if Principe Consults is a sole proprietorship, "Privately held" if it's an LLC or corporation.
   - **Your OK** for the required box confirming you're an authorized representative and agree to LinkedIn's Pages terms.
   - **You upload** the logo (`images/profile-picture-1080.png`) and cover (`images/linkedin-page-cover-4200x700.png`).
4. **Experience:** the only role is "Owner" at "PrincipeAi", typed as text, not linked to a Page. After the Page exists, edit that role: title "Founder" (or keep "Owner"; both are true), company "Principe AI" picked from the dropdown so the logo shows. Keep "Share profile updates with your network" off until launch day.
5. Then add the Page to Postiz: **Add Channel → LinkedIn Page**.

The Page's first post (TP-02) is due **L+1, Wed Nov 11**, so this has about three weeks of slack.

### Verifications

- **TikTok business verification** (submitted, Step 7). When the Website field appears: add the `/links` link, switch the bio to version B, and set up the DM keyword replies ([01-profile-setup.md](01-profile-setup.md), 4.2).
- **YouTube advanced features** (requested, Step 8). Until approved, links in descriptions and pinned comments can't be clicked.

### Access Claude doesn't have yet

- **Vercel:** the connector can't reach the team `principeconsults-9234s-projects`, so Claude can't check environment variables, deployments or logs. To fix: claude.ai → Settings → Connectors → Vercel → reconnect, and pick that team on Vercel's approval screen.
- **AI key:** owner reported it's set. Check: the `/assessment` FAQ "How is my plan created?" should mention Claude. Admin → Settings should show AI as connected.

## Notes to remember

- **Handles as connected in Postiz:** Instagram and Threads `principe.ai`; YouTube, TikTok, X, Facebook and Reddit "PrincipeAi"; Pinterest `principeconsults`; Bluesky `principeai.bsky.social`; LinkedIn personal "Ryan Principe". Postiz also has a personal Instagram ("ryan principe"): never schedule to it.
- **Reddit in Postiz** is the brand account. The kit's rule is to comment from a personal account and never post from the brand account, so don't schedule Reddit posts there.
- **`src/config/site.ts` → `social`** still needs the full profile URLs, then a redeploy, so the footer and `/links` show them ([01-profile-setup.md](01-profile-setup.md), 7.2).
- **Bluesky domain handle:** switching to `@principeai.com` needs a DNS record (7.5). Reconnect Bluesky in Postiz after the switch.
- **Owner decisions still open:** face on camera or not, name/story/credential lines, Black Friday promo (decide by Fri Nov 20), Facebook Group (Mon Dec 14).
