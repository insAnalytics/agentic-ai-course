# Module 4, Lesson 1 — Concept 2: Measuring one request, part by part

---

## A breakdown, not a single number

[The previous concept](→ this lesson, what fills the window concept) counted the pieces of a request one at a time. The useful habit is to measure them together, every time, as a breakdown: how many tokens each part takes, how much input that adds up to, and how much room is left once the reply is reserved. One total number tells you whether a request fits. A breakdown tells you *why* it's the size it is, which is what you need before deciding what to change.

```python
from tokens import count_tokens

def measure_request(system: str, tools: list, messages: list, max_tokens: int, window: int) -> dict:
    parts = {
        "system": count_tokens(system),
        "tools": count_tokens(tools),
        "messages": count_tokens(messages),
    }
    input_total = sum(parts.values())
    return {
        "parts": parts,
        "input_total": input_total,
        "reply_room": max_tokens,
        "headroom": window - input_total - max_tokens,
    }
```

Three parts, their sum, and the headroom, [counted the way the previous concept established](→ this lesson, what fills the window concept): window minus input minus reply room.

## The registry agent's first turn

Here's the registry agent from [Module 3](→ Module 3, connecting an agent to mcp servers lesson), connected to a registry server and a monitoring server, on the very first turn of a conversation:

```python
SYSTEM_PROMPT = (
    "You are the registry assistant for the platform team. You answer questions about registered "
    "agents, check their health, and change which model an agent runs on when asked. Always check "
    "an agent exists before changing it. Never delete agents. Keep answers short and cite the tool "
    "result you relied on."
)

def tool(name, description, props):
    return {"name": name, "description": description,
            "input_schema": {"type": "object", "properties": props, "required": list(props)}}

name_prop = {"agent_name": {"type": "string", "description": "Exact registered name of the agent."}}
TOOLS = [
    tool("registry__get_agent_model", "Return the model one registered agent runs on, by its exact name.", name_prop),
    tool("registry__list_agents", "List every registered agent's name. Use before other tools if unsure of a name.", {}),
    tool("registry__set_agent_model", "Switch a registered agent to a different model. Check it exists first.",
         {**name_prop, "model": {"type": "string", "enum": ["claude-opus", "claude-sonnet", "claude-haiku"]}}),
    tool("monitoring__get_status", "An agent's uptime, error rate and latency over the last 24 hours.", name_prop),
    tool("monitoring__list_alerts", "Open alerts for an agent, newest first, with severity and time raised.", name_prop),
    tool("monitoring__get_incident", "Full details of one incident by its id, including timeline and owner.",
         {"incident_id": {"type": "string", "description": "Incident id, like INC-2041."}}),
]

messages = [{"role": "user", "content": "Is research_agent healthy?"}]

report = measure_request(SYSTEM_PROMPT, TOOLS, messages, max_tokens=4_000, window=200_000)
for part, tokens in report["parts"].items():
    share = tokens / report["input_total"]
    print(f"{part:9} {tokens:>5} tokens  {share:>4.0%} of the input")
print(f"input total: {report['input_total']}, reply room: {report['reply_room']:,}, headroom: {report['headroom']:,}")
```
```
system       75 tokens   14% of the input
tools       439 tokens   83% of the input
messages     15 tokens    3% of the input
input total: 529, reply room: 4,000, headroom: 195,471
```
*(runs live, shows output — read-only demo snippet, not graded; the fake client's classes and `count_tokens` are already loaded)*

The user's actual question is 3% of what's being sent. Six tool definitions from two servers are 83%. This is typical of the first turn of an agent, and it's the kind of thing only a breakdown shows. Two consequences:

- **The fixed cost dominates early.** At the start of a task, the system prompt and tools are nearly the whole request. Trimming the conversation would save almost nothing; trimming the tool list would save a lot. [Module 3's allowlists](→ Module 3, connecting an agent to mcp servers lesson, when there are too many tools concept) were already a context-budget technique, and [Lesson 7](→ this module, just in time context and dynamic tool exposure lesson) goes further.
- **The picture changes as the loop runs.** Six hundred tokens of fixed cost is nothing against 200,000 of window. The scratchpad is 15 tokens now, and it's the only part that grows. [The next concept](→ this lesson, watching it grow across the loop concept) watches what happens to this breakdown after a dozen tool calls.

Real numbers would differ in the details: real tool definitions are usually longer than these, and a real tokenizer counts slightly differently from this helper. The shape is the point, and it holds.

---

## Quiz cards

> **Q1.** Why measure a request as a breakdown rather than a single total?
> - A) Model APIs require a breakdown with each request
> - B) A total says whether a request fits; a breakdown shows which part makes it that size, which is what you need to decide what to change ✅
> - C) Breakdowns use fewer tokens
> - D) The total can't be computed without the parts
>
> *Explanation:* Optimizing without a breakdown means guessing. The same total can come from a huge tool list or a long conversation, and the fixes are completely different.

