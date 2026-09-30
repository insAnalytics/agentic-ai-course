# Module 6, Lesson 5 — Concept 2: When voting helps, and when it hurts

---

## The average hides two opposite effects

The previous concept showed voting lifting the 2B's accuracy from 92.9% to
97.5% with nine samples. That average, like the one in
[Lesson 1](→ this module, why agents fail lesson, the same question run twice concept),
is made of questions that behave very differently. Here's the same vote,
question by question, grouped by how often a single sample gets each one
right:

```python
import random

questions = {q["id"]: q for q in load_set("set-e")["questions"]}


def answer_key(question: dict, answer: str | None):
    """As in the previous concept: the value for a number, the normalized text otherwise."""
    if answer is None:
        return None
    return as_number(answer) if question["type"] == "number" else normalize(answer) or None


def vote_winner(question: dict, samples: list[dict]):
    """The winning answer's key, and whether it's correct; ties go to the answer seen first."""
    keys = [answer_key(question, s["answer"]) for s in samples]
    counts = Counter(key for key in keys if key is not None)
    if not counts:
        return None, False
    winner = counts.most_common(1)[0][0]
    return winner, next(s["correct"] for s, key in zip(samples, keys) if key == winner)


def per_question(run_name: str, k: int, draws: int = 200) -> dict:
    """For each question: one sample's accuracy, and a vote of k's accuracy over random choices of k samples."""
    rng = random.Random(0)
    result = {}
    for record in load_run(run_name)["results"]:
        question, samples = questions[record["id"]], record["samples"]
        single = sum(s["correct"] for s in samples) / len(samples)
        voted = sum(vote_winner(question, rng.sample(samples, k))[1] for _ in range(draws)) / draws
        result[record["id"]] = (single, voted)
    return result


small = per_question("plain.smaller", 9)
groups = [("always right", lambda p: p == 1), ("right 80-95% of the time", lambda p: 0.8 <= p < 1),
          ("right 50-79% of the time", lambda p: 0.5 <= p < 0.8), ("right under half the time", lambda p: p < 0.5)]
print("Qwen3.5-2B, one sample against a vote of 9:")
for label, test in groups:
    rows = [(single, voted) for single, voted in small.values() if test(single)]
    single = sum(r[0] for r in rows) / len(rows)
    voted = sum(r[1] for r in rows) / len(rows)
    print(f"  {label:<27} {len(rows):>2} questions: {single:6.1%} -> {voted:6.1%}")
```
```
Qwen3.5-2B, one sample against a vote of 9:
  always right                51 questions: 100.0% -> 100.0%
  right 80-95% of the time    24 questions:  91.0% -> 100.0%
  right 50-79% of the time     7 questions:  68.6% ->  98.4%
  right under half the time    2 questions:  20.0% ->   0.2%
```
*(runs live, shows output — read-only demo snippet, not graded. Real
Qwen3.5-2B samples; the votes are averaged over 200 random choices of 9 of
each question's 20 samples.)*

Voting fixes the questions the model usually gets right: the 31 that a
single sample gets right between half and 95% of the time end up right
almost every time. And it breaks the two questions the model usually gets
wrong: from 20% right to almost never.

That's not a quirk of these runs. Chen et al.,
[*Are More LLM Calls All You Need?*](https://arxiv.org/abs/2403.02419)
(NeurIPS 2024), found that across several language tasks, the accuracy of
majority voting can first rise and then fall as calls are added. Their
explanation is this split: more calls help on the easy questions and hurt on
the hard ones, and a task containing both can get worse overall. With only
two hard questions among 84, the 2B's overall accuracy still rises here; a
set with more hard questions could see it fall.

---

## Why: the most common answer wins

The textbook version of this is 18th-century mathematics, Condorcet's jury
theorem: if each of k independent voters is right with chance p, a majority
is right more often than one voter when p is above a half, and less often
when it's below. Here's that calculation:

```python
from math import comb


def majority_right(p: float, k: int) -> float:
    """Chance that more than half of k independent answers are right, if each is right with chance p (k odd)."""
    return sum(comb(k, j) * p**j * (1 - p) ** (k - j) for j in range(k // 2 + 1, k + 1))


print("  p    " + "".join(f"vote of {k:<3}" for k in (1, 3, 5, 9)))
for p in (0.2, 0.4, 0.6, 0.8, 0.95):
    print(f"{p:5.2f}  " + "".join(f"{majority_right(p, k):>9.1%}  " for k in (1, 3, 5, 9)))
```
```
  p    vote of 1  vote of 3  vote of 5  vote of 9  
 0.20      20.0%      10.4%       5.8%       2.0%  
 0.40      40.0%      35.2%      31.7%      26.7%  
 0.60      60.0%      64.8%      68.3%      73.3%  
 0.80      80.0%      89.6%      94.2%      98.0%  
 0.95      95.0%      99.3%      99.9%     100.0%  
```
*(runs live, shows output — read-only demo snippet, not graded. This is
the calculation for independent right-or-wrong answers, not a measurement.)*

The real runs did better than this table on the middle group: questions right
69% of the time on average reached 98% with nine votes, where the same
calculation for p = 0.69 gives about 88%. The reason is that a vote needs the right answer to be
the *most common* answer, not to hold a majority. When wrong answers scatter
across several values, the right one can win with far less than half the
votes.

The two hard questions are the opposite case, where the wrong answers agree:

```python
rng = random.Random(1)
replies = {r["id"]: r["samples"] for r in load_run("plain.smaller")["results"]}
for question_id in ("e21", "e68"):
    question, samples = questions[question_id], replies[question_id]
    spread = Counter(answer_key(question, s["answer"]) for s in samples)
    winners = Counter(vote_winner(question, rng.sample(samples, 9))[0] for _ in range(200))
    print(f"{question_id}: {question['wordings'][0]}")
    print(f"  right answer {question['answer']}; 20 samples answered {dict(spread)}")
    print(f"  a vote of 9 chose: {dict(winners.most_common())} (out of 200 votes)")
```
```
e21: How many REG- error codes are returned with HTTP 422?
  right answer 3; 20 samples answered {3.0: 5, 2.0: 15}
  a vote of 9 chose: {2.0: 199, 3.0: 1} (out of 200 votes)
e68: For how many minutes were support_agent sessions failing in INC-2093?
  right answer 32; 20 samples answered {45.0: 13, 10.0: 1, 32.0: 3, 20.0: 1, 55.0: 1, 42.0: 1}
  a vote of 9 chose: {45.0: 199, 32.0: 1} (out of 200 votes)
```
*(runs live, shows output — read-only demo snippet, not graded. Real
Qwen3.5-2B samples.)*

On each, the model has one favourite wrong answer, and a vote of nine picks
it 199 times out of 200. So the rule is less about "right more than half
the time" than about which answer is the most common. If it's the right one,
voting makes the right answer more reliable. If it's a wrong one, voting
makes that wrong answer the answer every time.

---

## What voting does to pass^k

[Lesson 1's pass^k](→ this module, why agents fail lesson, reliability as pass^k concept)
asks whether a task comes out right on every one of k runs. For a question
answered right with chance p, that's about p to the power k, and voting
changes p:

```python
k = 5
single = sum(p**k for p, _ in small.values()) / len(small)
voted = sum(q**k for _, q in small.values()) / len(small)
print(f"Qwen3.5-2B, chance of {k} runs in a row all right, averaged over the 84 questions:")
print(f"  one sample per run: {single:.1%}   a vote of 9 per run: {voted:.1%}")
hard = [question_id for question_id, (p, _) in small.items() if p < 0.5]
print(f"  on the {len(hard)} questions right under half the time: "
      f"{sum(small[q][0]**k for q in hard) / len(hard):.2%} -> {sum(small[q][1]**k for q in hard) / len(hard):.2%}")
```
```
Qwen3.5-2B, chance of 5 runs in a row all right, averaged over the 84 questions:
  one sample per run: 80.5%   a vote of 9 per run: 97.0%
  on the 2 questions right under half the time: 0.05% -> 0.00%
```
*(runs live, shows output — read-only demo snippet, not graded. Each
question's accuracy is raised to the power k and averaged over the questions,
the per-task average from Lesson 1, in its simple form.)*

So the careful statement is this. Voting raises pass^k on the questions
where the right answer is already the most common one, and it does so by a
lot, because it takes out the run-to-run variation that pass^k punishes. On
questions where a wrong answer is the most common, pass^k was already near
zero, and voting keeps it there. What changes is how it looks: the model now
gives the same wrong answer every run, with every vote agreeing. A system
that measures reliability by how consistent the answers are would call that
question solved. The next concept is about using agreement as a signal
anyway, and where that goes wrong.

---

## Quiz cards

> **Q1.** A question is answered right by 3 of 20 samples, and 13 give the
> same wrong answer. What does a vote of 9 do?
> - A) Makes the right answer more likely, since voting helps
> - B) Picks the common wrong answer almost every time ✅
> - C) Picks each answer as often as a single sample would
> - D) Returns no answer at all, since the votes disagree
>
> *Explanation: a vote returns the most common answer. When that's a wrong
> one, voting makes it the answer on nearly every run. In the 2B's runs, a
> vote of nine picked 45 over the right 32 in 199 of 200 votes.*

