# Just-in-Time Context and Dynamic Tool Exposure

> **Note for the site build:** the comprehensive sandbox is multi-file, in the same shape as Lessons 4–6. The tests import `fake` and `tokens` as site-provided modules, with the same exports as before. They use `WindowedClient`, with a large window, because it accepts `tools=` and `system=`. `lib.py` is read-only and shown in full below. It collects this lesson's code with the Lesson 3 and 4 helpers it uses, and defines the three fixed tools. `agent.py` is the entry file.

## Intro

> **You'll be able to**
> - Explain why anything loaded partway through a run belongs in the conversation, not the prefix, and measure what the other placements cost
> - Give each stage of a task its own tools without changing the tool list, by gating calls in the dispatcher
> - Put a large tool catalog behind two fixed tools, and validate calls the provider can no longer check
> - Load instructions and reference material only when they're needed, from a library you control

**Why it matters**

An agent connected to a few real services can easily carry tens of thousands of tokens of tool definitions and runbooks on every request, almost all of them unused at any given step. [Lesson 1](→ this module, context as a budget lesson) measured it: on the first turn, tool definitions were most of the request. Loading only what's needed is the obvious fix, and done carelessly it's expensive. The tool list and system prompt are the start of every request, so changing them costs the cache everything after them, and removing a tool the history mentions confuses the model.

This lesson loads tools, instructions and reference material on demand while keeping the start of every request exactly the same, from the first turn to the last.

---

## Recap & Practice

### Comprehensive quiz

*(spans all three concepts, mixed order)*

> **Q1.** Why did appending tool definitions to the end of the tool list cost more than sending all 40 every turn?
> - A) The tool list comes first in every request, so each append changed everything after it, including the whole history ✅
> - B) Appended definitions are billed at a higher rate
> - C) The API reorders appended tools
> - D) Appending duplicates earlier definitions
>
> *Explanation:* Nothing was removed, but the prefix still changed at the tool list. Reprocessing a long history outweighed sending fewer definitions.

> **Q2.** What's the rule for anything loaded partway through a run?
> - A) Reload the whole prefix so it's consistent
> - B) The prefix is fixed for the run, so anything loaded later goes into the conversation ✅
> - C) Put it in the system prompt, where it's cached
> - D) Add it to the tool list, since tools are cached first
>
> *Explanation:* That covers tool definitions, instructions and reference material alike. Claude's tool search inserts found definitions in the conversation for the same reason.

> **Q3.** How can each stage of a task have its own tools without a per-stage tool list?
> - A) Rewrite the system prompt for each stage
> - B) Ask the model which stage it's in
> - C) Remove the tools a stage doesn't need, then add them back later
> - D) Keep the list fixed, and refuse calls outside the current stage in the dispatcher, with a message saying what's allowed ✅
>
> *Explanation:* The code owns the stage, and the model hears it in one line at the end of each request. OpenAI's `allowed_tools` is a provider-built version of the same idea.

> **Q4.** What does calling catalog tools through a generic `call_tool` give up, and how does the loop make up for it?
> - A) Caching; it resends definitions each turn
> - B) Parallel calls; it runs one call at a time
> - C) The provider's enforcement of each tool's schema; the loop validates the arguments itself ✅
> - D) Tool results; it returns plain text
>
> *Explanation:* The provider sees only a generic `arguments` object. Module 3's rule applies: check in code, and return the problems as an observation.

> **Q5.** Why does `call_tool` refuse a catalog tool the model hasn't found with `find_tools` yet?
> - A) The tool's code isn't loaded until then
> - B) It makes the model read the real definition first, instead of guessing the parameters ✅
> - C) The API rejects unfound tools
> - D) Finding a tool is what caches it
>
> *Explanation:* A model can guess a tool's name from the catalog's pattern. The refusal sends it to the actual schema.

> **Q6.** What are the three levels of progressive disclosure, and where does each live?
> - A) Tools, system prompt and messages, all in the prefix
> - B) An index in the prefix, then full text and deeper sections loaded into the conversation when needed ✅
> - C) Guides, notes and summaries, all in the store
> - D) Everything in the system prompt, cached in three blocks
>
> *Explanation:* The index is fixed for the run. A guide's text arrives as a tool result, so loading it never breaks the cache.

