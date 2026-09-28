# Module 5, Lesson 2 — Concept 4: Reading the numbers honestly

> **Note for the site build:** no new shared code. The demos use the
> metric functions from the previous concept's reference solution, which
> are in the shared setup from here on. The third demo sets `STOPWORDS`
> back when it finishes.

---

## The baseline, at several depths

Here are the previous concept's metrics for Lesson 1's keyword search, at
four values of *k*:

```python
index = KeywordIndex()
index.add(load_sections())
queries = load_queries()["main"]

print(f"{'k':>3}  {'recall':>6}  {'precision':>9}  {'MRR':>5}  {'answerable':>10}")
for k in [1, 3, 5, 10]:
    m = evaluate(index.search, queries, k)
    print(f"{k:>3}  {m['recall']:>6.3f}  {m['precision']:>9.3f}  {m['mrr']:>5.3f}  {m['answerable']:>10.3f}")
```
```
  k  recall  precision    MRR  answerable
  1   0.291      0.326  0.326       0.256
  3   0.446      0.194  0.399       0.395
  5   0.509      0.144  0.418       0.442
 10   0.569      0.088  0.427       0.488
```
*(runs live, shows output — read-only demo snippet, not graded)*

Three things to read from it:

- **Recall and answerable climb with *k*, slowly.** Doubling *k* from 5 to
  10 takes answerable from 0.442 to 0.488, two more of the 43 questions. Each extra slot
  is sent to the model on every question, so those two questions are paid for in tokens.
- **Precision falls steadily**, as the previous concept predicted: the
  extra slots are mostly noise.
- **MRR barely moves after 3.** Answers found deeper in the list are rarely
  the first relevant result, so they add little.

These are the numbers every later lesson in this module is compared
against, at *k* = 5 unless it says otherwise.

---

## One average hides the shape

An average over 43 questions mixes very different kinds of question.
Splitting by type shows where keyword search works and where it can't:

```python
from collections import defaultdict

index = KeywordIndex()
index.add(load_sections())

by_type = defaultdict(list)
for query in load_queries()["main"]:
    if query["evidence"]:
        by_type[query["type"]].append(answerable(index.search(query["query"], 5), query))

print(f"{'type':<15}{'answerable@5':>14}")
for query_type, outcomes in sorted(by_type.items(), key=lambda item: -sum(item[1]) / len(item[1])):
    print(f"{query_type:<15}{sum(outcomes):>6} of {len(outcomes)}")
```
```
type             answerable@5
restricted          2 of 2
out_of_context      4 of 5
public_docs         4 of 5
identifier          4 of 7
paraphrase          4 of 8
conflict            1 of 2
multi_part          0 of 3
conversational      0 of 3
multi_hop           0 of 3
relationship        0 of 3
global              0 of 2
```
*(runs live, shows output — read-only demo snippet, not graded)*

Two readings, and they need to be kept apart:

- **The zeros are structural.** Keyword search sends one question to the
  index and takes what comes back. Questions that need two passages found
  separately, like multi-part, multi-hop and relationship questions, or
  that make no sense without earlier turns, like follow-ups, fail for
  reasons no tweak to scoring will fix. They're what Lessons 7, 10 and 11
  are for.
- **The other rows are too small to rank.** "4 of 8" and "4 of 7" differ
  by a single question. A type with five questions can't tell you that
  keyword search handles out-of-context chunks better than identifiers; it
  can only show you the individual questions, which is what's worth
  reading.

---

## Which questions moved

The stopword fix from the first concept raised the total from 19 to 23.
Comparing the two searches question by question gives the full picture,
and a way to ask whether the difference is real:

```python
QUESTION_WORDS = {"what", "does", "mean", "how", "which", "why", "do", "can", "should"}

def answered_ids(search, queries: list[dict], k: int = 5) -> set:
    return {q["id"] for q in queries if q["evidence"] and answerable(search(q["query"], k), q)}

def sign_test(gains: int, losses: int) -> float:
    """If a change made no real difference, the chance of a split at least this lopsided, either way."""
    n = gains + losses
    tail = sum(math.comb(n, i) for i in range(max(gains, losses), n + 1)) / 2 ** n
    return min(1.0, 2 * tail)

queries = load_queries()["main"]
baseline = KeywordIndex()
baseline.add(load_sections())
before = answered_ids(baseline.search, queries)

STOPWORDS |= QUESTION_WORDS
try:
    tweaked = KeywordIndex()
    tweaked.add(load_sections())
    after = answered_ids(tweaked.search, queries)
finally:
    STOPWORDS -= QUESTION_WORDS

gained, lost = after - before, before - after
print(f"gained {len(gained)}, lost {len(lost)}, unchanged {len(before & after)} answered")
print(f"chance of a split this lopsided with no real effect: {sign_test(len(gained), len(lost)):.2f}")
```
```
gained 5, lost 1, unchanged 18 answered
chance of a split this lopsided with no real effect: 0.22
```
*(runs live, shows output — read-only demo snippet, not graded)*

