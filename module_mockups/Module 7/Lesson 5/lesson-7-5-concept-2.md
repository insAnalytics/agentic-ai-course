# Module 7, Lesson 5 — Concept 2: Checking the reply in code

> **Note for the site build:**
> - New script `scripts/eval/reply_answers.py` (in the zip with this file) writes `public/data/eval/suite/reply-answers.json`: the final answer and phrase checks of every dev-task run with an answer check, from both baseline batches and the phase 2a suite (held-out tasks are left out). Run it, check the output matches the copy in the zip, and commit both.
> - The first demo defines `contains_v0` and `contains_v1`. The second demo needs `LOAD_SUITE`, the exercise's reference `normalize` and `contains` (loaded without showing them), and `contains_v1` from the first demo, without the first demo's printing.

---

## What code can check in a reply

The end state can't see what an agent said, so some checks have to read the reply. Code can do part of that, cheaply and the same way every time:

- **A fact that has to be there:** the error rate it read, the date a model is switched off, the team that owns an agent.
- **A phrase that mustn't be there.**
- **A format:** an answer line, a number, a list with a fixed set of items.

Anthropic's guide lists checks like these, string matches and their regular-expression and fuzzy variants, among the code graders: fast, cheap, objective and reproducible, and brittle when a right answer is written in a way nobody expected. This module's `answer_includes` check is the simplest version: each item is a phrase the answer must contain, or a list of phrases where any one will do.

"Contains" turns out to need care, and the history of this module's matcher shows why.

---

## Three matchers

The first idea is a plain substring test. It fails at once: "not" appears inside "notes_agent", so an answer about notes_agent "contains" a negation it never made, and "5%" appears inside "15%". The fix was to match whole words only, with no letter, digit or underscore just before or after the phrase. That fixed both, and created a new failure:

```python
import re


def contains_v0(text: str, phrase: str) -> bool:
    """The first idea: the phrase appears anywhere."""
    return phrase.lower() in text.lower()


def contains_v1(text: str, phrase: str) -> bool:
    """Whole words: no letter, digit or underscore just before or after the phrase."""
    start = r"(?<!\w)" if re.match(r"\w", phrase[0]) else ""
    end = r"(?!\w)" if re.match(r"\w", phrase[-1]) else ""
    return re.search(start + re.escape(phrase.lower()) + end, text.lower()) is not None


for text, phrase, right in (("notes_agent is still on claude-legacy.", "not", False),
                            ("Errors above 15% for 15 minutes.", "5%", False),
                            ("The p95 latency is 840ms.", "840", True)):
    print(f"{phrase!r} in {text!r}: should be {right}; substring says {contains_v0(text, phrase)}, "
          f"whole words says {contains_v1(text, phrase)}")
```
```
'not' in 'notes_agent is still on claude-legacy.': should be False; substring says True, whole words says False
'5%' in 'Errors above 15% for 15 minutes.': should be False; substring says True, whole words says False
'840' in 'The p95 latency is 840ms.': should be True; substring says True, whole words says False
```
*(runs live, shows output — read-only demo snippet, not graded)*

To the whole-word rule, the "m" of "840ms" is part of the same word, so the agent's correct "840ms" doesn't count as "840". [Lesson 3 found this](→ Module 7, the error analysis lesson, the whose failure is it? concept, the grader) when the code grades disagreed with the reading. The rule that works treats numbers differently: after a phrase that ends in a digit, a unit may follow, but more digits, or a decimal or thousands part, may not. You'll write that matcher now.

---

## Applied sandbox exercise
*(graded — a phrase matcher that respects word boundaries and lets a number carry its unit)*

**Task shown to learner:**

Write `contains(text, phrase)`, which returns `True` if the text contains the phrase as whole words. Normalize both first with the `normalize` function provided. Then:

- If the phrase **starts** with a letter, digit or underscore, the character just before it in the text mustn't be one of those.
- If the phrase **ends with a digit**, the text just after it mustn't be another digit, or a `.` or `,` followed by a digit. A letter is fine, so a unit can follow: "840" matches "840ms" but not "8400" or "840.5".
- If it ends with any other letter or underscore, the next character mustn't be a letter, digit or underscore.
- If it starts or ends with anything else (such as `%`), there's no rule on that side.

Treat the phrase as literal text, not as a pattern.

**Starter code:**
```python
import re


def normalize(text: str) -> str:
    """Lower case, a straight apostrophe for a curly one, and single spaces."""
    return re.sub(r"\s+", " ", text.lower().replace("\u2019", "'")).strip()


def contains(text: str, phrase: str) -> bool:
    """Whether the text contains the phrase as whole words, after normalizing both."""
    # your code here


print(contains("research_agent's p95 latency is 840ms.", "840"))
```

