# Module 5, Lesson 3 — Concept 1: Why documents are split

> **Note for the site build:** Lesson 3's shared setup, loaded for every
> demo and exercise in the lesson, is the Lesson 2 comprehensive sandbox's
> `lib.py`, unchanged: Lessons 1 and 2's code, from `COUNT_TOKENS` through
> `sign_test`. No new shared code in this concept. The labels file is the
> single version-3 `queries.json`.

---

## The piece that gets scored is the piece that gets sent

A search never returns "the answer". It returns whole pieces of text, and
it ranks them by scoring each one against the question. So the size and
shape of the pieces decide two things at once:

- **What the search can tell apart.** A search scores a piece as a whole.
  If one piece covers five topics, it can't be a strong match for just one
  of them.
- **What the model is sent.** Every retrieved piece goes into the prompt in
  full, relevant sentence and all the text around it.

The pieces are called **chunks**, and choosing how to cut documents into
them is **chunking**. It happens once, at indexing time, and every later
step inherits its choices.

---

## The corpus, uncut

Lesson 1 split the corpus at its headings and moved on. Here's what that
produced, next to the documents themselves:

```python
from statistics import median

documents = load_documents()
sections = [s for d in documents for s in split_sections(d)]

for name, pieces in [("documents", documents), ("heading sections", sections)]:
    sizes = sorted(count_tokens(p["text"]) for p in pieces)
    over = sum(size > 512 for size in sizes)
    print(f"{name:<17}{len(sizes):>5}  median {median(sizes):>5.0f}  largest {sizes[-1]:>6,}  over 512 tokens: {over}")
```
```
documents          119  median   995  largest 23,000  over 512 tokens: 77
heading sections  1145  median   107  largest  4,301  over 512 tokens: 91
```
*(runs live, shows output — read-only demo snippet, not graded)*

*(sizes use the course's four-characters-per-token estimate, not a real tokenizer)*

Neither is a usable unit as it stands:

- **Whole documents are too big.** The median document is about 1,000
  tokens and the largest 23,000. Five whole documents in a prompt would run
  from a few thousand tokens to tens of thousands, for an answer that's
  usually one or two sentences.
- **Heading sections are uneven.** The median is a manageable 107 tokens,
  but sizes run from a heading alone to thousands of tokens:

```python
sections = [s for d in load_documents() for s in split_sections(d)]
by_size = sorted(sections, key=lambda s: count_tokens(s["text"]))

largest = by_size[-1]
print(f"largest:  {count_tokens(largest['text']):,} tokens  {largest['doc_id']} | {largest['section']}")
tiny = [s for s in by_size if count_tokens(s["text"]) <= 10]
print(f"{len(tiny)} sections of 10 tokens or fewer, such as:")
for s in tiny[:3]:
    print(f"  {s['doc_id']} | {s['text']!r}")
```
```
largest:  4,301 tokens  postgresql/wal.md | WAL Configuration
37 sections of 10 tokens or fewer, such as:
  prometheus-docs/instrumenting/content_negotiation.md | '## Examples'
  prometheus-docs/instrumenting/writing_exporters.md | '## Metrics'
  prometheus-docs/introduction/faq.md | '## General'
```
*(runs live, shows output — read-only demo snippet, not graded)*

A section holding only "## Metrics" is a heading whose content sits in the
subsections below it, so on its own it can't answer anything. A 4,301-token
section about write-ahead-log settings is a small document in its own right.

---

## Every embedding model has an input limit

The next lesson turns each chunk into an embedding, one vector per chunk.
Embedding models read a fixed maximum number of tokens: 512 for the model
this module uses, bge-small, and 256 word pieces for Module 1's
all-MiniLM-L6-v2. Text past the limit is usually **truncated silently**.
The model embeds the beginning and never sees the rest, and nothing warns
you.

So a 4,301-token section wouldn't be searched by its whole content, only by
roughly its first eighth. Any sentence after that point could never be
found by meaning, however well it answered the question. Chunking has to
respect the limit of whichever model does the embedding, which is why it
comes before search by meaning, not after.

---

## Too small loses the context

Cutting smaller isn't free either. A chunk makes sense only if it carries
enough of its surroundings. Here's the start of one of the runbook's steps,
split off as a section on its own:

```python
step = next(s for d in load_documents() for s in split_sections(d)
            if s["doc_id"] == "D06" and s["section"].startswith("Step 4"))
heading, first_paragraph = step["text"].split("\n\n")[:2]
print(heading)
print(first_paragraph)
```
```
## Step 4: Revoke the old one
Revoke it within 24 hours of issuing the new one. Leaving both valid for longer doubles the number of keys that can leak. For an exposed key, don't wait: revoke as soon as Step 3 passes.
```
*(runs live, shows output — read-only demo snippet, not graded)*

It says what to do with "the old one", but nothing in the whole section
says *registry* key: that's only in the document's title, one level up. A question about
"revoking the old registry key" shares less with this chunk than it should.
Cut it into single sentences and "Revoke it within 24 hours of issuing the
new one" is left with no subject at all.

So chunk size is a trade-off between two failures:

- **Too large:** the relevant sentence is buried among others, the chunk's
  score reflects everything in it, and the prompt pays for all of it.
- **Too small:** the chunk loses the context that makes it findable and
  understandable, and answers get split across several chunks.

This lesson covers how to cut, then measures what different cuts do on
this corpus. Lesson 8 returns to chunks that
lose their meaning out of context, with fixes that add the context back.

---

## Quiz cards

> **Q1.** Why does chunk size affect what the model is sent, not only what
> the search finds?
> - Each retrieved chunk goes into the prompt whole, including text around the relevant sentence ✅
> - The model reads only the first sentence of each chunk it's sent
> - Larger chunks are compressed before they're sent, losing detail
> - The prompt holds a fixed number of chunks, whatever their size
>
> *Explanation: retrieval returns whole chunks, so a 2,000-token chunk
> with one useful sentence costs 2,000 tokens in the prompt. The model
> reads all of it, including the surrounding text that isn't relevant.*

> **Q2.** An embedding model reads at most 512 tokens and is given a
> 4,301-token section. What happens to a sentence near the end?
> - It's cut off before embedding, so search by meaning can never match it ✅
> - The model spreads its attention thinner, so the sentence counts for less
> - The model raises an error, and the section is left out of the index
> - The model splits the section into 512-token pieces automatically
>
> *Explanation: text past the limit is usually truncated silently. The
> section's vector reflects only its beginning, and nothing warns you. Only
> chunking with the model's limit in mind prevents that.*

> **Q3.** Why can't the section "## Metrics" answer any question on its
> own?
> - It's a heading whose content sits in the subsections below it ✅
> - It's too short to be indexed, so the search skips it
> - Headings are removed before chunks are scored
> - It belongs to a vendor document, which the labels don't cover
>
> *Explanation: splitting at every heading makes a parent heading its own
> section, with nothing under it but more headings. It's indexed and scored
> like any chunk; it just has no content to match. Good chunking handles
> headings differently.*

> **Q4.** A runbook step says "Revoke it within 24 hours of issuing the new
> one." What goes wrong if that sentence becomes a chunk by itself?
> - Nothing in it says what "it" is, so questions about registry keys barely match it ✅
> - It's too short to fit a whole embedding vector
> - Its token count is below the minimum an embedding model accepts
> - It would be retrieved for every question that mentions time
>
> *Explanation: the subject lives in the document's title and headings,
> not in the sentence. Cut too small, a chunk loses the context that makes
> it findable. That's the other side of the size trade-off.*