> **Q2.** On the registry agent's first turn, tool definitions are 83% of the input. What would trimming the conversation achieve?
> - A) Almost nothing, since the conversation is 3% of the input at this point ✅
> - B) It would halve the request
> - C) It would remove the tool definitions too
> - D) It would make the request fit when it otherwise wouldn't
>
> *Explanation:* The breakdown shows where the tokens are. Early in a task that's the fixed cost, so that's where a change pays off.

> **Q3.** How is headroom calculated?
> - A) Window minus input
> - B) Window minus reply room
> - C) Window minus input minus reply room ✅
> - D) Input minus reply room
>
> *Explanation:* The reply's reserved room comes out of the same window as the input, so both are subtracted.

> **Q4.** Which part of the breakdown grows as the agent loop runs?
> - A) The system prompt
> - B) The tool definitions
> - C) The reply room
> - D) The messages, the scratchpad ✅
>
> *Explanation:* The system prompt and tools are a fixed cost per request. The scratchpad accumulates every turn, which is why the breakdown looks very different later in a task.

---

## Applied sandbox exercise

*(graded — a request breakdown with headroom)*

**Task shown to learner:** Implement `measure_request(system, tools, messages, max_tokens, window)`, using `count_tokens` (already loaded). Return a dict with:

- `parts`: `{"system": ..., "tools": ..., "messages": ...}`, the token count of each.
- `input_total`: the sum of the three parts.
- `reply_room`: `max_tokens`.
- `headroom`: `window` minus `input_total` minus `max_tokens`. It can be negative.
- `fits`: `True` when `headroom` is zero or more.
- `largest`: the name of the biggest part (`"system"`, `"tools"` or `"messages"`).

**Starter code:**
```python
def measure_request(system: str, tools: list, messages: list, max_tokens: int, window: int) -> dict:
    # TODO: count each part, total the input, and work out headroom, fits and the largest part
    ...
```

**Hidden tests:**
```python
system = "x" * 400                                   # 100 tokens
tools = [{"name": "t", "description": "d" * 800}]   # counted on its JSON form
messages = [{"role": "user", "content": "hi"}]

r = measure_request(system, tools, messages, max_tokens=1_000, window=10_000)

# 1. each part is counted with count_tokens, on the right piece
assert r["parts"] == {"system": count_tokens(system), "tools": count_tokens(tools), "messages": count_tokens(messages)}
assert r["parts"]["system"] == 100

# 2. input total is the sum of the parts; reply room is max_tokens
assert r["input_total"] == sum(r["parts"].values())
assert r["reply_room"] == 1_000

# 3. headroom is window minus input minus reply room, and fits follows from it
assert r["headroom"] == 10_000 - r["input_total"] - 1_000
assert r["fits"] is True

# 4. the largest part is named
assert r["largest"] == "tools"

# 5. a request that doesn't fit once reply room is counted: negative headroom, fits False
tight = measure_request("x" * 4_000, [], [], max_tokens=200, window=1_100)   # 1,000 + 2 + 1 input
assert tight["headroom"] < 0 and tight["fits"] is False

# 6. content blocks in the scratchpad are counted too
call = ToolUseBlock(name="list_agents", input={})
with_blocks = measure_request("", [], [{"role": "assistant", "content": [TextBlock(text="checking"), call]}], 0, 10_000)
assert with_blocks["parts"]["messages"] == count_tokens([{"role": "assistant", "content": [TextBlock(text="checking"), call]}])
assert with_blocks["parts"]["messages"] > 10
```

**Hint (shown on request):** Build `parts` first, then `sum(parts.values())`. For `largest`, `max(parts, key=parts.get)` finds the key with the biggest value: `max` over a dict looks at its keys, and `key=parts.get` tells it to compare them by their values.

**Reference solution:**
```python
def measure_request(system: str, tools: list, messages: list, max_tokens: int, window: int) -> dict:
    parts = {
        "system": count_tokens(system),
        "tools": count_tokens(tools),
        "messages": count_tokens(messages),
    }
    input_total = sum(parts.values())
    headroom = window - input_total - max_tokens
    largest = max(parts, key=parts.get)
    return {
        "parts": parts,
        "input_total": input_total,
        "reply_room": max_tokens,
        "headroom": headroom,
        "fits": headroom >= 0,
        "largest": largest,
    }
```

**Explanation:** Every later lesson in this module starts from this report. Test 3 checks the one calculation that's easy to get wrong, headroom subtracting the reply room as well as the input, and test 5 shows why: a request can be under the window on input alone and still not fit. Test 6 confirms content blocks in the scratchpad are counted like everything else, since in a real agent they're most of it.

---

*(End of Concept 2. This lesson continues with Concept 3 — watching it grow across the loop.)*
