# Module 5, Lesson 4 — Concept 3: Meaning against keywords, measured

> **Note for the site build:**
> - No new shared code.
> - **Data for this concept:** the four bge-small chunk files
>   (`structured-100`, `structured-200`, `structured-400`, `fixed-200`) and
>   bge-small's `queries.json`. Only the last demo needs all four.
> - The last demo builds four indexes and runs every question at three
>   budgets; allow several seconds.

---

## Question by question, type by type

Here are Lesson 1's keyword search and search by meaning, over the same
structured 200-token chunks, scored with Lesson 2's labels:

```python
from collections import defaultdict

queries = load_queries()["main"]
chunks = [c for d in load_documents() for c in structured_chunks(d, 200)]
keyword_index = KeywordIndex()
keyword_index.add(chunks)
searches = {"keywords": keyword_index.search, "meaning": meaning_search(chunks, queries)}

answered = {name: answered_ids(search, queries) for name, search in searches.items()}
by_type = defaultdict(lambda: {"total": 0, "keywords": 0, "meaning": 0})
for q in queries:
    if q["evidence"]:
        counts = by_type[q["type"]]
        counts["total"] += 1
        for name in searches:
            counts[name] += q["id"] in answered[name]

print(f"{'type':<16}{'keywords':>9}{'meaning':>9}   (answered in the top 5)")
for query_type, counts in sorted(by_type.items(), key=lambda item: item[1]["keywords"] - item[1]["meaning"]):
    print(f"{query_type:<16}{counts['keywords']:>5} of {counts['total']}{counts['meaning']:>5} of {counts['total']}")
print(f"{'all':<16}{len(answered['keywords']):>5} of 43{len(answered['meaning']):>5} of 43")
```
```
type             keywords  meaning   (answered in the top 5)
paraphrase          4 of 8    8 of 8
identifier          4 of 7    5 of 7
relationship        0 of 3    1 of 3
multi_part          3 of 3    3 of 3
conversational      0 of 3    0 of 3
multi_hop           0 of 3    0 of 3
global              0 of 2    0 of 2
conflict            1 of 2    1 of 2
restricted          2 of 2    2 of 2
public_docs         4 of 5    4 of 5
out_of_context      5 of 5    4 of 5
all                23 of 43   28 of 43
```
*(runs live, shows output — read-only demo snippet, not graded)*

Search by meaning answers 28 of 43 questions, against 23 for keywords, and
the rows show where the difference comes from:

- **Paraphrases: all 8, against 4.** This is what search by meaning is for.
  Every question phrased in words the documents don't use now finds its
  answer.
- **Identifiers: 5 against 4.** The expectation was that meaning would do
  worse on exact codes, and overall it didn't: most identifier questions
  also contain ordinary words, like "What does REG-1007 mean?", and the
  model placed them well. The next demo shows the exception.
- **Out-of-context chunks: one fewer.** Search by meaning lost one of the
  questions whose answer sits in a chunk that doesn't name its subject, a
  problem Lesson 8 takes on.
- **The structural zeros stay zero.** Follow-ups, multi-hop and
  whole-corpus questions fail under both searches, for the reason Lesson 2
  gave: one search with the question as written can't answer them, however
  it scores. Changing the scorer doesn't change that.

---

## Gained, lost, and how sure

```python
queries = load_queries()["main"]
chunks = [c for d in load_documents() for c in structured_chunks(d, 200)]
keyword_index = KeywordIndex()
keyword_index.add(chunks)
keywords_ids = answered_ids(keyword_index.search, queries)
meaning_ids = answered_ids(meaning_search(chunks, queries), queries)

gained, lost = meaning_ids - keywords_ids, keywords_ids - meaning_ids
text = {q["id"]: q["query"] for q in queries}
print(f"meaning gained {len(gained)}, lost {len(lost)}, sign test {sign_test(len(gained), len(lost)):.3f}")
for query_id in sorted(lost):
    print(f"  lost {query_id}: {text[query_id]}")
```
```
meaning gained 8, lost 3, sign test 0.227
  lost q10: MON-2002
  lost q20: After deploying a new registry key, how do I check that it works?
  lost q43: How can I mute the other alerts about a cluster when an alert says the whole cluster is unreachable?
```
*(runs live, shows output — read-only demo snippet, not graded)*

Eight gained and three lost. It's the biggest change in this module so far,
and still the sign test puts a split this lopsided, from pure chance, at
about one time in four. With 43 questions, even a real improvement has
trouble proving itself on these numbers alone. What makes it convincing is
the pattern behind it: all eight paraphrases answered, for a reason the
concept of search by meaning predicts.

The losses matter as much. "MON-2002" is the whole question: an identifier
with no ordinary words around it. To the embedding model it's a string with
no meaning to place, so its vector lands somewhere unhelpful. Keyword search
finds it instantly, because it matches exact strings. Neither search is
better at everything, which is the argument for using both, and Lesson 5
does exactly that.

---

