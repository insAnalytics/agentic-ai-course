# Module 5, Lesson 7 — Concept 4: HyDE, and what the model already knows

> **Note for the site build:**
> - The shared setup now includes the previous exercise's reference
>   solution, `interleave`.
> - **New shared code** for every demo and exercise from this concept to the
>   end of the lesson: `hypothetical_document`, exactly as in the first code
>   block below.
> - The first demo needs the fake client (`REACT_FAKE_CLIENT` then
>   `RECORDING_CLIENT`); its reply is the stored, model-written passage.
> - The last demo builds the full pipeline; allow several seconds.

---

## Search with an answer-shaped passage

Rewriting brings a question closer to the documents' vocabulary. **HyDE**,
from Gao, Ma, Lin and Callan (ACL 2023), goes further: instead of searching
with the question, ask a model to *write a passage that answers it*, and
search with that. The passage may be wrong in its details; the paper
describes it as capturing what a relevant answer looks like while possibly
containing false details. It's only used to find real documents near it,
never as an answer. Their experiments found it clearly better than the
unsupervised retriever it was built on, and comparable to retrievers trained
with relevance labels.

The idea behind it: search by meaning compares a question with passages,
two different kinds of text. A hypothetical passage is the same kind of text
as the chunks, so it's embedded as a document, without the query
instruction, and compared like with like.

```python
def hypothetical_document(client, prompt: str, question: str, history: list[dict] = ()) -> str:
    """Ask the model for a passage that would answer the question. It's searched with, never shown as an answer."""
    conversation = "\n".join(f"{turn['role']}: {turn['content']}" for turn in history) or "(none)"
    request = f"{prompt}\n\nConversation so far:\n{conversation}\n\nQuestion: {question}"
    response = client.create([{"role": "user", "content": request}])
    return "".join(block.text for block in response.content if block.type == "text").strip()
```
*(defined once here and already loaded for every demo and exercise from here to the end of this lesson)*

The prompt:

> Write a short passage, in the style of technical documentation, that answers the question. Reply with the passage only.

Here it is on the bare identifier that search by meaning has struggled
with since Lesson 4:

```python
variants = load_query_variants()
query = next(q for q in load_queries()["main"] if q["id"] == "q10")
chunks = [c for d in load_documents() for c in structured_chunks(d, 200)]
meaning = VectorIndex()
meaning.add(chunks, vectors_for(chunks))
client = FakeLLMClient([[TextBlock(variants["hyde"]["q10"])]])

passage = hypothetical_document(client, variants["prompts"]["hyde"], query["query"])
print(f"question: {query['query']}\nhypothetical passage: {passage}\n")
for label, vector in [("the question", query_vectors()["q10"]), ("the passage", variant_vectors()["q10:hyde"])]:
    results = meaning.search(vector, 30)
    rank = next((r for r, c in enumerate(results, 1) if is_relevant_to_query(c, query)), None)
    print(f"searching by meaning with {label}: first answering chunk at rank {rank}")
```
```
question: MON-2002
hypothetical passage: MON-2002 is a monitoring error code. It indicates a problem with the monitoring configuration, such as an invalid or duplicate scrape target. Check the monitoring configuration for errors.

searching by meaning with the question: first answering chunk at rank 16
searching by meaning with the passage: first answering chunk at rank 1
```
*(runs live, shows output — read-only demo snippet, not graded. The passage is model-written and replayed as a scripted reply.)*

The passage is wrong: `MON-2002` means monitoring couldn't reach the
registry, not a configuration problem. But it's wrong in the right
vocabulary. It talks about monitoring, errors and checks, and that was
enough to move the answer from 16th to first. That's the effect HyDE relies
on.

---

## The leakage question

A 2025 study by Yoon and colleagues asked whether HyDE's gains really come
from *hypothetical* passages. Language models are trained on public text,
including the Wikipedia and web pages that benchmark corpora are built
from, so a "hypothetical" passage may simply reproduce what the model read.
Across seven models and three fact-verification benchmarks, they found that query expansion
helped, on average, only when the generated passage contained sentences
supported by the real evidence. When it didn't, results were usually *worse*
than searching with the question alone. They conclude the method may be
limited where the knowledge is niche or new.

This module's corpus is a natural test. No model has read the registry's
internal documents, but plenty have read Prometheus and PostgreSQL
documentation. So the passages were written two ways, as described in the
first concept: for private-document questions, as a model that has never
seen the documents would have to guess; for public-docs questions, from
general knowledge.

---

## Measured

First with search by meaning alone, where HyDE acts directly:

```python
queries = [q for q in load_queries()["main"] if q["evidence"]]
chunks = [c for d in load_documents() for c in structured_chunks(d, 200)]
meaning = VectorIndex()
meaning.add(chunks, vectors_for(chunks))
question_vectors, vectors = query_vectors(), variant_vectors()

def answered(vector_for, group: list[dict]) -> set:
    return {q["id"] for q in group if answerable(meaning.search(vector_for(q), 5), q)}

for label, group in [("private documents", [q for q in queries if q["type"] != "public_docs"]),
                     ("public docs", [q for q in queries if q["type"] == "public_docs"])]:
    as_asked = answered(lambda q: question_vectors[q["id"]], group)
    hyde = answered(lambda q: vectors[f"{q['id']}:hyde"], group)
    print(f"{label:<18} question {len(as_asked):>2} of {len(group)}, passage {len(hyde):>2} of {len(group)}   "
          f"gained {sorted(hyde - as_asked)}, lost {sorted(as_asked - hyde)}")
```
```
private documents  question 24 of 38, passage 28 of 38   gained ['q10', 'q20', 'q24', 'q25', 'q36'], lost ['q11']
public docs        question  4 of 5, passage  5 of 5   gained ['q43'], lost []
```
*(runs live, shows output — read-only demo snippet, not graded)*

