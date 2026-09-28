# Module 5, Lesson 9 — Concept 2: Citations that point back

> **Note for the site build:**
> - The shared setup now includes the previous exercise's reference
>   solution, `format_source` and `assemble_request`.
> - **New shared code** for every demo and exercise from this concept to the
>   end of the lesson: `CITATION` and `check_citations`, exactly as in the
>   first code block below.
> - The first demo needs the fake client (`REACT_FAKE_CLIENT` then
>   `RECORDING_CLIENT`); its reply is scripted. The second demo uses fixed
>   example replies and no client.

---

## Citations a program can read

An answer built from retrieved sources is only as trustworthy as the link
between each statement and where it came from. A citation is that link, and
this lesson's instructions ask for it in a form code can read: after each
statement, the id of the source it came from, like `[S2]`. Because
`assemble_request` recorded which chunk each id stands for, every citation
can be traced to a document and a section.

Models don't do this perfectly. Gao and colleagues built ALCE, a benchmark
that scores answers with citations automatically, and found that even the
best models they tested lacked complete citation support in about half of
their answers on one of its datasets. So citations are worth asking
for, and worth checking.

---

## Checking what can be checked

Some things about citations are mechanical, and code can check them every
time:

```python
CITATION = re.compile(r"\[(S\d+)\]")

def check_citations(answer: str, sources: dict) -> dict:
    """What code can check about an answer's citations: which statements cite what, which ids
    weren't among the sources sent, and which statements cite nothing."""
    # a sentence ends at . ! or ?, unless a citation follows straight after
    statements = [s.strip() for s in re.split(r"(?<=[.!?])\s+(?!\[)", answer.strip()) if s.strip()]
    checked = [{"text": s, "cites": CITATION.findall(s)} for s in statements]
    cited = {source_id for s in checked for source_id in s["cites"]}
    return {
        "statements": checked,
        "unknown": sorted(cited - sources.keys()),
        "uncited": [s["text"] for s in checked if not s["cites"]],
        "cited": {i: (sources[i]["doc_id"], sources[i]["section"]) for i in sorted(cited & sources.keys())},
    }
```
*(defined once here and already loaded for every demo and exercise from here to the end of this lesson)*

It splits the answer into statements, collects each statement's citations,
and reports two kinds of problem: ids that weren't among the sources sent,
and statements that cite nothing. It also maps every valid id back to its
document and section, which is what an interface would show a reader, a
subject for Module 9. Here it is on a scripted answer to the rate-limit
question:

