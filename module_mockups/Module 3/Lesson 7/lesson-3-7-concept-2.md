# Module 3, Lesson 7 — Concept 2: Routing the model's calls inside the loop

> **Note for the site build:** this concept needs the fake LLM client's `create()` to accept a `tools` argument, as a real API call does, and record it. The extension below is backward compatible: every earlier exercise still calls `create(messages=...)` and works unchanged.
> ```python
> class ToolAwareClient(FakeLLMClient):
>     def __init__(self, scripted_responses):
>         super().__init__(scripted_responses)
>         self.seen = []
>         self.tools_seen = []
>     def create(self, messages, tools=None):
>         self.seen.append(list(messages))
>         self.tools_seen.append(tools)
>         return super().create(messages)
> ```

---

## The loop hasn't changed, only where the tools live

With a catalog built from the servers, [the previous concept's](→ this lesson, discovering tools from several servers concept) `tools_for_model` and `routes`, the agent loop needs only two changes from [Module 2's version](→ Module 2, react and reasoning in the loop lesson, the react pattern concept):

- **Offer the tools on every request.** The model can only call tools it's shown, so the catalog goes into every `create(...)` call, the same list each time.
- **Run each call through its route.** Instead of looking a function up in a local `TOOL_REGISTRY`, look the model-facing name up in `routes`, send `tools/call` to that server with the tool's *original* name, and turn the response into a `tool_result`.

Everything else is exactly as before: append the assistant's full content once, collect every `tool_use` block, send all the results back in one user message, stop when a response has no tool calls. The helpers from earlier concepts are already loaded:

```python
import re

def model_tool_name(label: str, tool_name: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_-]", "_", f"{label}__{tool_name}")

def build_tool_catalog(servers: dict) -> tuple:
    tools_for_model, routes = [], {}
    for label, client in servers.items():
        for tool in client.list_tools():
            name = model_tool_name(label, tool["name"])
            if len(name) > 64:
                continue
            tools_for_model.append({"name": name, "description": tool["description"], "input_schema": tool["inputSchema"]})
            routes[name] = (label, tool["name"])
    return tools_for_model, routes

def to_tool_output(response: dict) -> tuple:
    if "error" in response:
        error = response["error"]
        return (f"Error: MCP error {error['code']}: {error['message']}", True)
    result = response["result"]
    if result["resultType"] == "complete":
        text = "\n".join(item["text"] for item in result.get("content", []) if item["type"] == "text")
        return (text, result.get("isError", False))
    return (f"Error: unsupported resultType '{result['resultType']}'", True)
```
*(`build_tool_catalog` is the previous concept's solution; `to_tool_output` is from [Lesson 5's JSON-RPC exercise](→ this module, the model context protocol lesson, json rpc as the message format concept))*

---

## The routed loop

```python
def run_tool_call(call, servers: dict, routes: dict) -> dict:
    if call.name not in routes:
        # the model asked for a tool no server offered
        return {"type": "tool_result", "tool_use_id": call.id, "content": f"Error: there is no tool called {call.name}", "is_error": True}
    label, original_name = routes[call.name]
    response = servers[label].call_tool(original_name, call.input)
    text, is_error = to_tool_output(response)
    result = {"type": "tool_result", "tool_use_id": call.id, "content": text}
    if is_error:
        result["is_error"] = True
    return result

def run_agent(llm, user_message: str, servers: dict, max_steps: int = 10) -> str:
    tools, routes = build_tool_catalog(servers)
    messages = [{"role": "user", "content": user_message}]
    for step in range(max_steps):
        response = llm.create(messages=messages, tools=tools)
        messages.append({"role": "assistant", "content": response.content})
        tool_calls = [block for block in response.content if block.type == "tool_use"]
        if not tool_calls:
            return "".join(block.text for block in response.content if block.type == "text")
        messages.append({"role": "user", "content": [run_tool_call(call, servers, routes) for call in tool_calls]})
    return f"stopped after {max_steps} steps without a final answer"

servers = {"registry": InProcessClient(registry_server), "monitoring": InProcessClient(monitoring_server)}
llm = ToolAwareClient(scripted_responses=[
    [TextBlock(text="I'll check both."),
     ToolUseBlock(name="registry__get_status", input={"agent_name": "research_agent"}),
     ToolUseBlock(name="monitoring__get_status", input={"agent_name": "research_agent"})],
    [TextBlock(text="research_agent is registered and active, with 99.9% uptime over the last day.")],
])

print(run_agent(llm, "Is research_agent healthy?", servers))
print("tools offered to the model:", [t["name"] for t in llm.tools_seen[0]])
print("registry server received:", servers["registry"].calls)
print("monitoring server received:", servers["monitoring"].calls)
```
```
research_agent is registered and active, with 99.9% uptime over the last day.
tools offered to the model: ['registry__get_status', 'registry__get_agent_model', 'monitoring__get_status', 'monitoring__alerts_list']
registry server received: [('get_status', {'agent_name': 'research_agent'})]
monitoring server received: [('get_status', {'agent_name': 'research_agent'})]
```
*(runs live, shows output — read-only demo snippet, not graded; the fake client's classes are already defined, and the model's replies are scripted)*

