# Lesson 16: Monitoring, Logging and Managing Costs

| | |
|---|---|
| **Course** | AI Automation Accelerator: Build Workflows & Agents |
| **Module** | 5 · Ship It |
| **Length** | 5–7 min (~810 spoken words) |
| **Format** | Talking head + screen recording |

**Goal of this video:** Add a run log to your automation, watch the handful of metrics that matter, estimate AI costs from real token counts and use the levers that keep those costs low.

## Before you record

- Your automation platform open on a test workflow, plus a test spreadsheet set up as a run log
- The weekly review checklist and the cost formula from the written lesson, ready to paste
- Optional: your platform's run history, showing test runs only (no customer data on screen)

## Script

### 1. Hook · 0:00

**[ON CAMERA]**

Launch day is the start, not the finish. Inputs drift, apps change their fields, volume grows and costs follow.

Monitoring tells you something's wrong before a customer does. Cost awareness keeps a great automation from turning into an unpleasant invoice.

The good news is that a simple log and a 15-minute weekly review cover most of it. Let's set up both.

### 2. Log every run · 0:25

**[ON SCREEN TEXT: "One run, one row"]**

Every run should write one row to a log, in a spreadsheet, a database or your platform's run history if it keeps enough detail. Record a run ID and timestamp so you can trace any single run, and the source item ID so you can find the original and prevent duplicates.

Log the prompt version and the model and effort, so you can connect quality and cost changes to what you changed. Save the AI output or a link to it, the validation result and the action taken with its result.

Then add two more fields. The human outcome, whether approved, edited or rejected, is your best quality signal, and tokens and duration tell you about cost and speed.

One caution: logs contain customer data too. Store only what you need, restrict who can see the log and delete old entries on a schedule.

### 3. Watch the metrics that matter · 1:30

**[ON SCREEN TEXT: "Volume · Success · Failures · Edit rate · Speed · Cost"]**

Watch volume first, meaning runs per day. A sudden drop to zero usually means a broken trigger, and that's the most dangerous silent failure.

Then track success rate, plus validation failures, refusals and cut-offs, which are early warnings of drifting inputs or prompt problems. Track the review and edit rate, the time from trigger to finished action and cost per run and per month.

Set alerts for the failures that hurt most. That means no runs when you'd expect some, a spike in failures, a growing review queue and spending above a set amount.

### 4. The weekly 15-minute review · 2:10

**[SCREEN RECORDING]** Paste this checklist:

~~~
WEEKLY AUTOMATION REVIEW: [automation name]   [date]
[ ] Volume normal? Any days with zero runs?
[ ] Failures: how many, which types, any new patterns?
[ ] Review queue: size, oldest item, common reasons
[ ] Edit rate this week vs. last week
[ ] Cost this week vs. budget
[ ] Pick 5 random completed runs and read them end to end
[ ] Anything to add to the golden test set?
ACTIONS: [owner] [due date]
~~~

Here's the review itself. In about 15 minutes, you check volume, failures, the review queue, the edit rate and cost against budget.

Don't skip the line about five random runs. Pick five completed runs and read them end to end, then ask whether anything belongs in your golden test set.

### 5. Understand what AI costs · 2:45

**[ON CAMERA]**

AI providers charge per token, a chunk of text that's often around three-quarters of an English word. You pay for input tokens, meaning instructions, context and the incoming message, and for output tokens, which is the response. Output is usually priced higher, and any thinking the model does before answering is billed as output too.

**[SCREEN RECORDING]** Paste this template:

~~~
Cost per run  = (input tokens x input price) + (output tokens x output price)
Monthly cost  = cost per run x runs per month, plus retries and test runs
~~~

Prices are quoted per million tokens and change over time. So check your provider's current pricing page and calculate with your own numbers, using the token counts from your run log.

### 6. The cost levers · 3:35

**[ON SCREEN TEXT: "Filter · Trim · Effort · Model size · Cache · Batch · Cap loops · Spending limits"]**

Work through the cost levers roughly in order, because the first ones are free. Filter before the AI: skip newsletters, duplicates and irrelevant items with plain rules, because the cheapest AI call is the one you don't make. Then trim the context to the fields and documents the step actually needs.

Set the effort level, which controls how much thinking the model does. Use low effort for classification and extraction, and save higher effort for complex reasoning and important writing. Then right-size the model: run your golden set on a smaller model, and if it passes your thresholds, switch that step.

Use prompt caching when many runs share the same long beginning, such as instructions, policies and examples. Put stable content first and the changing message last. Caches expire after a few minutes without use by default, so caching pays off most for busy workflows.

Batch what isn't urgent, such as overnight reports, because batch processing runs asynchronously at a discount. Cap agent steps and retries so a confused run can't spin for hours. And set spending limits and alerts in your AI provider's console and your automation platform.

The common mistake is pulling a lever and assuming quality held. Always confirm the change against your golden set.

### 7. Build it · 5:05

**[ON CAMERA]**

Now head to the Build it section of the written lesson. Add a run log to your automation with the fields we covered. Then set at least two alerts: zero runs in a period when you'd expect some, and failures above a threshold.

Estimate your monthly cost from real token counts. Then try one cost lever, such as lower effort or a smaller model, and confirm with your golden set that quality holds.

### 8. Recap and what's next · 5:35

**[ON CAMERA]**

Let's recap. Log every run, including the human outcome, because it's your best quality signal. Watch volume, failures, edit rate, speed and cost, and alert on silent failures.

Costs come from input and output tokens, so calculate with current prices and real counts. Then filter, trim, tune effort, right-size the model, cache and batch, always checked against your golden set.

**[ON SCREEN TEXT: "Next: Security and Privacy: Prompt Injection, Secrets and Data"]**

In the next lesson, Security and Privacy: Prompt Injection, Secrets and Data, you'll protect your automations from text written by strangers, keep your API keys safe and send the AI only the data it needs.

## On-screen text

- One run, one row
- Volume · Success · Failures · Edit rate · Speed · Cost
- Filter · Trim · Effort · Model size · Cache · Batch · Cap loops · Spending limits
- Next: Security and Privacy: Prompt Injection, Secrets and Data

## Lesson page description

Launch day is the start, not the finish. Learn what to log on every run, which metrics and alerts catch silent failures, how a 15-minute weekly review keeps things healthy and how AI costs work, plus the levers that keep them low without hurting quality.
