# Module 6, Lesson 5 — Concept 4: Voting, thinking, or a stronger model, at equal budget

---

## Three ways to spend the same tokens

Voting is one way to spend more on a question. There are at least two
others: let one sample think for longer before it answers, or ask a stronger
model once. Which is best is exactly the kind of question
[Lesson 2](→ this module, accuracy latency cost and false refusals lesson, equal budgets need a stated unit concept)
said needs a stated unit, and here the unit is tokens generated.

Research says to expect the answer to depend on the task. Snell et al.
found that how much extra test-time computation helps depends heavily on
how hard a question is, and that on questions where a smaller model already
had some success, spending more at test time could beat a model fourteen
times larger. Chen et al., from
[the second concept](→ this lesson, when voting helps and when it hurts concept),
found voting helps on easy questions and hurts on hard ones. Neither says
one method always wins. So what follows is a measurement for this task, a
set of exact-answer lookups that these models mostly find easy, and not a
ranking of the methods in general.

---

## The options, by the tokens they actually used

The thinking runs gave Qwen3.5-2B budgets of 1, 3, 5 and 9 times its average
plain answer length, so that each could be compared with a vote of the same
size. But a budget caps only the thinking; the answer that follows costs
tokens too. So the fair comparison uses the tokens each option actually
generated:

```python
import random
from statistics import mean

questions = {q["id"]: q for q in load_set("set-e")["questions"]}


def answer_key(question: dict, answer: str | None):
    """As in the previous concepts: the value for a number, the normalized text otherwise."""
    if answer is None:
        return None
    return as_number(answer) if question["type"] == "number" else normalize(answer) or None


def vote_is_correct(question: dict, samples: list[dict]) -> bool:
    keys = [answer_key(question, s["answer"]) for s in samples]
    counts = Counter(key for key in keys if key is not None)
    if not counts:
        return False
    winner = counts.most_common(1)[0][0]
    return next(s["correct"] for s, key in zip(samples, keys) if key == winner)


def voting(k: int, draws: int = 200) -> tuple[dict, float]:
    """Each question's accuracy for a vote of k of the 2B's plain samples, and the tokens a vote uses."""
    rng = random.Random(0)
    accuracy, tokens = {}, []
    for record in load_run("plain.smaller")["results"]:
        # a "vote" of one is every sample on its own; larger votes are random choices of k
        picks = [[s] for s in record["samples"]] if k == 1 else [rng.sample(record["samples"], k) for _ in range(draws)]
        accuracy[record["id"]] = mean(vote_is_correct(questions[record["id"]], pick) for pick in picks)
        tokens += [sum(s["tokens"] for s in pick) for pick in picks]
    return accuracy, mean(tokens)


def thinking(budget: int) -> tuple[dict, float]:
    """Each question's accuracy for one 2B sample with this thinking budget, and the tokens it uses."""
    accuracy, tokens = {}, []
    for record in load_run("thinking.smaller")["results"]:
        replies = [s["by_budget"][str(budget)] for s in record["samples"]]
        accuracy[record["id"]] = mean(r["correct"] for r in replies)
        tokens += [r["thinking_used"] + r["tokens"] for r in replies]
    return accuracy, mean(tokens)


options = {"one sample": voting(1), "vote of 3": voting(3), "thinking, budget 84": thinking(84),
           "vote of 5": voting(5), "thinking, budget 253": thinking(253), "vote of 9": voting(9),
           "thinking, budget 759": thinking(759), "thinking, up to 4096": thinking(4096)}
print("Qwen3.5-2B, 84 questions:")
for name, (accuracy, tokens) in options.items():
    print(f"  {name:<22} {tokens:6.0f} tokens   {mean(accuracy.values()):6.1%} right")
```
```
Qwen3.5-2B, 84 questions:
  one sample                 84 tokens    92.9% right
  vote of 3                 254 tokens    96.1% right
  thinking, budget 84       234 tokens    85.5% right
  vote of 5                 423 tokens    97.1% right
  thinking, budget 253      416 tokens    85.5% right
  vote of 9                 759 tokens    97.5% right
  thinking, budget 759      794 tokens    91.9% right
  thinking, up to 4096     1994 tokens    95.2% right
```
*(runs live, shows output — read-only demo snippet, not graded. Real
committed runs: 20 plain samples and 10 thinking samples per question; votes
averaged over 200 random choices of k samples.)*

Matched by tokens actually used, the pairs are a vote of 3 and thinking with
a budget of 84 (about 240 tokens), a vote of 5 and a budget of 253 (about
420), and a vote of 9 and a budget of 759 (about 775). At each, voting was
well ahead. Thinking with no practical limit reached 95.2%, still below a
vote of 9 that used under half the tokens.

