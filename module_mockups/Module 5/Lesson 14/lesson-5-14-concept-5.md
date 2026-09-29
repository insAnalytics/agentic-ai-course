# Module 5, Lesson 14 — Concept 5: Retrieval in the context step

> **Note for the site build:**
> - The shared setup now includes the previous exercise's reference
>   solution, `recall_scored`.
> - **This concept needs Module 4's code as a module.** Provide three
>   read-only files beside the page's setup: `m4.py`, which is Module 4
>   Lesson 12's recap `LIB_PY` unchanged; `tokens.py` (`COUNT_TOKENS`); and
>   `fake.py` (`FAKE_CLIENT`, `REACT_CLIENT_UPGRADE`, `RECORDING_CLIENT` and
>   `WINDOWED_CLIENT`), as in that recap. pydantic must be loaded, since
>   Module 4's memory records use it.
> - **New shared code** for every demo and exercise from this concept to the
>   end of the lesson: `search_tool_for`, `READ_RESULT_TOOL` and
>   `run_investigation`, exactly as in the first code block below.
> - Each demo runs the investigation with real searches over the corpus;
>   allow a few seconds.

---

## Where retrieved text goes

Module 4's context step decides what goes into every request, in a fixed
order: a system prompt that stays the same for the whole session, so a prefix
cache can reuse it; then the conversation, trimmed or summarised to fit; then
an anchor at the end. Memories recalled at the start of a session go into the
fixed prompt, because they're chosen once, for the session's task.

Retrieved documents are different. An agent searches in the middle of its
work, with queries it writes as it goes, so what it retrieves changes from one
step to the next. Putting that into the system prompt would change the prefix
every time and throw away the cache, [the cost Module 4 measured](→ Module 4, prompt caching lesson, what a prefix cache is worth to an agent concept).
So retrieval belongs where Lesson 11 put it: behind a tool, with its results
in the conversation as tool results. That also puts them where Module 4's
context step already knows how to manage them. Here's the tool, fixed to one
reader as Lesson 13 required, and a scripted investigation that uses it:

```python
import m4
from fake import ContextWindowExceeded, WindowedClient

def search_tool_for(groups):
    """Lesson 13's reader-bound search: keyword search over the contextual text of the chunks these groups
    may read, returning source text. The groups are fixed here, so the model can't change them."""
    groups = frozenset(groups)
    permitted = [c for c in CORPUS_CHUNKS if groups & set(c["access"])]
    index = BM25Index()
    index.add([with_context(c, CONTEXTS) for c in permitted])
    by_key = {(c["doc_id"], c["chunk"]): c for c in permitted}

    def search_documents(query: str, k: int = 5) -> str:
        results = index.search(query.strip(), min(max(int(k), 1), 10)) if query.strip() else []
        if not results:
            return f"No documents matched {query.strip()!r}. Try different words."
        return "\n\n".join(format_source(f"{c['doc_id']}:{c['chunk']}", by_key[(c["doc_id"], c["chunk"])])
                           for c in results)
    return search_documents

READ_RESULT_TOOL = {
    "name": "read_result",
    "description": "Read part of an earlier tool result that the context step cleared and stored under a handle.",
    "input_schema": {"type": "object", "properties": {
        "handle": {"type": "string"}, "offset": {"type": "integer"}, "limit": {"type": "integer"}},
        "required": ["handle"]},
}

INVESTIGATION = ["INC-2093 unavailable", "registry-db failover standby lag", "RegistryUnreachable alert",
                 "monitoring agent list registry", "support_agent registry lookups failing"]
TASK = "Write a timeline of the INC-2093 registry outage and what monitoring showed."
BASE = "You answer questions from the company's documents, citing sources by id."

def run_investigation(window: int, managed: bool, keep_last: int = 2) -> dict:
    """The canonical loop over a scripted investigation: five real searches, then an answer. Returns
    the outcome, each request's size, the context step's choices and the last request sent."""
    search = search_tool_for({"all-staff"})
    results = m4.ResultStore()
    impls = {"search_documents": search,
             "read_result": lambda handle, offset=0, limit=50: m4.read_result(results, handle, offset, limit)}
    replies = [[ToolUseBlock("search_documents", {"query": q})] for q in INVESTIGATION]
    llm = WindowedClient(replies + [[TextBlock("At 14:10 registry-db began failing over [D11:1]...")]], window=window)
    tools = [SEARCH_TOOL, READ_RESULT_TOOL]
    history = [{"role": "user", "content": TASK}]
    context = m4.ContextManager(llm, BASE, tools, window=window, max_tokens=500, memory=m4.MemoryStore(),
                                user_id="u1", task=TASK, now="2026-09-29T09:00:00", block=m4.CoreBlock(""),
                                notes=m4.Notes(), results=results, write_tools=[], keep_last=keep_last) if managed else None
    sizes = []
    for _ in range(10):
        request = context.build(history) if managed else {"system": BASE, "tools": tools, "messages": history}
        sizes.append(m4.count_tokens(request["system"]) + m4.count_tokens(request["tools"])
                     + m4.count_tokens(request["messages"]))
        try:
            response = llm.create(messages=request["messages"], tools=request["tools"], system=request["system"])
        except ContextWindowExceeded as error:
            return {"outcome": f"refused: {error}", "sizes": sizes, "steps": None, "last": request, "results": results}
        history.append({"role": "assistant", "content": response.content})
        calls = [b for b in response.content if b.type == "tool_use"]
        if not calls:
            return {"outcome": "answered", "sizes": sizes, "steps": context.steps if managed else None,
                    "last": request, "results": results}
        history.append({"role": "user", "content": [
            {"type": "tool_result", "tool_use_id": c.id, "content": impls[c.name](**c.input)} for c in calls]})
```
*(defined once here and already loaded for every demo and exercise from here to the end of this lesson)*