## Settling the chunk size

Lesson 3 left the chunk size open, because keyword counting prefers long
chunks and couldn't judge it fairly. Here's the same equal-budget comparison
with search by meaning:

```python
queries = load_queries()["main"]
documents = load_documents()
chunkings = {
    "structured-100": [c for d in documents for c in structured_chunks(d, 100)],
    "structured-200": [c for d in documents for c in structured_chunks(d, 200)],
    "structured-400": [c for d in documents for c in structured_chunks(d, 400)],
    "fixed-200": [c for d in documents for c in fixed_chunks(d, 200)],
}
budgets = [500, 1000, 2000]
scored = [q for q in queries if q["evidence"]]
vectors = query_vectors()
by_question = {q["query"]: vectors[q["id"]] for q in queries}

print(f"{'chunking':<16}" + "".join(f"{f'{b:,} tokens':>14}" for b in budgets) + "   (answered, by meaning)")
for name, chunks in chunkings.items():
    index = VectorIndex()
    index.add(chunks, vectors_for(chunks, chunking=name))

    def search(question: str, k: int) -> list[dict]:
        return index.search(by_question[question], k)

    counts = [sum(answerable(within_budget(search, b)(q["query"], 0), q) for q in scored) for b in budgets]
    print(f"{name:<16}" + "".join(f"{count:>11} of 43" for count in counts))
```
```
chunking            500 tokens  1,000 tokens  2,000 tokens   (answered, by meaning)
structured-100           26 of 43         30 of 43         32 of 43
structured-200           27 of 43         28 of 43         32 of 43
structured-400           27 of 43         28 of 43         33 of 43
fixed-200                25 of 43         30 of 43         34 of 43
```
*(runs live, shows output — read-only demo snippet, not graded. The 400-token chunking includes 9 chunks that bge-small truncated.)*

Every chunking lands within three questions of the others at every budget.
The effect the argument predicts, that large chunks blur their topics into
one vector and match less sharply, doesn't show up between 100 and 400
tokens on this corpus. Most sections here are short enough that the two
sizes cut them the same way: more than half of structured 400's chunks are
identical to chunks in structured 200.

With the scores unable to choose, the decision rests on the practical
differences:

- **Structured 400** has 9 chunks bge-small truncates, so their endings
  can never be found by meaning.
- **Structured 100** makes 3,415 chunks against 1,968, nearly twice the
  embedding work and storage, for no measurable gain.
- **Fixed 200** matches it here but cuts sentences and code, as Lesson 3
  showed.

So the module keeps **structured chunks of up to 200 tokens**. It's the same
choice Lesson 3 made provisionally, now checked with the search it's for.
A corpus of long, dense documents might show the dilution this one doesn't,
which is why the check is worth running on your own.

---

## Quiz cards

> **Q1.** Search by meaning answered all 8 paraphrase questions, against 4
> for keyword search. Why?
> - It compares what text means, so answers in different words still land close ✅
> - Paraphrase questions are shorter, and short questions suit embeddings
> - The paraphrases were written using words from the embedding model's training
> - Keyword search skips paraphrases because they contain no identifiers
>
> *Explanation: a paraphrase shares meaning but not words with its answer.
> Keyword search needs shared words; search by meaning needs only that the
> model places both texts nearby, which is what it's trained to do.*

> **Q2.** Search by meaning lost the question "MON-2002" to keyword search.
> What's the reason?
> - A bare code has no ordinary meaning for the model to place, while keywords match it exactly ✅
> - The error code reference was left out of the meaning index
> - MON-2002 is longer than the embedding model's input limit
> - Search by meaning ignores capital letters and digits
>
> *Explanation: embeddings capture meaning learned from language; an
> internal code the model has never seen gives it little to work with.
> Questions that wrap an identifier in ordinary words fared fine, which is
> why the identifier row overall didn't drop.*

> **Q3.** Eight gained and three lost gives a sign test of about 0.23. What
> does that mean for adopting search by meaning?
> - The numbers alone don't prove it, but the consistent paraphrase pattern supports it ✅
> - The change is just noise and should be rolled back
> - The change is proven, because more questions were gained than lost
> - The sign test doesn't apply when the gain is more than four questions
>
> *Explanation: with 43 questions even a real improvement struggles to
> clear a significance bar. Evidence is more than one test: a gain that's
> concentrated where the method should help, for a reason you understand,
> is stronger than the same count scattered at random.*

> **Q4.** With search by meaning, chunkings of 100 to 400 tokens answered
> within three questions of each other. Why does the module keep 200?
> - 400 truncates chunks and 100 doubles the index for no measured gain ✅
> - 200 answered the most questions at every budget
> - Search by meaning only works with chunks of exactly 200 tokens
> - Smaller chunks can't hold enough text to be embedded
>
> *Explanation: when the scores can't separate the options, practical
> costs decide. Truncation silently hides text, and more chunks mean more
> embedding and storage. Structured 200 avoids both.*
