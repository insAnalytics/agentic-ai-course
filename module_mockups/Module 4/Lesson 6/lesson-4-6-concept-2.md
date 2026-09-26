# Module 4, Lesson 6 — Concept 2: Clearing and compaction that can be undone

> **Note for the site build:** add `clear_to_store`, `transcript`, `compact_with_archive` and `BoundedStore` to this lesson's setup. They build on Concept 1's code, Lesson 4's `is_tool_results`, `check_pairing` and `split_rounds`, and Lesson 5's `compact`. Concept 1's `ResultStore` changed while this concept was written: it now numbers handles with a counter (`self.minted`), so a number is never reused after something is removed. Use the updated class.

---

## The one result clearing shouldn't lose

[Lesson 4's clearing](→ this module, when the history wont fit lesson, clear before you cut and cut in batches concept) replaces an old result with a placeholder that says to call the tool again. That works for logs and status checks. It doesn't work for a result that can't be fetched again, and Lesson 4 said so. Here's one: a snapshot of the live support queue, taken once, and different every time it's taken.

```python
def call(name, result, **arguments):
    block = ToolUseBlock(name=name, input=arguments)
    return [{"role": "assistant", "content": [block]},
            {"role": "user", "content": [{"type": "tool_result", "tool_use_id": block.id, "content": result}]}]

# a snapshot of the live queue: taken once, and never the same twice
snapshot = "support queue at 10:04: 340 tickets waiting\n" + "\n".join(
    f"ticket {n}: waiting {n % 17 + 3} min, stuck in billing lookup" for n in range(4100, 4140))

history = [{"role": "user", "content": "Find out why the support queue is slow."}]
history += call("snapshot_queue", snapshot, queue="support")
for agent in ["research_agent", "billing_agent", "triage_agent"]:
    history += call("get_status", f"{agent}: healthy, p99 1.1s. " * 10, agent_name=agent)

plain = clear_old_results(history, keep_last=2)
print(plain[2]["content"][0]["content"])

store = ResultStore()
restorable = clear_to_store(history, keep_last=2, store=store)
placeholder = restorable[2]["content"][0]["content"]
print(placeholder)
print("read back intact:", read_result(store, "res_1", offset=0, limit=100) == snapshot)
print(f"history {count_tokens(history):,} tokens -> cleared {count_tokens(restorable):,}; pairing problems: {check_pairing(restorable)}")

# clearing the cleared view again changes nothing, and stores nothing new
again = clear_to_store(restorable, keep_last=2, store=store)
print("second clearing identical:", again == restorable, "| items stored:", len(store.items))
```
```
[cleared: an earlier snapshot_queue result, removed to save space. Call snapshot_queue again if you need it.]
[cleared: an earlier snapshot_queue result, stored as res_1. Read it with read_result(handle="res_1", offset=..., limit=...).]
read back intact: True
history 1,066 tokens -> cleared 495; pairing problems: []
second clearing identical: True | items stored: 2
```
*(runs live, shows output — read-only demo snippet, not graded)*

The first placeholder is Lesson 4's. Following its advice would give the agent a different queue, minutes later, with no way to tell that anything changed. The second comes from clearing that stores first. It points at an exact copy, and the snapshot reads back intact.

## Clearing that stores first

`clear_to_store` follows `clear_old_results` rule for rule. The same results are cleared, and the same ones stay: the newest few, every failure, and any text after the results. The only difference is what happens to a cleared result's content. It goes into [the store](→ this lesson, keep the reference not the result concept, a store a preview a handle), and the placeholder carries its handle:

```python
def clear_to_store(messages: list, keep_last: int, store: ResultStore) -> list:
    """Like clear_old_results, but each cleared result is stored first, and its placeholder says how to read it back."""
    names = {}
    for message in messages:
        if message["role"] == "assistant" and isinstance(message["content"], list):
            for block in message["content"]:
                if _plain(block)["type"] == "tool_use":
                    names[block.id] = block.name

    successful = []
    for message in messages:
        if is_tool_results(message):
            for block in message["content"]:
                if block.get("type") == "tool_result" and not block.get("is_error"):
                    successful.append(block["tool_use_id"])
    to_keep = successful[len(successful) - keep_last:]

    cleared = []
    for message in messages:
        if is_tool_results(message):
            new_content = []
            for block in message["content"]:
                old = block.get("type") == "tool_result" and not block.get("is_error") and block["tool_use_id"] not in to_keep
                # a result that's already a placeholder is left alone, so clearing twice changes nothing
                if old and not str(block["content"]).startswith("[cleared:"):
                    handle = store.put(str(block["content"]))
                    name = names[block["tool_use_id"]]
                    block = {**block, "content": f"[cleared: an earlier {name} result, stored as {handle}. "
                                                 f"Read it with read_result(handle=\"{handle}\", offset=..., limit=...).]"}
                new_content.append(block)
            cleared.append({**message, "content": new_content})
        else:
            cleared.append(message)
    return cleared
```

One rule is new, and it matters because of how [Lesson 5's context steps](→ this module, compaction and summarization lesson, when to compact and what it costs concept, the order in one place) work: they keep the view they last sent, and clear it again when it's over budget. Without the skip, a result that's already a placeholder would be stored again under a new handle. The view would change on every clearing, costing a cache miss each time, and each handle would point at another placeholder instead of the data. With the skip, clearing a cleared view changes nothing, which the demo's last line checks.

This is the Manus rule from [the previous concept](→ this lesson, keep the reference not the result concept, one result four ways): compression that can be undone. Clearing still shrinks the context as much as before. It just no longer throws anything away.

## Compaction with a record behind it

A summary is lossy by design. [Lesson 5](→ this module, compaction and summarization lesson, when a summary loses something concept) kept what code can derive out of its hands, but the exact output of the rounds it replaces is still gone. It doesn't have to be. Before compacting, store a plain record of those rounds, and have the summary say where it is:

```python
def transcript(messages: list) -> str:
    """A plain-text record of messages: what was said, what was called, what came back."""
    lines = []
    for message in messages:
        if isinstance(message["content"], str):
            lines.append(f"{message['role']}: {message['content']}")
            continue
        for block in message["content"]:
            block = _plain(block)
            if block["type"] == "text":
                lines.append(f"{message['role']}: {block['text']}")
            elif block["type"] == "tool_use":
                lines.append(f"called {block['name']}({json.dumps(block['input'])})")
            elif block["type"] == "tool_result":
                lines.append(f"result: {block['content']}")
    return "\n".join(lines)

def compact_with_archive(messages: list, summary: str, keep_recent: int, store: ResultStore) -> list:
    """compact, but the rounds being replaced are stored first, and the summary says where."""
    rounds = split_rounds(messages)
    replaced = []
    for r in rounds[:len(rounds) - keep_recent]:
        replaced += r
    handle = store.put(transcript(replaced))
    note = f"\nThe full record of this work is stored as {handle}; read it with read_result(handle=\"{handle}\", offset=..., limit=...)."
    return compact(messages, summary + note, keep_recent)
```

```python
def call(name, result, **arguments):
    block = ToolUseBlock(name=name, input=arguments)
    return [{"role": "assistant", "content": [block]},
            {"role": "user", "content": [{"type": "tool_result", "tool_use_id": block.id, "content": result}]}]

store = ResultStore()
history = [{"role": "user", "content": "Find out why the support queue is slow."}]
history += call("get_metrics", "billing_agent: p99 4.8s on /lookup, called once per ticket", agent_name="billing_agent")
for agent in ["research_agent", "triage_agent", "search_agent"]:
    history += call("get_logs", f"{agent} INFO request handled in 412ms\n" * 30, agent_name=agent)

# the scripted summary leaves the exact figure out; the stored record still has it
compacted = compact_with_archive(history, "billing_agent looked slow; three other agents ruled out.", keep_recent=1, store=store)
print(compacted[0]["content"])
print()
print(find_in_result(store, "res_1", "p99"))
```
```
Find out why the support queue is slow.

<summary_of_earlier_work>
billing_agent looked slow; three other agents ruled out.
The full record of this work is stored as res_1; read it with read_result(handle="res_1", offset=..., limit=...).
</summary_of_earlier_work>

1: result: billing_agent: p99 4.8s on /lookup, called once per ticket
```
*(runs live, shows output — read-only demo snippet, not graded; the summary is scripted, and written to leave the exact figure out)*

The summary is short and vague, as summaries can be. But the 4.8-second figure is one search away. The summary stays the model's working view of what happened, and the record is there when a detail turns out to matter.

The record only covers what was in those rounds. If a result in them had already been cleared to the store, the record contains its placeholder, and the placeholder still leads to the data.

## Keeping the store in bounds

A store the agent writes to needs a few rules of its own:

- **One store per task.** Create it with the task, and let it go when the task ends. A store shared across tasks mixes their data, and in a multi-user system, one user's results could surface in another's session. [Lesson 9](→ this module, building a memory store lesson) treats that separation as a requirement.
- **A size cap, and an honest message when it bites.** A store that only grows is a memory leak with a handle on it. When it's full, something has to go, and then "restorable" becomes "restorable while it's still stored":

```python
class BoundedStore(ResultStore):
    """A ResultStore with a size cap. When it's full, the oldest results are removed to make room."""
    def __init__(self, max_tokens: int):
        super().__init__()
        self.max_tokens = max_tokens
        self.removed = []

    def put(self, content: str) -> str:
        handle = super().put(content)
        while count_tokens(list(self.items.values())) > self.max_tokens and len(self.items) > 1:
            oldest = list(self.items)[0]
            del self.items[oldest]
            self.removed.append(oldest)
        return handle

    def get(self, handle: str):
        if handle in self.removed:
            # say what happened, so the model doesn't retry the same handle
            return f"[{handle} was removed from storage to make room. Fetch the data again if you still need it.]"
        return super().get(handle)
```

```python
store = BoundedStore(max_tokens=1_000)
first = store.put("an early snapshot " * 100)
second = store.put("a later log " * 100)
third = store.put("the newest page " * 100)
print("kept:", list(store.items), "| removed:", store.removed)
print(read_result(store, first))
```
```
kept: ['res_2', 'res_3'] | removed: ['res_1']
[res_1 was removed from storage to make room. Fetch the data again if you still need it.]
```
*(runs live, shows output — read-only demo snippet, not graded)*

  The removed handle doesn't just vanish. Reading it says what happened, so the model fetches the data again if it can, instead of retrying a handle that will never work.

- **The store mints handles, and the model only passes them back.** If the store keeps results in files, it maps each handle to a path of its own choosing. The model's argument should never become a file path directly. A "handle" like `../../config/secrets` would otherwise read files outside the store. That's the least-privilege rule from [Module 3](→ Module 3, designing for least privilege lesson) applied to one argument.
- **What comes back out is still tool output.** It gets the same trust as any other tool result.

---

## Quiz cards

> **Q1.** Why is Lesson 4's placeholder, "call snapshot_queue again", the wrong advice for a queue snapshot?
> - A) The tool can only be called once per task
> - B) Calling it again returns a different, later snapshot, with nothing to say that it changed ✅
> - C) The placeholder is too long
> - D) Re-calling a tool breaks tool pairing
>
> *Explanation:* Re-fetching only restores a result the source still returns unchanged. A snapshot, a live page or a one-off query needs a stored copy instead.

