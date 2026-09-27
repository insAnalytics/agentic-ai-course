# Module 4, Lesson 8 — Concept 1: What dies with the session, and what shouldn't

> **Note for the site build:** this concept's demo needs only the fake client (`ToolUseBlock`, `TextBlock`, `_plain`, `count_tokens`) and `json`. No new shared code.

---

## Two lifetimes

Everything this module has managed so far lives inside one session:

- **the history** the loop keeps, and the prepared copy it sends ([Lessons 1–5](→ this module, context as a budget lesson))
- **the plan and the rules** restated at the end of each request ([Lesson 2](→ this module, context that fits but still hurts lesson, re-anchoring the goal concept))
- **the result store and the notes** ([Lesson 6](→ this module, offloading context to storage and note taking lesson))
- **the tools and guides loaded on demand** ([Lesson 7](→ this module, just in time context and dynamic tool exposure lesson))

That's **short-term memory**: everything the agent holds while it works on one task, in one session. When the session ends, all of it goes.

**Long-term memory** is what survives into the next session: a new conversation, maybe days later, about a different task. A user who told the agent last week how they like their reports shouldn't have to tell it again.

## Checkpointing isn't remembering

[Module 2's checkpoint and resume](→ Module 2, agent state and the scratchpad lesson, checkpoint and resume concept) already made short-term memory durable. It saved the entire message list, so an interrupted task could pick up exactly where it stopped. That's the right tool for its job, and its job is continuing *the same task*. Resuming needs everything, because the task isn't finished.

A new session needs almost none of that. Last week's tool results, reasoning and dead ends are irrelevant to this week's task, and some of them are no longer true. What the new session needs is a few selected things that outlast any one task. Checkpointing keeps a session; long-term memory keeps what was worth keeping from it.

## Starting the next session

Here's a session from last Monday. The agent investigated a slow agent, and along the way the user said two things that should outlast it. Then a new session starts this Monday, with a new task, three ways:

```python
def call(name, result, **arguments):
    block = ToolUseBlock(name=name, input=arguments)
    return [{"role": "assistant", "content": [block]},
            {"role": "user", "content": [{"type": "tool_result", "tool_use_id": block.id, "content": result}]}]

# session 1, last Monday: an investigation, with a few things said along the way that matter beyond it
session_1 = [{"role": "user", "content": "support_agent is slow. Find out why. Keep summaries to bullet points, please."}]
session_1 += call("registry__get", "support_agent: model claude-haiku, p99 4.1s", id="support_agent")
for agent in ["billing_agent", "search_agent", "triage_agent", "report_agent"]:
    session_1 += call("get_logs", f"{agent} INFO request handled in 412ms status=200\n" * 40, agent_name=agent)
session_1 += [{"role": "assistant", "content": [TextBlock(text="- billing_agent's per-ticket lookup is the bottleneck\n- the others look normal")]},
              {"role": "user", "content": "Thanks. From now on, cc Priya on anything about support_agent; she owns it."}]
session_1 += call("registry__update", "support_agent now runs on claude-sonnet", id="support_agent", fields=["model"])
session_1 += [{"role": "assistant", "content": [TextBlock(text="- support_agent moved to claude-sonnet\n- I'll cc Priya from now on")]}]

# session 2, this Monday: a new task
task_2 = {"role": "user", "content": "Write this week's status note on support_agent."}

nothing = [task_2]
everything = session_1 + [task_2]
memories = ["The user wants summaries as bullet points.",
            "cc Priya on anything about support_agent; she owns it.",
            "Last Monday: billing_agent's per-ticket lookup was found to be support_agent's bottleneck."]
selected = [{"role": "user", "content": "What you remember about this user:\n- " + "\n- ".join(memories) + "\n\n" + task_2["content"]}]

def has(messages, text):
    return text in json.dumps(_plain(messages))

print(f"{'session 2 starts with':24} {'tokens':>7}  bullets?  cc Priya?  says 'claude-haiku'?")
for label, messages in [("nothing", nothing), ("the whole transcript", everything), ("three memories", selected)]:
    print(f"{label:24} {count_tokens(messages):>7,}  {str(has(messages, 'bullet')):8}  {str(has(messages, 'Priya')):9}  {has(messages, 'claude-haiku')}")
```
```
session 2 starts with     tokens  bullets?  cc Priya?  says 'claude-haiku'?
nothing                       20  False     False      False
the whole transcript       2,748  True      True       True
three memories                79  True      True       False
```
*(runs live, shows output — read-only demo snippet, not graded; the three memories are written by hand here, and choosing them automatically is Lesson 10's subject)*

- **Starting with nothing** is cheap, and the agent has forgotten both of the user's standing requests. The note won't be in bullet points, and Priya won't be copied.
- **Starting with the whole transcript** keeps them, at 35 times the size of the version with three memories. It also carries everything else: four logs nobody needs, and a stale fact. It says `support_agent` runs on claude-haiku, and later, in the same transcript, that it was moved to claude-sonnet. The model has to work out which is current. That's the kind of conflicting, look-alike context [Lesson 2's evidence](→ this module, context that fits but still hurts lesson) found models handle worst. And every session would add another transcript, so the problem grows each week.
- **Starting with a few memories** keeps what matters in a fraction of the space, and leaves the stale state behind.

## What long-term memory is for

The third version is the whole idea: a small, selected record of what lasts. Some kinds of thing tend to last:

- **how the user wants things done:** bullet points, and who to copy
- **conclusions that took work to reach:** billing_agent's lookup was the bottleneck
- **facts about the user's world that don't change daily:** Priya owns support_agent

Other things generally don't: raw tool output, and live state such as which model an agent runs on this week. The agent can look those up when it needs them. The third memory above is dated for that reason. It was true last Monday, which is different from being true now. Keeping memories that go stale honest is [Lesson 11's](→ this module, forgetting aging and retrieval quality lesson) subject.