> **Q7.** Why must the guide library hold only guides you wrote or reviewed?
> - A) Unreviewed guides are too long
> - B) Guides can't be cleared from the history
> - C) The index would change if guides were added
> - D) Guides are tool results the agent is told to follow, which is an exception to the rule that tool results are data ✅
>
> *Explanation:* The exception is only safe for curated content. Names are looked up in the library, never used as paths, and nothing fetched from outside becomes a guide.

> **Q8.** In the sandbox, the on-demand run's prefix was about 26 times smaller, yet it cost only about 21% less. Why?
> - A) The fixed tools are billed at a premium
> - B) Guides are never cached
> - C) Caching discounted the large prefix of the send-everything run, and the on-demand run took more than twice as many requests ✅
> - D) The on-demand run's searches failed
>
> *Explanation:* Loading on demand trades round trips for tokens, and caching narrows the price gap. What's always gained is room in the window, and that's where the attention cost lives.

---

### Comprehensive sandbox

*(applied, multi-file — a fixed prefix with everything loaded on demand)*

**Task shown to learner:** The registry agent rolls back a failing release. It has a 40-tool catalog and four runbook-length guides, but its requests carry only three fixed tools and a system prompt ending in the guide index. `lib.py`, which is read-only, has this lesson's code: `ToolIndex`, `GuideLibrary`, `stage_line`, `check_arguments` and the three fixed tool definitions. Complete `agent.py`:

- **`build_system(base, library)`:** the base prompt, a blank line (`"\n\n"`), then `library.index()`.
- **`dispatch(call, stage, stage_tools, index, library)`:** answer one call with a tool result.
  - `find_tools` goes to `index.find_tools(**call.input)`, and `read_guide` to `library.read_guide(**call.input)`.
  - For `call_tool`, if the inner `name` is in the catalog but not in `stage_tools[stage]`, the content is `Error: NAME isn't available during STAGE. Tools you can use now: A, B.` Otherwise it's `index.call_tool(name, arguments)`, which handles unknown, not-yet-found and invalid calls.
  - Any other tool name gives `Error: there is no tool called NAME.`
  - The result is `{"type": "tool_result", "tool_use_id": call.id, "content": ...}`, with `"is_error": True` whenever the content starts with `"Error:"`.
- **`run_agent(llm, user_message, system, index, library, stage_tools, stage, advance, max_steps=20)`:** the canonical loop.
  - Every request has `tools=FIXED_TOOLS` and the same `system`.
  - The messages are the history with `stage_line(stage, stage_tools)` added at the end with `add_to_end`, never saved into the history.
  - After each round of results, `stage = advance(stage, history)`.
  - Return `(final_text, history, sent_requests)`.

