# Module 5, Lesson 1 — Concept 4: The pipeline's two halves

> **Note for the site build:**
> - **Shared setup additions,** appended after concept 1's (`COUNT_TOKENS`,
>   `load_documents`) for every demo and exercise from this concept on:
>   `FENCE`, `split_sections`, `load_sections`, `STOPWORDS`, `PUNCTUATION`
>   and `keywords`, exactly as shown in the first code block below. New and
>   backward compatible; nothing earlier uses them.
> - **The first demo also needs the fake client:** `REACT_FAKE_CLIENT` then
>   `RECORDING_CLIENT` from `fakeClient.ts`, unchanged. The demos run in order
>   and share state: the second and third use the `index` and `retrieve`
>   defined in the first.
> - **The exercise's hidden test 6 reads the corpus,** so the data loader from
>   concept 1 must also run before grading, not only before a demo.

---

## Two halves, on two schedules

Every retrieval system, from this lesson's to a search engine's, splits into
two halves that run at different times:

- **Indexing** runs once per document, before any question arrives, and
  again only when a document changes. It loads the documents, splits them
  into pieces small enough to send, works out what each piece can be found
  by, and stores the pieces with their metadata.
- **Querying** runs for every question. It takes the question, searches the
  stored pieces, puts the best few into a prompt, and calls the model.

The split decides where work belongs. Anything that depends only on the
documents belongs in indexing, because there it's paid once per document.
Anything done in querying is paid again on every question, and the user is
waiting for it. The same idea runs through a database, which builds its
index when rows are written so reads can be fast.

In an agent, querying happens inside the loop. For now it runs once, before
the model is called; Lesson 10 turns it into a tool the agent calls when it
decides it needs to.

---

## The pieces, and what they're found by

