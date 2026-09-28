# Keyword search and hybrid retrieval

> **Note for the site build:**
> - **Comprehensive sandbox:** multi-file, with `lib.py` read-only and
>   **`fusion.py` as the entry file**. `lib.py` is Lessons 1 to 5's code in
>   one file, exactly as shown below, including `terms` and `BM25Index`.
>   numpy must be loaded.
> - **Data for grading:** the documents, labels, and bge-small's
>   `structured-200.json` and `queries.json`. Hidden test 6 builds a BM25
>   index and runs every question through three searches; allow several
>   seconds. Hidden tests are one block and need no fake client.

> **You'll be able to**
> - Explain why rare words should count for more, and build BM25, with its
>   saturation of repeats and its normalisation for length
> - Fuse any number of rankings with Reciprocal Rank Fusion, and explain why
>   it combines ranks rather than scores
> - Judge hybrid search by how its results will be used: better ranking at
>   the top is a different gain from finding more answers further down

**Why it matters**
Agents search with identifiers constantly: error codes from tool results,
ticket ids, function names. Search by meaning handles paraphrases and
struggles with bare codes; keyword search is the reverse. Combining them is
standard practice, and this lesson shows both why it works and where it
doesn't, measured on the module's questions rather than assumed from its
reputation.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all four concepts, mixed order)*

> **Q1.** In a corpus of 1,968 chunks, a word appears in 1,000 of them.
> What does IDF's formula make of it?
> - A slightly negative weight, so matching it counts a little against a chunk ✅
> - A large positive weight, since the word is clearly important
> - A weight of exactly 1, the neutral value
> - No weight, since IDF skips words in over half the chunks
>
> *Explanation: log((N − n + 0.5)/(n + 0.5)) is below zero once n passes
> half of N. Words that common can't tell chunks apart. Stopword lists and
> implementations that add 1 inside the logarithm avoid the negative
> weight.*

> **Q2.** A word is rare in the corpus but has nothing to do with the
> question's intent. What does rarity weighting do with it?
> - Gives it a high weight anyway, since rarity is measured across the corpus, not against the question ✅
> - Ignores it, since IDF only weights words related to the question
> - Gives it a low weight, since irrelevant words are rare
> - Replaces it with a synonym that matches the question's intent
>
> *Explanation: "mean" is rare in this corpus and was weighted heavily for
> "What does REG-1007 mean?", though it isn't what the question is about.
> IDF knows how narrowing a word is, not whether it's the right clue.*

> **Q3.** A chunk repeats "rate limit" twenty times. How does BM25 stop it
> from dominating every rate-limit question?
> - Its count saturates, and its length raises the bar for each mention ✅
> - Its idf drops as the repeats increase
> - BM25 counts each word in a chunk only once
> - BM25 skips chunks where one phrase exceeds a set share of the text
>
> *Explanation: tf / (k1 × length adjustment + tf) flattens as the count
> grows, so twenty mentions are worth little more than a few. The repeats
> also lengthen the chunk, which increases the adjustment.*

> **Q4.** On Lesson 1's uneven heading sections, BM25 answered 17 questions
> with b = 0 and 26 with b = 0.75. Why the jump?
> - With b = 0, huge sections win by containing more words; b = 0.75 corrects for length ✅
> - b = 0.75 turns on rarity weighting, which b = 0 leaves off
> - b = 0 makes every score zero, so only ties decided the ranking
> - With b = 0.75, the index drops sections longer than the average
>
> *Explanation: those sections run from a line to thousands of tokens.
> Without length normalisation, a long section's many words outscore a
> short, exact answer. With it, a mention in a short section counts for
> more.*

> **Q5.** Why does Reciprocal Rank Fusion use ranks instead of scores?
> - Scores from different searches are on different scales; ranks are comparable across them ✅
> - Ranks are cheaper to store than scores
> - Scores are only available for the first result of each search
> - Using ranks removes the need to run the searches at all
>
> *Explanation: BM25 scores have no ceiling and cosine similarities sit in
> a narrow band, so adding them lets one search dominate. A first place is
> a first place in any search, which makes ranks safe to combine.*

