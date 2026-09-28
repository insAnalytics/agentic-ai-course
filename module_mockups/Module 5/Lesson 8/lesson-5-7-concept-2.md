# Module 5, Lesson 7 — Concept 2: Follow-up questions

> **Note for the site build:** no new shared code. The last demo needs the
> fake client (`REACT_FAKE_CLIENT` then `RECORDING_CLIENT`); its replies are
> the stored, model-written rewrites. The demos are independent.

---

## A follow-up means nothing on its own

People don't ask questions one at a time. They ask "What caused INC-2041?",
read the answer, then ask "What did they change afterwards?". The second
question is perfectly clear to the person asking. To a search, it's a
question about some unnamed "they" changing something at some point. Here
are the labelled set's three follow-up questions, run through the module's
pipeline exactly as asked:

```python
queries = [q for q in load_queries()["main"] if q["type"] == "conversational"]
chunks = [c for d in load_documents() for c in structured_chunks(d, 200)]
pipeline = ModulePipeline(chunks)
question_vectors, question_scores = query_vectors(), CrossEncoderScores()

for query in queries:
    results = pipeline.search(query["query"], question_vectors[query["id"]],
                              lambda c: question_scores.score(query["id"], c))
    print(f"{query['query']:<52} answered: {answerable(results, query)}")
```
```
What did they change afterwards?                     answered: True
What should the second one move to?                  answered: False
What's the first thing I should do when it fires?    answered: False
```
*(runs live, shows output — read-only demo snippet, not graded)*

The first one gets lucky: three incident reports' "What we changed"
sections come back, matched on "change" without knowing which incident was
meant, and INC-2041's happens to be one of them. The
other two have nothing to go on. "The second one" and "it" refer to things
named only in the earlier turns.

---

## Where the conversation lives

