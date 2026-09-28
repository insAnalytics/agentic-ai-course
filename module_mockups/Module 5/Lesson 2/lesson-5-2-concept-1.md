# Module 5, Lesson 2 — Concept 1: Measure before you change anything

> **Note for the site build:**
> - **Lesson 2's shared setup,** loaded for every demo and exercise in the
>   lesson: all of Lesson 1's `lib.py` (from `COUNT_TOKENS` through
>   `build_prompt`), followed by `load_queries`, `normalize`, `is_relevant`
>   and `answerable`, exactly as the next concept shows them. This concept
>   uses them before that concept explains them, which the prose says.
> - **The data loader also fetches `public/data/rag/queries.json`** and
>   writes it to `/data/rag/queries.json`, alongside the documents, on the
>   first Run.
> - Both demos are self-contained and put `STOPWORDS` back when they
>   finish, since the interpreter is shared across the page.

---

## A fix that works

Lesson 1 ended with a failure. Asked "What does REG-1007 mean?", keyword
matching ranked three Prometheus pages first, because they shared "what"
and "does" with the question while the error-code table shared only
`reg-1007`.

The obvious fix is to treat question words like "what" and "does" as
stopwords, so they stop counting. Here it is, tried on that question:

```python
QUESTION_WORDS = {"what", "does", "mean", "how", "which", "why", "do", "can", "should"}
question = "What does REG-1007 mean?"

index = KeywordIndex()
index.add(load_sections())
print("before:", [(r["doc_id"], r["section"]) for r in index.search(question)])

STOPWORDS |= QUESTION_WORDS
try:
    tweaked = KeywordIndex()
    tweaked.add(load_sections())
    print("after: ", [(r["doc_id"], r["section"]) for r in tweaked.search(question)])
finally:
    # put the stopwords back, so later demos on this page start from the original list
    STOPWORDS -= QUESTION_WORDS
```
```
before: [('prometheus-docs/guides/multi-target-exporter.md', 'Querying multi-target exporters with Prometheus'), ('prometheus-docs/guides/open_metrics_2_0_migration.md', 'Specification Terminology Changes'), ('prometheus-docs/instrumenting/writing_exporters.md', 'Drop less useful statistics')]
after:  [('D01', 'Creating an agent'), ('D01', 'Errors'), ('D02', 'Request errors')]
```
*(runs live, shows output — read-only demo snippet, not graded)*

It works. All three results are now the registry's own pages about
`REG-1007`, and one of them is the error-code table. On the evidence of
one question, this fix should ship.

---

## Did it break anything?

One question can show that a change helps. It can't show that the change
doesn't hurt, because the damage, if there is any, happens to other
questions. To see it, run the change over many questions whose answers are
known in advance, before and after.

This module has such a set: 46 questions about the corpus, each labelled
with the passages that answer it. The next concept shows how it's built.
For now, one function is enough: `answerable(results, query)` says whether
a list of results contains every part of a query's answer. Here's the fix
again, over every question that has a labelled answer:

```python
QUESTION_WORDS = {"what", "does", "mean", "how", "which", "why", "do", "can", "should"}
queries = [q for q in load_queries()["main"] if q["evidence"]]

def answered(index: KeywordIndex, k: int = 5) -> set:
    """The ids of the queries whose top k results hold every part of the answer."""
    return {q["id"] for q in queries if answerable(index.search(q["query"], k), q)}

baseline = KeywordIndex()
baseline.add(load_sections())
before = answered(baseline)

STOPWORDS |= QUESTION_WORDS
try:
    tweaked = KeywordIndex()
    tweaked.add(load_sections())
    after = answered(tweaked)
finally:
    STOPWORDS -= QUESTION_WORDS

print(f"{len(queries)} questions with labelled answers")
print(f"answered in the top 5: {len(before)} before, {len(after)} after")
by_id = {q["id"]: q["query"] for q in queries}
for label, ids in [("gained", after - before), ("lost", before - after)]:
    for query_id in sorted(ids):
        print(f"  {label:<7}{query_id}  {by_id[query_id]}")
```
```
43 questions with labelled answers
answered in the top 5: 19 before, 23 after
  gained q05  What should I do first if a key might have leaked?
  gained q09  What does REG-1007 mean?
  gained q20  After deploying a new registry key, how do I check that it works?
  gained q21  What is the registry's rate limit, and what error do you get when you go over it?
  gained q31  What depends on kb-search?
  lost   q01  Can I put my agent on the most powerful model?
```
*(runs live, shows output — read-only demo snippet, not graded)*

