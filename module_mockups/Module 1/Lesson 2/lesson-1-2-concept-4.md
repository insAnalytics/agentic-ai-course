# Module 1, Lesson 2 — Concept 4: Cosine similarity — measuring how close two vectors actually are

---

## From "looks close on a plot" to an actual number

Every embedding concept so far has relied on a visual, geometric
intuition — points close together on a plot. **Cosine similarity** is
the real, computable operation underneath that intuition: a single
number, between `-1` and `1`, measuring how similar two vectors actually
are.

The key idea: cosine similarity measures the **angle** between two
vectors, not the raw distance between their endpoints. Two vectors
pointing in almost the same direction get a similarity near `1`, even if
one vector happens to be much longer than the other. Two vectors
pointing in completely opposite directions get a similarity near `-1`.
Two vectors at a right angle to each other — genuinely unrelated — get a
similarity near `0`. This matters specifically because an embedding
vector's *length* isn't meaningful on its own — what actually encodes
similarity is *direction*, which is exactly what angle, and therefore
cosine similarity, captures.

---

## The actual computation

```python
import math

def dot_product(vec_a: list, vec_b: list) -> float:
    return sum(vec_a[i] * vec_b[i] for i in range(len(vec_a)))

def magnitude(vec: list) -> float:
    return math.sqrt(sum(x ** 2 for x in vec))

def cosine_similarity(vec_a: list, vec_b: list) -> float:
    return dot_product(vec_a, vec_b) / (magnitude(vec_a) * magnitude(vec_b))
```

`dot_product` multiplies each pair of matching positions and sums the
results — [a comprehension over `range(len(...))`, exactly the indexed-pairing pattern from the data structures lesson](→ Module 0, the data structures lesson, comprehensions concept). `magnitude` computes a vector's own length. Dividing the dot product by both magnitudes is what removes length from the equation entirely, leaving only the angle between the two directions — the actual formula behind "how close is the meaning," not just "how big are these numbers."

---

## Checking it against vectors we already know the relationship for

```python
cat = [0.90, 0.10]
kitten = [0.85, 0.15]
car = [-0.20, 0.90]

print(cosine_similarity(cat, kitten))
print(cosine_similarity(cat, car))
```
```
0.9974
0.0173
```
*(runs live, shows output — read-only demo snippet, not graded)*

These are [the exact three toy embeddings from Concept 2](→ this lesson, token embeddings the models internal input layer concept) — `"cat"` and `"kitten"` produce a similarity close to `1` (`0.997`), confirming what looked true visually is also true numerically; `"cat"` and `"car"` produce a similarity near `0` (`0.017`), confirming they're essentially unrelated in direction, despite `"car"`'s vector not being especially far away in raw distance. This is precisely the operation [a text-embedding-based search — the RAG groundwork from the previous concept — actually runs](→ this lesson, text embeddings a distinct separate use case concept), at scale: computing cosine similarity between a query's embedding and many candidate texts' embeddings, to find whichever ones are closest in meaning.

**Interactive: pairwise similarity for your own sentences.** A learner
enters several sentences, and sees both the embedding-space plot [from Concept 3](→ this lesson, text embeddings a distinct separate use case concept) and a table of the actual cosine similarity score between every pair — connecting the visual clustering directly to the real number driving it, for text the learner chose themselves.

---

## Quiz cards

> **Q1.** What does cosine similarity actually measure between two
> vectors?
> - A) The raw distance between their endpoints
> - B) The angle between them — similarity near `1` for vectors pointing in nearly the same direction, near `-1` for opposite directions, near `0` for unrelated directions ✅
> - C) Which vector has more dimensions
> - D) The sum of both vectors' individual values

> **Q2.** Why does cosine similarity focus on angle rather than raw
> distance or vector length?
> - A) Angle is simply easier to compute than distance
> - B) An embedding vector's length isn't inherently meaningful — what actually encodes similarity is direction, which angle (and therefore cosine similarity) captures directly ✅
> - C) Distance and angle always produce identical results anyway
> - D) Vector length is the only thing that matters for embeddings

> **Q3.** In the live demo, why does `cosine_similarity(cat, kitten)`
> come out close to `1`, while `cosine_similarity(cat, car)` comes out
> close to `0`?
> - A) It's coincidental and specific to these exact numbers only
> - B) `cat` and `kitten`'s vectors point in nearly the same direction in the toy embedding space, matching their similar meaning; `cat` and `car` point in largely unrelated directions ✅
> - C) `car`'s vector is simply longer, which always produces low similarity
> - D) Cosine similarity can only distinguish exactly two categories at a time

> **Q4.** What real operation does a text-embedding-based search
> actually perform, using cosine similarity?
> - A) Comparing the exact wording of a query against every candidate text
> - B) Computing cosine similarity between a query's embedding and many candidate texts' embeddings, to find whichever are closest in meaning ✅
> - C) Sorting candidate texts alphabetically before comparing them
> - D) Cosine similarity isn't actually used in real text search systems

---

*(End of Concept 4 — final concept section of Lesson 2. This lesson
continues with the outcomes callout, comprehensive quiz, and closing
synthesis — drafted separately.)*
