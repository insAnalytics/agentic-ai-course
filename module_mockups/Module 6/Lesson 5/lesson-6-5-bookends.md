# Module 6, Lesson 5 — Bookends: Self-consistency and voting

---

## Intro

> **You'll be able to**
> - Vote on several sampled answers, deciding first what counts as the same answer, and say when voting makes answers more reliable and when it locks in a wrong one
> - Use how much the samples agree as a signal for when to accept an answer and when to escalate, and measure what a threshold catches and costs
> - Compare voting with a longer thinking budget or a stronger model at a stated budget, with a paired test, and know what to do when answers are free text

**Why it matters**
Asking again is the cheapest reliability technique there is: no new model,
no new data, just more samples of the answer you already have. It's also
easy to misuse. Voting can hide a consistent mistake behind unanimous
agreement, and at the same token budget, other ways of spending can do
better or worse depending on the task. This lesson measures both sides on
real runs.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all five concepts, mixed order)*

> **Q1.** Twenty replies say "2", "2 hours", "two hours" and "3". Before
> counting votes, what has to be decided?
> - A) Which of the replies came first
> - B) What counts as the same answer ✅
> - C) How long each of the replies is
> - D) Which model wrote each of the replies
>
> *Explanation: votes are only meaningful once equivalent answers are
> grouped. Here, numbers by value: "2" and "2 hours" are one answer, and "two
> hours" can't be read as a number at all.*

> **Q2.** A question is answered right by 5 of 20 samples, and the other 15
> all give the same wrong value. What does a vote of 9 do?
> - A) Raises accuracy, since voting always helps
> - B) Picks the wrong value almost every time ✅
> - C) Leaves accuracy at 25%
> - D) Escalates the question automatically
>
> *Explanation: a vote returns the most common answer. When that's a wrong
> one, voting makes it the answer nearly every run, as it did on two of the
> 2B's questions.*

> **Q3.** In the 2B's votes of five, every unanimous wrong vote came from two
> questions. Why can't an agreement threshold catch them?
> - A) Because the threshold was too high
> - B) Because a model sure of a wrong answer agrees with itself ✅
> - C) Because unanimous votes are never checked
> - D) Because there were too few votes
>
> *Explanation: agreement measures consistency, not correctness. Only a
> check from outside the model, such as a source, can catch a consistent
> mistake.*

> **Q4.** A thinking budget of 253 generated about 416 tokens. What's the
> fair voting comparison?
> - A) A vote of 3, since the budget is 3 times the plain length
> - B) A vote of 5, which generated about 423 tokens ✅
> - C) A vote of 9, the largest vote the runs allow
> - D) No vote, since thinking and voting can't be compared
>
> *Explanation: compare by the tokens each option actually used. The budget
> caps only the thinking; the answer after it costs tokens too.*

> **Q5.** Why did a thinking budget of 84 score worse than no thinking at
> all?
> - A) Every reply was cut off and forced to answer ✅
> - B) Thinking always hurts models as small as this
> - C) The thinking run used different questions
> - D) The thinking replies were graded more strictly
>
> *Explanation: at that budget the thinking never finished. Answering from
> unfinished reasoning scored 85.5%, against 92.9% for answering straight
> away on the same questions.*

> **Q6.** Four of five free-text drafts share the same factual mistake. What
> would universal self-consistency pick?
> - A) The one correct draft
> - B) A draft containing the shared mistake ✅
> - C) A new, corrected draft
> - D) Nothing, since free text can't be compared
>
> *Explanation: USC picks the candidate most consistent with the others. It
> can't write a better answer, and consensus favours what most drafts agree
> on, right or wrong.*

> **Q7.** A vote of 5 with a 2B model and one answer from a 9B model score
> about the same on these questions. Which is cheaper?
> - A) The vote, since the 2B is the smaller model
> - B) The 9B, since it generates fewer tokens
> - C) It depends on the unit the cost is counted in ✅
> - D) They cost the same, since accuracy is the same
>
> *Explanation: the 9B uses fewer tokens, but each takes more compute. Lesson
> 2's rule applies: state the unit before calling one option cheaper.*

---

