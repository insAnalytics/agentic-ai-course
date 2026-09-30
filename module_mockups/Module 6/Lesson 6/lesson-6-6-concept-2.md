# Module 6, Lesson 6 — Concept 2: Signals that the agent isn't sure

> **Note for the site build:** this lesson's shared setup is Lesson 5's block (`load_run`, `load_set`
> and the grading functions, reading `/data/reliability/`) plus the grader's `is_correct`, copied
> unchanged from `scripts/reliability/grading.py`. The next concept's exercise uses it.

---

## The signals, and what each costs

Partway through a task, an agent needs some sign that its latest answer or
step is doubtful before it can decide to stop, ask or escalate. The course
has already built several such signals:

| Signal | Where it came from | What it costs | Available when |
|---|---|---|---|
| Token probabilities (logprobs) | [Module 1](→ Module 1, decoding strategies and generation controls lesson, logprobs concept) | Nothing extra, if the provider returns them | The provider supports them |
| Agreement among samples | [Lesson 5](→ this module, self-consistency and voting lesson, agreement as a confidence signal concept) | One call per extra sample | The answer can be compared exactly |
| A failed check against sources | [Lesson 4](→ this module, verifying an answer against its sources lesson, checking each claim against the source it cites concept) | A judge call per claim | There are sources to check against |
| A low retrieval score | [Module 5](→ Module 5, answering from retrieved context lesson, abstaining when retrieval is weak concept) | Nothing extra | The answer rests on retrieval |
| The model's stated confidence | Asking the model | A few output tokens | Always, but see below |

Module 1 showed what a logprob is and promised that using one as a
confidence signal would come later. That's where this concept starts.

---

## Where logprobs are available

