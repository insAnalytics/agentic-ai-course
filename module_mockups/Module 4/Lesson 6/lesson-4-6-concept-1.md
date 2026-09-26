# Module 4, Lesson 6 — Concept 1: Keep the reference, not the result

> **Note for the site build:** add `ResultStore`, `offload`, `read_result` and `find_in_result` (the code blocks under "A store, a preview, a handle") to this lesson's shared setup. They need only `count_tokens` from the fake client. The first demo defines its own `LogService`.

---

## One result, four ways

Some tool results are simply large: a day of logs, a long document, a web page. [Module 3](→ Module 3, shaping what tools return lesson, truncation and pagination concept) offered two ways to keep one from flooding the context: truncate it, or paginate it. Both have a cost that shows up in an agent, so here's `billing_agent`'s log handled four ways. Somewhere deep in it is the one error that matters:

```python
class LogService:
    """billing_agent's log, newest line first. New lines keep arriving while the agent reads."""
    def __init__(self):
        self.lines = []
        for k in range(600):
            level = "ERROR lookup timed out after 30s, retrying" if k == 412 else "INFO request handled in 412ms"
            self.lines.append(f"#{600 - k} billing_agent {level}")

    def fetch(self, offset: int, limit: int) -> list:
        return self.lines[offset:offset + limit]

    def new_request(self, n: int):
        self.lines.insert(0, f"#{601 + n} billing_agent INFO request handled in 398ms")

service = LogService()
everything = "\n".join(service.fetch(0, 600))
print(f"whole result:   {count_tokens(everything):>6,} tokens")

truncated = "\n".join(service.fetch(0, 40))
print(f"truncated:      {count_tokens(truncated):>6,} tokens, reaches lines 0-39 only; the ERROR is at line 412")

# pagination re-queries the live source; five new lines arrive between page 1 and page 2
page_1 = service.fetch(0, 40)
for n in range(5):
    service.new_request(n)
page_2 = service.fetch(40, 40)
print(f"paginated:      page 2 repeats {len([line for line in page_2 if line in page_1])} lines of page 1")

# offloading stores one snapshot and keeps a preview and a handle in the context
service = LogService()
store = ResultStore()
reference = offload("\n".join(service.fetch(0, 600)), store, threshold=500)
print(f"offloaded:      {count_tokens(reference):>6,} tokens in the context\n")
print(reference.split("\n")[0])
print(find_in_result(store, "res_1", "ERROR"))
print(read_result(store, "res_1", offset=410, limit=4))
```
```
whole result:    7,326 tokens
truncated:         490 tokens, reaches lines 0-39 only; the ERROR is at line 412
paginated:      page 2 repeats 5 lines of page 1
offloaded:         159 tokens in the context

[Stored as res_1: 600 lines, about 7,326 tokens. The first 10 lines are below. Read more with read_result(handle="res_1", offset=..., limit=...).]
412: #188 billing_agent ERROR lookup timed out after 30s, retrying
#190 billing_agent INFO request handled in 412ms
#189 billing_agent INFO request handled in 412ms
#188 billing_agent ERROR lookup timed out after 30s, retrying
#187 billing_agent INFO request handled in 412ms

... lines 410-414 of 600. Call again with offset=414 for more.
```
*(runs live, shows output — read-only demo snippet, not graded)*

- **Whole,** the result costs over 7,000 tokens, sent again on every later turn. [Lesson 1](→ this module, context as a budget lesson, watching it grow across the loop concept) showed where that leads.
- **Truncated,** it's small, but the error at line 412 is unreachable. Nothing in the context says it exists.
- **Paginated,** each page is a fresh query of the source. This log gained five lines between pages, so page 2 repeated five lines of page 1. A source can also change in the other direction and skip lines, and a slow or paid source charges again for every page.
- **Offloaded,** the whole result is stored once, as a snapshot. The context gets a preview and a handle, and the agent can search or page through the stored copy as much as it likes.