A change that did nothing at all would still flip some questions, because
each search's ranking has ties and near-misses that small changes shuffle.
If the fix were pure noise, a flipped question would be as likely to go
either way, like a coin. The **sign test** asks how often six coin flips
split at least 5 to 1, in either direction: 22% of the time. So these 43
questions alone can't show that the fix helps; a split like this happens
by chance about one time in five.

That doesn't mean the fix is useless. The mechanism is sound, since "what"
and "does" carry no meaning, and the gains were on questions where those
words had been swamping the real match. A reasonable decision is to keep
it provisionally and let later measurements confirm it. What the test
rules out is the stronger claim, that the numbers alone prove it. Two
habits follow:

- **Report gains and losses, not only the net.** "Five gained, one lost"
  says more than "+4", and the losses are where to look next.
- **Be wary of small differences on a small set.** Each question here is
  worth more than 2 points of answerable@5. A gain of one or two questions
  is well within noise.

---

## The held-out set

Every choice made while looking at these 43 questions, a stopword list, a
value of *k*, and later, weights and thresholds, is fitted a little to
them. Do that enough times and the set stops measuring how well retrieval
works and starts measuring how well it was tuned to this set. It's the
same problem as testing a model on its training data.

That's why 11 more questions are held out. They have the same types and
the same kind of labels, and they're not run, looked at or tuned against
until the module's final lesson. There they give one honest number for
the finished system. If it's much worse than the main set's, the tuning
fitted the questions rather than the problem.

---

## Quiz cards

> **Q1.** Going from k = 5 to k = 10 raises answerable from 0.442 to
> 0.488. What does that gain cost?
> - Five more chunks sent to the model with every question ✅
> - A lower MRR, because the answer moves further down the list
> - Nothing, because the extra chunks are only used when needed
> - A lower recall at k = 5, because the ranking changes
>
> *Explanation: every retrieved chunk goes into the prompt, so a larger k
> is paid for in tokens on every question, and most of the extra chunks
> are noise (precision fell from 0.144 to 0.088). MRR can't fall as k
> grows, and the top five are unchanged.*

> **Q2.** Keyword search answered none of the three multi-hop questions.
> Why is that result different in kind from "4 of 8" paraphrase questions?
> - Multi-hop needs a second search built from the first result, which one search can't do ✅
> - Three questions is enough to be certain, while eight is too few
> - Multi-hop questions use rarer words, which keyword search ignores
> - The multi-hop labels are incomplete, so their score doesn't count
>
> *Explanation: the zero comes from how the search works, not from which
> questions happened to be in the set, so a bigger sample wouldn't change
> it. The paraphrase rate, by contrast, is a small sample of a behaviour
> that varies question by question.*

> **Q3.** A change gains 5 questions and loses 1. Why isn't that proof it
> helps?
> - With no real effect, a split at least that lopsided still happens about one time in five ✅
> - Because one lost question cancels out the five that were gained
> - Because gains only count once they've been checked on the held-out set
> - Because six changed questions is too few to compute a percentage
>
> *Explanation: small changes shuffle near-misses in both directions, so
> some questions flip even when nothing improved. The sign test puts the
> chance of a 5-to-1 split or worse, either way, at 22%. That's weak
> evidence, not no evidence, and understanding why the change should work
> counts too.*

> **Q4.** Why are the held-out questions not run until the module's last
> lesson?
> - Every choice tuned on the main set fits it a little, and only untouched questions show how much ✅
> - They're harder questions, saved for the most advanced retrieval
> - Their labels aren't finished, so running them would give wrong numbers
> - Running them early would use up the corpus's cache and slow later lessons
>
> *Explanation: the main set is used to make decisions, so scores on it
> drift upwards as the system fits its quirks. The held-out set is the
> same kind of question, never used for a decision, so the gap between the
> two shows how much of the improvement was fitting.*