## Comprehensive sandbox
*(graded — a vote-or-escalate step, measured on real runs, multi-file)*

**Task shown to learner:** `lib.py` holds the lesson's data loaders, the
grading functions, and `majority_answer` from the first concept, read-only.

In `policy.py` (the entry file), write two functions:

- **`decide(replies, answer_type, min_agreement)`** votes on the replies with
  `majority_answer` and returns `{"answer", "agreement", "escalate"}`:
  the winning answer, how many replies gave it, and whether to escalate,
  which is when the agreement is below `min_agreement`.
- **`evaluate(records, questions, k, min_agreement)`** runs `decide` on each
  question's samples in consecutive groups of `k` (samples 1 to k, then k+1 to
  2k, and so on, dropping any leftover), and returns:
  - `"decisions"`: how many groups were decided
  - `"escalated"`: the fraction escalated
  - `"accepted_accuracy"`: the fraction of accepted answers that are right,
    graded with `is_correct(question, "ANSWER: " + answer)`, or `None` if
    nothing was accepted
  - `"tokens_per_decision"`: the average tokens of a group's samples, since
    every decision costs its samples whether escalated or not

When you click Run, the code at the bottom evaluates votes of 5 on both
models' committed runs at several thresholds.

**Tab: `lib.py`** (read-only)
```python
"""This lesson's data, grading and voting code, for the sandbox. Read-only."""
import json
import re
from collections import Counter
from pathlib import Path

DATA = Path("/data/reliability")


def load_run(name: str) -> dict:
    """One committed run file, such as "plain" (Qwen3.5-4B) or "plain.smaller" (Qwen3.5-2B)."""
    return json.loads((DATA / "runs" / f"{name}.json").read_text(encoding="utf-8"))


def load_set(name: str) -> dict:
    """One of the built sets, such as "set-e"."""
    return json.loads((DATA / f"{name}.json").read_text(encoding="utf-8"))


# how set E replies were graded: the same code as scripts/reliability/grading.py
MARKER = "ANSWER:"
NUMBER = re.compile(r"-?\d[\d,]*(?:\.\d+)?")


def extract_answer(reply: str) -> str | None:
    """The text after the last ANSWER: marker, or None if there isn't one."""
    head, marker, tail = reply.rpartition(MARKER)
    if not marker:
        return None
    return tail.strip().splitlines()[0].strip() if tail.strip() else ""


def normalize(text: str) -> str:
    text = text.strip().strip("*_`\"'").strip().rstrip(".").strip().strip("*_`\"'")
    return " ".join(text.lower().split())


def as_number(text: str) -> float | None:
    match = NUMBER.search(text)
    return float(match.group().replace(",", "")) if match else None


def is_correct(question: dict, reply: str) -> bool:
    answer = extract_answer(reply)
    if answer is None:
        return False
    if question["type"] == "number":
        value = as_number(answer)
        return value is not None and abs(value - question["answer"]) < 1e-9
    accepted = {normalize(str(question["answer"])), *(normalize(a) for a in question["accept"])}
    return normalize(answer) in accepted


def majority_answer(replies: list[str], answer_type: str) -> dict:
    """The most common answer across replies to one question. Numbers are compared by value, text
    after normalize(); replies with no usable answer don't vote; ties go to the answer seen first."""
    counts, first_written = Counter(), {}
    for reply in replies:
        answer = extract_answer(reply)
        if answer is None:
            continue
        key = as_number(answer) if answer_type == "number" else normalize(answer)
        if key is None or key == "":
            continue
        counts[key] += 1
        first_written.setdefault(key, answer)
    if not counts:
        return {"answer": None, "votes": 0, "counted": 0}
    winner, votes = counts.most_common(1)[0]
    return {"answer": first_written[winner], "votes": votes, "counted": sum(counts.values())}
```

**Tab: `policy.py`** (starter, entry file)
```python
from lib import is_correct, load_run, load_set, majority_answer


def decide(replies: list[str], answer_type: str, min_agreement: int) -> dict:
    """Vote on the replies, and escalate unless at least min_agreement of them give the winning answer."""
    ...


def evaluate(records: list[dict], questions: dict, k: int, min_agreement: int) -> dict:
    """Run decide on each question's samples in consecutive groups of k, and report how it went."""
    ...


