# Module 5, Lesson 3 — Concept 4: Comparing chunkings fairly

> **Note for the site build:**
> - The shared setup now includes the previous exercise's reference
>   solution, `pack_blocks` and `structured_chunks`.
> - No new shared code. The second and third demos each define
>   `within_budget` themselves; each demo is self-contained.
> - The demos are slow by design: each builds several keyword indexes over
>   the whole corpus. If the sandbox has a time limit, allow about half a
>   minute.

---

## At a fixed k, bigger chunks win

The obvious way to compare chunkings is Lesson 2's: build an index from
each, run the questions, and compare answerable@5. Here are four of them,
with two more columns: how many tokens each sends the model per question,
and how big the chunks it retrieves are:

```python
from statistics import median

documents = load_documents()
queries = [q for q in load_queries()["main"] if q["evidence"]]
chunkings = {
    "heading sections": [s for d in documents for s in split_sections(d)],
    "fixed 200": [c for d in documents for c in fixed_chunks(d, 200)],
    "fixed 400": [c for d in documents for c in fixed_chunks(d, 400)],
    "structured 200": [c for d in documents for c in structured_chunks(d, 200)],
}

print(f"{'chunking':<18}{'answerable@5':>13}{'tokens sent':>13}{'median chunk':>14}{'median retrieved':>18}{'cut code':>10}")
for name, chunks in chunkings.items():
    index = KeywordIndex()
    index.add(chunks)
    results = [index.search(q["query"], 5) for q in queries]
    answered = sum(answerable(r, q) for r, q in zip(results, queries)) / len(queries)
    sent = sum(count_tokens(c["text"]) for r in results for c in r) / len(queries)
    retrieved = median(count_tokens(c["text"]) for r in results for c in r)
    chunk = median(count_tokens(c["text"]) for c in chunks)
    # chunks holding a code block with only one of its fences
    cut = sum(c["text"].count(FENCE) % 2 for c in chunks)
    print(f"{name:<18}{answered:>13.3f}{sent:>13,.0f}{chunk:>14,.0f}{retrieved:>18,.0f}{cut:>10}")
```
```
chunking           answerable@5  tokens sent  median chunk  median retrieved  cut code
heading sections          0.442        5,774           107               865         0
fixed 200                 0.558          952           200               200       155
fixed 400                 0.651        1,854           400               400       106
structured 200            0.535          596           128               108       106
```
*(runs live, shows output — read-only demo snippet, not graded. Each demo builds several indexes over the whole corpus, so it takes a few seconds.)*

By answerable@5, 400-token fixed chunks win clearly. But look at what each
one sends: five 400-token chunks are about 1,850 tokens a question, more
than three times what structured chunking sends. Five chunks of any size
are "five results", so a comparison at a fixed *k* rewards whichever
chunking packs the most text into each result. It isn't comparing how well
each one finds the answer; it's comparing how much each is allowed to send.

The last two columns show a second problem. Heading sections have a median
size of 107 tokens, but the ones retrieved have a median of 865. Lesson 1's
keyword search counts shared words, and a long chunk shares more words with
any question simply by containing more of them. So this search *prefers*
long chunks, and any comparison of chunk sizes run through it is tilted
towards the large ones. That's a property of this scorer, not of chunking:
Lesson 5's keyword scoring corrects for length, and search by meaning tends
the other way, since one vector for a long chunk blurs its topics together.

---

## Compare at an equal token budget

The fair comparison gives every chunking the same number of tokens to fill
and asks which one fits the answer into them. `within_budget` wraps any
search: it takes results in rank order and stops when the next chunk would
go over the budget.

