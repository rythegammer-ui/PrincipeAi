# Changelog: fixes to the converted scripts

The 30 scene lists were converted from the [short-video kit](../03-short-video-kit.md), then checked by a verifier that raised 22 issues. Each one was checked against the kit. **All 22 were real and are applied; none rejected.** Every spoken line in [scripts.md](scripts.md) was then compared word for word with the kit's scripts: all 30 videos match.

Back to the [production guide](README.md).

## Verifier issues

| # | Video · scene | Problem | Fix | Kit check |
|---|---|---|---|---|
| 1 | LD-03 · 2 | Card showed a description of the shot ("The first questions of…") | Now a **screen recording** scene (tap through `/assessment`, private window, test address); no card | Kit: `[SCREEN RECORDING]`, no on-screen text. Applied |
| 2 | LD-03 · 5 | Card "The assessment results page" | Screen recording or screenshot of your own results page, address bar hidden | Kit: `[B-ROLL]`, no on-screen text. Applied |
| 3 | SV-02 · 5 | Card "The assistant asks its first question" | Screen recording of the real first question | Kit: `[SCREEN RECORDING]`. Applied |
| 4 | SV-03 · 4 | Card "The finished text message" | Screen recording of the real "after" answer | Kit: zoom on the finished message. Applied |
| 5 | SV-06 · 4 | Card describing a quiz question and hint | Screen recording of a real quiz question, wrong answer and hint | Kit: `[SCREEN RECORDING]`. Applied |
| 6 | SV-09 · 3 | Card describing the five questions | Screen recording of the questions arriving | Kit: `[SCREEN RECORDING]`. Applied |
| 7 | SV-10 · 3 | Card "The finished email", marked optional | Screen recording of the real email, now **required** in Needs you | Kit: zoom on the finished email. Applied |
| 8–12 | SV-04 to SV-08 | No AI-label item; no New Year re-cut note | Both added (re-cuts L+57 to L+61) | Kit Posts rows confirm the re-cuts. Applied |
| 13–16 | SV-09 to SV-12 | No AI-label item | Added | Applied |
| 17 | SV-13 · 6 | The CTA beat was missing | Scene 6 added: "My free AI Starter Kit has eight safety and quality tips like this one. Link's in my profile." with "Free AI Starter Kit → link in profile"; length 58 → 64 s | Kit 0:45 CTA. Applied |
| 18 | SV-20 · 4 | Card described the shot | Card quotes the kit's prompt line: If no owner or date was agreed, write "UNASSIGNED" or "NO DATE"; don't guess. | Applied |
| 19 | SV-19 · 5 | Card "A [CHECK] marker in the draft" | Card shows the marker itself: **[CHECK]** | Applied |
| 20 | SV-22 · 4 | Spec template cut from 11 lines to 2 with no "…" | Full template, over two cards (-a, -b), with FALLBACK and OWNER highlighted where the kit holds | Applied |
| 21 | SV-16 · 3 | "Made-up sample message" label over a card that shows no sample message | Label dropped; Needs you explains how to bring it back with a real screenshot | Applied |
| 22 | SV-27 · 3 | Card paraphrased the shot | Card quotes the kit's prompt line: "Then give me one grocery list grouped by store section." | Applied |

## Other changes

- **New layout, Screen recording (yours),** for the scenes in issues 1–7. Fallback if you don't record one: leave the avatar full screen. Never a label card.
- **AI-label item extended** to SV-13 to SV-27, which had the same gap the verifier found in SV-04 to SV-12. All 30 videos now carry it.
- **LD-01 scene 5:** the `[CONFIRM: AI key live in production]` tag was moved out of the spoken text (the avatar would have read it aloud) into a decision. Version B is the kit's alternative line.
- **Optional screenshot swaps** added to Needs you for SV-19 scene 5, SV-20 scene 4 and SV-27 scene 3.
- **Cards:** prompts the kit hard-wraps at about 70 characters (SV-03, SV-09, SV-13, SV-14, SV-16, SV-23 to SV-25) are re-flowed to the card's width; no words changed. Two prompts too long for one card at 28 px (SV-19 scene 3, SV-22 scene 4) are split over two cards, and scripts.md splits those scenes in two.
- **TikTok cut** for each video: the last sentence that sends people to your profile is swapped for the kit's TikTok ending (kit 1.7).
