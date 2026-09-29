# Module 6, Lesson 4 — Concept 1: Checking each claim against the source it cites

> **Note for the site build:** this lesson's shared setup is the block below marked "defined once
> here". It reads `/data/reliability/` as Lesson 1 does, including the run files from the second
> offline run (`drafts.json`, `draft-support.*.json`, `support.*.json`, `statements.*.json`,
> `nli.json`, `premises.json`) and `set-v.json` and `set-f.json`. `split_claims` must stay identical
> to `scripts/reliability/claims.py`, which built the claims the judges saw.

---

## A citation isn't evidence

[Module 5's citation checks](→ Module 5, answering from retrieved context lesson, citations that point back concept)
made sure every statement in an answer cites something, and that every
citation points at a source the model was actually given. They ended with a
case they couldn't catch: a statement citing a real source that doesn't say
what the statement says. Module 5 called its checks the first layer, and
left the next one to this lesson: does the cited source *support* the claim?

This is a common failure, not a rare one. Liu, Zhang and Liang,
[*Evaluating Verifiability in Generative Search Engines*](https://arxiv.org/abs/2304.09848)
(EMNLP Findings 2023), had people check the answers of four commercial
generative search engines against the sources they cited. On average, only
51.5% of generated sentences were fully supported by their citations, and
only 74.5% of citations supported the sentence they were attached to.

Checking support takes two steps: split the answer into claims, then check
each claim against what it cites.

---

## Splitting an answer into claims

The simplest unit is the sentence, with the sources it cites.
Min et al.'s [FActScore](https://arxiv.org/abs/2305.14251) (2023) goes
further, using a model to break text into atomic facts and checking each one
against a knowledge source. That catches a sentence that is half right, at
the cost of a model call per sentence. This lesson uses sentences, split in
code:

```python
import json
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
```
*(defined once here and already loaded for every demo in this lesson)*

This lesson's drafts cite sources by number, `[2]` or `[1, 3]`, where
Module 5 used ids like `[S2]`, so the pattern differs, but the idea is the
same. A citation written just after the full stop, at the start of the next
sentence, is given to the sentence before it.

The drafts in this lesson are real. Qwen3.5-4B answered 29 of Module 5's
questions from numbered sources, five times each, and was told to cite a
source after every sentence. Here's one of its answers:

```python
drafts = {r["id"]: r for r in load_run("drafts")["results"]}
questions = {q["id"]: q for q in load_set("set-v")["draft_questions"]}

question = questions["q27"]
answer = drafts["q27"]["samples"][4]["text"]
print("Q:", question["question"])
print()
for number, claim in enumerate(split_claims(answer), start=1):
    print(f"claim {number}, cites {claim['cites']}: {claim['text']}")
```
```
Q: What model does the agent affected by INC-2067 need to move to, and by when?

claim 1, cites [2]: The agent affected by INC-2067 is the `research_agent`, which currently uses the `claude-sonnet` model and must be moved to `claude-opus`.
claim 2, cites [2]: This migration requires moving the agent to the `priority` tier first, as `claude-opus` is only available in that tier.
claim 3, cites [5]: The agent must complete this move before 2026-10-31, the date when the deprecated `claude-legacy` model is switched off.
```
*(runs live, shows output — read-only demo snippet, not graded. A real
Qwen3.5-4B draft from the committed run.)*

The correct answer, from the migration runbook, is that `research_agent`
moves to `claude-sonnet` before 2026-10-31. The first claim is wrong.

---

## The support check

Whether a source supports a claim is a question about meaning, so it needs
a model. This is how RAG systems are commonly evaluated: the
[faithfulness metric in Ragas](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness/),
a widely used evaluation library, identifies the claims in a response,
checks each against the retrieved context, and reports the share that are
supported. Here the check is one short call per claim and cited source,
asking for a verdict in a fixed form, and code reads the verdict. Here's the prompt, and
what Qwen3.5-9B, used as the judge, said about each claim above:

```python
judged = load_run("draft-support.large")
verdicts = {r["id"]: r["verdict"] for r in judged["results"]}
print(judged["settings"]["template"].format(source="<the cited source's text>", claim="<one claim>"))
print()
sources = questions["q27"]["context"]
for c, claim in enumerate(split_claims(answer)):
    for number in claim["cites"]:
        verdict = verdicts[f"q27:4:{c}:{number}"]
        print(f"claim {c + 1} vs source [{number}] ({sources[number - 1]['key']}): {verdict}")
print()
print(f"source [2] ({sources[1]['key']}):")
print(sources[1]["text"])
```
```
Source:
<the cited source's text>

Claim: <one claim>

Does the source, on its own, fully support the claim? If any part of the claim isn't stated in the source, or the source says something different, it doesn't. Reply with one line and nothing else:
VERDICT: SUPPORTED
or
VERDICT: NOT SUPPORTED

claim 1 vs source [2] (D01:7): NOT SUPPORTED
claim 2 vs source [2] (D01:7): SUPPORTED
claim 3 vs source [5] (D07:0): SUPPORTED

source [2] (D01:7):
Registry API reference > Tiers and models

## Tiers and models

Every agent has a tier, and each tier allows a fixed set of models:

| Tier | Allowed models |
|---|---|
| `standard` | `claude-haiku`, `claude-sonnet` |
| `priority` | `claude-haiku`, `claude-sonnet`, `claude-opus` |

Moving an agent to `claude-opus` therefore means moving it to the `priority` tier first, which needs approval from its owner's budget holder. `claude-legacy` is deprecated and can't be assigned to any agent; existing agents on it keep working until 2026-10-31.
```
*(runs live, shows output — read-only demo snippet, not graded. Real
Qwen3.5-9B verdicts from the committed run, greedy decoding, one call per
claim and cited source.)*

The judge caught the wrong claim: source [2] lists which models each tier
allows, and never says which model `research_agent` uses or moves to. It
passed the other two, which the sources do state.

Look at claim 2 again, though. It's true, and its source supports it, but
it's only in the answer because of the mistake in claim 1: nobody needs to
change tier to move to `claude-sonnet`. A check that looks at one claim at a
time can confirm that each piece is supported without noticing that the
answer as a whole is wrong. That's a limit of the method, and a reason the
next section's responses matter.

Across all 145 drafts, here's how the claims came out, with each of the two
models as the judge:

```python
from collections import Counter


def claim_outcomes(model: str) -> dict:
    """Each claim in every draft, by (question, sample, claim): supported if some source it cites
    supports it, unsupported if none does, uncited if it cites nothing."""
    verdicts = {r["id"]: r["verdict"] for r in load_run(f"draft-support.{model}")["results"]}
    outcomes = {}
    for record in load_run("drafts")["results"]:
        for s, sample in enumerate(record["samples"]):
            for c, claim in enumerate(split_claims(sample["text"])):
                key = (record["id"], s, c)
                found = [verdicts.get(f"{record['id']}:{s}:{c}:{n}") for n in claim["cites"]]
                if not claim["cites"]:
                    outcomes[key] = "uncited"
                else:
                    outcomes[key] = "supported" if "SUPPORTED" in found else "unsupported"
    return outcomes


large, small = claim_outcomes("large"), claim_outcomes("small")
print("Qwen3.5-9B judge:", dict(Counter(large.values())))
print("Qwen3.5-4B judge:", dict(Counter(small.values())))
cited = [key for key in large if large[key] != "uncited"]
agree = sum(large[key] == small[key] for key in cited)
print(f"the two judges agree on {agree} of {len(cited)} cited claims")
```
```
Qwen3.5-9B judge: {'supported': 286, 'unsupported': 104, 'uncited': 21}
Qwen3.5-4B judge: {'supported': 271, 'unsupported': 119, 'uncited': 21}
the two judges agree on 357 of 390 cited claims
```
*(runs live, shows output — read-only demo snippet, not graded. Real
verdicts on Qwen3.5-4B's drafts; "supported" means at least one cited
source supports the claim.)*

Between a quarter and a third of the cited claims were judged unsupported,
depending on the judge, and 21 claims
cited nothing at all, which Module 5's check would already have flagged.
The two judges disagreed on 33 claims.

These drafts have no labels, so these counts don't say how many of the
flags are right. Some are real mistakes, like the one above. Others aren't:

```python
flagged = drafts["q04"]["samples"][2]["text"]
print(flagged)
print()
for c, claim in enumerate(split_claims(flagged)):
    for number in claim["cites"]:
        print(f"claim {c + 1} vs source [{number}]: {verdicts[f'q04:2:{c}:{number}']}  | {claim['text']}")
```
```
The safest approach is to set the agent's status to "retired" rather than deleting it, as this preserves the record and its change history. This method should be used instead of permanent deletion, which is only recommended for agents created by mistake [3].

claim 2 vs source [3]: NOT SUPPORTED  | This method should be used instead of permanent deletion, which is only recommended for agents created by mistake.
```
*(runs live, shows output — read-only demo snippet, not graded. A real
draft and verdict from the committed run; the 4B judge said the same.)*

Source [3] does say to prefer retiring an agent, and to delete only agents
created by mistake. The claim fails because "this method" means nothing on
its own: the judge sees one sentence, without the sentence before it. Choi
et al. called this problem
[decontextualization](https://aclanthology.org/2021.tacl-1.27/) (TACL
2021): a sentence taken out of its text often needs rewriting to be
understood alone, by resolving words like "this" and "it". A splitter that
does that rewriting, usually with a model, would avoid flags like this one.
Notice also that the sentence before it cites nothing, which is its own
problem.

How often this judge is right is a question that needs labelled data, which
is what the next concept measures.

---

## What to do with an unsupported claim

[Lesson 3's responses](→ this module, checks in the loop lesson, what a failed check does concept)
apply here, with one warning. The obvious fix, dropping the unsupported
claim, can leave an answer that is worse than before:

```python
kept = [claim["text"] for c, claim in enumerate(split_claims(answer))
        if any(verdicts[f"q27:4:{c}:{n}"] == "SUPPORTED" for n in claim["cites"])]
print(" ".join(kept))
```
```
This migration requires moving the agent to the `priority` tier first, as `claude-opus` is only available in that tier. The agent must complete this move before 2026-10-31, the date when the deprecated `claude-legacy` model is switched off.
```
*(runs live, shows output — read-only demo snippet, not graded.)*

With the wrong claim gone, what's left reads as advice to move
`research_agent` to the priority tier, which nobody asked for, and it no
longer says which model to move to. So the three options each fit different
cases:

- **Drop the claim** when the rest of the answer stands without it, such as
  an extra detail at the end.
- **Flag it:** show the answer with the claim marked as unverified, and let
  the reader decide. This keeps everything visible and costs nothing more.
- **Retrieve and answer again:** search for the flagged claim's subject,
  judge it against the new sources, or have the model redraft with the
  flagged claim named. This costs more calls, but it's the only option that
  can fix the answer. In this draft, the migration runbook's table was
  among the sources and simply wasn't used.

Which fits depends on the step, as
[Lesson 2 said](→ this module, accuracy latency cost and false refusals lesson, spend reliability where the risk is concept):
an answer a person reads can carry a flag; an answer an agent acts on
should be fixed or stopped.

---

## Applied sandbox exercise
*(graded — sorting claims by what their citations support)*

**Task shown to learner:** Write `verify_claims(claims, sources, judge)`.
`claims` is what `split_claims` returns, `sources` is the list of source
texts the answer's numbers refer to (`[1]` is `sources[0]`), and
`judge(claim, source)` returns `True` if the source supports the claim. Put
each claim's text into one of four lists:

- **uncited:** it cites nothing
- **bad_citation:** it cites a number outside 1 to `len(sources)`
- **supported:** at least one of its cited sources supports it
- **unsupported:** none of them does

Each judge call stands for a model call, so don't make any you don't need:
none for uncited or badly cited claims, and none after a source has already
supported the claim.

**Starter code:**
```python
def verify_claims(claims: list[dict], sources: list[str], judge) -> dict:
    """Sort each claim by what checking it against its cited sources found. judge(claim, source)
    returns True if the source supports the claim; it's called only until one source does."""
    ...


def keyword_judge(claim: str, source: str) -> bool:
    """A stand-in for a model judge, for trying your code: every word of the claim is in the source."""
    return set(claim.lower().rstrip(".").split()) <= set(source.lower().split())


sources = ["the limit is 60 per key", "keys are revoked with regctl"]
claims = split_claims("The limit is 60 per key [1]. Keys are revoked with regctl [1, 2]. "
                      "The limit is 100 per key [1]. It resets hourly. See also [3].")
print(verify_claims(claims, sources, keyword_judge))
```

**Hidden tests:**
```python
calls = []


def judge(claim: str, source: str) -> bool:
    """A stand-in judge: supported when every word of the claim appears in the source."""
    calls.append((claim, source))
    return set(claim.lower().rstrip(".").split()) <= set(source.lower().split())


sources = ["the limit is 60 per key", "keys are revoked with regctl", "the limit is 60 per key and 429 past it"]
claims = [
    {"text": "The limit is 60 per key.", "cites": [1]},
    {"text": "Keys are revoked with regctl.", "cites": [1, 2]},
    {"text": "The limit is 100 per key.", "cites": [1, 3]},
    {"text": "Nothing cites this.", "cites": []},
    {"text": "This cites a source that wasn't sent.", "cites": [2, 4]},
    {"text": "Neither does source zero.", "cites": [0]},
]
try:
    report = verify_claims(claims, sources, judge)
except IndexError:
    raise AssertionError("verify_claims raised IndexError: source numbers start at 1, so [n] is sources[n - 1], "
                         "and a number outside 1..len(sources) is a bad citation to report, not look up") from None
assert isinstance(report, dict) and set(report) == {"supported", "unsupported", "uncited", "bad_citation"}, (
    "return a dict with the four keys: supported, unsupported, uncited, bad_citation")
assert report["supported"] == ["The limit is 60 per key.", "Keys are revoked with regctl."], (
    f"supported: {report['supported']}. A claim is supported if at least one of its cited sources supports it; "
    "'Keys are revoked' cites [1, 2] and source 2 supports it")
assert report["bad_citation"] == ["This cites a source that wasn't sent.", "Neither does source zero."], (
    f"bad_citation: {report['bad_citation']}. Source numbers start at 1: [4] and [0] point at nothing, "
    "so these are bad citations, found before any judging")
assert report["uncited"] == ["Nothing cites this."], (
    f"uncited: {report['uncited']}. A claim that cites nothing is its own finding, not an unsupported claim")
assert report["unsupported"] == ["The limit is 100 per key."], (
    f"unsupported: {report['unsupported']}. It cites [1, 3] and neither says 100")

judged = [claim for claim, _ in calls]
assert "Nothing cites this." not in judged and "This cites a source that wasn't sent." not in judged, (
    "don't call the judge for a claim with no citations or a bad one: there's nothing valid to check it against")
assert judged.count("The limit is 60 per key.") == 1, "one cited source, one judge call"
assert judged.count("Keys are revoked with regctl.") == 2, "source 1 doesn't support it, source 2 does: two calls"
assert judged.count("The limit is 100 per key.") == 2, "neither source supports it, so both are checked"

calls.clear()
verify_claims([{"text": "The limit is 60 per key.", "cites": [3, 1]}], sources, judge)
assert len(calls) == 1, (
    f"{len(calls)} judge calls: source 3 already supports the claim, so stop there. Each call is a model call, "
    "and the claim's verdict can't change")

assert verify_claims([], sources, judge) == {"supported": [], "unsupported": [], "uncited": [], "bad_citation": []}, (
    "no claims: four empty lists")
```

**Hint (shown on request):** Check the claim's citations in the order of the
lists above, and only call the judge once the citations are known to be
valid. `any()` over a generator stops at the first `True`, which is exactly
the early stop you need; a list inside `any([...])` would call the judge
for every source first.

**Reference solution:**
```python
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
```
```
{'supported': ['The limit is 60 per key.', 'Keys are revoked with regctl.'], 'unsupported': ['The limit is 100 per key.'], 'uncited': ['It resets hourly.'], 'bad_citation': ['See also.']}
```
*(the starter's printout, with the reference in place)*

**Explanation:** The order of the checks is what keeps the judge calls
down. Missing and invalid citations are found in code, for free, as in
Module 5, and only then does the model get asked. `any()` with a generator
stops at the first supporting source, so a claim costs one call if its first
source supports it. The "at least one source" rule has a known gap: a claim
that needs two sources together, one for each half, fails against each
alone. Judging a claim against all its cited sources at once, joined into one
prompt, closes that gap at the cost of a longer prompt; which to use is
another cost trade-off.

---

## Quiz cards

> **Q1.** Module 5's checks confirmed that every citation pointed at a
> source the model was given. What can't they tell you?
> - A) Whether a statement cites anything at all
> - B) Whether the cited source says what the statement says ✅
> - C) Which document and section a citation points to
> - D) Whether a citation's id was among the sources sent
>
> *Explanation: the mechanical checks confirm the link exists. Whether the
> source supports the claim means comparing what both say, which needs a
> model. Liu et al. found only 74.5% of citations in commercial generative
> search engines supported their sentence.*