Splitting documents well is Lesson 3's subject, so for this lesson the
corpus is split for you, at its Markdown headings. Each section keeps its
document's metadata and records its heading, so every piece knows where it
came from. Searching reuses
[Module 4's keyword matching](→ Module 4, long-term memory lesson, storage, retrieval, injection concept, storage, retrieval, injection, in code),
with one addition: backticks count as punctuation, because this corpus is
Markdown and writes identifiers like `` `REG-1007` `` in them.

```python
import re

# three backticks, built rather than typed, so this code can sit inside a Markdown code block
FENCE = "`" * 3

def split_sections(document: dict) -> list[dict]:
    """Split a document at its Markdown headings, ignoring '#' lines inside code blocks.
    Each section keeps the document's metadata and records the heading it sits under."""
    sections, lines, heading, in_code = [], [], document["title"], False

    def close():
        text = "\n".join(lines).strip()
        if text:
            meta = {key: value for key, value in document.items() if key != "text"}
            sections.append({**meta, "section": heading, "text": text})

    for line in document["text"].splitlines():
        if line.startswith(FENCE):
            in_code = not in_code
        if not in_code and re.match(r"#{1,6} ", line):
            close()
            lines, heading = [], line.lstrip("#").strip()
        lines.append(line)
    close()
    return sections

def load_sections() -> list[dict]:
    return [section for document in load_documents() for section in split_sections(document)]

STOPWORDS = {"a", "an", "the", "and", "or", "of", "to", "in", "on", "for", "is", "was", "it", "this", "that",
             "with", "as", "at", "by", "be", "i", "you", "my", "me", "we", "our", "please", "about", "from", "last"}
PUNCTUATION = str.maketrans({mark: " " for mark in ".,;:!?()'\"`"})

def keywords(text: str) -> set:
    """The words in text worth matching on: lowercased, punctuation removed, common and one-letter words dropped."""
    words = text.lower().translate(PUNCTUATION).split()
    return {word for word in words if len(word) > 1} - STOPWORDS
```
*(defined once here and already loaded for every demo and exercise from here to the end of this lesson)*

---

## One question, end to end

Here are both halves. Indexing works out each section's keywords once and
keeps them next to the section. Querying scores every section by how many
keywords it shares with the question, keeps the best three, and wraps each
in a tag that names its source:

```python
# --- indexing: once, before any question arrives ---
sections = load_sections()
index = [(keywords(section["text"]), section) for section in sections]

# --- querying: for every question ---
def retrieve(index: list, question: str, k: int = 3) -> list[dict]:
    wanted = keywords(question)
    scored = [(len(wanted & words), section) for words, section in index]
    # sorting is stable, so sections with equal scores stay in corpus order
    ranked = sorted((pair for pair in scored if pair[0] > 0), key=lambda pair: pair[0], reverse=True)
    return [section for score, section in ranked[:k]]

def build_prompt(question: str, passages: list[dict]) -> str:
    sources = "\n\n".join(f'<source doc="{p["doc_id"]}" section="{p["section"]}">\n{p["text"]}\n</source>'
                          for p in passages)
    return f"Answer using only these sources, and name the source you used.\n\n{sources}\n\nQuestion: {question}"

question = "Why won't the registry let me move my agent to claude-opus?"
passages = retrieve(index, question)
prompt = build_prompt(question, passages)

client = RecordingClient([[TextBlock("claude-opus isn't allowed on the standard tier. Move the agent to the "
                                     "priority tier first, then change its model (D07, Step 1).")]])
reply = client.create([{"role": "user", "content": prompt}])

print(f"{len(index):,} sections indexed")
print("Retrieved:")
for p in passages:
    print(f"  {p['doc_id']} | {p['section']}")
print(f"Sent {count_tokens(prompt):,} tokens")
print(f"Answer: {reply.content[0].text}")
```
```
1,145 sections indexed
Retrieved:
  D07 | Why and by when
  D07 | Step 1: Check the target is allowed
  D14 | Why does my agent get told to slow down?
Sent 262 tokens
Answer: claude-opus isn't allowed on the standard tier. Move the agent to the priority tier first, then change its model (D07, Step 1).
```
*(runs live, shows output — read-only demo snippet, not graded. The model's reply is scripted; the fake client can't read the sources.)*

The prompt was 262 tokens, against 232,241 for the whole corpus. One of the
three sections, D07's "Step 1", holds the answer: `claude-opus` needs the
`priority` tier. The other two are there because they share words like
"why" and "agent" with the question, not because they help. The tags matter
as much as the text: because every passage names its document and section,
the answer can say where it came from, and so can be checked.

---

## Where it breaks

The same retrieval, on two more questions:

```python
for question in ["What does REG-1007 mean?", "Which alerts wake someone up at night?"]:
    print(question)
    for p in retrieve(index, question):
        print(f"  {p['doc_id']} | {p['section']}")
```
```
What does REG-1007 mean?
  prometheus-docs/guides/multi-target-exporter.md | Querying multi-target exporters with Prometheus
  prometheus-docs/guides/open_metrics_2_0_migration.md | Specification Terminology Changes
  prometheus-docs/instrumenting/writing_exporters.md | Drop less useful statistics
Which alerts wake someone up at night?
  prometheus-docs/instrumenting/writing_exporters.md | Naming
  prometheus-docs/operating/security.md | Alertmanager
  prometheus-docs/practices/rules.md | Aggregation
```
*(runs live, shows output — read-only demo snippet, not graded)*

Neither result contains an answer. They fail for two different reasons.

**Every word counts the same.** The error-code table's section contains
`reg-1007`, so it shares one keyword with the first question. Plenty of
vendor pages share two, such as "what" and "does", and outrank it. Counting how
many sections contain each word shows why that's backwards:

```python
for word in sorted(keywords("What does REG-1007 mean?")):
    print(f"{word:<9} is in {sum(word in words for words, _ in index):>3} sections")
```
```
does      is in  69 sections
mean      is in   6 sections
reg-1007  is in   5 sections
what      is in  81 sections
```
*(runs live, shows output — read-only demo snippet, not graded)*

`reg-1007` appears in 5 sections and picks out the answer almost on its
own; `what` appears in 81 and says almost nothing. A good score should
weigh a word by how rare it is, which is what Lesson 5's keyword scoring
does. The table also shows a smaller problem: the error table's heading
says "Meaning", and exact matching doesn't connect "meaning" to "mean".

**The words don't match at all.** The monitoring guide answers the second
question: outside 08:00 to 20:00, only `RegistryUnreachable` pages. But it
never says "wake", "someone" or "night". It shares only "alerts" with the
question, while Prometheus's alerting pages share three words. No weighting
fixes this. It needs search by what the text means, not which words it
uses, which is Lesson 4.

Two failures on two questions show that these problems exist. They don't
show how often they happen, or whether a fix helps more questions than it
hurts. That takes a set of questions with known answers and a way to score
retrieval against it, which is where Lesson 2 starts.

---

## The module, on the pipeline

Every lesson ahead improves one part of these two halves, or measures them:

- **Measuring the whole thing:** Lesson 2, before anything is changed.
- **Indexing:**
  - how to split documents into pieces: Lesson 3
  - what pieces can be found by, meaning and weighted keywords: Lessons 4 and 5
  - making pieces that make sense out of their document: Lesson 8
  - a graph of the relationships between things: Lesson 11
- **Querying:**
  - rewriting the question before searching: Lesson 7
  - searching by meaning and keywords together: Lessons 4 and 5
  - a second, more careful ranking of the best candidates: Lesson 6
  - building the prompt, citing sources and declining to answer: Lesson 9
  - letting the agent decide when and what to search: Lesson 10
  - leaving out what the user may not read: Lesson 12
- **Both, inside an agent's context step:** Lesson 13.

---

## Quiz cards

> **Q1.** Why does working out each section's keywords belong in indexing
> rather than querying?
> - It depends only on the section, so doing it once per section beats doing it for every question ✅
> - Keywords can only be worked out before the model has been called
> - Querying can't read the section text, only its metadata
> - Indexing runs on a faster machine, so all work should go there
>
> *Explanation: work that depends only on the documents gives the same
> result every time, so it's paid once at indexing. Work in querying is
> repeated for every question while the user waits. Where the halves run is
> a deployment choice; the reason for the split is how often each is paid.*

> **Q2.** Why does each retrieved passage go into the prompt wrapped in a
> tag naming its document and section?
> - So the answer can say where it came from, and a reader can check it ✅
> - Because models ignore text that isn't inside a tag
> - So the model can fetch the rest of the document if it needs more
> - Because the tags reduce the number of tokens the passages take up
>
> *Explanation: a source travels with every piece from indexing to the
> answer, so the answer can cite it. Without the tags, the model sees
> anonymous text and can't point anywhere. The tags add a few tokens; they
> don't save any.*

> **Q3.** Keyword matching ranked vendor pages above the error-code table
> for "What does REG-1007 mean?". What's the underlying problem?
> - Every shared word counts the same, so common words like "what" outweigh a rare identifier ✅
> - The error-code table is too short to be found by keyword matching
> - Identifiers like REG-1007 can't be matched, because they contain a hyphen
> - Vendor documentation is always ranked first, because there's more of it
>
> *Explanation: the table does match, on `reg-1007`, but only one word,
> while many pages match two common words. A word in 5 sections tells you
> far more than one in 81, so it should count for more. The hyphen isn't
> the problem: `reg-1007` stayed one keyword and matched.*

> **Q4.** Why can't weighting words by rarity fix "Which alerts wake
> someone up at night?"
> - The section that answers it uses different words, so there's almost nothing to weigh ✅
> - The answer is in a restricted document, so it's filtered out
> - Rare words are already weighted highest in the current scoring
> - The question is too short for any scoring method to work on
>
> *Explanation: the monitoring guide says "outside 08:00 to 20:00, only
> RegistryUnreachable pages". It shares only "alerts" with the question.
> Weighting changes how shared words count; it can't create shared words.
> That needs search by meaning.*

---

## Applied sandbox exercise
*(graded — build a keyword index that does its per-section work once, at indexing time, and returns every result with its source)*

**Task shown to learner:**

Write a `KeywordIndex` class that keeps the two halves apart:

- `add(sections)` takes a list of section dicts, like the ones
  `load_sections()` returns. For each, it works out the keywords with
  `keywords(section["text"])` and stores them with the section. A section
  without a `doc_id` or a `section` heading can't be cited, so `add` raises
  `ValueError` for it.
- `search(question, k=3)` works out the question's keywords, scores every
  stored section by how many keywords it shares with the question, and
  returns the best `k`, highest score first. Leave out sections that share
  no keywords. When scores are equal, keep the order sections were added
  in. Each result is a **new** dict: the section's fields plus a `"score"`.
  Searching must never change what the index stores.
- `len(index)` is the number of sections stored.

`keywords`, `load_sections` and the rest of this lesson's setup are already
loaded.

**Starter code:**

```python
class KeywordIndex:
    """Sections indexed by their keywords, worked out once, when each section is added."""

    def __init__(self):
        self._entries = []

    def __len__(self) -> int:
        return len(self._entries)

    def add(self, sections: list[dict]) -> None:
        # TODO: refuse a section without a doc_id or section heading;
        #       otherwise store its keywords alongside it
        ...

    def search(self, question: str, k: int = 3) -> list[dict]:
        # TODO: score every stored section against the question's keywords,
        #       and return the best k as new dicts that include their score
        ...
```

**Hidden tests:**

```python
# 1. keywords are worked out when sections are added, and only for the question when searching
SMALL = [
    {"doc_id": "D01", "section": "Rate limits", "text": "Each key may make 60 requests per minute."},
    {"doc_id": "D02", "section": "Limits and availability", "text": "REG-1009 means the key made too many requests."},
    {"doc_id": "D07", "section": "Step 1", "text": "Moving to claude-opus needs the priority tier."},
]
calls = []
_real_keywords = keywords
def keywords(text):
    calls.append(text)
    return _real_keywords(text)
try:
    index = KeywordIndex()
    index.add(SMALL)
    assert len(calls) == 3, f"add should work out each section's keywords once; it did so {len(calls)} times for 3 sections"
    index.search("requests per minute")
    index.search("priority tier")
    assert len(calls) == 5, "search should work out keywords for the question only, not again for every section"
finally:
    keywords = _real_keywords

# 2. results carry their source and their score, best first
SMALL = [
    {"doc_id": "D01", "section": "Rate limits", "text": "Each key may make 60 requests per minute."},
    {"doc_id": "D02", "section": "Limits and availability", "text": "REG-1009 means the key made too many requests."},
    {"doc_id": "D07", "section": "Step 1", "text": "Moving to claude-opus needs the priority tier."},
]
index = KeywordIndex()
index.add(SMALL)
results = index.search("how many requests per minute can a key make")
assert [r["doc_id"] for r in results] == ["D01", "D02"], f"expected D01 then D02, got {[r['doc_id'] for r in results]}"
assert all("score" in r for r in results), "each result should include its score under the key 'score'"
assert results[0]["section"] == "Rate limits" and "text" in results[0], "each result should keep its section's fields"
assert [r["score"] for r in results] == [5, 3], f"scores should count shared keywords; got {[r.get('score') for r in results]}"

# 3. equal scores keep the order sections were added in; sections that share no keywords are left out
SMALL = [
    {"doc_id": "A", "section": "one", "text": "alpha beta"},
    {"doc_id": "B", "section": "two", "text": "beta gamma"},
    {"doc_id": "C", "section": "three", "text": "gamma delta"},
]
index = KeywordIndex()
index.add(SMALL)
assert [r["doc_id"] for r in index.search("beta")] == ["A", "B"], "ties should keep the order the sections were added in"
assert [r["doc_id"] for r in index.search("gamma beta", k=5)] == ["B", "A", "C"], "best score first, then insertion order"
assert index.search("omega") == [], "a question that shares no keywords should return an empty list"
assert len(index.search("beta gamma delta", k=1)) == 1, "search should return at most k results"

# 4. searching doesn't change the stored sections
SMALL = [{"doc_id": "D01", "section": "Rate limits", "text": "Each key may make 60 requests per minute."}]
index = KeywordIndex()
index.add(SMALL)
first = index.search("requests per minute")[0]
first["text"] = "changed by the caller"
assert "score" not in SMALL[0], "search added a score to the stored section itself; return a new dict per result"
assert index.search("requests per minute")[0]["text"] == "Each key may make 60 requests per minute.", \
    "changing a result shouldn't change what the index stores"

# 5. a section without a source is refused
for broken in [{"section": "Rate limits", "text": "60 requests per minute"},
               {"doc_id": "D01", "section": "", "text": "60 requests per minute"}]:
    index = KeywordIndex()
    try:
        index.add([broken])
    except ValueError:
        pass
    else:
        raise AssertionError(f"add should raise ValueError for a section without a doc_id and section: {broken}")

# 6. the whole corpus
index = KeywordIndex()
index.add(load_sections())
assert len(index) == 1145, f"expected 1,145 sections indexed, got {len(index)}"
results = index.search("Why won't the registry let me move my agent to claude-opus?")
assert [(r["doc_id"], r["section"]) for r in results] == [
    ("D07", "Why and by when"), ("D07", "Step 1: Check the target is allowed"),
    ("D14", "Why does my agent get told to slow down?")], [(r["doc_id"], r["section"]) for r in results]
```

**Hint (shown on request):**

In `add`, store a pair per section: `(keywords(section["text"]), section)`.
Then `search` calls `keywords` once, for the question, and compares it with
each stored set using `&`. Python's `sorted` is stable, so sorting only by
score keeps equal scores in the order they were added. To return a new dict
with an extra field, use `{**section, "score": score}`.

**Reference solution:**

```python
class KeywordIndex:
    """Sections indexed by their keywords, worked out once, when each section is added."""

    def __init__(self):
        self._entries = []

    def __len__(self) -> int:
        return len(self._entries)

    def add(self, sections: list[dict]) -> None:
        for section in sections:
            if not section.get("doc_id") or not section.get("section"):
                raise ValueError("every section needs a doc_id and a section heading, so an answer can cite it")
            self._entries.append((keywords(section["text"]), section))

    def search(self, question: str, k: int = 3) -> list[dict]:
        wanted = keywords(question)
        scored = [(len(wanted & words), section) for words, section in self._entries]
        # sorting is stable, so sections with equal scores keep the order they were added in
        ranked = sorted((pair for pair in scored if pair[0] > 0), key=lambda pair: pair[0], reverse=True)
        return [{**section, "score": score} for score, section in ranked[:k]]
```

**Explanation:**

The keyword sets are the index: they're computed once in `add` and reused
by every search, so a search does one piece of new work, the question's
keywords, plus cheap set intersections. That's the indexing/querying split
in miniature. Refusing a section without a `doc_id` and heading enforces
the rule that every piece carries its source from the start, since a
passage that can't be traced can't be cited later. Returning
`{**section, "score": score}` builds a new dict per result, so a caller
who edits a result, or the score itself, never changes the stored section.
Sorting with `key=lambda pair: pair[0]` rather than by the whole pair
matters twice: it keeps ties in insertion order, and it never tries to
compare two dicts, which Python can't order.