> **Q6.** With k = 60, which fuses higher: a chunk ranked 1st by one search
> and absent from the other, or a chunk ranked 10th by both?
> - The chunk ranked 10th by both: 2/70 ≈ 0.029 beats 1/61 ≈ 0.016 ✅
> - The chunk ranked 1st by one search, since first place always wins
> - They tie, since RRF only counts the best rank of each chunk
> - It depends on the chunks' original scores
>
> *Explanation: RRF rewards agreement. With a large k, rank differences are
> small, so appearing in both lists matters more than a single top place.
> That's how fusion lifts chunks both searches like, and also how a
> confidently wrong list can drag.*

> **Q7.** A reranker will read the top 30 results of a first search. On this
> corpus, which first search looks better for it?
> - Search by meaning, which had more answers somewhere in its top 20 ✅
> - Hybrid, which put answers first more often
> - BM25, which never lost to word overlap
> - Whichever has the highest MRR, since MRR measures ranking
>
> *Explanation: a reranker reorders what it's given; it can't recover
> answers the first search didn't return. Coverage at depth is what
> matters for it, and there search by meaning led, 34 to 31 at twenty.
> Lesson 6 measures this directly.*

> **Q8.** Down-weighting BM25 to 0.25 made fusion match search by meaning's
> 28 on the main set. Why not adopt that weight straight away?
> - It was chosen by looking at these questions, so it may only fit them ✅
> - Weights below 1 aren't valid in Reciprocal Rank Fusion
> - A weight of 0.25 switches BM25 off entirely
> - Matching the other search's total means the weight did nothing
>
> *Explanation: any setting tuned on the main set fits its quirks a
> little. It gained "MON-2002" and the Alertmanager question and lost
> the "wake someone up at night" paraphrase and "What happened in
> INC-2093?", a trade the held-out questions should confirm before it's
> trusted.*

---

## Comprehensive sandbox
*(graded, multi-file — weighted fusion of any searches, and a report to judge it by)*

**Task shown to learner:**

`lib.py` holds Lessons 1 to 5's code, including `BM25Index`,
`meaning_search` and `answerable`. It's read-only. In `fusion.py`:

`fuse(searches, k=60, weights=None, depth=100)` returns a new search
function, `search(question, n)`:
- It calls each search in `searches` once, as `search(question, depth)`.
- It gives each chunk the sum, over the searches that returned it, of
  weight / (k + rank), with ranks counted from 1. Without `weights`, every
  search weighs 1.
- A chunk is identified by `(doc_id, chunk)`, so the same chunk returned by
  two searches is combined.
- It returns the best `n` as new dicts with the fused `"score"`, highest
  first, equal scores in the order chunks were first seen.
- `fuse` raises `ValueError` unless there's exactly one positive weight per
  search.

`report(named_searches, labelled, k=5)` takes a dict of name to search
function and, over the main questions that have evidence, returns
`{"answered": {name: count}, "by_type": {type: {name: count}}}`,
counting questions answerable in the top `k`.