if __name__ == "__main__":
    questions = {q["id"]: q for q in load_set("set-e")["questions"]}
    for label, run_name in [("Qwen3.5-2B", "plain.smaller"), ("Qwen3.5-4B", "plain")]:
        records = load_run(run_name)["results"]
        for min_agreement in (1, 3, 4, 5):
            r = evaluate(records, questions, 5, min_agreement)
            print(f"{label}, votes of 5, accept at {min_agreement}+ agreeing: escalate {r['escalated']:5.1%}, "
                  f"accepted right {r['accepted_accuracy']:6.1%}, {r['tokens_per_decision']:.0f} tokens per decision")
```

**Hidden tests:**
```python
import math

from policy import decide, evaluate


def reply(answer: str) -> str:
    return f"Reasoning.\nANSWER: {answer}"


d = decide([reply("20"), reply("20.0"), reply("21")], "number", 2)
assert isinstance(d, dict) and set(d) == {"answer", "agreement", "escalate"}, "decide returns answer, agreement and escalate"
assert d == {"answer": "20", "agreement": 2, "escalate": False}, (
    f"got {d}: 20 and 20.0 are one answer with 2 votes, which meets min_agreement 2, so it's accepted. "
    "Use majority_answer from lib.py")
assert decide([reply("20"), reply("21"), reply("22")], "number", 2)["escalate"] is True, (
    "1 vote is below min_agreement 2: escalate")
assert decide(["no answer", "none here"], "text", 1) == {"answer": None, "agreement": 0, "escalate": True}, (
    "no usable answers: 0 agreement, which is below any min_agreement of 1 or more, so escalate")

questions = {"q1": {"type": "number", "answer": 7, "accept": []}, "q2": {"type": "text", "answer": "priority", "accept": []}}


def sample(answer, tokens=10):
    return {"text": reply(answer), "tokens": tokens}


records = [
    {"id": "q1", "samples": [sample("7"), sample("7"), sample("7"), sample("8"), sample("8"), sample("8"), sample("9")]},
    {"id": "q2", "samples": [sample("priority", 20), sample("standard", 20), sample("`Priority`", 20)]},
]
r = evaluate(records, questions, 3, 3)
assert isinstance(r, dict) and set(r) == {"decisions", "escalated", "accepted_accuracy", "tokens_per_decision"}, (
    "evaluate returns decisions, escalated, accepted_accuracy and tokens_per_decision")
assert r["decisions"] == 3, (
    f"decisions {r['decisions']}: q1's 7 samples make 2 groups of 3 (the leftover sample is dropped), q2's 3 make 1")
assert math.isclose(r["escalated"], 1 / 3), (
    f"escalated {r['escalated']}: q2's group agrees only 2 of 3, below min_agreement 3; the other two are unanimous")
assert math.isclose(r["accepted_accuracy"], 0.5), (
    f"accepted_accuracy {r['accepted_accuracy']}: of the 2 accepted decisions, 7 is right and 8 is wrong. Grade with "
    "is_correct(question, 'ANSWER: ' + answer), and count only accepted decisions")
assert math.isclose(r["tokens_per_decision"], (30 + 30 + 60) / 3), (
    f"tokens_per_decision {r['tokens_per_decision']}: every decision's k samples cost tokens, escalated or not")

r = evaluate(records, questions, 3, 2)
assert r["escalated"] == 0 and math.isclose(r["accepted_accuracy"], 2 / 3), (
    f"with min_agreement 2 nothing is escalated and q2's 'priority' (2 votes, 'Priority' normalizes to it) is right; got {r}")

r = evaluate(records, questions, 3, 4)
assert r["escalated"] == 1 and r["accepted_accuracy"] is None, (
    f"min_agreement 4 is more than 3 samples can give: everything is escalated, and accuracy can't be measured; got {r}")
assert evaluate([], questions, 3, 2)["decisions"] == 0, "no records: no decisions"
```

**Hint (shown on request):** `decide` is three lines around
`majority_answer`. In `evaluate`, `range(0, len(samples) - k + 1, k)` gives the
start of each full group. Count every decision and its tokens, then split
into escalated and accepted, and grade only the accepted ones.

**Reference solution:**

**Tab: `policy.py`**
```python
from lib import is_correct, load_run, load_set, majority_answer


