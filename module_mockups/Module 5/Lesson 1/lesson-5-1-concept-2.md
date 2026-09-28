# Module 5, Lesson 1 — Concept 2: What pasting everything costs

> **Note for the site build:** no new shared code. The demo uses this
> lesson's shared setup (`COUNT_TOKENS` and `load_documents`, from the
> previous concept) and defines its own two cost functions.

---

## Two ways to send one question

A user asks the registry agent "Why won't the registry let me move my agent
to claude-opus?" There are two ways to get the right text in front of the
model:

- **Send everything:** the whole corpus, then the question. The model
  finds the answer itself.
- **Send what was retrieved:** only the few passages a search picked for
  this question, then the question.

The first needs no search system and can't miss a document. The second
sends a tiny fraction of the text but depends on the search finding the
right passages. This concept compares their cost; the next compares the
quality of their answers.

---

## Putting a number on it

The cost is measured the way
[Module 4 measured caching](→ Module 4, the prompt caching lesson, what a prefix cache is worth to an agent concept, putting a number on it):
in token-units, where one unit is one input token at full price. That keeps
the comparison independent of any one price list, and for a local model the
same numbers read as relative compute.

Sending everything has an obvious improvement: the corpus is identical for
every question, so it can be a fixed prefix, cached once and read back at a
fraction of the price. The demo compares that too. For the retrieval side,
it assumes a generous 2,000 tokens of retrieved text per question: the
average section of this corpus is about 115 tokens, so that's room for more
than a dozen sections. Both sides also send a system prompt, which is the
same for both and left out.