**Tab: `lib.py`** (read-only)
```python
# everything from this lesson, plus the earlier pieces the sandbox uses -- read-only
import json
from tokens import count_tokens, _plain

def is_tool_results(message: dict) -> bool:
    """A user message that answers tool calls. It may also carry text added after the results."""
    return (message["role"] == "user" and isinstance(message["content"], list)
            and any(_plain(b)["type"] == "tool_result" for b in message["content"]))

def check_pairing(messages: list) -> list:
    """The two pairing rules the API enforces, as a list of problems. Empty means the history is valid."""
    problems = []
    for i in range(len(messages)):
        message = messages[i]
        blocks = [_plain(b) for b in message["content"]] if isinstance(message["content"], list) else []
        if message["role"] == "assistant":
            call_ids = [b["id"] for b in blocks if b["type"] == "tool_use"]
            answered = []
            if i + 1 < len(messages) and is_tool_results(messages[i + 1]):
                answered = [_plain(b)["tool_use_id"] for b in messages[i + 1]["content"] if _plain(b)["type"] == "tool_result"]
            missing = [c for c in call_ids if c not in answered]
            if missing:
                problems.append(f"messages.{i}: tool_use without a tool_result immediately after: {missing}")
        if message["role"] == "user":
            result_ids = [b["tool_use_id"] for b in blocks if b["type"] == "tool_result"]
            called = []
            if i > 0 and messages[i - 1]["role"] == "assistant":
                called = [_plain(b)["id"] for b in messages[i - 1]["content"] if _plain(b)["type"] == "tool_use"]
            unknown = [r for r in result_ids if r not in called]
            if unknown:
                problems.append(f"messages.{i}: tool_result with no tool_use in the previous message: {unknown}")
    return problems

def add_to_end(messages: list, text: str) -> list:
    last = messages[-1]
    if isinstance(last["content"], str):
        new_last = {**last, "content": last["content"] + "\n\n" + text}
    else:
        new_last = {**last, "content": last["content"] + [{"type": "text", "text": text}]}
    return messages[:-1] + [new_last]

SERVERS = {"registry": "agent records", "monitoring": "health checks and alerts", "billing": "usage and invoices",
           "deploy": "releases and rollbacks", "tickets": "support tickets", "github": "code and pull requests",
           "slack": "team messages", "calendar": "schedules"}
ACTIONS = ["list", "get", "search", "update", "delete"]

def make_tool(server: str, action: str) -> dict:
    """A tool definition about as detailed as a real one."""
    what = SERVERS[server]
    return {
        "name": f"{server}__{action}",
        "description": (f"{action.capitalize()} {what} in the {server} service. Use this when the task needs to "
                        f"{action} {what}; for other services use their own tools. Returns JSON. "
                        f"Fails with a clear error if the item doesn't exist or you lack permission."),
        "input_schema": {"type": "object",
                         "properties": {"id": {"type": "string", "description": f"The {server} item id."},
                                        "fields": {"type": "array", "items": {"type": "string"},
                                                   "description": "Which fields to return or change."},
                                        "limit": {"type": "integer", "description": "Maximum items to return."}},
                         "required": ["id"]},
    }

CATALOG = [make_tool(server, action) for server in SERVERS for action in ACTIONS]

TYPES = {"string": str, "integer": int, "boolean": bool, "array": list, "object": dict}

def check_arguments(arguments: dict, schema: dict) -> list:
    """Problems with `arguments`, checked against the parts of JSON Schema these tools use."""
    problems = []
    properties = schema.get("properties", {})
    for name in schema.get("required", []):
        if name not in arguments:
            problems.append(f"{name}: required")
    for name, value in arguments.items():
        if name not in properties:
            problems.append(f"{name}: not a parameter of this tool")
            continue
        expected = properties[name]["type"]
        # True and False are ints to isinstance, so an integer check has to rule them out
        if not isinstance(value, TYPES[expected]) or (expected == "integer" and isinstance(value, bool)):
            problems.append(f"{name}: should be {expected}")
    return problems

class ToolIndex:
    """A catalog the agent searches and calls through two fixed tools, instead of seeing every definition."""
    def __init__(self, catalog: list, impls: dict):
        self.definitions = {tool["name"]: tool for tool in catalog}
        self.impls = impls
        self.found = []

    def find_tools(self, query: str, limit: int = 3) -> str:
        words = query.lower().split()
        scored = []
        for tool in self.definitions.values():
            text = (tool["name"] + " " + tool["description"]).lower()
            score = len([word for word in words if word in text])
            if score:
                scored.append((score, tool["name"]))
        # sorting is stable, so tools with the same score keep their catalog order
        best = [name for score, name in sorted(scored, key=lambda pair: pair[0], reverse=True)[:limit]]
        if not best:
            return f"No tools match '{query}'. Try a service name or an action, such as get, list or update."
        for name in best:
            if name not in self.found:
                self.found.append(name)
        return json.dumps([self.definitions[name] for name in best])

    def call_tool(self, name: str, arguments: dict) -> str:
        if name not in self.definitions:
            return f"Error: there is no tool called {name}. Search for tools with find_tools."
        if name not in self.found:
            return f"Error: find {name} with find_tools before calling it, so you have its parameters."
        problems = check_arguments(arguments, self.definitions[name]["input_schema"])
        if problems:
            return f"Error: invalid arguments for {name}: {'; '.join(problems)}"
        return self.impls[name](**arguments)

def stage_line(stage: str, stage_tools: dict) -> str:
    return f"Stage: {stage}. Tools you can use now: {', '.join(stage_tools[stage])}."

def gated_dispatch(call, stage: str, stage_tools: dict, impls: dict) -> dict:
    """Run a call the current stage allows; answer anything else with an error the model can act on."""
    allowed = stage_tools[stage]
    if call.name not in impls:
        content, failed = f"Error: there is no tool called {call.name}.", True
    elif call.name not in allowed:
        content, failed = f"Error: {call.name} isn't available during {stage}. Tools you can use now: {', '.join(allowed)}.", True
    else:
        content, failed = impls[call.name](**call.input), False
    result = {"type": "tool_result", "tool_use_id": call.id, "content": content}
    if failed:
        result["is_error"] = True
    return result

class GuideLibrary:
    """Instructions and reference material: a short index up front, the full text only when asked for."""
    def __init__(self, guides: dict):
        self.guides = guides

    def index(self) -> str:
        lines = [f"- {name}: {guide['summary']}" for name, guide in self.guides.items()]
        return "Guides you can read with read_guide(name):\n" + "\n".join(lines)

    def read_guide(self, name: str, section: str = "") -> str:
        if name not in self.guides:
            return f"Error: no guide called {name}. Guides: {', '.join(self.guides)}."
        guide = self.guides[name]
        sections = guide.get("sections", {})
        if not section:
            text = guide["body"]
            if sections:
                text += f"\n\nMore detail is in sections: {', '.join(sections)}. Read one with read_guide(name, section)."
            return text
        if section not in sections:
            return f"Error: {name} has no section called {section}. Sections: {', '.join(sections) or 'none'}."
        return sections[section]


def serialize(x) -> str:
    # byte-for-byte form, as a cache sees it: key order matters, exactly as sent
    return json.dumps(_plain(x))

def first_divergence(previous: dict, current: dict) -> dict:
    """Where does `current` stop matching `previous`, and how much of it could be read from the cache?"""
    reusable = 0
    if serialize(current["tools"]) != serialize(previous["tools"]):
        return {"diverges_at": "tools", "reusable_tokens": 0}
    reusable += count_tokens(current["tools"])
    if serialize(current["system"]) != serialize(previous["system"]):
        return {"diverges_at": "system", "reusable_tokens": reusable}
    reusable += count_tokens(current["system"])
    for i, old in enumerate(previous["messages"]):
        if i >= len(current["messages"]) or serialize(current["messages"][i]) != serialize(old):
            return {"diverges_at": f"messages[{i}]", "reusable_tokens": reusable}
        reusable += count_tokens(old)
    return {"diverges_at": None, "reusable_tokens": reusable}

def cost_of_run(requests: list, read_multiplier: float, write_multiplier: float) -> int:
    """Cost of the requests actually sent, using first_divergence to see what each could reuse."""
    total = 0.0
    previous = None
    for request in requests:
        size = count_tokens(request["tools"]) + count_tokens(request["system"]) + count_tokens(request["messages"])
        reused = first_divergence(previous, request)["reusable_tokens"] if previous else 0
        total += reused * read_multiplier + (size - reused) * write_multiplier
        previous = request
    return round(total)

FIND_TOOLS = {"name": "find_tools", "description": "Search the tool catalog by keywords. Returns up to 3 matching tool definitions.",
              "input_schema": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}}
CALL_TOOL = {"name": "call_tool", "description": "Call a tool you found with find_tools, by name, with arguments matching its input_schema.",
             "input_schema": {"type": "object", "properties": {"name": {"type": "string"}, "arguments": {"type": "object"}},
                              "required": ["name", "arguments"]}}
READ_GUIDE = {"name": "read_guide", "description": "Read a guide from the index in your instructions, or one of its sections.",
              "input_schema": {"type": "object", "properties": {"name": {"type": "string"}, "section": {"type": "string"}},
                               "required": ["name"]}}
FIXED_TOOLS = [FIND_TOOLS, CALL_TOOL, READ_GUIDE]
```