Both groups improved: five gained and one lost on the private questions,
one gained on the public ones. On its face, that's the opposite of what the
leakage study predicts. Looking at *which* private questions gained tells a
more careful story:

- **Two are follow-up questions** (q24, q25). Their passages drew on the
  conversation, naming the incident and the agent, which is the same fix a
  rewrite gives. That gain isn't about hypothetical documents at all.
- **One is `MON-2002`**, gained through vocabulary despite wrong details,
  which is HyDE working as designed.
- **Two are guesses that happen to resemble the answers.** For verifying a
  new key, "make an authenticated test request"; for dashboard polling,
  "poll no more than once a minute", close to the real guidance's wording.

That last group needs an honest caveat. These passages were written by the
same author who wrote the corpus, trying to write as a model without access
would. A close guess might be common sense a real model would share, or it
might be knowledge leaking through the author, which is exactly the effect
the leakage study measured, in miniature. Two questions can't tell those
apart, and this page doesn't try to.

Then the pipeline the module actually uses:

```python
queries = [q for q in load_queries()["main"] if q["evidence"]]
chunks = [c for d in load_documents() for c in structured_chunks(d, 200)]
pipeline = ModulePipeline(chunks)
question_vectors, vectors, question_scores = query_vectors(), variant_vectors(), CrossEncoderScores()

for label, vector_for in [("question", lambda q: question_vectors[q["id"]]),
                          ("passage", lambda q: vectors[f"{q['id']}:hyde"])]:
    answered = {q["id"] for q in queries
                if answerable(pipeline.search(q["query"], vector_for(q), lambda c: question_scores.score(q["id"], c)), q)}
    print(f"full pipeline, search by meaning using the {label}: {len(answered)} of 43 answered")
```
```
full pipeline, search by meaning using the question: 32 of 43 answered
full pipeline, search by meaning using the passage: 32 of 43 answered
```
*(runs live, shows output — read-only demo snippet, not graded)*

No change at all. HyDE only replaces the query for search by meaning; BM25
and the reranker still use the question, and between them they had already
recovered what HyDE recovered. HyDE's gains showed up where search by
meaning worked alone, and disappeared once other stages could compensate.

---

## When to reach for it

- **It's the most expensive query change here.** A passage is a longer
  reply than a rewrite, and it's one more model call before every search.
- **Its passages contain invented facts,** like a rate limit of "1,000
  requests per hour" or an uptime figure for a question the corpus can't
  answer. Used as a search key that's harmless. Shown to a user or passed to
  the answering model as context, it would be a fabrication. It must never
  leave the retrieval step.
- **It helps most where search by meaning stands alone** and questions are
  phrased very differently from the documents. In a pipeline with keyword
  search and a reranker using the question, check that it adds anything
  before paying for it.
- **Be wary of benchmark results on public text,** for the leakage reason.
  The test that matters is your own documents, which the model hasn't read.

---

## Quiz cards

> **Q1.** Why does HyDE embed the hypothetical passage as a document rather
> than as a query?
> - It's the same kind of text as the chunks, so it's compared like with like ✅
> - Documents are embedded faster than queries
> - The query instruction would reveal that the passage is invented
> - Search by meaning can only compare two documents, never a query
>
> *Explanation: an asymmetric model treats queries and passages
> differently. The point of HyDE is to replace a question with
> passage-shaped text, so it's embedded the way chunks are.*

> **Q2.** The `MON-2002` passage got the code's meaning wrong but moved the
> answer from 16th to first. How?
> - It used the right vocabulary, monitoring and errors, which placed it near the real answer ✅
> - The reranker corrected the passage's mistake
> - The passage contained the answer's exact wording
> - Wrong details are removed before the passage is embedded
>
> *Explanation: search by meaning compares overall meaning, not facts.
> A passage about monitoring errors lands near chunks about monitoring
> errors, even if what it says about them is invented.*

> **Q3.** What did Yoon and colleagues find about query expansion methods
> like HyDE?
> - They helped, on average, only when the generated text contained sentences supported by the real evidence ✅
> - They helped most on questions the model had never seen answers to
> - They never helped on fact-verification benchmarks
> - They helped only when the passages were written by humans
>
> *Explanation: the gains lined up with the model already knowing the
> answer, which suggests benchmark results can be inflated by knowledge
> leakage. Private or new knowledge is where that can't help.*

> **Q4.** HyDE gained answers with search by meaning alone but changed
> nothing in the full pipeline. What's the lesson?
> - Measure a technique in the system you'll actually run, where other stages may already cover its gains ✅
> - HyDE doesn't work, so it should never be used
> - The full pipeline is broken, since it ignored the passages
> - Hypothetical passages should replace the question for BM25 and the reranker too
>
> *Explanation: BM25 and the reranker, working from the question, had
> already recovered what HyDE recovered. A gain in isolation isn't a gain
> in the pipeline until it's measured there.*
