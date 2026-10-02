# Module 7, Lesson 6 — Concept 3: Pass/fail, scores and pairs

> **Note for the site build:** both demos start from this lesson's `LOAD_JUDGES` setup. The demo after the exercise needs the exercise's reference `winner` and `consistency` loaded without showing them.

---

## Three ways to ask a judge

Zheng et al.'s study of models as judges (NeurIPS 2023) set out the three formats in use today:

- **Grade one answer.** The judge reads a single answer and gives a verdict, pass or fail, or a score on a scale such as 1 to 5.
- **Grade against a reference.** The same, with a reference answer to compare with. Every correctness judge in this module works this way.
- **Compare two answers.** The judge reads two answers to the same question and says which is better, or that they're tied.

They found a strong judge's single-answer grades agreed well with its pairwise choices and with people, and they found the biases [Module 6 described](→ Module 6, the verifying an answer against its sources lesson, the checking the checker concept, judges have habits), led by position: in a pair, judges often favour one slot over the other whatever the answers say. Concept 2 argued for pass/fail over scores. This concept puts all three on the same answers: the first run of every dev question in both baseline batches, 96 answers in all, each scored from 1 to 5 by both judges, and the two answers to each question compared as a pair, once in each order.

---

## A score that mostly says pass or fail

Each answer also has a pass/fail correctness verdict from the same judge, so the two formats can be laid side by side:

```python
import json
from pathlib import Path

JUDGES = Path("/data/eval/judges")


def load_digest() -> dict:
    """Every phase 3 judge decision, by judge: gemma (Gemma 4 31B) and qwen9b (Qwen3.5-9B)."""
    return json.loads((JUDGES / "digest.json").read_text(encoding="utf-8"))["judges"]
```
*(defined once at the start of this lesson and already loaded)*

```python
from collections import Counter

judges = load_digest()
for judge, run in judges.items():
    verdicts = {r["trial_id"]: r["decision"] for r in run["results"] if r["kind"] == "correctness"}
    scores = [(r["decision"], verdicts[r["trial_id"]]) for r in run["results"] if r["kind"] == "score"]
    print(f"{judge}: {len(scores)} answers, scores {dict(sorted(Counter(s for s, _ in scores).items(), key=lambda kv: str(kv[0])))}")
    for score in (5, 4, 3, 2, 1):
        same = Counter(v for s, v in scores if s == score)
        if same:
            print(f"  score {score}: pass/fail said {dict(same)}")
```
```
gemma: 96 answers, scores {1: 12, 3: 4, 4: 4, 5: 76}
  score 5: pass/fail said {'pass': 76}
  score 4: pass/fail said {'pass': 4}
  score 3: pass/fail said {'pass': 1, 'fail': 3}
  score 1: pass/fail said {'fail': 12}
qwen9b: 96 answers, scores {1: 13, 2: 5, 3: 3, 4: 6, 5: 69}
  score 5: pass/fail said {'pass': 69}
  score 4: pass/fail said {'pass': 6}
  score 3: pass/fail said {'pass': 3}
  score 2: pass/fail said {'fail': 5}
  score 1: pass/fail said {'fail': 12, 'pass': 1}
```
*(runs live, shows output — read-only demo snippet, not graded; real verdicts and scores from the committed judge runs, both judges greedy)*

Most answers get a 5, and the scale's ends line up with pass and fail almost exactly: every 4 and 5 is a pass, and every 1 and 2 a fail, apart from one of Qwen's. The middle of the scale is used for a handful of answers, and that's where the two formats stop agreeing: Gemma's four 3s are one pass and three fails, while Qwen's three 3s are all passes. So on these answers the score adds a middle category that neither judge uses consistently, which is Husain and Shankar's warning in practice. Where a scale earns its place is when a task has several parts that can each be right or wrong, and then several pass/fail checks say which parts, where a 3 can't.

---

## A pair, shown in both orders

A pairwise judge answers a different question: not "is this answer right?" but "which of these two is better?". That's the question when comparing two versions of an agent, or two prompts, on the same tasks. It needs a precaution, because of position bias: show every pair twice, with the answers swapped, and only trust a preference that survives the swap.

---

