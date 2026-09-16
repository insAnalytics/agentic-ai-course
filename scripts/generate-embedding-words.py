"""
Generates the word -> [x, y] lookup table behind the 2D embedding-space
demo in Lesson 1.2, Concept 1 (src/data/embedding-words.json).

Real GloVe word vectors (100 dimensions, trained on Wikipedia + Gigaword,
via gensim's downloader -- a well-known, freely available pretrained
embedding set), PCA-projected down to 2 dimensions and normalized to
roughly [-1, 1] on each axis. Genuine embedding positions, not
hand-placed -- run once offline; only the small resulting JSON ships to
the browser, never this script's ~130MB downloaded model.

To add more words: add them to WORDS below and re-run
(`python scripts/generate-embedding-words.py` -- needs `gensim` and
`scikit-learn`, e.g. `pip install gensim scikit-learn`; gensim's C
extensions currently need Python <= 3.12, not 3.13+). A word missing
from GloVe's vocabulary is silently skipped and printed to stderr --
check the "missing" list after running before assuming a word made it in.
"""

import json

import gensim.downloader as api
import numpy as np
from sklearn.decomposition import PCA

WORDS = [
    # anchor words from the Concept 1 mockup -- must be present
    "cat", "dog", "kitten", "car", "truck", "vehicle",
    # animals
    "puppy", "lion", "tiger", "elephant", "mouse", "bird", "fish", "horse",
    "cow", "sheep", "rabbit", "wolf", "bear", "snake", "frog", "monkey",
    "pig", "duck", "goat", "deer", "owl", "eagle", "shark", "whale",
    "dolphin", "spider", "ant", "bee", "butterfly",
    # vehicles / transport
    "bus", "bicycle", "motorcycle", "train", "airplane", "boat", "ship",
    "scooter", "van", "taxi", "tractor", "helicopter", "subway", "ferry",
    # emotions
    "happy", "sad", "angry", "excited", "afraid", "calm", "joyful",
    "anxious", "proud", "bored", "curious", "surprised", "love", "hate",
    "fear", "hope", "grateful", "lonely", "confident", "nervous",
    # food
    "pizza", "bread", "apple", "banana", "cheese", "coffee", "tea", "soup",
    "rice", "chicken", "salad", "cake", "chocolate", "milk", "water",
    "orange", "grape", "potato", "tomato", "pasta", "sandwich", "cookie",
    "honey", "butter", "egg",
    # colors
    "red", "blue", "green", "yellow", "purple", "black", "white", "pink",
    "brown", "gray",
    # technology / AI (course-relevant)
    "computer", "algorithm", "agent", "model", "token", "embedding",
    "server", "database", "network", "software", "code", "python",
    "function", "variable", "data", "internet", "robot", "chip",
    "programmer", "keyboard", "screen", "cloud", "app",
    # weather
    "rain", "snow", "sun", "wind", "cloudy", "storm", "fog", "thunder",
    "hot", "cold", "humid", "sunny",
    # nature
    "tree", "mountain", "river", "ocean", "forest", "flower", "grass",
    "sky", "star", "moon", "beach", "desert", "island", "valley", "lake",
    # abstract concepts
    "freedom", "justice", "truth", "beauty", "time", "space", "knowledge",
    "wisdom", "power", "peace", "democracy", "honesty", "courage",
    # professions
    "doctor", "teacher", "engineer", "artist", "lawyer", "chef", "pilot",
    "scientist", "writer", "nurse", "farmer", "police", "soldier",
    "musician", "actor",
    # body parts
    "hand", "foot", "head", "eye", "heart", "brain", "arm", "leg", "ear",
    "nose",
    # furniture / household
    "chair", "table", "bed", "lamp", "door", "window", "sofa", "shelf",
    "mirror", "carpet",
    # sports
    "soccer", "basketball", "tennis", "swimming", "running", "football",
    "baseball", "golf", "boxing", "yoga",
    # clothing
    "shirt", "shoes", "jacket", "hat", "dress", "socks", "gloves", "scarf",
    # buildings / places
    "house", "school", "hospital", "airport", "restaurant", "library",
    "museum", "park", "office", "store", "church", "stadium",
    # misc common nouns
    "book", "phone", "music", "movie", "game", "money", "clock", "key",
    "bag", "pen", "paper", "camera", "guitar", "piano",
]

WORDS = sorted(set(WORDS))


def main():
    print(f"{len(WORDS)} unique words requested")

    print("Loading glove-wiki-gigaword-100 (cached locally after first run)...")
    kv = api.load("glove-wiki-gigaword-100")

    present = [w for w in WORDS if w in kv.key_to_index]
    missing = [w for w in WORDS if w not in kv.key_to_index]
    print(f"{len(present)} found in GloVe vocabulary, {len(missing)} missing: {missing}")

    vectors = np.array([kv[w] for w in present])

    pca = PCA(n_components=2, random_state=42)
    coords_2d = pca.fit_transform(vectors)
    print(f"PCA explained variance ratio: {pca.explained_variance_ratio_}")

    # normalize both axes independently to roughly [-1, 1] for clean plotting
    for dim in range(2):
        col = coords_2d[:, dim]
        span = max(abs(col.min()), abs(col.max()))
        coords_2d[:, dim] = col / span

    result = {w: [round(float(x), 4), round(float(y), 4)] for w, (x, y) in zip(present, coords_2d)}

    out_path = "src/data/embedding-words.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, sort_keys=True)

    print(f"Wrote {len(result)} words to {out_path}")


if __name__ == "__main__":
    main()
