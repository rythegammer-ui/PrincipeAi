# Lesson 10: Blueprint: The Weekly Reporting Digest

| | |
|---|---|
| **Course** | AI Automation Accelerator: Build Workflows & Agents |
| **Module** | 3 · Real Automations to Build |
| **Length** | 5–7 min (~860 spoken words) |
| **Format** | Talking head + screen recording |

**Goal of this video:** Build a weekly digest where formulas calculate every number, AI writes the story from a finished table and a check step catches any invented figure before it reaches your team.

## Before you record

- Your automation platform (Zapier, Make, n8n or similar) open on a test workflow with a schedule trigger
- A test spreadsheet holding the lesson's sample metrics table (made-up numbers), with formulas for change, four-week average and target
- An AI assistant in a new chat, for pasting the digest prompt
- The sample table, the digest prompt and the testing checklist from the written lesson, ready to copy

## Script

### 1. Hook · 0:00

**[ON CAMERA]**

Most businesses already have the numbers. What's missing is someone who pulls them together every Monday, notices what changed and says what deserves attention. In this lesson, you'll build an automation that does that job reliably, every week.

But hand an AI raw data and ask for a summary, and you might get a polished paragraph with a number that isn't in your data at all. One confident, wrong number is the fastest way to lose your team's trust.

### 2. Code counts, AI explains · 0:35

**[ON SCREEN TEXT: "Code counts, AI explains"]**

So this blueprint runs on one rule: code counts, AI explains. Language models are excellent at describing data and noticing what matters. They are not a reliable calculator, and they can produce numbers that look plausible but aren't in your data.

That means you split the work three ways. Formulas or a code step fetch the numbers and calculate every total, change and average. The AI step receives a finished table and writes the narrative, using only the numbers it was given.

Then a check step confirms that every number in the narrative actually appears in the table. Three jobs, three steps, and each one does what it's good at.

### 3. The seven-step flow · 1:20

**[ON SCREEN TEXT: "Trigger → Gather → Compute → Package → Write → Check → Deliver"]**

Here's the whole flow. The trigger is a schedule, such as Mondays at 7am in your business's time zone. Then you gather last week's and the previous week's figures from each source: your CRM, payments, website analytics and help desk.

Next, you compute. In a spreadsheet or code step, calculate week-over-week changes, a four-week average and the gap to target. Then you package it all into one compact table, plus a short notes field for context.

Then the AI writes the digest, the check compares its numbers against the table and the last step delivers it by email or chat and archives a copy. The AI appears in only one of seven steps.

### 4. Package the data · 2:10

**[SCREEN RECORDING]** Paste this template:

~~~
METRIC          THIS WEEK  LAST WEEK  CHANGE  4-WK AVG  TARGET
New leads              42         35    +20%        38      40
Calls booked            9         11    -18%        10      12
Deals won               3          2    +50%         2       3
Revenue ($)        12,400     10,900    +14%    11,300  12,000
Support tickets        57         49    +16%        51       -
Avg first reply (h)   3.2        2.1    +52%       2.4     2.0

NOTES: Webinar held Thursday. Website checkout was down for about
2 hours on Tuesday.
~~~

Here's an example table with made-up numbers. Every change, every average and every target is calculated before the AI ever sees it. Keep yours just like this: small and pre-calculated.

Now look at the notes at the bottom. That's where humans add context the numbers can't show. It's the difference between "leads rose 20%" and "leads rose 20%, the week of the webinar."

### 5. The digest prompt · 2:50

**[SCREEN RECORDING]** Paste this prompt:

~~~
You write a weekly business digest for {{owner_name}}.

Use only the numbers in <data>. Do not calculate new figures, estimate,
or round differently. If a metric is missing, say so.

<data>
{{metrics_table}}
</data>

Write:
1. Headline: one sentence summing up the week.
2. Wins: up to 3 bullets on metrics at or above target, or improving.
3. Watch: up to 3 bullets on metrics below target or getting worse.
4. Worth discussing: 2 questions for the team, based on the data and notes.

You may suggest possible causes only when the notes support them, and
label them as possibilities. Keep the whole digest under 200 words.
~~~

The key instruction sits right at the top: use only the numbers in the data. Don't calculate new figures, don't estimate and don't round differently. And if a metric is missing, say so.

Then it asks for a fixed structure: a one-sentence headline, up to three wins, up to three things to watch and two questions for the team.

Also notice the line about causes. The AI may suggest possible causes only when the notes support them, and it has to label them as possibilities. That keeps the digest honest about what's known and what's a guess.

### 6. Check for invented numbers · 3:50

**[ON CAMERA]**

Even with a careful prompt, you still check. A short code step can pull every number out of the digest and flag any that don't appear in the data table. Most automation platforms support a JavaScript code step, and the written lesson has the logic ready to copy.

If that list isn't empty, the digest goes to its owner for a quick look instead of to the whole team. Expect the occasional false alarm, such as a date in the headline, and tune the check over time.

It's a simple guard. But it catches the failure that would damage trust fastest: a confident, wrong number.

### 7. Deliver it well · 4:35

**[ON SCREEN TEXT: "Where people look · Same format · Link the source · Archive"]**

A few delivery habits make a real difference. Send the digest where people already look, such as the team chat or a Monday email. And keep the format identical every week, so readers know exactly where to look.

Link to the source dashboard for anyone who wants to dig deeper. Then archive each digest in a document or sheet. In three months, you'll have a searchable history of what happened and why.

The same pattern also works for a daily sales snapshot, agency client reports that the account manager reviews before sending or a project status digest.

### 8. Build it · 5:15

**[ON CAMERA]**

Now it's your turn, and the Build it section of the written lesson walks you through it. Choose five to eight metrics that genuinely drive your decisions. Build the data table in a spreadsheet, with formulas for change, average and target gap.

Add the AI step with the digest prompt, then the number check. Send the first three digests only to yourself, and refine them before you share anything with the team.

Then run the testing checklist. Remove one metric, and the digest should say it's missing. Plant a wrong number, and the check should flag it.

### 9. Recap and what's next · 5:55

**[ON CAMERA]**

Let's recap. Code counts, AI explains, so calculate every number before the AI sees it. Give the AI a compact, pre-calculated table plus human notes for context.

Tell it to use only the numbers provided, then check that it did. Keep the format consistent, deliver it where people already look and archive every issue.

**[ON SCREEN TEXT: "Next: What an AI Agent Really Is (and When Not to Use One)"]**

That completes the blueprints. In the next lesson, What an AI Agent Really Is (and When Not to Use One), we'll look at agents without the hype: what they are, how they differ from the workflows you've built and how to tell when you actually need one.

## On-screen text

- Code counts, AI explains
- Trigger → Gather → Compute → Package → Write → Check → Deliver
- Where people look · Same format · Link the source · Archive
- Next: What an AI Agent Really Is (and When Not to Use One)

## Lesson page description

Build a Monday digest that pulls your key numbers, calculates every change with formulas and lets AI explain what happened. You'll see the prompt that keeps the AI to the numbers it's given, plus a simple check that catches invented figures before your team reads them.
