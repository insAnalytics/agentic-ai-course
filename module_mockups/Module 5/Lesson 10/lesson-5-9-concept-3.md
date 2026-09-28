# Module 5, Lesson 9 — Concept 3: Abstaining when retrieval is weak

> **Note for the site build:**
> - **New shared code** for every demo and exercise from this concept to the
>   end of the lesson: `DECLINE` and `declined`, exactly as in the code block
>   in "What a threshold can't see".
> - The last demo needs the fake client (`REACT_FAKE_CLIENT` then
>   `RECORDING_CLIENT`); its reply is scripted.
> - The first two demos run every labelled question through retrieval; allow
>   several seconds.

---

## The answer that shouldn't be given

Some questions have no answer in the sources: the corpus never recorded
it, or retrieval didn't find it. A model asked anyway will usually still
produce an answer, from its general knowledge or by filling the gap with
something plausible, as
[Module 1's lesson on hallucination](→ Module 1, how LLMs generate text lesson, hallucination as a direct consequence concept)
explained. In a system built to answer from sources, that answer is worse
than none: it looks as sourced as the rest, and nothing in it is.

So the system needs to be able to say "the sources don't say", and there are
two places to decide it: in code, before the model is called, and in the
model's own reply. This concept looks at both.

---

## A signal before the model is called

The reranker scores how well each candidate answers the question, so its
best score is a natural measure of whether retrieval found anything
answer-like. Here are those top scores for every labelled question, grouped
by what retrieval actually achieved:

```python
retriever = AnswerRetriever()
queries = load_queries()["main"]
rows = []
for query in queries:
    results = retriever.search(query, k=5)
    if not query["evidence"]:
        kind = "no answer in corpus"
    elif answerable(results, query):
        kind = "answer retrieved"
    else:
        kind = "answer missed"
    rows.append((results[0]["score"], kind, query["id"]))

for kind in ("answer retrieved", "answer missed", "no answer in corpus"):
    scores = sorted(score for score, k, _ in rows if k == kind)
    print(f"{kind:<20} {len(scores):>2} questions, top scores from {scores[0]:>5.2f} to {scores[-1]:>5.2f}, "
          f"median {scores[len(scores) // 2]:.2f}")
print("\nthe ten lowest top scores:")
for score, kind, query_id in sorted(rows)[:10]:
    print(f"  {score:>5.2f}  {query_id}  {kind}")
```
```
answer retrieved     36 questions, top scores from -4.02 to  9.57, median 6.00
answer missed         7 questions, top scores from -5.58 to  4.38, median 0.82
no answer in corpus   3 questions, top scores from -1.03 to  4.93, median -0.62

the ten lowest top scores:
  -5.58  q33  answer missed
  -5.52  q34  answer missed
  -4.02  q25  answer retrieved
  -2.10  q04  answer retrieved
  -1.03  q37  no answer in corpus
  -0.68  q24  answer retrieved
  -0.62  q38  no answer in corpus
   0.31  q05  answer retrieved
   0.36  q26  answer missed
   0.82  q44  answer missed
```
*(runs live, shows output — read-only demo snippet, not graded)*

The groups overlap, but they're not the same. Questions whose answer was
retrieved mostly score high, with a median of 6.00. Questions with no answer
in the corpus sit lower, and so do the ones retrieval missed. The overlap is
the problem: three of the ten lowest scores belong to questions whose answer
*was* retrieved.

Two of those three, q24 and q25, are follow-up questions searched exactly as
asked, which Lesson 7 showed should be rewritten first. That's a reminder
that a threshold measures the whole pipeline in front of it: change the
retrieval, and the right threshold changes too.

---

## Choosing a threshold

Abstaining below a threshold trades one kind of mistake for another:

```python
retriever = AnswerRetriever()
queries = load_queries()["main"]
outcomes = []
for query in queries:
    results = retriever.search(query, k=5)
    retrieved = bool(query["evidence"]) and answerable(results, query)
    outcomes.append((results[0]["score"], retrieved, not query["evidence"]))

print(f"{'abstain below':>13}{'answers lost':>14}{'no-answer caught':>18}{'misses caught':>15}")
for threshold in (-3, -1, 0, 1, 2):
    below = [(retrieved, no_answer) for score, retrieved, no_answer in outcomes if score < threshold]
    lost = sum(retrieved for retrieved, _ in below)
    caught = sum(no_answer for _, no_answer in below)
    misses = len(below) - lost - caught
    print(f"{threshold:>13}{f'{lost} of 36':>14}{f'{caught} of 3':>18}{f'{misses} of 7':>15}")
```
```
abstain below  answers lost  no-answer caught  misses caught
           -3       1 of 36            0 of 3         2 of 7
           -1       2 of 36            1 of 3         2 of 7
            0       3 of 36            2 of 3         2 of 7
            1       4 of 36            2 of 3         4 of 7
            2       7 of 36            2 of 3         5 of 7
```
*(runs live, shows output — read-only demo snippet, not graded)*

- **At 0,** the system declines 2 of the 3 questions with no answer in the
  corpus, and 2 of the 7 it would have got wrong anyway, at the cost of 3
  questions it could have answered.
- **Lower,** fewer good answers are lost, but fewer bad ones are caught.
- **Higher,** it starts refusing answerable questions faster than it catches
  anything new.

There's no right threshold in general, only a right one for what a mistake
costs. An internal help tool, where a wrong answer wastes someone's
afternoon, can afford to decline more often. A tool that acts on its answers
should decline more readily still. The labelled set is what lets you see the
trade in numbers rather than guess at it.

---

## What a threshold can't see

The highest-scoring question with no answer in the corpus is "Which on-call
engineer handled INC-2093?", at 4.93, well above any sensible threshold. A
score can't catch it, so the model has to: the instructions ask it to say
"the sources don't say" rather than guess, and code needs to recognise when
it has:

```python
DECLINE = "the sources don't say"

def declined(answer: str) -> bool:
    """Whether the model declined, recognised by the phrase the instructions ask it to use."""
    return DECLINE in answer.lower().replace("\u2019", "'")
```
*(defined once here and already loaded for every demo and exercise from here to the end of this lesson)*

Here's the question, with a scripted reply:

```python
query = next(q for q in load_queries()["main"] if q["id"] == "q39")
results = AnswerRetriever().search(query, k=5)
print(f"{query['query']}\ntop score {results[0]['score']:.2f}: {results[0]['doc_id']} | {results[0]['section']}")

request = assemble_request(query["query"], results, budget=1500)
reply = ("The sources don't say which on-call engineer handled INC-2093. The timeline says "
         "RegistryUnreachable paged the on-call engineer at 14:11, but doesn't name them [S1].")
client = FakeLLMClient([[TextBlock(reply)]])
answer = "".join(block.text for block in client.create(request["messages"]).content if block.type == "text")
print(f"\ndeclined: {declined(answer)}; statements without a citation: {check_citations(answer, request['sources'])['uncited']}")
```
```
Which on-call engineer handled INC-2093?
top score 4.93: D11 | Incident INC-2093: registry outage during database failover > Timeline

declined: True; statements without a citation: ["The sources don't say which on-call engineer handled INC-2093."]
```
*(runs live, shows output — read-only demo snippet, not graded. The model's reply is scripted to show the mechanics.)*

Retrieval did its job. It found exactly the right document, the incident's
timeline, which is why the score is high. The specific fact asked for just
isn't in it, and only something that reads the sources against the question
can notice that.

A decline is an answer, not a failure, so it shouldn't be treated like an
ordinary statement. Here `check_citations` flags it as uncited, which is
technically true and practically wrong. Checking `declined` first lets the
answer step handle declines separately.

Recognising a decline by a fixed phrase is fragile: a model that says "the
documents don't mention" instead slips through. A sturdier design asks for
[structured output](→ Module 1, structured output and tool calling lesson, constrained decoding concept)
with an explicit field, such as `"answerable": false`, so the decision is data
rather than wording. The phrase check keeps this lesson's code short; the
principle is the same.

---

## Quiz cards

> **Q1.** Why is an answer from the model's general knowledge worse than
> no answer, in a system meant to answer from sources?
> - It looks as sourced as the rest but isn't, so a reader can't tell it apart ✅
> - General knowledge is always out of date
> - It uses more tokens than an answer from sources
> - The model refuses to cite general knowledge
>
> *Explanation: the value of answering from sources is that each
> statement can be traced. An unsourced answer in the same voice removes
> that without anyone noticing.*

> **Q2.** Abstaining below a top score of 0 declined 2 of 3 questions with
> no answer, but also 3 answerable ones. What decides whether that's the
> right threshold?
> - What a wrong answer costs compared with a missed one, in this system ✅
> - Whether it catches all three questions with no answer
> - The reranker's documentation, which sets the threshold
> - Nothing: the lowest threshold that catches anything is always right
>
> *Explanation: every threshold trades refused good answers for caught
> bad ones. The labelled set shows the trade in numbers; the system's
> purpose decides which side to favour.*

> **Q3.** "Which on-call engineer handled INC-2093?" scored 4.93. Why
> can't a score threshold catch it?
> - Retrieval found the right document; the specific fact just isn't in it ✅
> - The reranker made a mistake and scored the wrong chunk
> - The question is too short to score reliably
> - The threshold only applies to identifier questions
>
> *Explanation: the score measures how relevant the best chunk is, and
> the incident's timeline is highly relevant. Noticing that it doesn't name
> the engineer takes reading the source against the question.*

> **Q4.** Why is detecting a decline by the phrase "the sources don't say"
> fragile, and what's sturdier?
> - A model can decline in other words; an explicit field in structured output is sturdier ✅
> - The phrase is too long for a regular expression; a shorter one is sturdier
> - Models never use that phrase; a threshold is sturdier
> - Declines can't be detected; the reranker must decide instead
>
> *Explanation: matching wording depends on the model's wording.
> Structured output with a field like `"answerable": false` makes the
> decision part of the data, so code doesn't have to guess.*
