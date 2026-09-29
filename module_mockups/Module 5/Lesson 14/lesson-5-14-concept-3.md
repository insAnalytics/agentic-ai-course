# Module 5, Lesson 14 — Concept 3: Duplicates in different words

> **Note for the site build:**
> - The shared setup now includes the previous exercise's reference
>   solution, `hybrid_search`.
> - No new shared code before the exercise. **The exercise's reference
>   solution** (`duplicate_candidates`) joins the shared setup only for pages
>   *after* this concept.

---

## Similarity by meaning, on labelled pairs

Module 4's duplicate check compared keywords, and the first concept showed it
catching no duplicate in other words while scoring contradictions highest.
Search by meaning compares what two statements are about, so the natural
replacement is cosine similarity between their vectors, with a threshold. Both
memories are statements, not a question and a passage, so both are embedded as
documents, without bge's query instruction. Here's the similarity for every
labelled pair:

```python
pairs = load_context_step()["pairs"]
similarity = {p["id"]: float(text_vectors([p["a"]])[0] @ text_vectors([p["b"]])[0]) for p in pairs}
for label in ("duplicate", "contradiction", "related"):
    values = sorted((round(similarity[p["id"]], 2) for p in pairs if p["label"] == label), reverse=True)
    print(f"{label:<14} {values}")
```
```
duplicate      [0.97, 0.96, 0.92, 0.89, 0.89, 0.81, 0.73]
contradiction  [0.95, 0.93, 0.88, 0.84, 0.82]
related        [0.9, 0.81, 0.72, 0.67, 0.63, 0.54]
```
*(runs live, shows output — read-only demo snippet, not graded)*

Duplicates now score high, most of them above 0.88: "support_agent belongs to
Priya" and "Priya owns support_agent" reach 0.97, with no word order in common.
But look at the contradictions. They score just as high, up to 0.95, because
"deploys on Tuesdays and Thursdays" and "deploys on Mondays and Wednesdays"
are about exactly the same thing. They disagree about one detail, and similarity
of meaning doesn't care which detail.

---

## Choosing a threshold

A threshold is chosen on labelled examples, the way Lesson 10 chose when to
abstain:

```python
pairs = load_context_step()["pairs"]
similarity = {p["id"]: float(text_vectors([p["a"]])[0] @ text_vectors([p["b"]])[0]) for p in pairs}
totals = Counter(p["label"] for p in pairs)
print(f"{'threshold':>9}{'duplicates':>12}{'contradictions':>16}{'related':>10}   (pairs at or above it)")
for threshold in (0.75, 0.80, 0.85, 0.90):
    above = Counter(p["label"] for p in pairs if similarity[p["id"]] >= threshold)
    print(f"{threshold:>9}" + "".join(f"{f'{above[label]} of {totals[label]}':>{width}}"
                                      for label, width in (("duplicate", 12), ("contradiction", 16), ("related", 10))))
```
```
threshold  duplicates  contradictions   related   (pairs at or above it)
     0.75      6 of 7          5 of 5    2 of 6
      0.8      6 of 7          5 of 5    2 of 6
     0.85      5 of 7          3 of 5    1 of 6
      0.9      3 of 7          2 of 5    0 of 6
```
*(runs live, shows output — read-only demo snippet, not graded)*

No threshold separates duplicates from contradictions: at every level they're
caught together. What a threshold *can* separate is "about the same thing" from
"about something else". At 0.8, it catches six of the seven duplicates and all
five contradictions, and lets in two of the six related pairs, such as "Priya
owns support_agent" against "Priya owns billing_agent", which differ in the one
word that matters. The duplicate it misses, "Keep replies brief and skip the
introduction" against "The user prefers short answers without a preamble", is
at 0.73, below every sensible threshold. With 18 pairs, those counts are rough;
the shape is the finding.

---

## Candidates, then judgment

So similarity of meaning answers a narrower question than Module 4 asked: not
"is this a duplicate?" but "is this about something already stored?" That's
still exactly what the decision needs. Module 4's
[decision step](→ Module 4, deciding what to remember lesson, duplicates and contradictions concept)
already handled the rest: given a new memory and an existing one, decide
whether to skip it as a duplicate, supersede the old one because they
contradict, or keep both. That decision needs judgment, a model reading both
statements, and Module 4 said so. What changes is what reaches it. Keyword
overlap sent it near-identical wordings and missed the rest; similarity by
meaning sends it everything on the same subject, including the duplicates in
other words and the contradictions, and a few related memories the judgment
will keep. The threshold decides how many false candidates the judgment step
pays to reject.

One detail in Module 4's code makes this matter. Its `apply_decision` skips a
new memory outright, without asking the model, whenever `find_duplicate`
returns something, and that was safe while `find_duplicate` only matched
near-identical wording. Swap similarity of meaning into that spot and "Tom owns
support_agent" would be skipped as "already known", because it's 0.84 similar
to "Priya owns support_agent": a correction silently thrown away. Candidates
found by meaning have to go to the decision, never straight to a skip.

---

## Quiz cards

> **Q1.** Why are the two memories embedded without bge's query instruction?
> - Both are statements to compare, not a question looking for a passage ✅
> - The instruction only works for long texts
> - Duplicates must be embedded twice
> - The instruction would make every pair identical
>
> *Explanation: the instruction marks a text as a search query. Comparing
> two stored statements is symmetric, so both are embedded the same way.*

> **Q2.** Why can't any threshold separate duplicates from contradictions?
> - Both are about the same thing, and similarity of meaning doesn't distinguish which detail differs ✅
> - Contradictions are always longer
> - The embedding model ignores numbers
> - Duplicates always score higher
>
> *Explanation: "deploys on Tuesdays and Thursdays" and "deploys on Mondays
> and Wednesdays" score 0.95. They disagree on one detail about the same
> subject.*