```python
query = next(q for q in load_queries()["main"] if q["id"] == "q35")
request = assemble_request(query["query"], AnswerRetriever().search(query, k=5), budget=1500)
reply = ("Each registry key may make 60 requests per minute [S1]. Requests past the limit get HTTP 429 "
         "with REG-1009 and a Retry-After header [S1][S3]. The monitoring guide gives 100 requests per minute, "
         "but it predates v2.4, which lowered the limit to 60 [S4][S2].")
client = FakeLLMClient([[TextBlock(reply)]])
# a real client also sends request["system"]; the fake client takes only the messages
response = client.create(request["messages"])
answer = "".join(block.text for block in response.content if block.type == "text")

checked = check_citations(answer, request["sources"])
for statement in checked["statements"]:
    print(f"{statement['cites']}  {statement['text'][:70]}...")
print("\nunknown ids:", checked["unknown"], "  uncited statements:", len(checked["uncited"]))
for source_id, (doc_id, section) in checked["cited"].items():
    print(f"{source_id} -> {doc_id} | {section}")
```
```
['S1']  Each registry key may make 60 requests per minute [S1]....
['S1', 'S3']  Requests past the limit get HTTP 429 with REG-1009 and a Retry-After h...
['S4', 'S2']  The monitoring guide gives 100 requests per minute, but it predates v2...

unknown ids: []   uncited statements: 0
S1 -> D01 | Registry API reference > Rate limits
S2 -> D03 | Registry changelog > v2.4 — 2026-05-12
S3 -> D02 | Error code reference > Limits and availability
S4 -> D08 | Monitoring guide > Polling the registry from your own dashboards
```
*(runs live, shows output — read-only demo snippet, not graded. The model's reply is scripted to show the mechanics.)*

Every statement cites something, every id was sent, and each one resolves
to a specific place in a specific document.

---

## What the checks catch, and what they can't

Here are three answers that go wrong in different ways:

```python
query = next(q for q in load_queries()["main"] if q["id"] == "q35")
request = assemble_request(query["query"], AnswerRetriever().search(query, k=5), budget=1500)
replies = {
    "cites a source it wasn't given": "Each key may make 60 requests per minute [S1]. The limit resets every hour [S7].",
    "leaves a statement uncited": "Each key may make 60 requests per minute [S1]. Most dashboards poll every second.",
    "cites the wrong source": "Each key may make 60 requests per minute [S3].",
}
for problem, reply in replies.items():
    checked = check_citations(reply, request["sources"])
    flagged = bool(checked["unknown"] or checked["uncited"])
    print(f"{problem:<32} unknown {checked['unknown']}, uncited {len(checked['uncited'])}  -> "
          f"{'flagged' if flagged else 'passes'}")
print(f"\nS3 is {request['sources']['S3']['section']}:")
print(request["sources"]["S3"]["text"].splitlines()[4])
```
```
cites a source it wasn't given   unknown ['S7'], uncited 0  -> flagged
leaves a statement uncited       unknown [], uncited 1  -> flagged
cites the wrong source           unknown [], uncited 0  -> passes

S3 is Error code reference > Limits and availability:
| `REG-1009` | `RATE_LIMITED` | 429 | The key made too many requests this minute. Wait the number of seconds in `Retry-After`, then retry. |
```
*(runs live, shows output — read-only demo snippet, not graded)*

The first two are caught. An id the model wasn't given is either invented or
garbled, and a statement with no citation is exactly the kind of statement
that might have come from the model's general knowledge rather than the
sources. What to do about them is a design choice: drop the statement, ask
the model again, or show the answer with a warning.

The third passes both checks and is still wrong. `S3` exists, and the
statement cites it, but S3 is the error-code table, and it never says 60.
The number is right; its source isn't. Checking that a cited source actually
*supports* a statement means reading both and comparing what they say, which
is a model call or a person, not a regular expression. That's Module 6's
subject, verification. This lesson's checks are the cheap first layer: they
make sure every citation points somewhere real, so that verification has
something to check.

---

## Quiz cards

> **Q1.** Why ask for citations like `[S2]` rather than document names?
> - Each id maps to exactly one chunk that was sent, so code can trace it ✅
> - Models can't write document names correctly
> - Short citations use fewer output tokens, which is the main reason
> - Document names would reveal restricted documents
>
> *Explanation: `assemble_request` records which chunk each id stands
> for. A short id in a fixed format can be found by a regular expression
> and resolved to a document and section.*

> **Q2.** An answer cites `[S7]`, but only five sources were sent. What
> does that tell you?
> - The citation is invented or garbled, so the statement's source is unknown ✅
> - The model found a seventh source on its own
> - The seventh source was cut by the token budget, so the citation is fine
> - Nothing: citation numbers are approximate
>
> *Explanation: the model saw only S1 to S5. Any other id can't point to
> anything it was shown, so the statement behind it has no traceable
> source.*

> **Q3.** What does ALCE's finding suggest about asking models for
> citations?
> - They're worth asking for and worth checking, since even strong models often leave statements unsupported ✅
> - Citations are unreliable, so they shouldn't be requested
> - Models cite correctly once they're told to
> - Citation quality only matters for long answers
>
> *Explanation: on one of ALCE's datasets, even the best models lacked
> complete citation support about half the time. Asking for citations makes
> checking possible; it doesn't make checking unnecessary.*

> **Q4.** A statement cites a real source that doesn't say what the
> statement says. Why doesn't `check_citations` catch it?
> - It only checks that ids exist and statements cite something; judging support means comparing meaning ✅
> - It only checks the first citation in each statement
> - The source was below the reranker's threshold
> - Its regular expression doesn't match citations at the end of a sentence
>
> *Explanation: whether a source supports a claim is a question about
> what both say. That needs a model or a person, and it's the job of
> verification in Module 6. The mechanical checks make sure every citation
> points somewhere real first.*