**Tab: `agent.py`** (starter, entry file)
```python
from tokens import count_tokens
from lib import FIXED_TOOLS, stage_line, add_to_end

def build_system(base: str, library) -> str:
    # TODO: the base prompt, a blank line, then the guide index
    ...

def dispatch(call, stage: str, stage_tools: dict, index, library) -> dict:
    # TODO: find_tools and read_guide go straight to the index and the library;
    #       call_tool is gated by stage for catalog tools, then passed to the index;
    #       anything else is an unknown tool. Mark results that start with "Error:".
    ...

def run_agent(llm, user_message: str, system: str, index, library, stage_tools: dict, stage: str, advance, max_steps: int = 20):
    # TODO: the canonical loop with a fixed prefix; the stage line goes at the end of each request,
    #       never into the history; after each round, stage = advance(stage, history)
    ...
```

**Hidden tests:**
```python
from fake import *
from tokens import count_tokens, _plain
from lib import (CATALOG, ToolIndex, GuideLibrary, FIXED_TOOLS, check_pairing, first_divergence, cost_of_run)
from agent import build_system, dispatch, run_agent
import json

ran = []
def stand_in(name):
    def run(**arguments):
        ran.append(name)
        return f"{name}: " + "field: value, status ok\n" * 30
    return run

def runbook(topic, steps):
    lines = [f"How to handle {topic}."]
    for step in steps * 6:
        lines.append(f"{len(lines)}. {step}. Check the result before moving on.")
    return "\n".join(lines)

GUIDES = {"rollback": {"summary": "undo a bad release of an agent", "body": runbook("a rollback", ["find the last good release", "redeploy it"])},
          "incident": {"summary": "run an incident", "body": runbook("an incident", ["acknowledge the page", "post updates"])},
          "deploy": {"summary": "release a new version", "body": runbook("a deploy", ["run the checks", "roll out"])},
          "access": {"summary": "grant or remove access", "body": runbook("an access request", ["check the approver", "grant the role"])}}
STAGES = {"research": ["registry__get", "deploy__get", "monitoring__get"],
          "act": ["registry__get", "deploy__get", "monitoring__get", "deploy__update"]}
BASE = "You are the operations assistant. Guides are written by the operations team; follow them."
TASK = "research_agent's latest release is failing. Roll it back."

def advance(stage, history):
    """Move to the act stage once a registry read has succeeded."""
    last = history[-1]["content"]
    if stage == "research" and any(not r.get("is_error") and r["content"].startswith("registry__get") for r in last):
        return "act"
    return stage

def script():
    return [
        [ToolUseBlock(name="read_guide", input={"name": "rollback"})],
        [ToolUseBlock(name="find_tools", input={"query": "registry get"})],
        [ToolUseBlock(name="call_tool", input={"name": "deploy__update", "arguments": {"id": "research_agent"}})],
        [ToolUseBlock(name="call_tool", input={"name": "registry__get", "arguments": {"id": "research_agent"}})],
        [ToolUseBlock(name="call_tool", input={"name": "deploy__update", "arguments": {"id": "research_agent"}})],
        [ToolUseBlock(name="find_tools", input={"query": "deploy update release"})],
        [ToolUseBlock(name="call_tool", input={"name": "deploy__update", "arguments": {"id": "research_agent", "fields": "release"}})],
        [ToolUseBlock(name="call_tool", input={"name": "deploy__update", "arguments": {"id": "research_agent", "fields": ["release"]}})],
        [ToolUseBlock(name="find_tools", input={"query": "monitoring get"})],
        [ToolUseBlock(name="call_tool", input={"name": "monitoring__get", "arguments": {"id": "research_agent"}})],
        [ToolUseBlock(name="call_tool", input={"name": "monitoring__get", "arguments": {"id": "search_agent"}})],
        [ToolUseBlock(name="call_tool", input={"name": "monitoring__get", "arguments": {"id": "support_agent"}})],
        [TextBlock(text="research_agent is back on its last good release.")],
    ]

def total(requests):
    return sum(count_tokens(r["tools"]) + count_tokens(r["system"]) + count_tokens(r["messages"]) for r in requests)

# before: every tool definition and every guide in every request, with the same work done by direct calls
everything = BASE + "\n\n" + "\n\n".join(g["body"] for g in GUIDES.values())
before, history_b = [], [{"role": "user", "content": TASK}]
for name, arguments in [("registry__get", {"id": "research_agent"}), ("deploy__update", {"id": "research_agent", "fields": ["release"]}),
                        ("monitoring__get", {"id": "research_agent"}), ("monitoring__get", {"id": "search_agent"}),
                        ("monitoring__get", {"id": "support_agent"})]:
    before.append({"tools": CATALOG, "system": everything, "messages": history_b})
    call = ToolUseBlock(name=name, input=arguments)
    history_b = history_b + [{"role": "assistant", "content": [call]},
                             {"role": "user", "content": [{"type": "tool_result", "tool_use_id": call.id, "content": stand_in(name)(**arguments)}]}]
before.append({"tools": CATALOG, "system": everything, "messages": history_b})

# after: the fixed prefix, with tools and guides loaded on demand
ran.clear()
index = ToolIndex(CATALOG, {t["name"]: stand_in(t["name"]) for t in CATALOG})
library = GuideLibrary(GUIDES)
system = build_system(BASE, library)
answer, history, sent = run_agent(WindowedClient(script(), window=100_000), TASK, system, index, library, STAGES, "research", advance)
results = [b for m in history if m["role"] == "user" and isinstance(m["content"], list) for b in m["content"]]

# 1. the run completes; each request's prefix is a small fraction of sending everything, and the run costs less,
#    though it takes more than twice as many requests
assert answer == "research_agent is back on its last good release."
assert len(sent) == 13 and len(before) == 6
assert count_tokens(FIXED_TOOLS) + count_tokens(system) < 0.1 * (count_tokens(CATALOG) + count_tokens(everything))
assert total(sent) < 0.7 * total(before)
assert cost_of_run(sent, 0.1, 1.25) < cost_of_run(before, 0.1, 1.25)

# 2. the prefix is identical in every request: the three fixed tools, and a system prompt ending in the guide index
for r in sent:
    assert r["tools"] == FIXED_TOOLS and r["system"] == system
    assert system == BASE + "\n\n" + library.index()
for a, b in zip(sent, sent[1:]):
    assert first_divergence(a, b)["diverges_at"] not in ("tools", "system")

# 3. every request is valid, and ends with the current stage; the stage line is never saved into the history
def last_line(request):
    content = request["messages"][-1]["content"]
    text = content if isinstance(content, str) else content[-1]["text"]
    return text.split("\n")[-1]

for r in sent:
    assert check_pairing(r["messages"]) == []
    assert last_line(r).startswith("Stage: ")
assert "Stage: " not in json.dumps(_plain(history))
assert last_line(sent[2]).startswith("Stage: research.") and last_line(sent[4]).startswith("Stage: act.")

# 4. stage gating: the update was refused during research without running, and allowed in act
assert results[2]["content"].startswith("Error: deploy__update isn't available during research.") and results[2]["is_error"]
assert ran[:2] == ["registry__get", "deploy__update"]

# 5. the index's own refusals come through, marked as errors: not found yet, then invalid arguments
assert results[4]["content"].startswith("Error: find deploy__update with find_tools") and results[4]["is_error"]
assert results[6]["content"] == "Error: invalid arguments for deploy__update: fields: should be array" and results[6]["is_error"]

# 6. a guide and search results come back as ordinary results, not errors
assert results[0]["content"].startswith("How to handle a rollback.") and not results[0].get("is_error")
assert json.loads(results[1]["content"])[0]["name"] == "registry__get"

# 7. dispatch on its own: unknown fixed tools, and unknown catalog tools, are errors; nothing runs
ran.clear()
unknown = dispatch(ToolUseBlock(name="registry__get", input={}), "act", STAGES, index, library)
assert unknown == {"type": "tool_result", "tool_use_id": unknown["tool_use_id"], "is_error": True,
                   "content": "Error: there is no tool called registry__get."}
missing = dispatch(ToolUseBlock(name="call_tool", input={"name": "slack__post", "arguments": {}}), "act", STAGES, index, library)
assert missing["content"].startswith("Error: there is no tool called slack__post.") and ran == []

# 8. a path-like guide name is just an unknown guide
bad = dispatch(ToolUseBlock(name="read_guide", input={"name": "../../config/secrets"}), "research", STAGES, index, library)
assert bad["content"].startswith("Error: no guide called ../../config/secrets.") and bad["is_error"]
```