## Applied sandbox exercise
*(graded — undo the order a pair was shown in, and measure how much the judge's choice depended on it)*

**Task shown to learner:**

Each pair of runs, run1 and run2, was shown to a judge twice: in order `"ab"`, with run1 as answer A, and in order `"ba"`, with run2 as answer A. Each decision is `"a"`, `"b"` or `"tie"`. Write two functions:

- `winner(decision, order)`: which run the decision picked, `"run1"`, `"run2"` or `"tie"`.
- `consistency(pairs)`: `pairs` is a list of `(decision in order "ab", decision in order "ba")`. Return a dict with:
  - `"consistent"`: pairs where both decisions pick the same run, or both are ties
  - `"flipped"`: pairs where both decisions pick a run, but different runs
  - `"one_tie"`: pairs with a tie in only one order
  - `"first_shown_rate"`: of all the decisions that weren't ties, in both orders, the share that picked answer A, the one shown first; `None` if there were none

`load_digest` is loaded; the hidden tests also run your function on Qwen's real pairs.

**Starter code:**
```python
def winner(decision: str, order: str) -> str:
    """Which run a pairwise decision picked, "run1", "run2" or "tie", undoing the order it was shown in.
    In order "ab", run1 was shown first as A; in order "ba", run2 was shown first."""
    # your code here


def consistency(pairs: list[tuple[str, str]]) -> dict:
    """For each pair, the judge's decision shown in order "ab" and in order "ba". Counts pairs whose two decisions pick
    the same run (or both tie), pairs where they pick different runs, and pairs with a tie in only one order; and the
    share of all non-tie decisions that picked the answer shown first."""
    # your code here


print(consistency([("a", "b"), ("a", "a"), ("tie", "tie")]))
```

**Hidden tests:**
```python
assert winner("a", "ab") == "run1", "in order ab, A is run1"
assert winner("b", "ab") == "run2", "in order ab, B is run2"
assert winner("a", "ba") == "run2", "in order ba, run2 was shown first, as A"
assert winner("b", "ba") == "run1", "in order ba, run1 was shown second, as B"
assert winner("tie", "ba") == "tie", "a tie is a tie in either order"

result = consistency([("a", "b"), ("a", "b"), ("a", "a"), ("tie", "tie"), ("tie", "a"), ("b", "tie")])
assert result is not None, "consistency should return a dict"
assert {k: result.get(k) for k in ("consistent", "flipped", "one_tie")} == {"consistent": 3, "flipped": 1, "one_tie": 2}, \
    ("(a, b) picks run1 both times; (a, a) follows the position, so it flips; two ties agree; "
     f"a tie in one order only is its own case: got {result}")
assert abs(result["first_shown_rate"] - 5 / 8) < 1e-9, \
    f"5 of the 8 non-tie decisions picked A, the answer shown first: got {result['first_shown_rate']}"
assert consistency([("tie", "tie")])["first_shown_rate"] is None, "with no decided comparisons, the rate is None"
assert consistency([])["consistent"] == 0, "no pairs at all"

judges = load_digest()
by_task = {}
for r in judges["qwen9b"]["results"]:
    if r["kind"] == "pairwise":
        by_task.setdefault(r["task_id"], {})[r["order"]] = r["decision"]
real = consistency([(d["ab"], d["ba"]) for d in by_task.values()])
assert (real["consistent"], real["flipped"], real["one_tie"]) == (27, 16, 5), \
    f"on Qwen's real 48 pairs: 27 consistent, 16 flipped, 5 with one tie; got {real}"
```

**Hint (shown on request):** In order `"ab"`, A means run1; in order `"ba"`, A means run2. Turn both decisions of a pair into runs with `winner`, then compare: equal is consistent, a tie on one side only is its own case, and anything else is a flip. Count the first-shown choices on the raw decisions, where `"a"` always means the answer shown first.

**Reference solution:**
```python
def winner(decision: str, order: str) -> str:
    """Which run a pairwise decision picked, "run1", "run2" or "tie", undoing the order it was shown in.
    In order "ab", run1 was shown first as A; in order "ba", run2 was shown first."""
    if decision == "tie":
        return "tie"
    first_shown_won = decision == "a"
    return ("run1" if first_shown_won else "run2") if order == "ab" else ("run2" if first_shown_won else "run1")


def consistency(pairs: list[tuple[str, str]]) -> dict:
    """For each pair, the judge's decision shown in order "ab" and in order "ba". Counts pairs whose two decisions pick
    the same run (or both tie), pairs where they pick different runs, and pairs with a tie in only one order; and the
    share of all non-tie decisions that picked the answer shown first."""
    counts = {"consistent": 0, "flipped": 0, "one_tie": 0}
    first, decided = 0, 0
    for ab, ba in pairs:
        w_ab, w_ba = winner(ab, "ab"), winner(ba, "ba")
        if w_ab == w_ba:
            counts["consistent"] += 1
        elif "tie" in (w_ab, w_ba):
            counts["one_tie"] += 1
        else:
            counts["flipped"] += 1
        for decision in (ab, ba):
            if decision != "tie":
                decided += 1
                first += decision == "a"
    return {**counts, "first_shown_rate": first / decided if decided else None}


print(consistency([("a", "b"), ("a", "a"), ("tie", "tie")]))
```
```
{'consistent': 2, 'flipped': 1, 'one_tie': 0, 'first_shown_rate': 0.75}
```

**Explanation:** The two functions measure position bias two ways, and they don't say the same thing. `winner` undoes the order, so a judge that prefers run1 says `"a"` in one order and `"b"` in the other, and that's a consistent pair. A pair like `("a", "a")` picked whichever answer came first both times: the verdict followed the slot, not the content. `first_shown_rate` is the overall lean, counted on the raw decisions. A judge can lean only slightly towards the first slot and still flip often, or not at all, which is why both numbers are worth reporting.

---

## The two judges, both orders

```python
judges = load_digest()
for judge, run in judges.items():
    by_task = {}
    for r in run["results"]:
        if r["kind"] == "pairwise":
            by_task.setdefault(r["task_id"], {})[r["order"]] = r["decision"]
    pairs = [(d["ab"], d["ba"]) for d in by_task.values()]
    result = consistency(pairs)
    print(f"{judge:<7} {len(pairs)} pairs: {result['consistent']} consistent, {result['flipped']} flipped, "
          f"{result['one_tie']} tie in one order only; the first-shown answer won "
          f"{result['first_shown_rate']:.0%} of decided comparisons")
```
```
gemma   48 pairs: 43 consistent, 0 flipped, 5 tie in one order only; the first-shown answer won 55% of decided comparisons
qwen9b  48 pairs: 27 consistent, 16 flipped, 5 tie in one order only; the first-shown answer won 56% of decided comparisons
```
*(runs live, shows output — read-only demo snippet, not graded; `consistency` is the exercise's reference version)*

Both judges lean the same small amount towards the answer shown first, 55% and 56%, and that number alone would make them look alike. They aren't. Gemma never flips: in no pair does it choose different runs in the two orders. Most of its pairs keep their winner or tie both ways, and five are a tie in one order and a choice in the other. Qwen flips a third of its pairs, choosing whichever answer it saw first, or whichever it saw second, in both orders. Its preferences on those pairs say nothing about the answers.

Gemma's consistency comes with a caveat. Most of its decisions are ties, because both batches mostly answered these questions correctly, and a tie is the honest verdict on two right answers. A pairwise judge is most useful exactly where it's hardest: two versions that differ a little, on tasks where both are partly right. That's the comparison [Lesson 10](→ Module 7, the comparing two versions lesson) makes, and why its pairs are always shown both ways.

---

## Quiz cards

> **Q1.** On the same 96 answers, how did the 1–5 scores relate to the pass/fail verdicts?
> - Its ends matched pass and fail ✅
> - The scores spread evenly across the whole scale
> - The scores disagreed with pass/fail on most answers
> - The judges never used scores of 4 or 5
>
> *Explanation: Every 4 and 5 was a pass and nearly every 1 and 2 a fail. The middle of the scale was used for only a handful of answers, and that's where the two judges, and the two formats, disagreed.*

> **Q2.** Why is every pair shown to the judge twice, with the answers swapped?
> - To see whether a preference survives the swap ✅
> - To give the judge a second chance to call a tie
> - To halve the cost of each comparison
> - To compare the two judges with each other
>
> *Explanation: Judges often favour a slot. A preference that holds in both orders is about the answers; one that follows the slot is position bias.*

> **Q3.** A judge decides "a" when run1 is shown first, and "a" again when run2 is shown first. What happened?
> - It picked the first slot twice ✅
> - It preferred run1 consistently
> - It called the two answers a tie
> - It preferred run2 consistently
>
> *Explanation: "a" always means the answer shown first. Picking it in both orders means the choice followed the position, which is a flipped pair.*

> **Q4.** Gemma and Qwen both chose the first-shown answer about 55% of the time. Why does that hide a real difference?
> - Qwen flipped a third of its pairs ✅
> - Gemma's rate counts ties and Qwen's doesn't
> - The two judges saw different pairs of answers
> - A rate near 50% means neither judge has any bias
>
> *Explanation: The overall lean can be small while individual pairs flip. Counting pairs whose two decisions contradict each other shows Qwen's preferences on a third of the pairs were about position, not content.*

> **Q5.** Most of Gemma's pairwise decisions were ties. Why is that not a flaw here?
> - Both batches mostly answered correctly ✅
> - Gemma can't tell answers apart
> - Ties are the judge's default output
> - The rubric asked for ties on every pair
>
> *Explanation: Two right answers to the same question should tie. The pairs that matter for comparing versions are the ones where they differ, which these mostly weren't.*
