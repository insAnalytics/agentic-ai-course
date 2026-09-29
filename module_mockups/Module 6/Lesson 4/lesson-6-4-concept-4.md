# Module 6, Lesson 4 — Concept 4: Figures traced to tool results, in code

---

## Some claims can be checked without a model

The support check in this lesson's first concept needs a model, because
whether a paragraph supports a sentence is a question about meaning. Many
of the claims an agent makes after calling tools aren't like that. "The
error rate is 2.3%", "it runs on `claude-legacy`", "the switch-off is
2026-10-31": each figure, id and date either appears in something a tool
returned, or it doesn't. Code can check that exactly, for free, every time,
which is why
[Lesson 3 put code checks first](→ this module, checks in the loop lesson, where a check can sit in the loop concept).

The failure this catches is real. In
[Sethi et al.'s preprint](→ this module, checks in the loop lesson, checking a tool result before the model reads it concept),
models given a tool result that couldn't answer the question sometimes
stated a value anyway, one they didn't have. The same thing happens without
any tool failure: a model reports 940 when the tool said 840, or adds a
detail no tool returned.

---

## What an answer says, and what the tools said

Here's the end of a run in which the agent called two tools and then
answered. The model's turns are scripted:

```python
FACT_ID = re.compile(r"\b(?:REG|MON|INC)-\d+\b|\b[a-z]+_agent\b|\bclaude-[a-z]+\b|\b\d{4}-\d{2}-\d{2}\b")
NUMBER = re.compile(r"(?<![\w.])\d[\d,]*(?:\.\d+)?%?")


def tool_results_in(messages: list) -> list[str]:
    """The text of every successful tool result in a conversation; error results don't count as evidence."""
    return [block["content"] for message in messages if message["role"] == "user" and isinstance(message["content"], list)
            for block in message["content"] if block["type"] == "tool_result" and not block.get("is_error")]


# a finished run of Module 2's loop, as the conversation it leaves behind (the model's turns are scripted)
conversation = [
    {"role": "user", "content": "How is research_agent doing, and what does it need to do before the switch-off?"},
    {"role": "assistant", "content": [
        {"type": "tool_use", "id": "t1", "name": "get_health", "input": {"agent_name": "research_agent"}},
        {"type": "tool_use", "id": "t2", "name": "get_agent", "input": {"agent_name": "research_agent"}}]},
    {"role": "user", "content": [
        {"type": "tool_result", "tool_use_id": "t1",
         "content": '{"agent_name": "research_agent", "error_rate": 0.023, "p95_ms": 840, "sessions": 1212}'},
        {"type": "tool_result", "tool_use_id": "t2",
         "content": '{"agent_name": "research_agent", "model": "claude-legacy", "switch_off": "2026-10-31"}'}]},
    {"role": "assistant", "content": [{"type": "text", "text": (
        "research_agent is healthy: a 2.3% error rate and a p95 of 940 ms across 1,212 sessions. It still runs on "
        "claude-legacy, so it needs to move to claude-sonnet before 2026-10-31.")}]},
]
answer = conversation[-1]["content"][0]["text"]
print("ids in the answer:    ", FACT_ID.findall(answer))
print("numbers in the answer:", NUMBER.findall(FACT_ID.sub(" ", answer)))
print()
for result in tool_results_in(conversation):
    print("tool result:", result)
```
```
ids in the answer:     ['research_agent', 'claude-legacy', 'claude-sonnet', '2026-10-31']
numbers in the answer: ['2.3%', '940', '1,212']

tool result: {"agent_name": "research_agent", "error_rate": 0.023, "p95_ms": 840, "sessions": 1212}
tool result: {"agent_name": "research_agent", "model": "claude-legacy", "switch_off": "2026-10-31"}
```
*(runs live, shows output — read-only demo snippet, not graded. The
conversation is scripted to contain two ungrounded facts.)*

Two regular expressions pull out what can be traced: ids of the kinds this
registry uses, such as error codes, agent and model names and dates, and
numbers, with percent signs kept. Ids come out first, and are removed before
looking for numbers, so that `REG-1010` doesn't also count as the number
1010, and a date isn't read as three numbers.

`tool_results_in` collects the evidence, and leaves out results marked
`is_error`. An error message's text is not evidence for an answer, even
when it contains numbers.

Compare the two lists by eye, and two facts have no source:

- **940:** the tool said a p95 of 840 ms.
- **`claude-sonnet`:** neither tool mentioned it.

The second is worth a closer look. `research_agent` really is due to move to
`claude-sonnet`: the migration runbook says so. But nothing this agent
looked up in this run says so. An ungrounded fact isn't necessarily wrong.
It's a fact the agent can't show where it got. The fix is the same either
way: look it up with a tool, so the answer can point at the result, or flag
it.

---

## Matching values, not strings

Matching an answer's facts against tool results by exact text misses the
ordinary ways a model restates a number. `0.023` becomes `2.3%`; `1212`
becomes `1,212`. So numbers are compared by value, with commas removed and a
percentage allowed to match its fraction. Ids stay exact: `claude-sonnet` is
not `claude-legacy`, however close the strings are.

Two things still cause false flags, and a real check has to live with them:

- **Derived numbers.** "Together they handled 2,400 sessions" may be the
  correct sum of two results, but 2,400 appears in neither. One answer is to
  have the agent compute with a tool, so the sum is itself a tool result;
  another is to accept flags on figures like these and let a person look.
- **Numbers that aren't facts.** "Two things to check" or a step number "3"
  get flagged too. Restricting the check to numbers next to a unit, or to
  answers that report measurements, cuts these.

In the loop, this runs where
[Lesson 3's answer check](→ this module, checks in the loop lesson, where a check can sit in the loop concept, the "the loop, with a check at each point" section)
sits, with one difference: it needs the conversation, not just the answer,
because the evidence is in the tool results.

---

## Applied sandbox exercise
*(graded — the facts in an answer that no tool result contains)*

**Task shown to learner:** Write `ungrounded(answer, tool_results)`. It
returns the ids and numbers in `answer` that no string in `tool_results`
contains, written as they appear in the answer, each once. List the missing
ids first, then the missing numbers, each in the order they first appear.

- **Ids** are what `FACT_ID` matches. An id counts as found if the same id
  appears in a tool result.
- **Numbers** are what `NUMBER` matches, after the ids are taken out of the
  text, in the answer and in the tool results alike. A number counts as found
  if a tool result has a number of the same value; a number ending in `%`
  also counts as found if a tool result has it as a fraction, so `2.3%`
  matches `0.023`.

**Starter code:**
```python
import math
import re

FACT_ID = re.compile(r"\b(?:REG|MON|INC)-\d+\b|\b[a-z]+_agent\b|\bclaude-[a-z]+\b|\b\d{4}-\d{2}-\d{2}\b")
NUMBER = re.compile(r"(?<![\w.])\d[\d,]*(?:\.\d+)?%?")


def number_value(text: str) -> float:
    return float(text.rstrip("%").replace(",", ""))


def ungrounded(answer: str, tool_results: list[str]) -> list[str]:
    """The ids and numbers in an answer that no tool result contains, as written, in order, once each.
    A percentage also matches its fraction: 2.3% matches 0.023."""
    ...


results = ['{"agent_name": "research_agent", "error_rate": 0.023, "p95_ms": 840, "sessions": 1212}',
           '{"agent_name": "research_agent", "model": "claude-legacy", "switch_off": "2026-10-31"}']
print(ungrounded("research_agent is healthy: a 2.3% error rate and a p95 of 940 ms across 1,212 sessions. "
                 "It needs to move to claude-sonnet before 2026-10-31.", results))
```

**Hidden tests:**
```python
results = [
    '{"agent_name": "research_agent", "error_rate": 0.023, "p95_ms": 840, "sessions": 1212}',
    '{"agent_name": "research_agent", "model": "claude-legacy", "switch_off": "2026-10-31", "last_error": "REG-1010"}',
]


def check(answer):
    try:
        return ungrounded(answer, results)
    except Exception as error:
        raise AssertionError(f"ungrounded raised {type(error).__name__} on {answer!r}") from None


assert check("research_agent's error rate is 0.023 over 1212 sessions.") == [], "every figure is in a result"
assert check("The switch-off is 2026-10-31.") == [], (
    "a date is an id: don't break 2026-10-31 into the numbers 2026, 10 and 31")
assert check("research_agent's error rate is 2.3% over 1,212 sessions.") == [], (
    "2.3% is the fraction 0.023, and 1,212 is 1212: compare numbers by value, and a percentage by its fraction too")
assert check("Its p95 is 940 ms.") == ["940"], "940 appears in no result; 840 does"
assert check("It moves to claude-sonnet by 2026-10-31.") == ["claude-sonnet"], (
    "claude-sonnet appears in no result; ids are matched exactly, not as numbers")
assert check("It last failed with REG-1010, not REG-1007.") == ["REG-1007"], (
    "REG-1007 is an id no result contains. Take ids out before looking for numbers, or 1007 and 1010 turn into numbers")
assert check("notes_agent and notes_agent again, with 5 and 5.") == ["notes_agent", "5"], (
    "report each missing fact once, in the order it first appears: ids, then numbers")
assert check("There were 1010 failed calls.") == ["1010"], (
    "1010 appears in the results only inside the id REG-1010, which isn't the number 1010: take ids out of the "
    "tool results too before collecting their numbers")
assert ungrounded("A 1.1% error rate.", ['{"error_rate": 0.011}']) == [], (
    "1.1% is 0.011, but 1.1 / 100 is 0.011000000000000001 in floating point: compare with math.isclose, not ==")
assert check("Error rate 23%.") == ["23%"], "23% is 0.23, which no result contains; keep the fact as written, with its %"
assert check("") == [], "an empty answer has nothing ungrounded"
assert ungrounded("Error rate 0.023.", []) == ["0.023"], "with no tool results, every figure is ungrounded"
```

**Hint (shown on request):** Join the tool results into one string, and
collect its ids into a set and its numbers, as values, into a list. Use
`FACT_ID.sub(" ", text)` to take the ids out before running `NUMBER`, in both
the answer and the results. Compare numbers with `math.isclose`, since
dividing by 100 can land a hair off: `1.1 / 100` is `0.011000000000000001`,
not `0.011`. `dict.fromkeys` removes
duplicates from a list while keeping its order.

**Reference solution:**
```python
import math
import re

FACT_ID = re.compile(r"\b(?:REG|MON|INC)-\d+\b|\b[a-z]+_agent\b|\bclaude-[a-z]+\b|\b\d{4}-\d{2}-\d{2}\b")
NUMBER = re.compile(r"(?<![\w.])\d[\d,]*(?:\.\d+)?%?")


def number_value(text: str) -> float:
    return float(text.rstrip("%").replace(",", ""))


def ungrounded(answer: str, tool_results: list[str]) -> list[str]:
    """The ids and numbers in an answer that no tool result contains, as written, in order, once each.
    A percentage also matches its fraction: 2.3% matches 0.023."""
    source = " ".join(tool_results)
    known_ids = set(FACT_ID.findall(source))
    known_numbers = [number_value(n) for n in NUMBER.findall(FACT_ID.sub(" ", source))]

    def found(number: str) -> bool:
        value = number_value(number)
        wanted = [value, value / 100] if number.endswith("%") else [value]
        return any(math.isclose(w, k) for w in wanted for k in known_numbers)

    missing = [fact for fact in FACT_ID.findall(answer) if fact not in known_ids]
    missing += [n for n in NUMBER.findall(FACT_ID.sub(" ", answer)) if not found(n)]
    return list(dict.fromkeys(missing))
```
```
['claude-sonnet', '940']
```
*(the starter's printout, with the reference in place)*

**Explanation:** Taking ids out before looking for numbers matters on both
sides. In the answer, it keeps `REG-1007` from also being reported as the
number 1007, and keeps a date whole. In the tool results, it stops
`REG-1010` from grounding a claim about 1010 of something. Comparing values
catches the model's usual restatements, and `math.isclose` is needed because
the division that turns a percentage into a fraction doesn't always give
exactly the float the tool wrote: `1.1 / 100 == 0.011` is `False`. The check is cheap and certain about what it checks, and blind to
everything else: a wrong claim with no figure or id in it passes, which is
why it complements the support check rather than replacing it.

---

## Quiz cards

> **Q1.** Why check an answer's figures against tool results in code
> instead of asking a model?
> - A) Because models can't read tool results written as JSON
> - B) Because whether a value appears is exact, so code decides it ✅
> - C) Because tool results are always correct in the first place
> - D) Because models refuse to check numbers when asked to
>
> *Explanation: whether 940 appears in a tool result has a definite answer
> that code finds without a model call and without error. Model checks are
> for questions code can't settle, such as whether a paragraph supports a
> sentence.*

