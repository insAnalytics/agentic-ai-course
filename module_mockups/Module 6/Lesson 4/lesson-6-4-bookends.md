# Module 6, Lesson 4 — Bookends: Verifying an answer against its sources

---

## Intro

> **You'll be able to**
> - Split an answer into claims and check each against the source it cites, and choose what to do with a claim that fails
> - Measure a model-based check against cases with known answers, and read a clean record honestly
> - Check what code can settle in code, such as figures traced to tool results, and know what verification can't do when there's no source at all

**Why it matters**
An answer with citations looks trustworthy, and often isn't: in commercial
generative search engines, only about half of sentences were fully
supported by what they cited. The checks in this lesson are how an agent
earns the trust its citations ask for. Every one of them can be wrong in
both directions, so the lesson measures them as well as building them.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all six concepts, mixed order)*

> **Q1.** A support check flags a correct sentence, "This method should be
> used instead of permanent deletion." Why?
> - A) The source is wrong about how deletion works
> - B) "This method" means nothing without the sentence before ✅
> - C) The judge only reads the first sentence of a source
> - D) Deletion is never allowed anywhere in the registry
>
> *Explanation: the judge sees one sentence and one source. A sentence that
> depends on its neighbours needs decontextualizing, rewriting to stand
> alone, before it can be checked.*

> **Q2.** A judge makes no mistakes on 40 labelled cases. What's the honest
> summary?
> - A) Its error rate is zero, on cases like these ones
> - B) Probably below about 7%, on cases like these ✅
> - C) Its error rate is exactly 2.5%, one in forty
> - D) It needs no further testing on real outputs
>
> *Explanation: zero failures in n tries still allows a rate up to about 3/n.
> And built cases are the easy end: on real drafts, two judges disagreed on
> 33 of 390 claims.*

> **Q3.** The built statement pairs showed the model judges missing some
> contradictions. What made three of the 9B's five misses debatable?
> - A) The judge ran out of tokens before its verdict
> - B) It wasn't clear both were about the same thing ✅
> - C) The two statements were written in different languages
> - D) The pairs had been labelled by another model
>
> *Explanation: two statements only contradict if they refer to the same
> thing. A certificate expiring and a memory fault at the same time can both
> be true unless each claims to be the cause of the same incident.*

> **Q4.** An answer says the error rate is 2.3%, and the tool returned
> `0.023`. What should a grounding check in code do?
> - A) Flag it, since the two strings are different
> - B) Accept it, since 2.3% is the value 0.023 ✅
> - C) Ask a model judge whether the two match
> - D) Ignore every percentage in the answer
>
> *Explanation: compare numbers by value, allowing a percentage to match its
> fraction. Ids stay exact. Anything the check doesn't normalise, like a date
> written in words, becomes a false flag.*

> **Q5.** Grading false-premise replies by their last line said the model
> rejected 15% of false premises. Reading a sample showed most corrected the
> premise and answered. What went wrong?
> - A) The model ignored its instructions entirely
> - B) The grade measured the marker, not the noticing ✅
> - C) The sample was far too small to mean anything
> - D) The false premises were much too easy to spot
>
> *Explanation: a grade built on a format measures the format. Reading a
> sample of outputs before trusting an automatic grade is what caught it.*

> **Q6.** Why does Chain-of-Verification answer its verification questions
> without the draft in view?
> - A) To save tokens on every verification call
> - B) A check that sees the draft tends to repeat it ✅
> - C) Because the draft is deleted after planning
> - D) Because a different model answers the questions
>
> *Explanation: the factored variant beat the joint one on every task in the
> paper. It still uses the same model, so a belief it holds wrongly survives.*

> **Q7.** Dropping the one unsupported claim from a draft left an answer that
> suggested an unnecessary tier change. What does that show?
> - A) The judge was wrong to flag that claim
> - B) Dropping can mislead; sometimes only a new answer fixes it ✅
> - C) Unsupported claims should always be kept in
> - D) Tier changes are never needed for a migration
>
> *Explanation: what remains after dropping is only as good as its parts
> together. When the dropped claim carried the answer, retrieving and
> answering again is the fix.*

