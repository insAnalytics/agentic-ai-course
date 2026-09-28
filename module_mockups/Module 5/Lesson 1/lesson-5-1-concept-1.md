# Module 5, Lesson 1 — Concept 1: What the model can't know

> **Note for the site build:** this is the first page that reads the Module 5
> corpus. Before running any demo on a Module 5 page, fetch
> `public/data/rag/documents.json` (1 MB) once, on the first Run click, and
> write it into Pyodide's filesystem at `/data/rag/documents.json`. The
> browser's cache keeps it for later pages. Never import it into page or
> component code, and never fetch it on page load. The lesson's shared setup
> below is `COUNT_TOKENS` from `fakeClient.ts` (unchanged) followed by
> `load_documents`. It's new, and backward compatible because nothing earlier
> uses it.

---

## A question no model can answer

An agent working on the registry gets this error back from a tool call:

```json
{"error": {"code": "REG-1007", "name": "MODEL_NOT_ALLOWED", "message": "claude-opus is not allowed on tier standard"}}
```

To recover, it needs to know what `REG-1007` means and what to do about it.
No model can answer that from its own weights. The registry is an internal
system, and its documentation has never been public, so it was never part of
any model's training data. Ask anyway and the model will still answer: it
produces the most plausible-sounding explanation, which is
[a hallucination by the same mechanism as any correct answer](→ Module 1, how LLMs generate text lesson, hallucination as a direct consequence concept).

Knowledge an agent needs but no model can have from training falls into a
few kinds:

- **Private:** internal documentation, a company's tickets and incident
  notes, a user's own files. Never published, so never trained on.
- **Recent:** anything written after the model's
  [knowledge cutoff](→ Module 1, how LLMs generate text lesson, knowledge cutoff concept).
- **Changing:** facts that were true when a model was trained and have
  since moved on. The registry's rate limit dropped from 100 to 60 requests
  a minute in May. A model trained on the March docs would state the old
  number confidently.
- **Needing a source:** even when a model does know something, an answer
  that has to be checked or cited needs the document it came from, not the
  model's memory of it.

One kind of knowledge doesn't belong on this list: live state, such as which
model `support_agent` runs at this moment. Documents describe the state as
of when they were written. For the current value, the agent calls a tool that
asks the registry, as it did throughout Module 3. Retrieval is for knowledge
that lives in writing.

---

## The fix is text in the prompt

Module 1 already gave the fix, in its knowledge cutoff concept: put the
information in the input. If the request carries the error-code table's row
for `REG-1007`, the model doesn't have to recall anything. It reads the
answer from its context, the way it reads a tool result.

That changes the question. It's no longer "what does the model know?" but
"what did we put in front of it?" For a private or changing fact, the
answer to the first is "nothing reliable", and the second is entirely in
the agent builder's hands. Every technique in this module is about making
that choice well.

---

## The corpus this module uses

To make the choice concrete, this module uses one fixed collection of
documents, a **corpus**, in every lesson, so results from one lesson can be
compared with the next. It's what a company's internal knowledge base looks
like:

- **The registry's own documentation, 15 documents:** its API reference,
  error codes, changelog, architecture overview, runbooks, incident reports,
  a security postmortem, a finance page, a FAQ and a wiki page. These were
  written for the course.
- **Documentation for the tools the company runs, 104 documents:**
  Prometheus, Alertmanager and PostgreSQL, used as their projects publish
  them. Knowledge bases really do hold vendor docs alongside their own pages,
  and that's where most of the text is.

Every document carries metadata along with its text: an id, a title, a date,
which groups of people may read it, and what kind of source it is. Later
lessons use each of these.

The corpus is loaded once for the whole lesson:

```python
import json
from pathlib import Path

def load_documents() -> list[dict]:
    """Every document in the corpus, with its metadata and its text as Markdown."""
    return json.loads(Path("/data/rag/documents.json").read_text(encoding="utf-8"))
```
*(defined once here and already loaded for every demo in this lesson, along with [`count_tokens`](→ Module 4, the context budget lesson, what fills the window concept))*

Here's how big it is:

