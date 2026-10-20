# Lesson 6: Error Handling, Retries and Human Review

| | |
|---|---|
| **Course** | AI Automation Accelerator: Build Workflows & Agents |
| **Module** | 2 · No-Code AI Workflows |
| **Length** | 5–7 min (~850 spoken words) |
| **Format** | Talking head + screen recording |

**Goal of this video:** Match each failure to the right response, retry without creating duplicates, plan fallbacks and set up a human review queue that doesn't become a bottleneck.

## Before you record

- Your automation platform open on a test copy of your workflow, pointed at a test spreadsheet or sandbox CRM
- A spreadsheet tab, filtered CRM view, project board or chat channel you can show as an example review queue
- A blank note, ready to paste the review item template and the failure plan from the written lesson
- Sample inputs for breaking things on purpose: an empty message, some invalid data and a duplicate submission

## Script

### 1. Hook · 0:00

**[ON CAMERA]**

Every automation fails eventually. An API times out, a customer pastes a novel into a form field, or someone renames a column in the spreadsheet. The difference between a fragile demo and a dependable tool isn't whether it fails.

It's what happens next. In this lesson you'll build a complete failure plan: retries, fallbacks and a human review queue that keeps quality high without slowing everything down.

**[ON SCREEN TEXT: "Error Handling, Retries and Human Review"]**

### 2. Know your failure types · 0:30

**[ON CAMERA]**

Different failures need different responses. Retrying a bad input ten times just fails ten times.

**[ON SCREEN TEXT: "Only temporary errors get automatic retries"]**

Temporary failures, like a timeout, a rate limit or a busy service, deserve a retry with increasing waits. Bad input, like an empty message or an attachment with no text, gets skipped or routed to a human, and logged. Invalid AI output gets one retry with the error, then goes to review.

A refusal shouldn't be retried blindly; send it to review. Cut-off output means you fix the limit or the input, and never act on the partial answer. If an action fails, retry if it's temporary, otherwise alert the owner, and if it's a logic bug, fix the workflow and replay the affected items.

### 3. Retry safely, without duplicates · 1:20

**[ON CAMERA]**

Most platforms and the official AI SDKs can retry temporary errors for you. When you configure retries yourself, only retry temporary errors, and back off, waiting longer each time, say thirty seconds, then two minutes, then ten. Cap it at three attempts, then alert a human, and retry the failed step rather than the whole run where your platform allows it.

The real danger with retries is duplicates: a retry that sends the same email twice or creates two CRM records. You prevent that with an idempotency check.

**[ON SCREEN TEXT: "Unique key → Check the log → Find-or-create → Record the key"]**

Give every run a unique key, like the form submission ID or the email message ID. Before any action, check whether that key has already been processed, using a run log or a CRM field. Use find-or-create instead of create for records, and record the key as soon as the action succeeds.

### 4. Plan your fallbacks · 2:20

**[ON CAMERA]**

A fallback is what happens when the AI step can't deliver. One option is a non-AI fallback: if the AI step fails, you still save the lead to the CRM tagged "unclassified" and send your standard acknowledgment. The customer never notices.

For risky actions, fail closed. If anything is uncertain, don't send, publish or delete; hold it for review. For harmless ones, like logging and internal notes, fail open and proceed with a warning.

And save the raw input before the AI step runs, in a sheet, a database or a CRM note. Then no failure, anywhere, can lose a customer's message.

### 5. Design a human review queue · 3:05

**[ON CAMERA]**

A review queue is a single place where items needing human attention land. It can be a spreadsheet tab, a filtered CRM view, a project board or a chat channel. What matters is that it's one place, it has an owner and it gets checked on a schedule.

Route items there when validation still fails after one retry, when the model says it needs a human, refuses or gets cut off, and when the category is on your sensitive list, like complaints, refunds, cancellations or legal. And when a workflow is new, review everything at first, then move to a random sample once quality is proven. Each item should show everything needed to decide in under a minute.

**[SCREEN RECORDING]** Paste this template:

~~~
REVIEW: Support email from {{customer_name}}
WHY IT'S HERE:   needs_human = true ("mentions a refund")
ORIGINAL:        {{link_to_email}}
AI OUTPUT:       category: billing | urgency: high
                 summary: Charged twice for March invoice
DRAFT REPLY:     {{draft_link}}
ACTIONS:         Approve and send | Edit | Reject (add a reason)
DUE:             Within 4 business hours
~~~

The reviewer sees why it's here, a link to the original, the AI's output and the draft. Then three clear choices and a due time.

### 6. Keep the queue from becoming a bottleneck · 4:20

**[ON CAMERA]**

Set a response time and a named owner, with a backup. Then watch the queue size, because a growing queue is a signal. The common mistake is throwing more reviewers at it, when you should be fixing the cause upstream.

Record what reviewers change, because every edit tells you something. Patterns become prompt improvements, new rules or new test cases. And once the edit rate stays low for several weeks, review a random sample instead of everything.

### 7. Add it to your spec · 4:55

**[ON CAMERA]**

Finally, write all of this down. Here's the failure plan to add to your workflow spec.

**[SCREEN RECORDING]** Paste this template:

~~~
ON TEMPORARY ERROR: retry 3 times (30s, 2m, 10m), then alert owner
ON INVALID OUTPUT:  retry once with the error, then review queue
ON REFUSAL/CUT-OFF: review queue, no automatic retry
ON ACTION FAILURE:  alert owner with a link to the run
DUPLICATE GUARD:    skip if the message ID is already in the run log
RAW INPUT SAVED TO: "Inbound log" sheet, before the AI step
REVIEW QUEUE:       "Needs review" CRM view, checked 10am and 3pm by [name]
~~~

Every failure type has a line, and so do the duplicate guard, the raw input log and the review queue, with a schedule and a name.

### 8. Build it · 5:25

**[ON CAMERA]**

For the Build it exercise in the written lesson, add a step that saves the raw input before your AI step. Configure retries with backoff for temporary errors, add a duplicate guard using a unique ID from the trigger, and create a review queue for failed validations, refusals and needs-human items.

Then break things on purpose. Feed it an empty input, invalid data and a duplicate, and confirm each one lands where your spec says.

### 9. Recap and what's next · 6:00

**[ON SCREEN TEXT: "Retry the temporary · Guard against duplicates · Fail closed · One queue, one owner"]**

Let's recap. Match the response to the failure type, because only temporary errors deserve automatic retries. Prevent duplicates with unique keys, find-or-create and a run log.

Save the raw input first, and fail closed on risky actions. And give your review queue one place, one owner and a schedule, and learn from every edit.

**[ON CAMERA]**

In the next lesson, Blueprint: Lead Capture, AI Qualification and Follow-Up, you'll put everything from this module together in your first complete real-world build. See you there.

## On-screen text

- Error Handling, Retries and Human Review
- Only temporary errors get automatic retries
- Unique key → Check the log → Find-or-create → Record the key
- Retry the temporary · Guard against duplicates · Fail closed · One queue, one owner

## Lesson page description

Every automation fails eventually; what matters is what happens next. This video covers the main failure types and the right response to each, safe retries without duplicates, fallbacks that fail closed on risky actions, and a human review queue with an owner and a schedule.