---

## Search results under the context step

The investigation makes five real searches, each returning five chunks, then
answers. Here it is in a 3,500-token window, with and without Module 4's
context step:

```python
for managed in (False, True):
    run = run_investigation(window=3500, managed=managed)
    print(f"{'with the context step' if managed else 'without one':<22} {run['outcome']}")
    print(f"  request sizes: {run['sizes']}" + (f"\n  steps: {run['steps']}" if run["steps"] else ""))
```
```
without one            refused: prompt is too long: 4,312 tokens > 3,500 maximum
  request sizes: [308, 1135, 2099, 2740, 3486, 4312]
with the context step  answered
  request sizes: [308, 1135, 2099, 2740, 1890, 2716]
  steps: ['send', 'send', 'send', 'send', 'clear', 'send']
```
*(runs live, shows output — read-only demo snippet, not graded. The model's calls are scripted; every search and every token count is real.)*

Search results are big: 550 to 870 tokens each here, and every one stays in
the conversation for every later request. Without a context step, the sixth
request is refused. With it, the step sees the fifth request coming in over
budget, clears the older results, and the rest of the run fits. Here's what the
last request actually contained:

```python
run = run_investigation(window=3500, managed=True)
results = [block for message in run["last"]["messages"] if isinstance(message["content"], list)
           for block in message["content"] if isinstance(block, dict) and block["type"] == "tool_result"]
for block in results:
    print(f"{m4.count_tokens(block['content']):>5} tokens  {block['content'][:88]}...")
handle = re.search(r'handle="([^"]+)"', results[0]["content"]).group(1)
print(f"\nread_result({handle!r}, limit=3):\n{m4.read_result(run['results'], handle, 0, 3)}")
```
```
   32 tokens  [cleared: an earlier search_documents result, stored as res_1. Read it with read_result(...
   32 tokens  [cleared: an earlier search_documents result, stored as res_2. Read it with read_result(...
  551 tokens  <source id="D08:1" doc="D08" title="Monitoring guide" section="Monitoring guide > Alerts...
  655 tokens  <source id="D08:0" doc="D08" title="Monitoring guide" section="Monitoring guide > What m...
  718 tokens  <source id="D11:3" doc="D11" title="Incident INC-2093: registry outage during database f...

read_result('res_1', limit=3):
<source id="D11:0" doc="D11" title="Incident INC-2093: registry outage during database failover" section="Incident INC-2093: registry outage during database failover > Summary" date="2026-08-29" type="official">
## Summary


... lines 0-3 of 40. Call again with offset=3 for more.
```
*(runs live, shows output — read-only demo snippet, not graded)*

The two oldest search results are now 32-token placeholders, each saying where
the full result is stored. The three most recent are intact. Nothing is lost:
the model can read a cleared result back with `read_result`, a page at a time,
exactly as Module 4 designed for any large tool result.

---

## Sizing the two together

The context step's settings were chosen in Module 4 for its own tools. Search
results change the arithmetic, and the settings need checking against them.
Here's the same investigation in a smaller window:

```python
for window, keep_last in ((3000, 2), (3000, 1)):
    run = run_investigation(window=window, managed=True, keep_last=keep_last)
    kept = [block["content"][:14] for message in run["last"]["messages"] if isinstance(message["content"], list)
            for block in message["content"] if isinstance(block, dict) and block["type"] == "tool_result"]
    print(f"window {window}, keep_last {keep_last}: {run['outcome']}, steps {run['steps']}")
    print(f"  tool results in the last request: {kept}")
```
```
window 3000, keep_last 2: answered, steps ['send', 'send', 'send', 'trim', 'send']
  tool results in the last request: ['<source id="D0', '<source id="D1']
window 3000, keep_last 1: answered, steps ['send', 'send', 'send', 'clear', 'send', 'clear']
  tool results in the last request: ['[cleared: an e', '[cleared: an e', '[cleared: an e', '[cleared: an e', '<source id="D1']
```
*(runs live, shows output — read-only demo snippet, not graded)*

At 3,000 tokens with Module 4's `keep_last` of 2, keeping the two most recent
results intact already takes more than the step's low-water mark allows, so
clearing isn't enough and it falls back to trimming whole rounds. The earlier
searches are gone, placeholders and all, with no handle to read them back.
Keeping one result intact instead lets clearing do the job: four placeholders,
one full result, and nothing lost. The same trade could be made on the
retrieval side, returning three chunks per search instead of five.

The rule is the same one this module keeps applying: size the parts against
each other on a real run, and check what reaches the model, not only whether
the request fit.

---

## The pieces this lesson upgraded

The earlier concepts replaced Module 4's keyword matching at each point where
it chose something by relevance, and each replacement plugs into the same place
in the context step:

- **Tool finding:** fused keywords and meaning, where `find_tools` ranks the
  catalog.
- **Memory recall and store search:** fused, where the session start recalls
  memories and where the agent searches its store.
- **Duplicates:** similarity of meaning finds candidates, which go to the
  model's decision, never straight to a skip.
- **The recall score:** similarity as the relevance term, with the weights
  re-measured.
- **Documents:** a retrieval tool, bound to the reader, whose results the
  context step manages like any other tool result.

---

## Quiz cards

> **Q1.** Why do retrieved documents go in tool results rather than the
> system prompt?
> - They change at every step, and changing the system prompt would break the prefix cache every time ✅
> - System prompts can't hold citations
> - Tool results are never cleared
> - The model ignores the system prompt
>
> *Explanation: memories recalled once per session can sit in the fixed
> prompt. Searches made mid-task can't without changing the prefix on every
> step.*

> **Q2.** What happened to the two oldest search results when the context
> step cleared them?
> - They were stored under handles and replaced by short placeholders the model can read back from ✅
> - They were deleted
> - They were summarised into one sentence
> - They were moved into the system prompt
>
> *Explanation: `clear_to_store` keeps every cleared result, and
> `read_result` pages through it, so clearing costs tokens now without
> losing information.*

> **Q3.** At 3,000 tokens with `keep_last=2`, the context step trimmed whole
> rounds. Why was that worse than clearing?
> - Trimmed rounds are gone entirely, with no placeholder or handle to read them back ✅
> - Trimming is slower than clearing
> - Trimming breaks the prefix cache
> - Trimming removes the system prompt
>
> *Explanation: clearing keeps a pointer to every result. Trimming is the
> last resort, and here it lost two searches the model had made.*

> **Q4.** What fixed the 3,000-token run?
> - Keeping one recent result intact instead of two, so clearing could bring it under budget ✅
> - A larger embedding model
> - Moving search results into the system prompt
> - Removing the read_result tool
>
> *Explanation: settings tuned for small tool results need re-checking for
> large ones. Returning fewer chunks per search would have been another fix.*
