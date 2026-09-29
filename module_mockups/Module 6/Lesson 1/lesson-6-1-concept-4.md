# Module 6, Lesson 1 — Concept 4: Reliable across wordings

---

## A second source of variation: how people ask

Running the same prompt many times measures one kind of inconsistency.
Real users add another: they never send the same prompt. Ask a hundred
people for an agent's target model and you'll get a hundred phrasings. An
agent that's right for one phrasing and wrong for another isn't reliable,
even if each phrasing on its own gets the same answer every time.

Published research shows how large this effect can be:

- **Formatting alone moves results a long way.** Sclar et al.,
  [*Quantifying Language Models' Sensitivity to Spurious Features in Prompt Design*](https://arxiv.org/abs/2310.11324)
  (2023), changed only details like separators, spacing and capitalisation
  in few-shot prompts, keeping the meaning the same. Accuracy differed by up
  to 76 points between formats for LLaMA-2-13B. The sensitivity remained
  in larger models, with more examples, and after instruction tuning, and
  the best format for one model was often not the best for another.
- **Rewording the instructions changes results, and changes which model
  looks best.** Mizrahi et al.,
  [*State of What Art? A Call for Multi-Prompt LLM Evaluation*](https://aclanthology.org/2024.tacl-1.52/)
  (TACL 2024), wrote many paraphrases of the instructions for 39 tasks and
  ran 20 models on them, 6.5 million instances in all. Different phrasings
  of the same instruction gave very different results, both in absolute
  terms and in how models ranked against each other. Their recommendation is
  to evaluate over several paraphrases rather than one.
- **In agent benchmarks, varied phrasing is built in.** τ-bench's simulated
  customer is sampled at temperature 1, so it phrases the same request
  differently on every run. The agent itself ran at temperature 0, and the
  paper attributes the variation between runs to sampling in both the
  customer and the agent.

Those studies vary the instructions and the prompt format. In an agent,
the part that varies most is the user's own request, which is what the
examples below vary. The principle is the same: if meaning-preserving
changes to the input change the output, one phrasing tells you little.

---

## Four wordings of each question, in our runs

Every question in this lesson's data has four wordings that ask the same
thing. The original was run 20 times and each of the other three 10 times,
all with the same context. Here's the 4B model:

```python
def by_wording(name: str) -> dict[str, list[list[bool]]]:
    """Each question's outcomes, one list per wording: the original first, then the three others."""
    results = {}
    for part in (f"plain{name}", f"wordings{name}"):
        for r in load_run(part)["results"]:
            results.setdefault(r["id"], [None] * 4)[r["wording"]] = [reply["correct"] for reply in r["samples"]]
    return results


def rate(outcomes: list[bool]) -> float:
    return sum(outcomes) / len(outcomes)


results = by_wording("")
overall = [sum(rate(outcomes[w]) for outcomes in results.values()) / len(results) for w in range(4)]
print("Qwen3.5-4B, accuracy by wording:", "  ".join(f"{a:.1%}" for a in overall))
print()
print("questions where the wordings differ by 50 points or more:")
for question, outcomes in results.items():
    rates = [rate(o) for o in outcomes]
    if max(rates) - min(rates) >= 0.5:
        print(f"  {question}: " + "  ".join(f"{r:.0%}" for r in rates))
```
```
Qwen3.5-4B, accuracy by wording: 98.9%  99.2%  97.9%  98.2%

questions where the wordings differ by 50 points or more:
  e15: 95%  100%  50%  100%
  e24: 85%  70%  100%  50%
  e41: 65%  100%  80%  20%
  e69: 85%  100%  30%  100%
```
*(runs live, shows output — read-only demo snippet, not graded. Real runs
from Qwen3.5-4B, loaded with the lesson's shared setup.)*

Averaged over all 84 questions, the four sets of wordings score almost the
same, within about a point and a half of each other. Question by question, some
wordings do much worse than others. The average hides it, just as it hid
which questions were shaky in [the concept on repeated runs](→ this lesson, the same question, run twice concept).

Here are e41's four wordings, the question from that concept:

```python
questions = load_questions()
results = by_wording("")
for wording, outcomes in zip(questions["e41"]["wordings"], results["e41"]):
    print(f"{rate(outcomes):>4.0%} of {len(outcomes)} runs  {wording}")
```
```
 65% of 20 runs  Which model is notes_agent being migrated to?
100% of 10 runs  What is the target model for notes_agent?
 80% of 10 runs  notes_agent moves off claude-legacy onto which model?
 20% of 10 runs  In the migration runbook, which model does notes_agent move to?
```
*(runs live, shows output — read-only demo snippet, not graded. It uses
`by_wording` and `rate` from the demo above.)*

The wording that uses the table's own column header, "target model", was
right every time. The one that mentions "the migration runbook" was right
twice in ten. That's one question on one model, and it doesn't show that
matching the document's words is a general fix. What it does show is how
different four equally reasonable wordings can be, on a question whose
average accuracy looks fine.

---

## pass^k across wordings

Consistency across runs and across wordings combine naturally. Say a
question is answered reliably at *k* only if *k* runs of **every** wording
all succeed. For each question, that's the product of its per-wording
pass^k values, averaged over questions as before:

```python
from math import comb, prod


def task_pass_hat_k(outcomes: list[bool], k: int) -> float:
    return comb(sum(outcomes), k) / comb(len(outcomes), k)


k = 10
for name, label in (("", "Qwen3.5-4B"), (".smaller", "Qwen3.5-2B")):
    results = by_wording(name)
    original = sum(task_pass_hat_k(o[0], k) for o in results.values()) / len(results)
    every = sum(prod(task_pass_hat_k(w, k) for w in o) for o in results.values()) / len(results)
    print(f"{label}: pass^{k} on the original wording {original:.3f}, on all four wordings {every:.3f}")
```
```
Qwen3.5-4B: pass^10 on the original wording 0.937, on all four wordings 0.881
Qwen3.5-2B: pass^10 on the original wording 0.707, on all four wordings 0.488
```
*(runs live, shows output — read-only demo snippet, not graded. It uses
`by_wording` from the first demo; *k* is 10 because the extra wordings
were run 10 times each.)*

Requiring every wording to succeed lowers pass^10 for both models, and for
the 2B it drops below one half. Treating each wording's runs as a separate
pass^k and multiplying them assumes the wordings fail independently, which
is a simplification. The measurement itself is the useful habit:
reliability is measured over the inputs users will actually send, not just
the one you happened to test.

---

## Is it the model, or the wording?

When one wording fails and the others succeed, check the wording before
blaming the model. It's the same lesson as
[Module 5's labels that were wrong](→ Module 5, measuring retrieval before improving it lesson, when the labels are wrong concept):
a test that asks something different from what you meant measures the
wrong thing.

This lesson's own data had exactly that problem. An earlier version of
question e09 had a wording asking which error code a key gets "when its
scope doesn't allow a change". The 4B model answered "unknown" in 9 of 10
runs, and it was right to: the context it was given says a read key gets
that error, but never uses the word "scope". Rewritten as "Changing an agent
with a read key fails with which error code?", the same model was right in
10 of 10. The model hadn't changed. The question had.

Three checks before counting a wording's failures against the model:

- **Does the context support this wording?** Everything the wording relies
  on should be in what the model was given.
- **Can it be read two ways?** "How many days did it last, from start to
  end" can fairly mean 7 or 8. An ambiguous wording measures ambiguity, not
  reliability.
- **Does the grader accept every correct way of saying the answer?** "The
  Identity team" and "Identity" are the same answer.

The failures left after those checks are the model's, and they're the ones
reliability work has to handle. The rest of this module builds the tools:
checks in the loop, verifying claims against sources, and knowing when to
ask or stop.

---

## Quiz cards

> **Q1.** An agent scores 98% on your test set, which uses one phrasing per
> question. Why isn't that enough to call it reliable for users?
> - A) Because 98% is below the threshold for any production agent
> - B) Because users phrase the same request many ways, and research shows meaning-preserving changes to prompts can shift accuracy a great deal ✅
> - C) Because accuracy can't be measured on a test set with fixed wordings
> - D) Because a single phrasing always overstates accuracy by a fixed amount
>
> *Explanation: Mizrahi et al. found that different phrasings of the same
> instructions gave very different results across 20 models, and Sclar et
> al. found swings of up to 76 points from formatting alone. A single
> phrasing measures that phrasing; users won't send it.*

