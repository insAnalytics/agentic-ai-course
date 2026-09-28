# Module 5, Lesson 4 — Concept 2: Queries aren't documents

> **Note for the site build:**
> - The shared setup now includes the previous exercise's reference
>   solution, `VectorIndex`.
> - **New shared code** for every demo and exercise from this concept to the
>   end of the lesson: `meaning_search` and `answered_ids`, exactly as in the
>   code block in "Measuring the instruction" below.
> - **Data for this concept:** as before, plus
>   `embeddings/all-MiniLM-L6-v2/structured-200.json` and
>   `embeddings/all-MiniLM-L6-v2/queries.json` for the last demo.
> - The table of real token counts in "Every model has a limit" is not a demo:
>   it was measured offline, with each model's own tokenizer, when the
>   vectors were made (`scripts/rag_corpus/embedding-report.json`).

---

## Two different kinds of text

A search compares two kinds of text that look nothing alike. A query is
short, usually a question, and often phrased the way a person talks: "Which
alerts wake someone up at night?". A chunk is a passage, usually
statements, phrased the way documentation is written: "Outside those hours,
only `RegistryUnreachable` pages."

Some embedding models treat both the same way: one model, one vector for
any text. They're called **symmetric**. Others are trained on pairs of
questions and the passages that answer them, so they learn to place a
question near its answer rather than near other questions. Many of these
**asymmetric** models mark which side a text is on, with a short prefix
before the query, sometimes before the document too. Which prefixes a model
expects, if any, is part of its documentation, and getting it wrong
quietly weakens retrieval.

bge-small, this module's model, is the asymmetric kind. Its documentation
gives one instruction, for queries only: "Represent this sentence for
searching relevant passages: ". Documents get no prefix. Every labelled
question was embedded both ways, and the prefix moves the vectors, though
not far:

```python
plain, instructed = query_vectors(kind="plain"), query_vectors(kind="instructed")
similarity = [float(plain[qid] @ instructed[qid]) for qid in plain]
print(f"same question, with and without the instruction: cosine {min(similarity):.3f} to {max(similarity):.3f}, "
      f"mean {sum(similarity) / len(similarity):.3f}")
```
```
same question, with and without the instruction: cosine 0.936 to 0.980, mean 0.965
```
*(runs live, shows output — read-only demo snippet, not graded)*

---

## Measuring the instruction

bge-small's authors say they improved this version's retrieval without
the instruction, so it's optional. On our questions, the difference is a measurement. Two helpers
make that and every later comparison in this lesson short:

```python
def meaning_search(chunks: list[dict], queries: list[dict], model: str = "bge-small-en-v1.5", kind: str = "instructed"):
    """search(question, k) by meaning over precomputed vectors. Works only for the labelled questions."""
    index = VectorIndex()
    index.add(chunks, vectors_for(chunks, model=model))
    vectors = query_vectors(model, kind)
    by_question = {q["query"]: vectors[q["id"]] for q in queries}
    return lambda question, k: index.search(by_question[question], k)

def answered_ids(search, queries: list[dict], k: int = 5) -> set:
    """The ids of questions with evidence whose top k results hold every part of the answer."""
    return {q["id"] for q in queries if q["evidence"] and answerable(search(q["query"], k), q)}
```
*(defined once here and already loaded for every demo and exercise from here to the end of this lesson)*

```python
queries = load_queries()["main"]
chunks = [c for d in load_documents() for c in structured_chunks(d, 200)]

instructed = meaning_search(chunks, queries, kind="instructed")
plain = meaning_search(chunks, queries, kind="plain")
for name, search in [("with instruction", instructed), ("without", plain)]:
    print(f"{name:<17}{evaluate(search, queries, 5)}")
with_ids, without_ids = answered_ids(instructed, queries), answered_ids(plain, queries)
gained, lost = with_ids - without_ids, without_ids - with_ids
print(f"gained {sorted(gained)}, lost {sorted(lost)}, sign test {sign_test(len(gained), len(lost)):.2f}")
```
```
with instruction {'recall': 0.714, 'precision': 0.279, 'mrr': 0.624, 'answerable': 0.651}
without          {'recall': 0.664, 'precision': 0.27, 'mrr': 0.645, 'answerable': 0.605}
gained ['q11', 'q46'], lost [], sign test 0.50
```
*(runs live, shows output — read-only demo snippet, not graded)*

The instruction helped: two more questions answered, none lost, and recall
up from 0.664 to 0.714. By Lesson 2's standards that's weak evidence, with
a sign test of 0.50, and one number went the other way: MRR was slightly
higher without it. The documented usage costs nothing and didn't hurt, so
this module keeps it. The point is that "the documentation says so" became
"the documentation says so, and on our data it didn't hurt".

---

## Measuring the model

The same question applies to the model itself. Module 1 used
all-MiniLM-L6-v2, a symmetric model trained for general sentence
similarity. Here it is against bge-small, on the same chunks and questions:

```python
queries = load_queries()["main"]
chunks = [c for d in load_documents() for c in structured_chunks(d, 200)]

bge = meaning_search(chunks, queries, model="bge-small-en-v1.5", kind="instructed")
minilm = meaning_search(chunks, queries, model="all-MiniLM-L6-v2", kind="plain")
for name, search in [("bge-small", bge), ("all-MiniLM-L6-v2", minilm)]:
    print(f"{name:<17}{evaluate(search, queries, 5)}")
bge_ids, minilm_ids = answered_ids(bge, queries), answered_ids(minilm, queries)
gained, lost = bge_ids - minilm_ids, minilm_ids - bge_ids
print(f"bge-small gained {sorted(gained)}, lost {sorted(lost)}, sign test {sign_test(len(gained), len(lost)):.2f}")
```
```
bge-small        {'recall': 0.714, 'precision': 0.279, 'mrr': 0.624, 'answerable': 0.651}
all-MiniLM-L6-v2 {'recall': 0.667, 'precision': 0.228, 'mrr': 0.614, 'answerable': 0.628}
bge-small gained ['q08', 'q45'], lost ['q27'], sign test 1.00
```
*(runs live, shows output — read-only demo snippet, not graded)*

bge-small answers one more question overall, two gained and one lost, with a
sign test of 1.00. Its precision is clearly higher, 0.279 against 0.228,
and one of its gains is "Which alerts wake someone up at night?", the
paraphrase keyword search couldn't touch. But on answerable questions, the
two models can't be told apart on this set. Public benchmarks favour
bge-small for retrieval; on this corpus the gap is small. That's common,
and it's why the model is a choice you measure on your own data.

---

## Every model has a limit

The deciding difference turned out to be one the scores don't show. When
the vectors were made, every chunk was also counted with each model's own
tokenizer, and compared with the model's input limit:

| Model, chunking | Input limit | Largest chunk | Chunks over the limit |
|---|---|---|---|
| bge-small, structured 200 | 512 tokens | 350 | none of 1,968 |
| bge-small, structured 400 | 512 tokens | 594 | 9 of 1,378 |
| all-MiniLM-L6-v2, structured 200 | 256 word pieces | 350 | 42 of 1,968 |

*(measured offline, with each model's real tokenizer, when the vectors were made)*

Two things follow:

- **The course's estimate undercounts.** A chunk estimated at 200 tokens
  can be 350 real ones: code, identifiers and punctuation break into more
  tokens than four characters each. Lesson 3 left room for that, and at 200
  it was enough for bge-small.
- **Truncation happened, silently.** With MiniLM, 42 chunks were embedded
  from their beginnings only, and nothing reported it at the time. The same
  would happen to 9 chunks at 400 tokens with bge-small. Checking every
  chunk against the real limit, with the model's own tokenizer, is part of
  building an index, not an extra.

So the module keeps bge-small with its instruction: not because it wins by
a wide margin here, but because it scored at least as well, and its longer
limit holds every chunk the module's chunker makes.

---

## Quiz cards

> **Q1.** What does an asymmetric embedding model do differently from a
> symmetric one?
> - It's trained so a question lands near the passages that answer it, often with a prefix marking the query ✅
> - It gives queries shorter vectors than documents, to save storage
> - It embeds documents twice, once for each way they might be searched
> - It ignores the query's wording and embeds only its keywords
>
> *Explanation: questions and answers are different kinds of text. An
> asymmetric model learns to bridge them, and a prefix like bge-small's
> instruction tells it which side of the pair a text is on.*

> **Q2.** bge-small with its instruction answered two more questions and
> lost none, with a sign test of 0.50. What's the honest conclusion?
> - It didn't hurt and may help; keep the documented usage, but don't claim it's proven ✅
> - The instruction clearly improves retrieval by about 5%
> - The instruction makes no difference, so it should be dropped
> - The test is invalid, since MRR went the other way
>
> *Explanation: two gains and no losses happen by chance half the time.
> Following the model's documentation costs nothing here, and the data
> gave no reason not to. Mixed signals, like the slightly lower MRR, are
> normal with small sets.*

> **Q3.** bge-small and MiniLM answered nearly the same number of
> questions. Why does the module still choose bge-small?
> - Its longer input limit fits every chunk, while MiniLM silently truncated 42 of them ✅
> - It was the only model that answered the paraphrased questions
> - Public benchmarks say it's better, which settles the choice
> - MiniLM can't be used with an instruction prefix, so it can't search
>
> *Explanation: the scores couldn't separate the models, so the choice
> rests on something structural. A model that truncates chunks will miss
> any answer past the cut, however well it scores on this set.*

> **Q4.** A chunk estimated at 200 tokens turns out to be 350 real tokens.
> Why does that matter?
> - The embedding model's limit counts real tokens, so estimates can hide truncation ✅
> - The chunk will cost 350 tokens in the prompt instead of 200
> - The chunk's vector will be longer than the others
> - Search by meaning can't compare chunks of different real lengths
>
> *Explanation: truncation happens at the model's real token count, which
> this corpus's code and identifiers push well above the estimate. Checking
> with the model's own tokenizer is the only reliable way to know.*