> **Q8.** The small inference model was about seven times cheaper per pair
> than the 9B judge, with five mistakes where the 9B made none. How could an
> agent use both?
> - A) Only ever use the cheaper one, since it's close
> - B) The cheap one on every claim, the 9B where it matters ✅
> - C) Average the two verdicts on every claim
> - D) Use the 9B only when the cheap one agrees
>
> *Explanation: that's Lesson 2's rule of spending where the risk is: a
> cheap first pass everywhere, and the expensive judge on flagged claims or on
> answers that lead to an action.*

---

## Comprehensive sandbox
*(graded — every check on real drafts, multi-file)*

**Task shown to learner:** `lib.py` holds this lesson's pieces, read-only:
`split_claims`, `verify_claims` and `ungrounded` from the concepts,
`drafts()`, which returns all 145 of Qwen3.5-4B's cited drafts with their
sources, and `recorded_judge(model)`, a judge that answers from the committed
verdicts of Qwen3.5-9B (`"large"`) or Qwen3.5-4B (`"small"`).

In `review.py` (the entry file), write `review(answer, sources, judge)`. It
runs every check that works on a cited answer and returns:

- `"claims"`: what `verify_claims` reports for the answer's claims
- `"ungrounded"`: the ids and numbers in the claims that no source contains,
  checked on the claims' text, so citation numbers don't count as figures
- `"reasons"`: which of `"unsupported"`, `"uncited"`, `"bad_citation"` and
  `"ungrounded"` found something, in that order
- `"flagged"`: whether there's any reason at all

When you click Run, the code at the bottom reviews every draft with the 9B's
verdicts and counts what it flags.

**Tab: `lib.py`** (read-only)
```python
"""This lesson's checks and data, for the sandbox. Read-only."""
import json
import math
import re
from pathlib import Path

DATA = Path("/data/reliability")


def load_run(name: str) -> dict:
    """One committed run file, such as "drafts" or "draft-support.large"."""
    return json.loads((DATA / "runs" / f"{name}.json").read_text(encoding="utf-8"))


def load_set(name: str) -> dict:
    """One of the built sets, such as "set-v"."""
    return json.loads((DATA / f"{name}.json").read_text(encoding="utf-8"))

CITATION = re.compile(r"\[(\d+(?:\s*,\s*\d+)*)\]")
LEADING_CITATIONS = re.compile(r"^(?:\s*\[\d+(?:\s*,\s*\d+)*\])+")
SENTENCE_BREAK = re.compile(r"(?<=[.!?])\s+")


def cited_numbers(text: str) -> set[int]:
    return {int(n) for group in CITATION.findall(text) for n in group.split(",")}


def split_claims(answer: str) -> list[dict]:
    """Each sentence of an answer, without its citation marks, and the source numbers it cites."""
    claims = []
    for sentence in SENTENCE_BREAK.split(answer.strip()):
        if claims and (leading := LEADING_CITATIONS.match(sentence)):
            claims[-1]["cites"] = sorted(set(claims[-1]["cites"]) | cited_numbers(leading.group()))
            sentence = sentence[leading.end():]
        text = " ".join(CITATION.sub("", sentence).split())
        text = re.sub(r"\s+([.,;:!?])", r"\1", text)
        if text.strip(".!? "):
            claims.append({"text": text, "cites": sorted(cited_numbers(sentence))})
    return claims


def verify_claims(claims: list[dict], sources: list[str], judge) -> dict:
    """Sort each claim by what checking it against its cited sources found. judge(claim, source)
    returns True if the source supports the claim; it's called only until one source does."""
    report = {"supported": [], "unsupported": [], "uncited": [], "bad_citation": []}
    for claim in claims:
        if not claim["cites"]:
            report["uncited"].append(claim["text"])
        elif any(not 1 <= n <= len(sources) for n in claim["cites"]):
            report["bad_citation"].append(claim["text"])
        elif any(judge(claim["text"], sources[n - 1]) for n in claim["cites"]):
            report["supported"].append(claim["text"])
        else:
            report["unsupported"].append(claim["text"])
    return report


FACT_ID = re.compile(r"\b(?:REG|MON|INC)-\d+\b|\b[a-z]+_agent\b|\bclaude-[a-z]+\b|\b\d{4}-\d{2}-\d{2}\b")
NUMBER = re.compile(r"(?<![\w.])\d+(?:,\d{3})*(?:\.\d+)?%?")


def number_value(text: str) -> float:
    return float(text.rstrip("%").replace(",", ""))


def ungrounded(answer: str, tool_results: list[str]) -> list[str]:
    """The ids and numbers in an answer that no tool result contains, as written, in order, once each.
    A percentage also matches its fraction: 2.3% matches 0.023."""
    source = " ".join(tool_results)
    known_ids = set(FACT_ID.findall(source))
    known_numbers = [number_value(n) for n in NUMBER.findall(FACT_ID.sub(" ", source))]

    def found(number: str) -> bool:
        value = number_value(number)
        wanted = [value, value / 100] if number.endswith("%") else [value]
        return any(math.isclose(w, k) for w in wanted for k in known_numbers)

    missing = [fact for fact in FACT_ID.findall(answer) if fact not in known_ids]
    missing += [n for n in NUMBER.findall(FACT_ID.sub(" ", answer)) if not found(n)]
    return list(dict.fromkeys(missing))


def drafts() -> list[dict]:
    """Every Qwen3.5-4B draft: its question, sample number, text, and the texts of its numbered sources."""
    sources = {q["id"]: [chunk["text"] for chunk in q["context"]] for q in load_set("set-v")["draft_questions"]}
    return [{"question": record["id"], "sample": s, "text": sample["text"], "sources": sources[record["id"]]}
            for record in load_run("drafts")["results"] for s, sample in enumerate(record["samples"])]


def recorded_judge(model: str):
    """A judge that answers from a committed run: model is "large" (Qwen3.5-9B) or "small" (Qwen3.5-4B).
    It only knows the claim and source pairs that run judged, which are all the cited ones in the drafts."""
    verdicts = {r["id"]: r["verdict"] for r in load_run(f"draft-support.{model}")["results"]}
    known = {}
    for draft in drafts():
        for c, claim in enumerate(split_claims(draft["text"])):
            for n in claim["cites"]:
                known[(claim["text"], draft["sources"][n - 1])] = verdicts[f"{draft['question']}:{draft['sample']}:{c}:{n}"]

    def judge(claim: str, source: str) -> bool:
        return known[(claim, source)] == "SUPPORTED"
    return judge
```

