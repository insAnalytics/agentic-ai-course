# Module 1, Lesson 1 — Concept 1: The vocabulary problem

---

## Why text has to become numbers at all

A neural network — the machinery underneath an LLM — is built entirely
out of numbers: weights, activations, matrix multiplications. It has no
built-in notion of a "word" at all, and no way to operate on raw text
directly. Before a model can do anything with a sentence, that sentence
has to be turned into numbers, somehow — this conversion step happens
*before* any of the actual language modeling begins, not as part of it.

The most obvious way to do that conversion: give every distinct word its
own unique ID number, and look words up in that mapping whenever text
needs to become numbers (or numbers need to become text again, on the
way back out). That's a **vocabulary** — and it's worth seeing exactly
where this simplest version breaks, since the fix it motivates is what
every real tokenizer is actually built around.

---

## The simplest approach, and where it breaks

Before any real tokenizer, the most obvious approach: build a fixed
list of every word, and give each one a number.

```python
vocabulary = {"the": 1, "cat": 2, "sat": 3, "on": 4, "mat": 5}

def word_to_id(word: str) -> int:
    return vocabulary[word]

print(word_to_id("cat"))
```
```
2
```
*(runs live, shows output — read-only demo snippet, not graded)*

This works fine for words already in the dict — exactly [the dict lookups from Module 0's data structures lesson](→ Module 0, the data structures lesson, dicts concept). The problem shows up the moment a word *isn't* there:

```python
print(word_to_id("tokenization"))
```
```
Traceback (most recent call last):
  File "script.py", line 5, in <module>
    print(word_to_id("tokenization"))
  File "script.py", line 4, in word_to_id
    return vocabulary[word]
KeyError: 'tokenization'
```
*(runs live, shows output — read-only demo snippet, not graded)*

A fixed, word-level vocabulary has no way to represent a word it wasn't
built with — and this isn't a rare edge case. Proper nouns, technical
terms (`FastAPI`, `Pydantic` — two words this exact course has used
constantly), typos, new slang, and words borrowed or coined in any
language are all effectively unbounded in number. No fixed list, no
matter how large, can contain every word that will ever actually appear.

---

## The traditional fix, and why it's not good enough

Older NLP systems handled this with a catch-all: any word outside the
vocabulary gets mapped to a single placeholder, often written `<UNK>`
("unknown"):

```python
def word_to_id_with_fallback(word: str) -> int:
    return vocabulary.get(word, vocabulary_unk_id)
```

This avoids the crash — [`.get()` with a default, exactly as covered in Module 0](→ Module 0, the data structures lesson, dicts concept, the get method explanation) — but it throws away real information. `"tokenization"` and a completely different rare word both collapse into the exact same `<UNK>` token — from the model's perspective, indistinguishable. Whatever that word actually meant is simply gone, replaced by "something I don't recognize was here."

---

## Why this matters at the scale an LLM actually operates at

This problem compounds badly once you account for what an LLM actually
has to handle: not just English, but every language it's trained on;
not just existing words, but new ones invented after training; not just
correctly-spelled input, but typos, code, and technical jargon. A
purely word-level vocabulary would need to be effectively infinite to
avoid constant, lossy fallback to `<UNK>` — which is exactly the
motivation for [subword tokenization, covered next](→ this lesson, subword tokenization bpe concept): a fixed-size vocabulary that can still represent *any* possible input, by breaking unfamiliar words into smaller, familiar pieces instead of giving up on them entirely.

---

## Quiz cards

> **Q1.** Why does text need to be converted into numbers before a
> neural network can process it at all?
> - A) It's a stylistic convention, not a technical requirement
> - B) A neural network is built entirely out of numbers — weights, activations, matrix multiplications — with no built-in way to operate on raw text directly ✅
> - C) Numbers are only needed for very long pieces of text
> - D) This conversion only matters for languages other than English

> **Q2.** What happens when `word_to_id("tokenization")` is called
> against a vocabulary dict that doesn't contain that word?
> - A) It silently returns `0`
> - B) It raises a `KeyError` — a fixed vocabulary has no way to represent a word it wasn't built with ✅
> - C) It automatically adds the new word to the vocabulary
> - D) It returns the closest matching word instead

> **Q3.** Why is "just make the vocabulary bigger" not a real fix for
> the vocabulary problem?
> - A) A larger vocabulary always solves the problem completely
> - B) The number of possible words — across every language, proper nouns, technical jargon, typos, and new coinages — is effectively unbounded, so no fixed list, however large, can contain all of it ✅
> - C) Dictionaries in Python can't hold more than a fixed number of keys
> - D) Vocabulary size has no relationship to this problem at all

> **Q4.** What real information is lost when an unfamiliar word is
> mapped to a shared `<UNK>` token?
> - A) None — `<UNK>` preserves the word's meaning in a compressed form
> - B) The word's actual identity — two completely different unfamiliar words become indistinguishable once both collapse into the same `<UNK>` token ✅
> - C) Only the word's spelling is lost, not its meaning
> - D) `<UNK>` only affects punctuation, not real words

---

*(End of Concept 1. This lesson continues with Concept 2 — subword
tokenization (BPE) — drafted separately.)*
