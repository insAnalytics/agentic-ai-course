# Module 1, Lesson 1 — Concept 2: Subword tokenization (BPE)

---

## The fix: pieces small enough that nothing is ever truly unknown

[The vocabulary problem from the previous concept](→ this lesson, the vocabulary problem concept) boils down to this: a whole-word vocabulary can never be complete. The fix subword tokenization takes: instead of a vocabulary of whole words, build a vocabulary of *word pieces* — small enough that any possible word, even one never seen before, can always be built by combining pieces the vocabulary already has. Worst case, a totally novel string falls back to individual characters — but it's never simply unrepresentable the way it was with a word-level vocabulary and `<UNK>`.

**Byte-Pair Encoding (BPE)** is the most common way this vocabulary of
pieces actually gets built.

---

## How BPE builds its vocabulary

BPE starts from the smallest possible pieces — individual characters —
and repeatedly merges whichever adjacent pair appears most often across
a large body of training text, building up larger, frequency-justified
chunks over many iterations:

```python
# a toy corpus, split into characters, with a marker for word boundaries
words = ["low_", "lower_", "lowest_", "low_", "low_"]

def most_frequent_pair(words: list) -> tuple:
    pair_counts = {}
    for word in words:
        chars = list(word)
        for i in range(len(chars) - 1):
            pair = (chars[i], chars[i + 1])
            pair_counts[pair] = pair_counts.get(pair, 0) + 1
    return max(pair_counts, key=pair_counts.get)

print(most_frequent_pair(words))
```
```
('l', 'o')
```
*(runs live, shows output — read-only demo snippet, not graded)*

`('l', 'o')` is the most frequent adjacent pair across this tiny
corpus — real BPE would now merge every `l` + `o` into a single new
piece, `lo`, and repeat the entire process again on the updated text,
merging the next most frequent pair. After enough rounds on a large
enough corpus, common sequences like `low` end up as a single token,
while rarer combinations stay split into smaller, more frequent pieces.
This is [the same "count occurrences with a dict, using `.get()` for a default"](→ Module 0, the data structures lesson, dicts concept, the get method explanation) pattern from Module 0, just applied to counting character pairs instead of counting words.

---

## What this actually looks like on real words

The practical result: common whole words tend to end up as a single
token, since they're frequent enough to get fully merged, while rare or
compound words split into recognizable, meaningful pieces:

```
"the"            → ["the"]
"cat"            → ["cat"]
"tokenization"   → ["token", "ization"]
"FastAPI"        → ["Fast", "API"]
```
*(illustrative — actual splits depend on the specific tokenizer and its training data, not shown as live output)*

`"tokenization"` splitting into `"token"` and `"ization"` isn't
arbitrary — both pieces are common enough on their own (appearing in
many other words) to have earned their own token during training, even
though the whole word `"tokenization"` wasn't frequent enough to merge
into one. This is the direct payoff from Concept 1: `"tokenization"`
never needed an `<UNK>` fallback at all — it was represented exactly,
just as two pieces instead of one.

**Interactive tokenizer visualization:** a text box where a learner
types any sentence and sees it split into its actual tokens in real
time, each token highlighted in its own color — directly showing common
words staying whole while rare or technical words (like the ones a
learner might type themselves) visibly break into pieces.

---

## Quiz cards

> **Q1.** What's the core idea behind subword tokenization, compared to
> a whole-word vocabulary?
> - A) It uses a larger dictionary of whole words instead
> - B) It builds a vocabulary of word *pieces* small enough that any possible word can always be represented by combining pieces the vocabulary already has ✅
> - C) It ignores rare words entirely instead of tokenizing them
> - D) It only works for English text

> **Q2.** What does BPE actually do to build its vocabulary?
> - A) It randomly selects a fixed number of words to include
> - B) It starts from individual characters and repeatedly merges whichever adjacent pair appears most frequently across a large body of training text ✅
> - C) It translates every word into a numeric hash
> - D) It removes all rare words from the training data before tokenizing

> **Q3.** Why does a common word like `"the"` typically end up as a
> single token, while `"tokenization"` splits into two?
> - A) Word length alone determines whether something stays whole
> - B) `"the"` is frequent enough in training data to get fully merged into one token; `"tokenization"` as a whole word isn't frequent enough, but its pieces individually are common enough to have earned their own tokens ✅
> - C) `"tokenization"` is an invalid word and must be split
> - D) Only nouns get split into multiple tokens

> **Q4.** Why does BPE never need an `<UNK>` fallback the way a
> word-level vocabulary did?
> - A) BPE vocabularies are simply larger than word-level ones
> - B) Because the vocabulary's pieces go all the way down to individual characters, any possible string can always be represented by combining pieces, in the worst case falling back to single characters rather than becoming unrepresentable ✅
> - C) `<UNK>` is still used in BPE, just less often
> - D) BPE only tokenizes words that already exist in a dictionary

---

*(End of Concept 2. This lesson continues with Concept 3 — tokens in
practice, and why language matters for cost — drafted separately.)*