---

## Why short thinking did worse than none

The most striking row is the first thinking one: with a budget of 84, the 2B
was right 85.5% of the time, worse than the 92.9% it scored with no thinking
at all. Here's what happens when the budget runs out:

```python
print("Qwen3.5-2B thinking, by whether the budget ran out mid-thought:")
for budget in (84, 253, 422, 759, 4096):
    replies = [s["by_budget"][str(budget)] for r in load_run("thinking.smaller")["results"] for s in r["samples"]]
    cut = [r["correct"] for r in replies if r["forced"]]
    done = [r["correct"] for r in replies if not r["forced"]]
    finished = f"finished: {mean(done):6.1%} right" if done else "finished: none"
    print(f"  budget {budget:>4}: cut off in {len(cut) / len(replies):6.1%}, cut off: {mean(cut):6.1%} right, {finished}")
```
```
Qwen3.5-2B thinking, by whether the budget ran out mid-thought:
  budget   84: cut off in 100.0%, cut off:  85.5% right, finished: none
  budget  253: cut off in  96.7%, cut off:  85.1% right, finished:  96.4% right
  budget  422: cut off in  89.3%, cut off:  89.1% right, finished:  96.7% right
  budget  759: cut off in  76.3%, cut off:  90.3% right, finished:  97.0% right
  budget 4096: cut off in  14.6%, cut off:  81.3% right, finished:  97.6% right
```
*(runs live, shows output — read-only demo snippet, not graded.)*

When the budget runs out mid-thought, the model is made to answer from an
unfinished line of reasoning. At the smallest budget that happened every
time. Replies that finished their thinking were right about 97% of the time
at every budget, but that comparison flatters them: the questions a model
finishes quickly are likely the easier ones. The cleaner evidence is the
first row, where the same questions were answered worse with cut-off
thinking than with none. A thinking budget is only an option at a budget the
model can actually finish in.

---

## Is the difference real?

The same paired methods from
[Lesson 1](→ this module, why agents fail lesson, the same question run twice concept, the "how sure can we be of these numbers?" section)
apply: compare the two options question by question, count which does
better on how many, and resample whole questions for an interval on the
difference.

```python
import math


def sign_test(gains: int, losses: int) -> float:
    """If a change made no real difference, the chance of a split at least this lopsided, either way."""
    n = gains + losses
    tail = sum(math.comb(n, i) for i in range(max(gains, losses), n + 1)) / 2 ** n
    return min(1.0, 2 * tail)


def question_bootstrap(rates: list[float], repeats: int = 2000, seed: int = 0) -> tuple[float, float]:
    """A 95% interval for the average, resampling whole questions: each question's runs stay together."""
    rng = random.Random(seed)
    means = sorted(sum(rng.choices(rates, k=len(rates))) / len(rates) for _ in range(repeats))
    return means[int(0.025 * repeats)], means[int(0.975 * repeats) - 1]


def compare(a: str, b: str) -> None:
    first, second = options[a][0], options[b][0]
    better = sum(first[q] > second[q] for q in first)
    worse = sum(first[q] < second[q] for q in first)
    low, high = question_bootstrap([first[q] - second[q] for q in first])
    print(f"{a} vs {b}: better on {better} questions, worse on {worse}, p = {sign_test(better, worse):.1e}; "
          f"difference {mean(first.values()) - mean(second.values()):+.1%} (95%: {low:+.1%} to {high:+.1%})")


for a, b in [("vote of 3", "thinking, budget 84"), ("vote of 5", "thinking, budget 253"),
             ("vote of 9", "thinking, budget 759"), ("vote of 9", "thinking, up to 4096")]:
    compare(a, b)
```
```
vote of 3 vs thinking, budget 84: better on 48 questions, worse on 3, p = 2.0e-11; difference +10.6% (95%: +7.4% to +14.5%)
vote of 5 vs thinking, budget 253: better on 37 questions, worse on 2, p = 2.8e-09; difference +11.7% (95%: +7.4% to +16.4%)
vote of 9 vs thinking, budget 759: better on 24 questions, worse on 3, p = 4.9e-05; difference +5.6% (95%: +1.8% to +9.2%)
vote of 9 vs thinking, up to 4096: better on 15 questions, worse on 5, p = 4.1e-02; difference +2.3% (95%: -0.9% to +5.0%)
```
*(runs live, shows output — read-only demo snippet, not graded.)*