> **Q2.** What is the one difference between `clear_to_store` and Lesson 4's `clear_old_results`?
> - A) It clears more results
> - B) It also clears failed results
> - C) It removes the tool calls as well
> - D) Each cleared result's content is stored first, and the placeholder carries its handle ✅
>
> *Explanation:* The same results are cleared and the same ones stay, so the context shrinks just as much. Nothing is thrown away.

> **Q3.** Why does `clear_to_store` skip results that are already placeholders?
> - A) Placeholders can't be stored
> - B) Context steps clear their saved view again, and storing a placeholder would give it a new handle, changing the view and pointing at a placeholder instead of the data ✅
> - C) Placeholders are always under the size threshold
> - D) The API rejects a placeholder that has been changed
>
> *Explanation:* With the skip, clearing an already-cleared view changes nothing: no cache miss, and no chain of handles.

> **Q4.** How does `compact_with_archive` make compaction restorable?
> - A) It stores a record of the rounds being replaced, and the summary says which handle holds it ✅
> - B) It keeps every replaced round in the context as well
> - C) It checks the summary against the original rounds
> - D) It asks the model to write a longer summary
>
> *Explanation:* The summary stays short and remains the model's working view. The exact detail is one read or search away when it's needed.

> **Q5.** What does a size cap change about offloaded results, and how does `BoundedStore` handle it?
> - A) Nothing, since the cap only applies to new results
> - B) Results become read-only once the cap is reached
> - C) An old result can be removed, so reading its handle returns a note saying so, and the model can fetch the data again instead of retrying ✅
> - D) The cap compresses results so they all still fit
>
> *Explanation:* Once something can be removed, "restorable" means "restorable while stored". An honest message is what keeps the model from looping on a dead handle.