One response, two tool calls, two servers. The model asked for `registry__get_status` and `monitoring__get_status`; each server received a call to its own `get_status` and nothing else. That's the routing table at work: the model thinks in prefixed names, and each server only ever hears its own.

`run_tool_call` is the only genuinely new function, and it's where the host translates between the two sides:

- **Look up the route.** If the model's name isn't in `routes`, no server offers that tool.
- **Call the right server with the original name,** using that server's own client, one per server, [as Lesson 5 described](→ this module, the model context protocol lesson, the integration problem and mcps three roles concept).
- **Turn the MCP response into a `tool_result`.** `to_tool_output` already handles every shape a response can take, and a failure gets `is_error`, [the same flag Lesson 4 used](→ this module, tools that call the outside world lesson, running independent tool calls concurrently concept).

---

## Three things that can go wrong

```python
servers = {"registry": InProcessClient(registry_server), "monitoring": InProcessClient(monitoring_server)}
tools, routes = build_tool_catalog(servers)

calls = [
    ToolUseBlock(name="monitoring__alerts_list", input={"agent_name": "support_agent"}),
    ToolUseBlock(name="registry__get_agent_model", input={"agent_name": "ghost_agent"}),
    ToolUseBlock(name="registry__delete_agent", input={"agent_name": "research_agent"}),
]
for call in calls:
    print(run_tool_call(call, servers, routes))
print("monitoring server received:", servers["monitoring"].calls)
```
```
{'type': 'tool_result', 'tool_use_id': 'toolu_fake_01', 'content': 'no open alerts for support_agent'}
{'type': 'tool_result', 'tool_use_id': 'toolu_fake_02', 'content': "No agent named 'ghost_agent'.", 'is_error': True}
{'type': 'tool_result', 'tool_use_id': 'toolu_fake_03', 'content': 'Error: there is no tool called registry__delete_agent', 'is_error': True}
monitoring server received: [('alerts.list', {'agent_name': 'support_agent'})]
```
*(runs live, shows output — read-only demo snippet, not graded)*

- **A cleaned-up name** routes back to the server's real one: the model called `monitoring__alerts_list`, and the monitoring server received `alerts.list`.
- **A tool error from the server** reaches the model with the server's own message and the error flag, so the model can try a different agent name.
- **A tool that doesn't exist.** Models occasionally invent a plausible tool name, like `registry__delete_agent`, especially for an action that *sounds* like it should exist. Here the call is answered as an error *without being sent to any server*, which is also a small safety property: the host never forwards a call for a tool it didn't offer.

---

## Running the calls concurrently