**Hint (shown on request):** The stage line goes in exactly the way [Lesson 2's plan did](→ this module, context that fits but still hurts lesson, re-anchoring the goal concept): added to the copy that's sent, never to the history. In `dispatch`, check "is this a catalog tool" before "is it allowed now". An unknown name should get the index's "no tool called" message, not a stage error that suggests it exists.

**Reference solution — `agent.py`:**
```python
from tokens import count_tokens
from lib import FIXED_TOOLS, stage_line, add_to_end

def build_system(base: str, library) -> str:
    """The system prompt: fixed for the whole run, with the guide index at the end."""
    return base + "\n\n" + library.index()

def dispatch(call, stage: str, stage_tools: dict, index, library) -> dict:
    """Answer one call to a fixed tool. Catalog tools, reached through call_tool, are gated by stage."""
    if call.name == "find_tools":
        content = index.find_tools(**call.input)
    elif call.name == "read_guide":
        content = library.read_guide(**call.input)
    elif call.name == "call_tool":
        name = call.input["name"]
        allowed = stage_tools[stage]
        if name in index.definitions and name not in allowed:
            content = f"Error: {name} isn't available during {stage}. Tools you can use now: {', '.join(allowed)}."
        else:
            content = index.call_tool(name, call.input.get("arguments", {}))
    else:
        content = f"Error: there is no tool called {call.name}."
    result = {"type": "tool_result", "tool_use_id": call.id, "content": content}
    if content.startswith("Error:"):
        result["is_error"] = True
    return result

def run_agent(llm, user_message: str, system: str, index, library, stage_tools: dict, stage: str, advance, max_steps: int = 20):
    """The canonical loop with a fixed prefix. advance(stage, history) returns the stage for the next request."""
    history = [{"role": "user", "content": user_message}]
    sent = []
    for step in range(max_steps):
        # the stage is restated at the end of each request, and never saved into the history
        request = {"tools": FIXED_TOOLS, "system": system,
                   "messages": add_to_end(history, stage_line(stage, stage_tools))}
        sent.append(request)
        response = llm.create(messages=request["messages"], tools=request["tools"], system=request["system"])
        history.append({"role": "assistant", "content": response.content})
        calls = [b for b in response.content if b.type == "tool_use"]
        if not calls:
            return "".join(b.text for b in response.content if b.type == "text"), history, sent
        history.append({"role": "user", "content": [dispatch(c, stage, stage_tools, index, library) for c in calls]})
        stage = advance(stage, history)
    return f"stopped after {max_steps} steps without a final answer", history, sent
```

**Explanation:** Each test checks one idea from the lesson:

- **The prefix is fixed:** every request has the same three tools and the same system prompt, ending in the guide index, and no request differs from the one before at the tools or the system prompt (test 2).
- **Stages are gated in the dispatcher, not the tool list:** the update is refused during research without running, then allowed in act. The stage line ends every request and never reaches the history (tests 3 and 4).
- **The index and library do their jobs through the dispatcher:** found definitions and guides come back as ordinary results, and not-yet-found, invalid, unknown and path-like requests come back as errors (tests 5–8).
- **What it saved** (test 1). Each request's prefix is about 26 times smaller: 257 tokens against 6,723. Over the whole run, 39% fewer tokens were sent. Measured with Lesson 3's cache model, though, the run cost only about 21% less. Caching made the send-everything run's large prefix cheap to resend, and the on-demand run took 13 requests to its 6: searches, a guide, and retries after three refused calls.

That last result is worth keeping in mind. Loading on demand trades round trips for tokens, and how much it saves in money depends on the task: [the first concept's](→ this lesson, what you load and where it goes concept) run saved about 40% and [the third's](→ this lesson, instructions and reference material on demand concept) about 62%. What it always gains is room in the window, and a prefix that never has to change. The room matters most for the cost this sandbox can't measure: what a model does worse when its context is full of material it doesn't need.