> **Q2.** In the demo draft, the judge passed "this migration requires
> moving the agent to the priority tier first", and it's true. Why is the
> answer still wrong?
> - A) The judge made a mistake when it passed that claim
> - B) The claim only follows from the wrong claim before it ✅
> - C) The claim cited the wrong source for what it says
> - D) True claims can never be part of a wrong answer
>
> *Explanation: checking claims one at a time confirms each piece, not
> whether the pieces make a right answer. Claim 2 is only there because
> claim 1 got the model wrong.*

> **Q3.** A claim reads "This method should be used instead of permanent
> deletion", and the judge rejects it though the source supports the idea.
> What went wrong?
> - A) The claim cited the wrong source for what it says
> - B) "This method" means nothing without the sentence before ✅
> - C) The judge can't read the Markdown in the source
> - D) The source never mentions deleting an agent at all
>
> *Explanation: the judge sees one sentence and one source. A sentence that
> depends on its neighbours needs rewriting to stand alone,
> decontextualization, before it can be checked.*

> **Q4.** Dropping the one unsupported claim from the demo draft left an
> answer that no longer said which model to use, and suggested an
> unnecessary tier change. What does that show?
> - A) Unsupported claims should never be dropped from an answer
> - B) Dropping can mislead, so sometimes only a new answer fixes it ✅
> - C) The judge flagged the wrong claim in that draft
> - D) Flags on claims should only ever be shown to developers
>
> *Explanation: what's left after dropping is only as good as its parts
> together. When the dropped claim carried the answer, the fix is a new
> answer, which costs more calls but can actually be right.*

> **Q5.** Why does `verify_claims` check for missing and invalid citations
> before calling the judge?
> - A) Because the judge can't handle a claim without citations
> - B) Because code settles them for free, with nothing to judge ✅
> - C) Because bad citations are always the most common problem
> - D) Because the judge would count them all as supported
>
> *Explanation: code catches them with certainty and no cost. Model calls
> go only to the question code can't answer: does this source support this
> claim?*

---

*(End of this concept. The next concept measures how often the support
check itself is right, on pairs where the right verdict is known.)*
