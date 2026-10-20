# Course kits: what to send customers

Everything you need to deliver the three courses outside the website, plus scripts for recording the lesson videos.

| What | Where | Who it's for |
|---|---|---|
| **Customer download** (app + course book + "Start here" note) | `dist/AI-Essentials.zip`, `dist/AI-for-Business-Owners.zip`, `dist/AI-Automation-Accelerator.zip` | Customers |
| Offline course app | `dist/<course>/<Course>-Course-App.html` | Customers (inside the zip) |
| PDF course book | `dist/<course>/<Course>-Course-Book.pdf` | Customers (inside the zip) |
| Video scripts, as one PDF per course | `dist/<course>/<Course>-Video-Scripts.pdf` | You |
| Video scripts, editable | `video-scripts/<course>/NN-<lesson>.md` ([how to record](video-scripts/README.md)) | You |
| Lesson quizzes | `quizzes/<course>/NN-<lesson>.json` | Source for the app and book |
| Video links | `videos.json` | Source for the app |

## What the customer gets

**The course app** is a single file. The customer unzips the folder, double-clicks the app and it opens in their web
browser, working fully offline with no account or login:

- every lesson, with its prompts one click away from the clipboard
- a tick-box checklist on each lesson's exercise
- a three-question knowledge check at the end of every lesson, with explanations
- a private notes box per lesson, collected on a "My notes" page they can download
- a searchable prompt library (62, 45 and 33 prompts and templates in the three courses) and search across all lessons
- progress tracking with "continue where you left off"
- a certificate of completion, unlocked when every lesson is complete, that they can print or save as a PDF
- light and dark mode, phone and tablet layouts, and printing of any lesson
- a "Watch the lesson video" button on each lesson once you add video links

Progress is saved in the browser on that computer, so customers should keep the file somewhere permanent and always open
the same copy.

**The course book** is the same course as a designed PDF: cover, contents with page numbers, every lesson, prompt and
exercise, the knowledge checks with an answer key at the back, and a "What's next" page. It's the best option on an
iPhone or iPad, where opening a downloaded app file is awkward, and for anyone who wants to print.

## Sending a course

1. **Send the zip.** Attach it to your delivery email, or upload it to Google Drive or Dropbox and send the link (some
   email providers block attachments over 10–25 MB; these zips are about 1.5 MB).
2. **Personalised copy (recommended for paid customers).** Stamp the buyer's name on the cover, every page footer, the
   app and the "Start here" note. Their name also pre-fills the certificate:

   ```bash
   npx tsx scripts/course-kit/build.ts --course ai-essentials --licensee "Jane Doe"
   # → deliverables/dist/licensed/AI-Essentials-jane-doe.zip
   ```

   Personalised copies contain customer names, so `deliverables/dist/licensed/` is ignored by git. Keep them out of the
   repository.

The licence stamp discourages sharing but can't prevent it. Anyone who has the file can open it.

## Adding your videos

1. Record each lesson from its script (see [video-scripts/README.md](video-scripts/README.md)).
2. Upload it to YouTube (Unlisted), Vimeo or Loom.
3. **Website:** paste the link into **Admin → Courses → (course) → lesson → Video URL**.
4. **Downloadable app:** paste the same link into `videos.json` next to the lesson's slug (`_welcome` is the course
   welcome video), then rebuild. The app shows a "Watch the lesson video" button that opens the video in the browser.
   Videos stream from the host, so customers need internet for those, but everything else stays offline.

## Rebuilding

Rebuild after changing lessons, quizzes, scripts, video links or the site address:

```bash
npm install
npx tsx scripts/course-kit/build.ts                          # all three courses
npx tsx scripts/course-kit/build.ts --course ai-for-business  # just one
npx tsx scripts/course-kit/build.ts --site-url https://example.com  # if the site moves to another domain
```

The build needs Playwright's Chromium (`npx playwright install chromium`, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to a
Chrome/Chromium binary) and, for page numbers on the contents pages, `pdftotext` from poppler (`brew install poppler` or
`apt install poppler-utils`). Without `pdftotext` the books still build, just without page numbers in the contents. Links
in the app and books point to `https://principeai.com` unless you pass `--site-url` (or set `NEXT_PUBLIC_SITE_URL`).

**Where the content comes from:** lessons are read from the course files in `src/db/seed-content/`, the same text the
website was seeded with. If you edit a lesson in **Admin → Courses** on the live site, make the same edit in the seed
file before rebuilding, or the downloadable kit won't include it.

**Quiz format** (`quizzes/<course>/NN-<lesson-slug>.json`): `{"lesson": "<slug>", "questions": [{"q": "…", "options":
["…", "…", "…", "…"], "answer": 0, "explain": "…"}]}`, where `answer` is the index (0–3) of the correct option.