**Tab: `lib.py`** (read-only)
```python
# Lessons 1 to 5's code, from their concepts -- read-only
import json
import math
import re
from collections import Counter
from pathlib import Path

def _plain(x):
    # turn content-block objects into plain dicts, so everything can be written as JSON
    if isinstance(x, (str, int, float, bool)) or x is None:
        return x
    if isinstance(x, dict):
        return {key: _plain(value) for key, value in x.items()}
    if isinstance(x, (list, tuple)):
        return [_plain(value) for value in x]
    return _plain(vars(x))

def count_tokens(x) -> int:
    """Approximate token count: about 4 characters per token. Deterministic, not a real tokenizer."""
    if isinstance(x, str):
        return math.ceil(len(x) / 4)
    return math.ceil(len(json.dumps(_plain(x))) / 4)

def load_documents() -> list[dict]:
    """Every document in the corpus, with its metadata and its text as Markdown."""
    return json.loads(Path("/data/rag/documents.json").read_text(encoding="utf-8"))

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

def build_prompt(question: str, passages: list[dict]) -> str:
    sources = "\n\n".join(f'<source doc="{p["doc_id"]}" section="{p["section"]}">\n{p["text"]}\n</source>'
                          for p in passages)
    return f"Answer using only these sources, and name the source you used.\n\n{sources}\n\nQuestion: {question}"


# --- Lesson 2 ---

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

def is_relevant_to_query(chunk: dict, query: dict) -> bool:
    return any(is_relevant(chunk, span) for group in query["evidence"] for span in group)

def precision_at_k(results: list[dict], query: dict, k: int) -> float:
    """The share of the k result slots filled by relevant chunks."""
    return sum(is_relevant_to_query(chunk, query) for chunk in results[:k]) / k

def recall_at_k(results: list[dict], query: dict, k: int) -> float:
    """The share of the answer's parts (evidence groups) found in the top k."""
    top = results[:k]
    found = [any(is_relevant(chunk, span) for chunk in top for span in group) for group in query["evidence"]]
    return sum(found) / len(found)

def reciprocal_rank(results: list[dict], query: dict, k: int) -> float:
    """1 / the position of the first relevant chunk in the top k, or 0 if there's none."""
    for position, chunk in enumerate(results[:k], 1):
        if is_relevant_to_query(chunk, query):
            return 1 / position
    return 0.0

def evaluate(search, queries: list[dict], k: int) -> dict:
    """Average each metric over the queries that have evidence. search(question, k) returns ranked chunks."""
    scored = [q for q in queries if q["evidence"]]
    totals = {"recall": 0.0, "precision": 0.0, "mrr": 0.0, "answerable": 0.0}
    for query in scored:
        results = search(query["query"], k)
        totals["recall"] += recall_at_k(results, query, k)
        totals["precision"] += precision_at_k(results, query, k)
        totals["mrr"] += reciprocal_rank(results, query, k)
        totals["answerable"] += recall_at_k(results, query, k) == 1
    return {name: round(total / len(scored), 3) for name, total in totals.items()}

def sign_test(gains: int, losses: int) -> float:
    """If a change made no real difference, the chance of a split at least this lopsided, either way."""
    n = gains + losses
    tail = sum(math.comb(n, i) for i in range(max(gains, losses), n + 1)) / 2 ** n
    return min(1.0, 2 * tail)


# --- Lesson 3 ---

CHARS_PER_TOKEN = 4

def fixed_chunks(document: dict, size: int, overlap: int = 0) -> list[dict]:
    """Cut a document every `size` tokens (by the course's estimate). Each chunk
    starts with the last `overlap` tokens of the one before."""
    if not 0 <= overlap < size:
        raise ValueError("overlap must be at least 0 and smaller than size")
    text = document["text"]
    width, step = size * CHARS_PER_TOKEN, (size - overlap) * CHARS_PER_TOKEN
    metadata = {key: value for key, value in document.items() if key != "text"}
    chunks = []
    for start in range(0, len(text), step):
        piece = text[start:start + width]
        if piece.strip():
            chunks.append({**metadata, "section": f"characters {start}-{start + len(piece)}", "text": piece})
        # the last window reached the end; another would only repeat its tail
        if start + width >= len(text):
            break
    return chunks

def split_blocks(text: str) -> list[str]:
    """Paragraphs and whole code blocks: split at blank lines, except inside a code block."""
    blocks, lines, in_code = [], [], False
    for line in text.splitlines():
        if line.startswith(FENCE):
            in_code = not in_code
        if not line.strip() and not in_code:
            if lines:
                blocks.append("\n".join(lines))
                lines = []
        else:
            lines.append(line)
    if lines:
        blocks.append("\n".join(lines))
    return blocks

def heading_sections(document: dict) -> list[dict]:
    """Split at Markdown headings (not inside code blocks), recording each section's heading path.
    A section with nothing under its heading is dropped: its heading lives on in the paths below it."""
    sections, stack, heading, body, in_code = [], [], "", [], False

    def close():
        text = "\n".join(body).strip()
        if text:
            path = " > ".join([document["title"], *(title for _, title in stack)])
            sections.append({"heading": heading, "path": path, "body": text})

    for line in document["text"].splitlines():
        if line.startswith(FENCE):
            in_code = not in_code
        match = None if in_code else re.match(r"(#{1,6}) (.+)", line)
        if match:
            close()
            level = len(match.group(1))
            # a heading replaces any heading at its level or deeper; level 1 is the document's title
            stack = [(lvl, title) for lvl, title in stack if lvl < level]
            if level > 1:
                stack.append((level, match.group(2).strip()))
            heading, body = line, []
        else:
            body.append(line)
    close()
    return sections

def pack_lines(lines: list[str], max_tokens: int) -> list[str]:
    """Group lines into parts of at most max_tokens; a line longer than that is cut into fixed-size pieces."""
    width = max_tokens * CHARS_PER_TOKEN
    lines = [line[start:start + width] for line in lines for start in range(0, max(len(line), 1), width)]
    parts, current = [], []
    for line in lines:
        if current and count_tokens("\n".join([*current, line])) > max_tokens:
            parts.append("\n".join(current))
            current = []
        current.append(line)
    if current:
        parts.append("\n".join(current))
    return parts

def pack_blocks(blocks: list[str], max_tokens: int) -> list[str]:
    """Group consecutive blocks into pieces of at most max_tokens, joined by blank lines.
    A block too big on its own is split at line breaks, and a line still too big is cut every max_tokens."""
    pieces, current = [], []
    for block in blocks:
        if count_tokens(block) > max_tokens:
            parts = pack_lines(block.splitlines(), max_tokens)
        else:
            parts = [block]
        for part in parts:
            if current and count_tokens("\n\n".join([*current, part])) > max_tokens:
                pieces.append("\n\n".join(current))
                current = []
            current.append(part)
    if current:
        pieces.append("\n\n".join(current))
    return pieces

def structured_chunks(document: dict, max_tokens: int = 200) -> list[dict]:
    """Chunks that follow the document's structure: headings, then paragraphs and whole code blocks,
    each chunk starting with its section's heading and carrying the document's metadata."""
    metadata = {key: value for key, value in document.items() if key != "text"}
    chunks = []
    for section in heading_sections(document):
        heading = section["heading"]
        # the heading line and the blank line after it come out of each chunk's budget
        room = max_tokens - count_tokens(heading + "\n\n") if heading else max_tokens
        for piece in pack_blocks(split_blocks(section["body"]), room):
            text = f"{heading}\n\n{piece}" if heading else piece
            chunks.append({**metadata, "section": section["path"], "chunk": len(chunks), "text": text})
    return chunks

def within_budget(search, budget: int):
    """A search that returns ranked chunks until the next one would take the total over budget tokens."""
    def budgeted(question: str, k: int) -> list[dict]:
        results, used = [], 0
        for chunk in search(question, 100):
            size = count_tokens(chunk["text"])
            if used + size > budget:
                break
            results.append(chunk)
            used += size
        return results
    return budgeted


# --- Lesson 4 ---

import base64
import hashlib

import numpy as np

EMBEDDINGS = Path("/data/rag/embeddings")

def text_key(text: str) -> str:
    """How a chunk's vector is filed: the first 16 hex digits of the SHA-256 of its text."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]

def _unpack(encoded: str, dim: int) -> np.ndarray:
    return np.frombuffer(base64.b64decode(encoded), dtype="<f2").reshape(-1, dim).astype(np.float32)

def vectors_for(chunks: list[dict], model: str = "bge-small-en-v1.5", chunking: str = "structured-200") -> np.ndarray:
    """The precomputed embedding of each chunk, one row per chunk, in the chunks' order."""
    stored = json.loads((EMBEDDINGS / model / f"{chunking}.json").read_text())
    matrix = _unpack(stored["vectors"], stored["dim"])
    rows = {key: row for row, key in enumerate(stored["keys"])}
    missing = [c for c in chunks if text_key(c["text"]) not in rows]
    if missing:
        raise KeyError(f"{len(missing)} chunks have no precomputed vector in {model}/{chunking}; "
                       f"their text differs from the text that was embedded")
    return matrix[[rows[text_key(c["text"])] for c in chunks]]

def query_vectors(model: str = "bge-small-en-v1.5", kind: str = "instructed") -> dict[str, np.ndarray]:
    """The precomputed embedding of every labelled query, by query id. kind is "instructed" or "plain"."""
    stored = json.loads((EMBEDDINGS / model / "queries.json").read_text())
    return dict(zip(stored["keys"], _unpack(stored[kind], stored["dim"])))

class VectorIndex:
    """Chunks with their embeddings, searched by cosine similarity to a query vector."""

    def __init__(self, dim: int = 384):
        self._chunks = []
        self._matrix = np.empty((0, dim), dtype=np.float32)

    def __len__(self) -> int:
        return len(self._chunks)

    def add(self, chunks: list[dict], vectors: np.ndarray) -> None:
        vectors = np.asarray(vectors, dtype=np.float32)
        if vectors.ndim != 2 or len(vectors) != len(chunks):
            raise ValueError(f"need one vector per chunk: got {len(chunks)} chunks and vectors of shape {vectors.shape}")
        for chunk in chunks:
            if not chunk.get("doc_id") or not chunk.get("section"):
                raise ValueError("every chunk needs a doc_id and a section, so an answer can cite it")
        # stored at length 1, so a dot product with a length-1 query is the cosine
        unit = vectors / np.linalg.norm(vectors, axis=1, keepdims=True)
        self._chunks.extend(chunks)
        self._matrix = np.vstack([self._matrix, unit])

    def search(self, query_vector: np.ndarray, k: int = 3) -> list[dict]:
        query = np.asarray(query_vector, dtype=np.float32)
        scores = self._matrix @ (query / np.linalg.norm(query))
        # a stable sort keeps equal scores in the order the chunks were added
        best = np.argsort(-scores, kind="stable")[:k]
        return [{**self._chunks[row], "score": float(scores[row])} for row in best]

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


# --- Lesson 5 ---

def terms(text: str) -> list[str]:
    """Like keywords, but a list that keeps repeats, so each word's count in the text is known."""
    words = text.lower().translate(PUNCTUATION).split()
    return [word for word in words if len(word) > 1 and word not in STOPWORDS]

class BM25Index:
    """Chunks scored by BM25: rarity-weighted matches, saturating with repeats, normalised for length."""

    def __init__(self, k1: float = 1.2, b: float = 0.75):
        self.k1, self.b = k1, b
        self._chunks, self._counts = [], []
        self._idf, self._average_length = {}, 0.0

    def __len__(self) -> int:
        return len(self._chunks)

    def add(self, chunks: list[dict]) -> None:
        for chunk in chunks:
            if not chunk.get("doc_id") or not chunk.get("section"):
                raise ValueError("every chunk needs a doc_id and a section, so an answer can cite it")
            self._chunks.append(chunk)
            self._counts.append(Counter(terms(chunk["text"])))
        # rarity and average length describe the whole collection, so recompute them after every batch
        n = len(self._counts)
        containing = Counter(word for counts in self._counts for word in counts)
        self._idf = {word: math.log((n - df + 0.5) / (df + 0.5)) for word, df in containing.items()}
        self._average_length = sum(sum(c.values()) for c in self._counts) / n

    def score(self, question: str, row: int) -> float:
        counts = self._counts[row]
        length = sum(counts.values())
        norm = self.k1 * ((1 - self.b) + self.b * length / self._average_length)
        return sum(self._idf[word] * counts[word] / (norm + counts[word])
                   for word in set(terms(question)) if word in counts)

    def search(self, question: str, k: int = 3) -> list[dict]:
        scored = [(self.score(question, row), row) for row in range(len(self._chunks))]
        # sorting is stable, so equal scores keep the order the chunks were added in
        ranked = sorted((pair for pair in scored if pair[0] > 0), key=lambda pair: pair[0], reverse=True)
        return [{**self._chunks[row], "score": float(score)} for score, row in ranked[:k]]
```

