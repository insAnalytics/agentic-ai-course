# Module 6, Lesson 8 — Concept 2: Partial answers that say what's missing

---

## Most of an answer is still an answer

A question often needs several sources: "how is `research_agent` doing?"
needs the registry for its model and status, and the health service for its
error rate. When one of them is down, a fallback may not exist; there's only
one health service. The choice then isn't between a full answer and nothing.
The agent can answer the part it can, and say which part it can't.

This is an established principle in system design. AWS's Well-Architected
Framework calls it
[graceful degradation](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_mitigate_interaction_failure_graceful_degradation.html):
a component should keep performing its core function when a dependency
fails, perhaps serving slightly stale data, alternative data, or no data for
that part, and when some of several requests fail, it should report which
succeeded, which failed, and why.

---

## The danger: filling the gap

For an agent, answering with part of the data has a specific risk: the model
may fill in the missing part.
[Sethi et al.'s preprint from Lesson 3](→ this module, checks in the loop lesson, checking a tool result before the model reads it concept)
found that when a tool failed without saying so, models sometimes stated a
value they didn't have, up to 45% of the time for some kinds of failure. Here are two answers written from the same tool
results, one of them the kind that research warns about:

```python
import re

# the two tool results for "How is research_agent doing?": the registry answered, the health service didn't
results = [
    {"tool": "get_agent", "content": '{"agent_name": "research_agent", "model": "claude-sonnet", "status": "active"}',
     "is_error": False},
    {"tool": "get_health", "content": "health-service unavailable (503); no reading was returned", "is_error": True},
]
evidence = " ".join(r["content"] for r in results if not r["is_error"])

answers = {
    "fills the gap": "research_agent is active on claude-sonnet, with a healthy 1.2% error rate.",
    "says what's missing": ("research_agent is active on claude-sonnet. I couldn't get its health figures: "
                            "the health service didn't respond, so its error rate is unknown right now."),
}
for label, answer in answers.items():
    invented = [n for n in re.findall(r"\d+(?:\.\d+)?%?", answer) if n.rstrip("%") not in evidence]
    admits = "couldn't get" in answer.lower() or "unknown" in answer.lower()
    print(f"{label:<20} figures with no source: {invented or 'none'}; says health is missing: {admits}")
```
```
fills the gap        figures with no source: ['1.2%']; says health is missing: False
says what's missing  figures with no source: none; says health is missing: True
```
*(runs live, shows output — read-only demo snippet, not graded. Both
answers are scripted; the checks are the rough versions of Lesson 4's
grounding check and a phrase check.)*

The first answer is fluent, and its error rate came from nowhere. The second
gives what the registry said and states plainly that the health figures are
missing. Three things make the second kind of answer the normal one:

- **Mark the failure clearly.** The health tool's result is an explicit
  error, not an empty success, which is what Lesson 3's research found makes
  models report failures honestly.
- **Check for invented figures.** Lesson 4's grounding check catches a
  number that no tool result supplied, which is exactly what filling the gap
  produces.
- **Check that the missing part is mentioned.** A code check can require
  that an answer built from partial results names what's missing, the same
  honesty rule as
  [Lesson 7's report check](→ this module, actions that mustn't go wrong lesson, checking the agent's report against its log concept).

---

## Stale is better than nothing, if it says so

The AWS guidance lists slightly stale data as one way to degrade. If the
agent cached the last health reading it saw, it can show that instead of
nothing, but only labelled as what it is: the last known value, and when it
was taken. An unlabelled stale value is just a wrong answer that happens to
have been right once. It's the same concern as
[Lesson 3's stale-result check](→ this module, checks in the loop lesson, checking a tool result before the model reads it concept, the "what a result check looks for" section),
turned from a reason to reject into a label to show.

For answers with a fixed shape, such as a status summary, the partial answer
can be assembled in code rather than left to the model, which removes the
chance of filling a gap at all. The exercise does that.

---

## Applied sandbox exercise
*(graded — assembling a partial answer)*

**Task shown to learner:** Write `compose_partial(parts)`. Each part has a
`"label"` and a `"status"`: `"ok"` and `"stale"` parts have a `"value"`, and
stale parts an `"as_of"` too. Return the answer as lines, in the parts'
order:

- an ok part: `label: value`
- a stale part: `label: value (last known, as of as_of)`
- then, if any part failed, a last line: `Not available right now: ` followed
  by the failed labels, separated by commas, and a full stop

If every part failed, return the single line `I couldn't get any of this
right now: ` followed by the labels and a full stop. With no parts, return an
empty string.

**Starter code:**
```python
def compose_partial(parts: list[dict]) -> str:
    """A status answer from parts that may have failed. Each part has a "label", a "status" ("ok",
    "stale" or "failed"), and for ok and stale parts a "value"; stale parts also have "as_of"."""
    ...



print(compose_partial([
    {"label": "model", "status": "ok", "value": "claude-sonnet"},
    {"label": "status", "status": "ok", "value": "active"},
    {"label": "error rate", "status": "stale", "value": "2.3%", "as_of": "09:40"},
    {"label": "p95 latency", "status": "failed"},
]))
```

**Hidden tests:**
```python
model = {"label": "model", "status": "ok", "value": "claude-sonnet"}
status = {"label": "status", "status": "ok", "value": "active"}
health = {"label": "error rate", "status": "failed"}
latency = {"label": "p95 latency", "status": "failed"}
cached = {"label": "error rate", "status": "stale", "value": "2.3%", "as_of": "09:40"}

r = compose_partial([model, status])
assert r == "model: claude-sonnet\nstatus: active", f"got {r!r}: every part answered, one line each, in order"

r = compose_partial([model, health, status])
assert r == "model: claude-sonnet\nstatus: active\nNot available right now: error rate.", (
    f"got {r!r}: answer what's available, then say what isn't, on a last line")

r = compose_partial([model, cached])
assert r == "model: claude-sonnet\nerror rate: 2.3% (last known, as of 09:40)", (
    f"got {r!r}: a stale value is shown, but marked as last known, with its time")

r = compose_partial([health, model, latency])
assert r.endswith("Not available right now: error rate, p95 latency."), (
    f"got {r!r}: list every missing part, in order, separated by commas")

r = compose_partial([health, latency])
assert r == "I couldn't get any of this right now: error rate, p95 latency.", (
    f"got {r!r}: when nothing is available, say so plainly rather than an empty answer")

assert compose_partial([]) == "", "no parts: an empty answer"
```

**Hint (shown on request):** Walk the parts once, adding a line for each ok
or stale part and collecting the failed labels. Decide the missing line
after the loop, once you know whether anything was available.

**Reference solution:**
```python
def compose_partial(parts: list[dict]) -> str:
    """A status answer from parts that may have failed. Each part has a "label", a "status" ("ok",
    "stale" or "failed"), and for ok and stale parts a "value"; stale parts also have "as_of"."""
    lines, missing = [], []
    for part in parts:
        if part["status"] == "ok":
            lines.append(f"{part['label']}: {part['value']}")
        elif part["status"] == "stale":
            lines.append(f"{part['label']}: {part['value']} (last known, as of {part['as_of']})")
        else:
            missing.append(part["label"])
    if missing and not lines:
        return f"I couldn't get any of this right now: {', '.join(missing)}."
    if missing:
        lines.append(f"Not available right now: {', '.join(missing)}.")
    return "\n".join(lines)
```
```
model: claude-sonnet
status: active
error rate: 2.3% (last known, as of 09:40)
Not available right now: p95 latency.
```
*(the starter's printout, with the reference in place)*

**Explanation:** The missing line is the point of the exercise: a partial
answer that doesn't say it's partial reads as complete. Stale values carry
their time, so a reader knows how far to trust them. And an answer where
everything failed says so in one line, instead of returning something empty
that a caller might mistake for "nothing to report".

---

## Quiz cards

> **Q1.** The health service is down, and the registry is fine. What should
> the agent do with "how is research_agent doing?"
> - A) Refuse the whole question until health is back
> - B) Answer from the registry; say health is unavailable ✅
> - C) Answer from the registry, leaving health out silently
> - D) Estimate the health figures from earlier runs
>
> *Explanation: graceful degradation means keeping the core function going,
> and saying what's missing. Silence makes a partial answer look complete.*