The earlier turns aren't lost; they're just not where the search can see
them. As [Module 2's scratchpad concept](→ Module 2, agent state and the scratchpad lesson, the scratchpad concept)
showed, an agent's model remembers nothing on its own: the agent keeps the
conversation and sends it with every call. A retrieval step inside that
agent receives only what the agent chooses to pass it. So the choice is how
to turn "the conversation so far, plus the latest question" into something
a search can use. There are two common answers.

---

## Gluing the history on

The simplest is to paste the earlier turns in front of the question and
search with the lot. With a short, focused conversation it works. With a
longer one it drifts, because the search can't tell which turns are still
relevant. Here it is with BM25, on the INC-2041 follow-up, with and without
two earlier exchanges about error codes:

```python
queries = {q["id"]: q for q in load_queries()["main"]}
chunks = [c for d in load_documents() for c in structured_chunks(d, 200)]
bm25 = BM25Index()
bm25.add(chunks)
query = queries["q24"]
earlier = [{"role": "user", "content": "What does REG-1007 mean?"},
           {"role": "assistant", "content": "MODEL_NOT_ALLOWED: the model isn't on the allowlist for the agent's tier."},
           {"role": "user", "content": "And REG-1003?"},
           {"role": "assistant", "content": "KEY_REVOKED: the key has been revoked. Issue a new key."}]

for label, history in [("short history", query["history"]), ("longer history", earlier + query["history"])]:
    glued = " ".join([turn["content"] for turn in history] + [query["query"]])
    top = bm25.search(glued, 5)
    print(f"{label:<15} answered: {answerable(top, query)!s:<6} top 5: {[c['doc_id'] for c in top]}")
```
```
short history   answered: True   top 5: ['D09', 'D09', 'D09', 'D09', 'D13']
longer history  answered: False  top 5: ['D09', 'D02', 'D02', 'D03', 'D09']
```
*(runs live, shows output — read-only demo snippet, not graded. The two earlier exchanges were constructed for this demo; the rest is the labelled question and its real history.)*

With the short history, all five results come from the INC-2041 report.
With the longer one, the words about error codes pull in the error-code
reference and the changelog, and the answer falls out of the top five. The
older the relevant turn and the longer the conversation, the worse this
gets.

---

## Rewriting with the conversation

The better answer is the rewrite from the previous concept, given the
conversation as well as the question: the model resolves "they", "the
second one" and "it" from the earlier turns, and writes a query that stands
on its own.

```python
variants = load_query_variants()
queries = [q for q in load_queries()["main"] if q["type"] == "conversational"]
chunks = [c for d in load_documents() for c in structured_chunks(d, 200)]
pipeline = ModulePipeline(chunks)
vectors, variant_scores = variant_vectors(), CrossEncoderScores(chunking="query-variants")
# the fake client replays the model-written rewrites, one per call
client = FakeLLMClient([[TextBlock(variants["rewrites"][q["id"]])] for q in queries])

for query in queries:
    standalone = rewrite_query(client, variants["prompts"]["rewrite"], query["query"], query["history"])
    key = f"{query['id']}:rewrite"
    results = pipeline.search(standalone, vectors[key], lambda c: variant_scores.score(key, c))
    print(f"{query['query']:<52} -> {standalone}")
    print(f"{'':<52}    answered: {answerable(results, query)}")
```
```
What did they change afterwards?                     -> changes made after INC-2041 expired auth-service certificate
                                                        answered: True
What should the second one move to?                  -> model notes_agent should move to from claude-legacy
                                                        answered: True
What's the first thing I should do when it fires?    -> first step when the AgentLatencyHigh alert fires
                                                        answered: True
```
*(runs live, shows output — read-only demo snippet, not graded. The rewrites are model-written and replayed as scripted replies.)*

All three answered, against one as asked. Each rewrite names what the
question only pointed at: the incident and its cause, the agent and its
current model, the alert. And because the model reads the whole
conversation but writes a short query, a long history doesn't bloat the
search the way gluing does.

Two things to keep in mind:

- **The rewrite trusts the conversation.** Its query is built from the
  earlier answers, including the assistant's own. If an earlier answer was
  wrong, named the wrong agent, say, the rewrite will faithfully search for
  the wrong thing.
- **It's the one question type that nearly always needs the call.** A
  standalone question may or may not benefit from rewriting; a follow-up
  that says "it" can't be searched without resolving it. That makes
  follow-ups the clearest case for rewriting only when needed.

---

## Quiz cards

> **Q1.** Why can't a search answer "What should the second one move to?"
> on its own?
> - "The second one" refers to something named only in an earlier turn, which the search never sees ✅
> - The question is too short for the embedding model to embed
> - Search engines can't handle questions containing numbers
> - The answer is in a restricted document
>
> *Explanation: the agent keeps the conversation, but a retrieval step
> sees only what it's passed. Unless the earlier turns reach the search
> somehow, "the second one" matches nothing in particular.*

> **Q2.** Pasting the whole conversation in front of the question worked
> with a short history but failed with a longer one. Why?
> - Words from earlier, unrelated turns pulled the search towards their topics ✅
> - BM25 ignores everything after the first 100 words of a query
> - The longer history exceeded the embedding model's input limit
> - Longer queries always score lower in BM25
>
> *Explanation: the search can't tell old, finished topics from the one
> being asked about now. Two exchanges about error codes were enough to
> bring the error-code reference into the top five.*

> **Q3.** What does a rewrite with the conversation do that gluing doesn't?
> - It resolves references like "it" and "they" and writes a short query about the current question only ✅
> - It searches every earlier turn separately and merges the results
> - It removes the assistant's turns so only the user's words are searched
> - It sends the conversation to the reranker instead of the first stage
>
> *Explanation: the model reads everything but writes only what the
> current question needs. That keeps a long conversation from turning into
> a long, unfocused query.*

> **Q4.** An earlier assistant answer named the wrong agent. What happens
> when the follow-up is rewritten?
> - The rewrite searches for the wrong agent, because it trusts the conversation ✅
> - The rewrite detects the error and corrects the agent's name
> - The search ignores names that came from the assistant's turns
> - The reranker filters out chunks about the wrong agent
>
> *Explanation: the rewrite resolves references from what the
> conversation says, right or wrong. Retrieval quality after a mistake
> depends on catching the mistake, which is a job for the steps that check
> answers, not for the rewrite.*
