# Module 6, Lesson 2 — Concept 2: What reliability costs, on things already built

> **Note for the site build:** this lesson's shared setup is
> `REACT_FAKE_CLIENT + RECORDING_CLIENT + COUNT_TOKENS` from `fakeClient.ts`,
> followed by the two blocks below marked "defined once here". The second
> reads Module 6's run files from `/data/reliability/`, served as in Lesson 1.
> Nothing existing changes.

---

## Measuring before arguing

[The previous concept](→ this lesson, four things every technique trades concept)
named what reliability spends. This one measures it on three things the
course has already built or run: Module 2's reflection loop, Module 5's
reranker, and this module's own model runs. The first is a structural count
that holds for any model; the other two are measurements of particular
setups, and are labelled as such.

```python
class EvaluationBlock:
    def __init__(self, passed: bool, critique: str = ""):
        self.type = "evaluation"
        self.passed = passed
        self.critique = critique


def run_evaluator_optimizer(generator, evaluator, prompt: str, max_attempts: int = 3) -> str:
    """Module 2's evaluator-optimizer loop: generate, have a model judge it, revise with the critique."""
    current_prompt = prompt
    for attempt in range(max_attempts):
        candidate = generator.create(messages=[{"role": "user", "content": current_prompt}]).content[0].text
        verdict = evaluator.create(messages=[{"role": "user", "content": f"Evaluate this: {candidate}"}]).content[0]
        if verdict.passed:
            return candidate
        current_prompt = f"{prompt}\n\nPrevious attempt: {candidate}\nCritique: {verdict.critique}\nPlease revise."
    return f"Error: no passing candidate produced after {max_attempts} attempts"


def usage(*clients) -> dict:
    """Calls made, and tokens sent and received, across recording clients (the course's ~4 characters per token estimate)."""
    return {
        "calls": sum(len(c.seen) for c in clients),
        "sent": sum(count_tokens(messages) for c in clients for messages in c.seen),
        "received": sum(count_tokens(c.scripted_responses[i]) for c in clients for i in range(c.call_count)),
    }
```
*(defined once here and already loaded for every demo in this lesson)*

```python
import json
from pathlib import Path

DATA = Path("/data/reliability")


def load_run(name: str) -> dict:
    """One committed run file, such as "plain" (Qwen3.5-4B) or "plain.smaller" (Qwen3.5-2B)."""
    return json.loads((DATA / "runs" / f"{name}.json").read_text(encoding="utf-8"))
```
*(defined once here and already loaded for every demo in this lesson)*

---

## Reflection: the calls are certain, the benefit isn't