The fix is better overall, 23 questions answered against 19, and it's
still not free: one question that worked now fails. Looking at why is
instructive. "Can I put my agent on the most powerful model?" was only ever
answered because the FAQ's heading, "Can my agent use the biggest model?",
shares the word "can" with it. Once "can" stopped counting, that lucky
match went, and a Prometheus page about comparing monitoring systems took
its place. The baseline's success on that question was an accident of
wording, and nothing about the single REG-1007 test could have revealed
it.

Three things follow, and this lesson is about each:

- **Improvements are judged on a set, not an example.** The example you
  tried is the one you were thinking about; the regressions are in the
  ones you weren't.
- **A total hides movement.** Four more answered is really five gained and
  one lost. Which ones moved matters as much as how many.
- **Small sets are noisy.** With 43 scored questions, each one is worth
  more than 2 points of the total. Whether a gain of four is real or luck is
  a question for [reading the numbers honestly](→ this lesson, reading the numbers honestly concept).

---

## Measure first

This is the habit
[Module 4 built for context](→ Module 4, the context budget lesson, watching it grow across the loop concept, measure first):
measure what a request carries before deciding what to cut. Retrieval
needs the same discipline even more, because its failures are silent. A
bad search doesn't crash. It hands the model the wrong passages, and the
model writes a fluent answer from them.

So the order for the rest of this module is fixed: every technique is run
against the same labelled questions, and kept only if the numbers say so.
When the numbers disagree with a technique's reputation, the lessons say
so.

One boundary: this lesson measures **retrieval**, whether the right
passages come back. Whether the model then writes a good answer from them
is a separate measurement, with its own methods, and Module 7 covers it.
Good retrieval is necessary for a good answer, not sufficient.

---

## Quiz cards

> **Q1.** Adding question words to the stopwords fixed "What does REG-1007
> mean?". Why isn't that enough evidence to keep the change?
> - One question can show a gain but can't show losses, which happen on other questions ✅
> - The fix only worked because REG-1007 is an unusual identifier
> - Stopwords can't be changed after a corpus has been indexed
> - The result list still contained pages that weren't about REG-1007
>
> *Explanation: a change's damage lands on questions you didn't test.
> Here the same fix broke "Can I put my agent on the most powerful model?".
> Only a run over many labelled questions shows both sides. After the fix,
> all three results were about REG-1007.*

> **Q2.** The fix took answered questions from 19 to 23. Why does the
> lesson describe that as five gained and one lost?
> - Because the total hides which questions changed, and a loss may matter more than a gain ✅
> - Because one of the gained questions was counted twice in the total
> - Because a question only counts as gained if it moved into first place
> - Because lost questions are subtracted twice when computing the total
>
> *Explanation: a net change of four could be four gains, or fifty gains
> and forty-six losses. Knowing which questions moved lets you see whether
> the losses are ones you care about, and why they happened.*

> **Q3.** Why did "Can I put my agent on the most powerful model?" stop
> being answered?
> - Its only match to the right section was the word "can", which the fix stopped counting ✅
> - The FAQ section about the biggest model was removed from the index
> - Question words were removed from the sections but not from the question
> - The fix made every section score zero for questions containing "can"
>
> *Explanation: the FAQ heading "Can my agent use the biggest model?"
> shared "can" with the question; the meaningful words ("powerful" and
> "biggest") never matched. The baseline's success was an accident of
> wording. The fix removed question words from both sides consistently.*

> **Q4.** What does this lesson's measurement tell you, and what doesn't
> it?
> - Whether the right passages come back, not whether the model's answer from them is good ✅
> - Whether the model's answer is correct, not how long retrieval took
> - Whether an answer is well written, not whether it's correct
> - How often users ask each question, not whether retrieval handles them
>
> *Explanation: the labels say which passages answer each question, so the
> measurement is of retrieval. The answer the model writes from those
> passages is measured separately, in Module 7. Right passages are
> necessary for a right answer, but they don't guarantee one.*
