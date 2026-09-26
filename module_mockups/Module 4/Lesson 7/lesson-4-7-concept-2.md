# Module 4, Lesson 7 — Concept 2: Tools on demand

> **Note for the site build:** add `TYPES`, `check_arguments` and `ToolIndex` to this lesson's setup, after Concept 1's `CATALOG`. The exercise provides `make_tool`, `check_arguments` and `json` as read-only code.

---

## Two tools that never change

[The previous concept](→ this lesson, what you load and where it goes concept) found the cheapest place for a definition the agent needs later: in the conversation, as a tool result, with the tool list fixed. That raises a practical problem. On most APIs, the model can only call a tool that's in the tool list. A definition it read in a tool result isn't callable.

The model-agnostic answer is a tool list of exactly two tools:

- **`find_tools(query)`** searches the full catalog and returns the matching definitions, as text, in its result.
- **`call_tool(name, arguments)`** calls a tool from the catalog by name.

The prefix never changes, however many tools the agent ends up using. The catalog can hold hundreds.

## Searching the catalog

Search here is keyword matching: a tool scores one point for each word of the query that appears in its name or description. It's crude, and for a catalog of well-named tools with [descriptions written as prompts](→ Module 3, designing tools a model can use well lesson, names and descriptions as prompts concept) it works well. Searching by meaning instead of by words is Module 5's subject.

## Calling what was found

`call_tool` has three things to refuse before it runs anything: a tool that doesn't exist, a tool the model hasn't found yet, and arguments that don't fit the tool's schema. The second refusal makes the model load a definition before using it, so it's working from the real parameters rather than a guess.

The third is the real cost of this design. When a tool is in the tool list, the provider knows its schema, and many providers can enforce it on the model's output. Through `call_tool`, all the provider sees is a generic `arguments` object. So checking arguments against the schema becomes the loop's job, [as Module 3 taught for arguments in general](→ Module 3, tool schemas and argument validation lesson, validate and return failures as observations concept), with errors in the same style:

```python
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
```

This checker covers only the parts of JSON Schema these definitions use: required fields, known fields, and simple types. A real system would use a JSON Schema validator library, which handles the whole standard.

```python
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
```

```python
def stand_in(name):
    """A pretend implementation that reports what it was called with."""
    def run(**arguments):
        return f"{name} ran with {arguments}"
    return run

impls = {tool["name"]: stand_in(tool["name"]) for tool in CATALOG}
index = ToolIndex(CATALOG, impls)

found = json.loads(index.find_tools("monitoring get health"))
print("found:", [tool["name"] for tool in found])
print(index.call_tool("billing__get", {"id": "support_agent"}))
print(index.call_tool("monitoring__get", {"agent": "support_agent", "limit": "5"}))
print(index.call_tool("monitoring__get", {"id": "support_agent", "limit": 5}))
print(index.find_tools("kubernetes pods"))
```
```
found: ['monitoring__get', 'monitoring__list', 'monitoring__search']
Error: find billing__get with find_tools before calling it, so you have its parameters.
Error: invalid arguments for monitoring__get: id: required; agent: not a parameter of this tool; limit: should be integer
monitoring__get ran with {'id': 'support_agent', 'limit': 5}
No tools match 'kubernetes pods'. Try a service name or an action, such as get, list or update.
```
*(runs live, shows output — read-only demo snippet, not graded; the tool implementations are stand-ins)*

## In the loop

Here's a small task done both ways: through the index, and with all 40 definitions sent every turn and the tools called directly:

```python
SYSTEM = "You are the operations assistant. Find the tools you need with find_tools, then use them with call_tool."
FIND_TOOLS = {"name": "find_tools", "description": "Search the tool catalog by keywords. Returns up to 3 matching tool definitions.",
              "input_schema": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}}
CALL_TOOL = {"name": "call_tool", "description": "Call a tool you found with find_tools, by name, with arguments matching its input_schema.",
             "input_schema": {"type": "object", "properties": {"name": {"type": "string"}, "arguments": {"type": "object"}},
                              "required": ["name", "arguments"]}}

def stand_in(name):
    def run(**arguments):
        return f"{name}: " + "field: value, status ok\n" * 30
    return run

def run(steps, tools, handlers):
    llm = FakeLLMClient(steps)
    messages = [{"role": "user", "content": "support_agent is slow. Check its health, then raise its model tier."}]
    sent = 0
    while True:
        sent += count_tokens(tools) + count_tokens(SYSTEM) + count_tokens(messages)
        response = llm.create(messages=messages)
        messages.append({"role": "assistant", "content": response.content})
        calls = [b for b in response.content if b.type == "tool_use"]
        if not calls:
            return sent
        results = []
        for call in calls:
            output = handlers[call.name](**call.input)
            if call.name == "call_tool":
                print("  call_tool ->", output.split("\n")[0])
            results.append({"type": "tool_result", "tool_use_id": call.id, "content": output})
        messages.append({"role": "user", "content": results})

impls = {tool["name"]: stand_in(tool["name"]) for tool in CATALOG}
index = ToolIndex(CATALOG, impls)
done = [TextBlock(text="support_agent is healthy; its model tier is raised.")]
through_index = [
    [ToolUseBlock(name="find_tools", input={"query": "monitoring get"})],
    [ToolUseBlock(name="call_tool", input={"name": "monitoring__get", "arguments": {"agent_name": "support_agent"}})],
    [ToolUseBlock(name="call_tool", input={"name": "monitoring__get", "arguments": {"id": "support_agent"}})],
    [ToolUseBlock(name="find_tools", input={"query": "registry update"})],
    [ToolUseBlock(name="call_tool", input={"name": "registry__update", "arguments": {"id": "support_agent", "fields": ["tier"]}})],
    done]
print("through the index:")
sent_index = run(through_index, [FIND_TOOLS, CALL_TOOL],
                    {"find_tools": index.find_tools, "call_tool": index.call_tool})

# the same work with every definition sent every turn, and the calls made directly
direct = [[ToolUseBlock(name="monitoring__get", input={"id": "support_agent"})],
          [ToolUseBlock(name="registry__update", input={"id": "support_agent", "fields": ["tier"]})],
          done]
sent_all = run(direct, CATALOG, impls)
print(f"\ntokens sent: {sent_index:,} through the index ({len(through_index)} requests), "
      f"{sent_all:,} with all 40 tools ({len(direct)} requests)")
```
```
through the index:
  call_tool -> Error: invalid arguments for monitoring__get: id: required; agent_name: not a parameter of this tool
  call_tool -> monitoring__get: field: value, status ok
  call_tool -> registry__update: field: value, status ok

tokens sent: 6,406 through the index (6 requests), 18,930 with all 40 tools (3 requests)
```
*(runs live, shows output — read-only demo snippet, not graded; the model's calls are scripted, including its first, invalid one)*

The index took twice as many requests: two searches, plus a retry after an invalid call. It still sent about a third of the tokens, because each request carried two small definitions instead of forty large ones. On a longer task the gap grows: the searches happen once per tool, while the saving applies to every request.

The invalid call is scripted, but it's the realistic cost of this design. The model built its first call from a definition it had read as text, and the loop caught the mistake. The direct run didn't include one, but a real model can make the same mistake there too. The difference is that a provider which enforces schemas can stop it before the call is made.

## You don't always build this yourself

Several providers now search tools on their side, and when one does, it's usually the better choice. [Claude's tool search](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool), for example, works like this:

- **Tools you mark with `defer_loading`** stay out of the context until the model finds them.
- **The model searches** with a regular expression or with keywords, depending on the variant.
- **A found tool's definition goes into the conversation** at that point, not into the prefix.
- **The model then calls it directly,** as an ordinary tool with its real schema, rather than through a generic `call_tool`.
- **The docs report that tool search typically cuts definition tokens by over 85%.** They also describe returning your own search results, if you'd rather rank tools yourself.

OpenAI's API has a tool search feature as well. The design underneath is the one this concept built by hand: a fixed prefix, a search, and definitions loaded into the conversation when they're needed.

---

## Quiz cards

> **Q1.** Why does the model-agnostic design use a generic `call_tool` instead of letting the model call found tools directly?
> - A) On most APIs, only tools in the tool list are callable, and adding to that list would change the prefix ✅
> - B) Direct calls can't carry arguments
> - C) The model can't read tool names from a tool result
> - D) Generic calls are cheaper per token
>
> *Explanation:* The found definitions live in the conversation, where the model can read them but the API won't treat them as tools. `call_tool` is always in the list, so the prefix never changes.

> **Q2.** Why does `call_tool` refuse a tool the model hasn't found yet?
> - A) The tool's implementation isn't loaded until it's found
> - B) Finding a tool charges for it
> - C) It makes the model load the definition first, so it works from the real parameters instead of guessing ✅
> - D) The API rejects calls to unfound tools
>
> *Explanation:* A model might know a tool's name from the catalog's naming pattern and guess its arguments. The refusal sends it to `find_tools`, which puts the real schema in front of it.

> **Q3.** What does this design give up compared with tools in the tool list, and how does it make up for it?
> - A) Parallel calls; it runs calls one at a time
> - B) Caching; it resends definitions every turn
> - C) Tool results; it returns plain text instead
> - D) The provider's enforcement of each tool's schema, since the provider only sees a generic `arguments` object; the loop checks arguments itself ✅
>
> *Explanation:* That's the price of a fixed prefix without provider support. Module 3's rule applies: validate in code, and return what's wrong as an observation.

> **Q4.** The index run needed six requests and the direct run three. Why did the index still send about a third of the tokens?
> - A) The index compressed the tool results
> - B) Each request carried two small definitions instead of forty large ones, and that saving applies to every request ✅
> - C) The direct run sent its history twice
> - D) Searches are free
>
> *Explanation:* The searches cost one round trip per tool needed. The saving from a small tool list applies to every request, so it grows with the length of the task.

