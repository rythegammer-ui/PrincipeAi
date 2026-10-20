# Lesson 15: Testing and Evaluation with Golden Test Sets

| | |
|---|---|
| **Course** | AI Automation Accelerator: Build Workflows & Agents |
| **Module** | 5 · Ship It |
| **Length** | 5–7 min (~770 spoken words) |
| **Format** | Talking head + screen recording |

**Goal of this video:** Build a golden test set from real examples, score each type of output the right way and rerun it after every change, so you know your automation still works.

## Before you record

- A test spreadsheet with the columns ID, Input, Expected and Must not, holding a few anonymized sample cases
- An AI assistant in a new chat, for pasting the grader prompt
- A sample policy, a sample customer email and a sample draft reply to fill in the grader's placeholders (no real customer data)
- Your automation platform open on a duplicate test version of a workflow, never the live one

## Script

### 1. Hook · 0:00

**[ON CAMERA]**

"It worked when I tried it" isn't a test. AI output varies from run to run, and a prompt tweak that fixes one case can quietly break three others.

A golden test set lets you know, rather than hope, that your automation works, and that your next change didn't break it. It's the single habit that most separates hobby automations from production ones.

### 2. What a golden set is · 0:25

**[ON SCREEN TEXT: "Real inputs + expected results, rerun after every change"]**

A golden set is a collection of real inputs, anonymized where needed, each paired with the correct output or the criteria a good output must meet. You run the whole set every time you change the prompt, the model, the context documents or the workflow. Then you compare the results to the expected answers.

### 3. Build your set · 0:50

**[ON SCREEN TEXT: "About 60% typical · 25% edge · 15% adversarial"]**

Start with 20 to 30 cases, and grow to 50 to 100 for workflows that matter. Use real examples: past emails, inquiries and tickets, plus items from your review queue.

Mix the difficulty. As a rough guide, aim for about 60% typical cases and 25% edge cases, like very short, very long, another language or missing fields. The last 15% are adversarial: manipulation attempts, nonsense and things that should be refused or escalated.

Write the expected result before you run anything, so the AI's answer can't anchor your judgment. A simple spreadsheet works, with an ID, the input, what you expect and what it must not do. For "I was charged twice this month," you'd expect billing and high priority, and it must not promise a refund.

### 4. Score it the right way · 1:45

**[ON CAMERA]**

Different outputs need different scoring. Categories and flags get an exact match, reported as a percentage, and extracted fields get a field-by-field match.

Drafts and summaries get a pass or fail on each item of a checklist. Agent runs are scored on whether they used the right tools, reached the right end result and stayed within limits.

For drafts, a human can score the checklist, or you can use a second AI step as a grader. Here's the grader prompt from the written lesson.

**[SCREEN RECORDING]** Paste this prompt:

~~~
You are grading a draft customer reply against a checklist.
Mark each item PASS or FAIL with a short reason. Be strict: if in doubt, FAIL.

<checklist>
1. Answers the customer's actual question
2. Uses only facts found in the policy
3. Makes no promises about refunds, credits or deadlines
4. Under 150 words and friendly in tone
</checklist>

<policy>{{policy}}</policy>
<customer_email>{{email}}</customer_email>
<draft>{{draft}}</draft>

Return only JSON: a "results" list with "item", "verdict" and "reason"
for each checklist item, and "overall": "PASS" or "FAIL".
~~~

Notice the instruction to be strict: if in doubt, fail. Each checklist item gets a verdict and a reason, and the result comes back as JSON your workflow can use.

But an AI grader is a tool, not an oracle. Before you trust it, grade 20 drafts yourself and compare, and if you and the grader disagree often, tighten the checklist wording until you agree.

### 5. Run it without code · 3:05

**[ON CAMERA]**

You don't need code to run any of this. Put the cases in a spreadsheet, one row each. Then duplicate your workflow into a test version that reads each row, runs the AI step and writes the output into new columns.

That test version must never touch live systems. Add a formula column that compares the output to the expected result.

Then run important cases two or three times. A case that passes once and fails once is a real problem that a single run would hide.

### 6. Set the bar before you look · 3:40

**[ON SCREEN TEXT: "Safety rules need 100%"]**

Here's the mistake to avoid: deciding what "good enough" means after you've seen the scores. Set your pass thresholds in advance, for example 95% on categories and 100% on every "must not" rule. Safety rules deserve a perfect score, so if a change improves the overall score but breaks a "must not" case, it doesn't ship.

Rerun the set after every prompt change, however small, and every model or effort change. Do the same for every change to context documents or the workflow's structure, and monthly regardless, because inputs drift over time.

And make it a rule that every production failure becomes a new test case. Over time, your golden set becomes a precise record of everything that has ever gone wrong, and a guarantee it won't quietly happen again.

### 7. Build it · 4:35

**[ON CAMERA]**

Your exercise is in the Build it section of the written lesson. Collect 20 real examples for your main automation and anonymize them. Write the expected result and "must not" rules for each, before running anything.

Build a test version of your workflow that writes results into the sheet. Run it, calculate your scores and record them as your baseline.

Then make one prompt improvement, rerun and compare. That's the loop you'll repeat after every change.

### 8. Recap and what's next · 5:10

**[ON CAMERA]**

Let's recap. A golden set is real inputs plus expected results, rerun after every change. Mix typical, edge and adversarial cases, and write expectations before running.

Score by output type, and calibrate any AI grader against your own judgment. Set thresholds in advance, require perfection on safety rules and turn every failure into a test.

**[ON SCREEN TEXT: "Next: Monitoring, Logging and Managing Costs"]**

In the next lesson, Monitoring, Logging and Managing Costs, you'll keep watch once your automation is live: what to log, which numbers matter and how to keep AI costs under control.

## On-screen text

- Real inputs + expected results, rerun after every change
- About 60% typical · 25% edge · 15% adversarial
- Safety rules need 100%
- Next: Monitoring, Logging and Managing Costs

## Lesson page description

"It worked when I tried it" isn't a test. Learn to build a golden test set from real examples, score each type of output the right way, calibrate an AI grader against your own judgment and set pass thresholds before you look, so every change is checked before it ships.
