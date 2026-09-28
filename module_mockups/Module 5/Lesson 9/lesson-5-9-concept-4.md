# Module 5, Lesson 9 — Concept 4: Sources that disagree

> **Note for the site build:** no new shared code. The second demo uses
> fixed example answers and no client. The demos are independent; each
> builds an `AnswerRetriever`, so allow a few seconds.

---

## Two sources, two numbers

Real document collections contradict themselves. Here is what retrieval
sends for a question about polling the registry, with each source's date and
type, and every line that mentions a rate:

```python
query = next(q for q in load_queries()["main"] if q["id"] == "q36")
request = assemble_request(query["query"], AnswerRetriever().search(query, k=5), budget=1500)
print(query["query"])
for source_id, chunk in request["sources"].items():
    lines = [line for line in chunk["text"].splitlines() if "per minute" in line]
    print(f"  {source_id} {chunk['doc_id']} {chunk['date']} {chunk['source_type']:<8} {chunk['section'].split(' > ')[-1]}")
    for line in lines:
        print(f"      {line.strip()[:150]}")
```
```
How often can my own dashboard poll the registry?
  S1 D08 2026-03-02 official Polling the registry from your own dashboards
      If you build your own dashboard on top of the registry, poll no more than once every few seconds. The registry allows 100 requests per minute per key,
  S2 D08 2026-03-02 official What monitoring collects
  S3 D03 2026-08-18 official v2.4 — 2026-05-12
      - Lowered the rate limit from 100 to 60 requests per minute per key. Some internal dashboards were polling hard enough to slow the registry for agents
  S4 D14 2026-09-10 official Why does my agent get told to slow down?
      Each key gets a fixed number of registry calls per minute. If two things share a key, say the agent and a dashboard, they share that allowance. Give t
  S5 D15 2026-09-20 wiki     Dashboards
```
*(runs live, shows output — read-only demo snippet, not graded)*

The first source, the one the reranker judged most relevant, is the
monitoring guide from March: it says the registry allows 100 requests per
minute. The third, the changelog, says v2.4 lowered the limit from 100 to 60.
The reranker scores relevance to the question, and the March guide is
exactly on topic. Relevance says nothing about which document is current.

---

## Why collections disagree

Nobody wrote the monitoring guide to be wrong. It was right in March. Then
the limit changed in May, the API reference and the changelog were updated,
and the guide wasn't. That's the ordinary way a collection comes to
disagree with itself: documents are written at different times, some are
kept up to date and some aren't, and old pages are rarely deleted. A wiki
that anyone can edit adds another layer of uneven reliability.

The best fix is at the source: update or retire the stale guide, and the
disagreement is gone for every question. Keeping an index in step with
changing documents is part of Module 10. Until then, the answer step has to
cope with disagreement it can't remove.

---

## Giving the model what it needs to choose

The request already carries what's needed: every source has a date and a
type, and the instructions say to prefer the newer official source and to
say that the sources disagree. Here are two answers the model might give,
one that follows the stale guide and one that notices the conflict:

```python
query = next(q for q in load_queries()["main"] if q["id"] == "q36")
request = assemble_request(query["query"], AnswerRetriever().search(query, k=5), budget=1500)
answers = {
    "follows the stale guide": "Poll no more than once every few seconds; the registry allows 100 requests "
                               "per minute per key [S1].",
    "notices the disagreement": "The monitoring guide says the registry allows 100 requests per minute per key "
                                "[S1], but that's out of date: v2.4 lowered the limit to 60 [S3]. A dashboard "
                                "sharing a key with an agent also shares its allowance, so give the dashboard "
                                "its own key [S4].",
}
for label, answer in answers.items():
    checked = check_citations(answer, request["sources"])
    dates = sorted({request["sources"][i]["date"] for i in checked["cited"]})
    print(f"{label:<26} unknown {checked['unknown']}, uncited {len(checked['uncited'])}, cites sources dated {dates}")
```
```
follows the stale guide    unknown [], uncited 0, cites sources dated ['2026-03-02']
notices the disagreement   unknown [], uncited 0, cites sources dated ['2026-03-02', '2026-08-18', '2026-09-10']
```
*(runs live, shows output — read-only demo snippet, not graded)*

