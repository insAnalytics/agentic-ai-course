# Module 5, Lesson 2 — Concept 2: What a labelled query set is

> **Note for the site build:** no new shared code. The four functions shown
> in "Deciding what counts as relevant" are part of this lesson's shared
> setup, as described in the previous concept's note.

---

## Questions, with their answers written down first

A labelled query set is a list of questions, each paired with where its
answer is in the corpus. It's the retrieval equivalent of a test suite:
fixed inputs, known correct outputs, and a runner that reports what
passed. This module's set has 57 questions:

```python
from collections import Counter

labelled = load_queries()
print(f"{len(labelled['main'])} main queries, {len(labelled['held_out'])} held out")
for query_type, count in Counter(q["type"] for q in labelled["main"]).items():
    print(f"  {query_type:<15}{count}")
```
```
46 main queries, 11 held out
  paraphrase     8
  identifier     7
  out_of_context 5
  multi_part     3
  conversational 3
  multi_hop      3
  relationship   3
  global         2
  conflict       2
  unanswerable   3
  restricted     2
  public_docs    5
```
*(runs live, shows output — read-only demo snippet, not graded)*

The 11 held-out questions are kept aside and not looked at until the
module's last lesson; [reading the numbers honestly](→ this lesson, reading the numbers honestly concept)
explains why. The types exist because each later lesson targets a
different weakness, and a set that only held easy lookups would say every
technique works. A good set has the shapes of question real users ask,
including the awkward ones.

---

## Labelling passages, not chunks

The obvious label is "the answer is chunk 412". It breaks the moment you
change how documents are split, which is exactly what Lesson 3 does: chunk
412 no longer exists, or holds different text. So each label here is a
**quote**, copied exactly from the document that answers the question:

```python
labelled = load_queries()
query = next(q for q in labelled["main"] if q["id"] == "q21")
print(query["query"])
for number, group in enumerate(query["evidence"], 1):
    print(f"group {number}, any one of:")
    for span in group:
        print(f"  {span['doc_id']}: \"{span['quote']}\"")
```
```
What is the registry's rate limit, and what error do you get when you go over it?
group 1, any one of:
  D01: "Each key may make 60 requests per minute."
  D03: "Lowered the rate limit from 100 to 60 requests per minute per key."
group 2, any one of:
  D01: "Requests past the limit get HTTP 429 with error `REG-1009`"
  D02: "The key made too many requests this minute."
```
*(runs live, shows output — read-only demo snippet, not graded)*

Two structural choices are visible in that one query:

- **Alternatives within a group.** The rate limit is stated in both the
  API reference and the changelog. Either passage answers that part, so
  they're listed together as "any one of". Real corpora repeat facts, and a
  label that named only one copy would mark the other as wrong.
- **Several groups.** The question has two parts, the limit and the error,
  and an answer needs both. Each part is its own group, and all groups must
  be found.

A few queries carry extra fields that later lessons use: `history`, for a
follow-up that only makes sense after an earlier exchange; `stale_evidence`,
for a passage that's out of date and contradicts the current answer; and
`access_cases`, saying who should and shouldn't get an answer.

---

## Deciding what counts as relevant

A quote is text; a search returns chunks. The rule that joins them: a
chunk is **relevant** to a quote if it comes from the same document and
contains at least half of the quote, unbroken. Those four functions are
already loaded for this whole lesson:

```python
import math

def load_queries() -> dict:
    """The labelled query set: main and held-out queries, each with its evidence."""
    return json.loads(Path("/data/rag/queries.json").read_text(encoding="utf-8"))

def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()

def is_relevant(chunk: dict, span: dict) -> bool:
    """True if the chunk comes from the span's document and holds at least half of the quote, unbroken."""
    if chunk["doc_id"] != span["doc_id"]:
        return False
    text, quote = normalize(chunk["text"]), normalize(span["quote"])
    half = math.ceil(len(quote) / 2)
    return any(quote[start:start + half] in text for start in range(len(quote) - half + 1))

def answerable(results: list[dict], query: dict) -> bool:
    """True if, for every evidence group, at least one result is relevant to one of its spans."""
    return all(any(is_relevant(chunk, span) for chunk in results for span in group)
               for group in query["evidence"])
```
*(defined once in this lesson's setup and already loaded for every demo and exercise; the previous concept used them before this one explained them)*

Why half, and not the whole quote? Because splitting can cut a quote in
two, and one side should still count if it holds most of it:

```python
section = next(s for s in load_sections() if s["doc_id"] == "D01" and s["section"] == "Rate limits")
span = {"doc_id": "D01", "quote": "Requests past the limit get HTTP 429 with error `REG-1009`"}

# cut the section in two, partway through the quote, as a fixed-size splitter might
cut = section["text"].index("HTTP 429")
first = {**section, "text": section["text"][:cut]}
second = {**section, "text": section["text"][cut:]}

for name, chunk in [("whole section", section), ("first part", first), ("second part", second)]:
    print(f"{name:<14}{is_relevant(chunk, span)}")
```
```
whole section True
first part    False
second part   True
```
*(runs live, shows output — read-only demo snippet, not graded)*

The second part holds the core of the answer, "HTTP 429 with error
REG-1009", and counts. The first part holds only "Requests past the limit
get", and doesn't. At most one side of a cut can hold more than half, so a
split quote is never counted twice.

`answerable` then applies the groups. Here's the rate-limit question
against Lesson 1's keyword search:

```python
labelled = load_queries()
index = KeywordIndex()
index.add(load_sections())
query = next(q for q in labelled["main"] if q["id"] == "q21")
results = index.search(query["query"], k=5)

for number, group in enumerate(query["evidence"], 1):
    found = any(is_relevant(chunk, span) for chunk in results for span in group)
    print(f"group {number} found in the top 5: {found}")
print(f"answerable: {answerable(results, query)}")
```
```
group 1 found in the top 5: False
group 2 found in the top 5: False
answerable: False
```
*(runs live, shows output — read-only demo snippet, not graded)*

Neither part is in the top five. That's a retrieval failure the set now
records, rather than one somebody has to notice.

---

## Building the set

How the set was made matters as much as its contents:

- **The labels were written before any retrieval ran.** If you label by
  looking at what your search returned, you label your search's opinion,
  and it will score perfectly against itself.
- **Every quote is checked by code.** Labels are data, and data has bugs:
  a mistyped quote silently matches nothing, and every query using it
  looks like a retrieval failure. This check runs over every label:

```python
labelled = load_queries()
documents = {d["doc_id"]: normalize(d["text"]) for d in load_documents()}
spans = [span for q in labelled["main"] + labelled["held_out"] for group in q["evidence"] for span in group]
problems = [span for span in spans if documents[span["doc_id"]].count(normalize(span["quote"])) != 1]
print(f"{len(spans)} quotes checked, {len(problems)} not found exactly once")
```
```
127 quotes checked, 0 not found exactly once
```
*(runs live, shows output — read-only demo snippet, not graded)*

- **The set is versioned.** When a label is fixed, the version changes, and
  numbers from different versions aren't compared.
  [When the labels are wrong](→ this lesson, when the labels are wrong concept)
  shows the first such fix.

---

## What the set can't score

Some query types are in the set for later lessons, and don't fit a
"did the right passage come back?" score:

- **Unanswerable questions** have no evidence. There's nothing to
  retrieve; what matters is that the system declines to answer, which is
  Lesson 9's subject.
- **Follow-up questions** are scored on their own words here, without the
  history, so "What should the second one move to?" is bound to fail.
  Rewriting it using the conversation is Lesson 7's subject.
- **Restricted questions** are scored as if the reader may see everything.
  Whether each reader gets only what they're allowed is Lesson 12's test.
- **Whole-corpus questions**, like "What recurring causes run through our
  incidents?", have evidence groups, but finding the passages is only the
  start: the answer is a synthesis. Lesson 11 is about them.

These still count in this lesson's totals, which is why the totals start
low. Later lessons report the types separately.

---

## Quiz cards

> **Q1.** Why does the set label each answer with a quote from the
> document, rather than with the id of the chunk that holds it?
> - Chunk ids change whenever documents are split differently, and a quote doesn't ✅
> - Quotes take less space to store than chunk ids do
> - Search results don't include chunk ids, so they couldn't be compared
> - A quote can match several documents, so it finds more relevant chunks
>
> *Explanation: Lesson 3 re-splits the corpus several ways, and every
> split has different chunks. A quote stays attached to the text itself,
> so the same labels score every split. Each quote is checked to occur
> exactly once, in exactly one document.*

> **Q2.** The rate limit is stated in both the API reference and the
> changelog. How does the set handle that?
> - Both passages go in one group as alternatives, and finding either satisfies it ✅
> - Only the newer passage is labelled, so the older one counts as wrong
> - Each passage gets its own group, so both must be found
> - The fact is left unlabelled, because two sources would be ambiguous
>
> *Explanation: a group lists alternatives, and one of them is enough. Two
> separate groups would mean both are required, which is right for a
> two-part question, not for one fact stated twice. Labelling only one copy
> would penalise a search for finding the other.*

> **Q3.** A splitter cuts a quote in two. When does a piece still count as
> relevant?
> - When it holds at least half of the quote as one unbroken stretch ✅
> - Whenever it contains any word from the quote
> - Only when it contains the entire quote, from start to end
> - When both pieces come back together in the same result list
>
> *Explanation: half, unbroken, means a piece counts only if it has the
> core of the passage, and at most one side of a cut can qualify. Any
> shared word would be far too loose; requiring the whole quote would
> punish a splitter for a cut that left the answer readable.*

> **Q4.** Why were the labels written before any retrieval was run?
> - Labels made from a search's own results would only confirm that search ✅
> - Retrieval can't run until the labels file exists on disk
> - Writing labels afterwards would make the quotes too long to check
> - Running retrieval first would change the documents being labelled
>
> *Explanation: if you label what your search found, every passage it
> missed is missing from the labels too, and the search looks perfect.
> Labels written independently, from the documents, can catch what the
> search misses.*
