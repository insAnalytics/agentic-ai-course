# Module 5, Lesson 11 — Concept 3: Searching again, and stopping

> **Note for the site build:**
> - No new shared code before the exercise. **The exercise's reference
>   solution** (`SearchBudget`) joins the shared setup only for pages *after*
>   this concept.
> - The second demo builds an `AnswerRetriever`; allow a few seconds.

---

## An agent that won't stop

The freedom to search again cuts both ways. Here's a model that keeps asking
for the same search, and the loop's only defence, its step limit:

```python
stuck = [[ToolUseBlock("search_documents", {"query": "registry rate limit"})] for _ in range(6)]
client = RecordingClient(stuck)
messages = [{"role": "user", "content": "What's the registry's rate limit for my dashboard's key?"}]
answer = run_agent(client, messages, {"search_documents": contextual_search}, max_steps=5)
queries = [b.input["query"] for m in messages if m["role"] == "assistant" for b in m["content"] if b.type == "tool_use"]
print(f"answer: {answer}\nsearches: {queries}")
```
```
answer: stopped after 5 steps without an answer
searches: ['registry rate limit', 'registry rate limit', 'registry rate limit', 'registry rate limit', 'registry rate limit']
```
*(runs live, shows output — read-only demo snippet, not graded. The model's replies are scripted: the same tool call, every time.)*

Five model calls, five identical searches, no answer. Real models do this less
blatantly but for the same reasons: the results don't contain what they want,
and nothing tells them to stop looking. The step limit from
[Module 2](→ Module 2, from hand-rolled to a runtime lesson, what a framework actually provides concept)
stops the loop, but only after spending every step, and it ends with no answer
at all, which is worse than "the sources don't say".

---

## What each search costs

Even an agent that searches well costs more than a pipeline. Every model call
resends the whole conversation so far, including every earlier search's
results. Here's the two-hop run from the previous concept, measured, against
Lesson 10's single answer step for the same question:

```python
def request_tokens(messages: list) -> int:
    """Tokens of everything sent in one request: text, tool calls and tool results."""
    total = 0
    for message in messages:
        if isinstance(message["content"], str):
            total += count_tokens(message["content"])
            continue
        for block in message["content"]:
            if isinstance(block, dict):
                total += count_tokens(block["content"])
            elif block.type == "text":
                total += count_tokens(block.text)
            elif block.type == "tool_use":
                total += count_tokens(json.dumps(block.input))
    return total

client = RecordingClient([
    [ToolUseBlock("search_documents", {"query": "INC-2067 affected agent"})],
    [ToolUseBlock("search_documents", {"query": "research_agent claude-legacy target model switched off"})],
    [TextBlock("INC-2067 affected research_agent [D10:0]. It must move from claude-legacy to claude-sonnet "
               "[D07:1] before claude-legacy is switched off on 2026-10-31 [D07:0].")],
])
messages = [{"role": "user", "content": "What model does the agent affected by INC-2067 need to move to, and by when?"}]
run_agent(client, messages, {"search_documents": contextual_search})
sizes = [request_tokens(seen) for seen in client.seen]
print(f"model calls: {len(sizes)}, input tokens per call: {sizes}, total: {sum(sizes):,}")
print(f"plus the tool definition, {count_tokens(json.dumps(SEARCH_TOOL))} tokens, sent again with every call")

query = next(q for q in load_queries()["main"] if q["id"] == "q27")
request = assemble_request(query["query"], AnswerRetriever().search(query, k=5), budget=1500)
print(f"Lesson 10's answer step: 1 call, {count_tokens(request['system']) + count_tokens(request['messages'][0]['content']):,} input tokens")
```
```
model calls: 3, input tokens per call: [19, 700, 1315], total: 2,034
plus the tool definition, 185 tokens, sent again with every call
Lesson 10's answer step: 1 call, 794 input tokens
```
*(runs live, shows output — read-only demo snippet, not graded. The agent's replies are scripted.)*

Each hop adds its results to every later call, so the third call carries both
searches' results: 1,315 tokens against 19 for the first. The agent's three
calls send about 2,000 input tokens, plus the tool definition every time,
where the pipeline sends one request of about 800. That's two and a half times
the input, and three model calls' latency instead of one. Prompt caching,
from Module 4, softens the input cost, since each call starts with the
previous one, but not the latency.

For a question that one search answers, the agent is simply a more expensive
pipeline. Most of this module's labelled questions are like that: 3 of the
43 answerable ones are multi-hop. That's why many systems use a pipeline by
default and an agent only when a question needs one, or give the agent the
pipeline as its search tool, so each search is as good as possible.

---

## Telling the model to stop

The step limit is a last resort. The better control is inside the tool, where
the model can see it: refuse a repeated search and say why, and after a few
searches, say that the budget is spent and it's time to answer. Both come back
as ordinary tool results, as Module 3 recommends for every kind of failure,
so the model can act on them. That's this concept's exercise.

---

## Quiz cards

> **Q1.** Why is the loop's step limit a poor way to stop a repeating agent?
> - It stops only after every step is spent, and ends with no answer at all ✅
> - It can't count tool calls
> - It stops the agent before its first search
> - It deletes the conversation history
>
> *Explanation: the limit is a safety net. A control the model can see,
> such as a tool result saying the search was already made, lets it change
> course or answer with what it has.*

> **Q2.** Why does the agent's third model call carry so many more tokens
> than its first?
> - Every call resends the conversation, including all earlier search results ✅
> - The third call includes the tool definition three times
> - Later searches return longer chunks
> - The model's answer is counted as input
>
> *Explanation: the model has no memory between calls. Each one is sent
> the full history, so every search's results are paid for again in every
> later call.*

> **Q3.** When is a fixed pipeline the better design?
> - When most questions are answered by one search, since an agent then only adds cost and latency ✅
> - Never; an agent can always do what a pipeline does
> - Only when the corpus is small
> - When questions need several searches
>
> *Explanation: an agent pays for its flexibility in model calls. For
> single-hop questions, which are most of this module's, a pipeline gives the
> same results for one call.*

> **Q4.** Why should a repeated search be refused with a message rather
> than silently re-run?
> - The message tells the model the results are already above, so it changes words or answers ✅
> - Re-running a search returns different results
> - Search results can't be sent twice
> - Refusing saves the tool definition's tokens
>
> *Explanation: re-running gives the model the same results it already
> didn't use. A message is an observation it can act on, the same principle
> as any tool error.*

---

## Applied sandbox exercise
*(graded — a search budget the model can see)*

**Task shown to learner:**

Write a class `SearchBudget` that wraps a search function and is called like
one: `budget(query, k=5)`.

- `SearchBudget(search, max_searches=3)` stores the search function and the
  limit, and starts `self.queries` as an empty list.
- Normalise each query by lowercasing it and collapsing runs of whitespace to
  single spaces (`" ".join(query.lower().split())`).
- **A repeat,** a normalised query already in `self.queries`, returns exactly
  `"You already searched for '<query>'; its results are above. Search with
  different words, or answer with what you have."`, where `<query>` is the
  query stripped of surrounding spaces, quoted as `repr` quotes it. Check for
  repeats first, even after the limit is reached.
- **Once `max_searches` queries have been searched,** any new query returns
  exactly `"Search limit reached (<max_searches> searches). Answer from the
  results you have, or say that the sources don't say."`
- **Otherwise,** record the normalised query and return `search(query, k)`.

Neither message runs the search, and repeats don't count towards the limit.

**Starter code:**

```python
class SearchBudget:
    """Wraps a search tool: refuses a repeated query and stops searching after a limit,
    telling the model why in both cases, so it answers with what it has."""

    def __init__(self, search, max_searches: int = 3):
        # TODO
        ...

    def __call__(self, query: str, k: int = 5) -> str:
        # TODO
        ...
```

**Hidden tests:**

```python
# shared by the tests below
calls = []
def fake_search(query, k=5):
    calls.append((query, k))
    return f"results for {query} ({k})"

# 1. new queries are passed through, with k, and recorded in normalised form
budget = SearchBudget(fake_search, max_searches=3)
assert budget("Registry  Rate Limit", 4) == "results for Registry  Rate Limit (4)", "pass new queries to the search, unchanged"
assert budget.queries == ["registry rate limit"], f"record queries lowercased with spaces collapsed; got {budget.queries}"

# 2. a repeat, in any case or spacing, is refused without searching
reply = budget("  registry rate LIMIT ")
assert reply == ("You already searched for 'registry rate LIMIT'; its results are above. "
                 "Search with different words, or answer with what you have."), reply
assert len(calls) == 1, "a repeated query doesn't run the search"

# 3. the limit stops further searches, and repeats don't count towards it
budget("error code for rate limiting")
budget("retry-after header")
assert len(calls) == 3 and len(budget.queries) == 3, \
    f"repeats don't count towards the limit; got {len(calls)} searches and queries {budget.queries}"
reply = budget("one more query")
assert reply == ("Search limit reached (3 searches). "
                 "Answer from the results you have, or say that the sources don't say."), reply
assert len(calls) == 3, "no search runs once the limit is reached"
assert budget("retry-after header").startswith("You already searched"), "a repeat is still called a repeat after the limit"

# 4. in the loop, the stuck model from the demo gets told, and stops searching early
client = RecordingClient([[ToolUseBlock("search_documents", {"query": "registry rate limit"})]] * 2
                         + [[TextBlock("Each key may make 60 requests per minute [D01:8].")]])
budget = SearchBudget(contextual_search, max_searches=3)
messages = [{"role": "user", "content": "What's the registry's rate limit?"}]
answer = run_agent(client, messages, {"search_documents": budget})
second_result = messages[4]["content"][0]["content"]
assert second_result.startswith("You already searched for 'registry rate limit'"), second_result[:80]
assert answer == "Each key may make 60 requests per minute [D01:8]." and budget.queries == ["registry rate limit"], \
    f"the model answers after being told; got {answer!r} and queries {budget.queries}"
```

**Hint (shown on request):**

Normalise first, then check the repeat, then the limit, and only then search
and record. `__call__` is what lets the instance go straight into the tools
dict: `{"search_documents": SearchBudget(contextual_search)}`.

**Reference solution:**

```python
class SearchBudget:
    """Wraps a search tool: refuses a repeated query and stops searching after a limit,
    telling the model why in both cases, so it answers with what it has."""

    def __init__(self, search, max_searches: int = 3):
        self.search = search
        self.max_searches = max_searches
        self.queries = []

    def __call__(self, query: str, k: int = 5) -> str:
        normalized = " ".join(query.lower().split())
        if normalized in self.queries:
            return (f"You already searched for {query.strip()!r}; its results are above. "
                    "Search with different words, or answer with what you have.")
        if len(self.queries) >= self.max_searches:
            return (f"Search limit reached ({self.max_searches} searches). "
                    "Answer from the results you have, or say that the sources don't say.")
        self.queries.append(normalized)
        return self.search(query, k)
```

**Explanation:**

Test 4 replays the demo's stuck model with the budget in place. Its second,
identical search comes back as a message that the results are already above,
and the (scripted) model answers on its next call instead of spending all its
steps. The budget is per question: create a new one for each question, or
the limit carries over. Both messages point the model at the right fallback,
answering with what it has, or saying the sources don't say, which Lesson
10's answer step already knows how to recognise.