Not every provider returns them. OpenAI's Chat Completions API does when
asked, through its `logprobs` and `top_logprobs` parameters, as
[its documentation shows](https://developers.openai.com/cookbook/examples/using_logprobs).
Open models served with engines such as vLLM, which produced this module's
runs, return them too. Anthropic's Messages API has no such option: its
[reference for creating a message](https://platform.claude.com/docs/en/api/messages/create)
lists no parameter for them, and its responses carry none. A signal that
depends on logprobs ties the agent to providers that offer them.

---

## Logprobs on an answer written after reasoning

Every reply in Lesson 1's runs ended with an `ANSWER:` line, and the runs
stored the probability of each token on that line. Multiplying them gives
the probability the model gave the whole answer line. Here's how that
relates to being right:

```python
import math


def answer_probability(sample: dict) -> float | None:
    """The probability the model gave its whole answer line: the product of its tokens' probabilities."""
    steps = sample.get("answer_logprobs")
    return math.exp(sum(step["logprob"] for step in steps)) if steps else None


bands = [("0.99 or more", 0.99, 1.01), ("0.90 to 0.99", 0.90, 0.99), ("0.50 to 0.90", 0.50, 0.90), ("under 0.50", 0.0, 0.50)]
for label, run_name in [("Qwen3.5-2B", "plain.smaller"), ("Qwen3.5-4B", "plain")]:
    rows = [(answer_probability(s), s["correct"]) for r in load_run(run_name)["results"] for s in r["samples"]]
    rows = [(p, correct) for p, correct in rows if p is not None]
    print(f"{label}: probability of the answer line, and how often it was right")
    for band, low, high in bands:
        right = [correct for p, correct in rows if low <= p < high]
        print(f"  {band:<13} {len(right) / len(rows):6.1%} of answers, right {sum(right) / len(right):6.1%}")
```
```
Qwen3.5-2B: probability of the answer line, and how often it was right
  0.99 or more   40.4% of answers, right  92.8%
  0.90 to 0.99   36.1% of answers, right  93.5%
  0.50 to 0.90   18.5% of answers, right  97.7%
  under 0.50      5.1% of answers, right  77.6%
Qwen3.5-4B: probability of the answer line, and how often it was right
  0.99 or more   87.5% of answers, right  99.4%
  0.90 to 0.99    7.0% of answers, right  98.3%
  0.50 to 0.90    3.7% of answers, right  93.5%
  under 0.50      1.8% of answers, right 100.0%
```
*(runs live, shows output — read-only demo snippet, not graded. Real
committed runs; a few replies with no answer line have no probability and
are left out.)*

It barely relates at all. For the 2B, answers written with 99% or more
probability were right 92.8% of the time, and answers in the 50–90% band
were right more often, 97.7%. For the 4B, the least probable answers were all
right. Two things explain this:

- **The probability is of an exact string, not an answer.** A correct
  `GET /agents/me` can come out at 55%, because the model was nearly as
  likely to write the same endpoint as `/agents/me`. Two ways of writing one
  answer split the probability between them.
- **By the answer line, the decision is already made.** The reply reasons
  first and then writes its conclusion. If the reasoning went wrong, the
  wrong conclusion is written with near-certainty: the 2B's wrong answer
  "2", to a question whose answer is 3, was written with over 95%
  probability every time. The probability measures
  how sure the model is of copying out its conclusion, not how sure it is of
  the conclusion.

---

## Logprobs on a one-word decision

The support and contradiction judges from Lesson 4 are different: each
reply is a single verdict word, and that word is the decision. The runs
stored its probability too:

```python
def verdict_probability(steps: list[dict], marker: str = "VERDICT:") -> float | None:
    """The probability of the first word after the marker: the moment the judge commits to a verdict."""
    text = ""
    for i, step in enumerate(steps):
        text += step["token"]
        if marker in text:
            following = [s for s in steps[i + 1:] if s["token"].strip()]
            return math.exp(following[0]["logprob"]) if following else None
    return None


WANTED = {"supported": "SUPPORTED", "not_supported": "NOT SUPPORTED", "contradict": "CONTRADICT", "consistent": "CONSISTENT"}
built = load_set("set-v")
for run_name, pairs in [("support.small", "support_pairs"), ("statements.small", "statement_pairs"),
                        ("statements.large", "statement_pairs")]:
    labels = {p["id"]: p["label"] for p in built[pairs]}
    rows = [(verdict_probability(r["logprobs"]), r["verdict"] == WANTED[labels[r["id"]]])
            for r in load_run(run_name)["results"]]
    wrong = [p for p, correct in rows if not correct]
    right = [p for p, correct in rows if correct]
    print(f"{run_name:<17} verdict probability under 0.9: {sum(p < 0.9 for p in wrong)} of {len(wrong)} wrong verdicts, "
          f"{sum(p < 0.9 for p in right)} of {len(right)} right ones")
```
```
support.small     verdict probability under 0.9: 3 of 3 wrong verdicts, 19 of 117 right ones
statements.small  verdict probability under 0.9: 14 of 15 wrong verdicts, 17 of 105 right ones
statements.large  verdict probability under 0.9: 4 of 5 wrong verdicts, 9 of 115 right ones
```
*(runs live, shows output — read-only demo snippet, not graded. Real
committed judge runs; "under 0.9" means the judge gave its chosen verdict
word less than a 90% chance.)*

Here the signal is strong. The 4B judge's three wrong support verdicts all
came with less than 90% probability, as did 14 of its 15 wrong contradiction
verdicts, while only about one right verdict in six did. Flagging verdicts
under 0.9 for a second look would have caught nearly all the mistakes at the
cost of rechecking some right ones. These are small numbers from two models,
but the contrast with the answer-line probabilities is large.

The practical rule that follows: read the probability where the decision
is made. On a one-word classification, such as a verdict, a label or a
route, the token *is* the decision. On an answer written after reasoning,
it isn't, and the signal has to come from elsewhere: agreement between
samples, or a check against sources.

---

## What about asking the model?

The research on stated confidence disagrees with itself. Tian et al.,
[*Just Ask for Calibration*](https://arxiv.org/abs/2305.14975) (EMNLP 2023),
found that for models trained with human feedback, including ChatGPT, GPT-4
and Claude, confidence stated in words was typically better calibrated than
the models' token probabilities, often halving the calibration error.
[Xiong et al.](→ this module, self-consistency and voting lesson, agreement as a confidence signal concept)
found stated confidence overconfident, with agreement among samples helping.
Both can be true on different models, tasks and prompts. This module's runs
didn't ask for stated confidence, so there's no local evidence either way.

The safe conclusion covers every signal in this concept: none can be
trusted until it's been measured on labelled cases from your own task, the
way [Lesson 4 checked its checker](→ this module, verifying an answer against its sources lesson, checking the checker concept).
Judged the Lesson 2 way, each signal is a check with a catch rate and a
false-flag rate. Measuring how well confidence scores match accuracy across
a whole system, calibration, is Module 7's subject.

---

## Quiz cards

> **Q1.** For the 2B's answers, a line written with 99% or more probability
> was right 92.8% of the time, and one written with 50–90% probability 97.7%.
> Why is answer-line probability such a weak signal here?
> - A) Because the runs used too few samples per question
> - B) It copies a finished conclusion, and forms split the odds ✅
> - C) Because logprobs are always meaningless as a signal
> - D) Because the 2B is too small to produce logprobs
>
> *Explanation: the probability measures how sure the model is of the exact
> string it's writing out, after its reasoning has decided. A wrong conclusion
> is copied out with near-certainty, and a right one written two ways splits
> its probability.*

> **Q2.** Why was the judges' verdict probability a much stronger signal?
> - A) Because the judges always use a larger model
> - B) The verdict word is the decision itself, not a copy ✅
> - C) Because verdicts are graded more leniently
> - D) Because the judges ran with greedy decoding
>
> *Explanation: on a one-word decision, the token's probability is the
> model's hesitation between the options. That's where a logprob carries
> information about whether the decision is right.*

> **Q3.** An agent runs on a provider whose API returns no logprobs. Which
> signals are still open to it?
> - A) None, since every confidence signal needs logprobs
> - B) All the others, from agreement to stated confidence ✅
> - C) Only stated confidence, since it needs just a prompt
> - D) Only retrieval scores, since they come from search
>
> *Explanation: logprobs are one signal among several. Agreement, source
> checks and retrieval scores need nothing from the provider beyond replies,
> and stated confidence needs only a prompt, though it must be checked.*

> **Q4.** Tian et al. found stated confidence well calibrated; Xiong et al.
> found it overconfident. What should a builder conclude?
> - A) Trust stated confidence, since one study supports it
> - B) Never use stated confidence for anything
> - C) Measure it on their own labelled cases first ✅
> - D) Average the two findings and use the result
>
> *Explanation: the studies used different models, tasks and prompts.
> Whether a signal works for your agent is an empirical question about your
> agent, answered the way Lesson 4 checked its checker.*

---

*(End of this concept. The next concept is about what to do when a signal
fires: escalate to a stronger model, or to a person.)*