The team behind the Manus agent [put the reasoning well](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus): an agent can't reliably know which observation will turn out to matter ten steps later, so any compression it can't undo is a risk. Their rule is to make compression restorable, the way a web page's content can be dropped from the context as long as its URL is kept. Offloading is that rule applied to tool results.

## A store, a preview, a handle

The store is the agent's own. It keeps results outside the conversation under **handles** it mints itself: the same pattern as [Module 3's MCP handles](→ Module 3, the model context protocol lesson, stateless by design concept, when a server does need state handles), where a server mints an identifier and later calls pass it back as an ordinary argument.

```python
class ResultStore:
    """Large tool results, kept outside the conversation under handles the store mints."""
    def __init__(self):
        self.items = {}
        self.minted = 0

    def put(self, content: str) -> str:
        self.minted += 1
        handle = f"res_{self.minted}"
        self.items[handle] = content
        return handle


    def get(self, handle: str):
        return self.items.get(handle)
```

One difference from Module 3: these handles are just numbered. Module 3's server made its handles random, because many clients shared one server and none should be able to guess another's. This store belongs to a single agent's task, so there's no one to guess.

`offload` decides what goes into the context. A small result passes through untouched. A large one is stored, and the context gets a header line and a preview. The header says what's stored and how big it is, and it names the exact call that reads more, so the model knows the rest exists and how to reach it:

```python
def offload(content: str, store: ResultStore, threshold: int, preview_lines: int = 10) -> str:
    """Small results pass through. Large ones are stored, and a preview with the handle goes into the context."""
    if count_tokens(content) <= threshold:
        return content
    handle = store.put(content)
    lines = content.split("\n")
    preview = "\n".join(lines[:preview_lines])
    return (f"[Stored as {handle}: {len(lines)} lines, about {count_tokens(content):,} tokens. "
            f"The first {preview_lines} lines are below. "
            f"Read more with read_result(handle=\"{handle}\", offset=..., limit=...).]\n{preview}")

def read_result(store: ResultStore, handle: str, offset: int = 0, limit: int = 50) -> str:
    content = store.get(handle)
    if content is None:
        return f"Error: no stored result called {handle}. Use a handle exactly as it appears in an earlier result."
    lines = content.split("\n")
    page = lines[offset:offset + limit]
    text = "\n".join(page)
    if offset + limit < len(lines):
        text += f"\n\n... lines {offset}-{offset + len(page)} of {len(lines)}. Call again with offset={offset + limit} for more."
    return text
```

`read_result` is Module 3's pagination, pointed at the store instead of the source. An unknown handle gets an error the model can act on, [as Module 3 recommended](→ Module 3, tool schemas and argument validation lesson, validate and return failures as observations concept), rather than an exception. Searching the stored copy is often better than paging through it:

```python
def find_in_result(store: ResultStore, handle: str, text: str, max_matches: int = 20) -> str:
    """The lines of a stored result that contain `text`, with their line numbers."""
    content = store.get(handle)
    if content is None:
        return f"Error: no stored result called {handle}. Use a handle exactly as it appears in an earlier result."
    lines = content.split("\n")
    matches = [f"{i}: {lines[i]}" for i in range(len(lines)) if text in lines[i]]
    if not matches:
        return f"No lines in {handle} contain {text}."
    shown = "\n".join(matches[:max_matches])
    if len(matches) > max_matches:
        shown += f"\n... {len(matches) - max_matches} more matches not shown."
    return shown
```

## In the loop

Here's the same investigation run twice: once with the whole log in the context, and once with it offloaded. After reading the log, both runs go on to check three other agents:

```python
class LogService:
    def __init__(self):
        self.lines = []
        for k in range(600):
            level = "ERROR lookup timed out after 30s, retrying" if k == 412 else "INFO request handled in 412ms"
            self.lines.append(f"#{600 - k} billing_agent {level}")

def run(offloading: bool) -> list:
    """Run the same scripted investigation; return the size of every request sent."""
    service = LogService()
    store = ResultStore()
    tools = {
        "get_logs": lambda agent_name: "\n".join(service.lines),
        "find_in_result": lambda handle, text: find_in_result(store, handle, text),
        "read_result": lambda handle, offset, limit: read_result(store, handle, offset, limit),
        "get_status": lambda agent_name: f"{agent_name}: healthy, p99 1.1s",
    }
    # reading tools return bounded output already, so only the others are offloaded
    readers = ["find_in_result", "read_result"]
    steps = [[ToolUseBlock(name="get_logs", input={"agent_name": "billing_agent"})]]
    # with the whole log in its context the agent reads it there; with a handle it searches the stored copy
    if offloading:
        steps += [[ToolUseBlock(name="find_in_result", input={"handle": "res_1", "text": "ERROR"})],
                  [ToolUseBlock(name="read_result", input={"handle": "res_1", "offset": 408, "limit": 8})]]
    steps += [[ToolUseBlock(name="get_status", input={"agent_name": a})] for a in ["search_agent", "triage_agent", "report_agent"]]
    steps += [[TextBlock(text="One billing_agent lookup timeout, log entry #188; the other agents are healthy.")]]
    llm = FakeLLMClient(steps)
    messages = [{"role": "user", "content": "Check billing_agent's logs for errors."}]
    sizes = []
    while True:
        sizes.append(count_tokens(messages))
        response = llm.create(messages=messages)
        messages.append({"role": "assistant", "content": response.content})
        calls = [b for b in response.content if b.type == "tool_use"]
        if not calls:
            return sizes
        results = []
        for call in calls:
            output = tools[call.name](**call.input)
            if offloading and call.name not in readers:
                output = offload(output, store, threshold=500)
            results.append({"type": "tool_result", "tool_use_id": call.id, "content": output})
        messages.append({"role": "user", "content": results})

for label, offloading in [("whole result in context", False), ("offloaded", True)]:
    sizes = run(offloading)
    print(f"{label:24} {len(sizes)} requests, sizes {sizes}")
    print(f"{'':24} total sent {sum(sizes):,} tokens")
```
```
whole result in context  5 requests, sizes [18, 7555, 7625, 7694, 7764]
                         total sent 30,656 tokens
offloaded                7 requests, sizes [18, 242, 322, 508, 577, 647, 716]
                         total sent 3,030 tokens
```
*(runs live, shows output — read-only demo snippet, not graded; the model's calls are scripted, including which handle it reads)*

The offloaded run took two extra requests, to search the stored log and read around the error. It still sent about a tenth of the tokens. The whole log was resent on every turn after it arrived, including the three that had nothing to do with it.

A few choices in the loop are deliberate:

- **Readers aren't offloaded.** `read_result` and `find_in_result` already return a bounded amount. Offloading their output would hand the model another handle instead of the lines it asked for.
- **The preview has to be useful.** The model decides what to do next from the header and the first lines, so they should say what the result is and how much there is.
- **The trade is latency for tokens.** Each read is another round trip. For a result the model will need all of, and that fits comfortably, passing it through whole can be the better choice. The threshold is that decision.

## Why it happens when the result is created

Offloading a result the moment it arrives, before it's ever sent, means it never has to be edited later. [Lesson 4](→ this module, when the history wont fit lesson, reasoning travels with its tool call concept, when the provider binds reasoning to everything before it) listed shaping a result before its first send as the first defense against lost cache hits and invalidated reasoning, and this is that shaping: the reference is small from the start, and it stays small.

Two things offloading doesn't change:

- **Stored content is still tool output.** When the agent reads it back, it enters the context like any other tool result, with the same trust. Everything in [Module 3's threat model](→ Module 3, the tool threat model lesson) about text that tries to steer the agent applies unchanged.
- **The store lasts as long as the task.** Keeping things across sessions is a different problem, and [Lesson 8](→ this module, short term and long term memory lesson) starts on it.

---

## Quiz cards

> **Q1.** Why can paginating a live source give an agent a wrong picture, when paging through an offloaded copy can't?
> - A) Each page re-queries the source, so if it changes between pages, lines repeat or go missing ✅
> - B) Pagination always returns the pages in reverse order
> - C) The offloaded copy is compressed, so it holds more lines
> - D) Pagination can't return more than 40 lines
>
> *Explanation:* Offloading stores one snapshot and pages through that. In the demo, five new log lines arrived between pages, and page 2 repeated five lines of page 1.