> **Q2.** In our runs, the 4B's accuracy was almost the same for each of
> the four sets of wordings, yet e41 scored 100% on one wording and 20% on
> another. How can both be true?
> - A) The averages are wrong and should be recomputed
> - B) Averaging over 84 questions hides the few questions where wording matters a lot ✅
> - C) e41 was graded differently from the other questions
> - D) The two wordings of e41 asked for different answers
>
> *Explanation: most questions score about the same on every wording, so
> the averages barely move. The questions that are sensitive to wording
> disappear into the average, just as shaky questions disappeared into the
> overall accuracy in the concept on repeated runs.*

> **Q3.** What does "pass^k across wordings" require for a question to count
> as reliable?
> - A) That at least one wording succeeds k times
> - B) That the average accuracy over wordings is above k
> - C) That k runs of every wording all succeed ✅
> - D) That the original wording succeeds k times
>
> *Explanation: it combines both kinds of consistency: runs and phrasings.
> Here it's computed as the product of each wording's pass^k, which assumes
> the wordings fail independently. For both models it came out lower than
> pass^k on the original wording alone.*

> **Q4.** One wording of a question fails 9 times in 10 and the others never
> fail. What should you check first?
> - A) Whether a larger model does better on that wording
> - B) Whether the wording asks the same thing, given the context the model was actually shown ✅
> - C) Whether raising the temperature helps
> - D) Nothing: a failing wording is always evidence against the model
>
> *Explanation: in this lesson's own data, a wording relied on the word
> "scope", which the context never used, and the model's "unknown" was the
> right response to it. Rewritten, it went from 1 in 10 to 10 in 10. Check
> the context, possible second readings, and the grader before counting the
> failure against the model.*

---

*(End of this concept. The next concept sorts the ways agents fail and
points to where each is handled.)*