[Module 2's evaluator-optimizer loop](→ Module 2, reflection and self-critique lesson, the evaluator-optimizer pattern concept)
has a model draft an answer, a second call judge it, and, if the judge
rejects it, another draft that includes the critique. Here's what it costs
on the same task, counted with recording clients:

```python
PROMPT = "Summarise incident INC-2093 for the on-call channel in two sentences."
FIRST = ("The registry was down for a while because the database failed over. "
         "It is fixed now.")
SECOND = ("On 2026-08-27 registry-api was unavailable for 42 minutes while registry-db failed over, "
          "because the standby had fallen 38 minutes behind. An alert now fires on standby lag above 60 seconds.")
CRITIQUE = "Too vague: give the date, how long it lasted, the cause and what changed."

# no reflection: one generation, used as it is
plain = RecordingClient([[TextBlock(FIRST)]])
plain.create(messages=[{"role": "user", "content": PROMPT}])

# reflection, where the evaluator accepts the first draft
gen_a, judge_a = RecordingClient([[TextBlock(SECOND)]]), RecordingClient([[EvaluationBlock(True)]])
run_evaluator_optimizer(gen_a, judge_a, PROMPT)

# reflection, where the evaluator rejects the first draft once
gen_b = RecordingClient([[TextBlock(FIRST)], [TextBlock(SECOND)]])
judge_b = RecordingClient([[EvaluationBlock(False, CRITIQUE)], [EvaluationBlock(True)]])
run_evaluator_optimizer(gen_b, judge_b, PROMPT)

for label, clients in (("no reflection", [plain]), ("reflection, accepted first time", [gen_a, judge_a]),
                       ("reflection, one revision", [gen_b, judge_b])):
    u = usage(*clients)
    print(f"{label:<32} calls: {u['calls']}, tokens sent: ~{u['sent']}, received: ~{u['received']}")
```
```
no reflection                    calls: 1, tokens sent: ~26, received: ~29
reflection, accepted first time  calls: 2, tokens sent: ~86, received: ~69
reflection, one revision         calls: 4, tokens sent: ~197, received: ~131
```
*(runs live, shows output — read-only demo snippet, not graded. The drafts
and verdicts are scripted, so this counts the loop's shape, not a model's
behaviour. Tokens use the course's estimate of about four characters per
token.)*

Two things are certain from the loop's shape alone:

- **Reflection at least doubles the calls,** even when the first draft is
  accepted, because the judge always runs.
- **Each revision costs more than the draft before it,** because the new
  prompt carries the old draft and the critique. One revision here took four
  calls and more than seven times the tokens sent of a single answer.

What the extra calls buy is not certain. Huang et al.,
[*Large Language Models Cannot Self-Correct Reasoning Yet*](https://arxiv.org/abs/2310.01798)
(ICLR 2024), tested models revising their own answers with no outside
feedback and found they struggled to improve, and that performance sometimes
got worse after self-correction. Later papers have argued that newer models
do better at it, so treat it as a question to measure for your own model and
task, not a given. It's the effect
[Module 2 called shared blind spots](→ Module 2, reflection and self-critique lesson, the limits: shared blind spots concept):
a judge that is the same model tends to accept the same mistakes. A check
that brings in something new, such as a tool result, a source document or a
rule in code, is a different matter, and it's what Lessons 3 and 4 build.

---

## Reranking: latency that grows with the candidates

[Module 5 measured its cross-encoder reranker](→ Module 5, reranking lesson, two stages concept)
on the course's laptop GPU, an RTX 3070 Ti: 3.55 ms per question-chunk pair,
or 97 ms to rerank 30 candidates for one question. That cost is paid on
every search, and it grows with the number of candidates, which is why
Module 5 reranked a shortlist rather than the whole corpus. What it bought,
[measured on that module's questions](→ Module 5, reranking lesson, reranking, measured concept),
was more answers at rank 1 from every first stage.

That's the shape of a good trade: a known, bounded latency cost per call,
set against a measured gain. Both numbers belong to that GPU and those
questions, and both would need measuring again for a different setup.

---

## Parallel samples and sequential thinking

The model runs behind Lesson 1 also timed a few requests one at a time, the
way a user would wait for them: one sample, five samples in a single
request, and thinking before answering, with the model thinking as long as
it liked up to 4,096 tokens.

```python
from statistics import median

probes = [
    ("plain", "samples_1", "one sample"),
    ("plain", "samples_5", "five samples, one request"),
    ("thinking", "thinking_then_answer", "thinking, then answering"),
]
for name, key, label in probes:
    run = load_run(name)
    timings = run["timing"]["latency_probe"][key]
    seconds = median(t["seconds"] for t in timings)
    tokens = median(t["tokens"] for t in timings)
    print(f"{label:<27} median {seconds:5.2f} s for {tokens:6.0f} generated tokens  ({run['model']}, {len(timings)} questions)")
```
```
one sample                  median  0.48 s for     64 generated tokens  (Qwen/Qwen3.5-4B, 10 questions)
five samples, one request   median  0.86 s for    385 generated tokens  (Qwen/Qwen3.5-4B, 10 questions)
thinking, then answering    median 11.21 s for   1521 generated tokens  (Qwen/Qwen3.5-4B, 10 questions)
```
*(runs live, shows output — read-only demo snippet, not graded. Real
timings from the committed runs: ten questions each, one request at a time,
on one Colab G4 GPU with vLLM. Other hardware, engines and loads will give
different numbers.)*

Five samples produced about six times the tokens of one, and took under
twice as long. Thinking produced about four times the tokens of the five
samples and took about thirteen times as long. The difference is in how
the tokens are generated, which
[Module 1 explained](→ Module 1, how LLMs generate text lesson, autoregressive generation, one token at a time concept):
each token depends on the one before it, so a long chain of thought has to
be produced one token after another, while five separate samples can be
generated side by side.

So "more tokens" isn't one kind of cost. Samples that run in parallel cost
compute more than they cost the user's time; tokens that run in sequence
cost both. A technique's latency and its token cost can rank it very
differently against the alternatives, which is the subject of the next
concept.

---

## Quiz cards

> **Q1.** An evaluator-optimizer loop accepts the first draft. How many
> model calls did it make, compared with answering directly?
> - A) One, the same as answering directly, since nothing was revised
> - B) Two: the draft and the judge's verdict, which runs even when it accepts ✅
> - C) Three: the draft, the verdict and a confirmation
> - D) It depends on the model's temperature
>
> *Explanation: the judge has to run to know the draft is acceptable, so
> reflection always at least doubles the calls. Each rejection adds two
> more, with a longer prompt each time because it carries the previous draft
> and the critique.*

> **Q2.** What did Huang et al. find about models revising their own
> reasoning without outside feedback?
> - A) Revisions reliably fixed most errors
> - B) Models struggled to improve their answers, and performance sometimes got worse ✅
> - C) Revisions only helped larger models
> - D) Revisions always made answers longer but never changed them
>
> *Explanation: with no new information, the judge is the same model with
> the same knowledge, so it tends to accept the same mistakes. Later work has
> argued newer models do better, which is why the cost of reflection is
> certain and its benefit is something to measure.*

> **Q3.** Module 5's reranker took 3.55 ms per question-chunk pair on a
> laptop GPU. Why rerank only a shortlist of 30 candidates?
> - A) Because the reranker can only read 30 chunks
> - B) Because its latency grows with every candidate, so scoring the whole corpus on every question would cost far more time than scoring a shortlist ✅
> - C) Because the first stage is always right about everything outside the top 30
> - D) Because shortlists are more accurate than full rankings
>
> *Explanation: the cost is per pair, so it scales with the number of
> candidates. A cheap first stage narrows the field and the expensive
> reranker reads only what's left; the gain it buys is measured on that
> shortlist.*

> **Q4.** In the timed runs, five samples in one request took under twice
> as long as one sample, but thinking took about thirteen times as long as
> the five samples. Why?
> - A) Thinking uses a larger model
> - B) The five samples were cached, and thinking wasn't
> - C) Separate samples can be generated side by side, while a chain of thought has to be generated one token after another ✅
> - D) Thinking tokens are more expensive to compute than answer tokens
>
> *Explanation: autoregressive generation makes each token wait for the one
> before it within a sequence, but separate sequences can run in parallel.
> So parallel samples mostly cost compute, and long sequential reasoning
> costs the user's time as well. The exact ratios belong to that GPU and
> engine.*

---

*(End of this concept. The next concept asks what "the same budget" means
when calls, tokens, time and money can all rank the options differently.)*