> **Q2.** What is the specific risk in giving a model partial tool results?
> - A) It will refuse to answer the question at all
> - B) It may fill the missing part with an invented value ✅
> - C) It will keep calling the failed tool forever
> - D) It will ignore the results it did get back
>
> *Explanation: models can state values a failed tool never returned,
> especially when the failure isn't marked. Marking the error and checking
> for invented figures guard against it.*

> **Q3.** The agent has a cached health reading from an hour ago. How should
> it use it?
> - A) Not at all, since any stale value is useless
> - B) Show it as the current value, without comment
> - C) Show it, labelled as last known, with its time ✅
> - D) Average it with a guess at the current value
>
> *Explanation: stale data with its time lets the reader judge it. Without
> the time, it's a wrong answer that was right once.*

> **Q4.** Why assemble a status summary in code when some parts may be
> missing?
> - A) Because models can't write summaries at all
> - B) Code can't invent a value for a missing part ✅
> - C) Because code is always faster than a model
> - D) Because partial answers must always be short
>
> *Explanation: when the answer has a fixed shape, code removes the chance of
> filling a gap. For free-form answers, the checks from Lessons 3, 4 and 7 do
> the same job.*

---

*(End of this concept. The next concept is about not calling a failing
dependency at all for a while: the circuit breaker.)*
