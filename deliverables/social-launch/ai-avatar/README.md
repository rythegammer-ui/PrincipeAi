# HeyGen avatar videos: the production guide

> **What this is:** everything you need to make the 30 short videos (LD-01 to LD-03, SV-01 to SV-27) with a HeyGen digital twin of you instead of filming. The scripts are word for word from the [short-video kit](../03-short-video-kit.md), cut into HeyGen scenes, with ready-made card images for every prompt and key line.
>
> **The one rule:** every avatar video is labeled as AI on every platform, every time. Section 4 says where the switch is.
>
> **Checked:** Oct 24, 2026. HeyGen's own pages couldn't be opened directly from here, so every plan, credit and menu fact below comes from search-engine extracts of them. **Check the numbers in the app** before you rely on them. Unconfirmed points are listed in section 6.

Back to the [social launch README](../README.md).

| File | What's in it |
|---|---|
| [scripts.md](scripts.md) | All 30 videos, scene by scene: what the avatar says (ready to paste), the layout, the on-screen text, the card file, and a **Needs you** list for each |
| [cards/](cards/) | 49 full-screen 1080×1920 card images (prompt cards and text cards). Preview all of them in [cards-overview.png](cards-overview.png) |
| [overlays/ai-avatar-label.png](overlays/ai-avatar-label.png) | The "AI avatar · AI voice" tag to put on screen (transparent background) |
| [CHANGELOG.md](CHANGELOG.md) | What was fixed in the converted scripts, and why |
| [source/](source/) | The data and the generator. To rebuild after editing `source/videos.json`, run `CHROMIUM_PATH=/opt/pw-browsers/chromium node deliverables/social-launch/ai-avatar/source/render-cards.mjs`, then `node deliverables/social-launch/ai-avatar/source/build-scripts.mjs` from the repo root |

---

## 1. What you need

- **A paid HeyGen plan, subscribed on the web** (not in the phone app: app credits expire after 30 days and are lost if you cancel). Free-plan videos are watermarked and, under HeyGen's Terms, for personal, non-commercial use only, so never post one.
- **Your phone, tripod, lav mic and light** from the kit (1.1) for one 2–3 minute recording of you, plus a 1–2 minute voice recording.
- **These files:** [scripts.md](scripts.md), the [cards/](cards/), and the [kit](../03-short-video-kit.md) for each video's captions, hashtags and links.

**The plans** (check yours, and the prices, in the app)

| Plan | Price | Credits a month | Worth knowing |
|---|---|---|---|
| Creator | $29/mo, or $24/mo billed yearly | 600 | 1080p, watermark removable, voice cloning, commercial use. **No credit top-ups on the web:** if you run out, you upgrade |
| Pro | From $49/mo | 1,000 (more on higher tiers) | 4K |
| Business | $149/mo for the first seat, +$20 a seat | 1,500, shared | Extra credits $0.05 each |

Unused web credits roll over for one extra month while you stay on a paid plan. Every re-render after you change a script, voice or avatar costs credits again, so **finish the Needs you list before you click Generate**.

**Avatar IV or Avatar V?** You pay only for the seconds the avatar is generated: about 31 credits a minute on Avatar IV and 48 on Avatar V (V is the newer, more lifelike model). The scripts average about 49 seconds, so 3 videos a week (about 13 a month, 10.6 minutes) costs:

| | One render of each video | Plus a separate TikTok cut of each | All 30 videos once |
|---|---|---|---|
| **Avatar IV** | about **330** credits a month | about 660 | about 760 |
| **Avatar V** | about **510** credits a month | about 1,010 | about 1,170 |

**Recommendation:** use **Avatar IV** on the Creator plan. It leaves room for re-renders. Try Avatar V on the three launch videos; keep it only if the difference is obvious, and then move to Pro, because V plus re-renders or TikTok cuts goes past 600. For the TikTok cut, the cheap way is to render only the last scene with the TikTok line (a few credits) and swap it onto the end in your free editor (kit 1.1).

---

## 2. Make your digital twin (once, about an hour)

**Record the training clip** (Avatars → Create Avatar, on the web; older guides call it "Clone a Real Person")

