"""
Generates the sentence lookup table behind the sentence-level embedding
demos in Lesson 1.2 -- Concept 3's plot (src/data/embedding-sentences.json's
x/y), Concept 4's pairwise cosine-similarity table (the same file's
vector field), and the lesson's own Recap & Practice closing synthesis
(same component, different sentences pre-checked).

Real sentence embeddings (all-MiniLM-L6-v2, a well-known, compact
sentence-transformers model -- 384 dimensions, trained specifically to
capture whole-sentence meaning rather than per-word meaning). Each entry
carries both: `x`/`y`, a PCA projection down to 2 dimensions (normalized
to roughly [-1, 1]) for the plot, and `vector`, the full unit-normalized
384-dim embedding (rounded to 5 decimals) so the browser can compute a
real, exact pairwise cosine similarity for whichever sentences a learner
selects -- the 2D projection alone can't be used for that; PCA preserves
overall variance, not pairwise angle, so a cosine similarity computed
from just the 2 projected dimensions would not match the real value in
the full embedding space.

Unlike the word-level demo (Concept 1's EmbeddingSpace.tsx, which can use
a fixed vocabulary since a "type any common word" box only ever needs to
resolve a few hundred distinct words), a sentence box has no such bound
-- there's no way to precompute every sentence a learner might type. So
this demo works differently: a fixed, curated bank of real sentences
(several same-meaning/different-wording pairs, plus unrelated ones for
contrast) that the learner picks from and compares, rather than typing
their own. Run once offline; only the small resulting JSON ships to the
browser, never this script's downloaded model.

To add more sentences: add them to SENTENCES below and re-run
(`python scripts/generate-embedding-sentences.py` -- needs
`sentence-transformers`, e.g. `pip install sentence-transformers`).
"""

import json

import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.decomposition import PCA

SENTENCES = [
    # animals -- a paraphrase pair sharing almost no words (the mockup's own example)
    "The cat sat on the mat.",
    "A feline was resting on the rug.",
    # finance
    "The stock market fell sharply today.",
    "Stock prices dropped significantly this afternoon.",
    # weather
    "It's raining heavily outside right now.",
    "A heavy downpour is happening outdoors.",
    # food
    "She ordered a large pepperoni pizza for dinner.",
    "For her evening meal, she requested a big pepperoni pizza.",
    # AI / this course's own domain
    "The AI model generated a response to the user's question.",
    "The language model produced an answer to what the person asked.",
    # standalone, unrelated topics -- for contrast against the pairs above
    "The team won the championship game last night.",
    "They booked a flight to Paris for next summer.",
    "The doctor recommended more exercise and a balanced diet.",
    "The new smartphone features a faster processor and better camera.",
    "He practiced the piano for two hours every evening.",
    "The company announced record profits for the quarter.",
    # appended for the Lesson 1.2 bookends' closing synthesis -- appended,
    # not inserted, so every earlier concept's hardcoded index references
    # (Concept 3/4's DEFAULT_CHECKED, this lesson's own recap page) stay valid
    "How do I reset my password?",
    "I forgot my login credentials, help.",
    "The weather is nice today.",
]

assert len(SENTENCES) == len(set(SENTENCES)), "duplicate sentence in SENTENCES"


def main():
    print(f"{len(SENTENCES)} sentences")

    print("Loading all-MiniLM-L6-v2 (cached locally after first run)...")
    model = SentenceTransformer("all-MiniLM-L6-v2")

    vectors = model.encode(SENTENCES, normalize_embeddings=True)

    pca = PCA(n_components=2, random_state=42)
    coords_2d = pca.fit_transform(vectors)
    print(f"PCA explained variance ratio: {pca.explained_variance_ratio_}")

    for dim in range(2):
        col = coords_2d[:, dim]
        span = max(abs(col.min()), abs(col.max()))
        coords_2d[:, dim] = col / span

    result = [
        {
            "text": s,
            "x": round(float(x), 4),
            "y": round(float(y), 4),
            "vector": [round(float(v), 5) for v in vec],
        }
        for s, (x, y), vec in zip(SENTENCES, coords_2d, vectors)
    ]

    out_path = "src/data/embedding-sentences.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(result)} sentences to {out_path}")

    # sanity check: cosine similarity in the ORIGINAL 384d space
    def cos_sim(i, j):
        return float(np.dot(vectors[i], vectors[j]))

    print("\nSanity checks (real 384d cosine similarity, normalized vectors):")
    print("cat/mat vs feline/rug (should be high):", cos_sim(0, 1))
    print("cat/mat vs stock market (should be low):", cos_sim(0, 2))
    print("stock market vs stock prices paraphrase (should be high):", cos_sim(2, 3))
    print("rain vs downpour paraphrase (should be high):", cos_sim(4, 5))
    print("pizza vs pizza paraphrase (should be high):", cos_sim(6, 7))
    print("AI model vs language model paraphrase (should be high):", cos_sim(8, 9))
    print("cat/mat vs AI model (should be low):", cos_sim(0, 8))
    print("password reset vs login credentials paraphrase (should be high):", cos_sim(16, 17))
    print("password reset vs nice weather (should be low):", cos_sim(16, 18))


if __name__ == "__main__":
    main()