---

## Applied sandbox exercise

*(graded — clearing that can be undone)*

**Task shown to learner:** `ResultStore`, `read_result`, `is_tool_results`, `check_pairing` and `_plain` are provided. Implement **`clear_to_store(messages, keep_last, store)`**. It applies the same rules as Lesson 4's `clear_old_results`:

- **What's cleared:** every successful tool result except the newest `keep_last`. Count results one by one, newest last.
- **What's left alone:** any result with `"is_error": True`, any block that isn't a tool result, and every message and call.
- **How a result is cleared:**
  - Store its content with `store.put`.
  - Replace the content with `[cleared: an earlier NAME result, stored as HANDLE. Read it with read_result(handle="HANDLE", offset=..., limit=...).]`, where NAME is the tool that produced it.
- **Already cleared:** a result whose content already starts with `"[cleared:"` is left exactly as it is, and nothing is stored for it.
- Return a new list, and never modify `messages` or the blocks in it.

**Provided code:** `ResultStore` and `read_result` from the previous concept, `is_tool_results` and `check_pairing` from Lesson 4, and the fake client's `_plain` and `ToolUseBlock`.

**Starter code:**
```python
def clear_to_store(messages: list, keep_last: int, store: ResultStore) -> list:
    # TODO: 1) map each tool_use id to its tool name
    #       2) find the newest keep_last successful results, which stay as they are
    #       3) store every other successful result and replace it with the placeholder,
    #          skipping any result that's already a placeholder
    ...
```