This loop runs each response's tool calls one after another, to keep the routing easy to follow. Real MCP clients are asynchronous, and the SDK's `call_tool` is `async`, so in a real host the calls in one response run together with `asyncio.gather`, exactly as in [Lesson 4's concurrent loop](→ this module, tools that call the outside world lesson, running independent tool calls concurrently concept). Routing doesn't change that at all: `run_tool_call` becomes `async`, and each call still goes to its own server.

---

## Quiz cards

> **Q1.** Why does the host pass the tool catalog on every `create(...)` call, not just the first?
> - A) The model API is stateless, so a request only has the tools included in it ✅
> - B) The catalog changes after every tool call
> - C) The first request is only for planning
> - D) Servers require it
>
> *Explanation:* Like the conversation itself, [the tools are resent every time](→ Module 1, calling llm apis and processing responses lesson, multi turn conversations and why the client resends everything concept). A request without them is a request where the model can't call anything.

> **Q2.** The model calls `registry__get_status` and `monitoring__get_status` in one response. What does each server receive?
> - A) Both calls, so each can decide which is its own
> - B) A single combined call
> - C) Each receives one `get_status` call, sent by its own client ✅
> - D) The prefixed names, which the servers strip themselves
>
> *Explanation:* The route tells the host which server and original name to use. Servers never see prefixes, or each other's calls.

> **Q3.** The model calls `registry__delete_agent`, which no server offers. What should the host do?
> - A) Send it to the registry server and let it reject the call
> - B) Answer it with an error `tool_result` without sending it to any server ✅
> - C) Stop the loop immediately
> - D) Ignore the call and send no result for it
>
> *Explanation:* The host knows exactly which tools it offered. Answering locally avoids a pointless request and means a server never receives a call for a tool it didn't list. Sending no result would break the rule that every call gets one.

> **Q4.** What changes in the loop's structure when tools move from a local registry to MCP servers?
> - A) The loop has to stop after every tool call
> - B) Tool results go back in separate messages, one per server
> - C) The assistant's content is appended once per server
> - D) Nothing structural: the tools come from the catalog and each call goes through its route, but the loop itself is the same ✅
>
> *Explanation:* Collect every call, answer them all in one message, stop when there are none. Where a tool runs doesn't change how the loop treats it.

> **Q5.** In a real host, how would calls to two servers in one response usually run?
> - A) Concurrently, with `asyncio.gather`, since the SDK's calls are asynchronous ✅
> - B) One at a time, since MCP forbids overlapping calls
> - C) Through a single shared client
> - D) Only the first call runs; the rest are retried later
>
> *Explanation:* Lesson 4's concurrency applies unchanged. Each call still goes through its own route to its own server.

---

## Applied sandbox exercise

*(graded — the routed agent loop)*

**Task shown to learner:** `build_tool_catalog`, `to_tool_output`, the two in-process servers and their clients, and the fake client's tool-aware version are provided. Implement:

- **`run_tool_call(call, servers, routes)`:** return one `tool_result` for a `tool_use` block. If `call.name` has no route, the result is an error saying there's no such tool, with `"is_error": True`, and nothing is sent to any server. Otherwise call the routed server's `call_tool` with the **original** tool name and the call's input, convert the response with `to_tool_output`, and add `"is_error": True` only if it failed.
- **`run_agent(llm, user_message, servers, max_steps)`:**
  - build the catalog once
  - call `llm.create(messages=messages, tools=tools)` each step
  - append the assistant's content once, and collect every `tool_use` block
  - return the text when there are none; otherwise send one user message holding every call's result
  - return a step-limit message if `max_steps` runs out

**Starter code:**
```python
def run_tool_call(call, servers: dict, routes: dict) -> dict:
    # TODO
    ...

def run_agent(llm, user_message: str, servers: dict, max_steps: int = 10) -> str:
    # TODO
    ...
```