```python
def within_budget(search, budget: int):
    """A search that returns ranked chunks until the next one would take the total over budget tokens."""
    def budgeted(question: str, k: int) -> list[dict]:
        results, used = [], 0
        for chunk in search(question, 100):
            size = count_tokens(chunk["text"])
            if used + size > budget:
                break
            results.append(chunk)
            used += size
        return results
    return budgeted

documents = load_documents()
queries = [q for q in load_queries()["main"] if q["evidence"]]
chunkings = {
    "heading sections": [s for d in documents for s in split_sections(d)],
    "fixed 200": [c for d in documents for c in fixed_chunks(d, 200)],
    "fixed 200, overlap 50": [c for d in documents for c in fixed_chunks(d, 200, 50)],
    "fixed 400": [c for d in documents for c in fixed_chunks(d, 400)],
    "structured 100": [c for d in documents for c in structured_chunks(d, 100)],
    "structured 200": [c for d in documents for c in structured_chunks(d, 200)],
    "structured 400": [c for d in documents for c in structured_chunks(d, 400)],
}
budgets = [500, 1000, 2000]

print(f"{'chunking':<23}" + "".join(f"{f'{b:,} tokens':>14}" for b in budgets) + "   (answerable)")
for name, chunks in chunkings.items():
    index = KeywordIndex()
    index.add(chunks)
    rates = [sum(answerable(within_budget(index.search, b)(q["query"], 0), q) for q in queries) / len(queries)
             for b in budgets]
    print(f"{name:<23}" + "".join(f"{rate:>14.3f}" for rate in rates))
```
```
chunking                   500 tokens  1,000 tokens  2,000 tokens   (answerable)
heading sections                0.279         0.302         0.302
fixed 200                       0.465         0.558         0.651
fixed 200, overlap 50           0.442         0.558         0.698
fixed 400                       0.302         0.465         0.651
structured 100                  0.581         0.605         0.605
structured 200                  0.558         0.581         0.628
structured 400                  0.395         0.488         0.581
```
*(runs live, shows output — read-only demo snippet, not graded. Each demo builds several indexes over the whole corpus, so it takes a few seconds.)*

Read with Lesson 2's rules, three things stand out:

- **The extremes lose.** Uncapped heading sections never get above 0.302.
  For 21 of the 43 questions, their top result alone is bigger than 1,000
  tokens, so nothing fits and nothing is sent.
  400-token chunks are poor at small budgets, where one or two of them fill
  it.
- **The sensible choices cluster.** At 1,000 tokens, structured 100,
  structured 200, fixed 200 and fixed 200 with overlap all answer between
  24 and 26 of the 43 questions. That's a spread of two questions, well
  within noise.
- **Overlap's best showing is also within noise.** At 2,000 tokens, fixed
  200 with 50 tokens of overlap answers 30 questions, two more than without
  it, which is consistent with the mixed evidence in the previous concept.

---

## Is the difference real?

Take the two 200-token chunkers head to head, at 1,000 tokens, question by
question:

```python
def within_budget(search, budget: int):
    """A search that returns ranked chunks until the next one would take the total over budget tokens."""
    def budgeted(question: str, k: int) -> list[dict]:
        results, used = [], 0
        for chunk in search(question, 100):
            size = count_tokens(chunk["text"])
            if used + size > budget:
                break
            results.append(chunk)
            used += size
        return results
    return budgeted

documents = load_documents()
queries = [q for q in load_queries()["main"] if q["evidence"]]

def answered(chunks: list[dict], budget: int = 1000) -> set:
    index = KeywordIndex()
    index.add(chunks)
    search = within_budget(index.search, budget)
    return {q["id"] for q in queries if answerable(search(q["query"], 0), q)}

fixed = answered([c for d in documents for c in fixed_chunks(d, 200)])
structured = answered([c for d in documents for c in structured_chunks(d, 200)])
gained, lost = structured - fixed, fixed - structured
print(f"structured 200 against fixed 200, at 1,000 tokens: gained {sorted(gained)}, lost {sorted(lost)}")
print(f"sign test: {sign_test(len(gained), len(lost)):.2f}")
```
```
structured 200 against fixed 200, at 1,000 tokens: gained ['q18', 'q31'], lost ['q27']
sign test: 1.00
```
*(runs live, shows output — read-only demo snippet, not graded. Each demo builds several indexes over the whole corpus, so it takes a few seconds.)*