- **One continuous take of 2–3 minutes.** No cuts, your face visible the whole time. That's enough for both models (Avatar V needs at least 15 seconds, Avatar IV at least 2 minutes).
- **Vertical (9:16), 1080p at 30 fps or better,** phone on a tripod at eye level. Tap and hold on your face to lock focus and exposure.
- **Framing:** head and upper body, your face filling about half the frame, looking straight at the lens. Turn your head no more than about 30°.
- **Light and set:** soft, even light with no harsh shadows (not a window that changes with clouds), a plain background with nothing moving, solid clothes without logos or busy patterns.
- **Sound:** a quiet room, only your voice. The lip-sync is learned from it.
- **What to say:** anything; read 3 or 4 of the SV scripts in your normal teaching voice. Start with 2–3 seconds of silence, lips closed, and pause 1–2 seconds between longer sentences. For Avatar V, be a little more expressive than feels natural; keep your hands in frame and away from your face.
- HeyGen checks the upload and flags light, framing or noise problems. If it flags anything, re-shoot.

**Record the consent video, in the same session** (required: "no verification, no avatar")

- Under 30 seconds, same person, clear light and sound.
- Read the statement **shown in the app** word for word, then the 4-letter code, letter by letter.
- Rejected: a screen recording, anything AI-made, no sound, or a face that isn't clearly visible.

**Wait for processing:** about 10–20 minutes for non-4K footage per HeyGen's help center, but other HeyGen pages say hours. Allow a day before your first video.

**Make your voice clone** (HeyGen calls it optional but strongly recommended): record 1–2 minutes of clean speech separately in lossless audio (iPhone Voice Memos with Lossless on), mic 6–8 inches away. Then Voice → + New Voice → Instant Voice Cloning. If it doesn't sound like you, raise the Similarity slider a step at a time. Set it as your twin's default voice.

**Read first:** HeyGen's Terms give it a licence to what you upload, including to improve its AI models (Enterprise plans excepted), and a separate Biometric Privacy Notice covers your face and voice. Read both before you upload.

---

## 3. Make one video (about 20–30 minutes each)

### 3.1 Before your first real video: a 5-second test

Card scenes rely on a trick HeyGen doesn't document (3.5, option A). Test it once: make a 2-scene Portrait video (one avatar scene, one card scene with a short line), generate it, and check that the voice keeps going over the card and the avatar doesn't peek out. It costs a few credits. If it fails, use option B.

### 3.2 Set up the project

1. Open [scripts.md](scripts.md) at the video and **do its Needs you list first** (your true details in place of `[YOUR NAME]`-style placeholders, CONFIRM choices).
2. In HeyGen: **Create Video → Start from Scratch → Portrait (9:16).** Pick Portrait at the start.
3. Click the default avatar and swap in **your twin**; set the voice to **your clone**.

### 3.3 Add the scenes

4. Make **one HeyGen scene for each scene in scripts.md** (+ Scene → Blank). When a prompt runs over two cards, scripts.md splits that scene in two (3a, 3b): make two HeyGen scenes.
5. **Paste each grey box exactly** into its scene's script. Don't tidy the wording: it's the kit's, word for word. The avatar reads everything in the box aloud, brackets included.

### 3.4 Avatar and Avatar + text scenes

6. **Avatar:** the avatar full screen. Nothing else.
7. **Avatar + text:** add the on-screen text from scripts.md with the Text tool. Kit style (1.6): the first scene's hook text top-middle, white on a royal violet `#6938ef` box; the CTA text at the end. Use Geist if HeyGen lets you upload it, or the closest clean sans-serif.
8. **Keep all text clear of the app buttons:** nothing in the top 250 px, the bottom 420 px or the right 130 px of the 1080×1920 frame (about the top eighth, the bottom fifth and the right edge).

### 3.5 Card scenes (Prompt card and Text card)

9. Upload the video's cards: Media → Upload, the files named in scripts.md (`cards/SV-03-2.png` and so on). Any on-screen text for a card scene is already printed on the card.
10. Then, in each card scene, either:
    - **Option A (cleanest; test it first, 3.1):** keep the avatar in the scene so the script still plays. Add the card as an image, stretch it to fill the whole canvas, and in the Layers panel move it **above** the avatar. The covered avatar probably still uses credits.
    - **Option B (the layout HeyGen supports):** set the scene's Background to the uploaded card, switch the avatar layout to **Circle**, and drag it to the top-left corner, above the card's text (the cards keep the top 250 px free). Turn on the avatar's background removal if you use a cut-out instead of the circle.
    - **Don't delete the avatar** from a card scene: HeyGen warns the scene then has no avatar speaking the script.