> **Q2.** What does offloading keep that truncation loses?
> - A) The cached prefix
> - B) Nothing, since both drop the rest of the result
> - C) The ability to reach the rest of the result later, through a handle ✅
> - D) The exact token count of the preview
>
> *Explanation:* Truncation leaves the rest unreachable, and nothing in the context says it exists. Offloading keeps a handle to all of it and says how to read more. That's the Manus team's rule: compression should be restorable.

> **Q3.** Why does `offload`'s header name the exact call for reading more?
> - A) The API requires it
> - B) The model decides its next step from what's in the context, so it needs to know the rest exists and how to reach it ✅
> - C) It makes the preview shorter
> - D) It lets the store find the result faster
>
> *Explanation:* A handle is only useful if the model knows what it points to and how to use it. The header gives the size and the call, and the preview gives a first look.

> **Q4.** Why aren't `read_result`'s and `find_in_result`'s outputs offloaded too?
> - A) They're never large enough to pass the threshold
> - B) Offloading only works on the first tool call
> - C) Their output can't be stored
> - D) They already return a bounded amount, and offloading it would give the model another handle instead of the lines it asked for ✅
>
> *Explanation:* The readers are how the model gets content back out. Their `limit` and `max_matches` settings already keep each answer small.

> **Q5.** Why is it better to offload a result when it first arrives than to shrink it later?
> - A) A result shrunk before its first send never needs editing, so it costs no cache misses and invalidates no reasoning later ✅
> - B) Results can only be stored before they're sent
> - C) The model can't read handles in older messages
> - D) Offloading later loses the handle
>
> *Explanation:* Lesson 4 named shaping a result before it first enters the history as the first defense on providers that bind reasoning to everything before it. A small reference never has to change.

---

## Applied sandbox exercise

*(graded — offloading and reading back)*

**Task shown to learner:** `ResultStore` and `count_tokens` are provided. Implement:

- **`offload(content, store, threshold, preview_lines=10)`:**
  - If `count_tokens(content)` is at most `threshold`, return `content` unchanged and store nothing.
  - Otherwise store it with `store.put`, split it into lines with `content.split("\n")`, and return the header, a newline, then the first `preview_lines` lines joined by `"\n"`.
  - The header is `[Stored as HANDLE: N lines, about T tokens. The first P lines are below. Read more with read_result(handle="HANDLE", offset=..., limit=...).]`. T is `count_tokens(content)` formatted with a thousands separator (`f"{t:,}"`).
- **`read_result(store, handle, offset=0, limit=50)`:**
  - For an unknown handle, return `Error: no stored result called HANDLE. Use a handle exactly as it appears in an earlier result.`
  - Otherwise return lines `offset` to `offset + limit`, joined by `"\n"`.
  - If there are lines after them, add `"\n\n... lines A-B of N. Call again with offset=C for more."`. A is `offset`, B is `offset` plus the number of lines returned, and C is `offset + limit`.

**Provided code:** `ResultStore` as shown in this concept, and the fake client's `count_tokens`.

**Starter code:**
```python
def offload(content: str, store: ResultStore, threshold: int, preview_lines: int = 10) -> str:
    # TODO: pass small results through; store large ones and return the header line plus a preview
    ...

def read_result(store: ResultStore, handle: str, offset: int = 0, limit: int = 50) -> str:
    # TODO: an error for an unknown handle; otherwise one page of lines, with a note if there are more
    ...
```