Two gained, one lost, and a sign test of 1.00: on this set, with this
search, structure-aware and fixed-size splitting can't be told apart by
retrieval alone.

That agrees with the one careful study of the question. Chroma's 2024
report found that chunking strategy moved recall by up to 9% between the
best and worst choices, that a simple splitter at about 200 tokens with no
overlap was consistently strong, and that a popular default of 800-token
chunks with 400 tokens of overlap did poorly. The big differences are
between sensible choices and bad ones, not among the sensible ones.

---

## The module's choice, and what's left open

This module uses **structured chunks of up to 200 tokens** from here on.
Retrieval can't separate it from the other sensible options on this
corpus, so the decision rests on what it does beyond scores:

- **It keeps units whole.** Sentences and paragraphs are never cut, and
  code blocks are cut only when they're longer than a chunk. It leaves 106
  chunks with a lone code fence against fixed splitting's 155 at the same
  size.
- **It carries section paths,** which Lessons 8 and 9 use, on top of the
  metadata every chunker here carries.
- **It sits well inside the embedding model's limit.** 200 estimated
  tokens leaves room for the difference between the course's estimate and
  a real tokenizer, which counts code and identifiers as more tokens.
  Lesson 4 checks every chunk against bge-small's real limit of 512.

Structured 100 scored highest at the smaller budgets, but by one question,
and it makes 3,415 chunks against 1,968, each with less context. That's not
a trade worth making on a one-question lead.

One question stays open: **chunk size**. This lesson's keyword search
prefers long chunks, so it's the wrong instrument for choosing a size.
Lesson 4 repeats this comparison at 100, 200 and 400 tokens with search by
meaning, and the module's size will follow what that shows.

---

## Quiz cards

> **Q1.** At k = 5, 400-token chunks answered more questions than 200-token
> structured chunks. Why isn't that a fair win?
> - They sent over three times as many tokens, so they had more room to hold the answer ✅
> - Larger chunks are scored with a different metric at the same k
> - The labels were written for 400-token chunks, so they match them better
> - At k = 5, structured chunks return fewer than five results
>
> *Explanation: "five results" means very different amounts of text for
> different chunk sizes. A fair comparison fixes what's being spent,
> the token budget, and asks which chunking finds the answer within it.*

> **Q2.** Heading sections have a median of 107 tokens, but those the
> keyword search retrieves have a median of 865. Why?
> - Counting shared words favours long chunks, which share more words with any question ✅
> - Long sections are more likely to be relevant to the labelled questions
> - The search only returns sections that are over the median size
> - Short sections are dropped from the index because they're too small
>
> *Explanation: the score is the number of keywords a chunk shares with
> the question, and a longer chunk has more keywords to share. That tilts
> any size comparison run through this search towards large chunks, which
> is why the choice of size is left to Lesson 4.*

> **Q3.** At 1,000 tokens, four chunkings answer 24 to 26 of 43 questions.
> What should you conclude?
> - They can't be told apart on this set; decide on other grounds ✅
> - Structured 100 is the best chunker, since it answered the most
> - The labels are wrong, since the chunkers should differ more
> - The budget is too small, so all four are failing in the same way
>
> *Explanation: a two-question spread on 43 questions is within noise,
> and the head-to-head sign test confirms it. When the numbers can't
> choose, practical properties can: keeping code whole, carrying paths,
> the number of chunks, and fitting the embedder's limit.*

> **Q4.** Why does this lesson leave the choice of chunk size to the next
> one?
> - This lesson's search is biased towards long chunks, so it can't judge size fairly ✅
> - Chunk size can only be chosen after the embeddings have been computed
> - The labels only cover 200-token chunks until the next lesson
> - Chunk size doesn't matter for keyword search at all
>
> *Explanation: a measurement is only as fair as its instrument. Keyword
> counting rewards length, so a size chosen with it would reflect the
> scorer's bias. Search by meaning has a different relationship with size,
> and it's the search the chunks are mainly for.*
