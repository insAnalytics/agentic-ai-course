# Module 4, Lesson 2 — Concept 1: Agents get worse before the window is full

---

## The window isn't the real limit

[Lesson 1](→ this module, context as a budget lesson) measured the budget in tokens and headroom, and its tracker warned well before headroom reached zero. This concept explains why: an agent's answers start getting worse long before its context runs out of room. Running out is only the last and most visible failure. The first is quieter.

That's worth being precise about, because it changes what every later technique in this module is *for*. If the only problem were capacity, you could wait until a request was about to overflow and then trim it. Because the problem starts earlier, context has to be managed as a matter of quality, while there's still plenty of room.

## What the evidence shows

**It happens to every model tested.** In July 2025, Chroma published a study called "Context Rot" that tested 18 models, including GPT-4.1, Claude 4, Gemini 2.5 and Qwen3. They kept the tasks deliberately simple, such as finding one fact in a document or copying back a sequence of repeated words, and varied only the length of the input. Every model got less reliable as the input grew. Two findings matter especially for agents:

- **The degradation isn't a cliff.** Accuracy falls gradually as input grows, well inside the window, not suddenly at the limit.
- **Similar-but-irrelevant content hurts most.** Performance dropped further when the input contained distractors resembling the thing the model was looking for. An agent's scratchpad is full of exactly that: dozens of tool results that look alike, only a few of which matter.

**Model builders say the same.** Anthropic's engineering post "Effective context engineering for AI agents" describes the same effect, which it also calls context rot, appearing across all models, some degrading more gently than others. It frames context as a finite resource with diminishing returns, and says a model has an "attention budget" that every added token draws on.

**Position matters, too.** [Module 1's lesson on uneven use of long contexts](→ Module 1, context windows and kv cache lesson, uneven use of long contexts concept) showed that models use information at the start and end of their input more reliably than information in the middle. There it was a property of the model. For an agent, it becomes a design constraint, because of what the loop does to position.

## Watch where the evidence goes

Here's the log-checking agent from Lesson 1. Of twelve agents' logs, only one, `agent_5`'s, contains the `status=500` that answers the user's question. The demo tracks where that one tool result sits in the input as the loop keeps going:

```python
SYSTEM_PROMPT = "You are the registry assistant. Investigate agent health using the monitoring tools, then summarise."
GOAL = "Check the logs for twelve agents and list any that returned status=500."

def get_logs(agent_name: str) -> str:
    status = "500" if agent_name == "agent_5" else "200"
    line = f"2026-09-25T10:00:00Z {agent_name} INFO request handled in 412ms status={status} route=/v1/answer\n"
    return line * 70

def position_of(target_id: str, messages: list) -> float:
    # how far through the input the target tool result sits, from 0% (start) to 100% (end)
    before = count_tokens(SYSTEM_PROMPT)
    for message in messages:
        size = count_tokens(message)
        if isinstance(message["content"], list) and any(
                isinstance(b, dict) and b.get("tool_use_id") == target_id for b in message["content"]):
            middle_of_target = before + size / 2
            total = count_tokens(SYSTEM_PROMPT) + count_tokens(messages)
            return middle_of_target / total
        before += size
    return -1.0

messages = [{"role": "user", "content": GOAL}]
evidence_id = None
for turn in range(1, 13):
    agent = f"agent_{turn}"
    call = ToolUseBlock(name="get_logs", input={"agent_name": agent})
    if agent == "agent_5":
        evidence_id = call.id          # the one result that actually answers the question
    messages.append({"role": "assistant", "content": [call]})
    messages.append({"role": "user", "content": [{"type": "tool_result", "tool_use_id": call.id, "content": get_logs(agent)}]})
    if turn in (5, 8, 12):
        print(f"after {turn:>2} tool calls: the status=500 result sits {position_of(evidence_id, messages):.0%} of the way through the input")
```
```
after  5 tool calls: the status=500 result sits 90% of the way through the input
after  8 tool calls: the status=500 result sits 57% of the way through the input
after 12 tool calls: the status=500 result sits 38% of the way through the input
```
*(runs live, shows output — read-only demo snippet, not graded; the fake client's classes and `count_tokens` are already loaded)*

When it arrived, the decisive result was near the end of the input, where models use information well. Seven tool calls later it's in the middle, surrounded on both sides by eleven near-identical logs, which is the least reliable position *and* the distractor-heavy situation the Chroma study found hardest. Nothing about the result changed. The loop just kept appending.

This demo only measures position; it can't show a model actually missing the result, because the fake client isn't a real model. That's the pattern for this whole lesson: the degradation itself is a property of real models, documented in the studies above, and the exercises are about what you do in response.

## What it means for the rest of the module

The conclusion the rest of this module keeps coming back to: **context is a quality problem before it's a capacity problem.** Every technique that follows, pruning, compacting, loading things only when needed, storing them outside the window, has a cost reason and a quality reason, and the quality reason usually matters first. The next three concepts are the first responses: removing what's gone stale, stopping instructions from piling up, and keeping the goal where the model will see it.

---

## Quiz cards

> **Q1.** What did Chroma's "Context Rot" study find about model accuracy as input length grows?
> - A) Accuracy holds steady until the context window is almost full, then collapses
> - B) Only older models degrade; recent ones don't
> - C) It only matters for inputs over a million tokens
> - D) Every model tested got less reliable as the input grew, even on simple tasks and well inside the window ✅
>
> *Explanation:* The degradation is gradual and appears well before the limit, which is why context has to be managed for quality, not just capacity.

> **Q2.** Why are an agent's accumulated tool results a particularly bad kind of long context?
> - A) Tool results are counted as more tokens than other text
> - B) They tend to be many similar-looking results with only a few that matter, and similar-but-irrelevant content hurt performance most in the study ✅
> - C) Models can't read tool results
> - D) They're always placed in the system prompt
>
> *Explanation:* Distractors that resemble the target made accuracy drop further. A scratchpad full of near-identical results is that situation.

> **Q3.** In the demo, why does the decisive tool result end up in the middle of the input?
> - A) The agent moved it there to save space
> - B) Every later tool result was appended after it, pushing it back from the end ✅
> - C) The fake client reorders messages
> - D) Tool results are always inserted in the middle
>
> *Explanation:* The loop only appends. Whatever arrives early drifts toward the middle as more arrives after it, the position models use least reliably.

> **Q4.** What can the demo show, and what can't it?
> - A) It shows the model missing the result, proving context rot
> - B) It shows nothing useful, since the fake client isn't a real model
> - C) It shows where the result sits in the input; the actual drop in accuracy comes from studies of real models ✅
> - D) It shows that the model ignores results in the middle
>
> *Explanation:* Position is simple arithmetic on the context. Whether a real model misses a buried result is an empirical question, answered by the research, not by a scripted client.

> **Q5.** Why does "context is a quality problem before it's a capacity problem" change when you manage context?
> - A) It means you should manage context only when a request fails
> - B) It means you should manage it early, while there's still room, since answers degrade long before the window fills ✅
> - C) It means you should always use the largest available window
> - D) It means context size doesn't matter
>
> *Explanation:* If only capacity mattered, trimming at the last moment would be enough. Since quality drops earlier, the time to act is earlier too.

---

*(End of Concept 1. This lesson continues with Concept 2 — what goes stale in a scratchpad.)*
