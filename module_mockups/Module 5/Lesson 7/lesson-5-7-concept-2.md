# Module 5, Lesson 6 — Concept 2: Why reading together scores better

> **Note for the site build:** no new shared code. **Data:** as for the
> previous concept. The two demos are independent.

---

## Compress, then compare

Search by meaning uses what's called a **bi-encoder**: two separate trips
through the embedding model, one for the question and one for the chunk.
Each text is turned into its vector alone, without any knowledge of the
other. The only point where question and chunk meet is the very end, a
single dot product between two finished vectors.

That design is what makes it fast, since every chunk's vector is computed
once and reused. It's also its weakness. The chunk's vector had to be made
before any question existed, so it's a general-purpose summary: 384 numbers
standing for everything the chunk says. When a question hinges on one
detail, an exact code or a particular condition, that detail may carry
little weight in the summary, and chunks that are *about the same topic*
land close together whether or not they answer.

---

## Compare while reading

A **cross-encoder** takes a different approach. The question and the chunk
are joined into one input and read by the model together, and the output is
a single relevance score. Inside, this is the attention mechanism from
[Module 1's attention lesson](→ Module 1, attention and transformer architecture lesson, the attention mechanism concept):
every token can attend to every other token, so every word of the question
can attend to every word of the chunk. The code `MON-2002` in the question
can look directly at `MON-2002` in the chunk; the phrase "how long" can look
for the number of hours. Nothing is summarised in advance, because nothing
is known in advance.

This module's reranker learned what a good match looks like from a large
set of real search questions paired with passages people judged relevant.
Here's what reading together does on six questions, reranking search by
meaning's top 30 candidates:

```python
queries = {q["id"]: q for q in load_queries()["main"]}
chunks = [c for d in load_documents() for c in structured_chunks(d, 200)]
meaning = meaning_search(chunks, list(queries.values()))
cross_encoder = CrossEncoderScores()

def first_answer(results: list[dict], query: dict):
    """The position of the first chunk that answers the query, or None."""
    return next((rank for rank, c in enumerate(results, 1) if is_relevant_to_query(c, query)), None)

print(f"{'':>5}{'meaning':>9}{'reranked':>10}   (position of the first answering chunk among 30 candidates)")
for query_id in ["q10", "q43", "q16", "q20", "q08", "q44"]:
    query = queries[query_id]
    candidates = meaning(query["query"], 30)
    reranked = sorted(candidates, key=lambda c: cross_encoder.score(query_id, c), reverse=True)
    print(f"{query_id:>5}{first_answer(candidates, query):>9}{first_answer(reranked, query):>10}   {query['query']}")
```
```
       meaning  reranked   (position of the first answering chunk among 30 candidates)
  q10       16         1   MON-2002
  q43       17         1   How can I mute the other alerts about a cluster when an alert says the whole cluster is unreachable?
  q16        4         1   How long can the old and the new registry key both stay valid?
  q20       16         5   After deploying a new registry key, how do I check that it works?
  q08        4         6   Which alerts wake someone up at night?
  q44        3        14   How do I measure how far a Postgres standby is behind the primary?
```
*(runs live, shows output — read-only demo snippet, not graded)*

On the first four the change is large. "MON-2002" goes from 16th to 1st:
the code that search by meaning couldn't place, the reranker can simply see
in both texts. The Alertmanager question goes from 17th to 1st, and the
runbook's "Revoke it within 24 hours" step rises from 4th to 1st for a
question about how long two registry keys can stay valid, though the chunk
never says "registry".

---

## Where it gets worse

The last two rows went the other way, and it's worth seeing why:

```python
queries = {q["id"]: q for q in load_queries()["main"]}
chunks = [c for d in load_documents() for c in structured_chunks(d, 200)]
meaning = meaning_search(chunks, list(queries.values()))
cross_encoder = CrossEncoderScores()
query = queries["q08"]

candidates = meaning(query["query"], 30)
reranked = sorted(candidates, key=lambda c: cross_encoder.score("q08", c), reverse=True)
print(query["query"])
for chunk in reranked[:2]:
    print(f"  {cross_encoder.score('q08', chunk):>6.2f}  {chunk['doc_id']} | {chunk['section'].split(' > ')[-1]}")
answer = next(c for c in candidates if is_relevant_to_query(c, query))
print(f"  {cross_encoder.score('q08', answer):>6.2f}  {answer['doc_id']} | {answer['section'].split(' > ')[-1]}  (the answer)")
print(f"\nthe answer's text: {answer['text'].split(chr(10), 2)[2]}")
```
```
Which alerts wake someone up at night?
    2.83  prometheus-docs/practices/the_zen.md | Symptom-based alerts for paging, cause-based for troubleshooting
   -3.53  prometheus-docs/practices/the_zen.md | Alerts should be urgent, important, actionable, and real
   -4.99  D15 | Quiet hours  (the answer)

the answer's text: Outside 08:00 to 20:00, only `RegistryUnreachable` pages. Error-rate alerts wait until morning, so check the alert channel first thing when your shift starts.
```
*(runs live, shows output — read-only demo snippet, not graded)*

The reranker's favourite is a Prometheus page that says cause-based alerts
"shouldn't wake anyone up": nearly the question's own words, in a passage
about alerting philosophy, not about this company's pager. The real answer
never mentions waking or night. Getting from the question to it takes two
steps of inference: that "at night" means outside 08:00 to 20:00, and that
"pages" is what wakes someone. A small reranker, trained mostly on web
search questions, rewards the close wording and misses the inference. The
Postgres question fails similarly: its answer talks about the "WAL write
location" and "lag", not about how far behind a standby is.

So a reranker isn't an oracle. It's a better scorer on average, with
different blind spots from the first stage. Whether "better on average"
holds across all the labelled questions, and which first stage gives it the
best candidates, is the next concept's measurement.

---

## Quiz cards

> **Q1.** In a bi-encoder, where does the question first interact with the
> chunk?
> - Only at the end, in one dot product between two finished vectors ✅
> - At the start, where the question is appended to the chunk
> - Inside the model's attention layers, token by token
> - Nowhere: the chunk's vector is compared with the stored vectors instead
>
> *Explanation: each text is embedded on its own, so everything the chunk
> will ever contribute is fixed before any question arrives. That's what
> makes it fast, and what limits it.*

> **Q2.** Why can a cross-encoder rank "MON-2002" first when search by
> meaning put it 16th?
> - The code in the question can attend directly to the same code in the chunk ✅
> - The cross-encoder was trained on this company's error codes
> - The cross-encoder searches the whole corpus instead of 30 candidates
> - The cross-encoder ignores every word except identifiers
>
> *Explanation: reading the two texts together lets matching details meet
> inside the model. In a pre-made vector, a code the model has never seen
> carries little weight; in a joint reading, the exact match is visible.*

> **Q3.** For "Which alerts wake someone up at night?", the reranker
> preferred a page saying cause-based alerts "shouldn't wake anyone up".
> Why?
> - It rewards close wording, and the real answer needs inference the small model misses ✅
> - The real answer was not among the 30 candidates it was given
> - The reranker penalises chunks from the company's own wiki
> - Cross-encoders can't read times like 08:00
>
> *Explanation: the answer was in the candidates, at 4th. But it says
> "outside 08:00 to 20:00, only RegistryUnreachable pages", which answers
> the question only after two inferences. The Prometheus page shares the
> question's words, and the reranker scored that higher.*

> **Q4.** What's the right way to think of a reranker, given both results?
> - A better scorer on average, with blind spots of its own, to be measured ✅
> - An oracle that always puts the true answer first
> - A replacement for the first stage, once it has been trained
> - A tie-breaker that only matters when first-stage scores are equal
>
> *Explanation: it moved four answers sharply up and two down. Its errors
> differ from the first stage's, so whether the combination helps overall
> is an empirical question, answered next.*