**Tab: `review.py`** (starter, entry file)
```python
from collections import Counter

from lib import drafts, recorded_judge, split_claims, ungrounded, verify_claims

REASONS = ("unsupported", "uncited", "bad_citation", "ungrounded")


def review(answer: str, sources: list[str], judge) -> dict:
    """Every check in this lesson that can run on a cited answer, and whether it should be flagged."""
    ...


if __name__ == "__main__":
    judge = recorded_judge("large")
    reviews = [review(d["text"], d["sources"], judge) for d in drafts()]
    flagged = [r for r in reviews if r["flagged"]]
    print(f"{len(flagged)} of {len(reviews)} drafts flagged")
    print("drafts flagged for each reason:", dict(Counter(reason for r in flagged for reason in r["reasons"])))
    print("flagged for ungrounded figures alone:", sum(r["reasons"] == ["ungrounded"] for r in reviews))
```

**Hidden tests:**
```python
from review import review

sources = ["the limit is 60 requests per minute per key", "keys are revoked with regctl"]


def contains(claim: str, source: str) -> bool:
    return claim.lower().rstrip(".") in source.lower()


def always(claim: str, source: str) -> bool:
    return True


r = review("The limit is 60 requests per minute per key [1]. Keys are revoked with regctl [2].", sources, contains)
assert isinstance(r, dict) and set(r) >= {"claims", "ungrounded", "reasons", "flagged"}, (
    "return a dict with claims, ungrounded, reasons and flagged")
assert r["flagged"] is False and r["reasons"] == [], f"a fully supported, grounded answer isn't flagged; got {r['reasons']}"
assert r["ungrounded"] == [], (
    f"ungrounded {r['ungrounded']}: the citation numbers [1] and [2] aren't figures in the answer. Check the claims' "
    "text, which split_claims has already stripped of citations, not the raw answer")

r = review("The limit is 940 requests per minute [1].", sources, always)
assert r["claims"]["supported"] and r["reasons"] == ["ungrounded"], (
    f"reasons {r['reasons']}: a judge can pass a claim whose figure no source contains; the grounding check still flags it")
assert r["flagged"] is True, "an answer with any reason, ungrounded figures included, is flagged"

r = review("The limit is 90 requests per minute per key [1].", sources, contains)
assert "unsupported" in r["reasons"] and r["flagged"], f"a claim no source supports: flag it as unsupported; got {r['reasons']}"
assert r["ungrounded"] == ["90"], f"ungrounded {r['ungrounded']}: 90 appears in no source"
assert r["reasons"] == ["unsupported", "ungrounded"], (
    f"reasons {r['reasons']}: list them in the order unsupported, uncited, bad_citation, ungrounded")


r = review("Keys are revoked with regctl. It needs a write key [3].", sources, contains)
assert r["reasons"] == ["uncited", "bad_citation"], (
    f"reasons {r['reasons']}: one claim cites nothing and one cites [3], which doesn't exist; report both, in order")
assert r["flagged"] is True, "uncited and badly cited claims flag the answer too"
assert r["ungrounded"] == [], (
    f"ungrounded {r['ungrounded']}: 3 is a citation number, not a figure in the answer")

calls = []


def counting(claim, source):
    calls.append(claim)
    return contains(claim, source)


review("Keys are revoked with regctl [1, 2]. Nothing cites this.", sources, counting)
assert calls.count("Keys are revoked with regctl.") == 2 and "Nothing cites this." not in calls, (
    "use verify_claims from lib.py, which only calls the judge where it's needed")
```