**Hidden tests:**
```python
def fresh_servers():
    return {"registry": InProcessClient(registry_server), "monitoring": InProcessClient(monitoring_server)}

# 1. a text block, then two calls to two different servers in one response
servers = fresh_servers()
a = ToolUseBlock(name="registry__get_agent_model", input={"agent_name": "support_agent"})
b = ToolUseBlock(name="monitoring__alerts_list", input={"agent_name": "support_agent"})
llm = ToolAwareClient([[TextBlock(text="Checking."), a, b], [TextBlock(text="done")]])
assert run_agent(llm, "check support_agent", servers) == "done"
assert servers["registry"].calls == [("get_agent_model", {"agent_name": "support_agent"})]
assert servers["monitoring"].calls == [("alerts.list", {"agent_name": "support_agent"})]
results = llm.seen[1][-1]["content"]
assert [r["tool_use_id"] for r in results] == [a.id, b.id]
assert results[0]["content"] == "claude-haiku" and results[1]["content"] == "no open alerts for support_agent"

# 2. the model is offered every server's tools, with model-facing names, on every request
names = [t["name"] for t in llm.tools_seen[0]]
assert set(names) == {"registry__get_status", "registry__get_agent_model", "monitoring__get_status", "monitoring__alerts_list"}
assert llm.tools_seen[1] == llm.tools_seen[0]

# 3. a tool error from a server reaches the model flagged
servers = fresh_servers()
llm = ToolAwareClient([[ToolUseBlock(name="registry__get_status", input={"agent_name": "ghost_agent"})], [TextBlock(text="ok")]])
run_agent(llm, "x", servers)
r = llm.seen[1][-1]["content"][0]
assert r["is_error"] is True and "ghost_agent" in r["content"]

# 4. a made-up tool name is answered as an error and never sent to any server
servers = fresh_servers()
llm = ToolAwareClient([[ToolUseBlock(name="registry__delete_agent", input={"agent_name": "x"})], [TextBlock(text="ok")]])
run_agent(llm, "x", servers)
r = llm.seen[1][-1]["content"][0]
assert r["is_error"] is True and servers["registry"].calls == [] and servers["monitoring"].calls == []

# 5. a successful result carries no is_error flag
servers = fresh_servers()
llm = ToolAwareClient([[ToolUseBlock(name="monitoring__get_status", input={"agent_name": "research_agent"})], [TextBlock(text="ok")]])
run_agent(llm, "x", servers)
assert "is_error" not in llm.seen[1][-1]["content"][0]

# 6. max_steps still bounds the loop
servers = fresh_servers()
loop = [[ToolUseBlock(name="monitoring__get_status", input={"agent_name": f"a{i}"})] for i in range(5)]
llm = ToolAwareClient(loop)
out = run_agent(llm, "x", servers, max_steps=2)
assert llm.call_count == 2 and "2" in out
```

**Hint (shown on request):** `run_tool_call` is three steps: check `call.name in routes`, unpack `label, original_name = routes[call.name]`, then `servers[label].call_tool(original_name, call.input)`. `run_agent` is Module 2's collect-every-call loop, with `tools=tools` added to `create` and `run_tool_call` in place of the old registry lookup.

**Reference solution:**
```python
def run_tool_call(call, servers: dict, routes: dict) -> dict:
    if call.name not in routes:
        return {"type": "tool_result", "tool_use_id": call.id, "content": f"Error: there is no tool called {call.name}", "is_error": True}
    label, original_name = routes[call.name]
    response = servers[label].call_tool(original_name, call.input)
    text, is_error = to_tool_output(response)
    result = {"type": "tool_result", "tool_use_id": call.id, "content": text}
    if is_error:
        result["is_error"] = True
    return result

def run_agent(llm, user_message: str, servers: dict, max_steps: int = 10) -> str:
    tools, routes = build_tool_catalog(servers)
    messages = [{"role": "user", "content": user_message}]
    for step in range(max_steps):
        response = llm.create(messages=messages, tools=tools)
        messages.append({"role": "assistant", "content": response.content})
        tool_calls = [block for block in response.content if block.type == "tool_use"]
        if not tool_calls:
            return "".join(block.text for block in response.content if block.type == "text")
        messages.append({"role": "user", "content": [run_tool_call(call, servers, routes) for call in tool_calls]})
    return f"stopped after {max_steps} steps without a final answer"
```

**Explanation:** The tests cover both loop edge cases from Module 2 (a text block before the tool calls, and two calls in one response, here to two different servers), and check that each server received only its own call, under its original name. Test 2 checks the model was offered the full catalog on every request. Test 4 checks that an invented tool name is answered locally: neither server's call log gains an entry.

---

*(End of Concept 2. This lesson continues with Concept 3 — when there are too many tools.)*