**Tab: `fusion.py`** (starter, entry file)
```python
from collections import Counter, defaultdict

from lib import answerable

def fuse(searches: list, k: int = 60, weights: list[float] | None = None, depth: int = 100):
    """A search(question, n) that fuses the given searches with weighted Reciprocal Rank Fusion."""
    # TODO: check the weights, then return a function search(question, n)
    ...

def report(named_searches: dict, labelled: dict, k: int = 5) -> dict:
    """Answered-at-k counts for each search, overall and by query type, on the main questions with evidence."""
    # TODO
    ...
```

**Hidden tests:**
```python
import lib
from fusion import fuse, report

# shared by the tests below
def chunk(doc_id, number, text):
    return {"doc_id": doc_id, "chunk": number, "section": "s", "text": text}
A, B = chunk("D01", 0, "sixty requests per minute"), chunk("D02", 0, "too many requests")
C, D = chunk("D03", 0, "model not allowed on tier"), chunk("D01", 1, "priority tier needs approval")
calls = []
def fixed(name, results):
    def search(question, n):
        calls.append((name, question, n))
        return [dict(r) for r in results][:n]
    return search
keyword = fixed("keyword", [A, B, C])
meaning = fixed("meaning", [C, A, D])

# 1. Reciprocal Rank Fusion over any number of searches
fused = fuse([keyword, meaning])
assert callable(fused), f"fuse should return a search function; got {fused!r}"
results = fused("q", 4)
assert isinstance(results, list), f"the fused search should return a list; got {results!r}"
assert [(r["doc_id"], r["chunk"]) for r in results] == [("D01", 0), ("D03", 0), ("D02", 0), ("D01", 1)], \
    f"fused order should be A, C, B, D; got {[(r['doc_id'], r['chunk']) for r in results]}"
assert abs(results[0]["score"] - (1 / 61 + 1 / 62)) < 1e-12, f"A's score is 1/(60+1) + 1/(60+2); got {results[0]['score']}"
assert len(fused("q", 2)) == 2, "return at most n results"
three = fuse([keyword, meaning, fixed("third", [D, C])])("q", 1)
assert (three[0]["doc_id"], three[0]["chunk"]) == ("D03", 0), "a third search's votes count too: C should overtake A"

# 2. each search runs once per question, asked for depth results
calls.clear()
fuse([keyword, meaning], depth=7)("which", 3)
assert calls == [("keyword", "which", 7), ("meaning", "which", 7)], f"call each search once, with depth; got {calls}"

# 3. weights scale each search's contribution, and bad weights are refused
weighted = fuse([keyword, meaning], weights=[1.0, 3.0])("q", 1)[0]
assert (weighted["doc_id"], weighted["chunk"]) == ("D03", 0), "tripling meaning's weight should put its first result first"
assert abs(weighted["score"] - (1 / 63 + 3 / 61)) < 1e-12, weighted["score"]
for bad in ([1.0], [1.0, 0.0], [1.0, -2.0]):
    try:
        fuse([keyword, meaning], weights=bad)
    except ValueError:
        pass
    else:
        raise AssertionError(f"weights {bad} should raise ValueError")

# 4. equal fused scores keep the order chunks were first seen
tie = fuse([fixed("x", [A, B]), fixed("y", [B, A])])("q", 2)
assert [(r["doc_id"], r["chunk"]) for r in tie] == [("D01", 0), ("D02", 0)], "ties keep first-seen order"

# 5. report: main questions with evidence only, overall and by type
LABELLED = {"main": [
    {"id": "t1", "type": "identifier", "query": "q", "evidence": [[{"doc_id": "D03", "quote": "model not allowed on tier"}]]},
    {"id": "t2", "type": "paraphrase", "query": "q", "evidence": [[{"doc_id": "D01", "quote": "priority tier needs approval"}]]},
    {"id": "t3", "type": "unanswerable", "query": "q", "evidence": []},
], "held_out": [{"id": "h1", "type": "identifier", "query": "q", "evidence": [[{"doc_id": "D03", "quote": "model not allowed on tier"}]]}]}
result = report({"keyword": keyword, "meaning": meaning}, LABELLED, k=2)
assert result == {"answered": {"keyword": 0, "meaning": 1},
                  "by_type": {"identifier": {"keyword": 0, "meaning": 1}, "paraphrase": {"keyword": 0, "meaning": 0}}}, \
    f"count answered questions per search, overall and by type, main questions with evidence only; got {result}"

# 6. the real corpus
labelled = lib.load_queries()
chunks = [c for d in lib.load_documents() for c in lib.structured_chunks(d, 200)]
bm25 = lib.BM25Index()
bm25.add(chunks)
by_meaning = lib.meaning_search(chunks, labelled["main"])
result = report({"hybrid": fuse([bm25.search, by_meaning]), "meaning": by_meaning,
                 "light keywords": fuse([bm25.search, by_meaning], weights=[0.25, 1.0])}, labelled)
assert result["answered"] == {"hybrid": 27, "meaning": 28, "light keywords": 28}, result["answered"]
assert result["by_type"]["paraphrase"] == {"hybrid": 6, "meaning": 8, "light keywords": 7}, result["by_type"]["paraphrase"]
```