> **Q2.** The answer says `claude-sonnet`, which is the right migration
> target, but no tool result mentions it. What does the check report?
> - A) Nothing, since the fact happens to be correct
> - B) Ungrounded: nothing the agent looked up says so ✅
> - C) A contradiction between the answer and a source
> - D) An error, since the model must have got it wrong
>
> *Explanation: grounding is about where a fact came from, not whether it
> happens to be true. A correct fact the agent can't point to is still one
> the reader can't verify from what the agent did; the fix is to look it up
> or flag it.*

> **Q3.** Why must ids be removed from the tool results before collecting
> their numbers?
> - A) Because ids never contain any digits at all
> - B) So `REG-1010` can't ground a claim about 1010 things ✅
> - C) Because the regular expression would crash otherwise
> - D) Because it makes the check run noticeably faster
>
> *Explanation: 1010 inside an error code isn't a count of anything. Left in,
> it would make an invented "1010 failed calls" look grounded.*

> **Q4.** "Together they handled 2,400 sessions" is the correct sum of two
> tool results, but it's flagged. What's a sound fix?
> - A) Remove the grounding check from the loop entirely
> - B) Have a tool compute the sum, so it's a tool result ✅
> - C) Round every number to the nearest hundred first
> - D) Ignore every number in an answer over 1,000
>
> *Explanation: a derived number appears in no result, so the check can't see
> it. Computing it through a tool makes it evidence like any other; the
> alternative is to accept those flags and have a person look.*

---

*(End of this concept. The next concept is about questions built on a false
premise, where the right answer is to reject the question.)*
