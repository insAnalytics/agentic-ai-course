# Module 7, Lesson 10 — Concept 3: Many tasks, many chances to be fooled

> **Note for the site build:** both demos start from `LOAD_ABLATIONS`. The first defines `fisher_drop`; carry it, without the printing, into the second demo's hidden setup, with the exercise's reference `benjamini_hochberg`.

---

## One test per task

The gate in the last concept flagged any task whose pass rate fell by 0.8 or more. That threshold came from reading the noise, which works but doesn't say how surprising a given drop is. A statistical test does: for one task, how likely is a drop at least this large if nothing had changed?

With pass/fail trials on both sides, the standard choice is **Fisher's exact test**. Given how many passes there were across both runs together, it computes the exact chance that the new run would get this few of them by luck alone. Here it is, one-sided because a regression gate only cares about drops:

```python
from math import comb


def fisher_drop(before: list[bool], after: list[bool]) -> float:
    """One-sided Fisher exact test: the chance of `after` having this few passes or fewer, if both runs had the same
    underlying pass rate, given how many passes there were in total."""
    a, b = sum(before), sum(after)
    total, n1, n2 = a + b, len(before), len(after)
    return sum(comb(n2, k) * comb(n1, total - k) for k in range(max(0, total - n1), b + 1)) / comb(n1 + n2, total)


print(f"5/5 before and 0/5 after: p = {fisher_drop([True] * 5, [False] * 5):.4f}, the smallest five trials can give")
a, b = passes("baseline"), passes("baseline-b")
p_values = {t: fisher_drop(a[t], b[t]) for t in b}
print(f"no-change pair, {len(p_values)} tasks: {sum(p < 0.05 for p in p_values.values())} with p < 0.05; "
      f"Bonferroni's threshold is 0.05 / {len(p_values)} = {0.05 / len(p_values):.5f}")
```
```
5/5 before and 0/5 after: p = 0.0040, the smallest five trials can give
no-change pair, 96 tasks: 0 with p < 0.05; Bonferroni's threshold is 0.05 / 96 = 0.00052
```
*(runs live, shows output — read-only demo snippet, not graded; the no-change pair is the baseline's two batches on the main pool)*

Two numbers in that output decide this whole concept.

- **The no-change pair produced no task with p below 0.05.** The one-sided test asks about drops, and q25's big swing was a gain.
- **Five trials can't prove much about one task.** The strongest possible evidence, 5/5 falling to 0/5, gives p = 0.004. That sounds small, but with 96 or 125 tasks tested at once, small p-values turn up by chance. Lesson 9's Bonferroni correction divides the 0.05 by the number of tests, here a threshold of about 0.0005, which no task can ever reach with five trials. A per-task gate built that way would never fire.

---

## Controlling the share of false flags

Bonferroni guards against even one false flag across all the tests. For a gate whose flags send a person to read runs, that's the wrong goal: a flag list that's 95% right is useful, and one that can never contain anything isn't. Benjamini and Hochberg's method (1995) controls something else, the **false discovery rate**: the expected share of flagged tests that are false. Set it at 5%, and on average 1 flag in 20 is wrong, however many tests there are.

It's a short procedure:

1. Sort the m p-values from smallest to largest.
2. Find the largest rank k where p(k) ≤ k / m × q.
3. Flag the k smallest.

A test can be flagged even if it missed its own threshold, as long as a test ranked after it passed. That's what lets many moderate signals together flag a regression no single one could prove.

---

## Applied sandbox exercise
*(graded — the Benjamini–Hochberg procedure)*

**Task shown to learner:**

Write `benjamini_hochberg(p_values, q=0.05)`. `p_values` maps test names to p-values. Sort them from smallest to largest, breaking ties by name; find the largest rank k (counting from 1) where the k-th p-value is at most k / m × q, with m the number of tests; and return the names of the k smallest, sorted by name. Return an empty list if no rank passes.

**Starter code:**
```python
def benjamini_hochberg(p_values: dict[str, float], q: float = 0.05) -> list[str]:
    """The tests to flag while keeping the expected share of false flags at or below q: sort the p-values, find the
    largest rank k with p(k) <= k / m * q, and flag the k smallest. Returned sorted by name."""
    # your code here


print(benjamini_hochberg({"a": 0.001, "b": 0.012, "c": 0.04, "d": 0.3}))
```

**Hidden tests:**
```python
got = benjamini_hochberg({"a": 0.001, "b": 0.012, "c": 0.04, "d": 0.3})
assert got is not None, "benjamini_hochberg should return a list of names"
assert got == ["a", "b"], ("thresholds k/4 x 0.05 are 0.0125, 0.025, 0.0375, 0.05; a and b are under theirs, c (0.04) "
                           f"isn't under 0.0375 and d isn't under 0.05: got {got}")
assert benjamini_hochberg({"a": 0.03, "b": 0.04, "c": 0.045, "d": 0.049}) == ["a", "b", "c", "d"], \
    "the largest rank that passes decides: d passes at rank 4 (0.049 <= 0.05), so all four are flagged"
assert benjamini_hochberg({"a": 0.02, "b": 0.5, "c": 0.026}) == ["a", "c"], \
    ("a (0.02) misses its own threshold (0.0167), but c passes at rank 2 (0.026 <= 0.0333), and everything ranked "
     "at or before the largest passing rank is flagged")
assert benjamini_hochberg({"a": 0.2, "b": 0.6}) == [], "nothing under its threshold: nothing flagged"
assert benjamini_hochberg({}) == [], "no tests, no flags"
assert benjamini_hochberg({"a": 0.05}) == ["a"], "at or below the threshold counts: 0.05 <= 1/1 x 0.05"
assert benjamini_hochberg({"a": 0.04}, q=0.01) == [], "q is a parameter"
assert benjamini_hochberg({"z": 0.001, "a": 0.002}) == ["a", "z"], "flags come back sorted by name"
```

**Hint (shown on request):** Find the cutoff first, as the largest passing rank (`max(..., default=0)`), then take everything up to it. Stopping at the first rank that fails is a different, stricter procedure.

**Reference solution:**
```python
def benjamini_hochberg(p_values: dict[str, float], q: float = 0.05) -> list[str]:
    """The tests to flag while keeping the expected share of false flags at or below q: sort the p-values, find the
    largest rank k with p(k) <= k / m * q, and flag the k smallest. Returned sorted by name."""
    ranked = sorted(p_values.items(), key=lambda item: (item[1], item[0]))
    m = len(ranked)
    cutoff = max((k for k, (_, p) in enumerate(ranked, start=1) if p <= k / m * q), default=0)
    return sorted(name for name, _ in ranked[:cutoff])


print(benjamini_hochberg({"a": 0.001, "b": 0.012, "c": 0.04, "d": 0.3}))
```
```
['a', 'b']
```

**Explanation:** The procedure is "step-up": it looks for the largest rank that passes, not the first that fails, which the third test checks. The thresholds grow with rank, so the smallest p-value has to beat q/m, Bonferroni's threshold, but the tenth smallest only has to beat ten times that. A regression that touches many tasks produces many small p-values, and together they clear the climbing thresholds.

---

## Every change, three ways

```python
known_good = passes("baseline")
for condition in ("baseline-b", "fp8", "prompt-v2", "compaction", "layers-v2", "layers"):
    new = passes(condition)
    p_values = {t: fisher_drop(known_good[t], new[t]) for t in new}
    m = len(p_values)
    uncorrected = sorted(t for t, p in p_values.items() if p < 0.05)
    bonferroni = sorted(t for t, p in p_values.items() if p <= 0.05 / m)
    fdr = benjamini_hochberg(p_values)
    print(f"{condition:<11} {m:>3} tasks: p < 0.05 {len(uncorrected):>2}   Bonferroni {len(bonferroni):>2}   "
          f"Benjamini-Hochberg {len(fdr):>2}")
```
```
baseline-b   96 tasks: p < 0.05  0   Bonferroni  0   Benjamini-Hochberg  0
fp8         125 tasks: p < 0.05  0   Bonferroni  0   Benjamini-Hochberg  0
prompt-v2   125 tasks: p < 0.05  0   Bonferroni  0   Benjamini-Hochberg  0
compaction  125 tasks: p < 0.05  3   Bonferroni  0   Benjamini-Hochberg  0
layers-v2   125 tasks: p < 0.05  9   Bonferroni  0   Benjamini-Hochberg  0
layers      125 tasks: p < 0.05 24   Bonferroni  0   Benjamini-Hochberg 14
```
*(runs live, shows output — read-only demo snippet, not graded; the known-good run is the baseline throughout)*

- **Uncorrected,** p below 0.05 flags tasks for compaction and layers v2, the same tasks the gate's 0.8 rule flagged in the last concept, and nothing for the three changes that didn't regress. That's a useful reading list, but with 125 tests, a few flags are expected by chance even when nothing changed.
- **Bonferroni** flags nothing anywhere, not even for Module 6's original layers, which cost 30 points. With five trials per task, it can't.
- **Benjamini–Hochberg** flags 14 tasks for the original layers, where many tasks fell together, and nothing for compaction or layers v2, where a handful of tasks fell on their own.

So with five trials per task, the suite can confirm a broad regression task by task, but an isolated drop in one task stays a suspicion. That suggests how to spend a budget: run the whole suite at five trials to find suspects, then rerun only the flagged tasks with many more trials. Twenty trials each for the three tasks compaction flagged costs less than a tenth of rerunning the suite, and turns "worth a look" into an answer.

---

## Quiz cards

> **Q1.** Why does the gate use a one-sided Fisher test?
> - Only drops count as regressions ✅
> - Two-sided tests need more trials
> - Gains can't be measured with Fisher's test
> - One-sided p-values are always smaller
>
> *Explanation: A regression gate asks whether a task got worse. A gain, like q25's swing in the no-change pair, isn't a reason to stop a change, so the test only looks for drops.*

> **Q2.** With five trials per task, why can Bonferroni never flag a single task among 125?
> - 0.004 can't reach 0.05 / 125 ✅
> - Fisher's test needs at least ten trials
> - Bonferroni only works on suite totals
> - All 125 p-values come out the same
>
> *Explanation: The strongest possible drop, 5/5 to 0/5, gives p = 0.004. Bonferroni's threshold for 125 tests is 0.0004, which no five-trial comparison can reach.*

> **Q3.** What does a false discovery rate of 5% promise?
> - About 1 flag in 20 is false ✅
> - No more than 5% of tasks get flagged
> - At most one false flag in the whole suite
> - Every flag has a p-value under 0.05
>
> *Explanation: Benjamini–Hochberg controls the expected share of flagged tests that are false. Bonferroni controls the chance of even one false flag, which is much stricter.*

> **Q4.** Why could Benjamini–Hochberg flag 14 tasks for the original layers but none for compaction?
> - Many tasks dropped together ✅
> - Compaction's drops were all gains
> - The original layers had more trials
> - Compaction used a different test
>
> *Explanation: The thresholds climb with rank, so many small p-values together can clear them. Compaction's three drops were isolated, and on their own five trials can't make them convincing.*

> **Q5.** A five-trial suite flags three tasks that no correction confirms. What's the efficient next step?
> - Rerun those tasks with many more trials ✅
> - Rerun the whole suite with ten trials
> - Ignore them, since nothing was confirmed
> - Remove those tasks from the suite
>
> *Explanation: The flags are suspects. Rerunning just them with, say, twenty trials each costs far less than rerunning the suite and turns a suspicion into an answer.*