```python
# one provider's published multipliers, as an example: cached reads at 0.1x, cache writes at 1.25x
READ, WRITE = 0.1, 1.25

def everything_cost(corpus: int, question: int, n: int, cached: bool) -> float:
    """Token-units for n questions, each sent after the whole corpus."""
    if not cached:
        return n * (corpus + question)
    # the corpus is a fixed prefix: written to the cache once, then read back for every later question
    return corpus * WRITE + (n - 1) * corpus * READ + n * question

def retrieval_cost(retrieved: int, question: int, n: int) -> float:
    """Token-units for n questions, each sent with only its own retrieved text."""
    return n * (retrieved + question)

corpus = sum(count_tokens(d["text"]) for d in load_documents())
question = count_tokens("Why won't the registry let me move my agent to claude-opus?")
# a generous allowance: several sections' worth of text for each question
retrieved = 2_000

print(f"{'questions':>9}  {'everything':>11}  {'everything, cached':>18}  {'retrieved':>9}   (token-units per question)")
for n in [1, 10, 100, 1_000]:
    plain = everything_cost(corpus, question, n, cached=False) / n
    cached = everything_cost(corpus, question, n, cached=True) / n
    small = retrieval_cost(retrieved, question, n) / n
    print(f"{n:>9,}  {plain:>11,.0f}  {cached:>18,.0f}  {small:>9,.0f}")
```
```
questions   everything  everything, cached  retrieved   (token-units per question)
        1      232,256             290,316      2,015
       10      232,256              49,947      2,015
      100      232,256              25,910      2,015
    1,000      232,256              23,506      2,015
```
*(runs live, shows output — read-only demo snippet, not graded. The multipliers are one provider's, as an example; the retrieval side assumes 2,000 tokens per question rather than measuring a real search.)*

Three things to read from the table:

- **Without a cache, everything costs about 115 times as much per
  question.** Every question pays for all 232,241 tokens of corpus to
  answer from 2,000 tokens' worth of relevant text.
- **A cache narrows the gap a lot, but not to zero.** Over many questions,
  the cached version settles at about a tenth of the uncached one, 23,506
  units, because every question still reads the whole corpus back, just at
  a tenth of the price. That's still more than 11 times the retrieval cost.
- **For a single question, the cache makes things worse.** There's
  nothing to reuse, and writing the cache costs a quarter more than plain
  input: 290,316 units against 232,256.

Retrieval isn't free either. Its search has to be built and run. But the
indexing is done once per document rather than once per question, and the
searching is done by plain code or by models far smaller than the one
answering, so its cost is a small fraction of the model call's. Later
lessons show where it goes.

---

## Why the cached column is the best case

The cached column assumes everything goes the cache's way. Three ordinary
situations take that away:

- **Questions that arrive far apart.** Cache entries expire when unused
  for a few minutes, as Module 4 noted. An internal help desk that gets a
  question every quarter of an hour pays the write, the first row, over
  and over.
- **A corpus that changes.** The cache matches an identical prefix, so
  adding one document, or editing one line of one, means
  [everything after the change is paid for again](→ Module 4, the prompt caching lesson, what makes an agent cache-friendly and what breaks it concept, everything after a change is paid for again).
  A knowledge base that people keep writing to changes all the time.
- **Readers who may see different documents.** The security postmortem in
  this corpus is for the security team only. Pasting everything means
  pasting a different "everything" for each set of permissions, each one a
  separate prefix, written and cached separately. Lesson 12 comes back to
  permissions.

---

## In an agent, it's per turn, not per question

The table priced one model call per question. An agent makes a call on
every turn of its loop, and each call resends the whole context, as
[Module 4 measured across a run](→ Module 4, the context budget lesson, watching it grow across the loop concept).
A corpus pasted into an agent's prefix is read back on every one of those
turns, even the ones spent calling tools that have nothing to do with it.
Retrieved text, by contrast, enters the history only when the agent asks
for it.

The corpus also shares the window with everything else a request carries:
the system prompt, tool definitions, the growing history and room for the
reply, the parts
[Module 4 measured](→ Module 4, the context budget lesson, what fills the window concept).
Our 232,241 tokens would fit in the largest current windows, which hold a
million tokens or more, and not in many others. Real knowledge bases are
far bigger: a company wiki of 10,000 pages at 1,000 tokens a page is
already 10 million tokens, before any vendor manuals. Past the
window, sending everything isn't expensive. It's impossible.

Time goes the same way as cost. Before a model produces its first output
token, it has to process every input token it hasn't cached. A cache skips
that work for the cached part, and retrieval avoids most of it altogether.

---

## Quiz cards

> **Q1.** The corpus is cached as a fixed prefix and a thousand questions
> are asked. Why does each question still cost more than 11 times as much
> as retrieval?
> - Each question still reads the whole cached corpus, only at a tenth of the price ✅
> - Each question writes the corpus to the cache again, at a quarter above full price
> - Caches only apply to the system prompt, so the documents are billed at full price
> - Retrieved text is cached too, which makes retrieval ten times cheaper again
>
> *Explanation: a cache discounts reading the prefix; it doesn't remove it.
> 232,241 tokens at a tenth of the price is still over 23,000 units per
> question, against about 2,000 for retrieved text. The write happens once,
> not per question, which is why the cached cost falls as questions add up.*

> **Q2.** In the demo, why does a single question cost more with the cache
> than without it?
> - There's nothing to reuse yet, and writing the cache costs more than plain input ✅
> - Cached tokens are read twice, once to write them and once to answer
> - The cache stores a second copy of the question, which is billed too
> - A cache adds a fixed fee to every request, whatever its size
>
> *Explanation: caching pays off only on repetition. The first request has
> nothing to read back and pays the write multiplier on the whole corpus,
> 1.25 times full price in this example. That's also why questions that
> arrive too far apart for the cache to survive keep paying that price.*

> **Q3.** The corpus holds documents that only some readers may see. Why
> does that weaken the case for caching the whole corpus as a prefix?
> - Each set of permissions needs its own "everything", so its own separately cached prefix ✅
> - Providers refuse to cache text that has access restrictions attached
> - Permissions are checked after the model answers, which clears the cache each time
> - A cached prefix is shared between all users, so it can't hold any documents
>
> *Explanation: the security team's "everything" includes the postmortem;
> everyone else's doesn't. Different text means a different prefix, written
> and read separately, so the saving from one shared cache is split across
> as many prefixes as there are permission sets.*

> **Q4.** Why does pasting the corpus into an agent's prefix cost more than
> pasting it into a single question?
> - The loop resends the whole context every turn, so the corpus is read on every turn ✅
> - Agents need the corpus twice, once for reasoning and once for tool calls
> - An agent's tool results are written into the corpus, so the corpus keeps growing
> - Agents can't use a prefix cache, so the corpus is always billed at full price
>
> *Explanation: each turn is a separate model call carrying the full
> context, including turns spent on tools that don't need the documents.
> Caching makes each read cheaper but still happens every turn. Retrieved
> text, by contrast, is added only when the agent asks for it.*