**Hint (shown on request):**

`fuse` is a function that builds and returns another function; the inner
one can use `searches`, `weights`, `k` and `depth` from the outer one.
`defaultdict(float)` accumulates the scores. `dict.setdefault` keeps the
first copy of each chunk it sees, and Python's `sorted` is stable, so
sorting keys by score keeps ties in first-seen order.

**Reference solution:**

**Tab: `fusion.py`**
```python
from collections import Counter, defaultdict

from lib import answerable

def fuse(searches: list, k: int = 60, weights: list[float] | None = None, depth: int = 100):
    """A search(question, n) that fuses the given searches with weighted Reciprocal Rank Fusion."""
    weights = [1.0] * len(searches) if weights is None else list(weights)
    if len(weights) != len(searches) or any(w <= 0 for w in weights):
        raise ValueError("give one positive weight per search")

    def search(question: str, n: int) -> list[dict]:
        scores, found = defaultdict(float), {}
        for weight, ranked_search in zip(weights, searches):
            for rank, chunk in enumerate(ranked_search(question, depth), 1):
                key = (chunk["doc_id"], chunk["chunk"])
                scores[key] += weight / (k + rank)
                found.setdefault(key, chunk)
        # sorted is stable, so equal scores keep the order chunks were first seen in
        best = sorted(scores, key=scores.get, reverse=True)[:n]
        return [{**found[key], "score": scores[key]} for key in best]

    return search

def report(named_searches: dict, labelled: dict, k: int = 5) -> dict:
    """Answered-at-k counts for each search, overall and by query type, on the main questions with evidence."""
    queries = [q for q in labelled["main"] if q["evidence"]]
    answered = {name: {q["id"] for q in queries if answerable(search(q["query"], k), q)}
                for name, search in named_searches.items()}
    by_type = defaultdict(dict)
    for query_type in Counter(q["type"] for q in queries):
        for name, ids in answered.items():
            by_type[query_type][name] = sum(q["id"] in ids for q in queries if q["type"] == query_type)
    return {"answered": {name: len(ids) for name, ids in answered.items()}, "by_type": dict(by_type)}
```

**Explanation:**

Returning a search function makes fusion composable: the fused search has
the same shape as the searches it combines, so it can go anywhere a search
can, into `report`, into Lesson 2's harness, or into another `fuse`. Test 2
checks that each search runs exactly once per question, which matters when a
search is a model call. The weights are the lever the previous concept
suggested, and test 6 shows what pulling it does: at weight 0.25 for BM25,
fusion answers 28 questions, the same total as search by meaning alone, by
winning back "MON-2002" and the Alertmanager question and giving up "Which
alerts wake someone up at night?" and "What happened in INC-2093?". That's
a trade rather than a free gain, found by looking at these very questions,
so it's exactly the kind of setting Lesson 2 said to confirm on the held-out
set before trusting. This module's final lesson does that.
