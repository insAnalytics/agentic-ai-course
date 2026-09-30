# Module 6, Lesson 4 — Concept 5: Questions built on a false premise

---

## When the question itself is wrong

Some questions can't be answered as asked. "Since standard-tier agents can
use `claude-opus`, what do I need to do to move my agent onto it?" assumes
something the documents contradict. Answering the question as asked means
agreeing with the mistake; the useful answer says what's wrong first.

Hu et al.'s [FalseQA](https://arxiv.org/abs/2307.02394) (ACL 2023) studied
these false-premise questions, with examples as plain as "How many eyes
does the sun have?". They found language models were easily taken in by
them, and they collected 2,365 such questions, each with an explanation of
what's wrong with it, which they called a rebuttal. Fine-tuning on a few
hundred examples taught models to tell these questions apart and to rebut
them. Newer models handle the plain kind well, the authors of the 2025
[MultiHoax](https://arxiv.org/abs/2506.00264) benchmark observe, which is why
research has moved to subtler premises.

An agent's premises are rarely about the sun. They're about the user's own
systems: a limit, a tier, a date, which only the retrieved sources can
confirm. And a model that goes along with what the user asserts is
[the sycophancy Module 1 described](→ Module 1, the training pipeline lesson, preference training and how message roles are learned concept, the "sycophancy: a real, documented side effect" subsection).

---

## An experiment, and what its counts say

Set F turns each of this lesson's 40 facts into a pair of questions that
differ only in their premise, one true and one false, with the same sources.
Qwen3.5-4B answered each 10 times under two prompts. Both said to end with an
`ANSWER:` line, or instead, if the question assumes something the sources
contradict, with `PREMISE: FALSE` and the correction. The second also asked it
to list and check the question's assumptions first. Here's a pair, and how
often each kind of question ended on `PREMISE: FALSE`:

```python
from collections import Counter

premise_runs = load_run("premises")["results"]
questions = {q["id"]: q for q in load_set("set-f")["questions"]}
print(questions["v36-false"]["question"])
print(questions["v36-true"]["question"])
print()
for premise in ("false", "true"):
    for prompt in ("allowed", "check_first"):
        outcomes = Counter(s["outcome"] for r in premise_runs if r["premise"] == premise and r["prompt"] == prompt
                           for s in r["samples"])
        print(f"{premise:>5}-premise questions, {prompt:<12} ended on PREMISE: FALSE {outcomes['rejected']:>3} of 400")
```
```
Since the standby alert only fires once it is 30 minutes behind, would we get an alert if the standby were five minutes behind?
Since an alert fires when the standby falls more than 60 seconds behind, would we get an alert if the standby were five minutes behind?

false-premise questions, allowed      ended on PREMISE: FALSE  59 of 400
false-premise questions, check_first  ended on PREMISE: FALSE 238 of 400
 true-premise questions, allowed      ended on PREMISE: FALSE  11 of 400
 true-premise questions, check_first  ended on PREMISE: FALSE  48 of 400
```
*(runs live, shows output — read-only demo snippet, not graded. Real
Qwen3.5-4B replies from the committed run, sorted by the last marker in
each reply.)*

Read at face value, these counts say the model rejected only 15% of false
premises when merely allowed to, 60% when asked to check first, and paid
for it by rejecting 12% of true ones. This page was planned around that
reading. Reading the replies themselves changed it.

---

## What the replies actually say

Here are the endings of three replies to false-premise questions that were
counted as "answered":

```python
replies = {(r["id"], r["prompt"]): r["samples"] for r in premise_runs}
for question_id, sample in [("v32-false", 9), ("v21-false", 8), ("v35-false", 9)]:
    text = replies[(question_id, "allowed")][sample]["text"].strip()
    print(f"{question_id} (allowed, sample {sample}): ...{text[-260:]}")
    print()
```
```
v32-false (allowed, sample 9): ...itoring refreshes its agent list once an hour is false; according to the documentation, it asks the registry for the agent list every 30 seconds. Consequently, a new agent will appear on the dashboards within a minute of being created.

ANSWER: Within a minute

v21-false (allowed, sample 8): ...turn HTTP 429 with error `REG-1009`, not HTTP 503 with `REG-1011`. When a client encounters this limit, it should wait for the number of seconds specified in the `Retry-After` header before retrying.
ANSWER: Wait the number of seconds in the Retry-After header

v35-false (allowed, sample 9): ...as up to date. Additionally, no alerts fired regarding this lag, causing the outage to last 42 minutes instead of the expected 5 minutes.

ANSWER: The failover took so long because the standby fell 38 minutes behind the primary and nothing alerted on that lag.

```
*(runs live, shows output — read-only demo snippet, not graded. Real
replies from the committed run.)*

Each one says the premise is wrong, gives the true fact, and then answers
the question correctly. That's the rebuttal FalseQA asked for. The count
scored them as failures because they ended on `ANSWER:`, not `PREMISE:
FALSE`.

To see how typical that is, 30 of the 341 "answered" replies were drawn at
random and read in full:

```python
# 30 of the 341 replies that answered a false-premise question under the "allowed" prompt, drawn at random,
# then labelled by reading each in full: C = said the premise was wrong and answered correctly,
# I = answered correctly from the true fact without mentioning the premise, W = answered wrongly
SAMPLED = [("v19", 1), ("v08", 8), ("v24", 7), ("v40", 2), ("v03", 5), ("v04", 8), ("v32", 9), ("v05", 9),
           ("v21", 8), ("v36", 2), ("v04", 0), ("v31", 0), ("v12", 8), ("v03", 0), ("v05", 5), ("v26", 7),
           ("v25", 9), ("v04", 6), ("v14", 5), ("v05", 7), ("v34", 6), ("v26", 2), ("v04", 1), ("v35", 3),
           ("v07", 4), ("v13", 3), ("v39", 1), ("v39", 0), ("v04", 2), ("v35", 9)]
LABELS = "CWCCCCCCCWWCICIICCCICICCCCCCCC"
assert all(replies[(f"{item}-false", "allowed")][i]["outcome"] == "answered" for item, i in SAMPLED)
print(dict(Counter(LABELS)))
```
```
{'C': 22, 'W': 3, 'I': 5}
```
*(runs live, shows output — read-only demo snippet, not graded. The labels
are one reader's judgement, written into the code; the assertion checks
that each sampled reply really was counted as "answered".)*

22 said the premise was wrong and answered correctly, 5 more answered
correctly from the true fact without mentioning the premise, and 3 answered
wrongly. Thirty replies can't give a precise rate, but they're enough to
show what the count was measuring: whether the model *declined* to answer,
not whether it *noticed* the false premise. With the plain prompt, it
usually noticed and answered anyway, which is arguably the better response.

The true-premise side has the mirror-image problem:

```python
for question_id, sample in [("v22-true", 1), ("v38-true", 2), ("v08-true", 1)]:
    reply = replies[(question_id, "check_first")][sample]
    print(questions[question_id]["question"])
    print(f"  finished: {reply['finished']}, ...{reply['text'].strip()[-200:]!r}")
    print()
```
```
Since agent ids must be unique, can I create a staging copy of research_agent with the same id?
  finished: True, ...'tate that reusing an agent ID results in an error code (REG-1006), it is not possible to create a staging copy with the same ID.\n\nPREMISE: FALSE Agent ids must be unique; reusing one returns REG-1006.'

Since reads still work while the registry is in maintenance, will the dashboards keep showing agents while the registry is in maintenance?
  finished: True, ...'he sources do not confirm that dashboards will keep showing agents while the registry is in maintenance; in fact, one source notes that when the registry is down, dashboards may show no agents at all>'

Since only RegistryUnreachable pages outside paging hours, which alerts could wake me up during my on-call week?
  finished: False, ...'age? No.\nIs there any source saying `RegistryUnreachable` *never* pages? No.\nSo the answer should list all three.\n\nLet\'s double check the "PREMISE: FALSE" condition.\n"If the question assumes something'

```
*(runs live, shows output — read-only demo snippet, not graded. Real
replies from the committed run.)*

- **The first uses the marker to say "no".** The premise is true, and the
  answer, that ids can't be reused, is right. The model just put it on the
  wrong line.
- **The second is a real mistake.** It confuses maintenance with an outage
  and rejects a true premise.
- **The third never finished.** It ran out of tokens while quoting the
  instruction to itself, and the grader found `PREMISE: FALSE` in the quote.

Reading all 59 true-premise "rejections" gives the same picture. About a
dozen, by one reader's count, are real misreadings like the second. Four
are cut-off replies that the grader misread, like the third. Most of the
rest use the marker to answer "no" or to say the sources don't cover
something, neither of which is what it was for.

---

## What this means for a real agent

Three lessons, in order of how far they reach:

- **A grade built on a format measures the format.** The counts above are
  accurate counts of which marker each reply ended on, and a poor measure of
  what they were meant to capture. It's the trap
  [Lesson 1 warned about](→ this module, why agents fail lesson, reliable across wordings concept, the "is it the model or the wording?" section):
  a test that asks something different from what you meant measures the
  wrong thing, and one of its checks was whether the grader accepts every
  correct way of giving the answer. Here it didn't. Read a
  sample of the outputs before trusting any automatic grade, and when the
  behaviour you care about is a matter of meaning, grade it with a judge
  you've checked, as in
  [the second concept](→ this lesson, checking the checker concept).
- **Don't make the model choose between correcting and answering.** The
  either/or format pushed a model that wanted to do both into picking one. A
  format that asks for the assumption check and the answer together, with
  the correction stated, matches the rebuttal FalseQA describes, and it lets
  a person see both.
- **A premise is a claim, so it can be checked like one.** Taking the
  premise out of the question and running the support check on it against
  the sources is a natural design. On the built pairs in the second concept,
  both model judges passed none of the 40 altered claims when given the
  right chunk. That's encouraging for the checking step, but the hard parts,
  pulling out the premise and finding the chunk that settles it, weren't
  tested here.

---

## Quiz cards

> **Q1.** Why is a false-premise question a reliability problem for an
> agent, not just for a chatbot?
> - A) Because agents can't read questions with conditions in them
> - B) Answering as asked agrees with a mistake about their systems ✅
> - C) Because false premises only ever occur in agent tools
> - D) Because agents always refuse questions they can't verify
>
> *Explanation: an agent's premises are about limits, tiers and dates that
> only its sources can confirm. Going along with a wrong one gives an answer
> built on it, which is the kind of agreement with the user Module 1 called
> sycophancy.*