These memories also belong to one user. Starting someone else's session with them would leak one person's preferences and work into another person's session. [Lesson 9](→ this module, building a memory store lesson) treats that separation as a requirement from the start.

The next concept breaks long-term memory into the three decisions every design has to make: how memories are stored, how the right ones are found, and where they go in the request.

---

## Quiz cards

> **Q1.** Which of these is long-term memory?
> - A) The plan restated at the end of each request
> - B) The result store holding a large tool result
> - C) A user's preference, carried into a new session a week later ✅
> - D) A checkpoint used to resume an interrupted task
>
> *Explanation:* The first three live within a session, and the checkpoint keeps one task's session going. Long-term memory is what survives into new, unrelated sessions.

> **Q2.** Why isn't Module 2's checkpoint-and-resume the same thing as long-term memory?
> - A) Checkpoints can't be saved to a file
> - B) A checkpoint keeps the whole session so the same task can continue, while a new session needs only a few selected things that outlast any task ✅
> - C) Checkpoints only work with the fake client
> - D) Long-term memory must be stored in the system prompt
>
> *Explanation:* Resuming needs everything, because the task isn't done. A new task needs almost none of the old session, and some of it is no longer true.

> **Q3.** Starting session 2 with session 1's whole transcript kept the user's preferences. What went wrong?
> - A) It was 35 times larger than three memories, full of irrelevant tool output, and carried a stale fact next to its correction ✅
> - B) It broke tool pairing
> - C) The preferences were lost in the transcript
> - D) Nothing: it's the recommended approach
>
> *Explanation:* The model has to sort current facts from old ones, among material it doesn't need, and every new session adds another transcript.

> **Q4.** Which of these is a poor candidate for long-term memory?
> - A) The user wants summaries as bullet points
> - B) Priya owns support_agent
> - C) billing_agent's lookup was found to be the bottleneck last Monday
> - D) support_agent currently runs on claude-sonnet ✅
>
> *Explanation:* Live state can change at any time, and the agent can look it up when it needs it. The third option is a dated conclusion, true as of when it was reached, and recorded that way.

> **Q5.** Why must one user's memories never start another user's session?
> - A) It would make the request too long
> - B) The cache would break
> - C) It would leak one person's preferences and work into someone else's session ✅
> - D) Memories can only be read once
>
> *Explanation:* Memories are personal by default. Lesson 9 builds the store with per-user separation as a requirement, not an extra.

---

*(End of Concept 1. No graded exercise here: the lesson's exercises start with the three parts of memory, in Concept 2.)*