```python
from collections import Counter

documents = load_documents()
total = sum(count_tokens(d["text"]) for d in documents)
print(f"{len(documents)} documents, {total:,} tokens")

tokens_by_type = Counter()
for d in documents:
    tokens_by_type[d["source_type"]] += count_tokens(d["text"])
for source_type, tokens in tokens_by_type.most_common():
    print(f"  {source_type:<9}{tokens:>9,} tokens")
```
```
119 documents, 232,241 tokens
  vendor     226,122 tokens
  official     5,837 tokens
  wiki           282 tokens
```
*(runs live, shows output — read-only demo snippet, not graded. Token counts use Module 4's estimate of about four characters per token, not a real tokenizer.)*

`official` and `wiki` are the registry's own pages; `vendor` is the public
documentation. The company's own knowledge is under 3% of the text, which is
typical: the pages that matter most to a specific question are usually a
small part of what's stored.

---

## So which text?

Back to the agent's error. Here's where the answer sits in those 232,241
tokens:

```python
documents = load_documents()
total = sum(count_tokens(d["text"]) for d in documents)

mentions = [d["doc_id"] for d in documents if "REG-1007" in d["text"]]
print(f"Documents that mention REG-1007: {', '.join(mentions)}")

answer = next(line for d in documents for line in d["text"].splitlines()
              if line.startswith("| `REG-1007`"))
print(f"The line that explains it:\n  {answer}")
print(f"{count_tokens(answer)} of {total:,} tokens, or {count_tokens(answer) / total:.3%} of the corpus")
```
```
Documents that mention REG-1007: D01, D02, D03, D07
The line that explains it:
  | `REG-1007` | `MODEL_NOT_ALLOWED` | 422 | The model isn't on the allowlist for the agent's tier. Change the tier first, or pick an allowed model. |
37 of 232,241 tokens, or 0.016% of the corpus
```
*(runs live, shows output — read-only demo snippet, not graded)*

Four documents mention the code, and one table row explains it. The rest of
the corpus, more than 99.98% of it, has nothing to say about this question.

The demo cheated, of course: it found the row because it already knew what
the row starts with. A real question arrives as words, often not the
document's words ("why won't the registry let me use the big model?"), and
the system has to work out which text answers it. That's **retrieval**:
choosing, for each question, the small part of a corpus worth putting in
front of the model. The alternative is to skip the choosing and send
everything. The next concept puts a price on that.

---

## Quiz cards

> **Q1.** An agent asks a model what the registry error `REG-1007` means.
> Why can't the model answer from what it learned in training?
> - The registry's documentation is internal, so it was never in the training data ✅
> - The error code is recent, so a model with a later cutoff would know it
> - The answer is in a table, and models can't read tables reliably
> - The code is too short to carry enough meaning for the model
>
> *Explanation: the documentation was never published, so no amount of
> training brings it into a model's weights. A later cutoff is the tempting
> answer, but a later cutoff only helps with public information; private
> documents stay out of training however recent the model is. The fix is to
> put the text in the prompt.*

> **Q2.** Suppose a model had been trained on the registry's March
> documentation. Why would an agent still look up the rate-limit page when a
> user asks about it?
> - The limit changed in May, and the page is current while the weights aren't ✅
> - Models trained on a document refuse to answer questions about it later
> - Looking the page up is faster than the model recalling the number
> - Models can't store exact numbers in their weights, only rough ideas
>
> *Explanation: training freezes what the model saw. The March docs said
> 100 requests a minute; the limit has been 60 since May. A document read
> at question time reflects the current state, and it gives the answer a
> source that can be checked. Models can and do recall exact numbers, which
> is exactly why a stale one is stated so confidently.*

> **Q3.** An agent needs to know which model `support_agent` is running
> right now. Where should that come from?
> - A tool call that asks the registry, because it's live state ✅
> - Retrieval over the registry's documentation, which describes each agent
> - The model's own knowledge of the company's agents
> - The migration runbook, which lists every agent's target model
>
> *Explanation: documents record the state as of when they were written;
> the migration runbook, for example, lists targets, not what's running
> today. For a value that can change at any moment, ask the system that
> holds it. Retrieval is for knowledge that lives in writing.*

> **Q4.** In the demo, the line that explains `REG-1007` is 37 tokens out of
> 232,241. What does that show?
> - Almost all of the corpus is irrelevant to this question, so the work is choosing what to send ✅
> - The corpus is too small to be realistic, since real answers take up more of it
> - Keyword search can't find the line, because it's only 0.016% of the text
> - The model would ignore the rest of the corpus anyway, so sending it all is harmless
>
> *Explanation: for any single question, most of a corpus is noise. Keyword
> matching found this line easily because the question contained the exact
> code; the hard cases come when it doesn't. Whether sending everything is
> harmless is the subject of the next two concepts, and the evidence says it
> isn't free in cost or in quality.*