**Hidden tests:**
```python
def exchange(pairs, is_error=False):
    calls, results = [], []
    for name, text in pairs:
        call = ToolUseBlock(name=name, input={})
        calls.append(call)
        result = {"type": "tool_result", "tool_use_id": call.id, "content": text}
        if is_error:
            result["is_error"] = True
        results.append(result)
    return [{"role": "assistant", "content": calls}, {"role": "user", "content": results}]

def texts(messages):
    found = []
    for m in messages:
        if is_tool_results(m):
            for b in m["content"]:
                if b.get("type") == "tool_result":
                    found.append(b["content"])
    return found

task = {"role": "user", "content": "Check everything."}
history = ([task]
           + exchange([("snapshot_queue", "queue " + "q" * 400)])
           + exchange([("get_status", "status " + "s" * 400), ("get_logs", "logs " + "l" * 400)])
           + exchange([("get_status", "Error: timed out")], is_error=True)
           + exchange([("get_logs", "latest " + "n" * 400)]))
history[-1]["content"].append({"type": "text", "text": "<plan>keep going</plan>"})
original = texts(history)

# 1. old successful results are stored, in order, and replaced by a placeholder naming the tool and the handle
store = ResultStore()
out = clear_to_store(history, keep_last=1, store=store)
t = texts(out)
assert t[0] == '[cleared: an earlier snapshot_queue result, stored as res_1. Read it with read_result(handle="res_1", offset=..., limit=...).]'
assert t[1].startswith("[cleared: an earlier get_status result, stored as res_2.")
assert t[2].startswith("[cleared: an earlier get_logs result, stored as res_3.")
assert store.get("res_1") == original[0] and store.get("res_3") == original[2]

# 2. the newest keep_last successful results, failures and text blocks are left alone
assert t[3] == "Error: timed out" and t[4] == original[4]
assert out[-1]["content"][-1] == {"type": "text", "text": "<plan>keep going</plan>"}

# 3. every message and call stays in place, and pairing holds
assert len(out) == len(history) and out[1]["content"] is history[1]["content"]
assert check_pairing(out) == []

# 4. clearing is lossless: the stored copy reads back exactly
assert read_result(store, "res_2", offset=0, limit=10) == original[1]

# 5. clearing an already-cleared view changes nothing and stores nothing new
again = clear_to_store(out, keep_last=1, store=store)
assert again == out and len(store.items) == 3

# 6. a placeholder from Lesson 4's plain clearing is also left alone
plain = [task] + exchange([("get_logs", "[cleared: an earlier get_logs result, removed to save space. Call get_logs again if you need it.]")]) \
        + exchange([("get_logs", "fresh " + "f" * 400)])
fresh_store = ResultStore()
assert clear_to_store(plain, keep_last=1, store=fresh_store) == plain and fresh_store.items == {}

# 7. the history passed in is never changed
assert texts(history) == original
```