> **Q3.** What does a 0.8 threshold actually decide?
> - Which stored memories are about the same thing, and so go to the decision step ✅
> - Which memories are exact duplicates to delete
> - Which memories contradict the new one
> - Which memories to show the user
>
> *Explanation: similarity finds candidates. Deciding duplicate,
> contradiction or keep-both needs a model reading both, as in Module 4.*

> **Q4.** Raising the threshold to 0.9 lets in no related pairs. What does
> it cost?
> - Most duplicates and contradictions stop reaching the decision step at all ✅
> - Nothing: fewer candidates is always better
> - The decision step becomes slower
> - Related memories are deleted
>
> *Explanation: at 0.9 only three of seven duplicates and two of five
> contradictions pass. Missed candidates are never judged.*

---

## Applied sandbox exercise
*(graded — find the memories a new one might duplicate or contradict)*

**Task shown to learner:**

Write `duplicate_candidates(new, memories, vectors, threshold=0.8,
kind=None)`. `new` is the text of a new memory, `memories` the stored ones
(dicts with `"content"` and `"type"`), and `vectors` maps any text, `new`
included, to its vector.

- Consider only memories of `kind`, when it's given, as Module 4's check only
  compared memories of the same type.
- Score each by `vectors[new] @ vectors[content]`, as a `float` rounded to 3
  decimal places.
- Return `(similarity, memory)` pairs with a similarity of at least
  `threshold`, most similar first.

**Starter code:**

```python
def duplicate_candidates(new: str, memories: list[dict], vectors: dict, threshold: float = 0.8,
                         kind: str | None = None) -> list[tuple[float, dict]]:
    """Stored memories (of `kind`, when given) at least `threshold` similar in meaning to `new`, most
    similar first, each with its similarity. Candidates for Module 4's decision, not verdicts."""
    # TODO
    ...
```

**Hidden tests:**

```python
# 1. candidates at or above the threshold, most similar first, with their similarity
toy_vectors = {"new": np.array([1.0, 0.0]), "same": np.array([1.0, 0.0]), "close": np.array([0.8, 0.6]),
               "far": np.array([0.0, 1.0])}
toy = [{"id": "a", "content": "close", "type": "semantic"}, {"id": "b", "content": "same", "type": "semantic"},
       {"id": "c", "content": "far", "type": "semantic"}, {"id": "d", "content": "same", "type": "procedural"}]
found = duplicate_candidates("new", toy, toy_vectors)
assert isinstance(found, list), f"duplicate_candidates should return a list; got {found!r}"
assert [(s, m["id"]) for s, m in found] == [(1.0, "b"), (1.0, "d"), (0.8, "a")], \
    f"similarity rounded to 3 places, most similar first, the threshold itself included; got {[(s, m['id']) for s, m in found]}"
assert [m["id"] for _, m in duplicate_candidates("new", toy, toy_vectors, kind="semantic")] == ["b", "a"], \
    "only memories of the given kind"
assert duplicate_candidates("new", toy, toy_vectors, threshold=1.01) == []

# 2. the user's memories: a duplicate in other words is found
memories = load_context_step()["memories"]
new_texts = ["support_agent belongs to Priya.", "Tom owns support_agent.", "Keep replies brief and skip the introduction."]
texts = [m["content"] for m in memories] + new_texts
vectors = dict(zip(texts, text_vectors(texts)))
found = duplicate_candidates("support_agent belongs to Priya.", memories, vectors)
assert [(s, m["id"]) for s, m in found] == [(0.967, "m01"), (0.858, "m03")], [(s, m["id"]) for s, m in found]
assert [m["id"] for _, m in duplicate_candidates("support_agent belongs to Priya.", memories, vectors, kind="semantic")] == ["m01"]

# 3. a contradiction is a candidate too, and a looser duplicate needs a lower threshold
assert [(s, m["id"]) for s, m in duplicate_candidates("Tom owns support_agent.", memories, vectors)] == [(0.839, "m01")], \
    "a contradiction of m01 looks as similar as a duplicate: it's a candidate for judgment, not a verdict"
assert duplicate_candidates("Keep replies brief and skip the introduction.", memories, vectors) == []
assert [m["id"] for _, m in duplicate_candidates("Keep replies brief and skip the introduction.", memories, vectors,
                                                  threshold=0.7)][0] == "m06"
```

**Hint (shown on request):**

The vectors are already normalised, so the dot product is the cosine
similarity. Build the list of pairs, filter, then `sorted(...,
key=lambda pair: -pair[0])`, which keeps ties in their stored order.

**Reference solution:**

```python
def duplicate_candidates(new: str, memories: list[dict], vectors: dict, threshold: float = 0.8,
                         kind: str | None = None) -> list[tuple[float, dict]]:
    """Stored memories (of `kind`, when given) at least `threshold` similar in meaning to `new`, most
    similar first, each with its similarity. Candidates for Module 4's decision, not verdicts."""
    scored = [(round(float(vectors[new] @ vectors[m["content"]]), 3), m) for m in memories
              if kind is None or m["type"] == kind]
    return sorted([pair for pair in scored if pair[0] >= threshold], key=lambda pair: -pair[0])
```

**Explanation:**

A new memory, "support_agent belongs to Priya", finds "Priya owns
support_agent" at 0.967, the duplicate Module 4's keyword check could never
see. It also finds "support_agent status notes go to Priya weekly" at 0.858:
related, and the decision step would keep both. "Tom owns support_agent" finds
the same stored memory at 0.839, a contradiction the decision step should
resolve by superseding one of them, not a duplicate to skip. The function
returns candidates with their similarity rather than a verdict, because a
verdict is the one thing similarity can't provide.