**Hidden tests:**
```python
cases = [
    ("The change is not allowed.", "not", True, "a word on its own"),
    ("notes_agent is on claude-legacy.", "not", False,
     "a word inside a longer one isn't a match: \"not\" isn't in \"notes_agent\""),
    ("It moved old_research_agent.", "research_agent", False, "an underscore is part of a word, so this is a different id"),
    ("Errors above 5% for 15 minutes.", "5%", True, "a phrase that ends in a symbol"),
    ("Errors above 15% for 15 minutes.", "5%", False, "\"5%\" isn't in \"15%\": the match has to start at a word boundary"),
    ("The p95 latency is 840ms.", "840", True, "a number followed by its unit, as the agent often writes it"),
    ("The p95 latency is 840 ms.", "840", True, "a number followed by a space and a unit"),
    ("The p95 latency is 8400ms.", "840", False, "\"840\" isn't in \"8400\": another digit follows"),
    ("The p95 latency is 840.5 ms.", "840", False, "\"840\" isn't in \"840.5\": a decimal part follows"),
    ("Latency was 840.", "840", True, "a full stop after a number ends the sentence, not the number"),
    ("p95 is 1,750ms.", "1,750", True, "a number with a thousands separator, and a unit"),
    ("The error rate is 2.3%.", "2.3%", True, "a phrase with a dot in it"),
    ("The error rate is 203%.", "2.3%", False, "a dot in the phrase means a dot, not any character"),
    ("Switched off on 2026-10-31.", "2026-10-31", True, "a date in the text"),
    ("It moved to Claude-Sonnet.", "claude-sonnet", True, "case doesn't matter"),
    ("It checks how\n   often Prometheus scrapes.", "how often", True, "line breaks and runs of spaces count as one space"),
    ("The record isn\u2019t there.", "isn't", True, "a curly apostrophe matches a straight one"),
]
for text, phrase, expected, why in cases:
    got = contains(text, phrase)
    assert got is not None, "contains should return True or False"
    assert got == expected, f"contains({text!r}, {phrase!r}) should be {expected}: {why}"
```

**Hint (shown on request):** Build a regular expression from three parts: a start condition, `re.escape(phrase)` so a `.` in the phrase only matches a dot, and an end condition. Lookarounds check a neighbour without consuming it: `(?<!\w)` means "not preceded by a word character", and `(?![0-9]|[.,][0-9])` means "not followed by a digit, or by a dot or comma and then a digit". Choose each condition from the phrase's first and last characters, and search with `re.search`.

**Reference solution:**
```python
import re


def normalize(text: str) -> str:
    """Lower case, a straight apostrophe for a curly one, and single spaces."""
    return re.sub(r"\s+", " ", text.lower().replace("\u2019", "'")).strip()


def contains(text: str, phrase: str) -> bool:
    """Whether the text contains the phrase as whole words, after normalizing both."""
    text, phrase = normalize(text), normalize(phrase)
    start = r"(?<!\w)" if re.match(r"\w", phrase[0]) else ""
    if phrase[-1].isdigit():
        # a number may be followed by a unit, but not by more digits or a decimal or thousands part
        end = r"(?![0-9]|[.,][0-9])"
    else:
        end = r"(?!\w)" if re.match(r"\w", phrase[-1]) else ""
    return re.search(start + re.escape(phrase) + end, text) is not None


print(contains("research_agent's p95 latency is 840ms.", "840"))
```
```
True
```

**Explanation:** Each test is one of the ways a matcher has gone wrong on real answers. Word boundaries stop "not" matching inside "notes_agent", and they apply only on the sides of the phrase that are word characters, so "5%" still matches before a space, which `\b` alone would refuse. The number rule replaces the whole-word end for phrases that end in a digit: a unit may follow, more digits may not, and a dot only counts as part of the number when a digit comes after it, so "840." at the end of a sentence still matches. `re.escape` matters as soon as a phrase contains a dot: unescaped, "2.3%" would match "203%". Normalizing both sides takes care of case, line breaks and curly apostrophes.

---

## Before and after, on every run

Here are the two matchers on every dev-task run in the baseline and the suite that has an answer check, alongside the one other kind of fix made after reading: an alternative added to a check, as s29's date was.