**Hint (shown on request):** Split once, and give the claims to
`verify_claims`. For the grounding check, join the claims' `"text"` fields,
not the raw answer, since the raw answer still contains `[2]` and `[1, 3]`.
Then build the reasons by walking the four names in order and keeping those
whose list isn't empty.

**Reference solution:**

**Tab: `review.py`**
```python
from collections import Counter

from lib import drafts, recorded_judge, split_claims, ungrounded, verify_claims

REASONS = ("unsupported", "uncited", "bad_citation", "ungrounded")


def review(answer: str, sources: list[str], judge) -> dict:
    """Every check in this lesson that can run on a cited answer, and whether it should be flagged."""
    claims = split_claims(answer)
    report = verify_claims(claims, sources, judge)
    missing = ungrounded(" ".join(claim["text"] for claim in claims), sources)
    found = {**{key: report[key] for key in ("unsupported", "uncited", "bad_citation")}, "ungrounded": missing}
    reasons = [reason for reason in REASONS if found[reason]]
    return {"claims": report, "ungrounded": missing, "reasons": reasons, "flagged": bool(reasons)}


if __name__ == "__main__":
    judge = recorded_judge("large")
    reviews = [review(d["text"], d["sources"], judge) for d in drafts()]
    flagged = [r for r in reviews if r["flagged"]]
    print(f"{len(flagged)} of {len(reviews)} drafts flagged")
    print("drafts flagged for each reason:", dict(Counter(reason for r in flagged for reason in r["reasons"])))
    print("flagged for ungrounded figures alone:", sum(r["reasons"] == ["ungrounded"] for r in reviews))
```
```
89 of 145 drafts flagged
drafts flagged for each reason: {'unsupported': 73, 'uncited': 20, 'ungrounded': 10}
flagged for ungrounded figures alone: 4
```
*(the Run output, from the committed verdicts)*

**Explanation:** The review is mostly composition, and its one trap is the
raw answer: its citation marks look like numbers, so the grounding check has
to run on the claims `split_claims` has already cleaned. `verify_claims`
keeps the judge calls down, as in the first concept.

The Run output is worth reading as a report on the checks, not only on the
drafts. 89 of 145 drafts are flagged, mostly for claims the 9B judged
unsupported, which, as the lesson showed, mixes real mistakes with claims
that can't stand alone. 20 have a sentence that cites nothing. And all 10
drafts flagged for ungrounded figures are false flags: the drafts wrote
"August 27, 2026" where the source says `2026-08-27`, or "version 2.4" where
it says `v2.4`, forms the grounding check doesn't normalise. Four drafts are
flagged for that alone. Before a check like this goes in front of users,
those are the cases to fix, which is the lesson's habit one more time: read
what a check flags before trusting what it counts.