> **Q2.** The count said Qwen3.5-4B rejected 59 of 400 false premises under
> the plain prompt. What did reading a sample of the "answered" replies show?
> - A) Most went along with the false premise and answered it
> - B) Most said the premise was wrong, then answered correctly ✅
> - C) Most were cut off before they reached an answer
> - D) Most repeated the question back without answering
>
> *Explanation: 22 of 30 sampled replies corrected the premise and answered
> correctly. They were scored as failures only because they ended on
> `ANSWER:` rather than `PREMISE: FALSE`.*

> **Q3.** What did the marker-based count actually measure?
> - A) Whether the model noticed the false premise at all
> - B) Whether the model's last line declined to answer ✅
> - C) Whether the model's final answer was correct
> - D) How many assumptions the model listed and checked
>
> *Explanation: a count built on which marker a reply ends with measures the
> marker. Noticing a false premise is a matter of meaning, which needs a
> judge that's been checked, or a person reading.*

> **Q4.** A true-premise question was counted as rejected because an
> unfinished reply quoted the instruction "PREMISE: FALSE" to itself. Whose
> mistake is that?
> - A) The model's, for mentioning the marker while thinking
> - B) The grader's, for reading a quote as an answer ✅
> - C) The question's, for being built on a premise at all
> - D) Nobody's, since the count of markers is still accurate
>
> *Explanation: the grader took the last occurrence of the marker anywhere in
> the text. A reply that ran out of tokens while quoting its instructions
> gave no answer at all, and the grader counted it as a rejection.*

> **Q5.** Why check a premise with the support check from earlier in the
> lesson?
> - A) Because a premise the user asserts is itself a claim ✅
> - B) Because the support check is cheaper than answering
> - C) Because premises never appear anywhere in the sources
> - D) Because the support check rewrites the question for you
>
> *Explanation: "since standard-tier agents can use claude-opus" is a claim
> like any other. Checked against the right source, it fails, and the agent
> can say so before answering. Extracting the premise and finding that
> source are the harder parts.*

---

*(End of this concept. The last concept is about claims with no source to
check against, and what checking them can and can't do.)*