def decide(replies: list[str], answer_type: str, min_agreement: int) -> dict:
    """Vote on the replies, and escalate unless at least min_agreement of them give the winning answer."""
    vote = majority_answer(replies, answer_type)
    return {"answer": vote["answer"], "agreement": vote["votes"], "escalate": vote["votes"] < min_agreement}


def evaluate(records: list[dict], questions: dict, k: int, min_agreement: int) -> dict:
    """Run decide on each question's samples in consecutive groups of k, and report how it went."""
    decisions = escalated = accepted = correct = tokens = 0
    for record in records:
        question, samples = questions[record["id"]], record["samples"]
        for start in range(0, len(samples) - k + 1, k):
            group = samples[start:start + k]
            decision = decide([s["text"] for s in group], question["type"], min_agreement)
            decisions += 1
            tokens += sum(s["tokens"] for s in group)
            if decision["escalate"]:
                escalated += 1
            else:
                accepted += 1
                correct += is_correct(question, f"ANSWER: {decision['answer']}")
    return {
        "decisions": decisions,
        "escalated": escalated / decisions if decisions else None,
        "accepted_accuracy": correct / accepted if accepted else None,
        "tokens_per_decision": tokens / decisions if decisions else None,
    }


if __name__ == "__main__":
    questions = {q["id"]: q for q in load_set("set-e")["questions"]}
    for label, run_name in [("Qwen3.5-2B", "plain.smaller"), ("Qwen3.5-4B", "plain")]:
        records = load_run(run_name)["results"]
        for min_agreement in (1, 3, 4, 5):
            r = evaluate(records, questions, 5, min_agreement)
            print(f"{label}, votes of 5, accept at {min_agreement}+ agreeing: escalate {r['escalated']:5.1%}, "
                  f"accepted right {r['accepted_accuracy']:6.1%}, {r['tokens_per_decision']:.0f} tokens per decision")
```
```
Qwen3.5-2B, votes of 5, accept at 1+ agreeing: escalate  0.0%, accepted right  97.6%, 422 tokens per decision
Qwen3.5-2B, votes of 5, accept at 3+ agreeing: escalate  1.8%, accepted right  97.9%, 422 tokens per decision
Qwen3.5-2B, votes of 5, accept at 4+ agreeing: escalate  7.4%, accepted right  98.7%, 422 tokens per decision
Qwen3.5-2B, votes of 5, accept at 5+ agreeing: escalate 21.7%, accepted right  99.6%, 422 tokens per decision
Qwen3.5-4B, votes of 5, accept at 1+ agreeing: escalate  0.0%, accepted right  99.7%, 532 tokens per decision
Qwen3.5-4B, votes of 5, accept at 3+ agreeing: escalate  0.0%, accepted right  99.7%, 532 tokens per decision
Qwen3.5-4B, votes of 5, accept at 4+ agreeing: escalate  1.2%, accepted right 100.0%, 532 tokens per decision
Qwen3.5-4B, votes of 5, accept at 5+ agreeing: escalate  5.4%, accepted right 100.0%, 532 tokens per decision
```
*(the Run output, from the committed runs)*

**Explanation:** Using consecutive groups instead of random ones makes the
evaluation exactly repeatable, and each sample is used in one decision only,
so the decisions are as independent as the samples. Tokens are charged for
every decision, because the samples were generated whether or not the answer
was then escalated; the cost of the escalation itself comes on top.

The Run output is the lesson in one table. For the 2B, accepting only
unanimous votes escalates about a fifth of decisions and lifts the accuracy
of what's accepted from 97.6% to 99.6%. Even then, it isn't 100%: the
accepted wrong answers are the 2B's consistent mistakes, which no agreement
threshold can reach. For the 4B, which rarely disagrees with itself, the
same threshold escalates 5.4% and leaves nothing wrong among what it
accepts, on these questions. Where to set the threshold is Lesson 2's
trade-off: what an escalation costs next, against what a wrong answer costs
if it gets through.