### 3.6 Screen-recording scenes

11. A few scenes say **Screen recording (yours)**. These are the kit's real demos (the AI's actual answer), which no card can stand in for. Record them on your phone as the kit says (1.5: a clean account, made-up details, never type or fake the answer), upload the clip and use it like a card (3.5). No recording? Leave the avatar full screen for that scene.

### 3.7 Label, captions, check, generate

12. **AI tag on screen:** put [overlays/ai-avatar-label.png](overlays/ai-avatar-label.png) on scene 1, top-left under the hook text, for the whole scene. It travels with every download and repost.
13. **Captions on:** right-side menu → Captions. Style them like the kit (white on ink `#0c0a1d`, key word gold `#fec84b`) and place them in the lane **just above the bottom fifth**: about 70–78% of the way down the frame. The cards leave that strip empty for them. HeyGen burns these into the video (closed captions aren't available for avatar videos). **Proofread:** auto-captions often write "cloud" for Claude and garble "Gemini".
14. **Play it through once:** every card scene has the voice, nothing covers the text, names are spelled right.
15. **Generate:** in the Submit Video menu, switch the **watermark off** (bottom left; paid plans only) and pick **1080p**. A minute of video takes about 10 minutes to render; Monday mornings ET are the slowest.
16. **Download** the MP4 (open the video, download button top right). Name it like `SV-03_avatar_v1.mp4`. An SRT captions file is there too if you need it.
17. **TikTok cut** (only while your TikTok bio link isn't live, kit 1.7): scripts.md gives the changed last scene for each video. See the credit tip in section 1.
18. Post it with the labels in section 4.

---

## 4. Label every video

An avatar of you with an AI voice is realistic AI video of a real person, so it needs a label on TikTok, YouTube and Meta, and a disclosure everywhere else.

| Platform | Required? | Where the switch is | Can Postiz set it? |
|---|---|---|---|
| **TikTok** | **Yes** (realistic AI video and speech). Unlabeled videos can be removed or kept off For You. The label itself doesn't affect reach | App: + → upload → Next → More options → **AI-generated content** on. Desktop (TikTok Studio): Upload → Show more → **AI-generated content** on. It can't be added after posting: if you forget, delete and repost | **Yes:** `video_made_with_ai: true`. It only works with `content_posting_method: DIRECT_POST` and a single video; it's silently dropped on UPLOAD (inbox drafts) and photo posts |
| **YouTube Shorts** | **Yes** (makes a real person appear to say something they didn't). Repeatedly not disclosing risks removal or losing YouTube Partner Program status | YouTube Studio → upload → details → **"AI use"** (Attributes; older name "Altered or synthetic content") → **Yes**. You can change it later: Studio app → Content → the video → Edit | **No.** Upload and schedule in YouTube Studio itself |
| **Instagram Reels** | **Yes** (photorealistic video or realistic audio) | On the final share screen: **Add AI label** on, then Share. Label before sharing: adding it later isn't documented | **No.** Post in the Instagram app |
| **Facebook Reels** | **Yes** (same Meta rule) | Publishing screen: **Add AI label** on. Or share the labeled Instagram Reel to Facebook and check the Facebook copy shows "AI info" | **No.** Post in the Facebook app or Meta Business Suite |
| **Threads** | Yes, if you ever post a video there (the kit keeps Threads text-only) | Composer → **Add AI label** | No |
| **X** | Voluntary label (only if a video goes to X) | Composer → flag icon → Content disclosure → **Made with AI** | **Yes:** `made_with_ai: true` |
| **LinkedIn** | No switch exists | Put the disclosure line in the first two lines of the post, plus the on-screen tag | Only the caption text |
| **Pinterest** | Self-disclosure available (only if you make a video Pin) | Create Pin → **Mark as AI-modified** → turn on the AI-made and "AI-generated person" options | No |

**On every platform, also:**

- [ ] Add this line near the top of the caption, where it shows without "more": *Made with an AI avatar of me and my AI-cloned voice.*
- [ ] Keep the kit's other disclosures ("Your brand" on TikTok, promotion labels). The AI label adds to them.
- [ ] After it posts, open it and check the label shows.
- [ ] This overrides the kit for avatar videos: its section 2.6 and pre-post checklist say TikTok's AI toggle **off** and YouTube altered content **No**, which was written for real footage. The same goes for the content bank (07, section 1, "neither needs an AI label") and PROGRESS.md ("Decided: on camera, yes"). Those files haven't been changed; update them when you make the switch final.

### Already queued in Postiz (all LD-01, Tue Nov 10 at 9:00 ET)

Only these four short-video posts are scheduled so far. Fix them once the LD-01 avatar cut exists; apply the table above when you schedule the other 29.

- [ ] **TikTok** (`cmvibh78c0csjpg0yd3jn0pqj`): change `video_made_with_ai` from false to **true**, keep DIRECT_POST and "Your brand" on, swap the attachment for the avatar cut (one video, not a photo post), add the caption line. Check the label right after 9:00; if it's missing, delete and repost.
- [ ] **YouTube** (`cmvibh6vd0csipg0yf869zh5y`): Postiz can't set the label. Delete it in Postiz and upload the avatar cut in YouTube Studio, scheduled for Nov 10 at 9:00 ET with **AI use: Yes**. (Fallback: let Postiz post it and set Altered content to Yes the moment it's live; until then it's public and unlabeled, and YouTube may add its own label that you can't remove.)
- [ ] **Instagram** (`cmvibh5m50csepg0y9mwfvqgf`): delete it in Postiz and post the Reel in the Instagram app at 9:00 ET with **Add AI label** on, plus the caption line. It's a **PRICE** post: check Admin → Courses that morning.
- [ ] **Facebook** (`cmvibh5z40csgpg0yj84g1l69`): delete it in Postiz and post in the Facebook app or Business Suite with the AI label on (or share the labeled Instagram Reel and check "AI info" shows). Then post the 9:30 first comment as planned.

---

## 5. Rules

- **Never present the twin as filmed.** Don't call an avatar video "filmed", "live" or "on camera", don't remove the on-screen tag or the caption line, and never post an unlabeled cut.
- **Keep the AI labels on.** Never strip a file's metadata (such as Content Credentials) to avoid an automatic label.
- **Only your own likeness and voice.** No one else's face or voice, never anyone under 18, and the consent video is always you.
- **HeyGen's Terms** (updated Oct 15, 2026): on a paid plan you own the videos and can use them commercially. You must disclose AI use where the law requires it and must not present the output as entirely human-made.
- **The demos stay real.** Screen recordings show the AI's actual answer, never a typed or edited one (kit 1.5). The kit's "never say" list and true-details-only rule still apply (`[YOUR NAME]`, `[YOUR STORY]`: true or deleted, never invented).
- **Keep it original.** TikTok's Creator Rewards wants content made by you (whether avatar videos qualify is unconfirmed), and YouTube demonetizes mass-produced template videos. Original scripts with your avatar are fine; don't churn out near-copies. Keep your profiles clearly a real person (real photo and bio), so Instagram doesn't treat the account as an AI persona.

---

## 6. Not yet confirmed

- All HeyGen prices, credit rates and menu names (from search extracts, Oct 24, 2026). Avatar V's rate: the help center says 48 credits a minute, one HeyGen blog says 20.
- Whether option A works: a full-canvas image layered over the avatar keeps the voice playing and hides the avatar (3.1). Whether a scene without its avatar keeps the voice.
- How long twin processing takes (10–20 minutes, or hours), and whether a vertical training clip beats a horizontal one.
- How many twins and voice clones your plan allows, and whether Creator costs $24/mo billed yearly.
- Whether HeyGen exports carry Content Credentials or an invisible watermark that platforms read as AI automatically (HeyGen has committed to this by Dec 2, 2026). Check one export at contentcredentials.org/verify.
- Whether changing captions, images or layout re-renders (and re-charges) the whole video.
- Platform details: the exact names of the Instagram, Facebook and Threads label switches; whether a label can be added after posting on TikTok, Instagram or Facebook; whether Instagram's own scheduler offers the AI switch; whether an Instagram label carries over when shared to Facebook; the X and Pinterest switch steps.
- Whether the four queued LD-01 posts already hold a filmed cut or a placeholder (Postiz didn't show the media).