> **Q2.** What did Chen et al. find about adding more calls to a majority
> vote?
> - A) Accuracy always rises, though more slowly each time
> - B) It can rise then fall, as calls hurt on hard questions ✅
> - C) Accuracy falls once more than three calls are used
> - D) Accuracy doesn't change after the very first call
>
> *Explanation: more calls help on questions the model usually gets right
> and hurt on those it usually gets wrong. A task with both can peak and then
> decline, depending on the mix.*

> **Q3.** A question is answered right 40% of the time, and the other 60% are
> spread over five different wrong values. Can voting still help?
> - A) No, because the model is right less than half the time
> - B) Yes, if the right answer is still the most common one ✅
> - C) Only with a vote of more than 20 separate samples
> - D) Only if the wrong answers are normalized away first
>
> *Explanation: a vote needs the right answer to be the most common, not a
> majority. Scattered wrong answers each get fewer votes than 40%, so the
> right one wins. The independent-voter table is a worst case for scattered
> errors.*

> **Q4.** After voting, a question gives the same wrong answer on every run.
> What does that do to pass^k, and why is it a trap?
> - A) pass^k rises, because every run's answer now agrees
> - B) It stays near zero, while the answers look fully consistent ✅
> - C) pass^k falls to exactly zero, which is easy to spot
> - D) pass^k can't be computed at all for voted answers
>
> *Explanation: pass^k counts correct runs, so a consistent wrong answer
> scores zero. But anything that measures agreement between runs would rate
> it as highly reliable, which is why agreement needs care as a signal.*

---

*(End of this concept. The next concept uses how much the votes agree as a
signal of how far to trust the answer.)*
