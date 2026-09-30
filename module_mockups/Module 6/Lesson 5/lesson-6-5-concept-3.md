# Module 6, Lesson 5 — Concept 3: Agreement as a confidence signal

---

## Asking the model how sure it is doesn't work well

An agent that knew when it was likely wrong could stop, ask, or hand over
in exactly those cases, which is Lesson 6's subject. The obvious way to find
out is to ask the model how confident it is. Xiong et al.,
[*Can LLMs Express Their Uncertainty?*](https://arxiv.org/abs/2306.13063)
(ICLR 2024), tested that across five models, GPT-4 among them, and found
that models stating their confidence tend to be overconfident. Among the
things that helped was measuring consistency: sampling several answers and
checking how many agree. These are black-box methods, which need nothing but
the model's replies, and they came close to methods that read the model's
internal probabilities.

A vote already produces this signal for free. If five samples all give the
same answer, the vote is confident; if they split three to two, it isn't.

---

## Agreement on the real runs

Here's how often a vote of five is right, grouped by how many of the five
agreed with the winning answer:

```python
import random

questions = {q["id"]: q for q in load_set("set-e")["questions"]}


def answer_key(question: dict, answer: str | None):
    """As in the previous concepts: the value for a number, the normalized text otherwise."""
    if answer is None:
        return None
    return as_number(answer) if question["type"] == "number" else normalize(answer) or None


def vote(question: dict, samples: list[dict]) -> tuple[int, bool]:
    """How many of the samples agree with the winning answer, and whether that answer is right."""
    keys = [answer_key(question, s["answer"]) for s in samples]
    counts = Counter(key for key in keys if key is not None)
    if not counts:
        return 0, False
    winner, votes = counts.most_common(1)[0]
    return votes, next(s["correct"] for s, key in zip(samples, keys) if key == winner)


def votes_of(run_name: str, k: int = 5, draws: int = 100) -> list[tuple[str, int, bool]]:
    """(question, agreement, correct) for many random votes of k samples per question."""
    rng = random.Random(0)
    return [(record["id"], *vote(questions[record["id"]], rng.sample(record["samples"], k)))
            for record in load_run(run_name)["results"] for _ in range(draws)]


for label, run_name in [("Qwen3.5-2B", "plain.smaller"), ("Qwen3.5-4B", "plain")]:
    results = votes_of(run_name)
    print(f"{label}, votes of 5:")
    for agreement in (5, 4, 3, 2):
        rows = [correct for _, votes, correct in results if votes == agreement]
        if rows:
            print(f"  {agreement} of 5 agree: {len(rows) / len(results):6.1%} of votes, right {sum(rows) / len(rows):6.1%}")
```
```
Qwen3.5-2B, votes of 5:
  5 of 5 agree:  78.4% of votes, right  99.6%
  4 of 5 agree:  14.1% of votes, right  93.5%
  3 of 5 agree:   5.9% of votes, right  83.0%
  2 of 5 agree:   1.6% of votes, right  50.7%
Qwen3.5-4B, votes of 5:
  5 of 5 agree:  94.7% of votes, right 100.0%
  4 of 5 agree:   4.0% of votes, right  99.1%
  3 of 5 agree:   1.3% of votes, right  79.4%
```
*(runs live, shows output — read-only demo snippet, not graded. 100
random votes of 5 per question, from each model's 20 committed samples.)*

For both models, the more samples agree, the more often the vote is right.
For the 2B, a unanimous vote was right 99.6% of the time, a 3-to-2 split
83.0%, and a 2-2-1 split only about half the time. That makes agreement a
usable threshold: accepting only unanimous votes from the 2B would have
accepted 78.4% of them at 99.6% accuracy, and sent the other 21.6% on for
more checking.

---

## Where the signal fails

The unanimous votes that were wrong are worth finding:

```python
results = votes_of("plain.smaller")
confident_and_wrong = Counter(question_id for question_id, votes, correct in results if votes == 5 and not correct)
print("unanimous but wrong, by question:", dict(confident_and_wrong))
```
```
unanimous but wrong, by question: {'e21': 18, 'e68': 11}
```
*(runs live, shows output — read-only demo snippet, not graded.)*

They're all from the two questions in
[the previous concept](→ this lesson, when voting helps and when it hurts concept)
where the 2B has one favourite wrong answer. Agreement measures how
consistent the model is, not whether it's right, and on these questions the
model is consistently wrong. No threshold on agreement can catch them,
because they look exactly like the questions the model reliably gets right.

That's the limit to keep in mind. Agreement catches a model that's unsure:
answers that scatter because the model is guessing. It can't catch a model
that's sure and wrong, and those need a check from outside the model, such
as the source checks in
[Lesson 4](→ this module, verifying an answer against its sources lesson, checking each claim against the source it cites concept).

---

## Choosing a threshold

A threshold on agreement is a check like any other, with Lesson 2's two
numbers: how many wrong answers it catches, and how many right answers it
sends on needlessly. Sending on means more cost later: another vote, a
stronger model, or a person. The exercise computes both, so a threshold can
be chosen on measured numbers.

---

## Applied sandbox exercise
*(graded — what an agreement threshold catches, and what it costs)*

**Task shown to learner:** Write `trade_off(votes, min_agreement)`. Each
vote is `(agreement, correct)`: how many samples agreed with the winning
answer, and whether it was right. Votes with at least `min_agreement` are
accepted; the rest are escalated. Return:

- `"accepted"`: the fraction of all votes accepted
- `"accepted_accuracy"`: the fraction of accepted votes that are right
- `"wrong_caught"`: the fraction of wrong votes that are escalated
- `"right_escalated"`: the fraction of right votes that are escalated

Any value whose denominator is zero is `None`.

**Starter code:**
```python
def trade_off(votes: list[tuple[int, bool]], min_agreement: int) -> dict:
    """What accepting only votes with at least min_agreement agreeing samples would do.
    Each vote is (agreement, correct); the rest would be escalated."""
    ...


# (agreement, correct) for twelve made-up votes of 5, to try your code on
votes = [(5, True)] * 7 + [(5, False), (4, True), (4, False), (3, True), (2, False)]
for threshold in (3, 4, 5):
    print(threshold, trade_off(votes, threshold))
```

**Hidden tests:**
```python
import math


def close(a, b):
    return a is not None and math.isclose(a, b)


votes = [(5, True)] * 6 + [(5, False)] + [(4, True)] * 2 + [(3, False)] * 2 + [(3, True)] * 2 + [(2, False)]
r = trade_off(votes, 4)
assert isinstance(r, dict) and set(r) == {"accepted", "accepted_accuracy", "wrong_caught", "right_escalated"}, (
    "return accepted, accepted_accuracy, wrong_caught and right_escalated")
assert close(r["accepted"], 9 / 14), f"accepted {r['accepted']}: 9 of the 14 votes have 4 or more agreeing"
assert close(r["accepted_accuracy"], 8 / 9), f"accepted_accuracy {r['accepted_accuracy']}: 8 of the 9 accepted votes are right"
assert close(r["wrong_caught"], 3 / 4), (
    f"wrong_caught {r['wrong_caught']}: of the 4 wrong votes, 3 are escalated; out of the wrong votes, not all 14")
assert close(r["right_escalated"], 2 / 10), (
    f"right_escalated {r['right_escalated']}: of the 10 right votes, 2 are escalated; out of the right votes")

r = trade_off(votes, 5)
assert close(r["accepted"], 7 / 14) and close(r["wrong_caught"], 3 / 4) and close(r["right_escalated"], 4 / 10), (
    f"min_agreement 5 accepts only unanimous votes; got {r}. Accept when agreement >= min_agreement")

assert trade_off(votes, 6)["accepted_accuracy"] is None, "nothing accepted: accepted_accuracy is None, not 0"
all_right = trade_off([(5, True), (3, True)], 4)
assert all_right["wrong_caught"] is None, "no wrong votes: wrong_caught can't be measured, so None"
assert close(all_right["right_escalated"], 0.5), "1 of the 2 right votes is escalated"
assert trade_off([], 3) == {"accepted": None, "accepted_accuracy": None, "wrong_caught": None, "right_escalated": None}, (
    "no votes: every value is None")
```

**Hint (shown on request):** Split the votes into accepted and escalated
first. Each rate has its own denominator: all votes, accepted votes, wrong
votes, right votes. The last two are the ones most easily confused with the
number escalated.

**Reference solution:**
```python
def trade_off(votes: list[tuple[int, bool]], min_agreement: int) -> dict:
    """What accepting only votes with at least min_agreement agreeing samples would do.
    Each vote is (agreement, correct); the rest would be escalated."""
    accepted = [correct for agreement, correct in votes if agreement >= min_agreement]
    escalated = [correct for agreement, correct in votes if agreement < min_agreement]
    wrong = sum(not correct for _, correct in votes)
    right = len(votes) - wrong
    return {
        "accepted": len(accepted) / len(votes) if votes else None,
        "accepted_accuracy": sum(accepted) / len(accepted) if accepted else None,
        "wrong_caught": escalated.count(False) / wrong if wrong else None,
        "right_escalated": escalated.count(True) / right if right else None,
    }
```
```
3 {'accepted': 0.9166666666666666, 'accepted_accuracy': 0.8181818181818182, 'wrong_caught': 0.3333333333333333, 'right_escalated': 0.0}
4 {'accepted': 0.8333333333333334, 'accepted_accuracy': 0.8, 'wrong_caught': 0.3333333333333333, 'right_escalated': 0.1111111111111111}
5 {'accepted': 0.6666666666666666, 'accepted_accuracy': 0.875, 'wrong_caught': 0.6666666666666666, 'right_escalated': 0.2222222222222222}
```
*(the starter's printout, with the reference in place)*

**Explanation:** `wrong_caught` and `right_escalated` are the two numbers
from Lesson 2's rule for any check: the share of the bad outcomes it
catches, and the share of good ones it blocks. Each is out of the votes where
that outcome was possible, so the numbers don't depend on how many right and
wrong votes the test set happens to hold. In the starter's example, raising
the threshold from 4 to 5 catches one more wrong vote, but escalates one
more right one; the made-up unanimous wrong vote is never caught at any
threshold, which is the previous section's point.

---

## Quiz cards

> **Q1.** What did Xiong et al. find about models stating their own
> confidence?
> - A) Stated confidence was well calibrated in every model tested
> - B) They tended to overstate it; agreement among samples helped ✅
> - C) The models refused to state any confidence at all
> - D) Only GPT-4 was able to state a confidence in its answer
>
> *Explanation: stated confidence tended to be too high. Measuring how
> consistent several sampled answers are was among the approaches that
> reduced the problem, using nothing but the model's replies.*