At matched tokens, voting beat thinking on far more questions than it lost,
with differences of 6 to 12 points whose intervals stay clear of zero. The
last row is less clear. Voting still won on more questions, and the sign test
gives p = 0.04, but the interval on the difference includes zero. Two methods
that disagree like that are a sign the evidence is thin; the honest
statement is that a vote of 9 did at least as well as unlimited thinking at
under half the tokens, not that it did clearly better.

---

## A stronger model instead

The third option is to ask a larger model once:

```python
def once(run_name: str) -> tuple[dict, float]:
    """Each question's accuracy for one sample of a model, and the tokens it uses."""
    records = load_run(run_name)["results"]
    accuracy = {r["id"]: mean(s["correct"] for s in r["samples"]) for r in records}
    return accuracy, mean(s["tokens"] for r in records for s in r["samples"])


options["Qwen3.5-4B, once"] = once("plain")
options["Qwen3.5-9B, once"] = once("stronger")
for name in ("Qwen3.5-4B, once", "Qwen3.5-9B, once"):
    accuracy, tokens = options[name]
    print(f"{name:<18} {tokens:4.0f} tokens   {mean(accuracy.values()):6.1%} right")
compare("vote of 5", "Qwen3.5-9B, once")
compare("Qwen3.5-4B, once", "vote of 5")
```
```
Qwen3.5-4B, once    106 tokens    98.9% right
Qwen3.5-9B, once     82 tokens    97.9% right
vote of 5 vs Qwen3.5-9B, once: better on 3 questions, worse on 11, p = 5.7e-02; difference -0.7% (95%: -4.6% to +2.9%)
Qwen3.5-4B, once vs vote of 5: better on 10 questions, worse on 7, p = 6.3e-01; difference +1.8% (95%: -0.9% to +5.5%)
```
*(runs live, shows output — read-only demo snippet, not graded. The 9B run
has 5 samples per question.)*

Neither comparison shows a clear difference: a 2B vote of 5 and a single
answer from the 4B or the 9B come out close, with intervals spanning zero.
What differs is what they cost. In tokens, the larger models are far
cheaper, but a token from a larger model takes more compute, and
[Lesson 2 measured](→ this module, accuracy latency cost and false refusals lesson, equal budgets need a stated unit concept, the "five options, three units" section)
the 9B's single answer at nearly four times the GPU-seconds of a 2B one. On a
paid API, the price per token of each model would decide it. The unit decides
the winner, again.

What this data says, then, is narrow but useful. On easy exact-answer
lookups, spending a fixed number of tokens on several short samples and a
vote did better than spending them on one longer chain of thought, and about
as well as a bigger model. On harder questions, or where answers can't be
compared exactly, the research gives no reason to expect the same order.

---

## Quiz cards

> **Q1.** Why compare the options by the tokens they actually generated
> rather than by their budgets?
> - A) Because budgets are only rough estimates of cost
> - B) A budget caps the thinking; the answer costs tokens too ✅
> - C) Because votes use fewer tokens than their budget
> - D) Because tokens and budgets are the same thing
>
> *Explanation: a thinking budget of 253 generated about 416 tokens once the
> answer is counted. Comparing it with a vote of 3 at 254 tokens would give
> thinking about 60% more to spend.*

> **Q2.** With a thinking budget of 84, the 2B did worse than with no
> thinking at all. Why?
> - A) Thinking always hurts small models like the 2B
> - B) It was always cut off mid-thought and forced to answer ✅
> - C) The thinking run used a different set of questions
> - D) The grader treated thinking replies differently
>
> *Explanation: every reply at that budget was cut off. On the same
> questions, answering straight away scored 92.9%, and answering from a
> half-finished line of reasoning 85.5%.*

> **Q3.** A vote of 9 beat unlimited thinking on 15 questions and lost on 5
> (sign test p = 0.04), but the bootstrap interval on the difference included
> zero. What's the honest summary?
> - A) Voting is clearly better, since it won more questions
> - B) At least as good for half the tokens; a real gap is unclear ✅
> - C) Thinking is clearly better, since the interval includes zero
> - D) The two methods can't be compared at all
>
> *Explanation: when two reasonable tests disagree, the difference is near
> the edge of what the data can show. What's solid is the cost: the vote used
> 759 tokens to thinking's 1,994.*

> **Q4.** Does this lesson's data show that voting beats thinking in
> general?
> - A) Yes, by a wide margin at every budget tested
> - B) No: only for easy exact lookups; it depends on the task ✅
> - C) Yes, but only for models as small as these
> - D) No, because the thinking runs were broken
>
> *Explanation: Snell et al. and Chen et al. both found that how best to
> spend compute depends on how hard the questions are. These lookups are easy
> for these models, which is when voting is expected to do well.*

---

*(End of this concept. The next concept is about free-text answers, where
there's no exact answer to count.)*