Both pass every citation check. Each cites only sources it was given, and
every statement is cited. The difference is *which* sources: the first rests
entirely on a document from March, while a later one on the same subject was
sent alongside it. Citation checks confirm that an answer points somewhere
real; they can't say whether it pointed at the right place. What code can do
is make the dates visible, to a reviewer or to a later check, so an answer
resting only on the oldest source stands out.

---

## A targeted check for facts that matter

For a few facts a team really cares about, such as limits, prices and
deadlines, a narrow check can catch disagreement before any answer is
shown:

```python
def stated_values(sources: dict, pattern: str) -> dict[str, set]:
    """For a fact the team cares about, the values each source states, found by a regular expression."""
    found = {}
    for source_id, chunk in sources.items():
        values = set(re.findall(pattern, chunk["text"]))
        if values:
            found[source_id] = values
    return found

queries = {q["id"]: q for q in load_queries()["main"]}
retriever = AnswerRetriever()
for query_id in ("q35", "q36"):
    request = assemble_request(queries[query_id]["query"], retriever.search(queries[query_id], k=10), budget=1500)
    values = stated_values(request["sources"], r"(\d+) requests per minute")
    distinct = set().union(*values.values())
    print(f"{query_id}: {values}  ->  {'DISAGREE' if len(distinct) > 1 else 'agree'}")
```
```
q35: {'S1': {'60'}, 'S2': {'60'}, 'S4': {'100'}}  ->  DISAGREE
q36: {'S1': {'100'}, 'S3': {'60'}}  ->  DISAGREE
```
*(runs live, shows output — read-only demo snippet, not graded)*

For both rate-limit questions, the sources sent state different values, so
the answer step can flag the answer, or add a note that the sources
disagree, whatever the model says. The check is deliberately narrow. It
knows one phrase for one kind of fact, and it would miss "sixty calls a
minute" or a limit stated per hour. Detecting contradictions in general means
reading what sources claim and comparing them, which takes a model, and
that's Module 6's verification work.

One tempting shortcut deserves a warning: boosting newer documents in
retrieval. It would have helped here, and it's wrong in general. Incident
reports, postmortems and decision records are old *because* they record the
past, and for questions about the past they're the right answer. Dates
belong in front of whatever makes the judgement, not baked into the ranking.

---

## Quiz cards

> **Q1.** The reranker ranked the out-of-date monitoring guide first for
> the polling question. Why?
> - It scores relevance to the question, and the guide is exactly on topic; it knows nothing about dates ✅
> - The guide is newer than the changelog
> - The reranker prefers documents with numbers in them
> - The changelog was left out of the candidates
>
> *Explanation: relevance and currency are different questions. A stale
> page about the right topic is highly relevant. Only its date, and a newer
> source, reveal that it's out of date.*

> **Q2.** Two answers both pass the citation checks, one citing only the
> March guide and one citing the guide, the changelog and the FAQ. What
> can code tell a reviewer?
> - Which dates each answer rests on, so one resting only on the oldest source stands out ✅
> - Which answer is correct, by comparing the numbers
> - That the first answer invented its citation
> - Nothing, because both passed the checks
>
> *Explanation: citation checks confirm an answer points at sources it
> was given. Whether those were the right sources needs the dates, and a
> judgement that code can support but not make.*

> **Q3.** What's the most effective fix for the rate-limit disagreement?
> - Update or retire the stale guide, so no question retrieves the old number ✅
> - Tell the model to always prefer the first source
> - Remove dates from the sources so the model isn't confused
> - Raise the reranker's threshold so the guide is filtered out
>
> *Explanation: disagreement in the corpus reaches every question that
> retrieves it. Fixing the document fixes all of them at once; the answer
> step's handling is for what can't be fixed yet.*

> **Q4.** Why not simply boost newer documents in retrieval?
> - Old documents like incident reports are the right answer to questions about the past ✅
> - Newer documents are more often wrong
> - Retrieval can't read dates from metadata
> - Boosting would break the citation ids
>
> *Explanation: recency helps when a fact has changed, and hurts when the
> question is about what happened. Showing dates to whatever judges the
> answer handles both cases; a ranking rule can't.*