> **Q2.** In the 2B's votes of five, a unanimous vote was right 99.6% of the
> time and a 2-2-1 split about half the time. What does that make agreement?
> - A) A usable signal for when to trust a vote or escalate ✅
> - B) A guarantee that any unanimous vote is right
> - C) Useless, since some unanimous votes were wrong
> - D) A full replacement for checking against sources
>
> *Explanation: agreement separates likely-right votes from likely-wrong
> ones well enough to set a threshold on, which is what makes it useful. It's
> not a guarantee, as the unanimous wrong votes show.*

> **Q3.** Every unanimous wrong vote came from two questions. Why can't an
> agreement threshold catch them?
> - A) Because the threshold was set far too low
> - B) Consistently wrong looks just like consistently right ✅
> - C) Because each vote used too few samples
> - D) Because the grader was wrong about those questions
>
> *Explanation: agreement measures consistency, not correctness. A model
> sure of a wrong answer agrees with itself; only a check from outside the
> model, like a source, can tell.*

> **Q4.** Raising the agreement threshold escalates more votes. What do you
> need to know to choose it?
> - A) Only how many of the wrong votes it catches
> - B) Wrong votes caught, right ones escalated, and the cost ✅
> - C) Only the accuracy of the votes it accepts
> - D) Nothing, since a higher threshold is always safer
>
> *Explanation: every escalation costs something later, and escalating right
> answers is the check's false-block rate. A threshold is chosen by weighing
> both against what a wrong answer would cost.*

---

*(End of this concept. The next concept compares voting with the other
ways to spend the same budget: a longer thinking budget, and a stronger
model.)*