> **Q5.** How does Claude's tool search differ from the design built in this concept?
> - A) It sends every definition, but caches them
> - B) Found tools are called directly with their real schemas, and the definitions still go into the conversation, not the prefix ✅
> - C) It only works for fewer than 30 tools
> - D) It changes the tool list each time a tool is found
>
> *Explanation:* The shape is the same: a fixed prefix, a search, and definitions loaded into the conversation. Because the API has every definition, it can treat found tools as real tools.

---

## Applied sandbox exercise

*(graded — a searchable tool catalog)*

**Task shown to learner:** `check_arguments`, `make_tool` and `json` are provided. Complete `ToolIndex`:

- **`find_tools(query, limit=3)`:**
  - Lowercase the query and split it into words.
  - Score each tool by how many of those words appear in its lowercased name plus a space plus its description. Keep tools that score above zero.
  - Return the best `limit` definitions as a JSON list (`json.dumps`), highest score first. Tools with equal scores stay in catalog order.
  - Add each returned name to `self.found`, once, in the order first found.
  - If nothing scores, return `No tools match 'QUERY'. Try a service name or an action, such as get, list or update.`
- **`call_tool(name, arguments)`:**
  - A name not in the catalog returns `Error: there is no tool called NAME. Search for tools with find_tools.`
  - A name not in `self.found` returns `Error: find NAME with find_tools before calling it, so you have its parameters.`
  - If `check_arguments` finds problems, return `Error: invalid arguments for NAME: ` followed by the problems joined with `"; "`.
  - Otherwise return `self.impls[name](**arguments)`. Nothing runs when a call is refused.

**Provided code:** `TYPES` and `check_arguments` as shown in this concept, `make_tool` from the previous concept, and `json`.

**Starter code:**
```python
class ToolIndex:
    def __init__(self, catalog: list, impls: dict):
        self.definitions = {tool["name"]: tool for tool in catalog}
        self.impls = impls
        self.found = []

    def find_tools(self, query: str, limit: int = 3) -> str:
        # TODO: score each tool by how many query words appear in its name and description;
        #       return the best `limit` definitions as JSON, and remember their names
        ...

    def call_tool(self, name: str, arguments: dict) -> str:
        # TODO: refuse unknown tools, tools not found yet, and invalid arguments; otherwise run it
        ...
```

**Hidden tests:**
```python
ran = []
def stand_in(name):
    def run(**arguments):
        ran.append(name)
        return f"{name} ok"
    return run

catalog = [make_tool(s, a) for s in ["registry", "monitoring"] for a in ["get", "list", "update"]]
index = ToolIndex(catalog, {t["name"]: stand_in(t["name"]) for t in catalog})

# 1. search returns the matching definitions as JSON, best match first, at most `limit`
found = json.loads(index.find_tools("registry update"))
assert [t["name"] for t in found][0] == "registry__update" and len(found) == 3
assert found[0] == catalog[2]

# 2. ties keep catalog order, and `limit` is respected
assert [t["name"] for t in json.loads(index.find_tools("monitoring", limit=2))] == ["monitoring__get", "monitoring__list"]

# 3. what was found is remembered, once each, in the order first found
assert index.found == ["registry__update", "registry__get", "registry__list", "monitoring__get", "monitoring__list"]
index.find_tools("registry update")
assert index.found == ["registry__update", "registry__get", "registry__list", "monitoring__get", "monitoring__list"]

# 4. no match is a message, not an empty list, and records nothing
assert index.find_tools("kubernetes pods") == "No tools match 'kubernetes pods'. Try a service name or an action, such as get, list or update."

# 5. calling: unknown, not yet found, invalid arguments -- each refused, and nothing runs
ran.clear()
assert index.call_tool("slack__get", {"id": "x"}) == "Error: there is no tool called slack__get. Search for tools with find_tools."
assert index.call_tool("monitoring__update", {"id": "x"}) == "Error: find monitoring__update with find_tools before calling it, so you have its parameters."
assert index.call_tool("registry__get", {"limit": "5"}) == "Error: invalid arguments for registry__get: id: required; limit: should be integer"
assert ran == []

# 6. a valid call to a found tool runs
assert index.call_tool("registry__get", {"id": "support_agent", "limit": 5}) == "registry__get ok" and ran == ["registry__get"]

# 7. search matching is case-insensitive
assert json.loads(ToolIndex(catalog, {}).find_tools("REGISTRY Get"))[0]["name"] == "registry__get"
```

**Hint (shown on request):** Collect `(score, name)` pairs, then `sorted(pairs, key=lambda pair: pair[0], reverse=True)`. Python's sort is stable, so tools with equal scores keep the order they were collected in, which is catalog order. In `call_tool`, do the three checks in the order listed, returning as soon as one fails.

**Reference solution:**
```python
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
```

**Explanation:** Tests 1 and 2 check the ranking: best match first, ties in catalog order, and `limit` respected. Test 3 checks that `found` lists each tool once, however many searches return it. Test 5 checks all three refusals, and that none of them runs the tool. A version that skips the "not found yet" check lets the model call tools it has never seen the parameters of. Test 7 catches a search that isn't case-insensitive.

---

*(End of Concept 2.)*