**Hint (shown on request):** Start from Lesson 4's `clear_old_results`, since the structure is the same. The two changes are inside the loop over result blocks: skip a block whose content already starts with `"[cleared:"`, and call `store.put` before building the new block with `{**block, "content": ...}`.

**Reference solution:**
```python
def clear_to_store(messages: list, keep_last: int, store: ResultStore) -> list:
    """Like clear_old_results, but each cleared result is stored first, and its placeholder says how to read it back."""
    names = {}
    for message in messages:
        if message["role"] == "assistant" and isinstance(message["content"], list):
            for block in message["content"]:
                if _plain(block)["type"] == "tool_use":
                    names[block.id] = block.name

    successful = []
    for message in messages:
        if is_tool_results(message):
            for block in message["content"]:
                if block.get("type") == "tool_result" and not block.get("is_error"):
                    successful.append(block["tool_use_id"])
    to_keep = successful[len(successful) - keep_last:]

    cleared = []
    for message in messages:
        if is_tool_results(message):
            new_content = []
            for block in message["content"]:
                old = block.get("type") == "tool_result" and not block.get("is_error") and block["tool_use_id"] not in to_keep
                # a result that's already a placeholder is left alone, so clearing twice changes nothing
                if old and not str(block["content"]).startswith("[cleared:"):
                    handle = store.put(str(block["content"]))
                    name = names[block["tool_use_id"]]
                    block = {**block, "content": f"[cleared: an earlier {name} result, stored as {handle}. "
                                                 f"Read it with read_result(handle=\"{handle}\", offset=..., limit=...).]"}
                new_content.append(block)
            cleared.append({**message, "content": new_content})
        else:
            cleared.append(message)
    return cleared
```

**Explanation:** Test 1 checks the placeholder and that each result is stored in order, so handles follow the history. Test 4 checks that nothing is lost: the stored copy reads back exactly. Test 5 is the new rule: clearing a cleared view changes nothing and stores nothing, and a version without the skip stores its own placeholders. Test 6 extends that to Lesson 4's placeholders, which may already be in a history. Tests 2 and 7 hold the old rules: failures and text blocks are untouched, and the history passed in is never changed.

---

*(End of Concept 2.)*
