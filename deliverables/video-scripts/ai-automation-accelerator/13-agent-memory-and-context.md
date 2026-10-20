# Lesson 13: Memory and Context: What Your Agent Knows

| | |
|---|---|
| **Course** | AI Automation Accelerator: Build Workflows & Agents |
| **Module** | 4 · AI Agents |
| **Length** | 5–7 min (~840 spoken words) |
| **Format** | Talking head + screen recording |

**Goal of this video:** Design what your agent sees at each step: separate the five kinds of memory, keep context lean, prepare your documents for retrieval and set up long-term memory safely.

## Before you record

- Your Agent Design Canvas from the previous lesson, with the memory box still empty
- A test CRM or spreadsheet with a sample client record and a notes field (no real customer data)
- The client memory record template from the written lesson, ready to paste

## Script

### 1. Hook · 0:00

**[ON CAMERA]**

Let's start with a simple fact that shapes everything in this lesson. An agent doesn't "know" anything between steps except what's put in front of it.

Every time the model takes a turn, it sees a context window: its instructions, the conversation so far, tool results and anything else you include. Deciding what goes in, and what stays out, is one of the most important design choices you'll make.

Too little, and the agent guesses. Too much, and it gets slow, expensive and distracted.

### 2. Five kinds of memory · 0:35

**[ON SCREEN TEXT: "Instructions · Working context · Reference knowledge · Long-term memory · Task state"]**

"Memory" actually means five different things, and you design each one deliberately. Instructions are the role, rules and style, and they live in the brief, unchanged between runs. Working context is the current task, the steps so far and tool results, held in the messages of this run.

Reference knowledge is your policies, product details and FAQs, kept in documents that get searched when needed. Long-term memory is facts worth keeping across runs, stored in a database, CRM or notes the agent reads and writes through tools. And task state is progress on multi-day work, tracked in a record such as a ticket or a row.

Most agent bugs blamed on "memory" come from mixing these up. Think of stuffing a whole policy library into the brief, or expecting a fact from last week's run to survive when nobody saved it anywhere.

### 3. Keep context lean · 1:35

**[ON CAMERA]**

Context windows are large, but every token costs money and time, and irrelevant material makes it harder for the model to focus. So build a few habits. Keep the brief stable and put it first, which is also what makes prompt caching work later in Module 5.

Trim tool results to the handful of fields that matter. Fetch just in time: pass IDs and short summaries, and let the agent look up details when it needs them.

For long-running work, summarize earlier steps into decisions made, facts learned and open questions. Wrap untrusted content, such as emails or web pages, in clearly named tags, so instructions and data stay distinct. And date-stamp information, so the agent can tell current from stale.

### 4. How retrieval works · 2:30

**[ON SCREEN TEXT: "Split · Search · Add to context"]**

When an agent needs your policies or product information, it usually searches for them rather than carrying everything all the time. Your documents are split into sections, a search finds the most relevant sections by keywords, by meaning or both, and those sections are added to the context.

Here's the part people miss: retrieval quality depends far more on your documents than on the technology. Keep one source of truth per topic, because two conflicting return policies guarantee inconsistent answers. Write clear, self-contained sections with descriptive headings, put titles and dates on documents and archive outdated versions.

Then test with real questions your customers and team actually ask. And tell the agent plainly: "If the answer isn't in the documents provided, say so."

### 5. Design long-term memory carefully · 3:20

**[B-ROLL: a CRM contact record with a notes field]**

Long-term memory is powerful. The agent remembers that a client prefers email, or that a project is waiting on approval. But it's also a database that an AI writes to, so design it like one.

Decide what's worth saving, with an explicit list such as preferences, commitments, open questions and key dates, and nothing else. Record the source of every fact, make memory visible and editable by people and expire or review old facts, because preferences change.

Respect privacy, too. Don't save sensitive personal information you don't need, and make sure memories are included when someone asks for their data to be deleted.

### 6. A memory record, and a warning · 4:05

**[SCREEN RECORDING]** Paste this template:

~~~
CLIENT MEMORY: [client name]
PREFERENCES:   Prefers email over calls. Based in [time zone].
CONTEXT:       Runs [number] locations. Main goal: fewer missed appointments.
OPEN ITEMS:    Waiting on their approval of the proposal (since [date])
SOURCES:       [call notes, date] / [email, date]
LAST REVIEWED: [date] by [name]
~~~

Here's a simple memory record. Each fact sits in a defined field, the sources are listed and there's a line showing when a person last reviewed it.

Give the agent a dedicated tool for writing memory, such as "save_client_note," with a clear description of what belongs there. Don't let it edit records freely.

Now the most common blind spot: poisoning. If an agent can save notes based on what strangers write, a malicious email could plant false "facts" that influence later runs. So limit what untrusted input can write, and review memory written from external sources.

### 7. Build it · 5:00

**[ON CAMERA]**

Time for the Build it section of the written lesson. Take your Agent Design Canvas and fill in the memory box. For each of the five memory types, write what your agent needs and where it will live.

List the documents it should retrieve from, and fix any duplicates or outdated versions. If it needs long-term memory, write the list of what may be saved and design the record.

### 8. Recap and what's next · 5:30

**[ON CAMERA]**

Let's recap. Your agent knows only what's in its context at each step, so design that context deliberately. Separate instructions, working context, reference knowledge, long-term memory and task state.

Keep context lean, with a stable brief first, trimmed tool results and just-in-time lookups. Retrieval is only as good as your documents, and long-term memory deserves the care of any database: defined fields, sources, review and privacy.

**[ON SCREEN TEXT: "Next: Guardrails, Permissions and Human-in-the-Loop"]**

In the next lesson, Guardrails, Permissions and Human-in-the-Loop, you'll decide how much power your agent gets, which actions need a human to sign off and how to try to break your own design before anyone else does.

## On-screen text

- Instructions · Working context · Reference knowledge · Long-term memory · Task state
- Split · Search · Add to context
- Next: Guardrails, Permissions and Human-in-the-Loop

## Lesson page description

An agent knows only what's in front of it at each step, so what goes into its context is a design decision. Learn the five kinds of agent memory, how to keep context lean, why retrieval depends on clean documents and how to design long-term memory with sources, review, privacy and protection against poisoning.