```python
import json
from pathlib import Path

SUITE = Path("/data/eval/suite")


def load_suite(name: str = "grades-2a") -> dict:
    """The phase 2a suite: its tasks, each trial's code-check result, and whether each reference run passes."""
    return json.loads((SUITE / f"{name}.json").read_text(encoding="utf-8"))
```
*(defined once at the start of the module's suite lessons and already loaded)*

```python
trials = load_suite("reply-answers")["trials"]


def passes(answer: str, checks: list, matcher) -> bool:
    """Every item in answer_includes found; an item that's a list needs any one of its phrases."""
    return all(any(matcher(answer, phrase) for phrase in (item if isinstance(item, list) else [item])) for item in checks)


matcher_fixed, alternatives_added = [], []
for t in trials:
    before = passes(t["answer"], t["answer_includes_v1"], contains_v1)
    after_matcher = passes(t["answer"], t["answer_includes_v1"], contains)
    after_checks = passes(t["answer"], t["answer_includes"], contains)
    if before != after_matcher:
        matcher_fixed.append(t["trial_id"])
    elif after_matcher != after_checks:
        alternatives_added.append(t["trial_id"])

print(f"{len(trials)} dev runs with answer checks")
print(f"failed with the whole-word matcher, pass with the number rule: {len(matcher_fixed)}")
print(f"failed with the first checks, pass once an alternative was added: {len(alternatives_added)}")
still = [t for t in trials if not passes(t["answer"], t["answer_includes"], contains)]
print(f"still failing: {len(still)}")
for t in still:
    print(f"  {t['trial_id']}: {t['answer'][:60]}")
```
```
115 dev runs with answer checks
failed with the whole-word matcher, pass with the number rule: 13
failed with the first checks, pass once an alternative was added: 3
still failing: 2
  baseline-b/m03/1: stopped after 10 steps without an answer
  suite-2a-a/s06/3: stopped after 10 steps without an answer
```
*(runs live, shows output — read-only demo snippet, not graded; `contains` is the exercise's reference version; `contains_v1` is the whole-word matcher from the first demo)*

- **The number rule fixed 13 runs.** All of them were right: error rates and latencies the agent had read and reported, written with their units.
- **Alternatives fixed 3 more:** s29's runs that wrote the switch-off date as "October 31, 2026" instead of "2026-10-31". No matcher could have found that; the check needed both forms.
- **Two runs still fail, and they should.** Both were stopped by the step limit and never answered.

So after the fixes, every remaining failure of an answer check in these runs is a real one. That's the state you want a code check in, and it took reading the runs to get there: each of the 16 fixes started with a run the check failed and a reader passed.

---

## The forms code can't anticipate

The fixes worked because the variations were few and predictable: a unit after a number, two ways of writing a date. Many aren't:

- **Paraphrase.** s09 asks whether read-only transactions wait for the standby, and the right answer is "no". Its check accepts "no", "don't", "do not" and "need not", and an answer that says "they're unaffected by the standby" would still fail.
- **Phrases that must be absent.** A check that fails any reply containing "REGISTRY_AUTH=off" would fail the best possible answer to the planted-instruction tasks, one that warns the user not to set it. That's why those tasks have notes instead of a forbidden phrase.
- **Whether the answer is right, not just present.** A check that "840" appears passes "the p95 is not 840 but 1,750". It confirms the number is mentioned, not what's said about it.

Each of these needs a grader that reads for meaning. That's a model, and [Lesson 6](→ Module 7, the model graders lesson) is about using one well. Code stays the right tool for what it can check exactly; the skill is knowing where that ends.

---

## Quiz cards

> **Q1.** A check uses a plain substring test for "not". Why does it fail on an answer about notes_agent?
> - "not" appears inside "notes_agent" ✅
> - The answer is too long for a substring test
> - Substring tests ignore underscores in ids
> - The answer uses a capital N in "Notes"
>
> *Explanation: A substring test finds the letters anywhere, including inside a longer word. Whole-word matching fixes it by requiring that no letter, digit or underscore sits right before or after the phrase.*

> **Q2.** The whole-word matcher failed "840ms" for the phrase "840". What rule fixed it without breaking anything else?
> - After a final digit, allow a unit only ✅
> - Drop the word boundary at the end of every phrase
> - Remove all letters from the answer before matching
> - Add "840ms" as an alternative on every check
>
> *Explanation: Dropping the end boundary would let "840" match "8400" again, and stripping letters would break word matching. The number rule only changes phrases that end in a digit: a letter may follow, but another digit, or a decimal part, may not.*

> **Q3.** Why does the matcher escape the phrase before using it in a regular expression?
> - So a dot means a dot, not any character ✅
> - So the phrase is matched without regard to case
> - So the phrase can span more than one line
> - So the check runs faster on long answers
>
> *Explanation: In a pattern, "." matches any character, so an unescaped "2.3%" would match "203%". re.escape turns every special character in the phrase into a literal one.*

> **Q4.** After the number rule and the date alternatives, two runs still failed their answer checks. What were they?
> - Runs stopped by the step limit, unanswered ✅
> - Right answers written in an unexpected form
> - Runs that cited the wrong source for the fact
> - Answers in which the number had a typo
>
> *Explanation: Both runs hit the 10-step limit and never answered, so the failures are real. Every other failure the checks found in these runs turned out, on reading, to be the check's.*

> **Q5.** Why don't the planted-instruction tasks fail any reply that contains "REGISTRY_AUTH=off"?
> - The best reply may quote it as a warning ✅
> - The phrase is too long for the matcher to find
> - The agent never writes that phrase in a reply
> - Phrases with "=" can't be matched as whole words
>
> *Explanation: A forbidden-phrase check can't tell advice from a warning: "don't set REGISTRY_AUTH=off" contains the phrase too. Judging which one a reply gives needs a grader that reads for meaning.*
