# Module 6, Lesson 5 — Concept 5: Free text: when there's nothing to count

---

## No two answers are the same

Everything so far relied on answers that could be compared exactly: a
number, an error code, a name. Most agent output isn't like that. Here are
Qwen3.5-4B's five drafts for one of
[Lesson 4's questions](→ this module, verifying an answer against its sources lesson, checking each claim against the source it cites concept),
the same drafts that lesson checked claim by claim:

```python
drafts = {r["id"]: [s["text"] for s in r["samples"]] for r in load_run("drafts")["results"]}
candidates = drafts["q27"]
print(f"{len({normalize(c) for c in candidates})} different answers among {len(candidates)} drafts")
for number, text in enumerate(candidates, start=1):
    print(f"  draft {number}: {text[:95]}...")
```
```
5 different answers among 5 drafts
  draft 1: The agent affected by INC-2067, `research_agent`, is currently using the `claude-sonnet` model ...
  draft 2: The `research_agent` affected by INC-2067 needs to be moved off the deprecated `claude-legacy` ...
  draft 3: The `research_agent` affected by INC-2067 is currently using the `claude-sonnet` model and must...
  draft 4: The `research_agent` affected by INC-2067 is currently using the deprecated `claude-sonnet` mod...
  draft 5: The agent affected by INC-2067 is the `research_agent`, which currently uses the `claude-sonnet...
```
*(runs live, shows output — read-only demo snippet, not graded. Real
Qwen3.5-4B drafts from the committed run.)*

Five samples, five different texts. Counting identical answers gives five
votes of one, and no majority. Self-consistency depends on extracting a final
answer that can be compared, which is exactly what free text doesn't
offer.

---

## Universal self-consistency

Chen et al.'s
[universal self-consistency](https://arxiv.org/abs/2311.17311) (2023), USC
for short, hands the comparison to the model. All the candidates go into one
prompt, and the model is asked to pick the one most consistent with the
rest, by majority consensus. They made it for exactly the gap above: ordinary
self-consistency needs an answer it can extract, which free-form output
lacks. The authors found it improved results on
open-ended tasks such as summarization and open-ended question answering,
where ordinary self-consistency can't be applied, and on code generation it
matched voting on the code's execution results without running the code.

Here's the selection step, with the instruction the paper used, and the
code that reads the model's pick:

```python
QUESTION = "What model does the agent affected by INC-2067 need to move to, and by when?"


def selection_prompt(question: str, candidates: list[str]) -> str:
    """Universal self-consistency: every candidate in one prompt, and a request to pick the most consistent."""
    listed = "\n\n".join(f"Response {i}: {text}" for i, text in enumerate(candidates, start=1))
    return (f"I have generated the following responses to the question: {question}\n\n{listed}\n\n"
            "Select the most consistent response based on majority consensus. "
            'Start your answer with "The most consistent response is Response X" (without quotes).')


def chosen(reply: str, count: int) -> int | None:
    """The response number the model picked, if it names a valid one."""
    match = re.search(r"most consistent response is Response (\d+)", reply)
    return int(match.group(1)) if match and 1 <= int(match.group(1)) <= count else None


prompt = selection_prompt(QUESTION, candidates)
print(f"selection prompt for {len(candidates)} drafts: about {len(prompt) // 4} tokens")
print(f"with 20 drafts of this length: about {len(selection_prompt(QUESTION, candidates * 4)) // 4} tokens")
print(chosen("The most consistent response is Response 4.", len(candidates)),
      chosen("The most consistent response is Response 9.", len(candidates)),
      chosen("Responses 1 and 4 agree.", len(candidates)))
```
```
selection prompt for 5 drafts: about 652 tokens
with 20 drafts of this length: about 2396 tokens
4 None None
```
*(runs live, shows output — read-only demo snippet, not graded. This
builds the prompt and parses sample replies; no model is called. Tokens use
the course's estimate of about four characters per token.)*

Two things about the design are worth copying:

- **The model picks, code decides.** `chosen` accepts only a response
  number that exists, and returns `None` for anything else, so a malformed or
  out-of-range reply is caught, as in
  [Lesson 3](→ this module, checks in the loop lesson, where a check can sit in the loop concept).
- **The cost grows with the candidates.** One extra call, but its prompt
  holds every candidate in full. Twenty drafts of this length make a prompt
  of about 2,400 tokens. A
  [2024 study](https://arxiv.org/abs/2410.02902) comparing another method
  with USC points out exactly this limit: every candidate has to fit in one
  prompt.

---

## What consensus can't do

Read the five drafts in full and something else shows up: four of them say
`research_agent` currently runs on `claude-sonnet`. It doesn't; it's on
`claude-legacy`, and `claude-sonnet` is where it's moving to. A selection by
majority consensus would favour a draft containing that error, because it's
the thing most drafts agree on. None of the five states the right answer
plainly, and USC can only pick one of the candidates; it can't write a
better one.

That's the lesson of the previous three concepts again, in free text:
consensus measures consistency, not correctness. When the model has a
favourite mistake, every method that looks for agreement will find it.

---

## What to do instead

Three approaches, in order of preference:

- **Make the part that matters countable.** Ask for the key fact on its own
  final line, as set E's replies did with `ANSWER:`, alongside whatever
  explanation the user needs. Then the fact can be voted on exactly, as in
  the first concept, and the prose doesn't have to be.
- **Check the claims, not the consensus.** For free text grounded in
  sources, Lesson 4's checks test each claim against what it cites, which
  catches a mistake the drafts agree on. Checked against the migration
  runbook, the claim that `research_agent` currently uses `claude-sonnet`
  fails, however many drafts make it.
- **Use USC when neither is possible,** knowing it picks the most typical
  candidate, not the best one, and that it can't be better than the best
  candidate it's given.

---

## Quiz cards

> **Q1.** Why can't ordinary self-consistency vote on five free-text drafts?
> - A) Because free text uses too many tokens to count
> - B) No two drafts match, so each answer gets one vote ✅
> - C) Because the drafts were written by a small model
> - D) Because free text can't be normalized at all
>
> *Explanation: voting needs a final answer that can be compared exactly.
> Five differently worded drafts give five answers with one vote each.*

> **Q2.** In universal self-consistency, what does the model do?
> - A) Writes a new answer combining all the candidates
> - B) Picks the candidate most consistent with the rest ✅
> - C) Checks each candidate against its cited sources
> - D) Scores each of the candidates from 1 to 10
>
> *Explanation: USC puts every candidate in one prompt and asks the model to
> choose the one that best matches the majority. It picks; it doesn't write,
> so it can't do better than the best candidate.*

> **Q3.** Four of five drafts say research_agent runs on claude-sonnet, which
> is wrong. What would a consensus-based selection do?
> - A) Reject all five of the drafts as unreliable
> - B) Favour a draft containing the shared mistake ✅
> - C) Correct the mistake using the cited sources
> - D) Pick the one draft that disagrees with the rest
>
> *Explanation: consensus rewards what most candidates agree on, right or
> wrong. Catching a shared mistake needs a check against something outside
> the model, such as the runbook.*

> **Q4.** An agent's answers are free text, but one fact in them decides
> whether they're right. What's the most reliable design?
> - A) Vote on the full texts after lowercasing them
> - B) Ask for that fact on its own line, and vote on it ✅
> - C) Use universal self-consistency with more candidates
> - D) Ask the model how confident it is in each answer
>
> *Explanation: separating the fact that matters makes it countable, so the
> exact-answer voting from the first concept applies, and the explanation
> around it can vary freely.*

---

*(End of this concept, and the last in this lesson. The recap page brings
the lesson together.)*