**Hidden tests:**
```python
big = "\n".join(f"line {i}: " + "x" * 40 for i in range(300))
small = "status: healthy"

# 1. a small result passes through unchanged, and nothing is stored
store = ResultStore()
assert offload(small, store, threshold=100) == small and store.items == {}

# 2. a large result is stored in full; the context gets the header line and a preview
out = offload(big, store, threshold=100, preview_lines=3)
assert store.get("res_1") == big
header = (f"[Stored as res_1: 300 lines, about {count_tokens(big):,} tokens. The first 3 lines are below. "
          f"Read more with read_result(handle=\"res_1\", offset=..., limit=...).]")
assert out == header + "\nline 0: " + "x" * 40 + "\nline 1: " + "x" * 40 + "\nline 2: " + "x" * 40
assert count_tokens(out) < count_tokens(big) / 10

# 3. exactly at the threshold still passes through; each stored result gets its own handle
assert offload("y" * 400, store, threshold=count_tokens("y" * 400)) == "y" * 400
offload(big + "\nmore", store, threshold=100)
assert store.get("res_2") == big + "\nmore"

# 3b. size is measured in tokens, not lines: one long line (minified JSON, say) is still large
one_line = "{" + ", ".join(f'"k{i}": {i}' for i in range(400)) + "}"
assert offload(one_line, store, threshold=100).startswith("[Stored as res_3: 1 lines")

# 4. reading a page: the lines asked for, then a note saying how to continue
page = read_result(store, "res_1", offset=10, limit=5)
lines = page.split("\n")
assert lines[:5] == [f"line {i}: " + "x" * 40 for i in range(10, 15)]
assert lines[-1] == "... lines 10-15 of 300. Call again with offset=15 for more."

# 5. a page that reaches the end has no continuation note, including one that ends exactly on the last line
last = read_result(store, "res_1", offset=295, limit=10)
assert last == "\n".join(f"line {i}: " + "x" * 40 for i in range(295, 300))
exact = read_result(store, "res_1", offset=290, limit=10)
assert exact == "\n".join(f"line {i}: " + "x" * 40 for i in range(290, 300))

# 6. an unknown handle is an error the model can act on, not an exception
assert read_result(store, "res_9") == "Error: no stored result called res_9. Use a handle exactly as it appears in an earlier result."
```

**Hint (shown on request):** Both functions start from `content.split("\n")`. In `read_result`, the slice `lines[offset:offset + limit]` already handles a page that runs past the end, so the only question for the continuation note is whether `offset + limit` is still short of the number of lines.

**Reference solution:**
```python
def offload(content: str, store: ResultStore, threshold: int, preview_lines: int = 10) -> str:
    """Small results pass through. Large ones are stored, and a preview with the handle goes into the context."""
    if count_tokens(content) <= threshold:
        return content
    handle = store.put(content)
    lines = content.split("\n")
    preview = "\n".join(lines[:preview_lines])
    return (f"[Stored as {handle}: {len(lines)} lines, about {count_tokens(content):,} tokens. "
            f"The first {preview_lines} lines are below. "
            f"Read more with read_result(handle=\"{handle}\", offset=..., limit=...).]\n{preview}")

def read_result(store: ResultStore, handle: str, offset: int = 0, limit: int = 50) -> str:
    content = store.get(handle)
    if content is None:
        return f"Error: no stored result called {handle}. Use a handle exactly as it appears in an earlier result."
    lines = content.split("\n")
    page = lines[offset:offset + limit]
    text = "\n".join(page)
    if offset + limit < len(lines):
        text += f"\n\n... lines {offset}-{offset + len(page)} of {len(lines)}. Call again with offset={offset + limit} for more."
    return text
```

**Explanation:** Test 2 checks that the whole result is stored, not just the preview, and that the context gets the exact header and the preview lines. A version that stores only the preview passes a quick look and loses everything else. Test 3b catches measuring size in lines instead of tokens: a single line of minified JSON can be as large as a whole log. Test 5 catches the off-by-one in the continuation note, with a page that ends exactly on the last line. Test 6 checks that an unknown handle comes back as a message the model can act on.

---

*(End of Concept 1.)*
