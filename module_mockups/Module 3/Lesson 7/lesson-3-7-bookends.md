# Connecting an Agent to MCP Servers

## Intro

> **You'll be able to**
> - Build a host's tool catalog from several MCP servers, with prefixed, model-safe names that can't collide
> - Keep a routing table that sends each of the model's calls to the right server, under the tool's original name
> - Run MCP tools inside the agent loop, answering invented tool names locally and passing server failures to the model
> - Explain why too many tools cost tokens on every request and make tool choice worse
> - Limit an agent to the servers and tools its job needs with an allowlist

**Why it matters**

This is where the last three lessons meet. [Lesson 5](→ this module, the model context protocol lesson) described the protocol, [Lesson 6](→ this module, building an mcp server lesson) built a server, and this lesson connects the registry agent from [Module 2's loop](→ Module 2, react and reasoning in the loop lesson) to servers it didn't write and doesn't control.

That shift changes what the host is responsible for. When every tool lived in your own `TOOL_REGISTRY`, you knew every name, every description and every behavior. With MCP, tools arrive from outside: names that clash, names the model API won't accept, more tools than any task needs. The host's job is to turn all of that into a small, clean, well-routed list for the model, and to be the one place that decides which of those tools this agent may use at all.

---

## Recap & Practice

### Comprehensive quiz

*(spans all three concepts, mixed order)*

> **Q1.** Two connected servers both offer a tool called `get_status`. What should the host do?
> - A) Keep whichever server was connected first
> - B) Prefix each with the host's own label for its server, so both stay available and distinguishable ✅
> - C) Ask the servers to rename one of them
> - D) Merge them into one tool
>
> *Explanation:* The spec says a host combining tools from several servers should prefix them with a server identifier, and that the prefix should come from the host's own configuration, since server names aren't guaranteed unique.

> **Q2.** The model calls `monitoring__alerts_list`. What does the monitoring server receive?
> - A) A call to `monitoring__alerts_list`
> - B) A call to `alerts_list`
> - C) A call to `alerts.list`, its own original name, found through the route ✅
> - D) Nothing; dotted names can't be called
>
> *Explanation:* The model-facing name was cleaned for the model API. The route keeps the original, which is the only name the server knows.

> **Q3.** Why must the tool catalog be sent with every request to the model?
> - A) The servers expire their tools after each request
> - B) The first request only accepts a system prompt
> - C) The model API is stateless, so each request carries only the tools included in it ✅
> - D) So the model can change the tools' descriptions
>
> *Explanation:* Like the conversation itself, the tools are part of every request's input. A request without them is one where the model can't call anything.

> **Q4.** The model calls a tool name that no server offered. What should the host do?
> - A) Send it to every server in case one knows it
> - B) Skip it, sending no result for that call
> - C) Stop the loop with an error
> - D) Answer it with an error `tool_result` without contacting any server ✅
>
> *Explanation:* The host knows exactly what it offered. Every call must get a result, and a call for a tool that wasn't offered shouldn't reach any server.

> **Q5.** According to Anthropic's documentation, what happens as an agent is given more and more tools?
> - A) Tool selection gets more accurate, since the model has more options
> - B) Beyond roughly 30 to 50 tools, the model gets noticeably worse at choosing the right one ✅
> - C) Nothing changes until the context window is full
> - D) The model refuses to use any tools
>
> *Explanation:* More tools also means more tokens on every request. The most common failures are choosing the wrong tool and passing incorrect parameters, especially among similarly named tools.

> **Q6.** An agent's allowlist includes only `get_agent_model` from the registry server. The model calls `registry__delete_agent`. What happens?
> - A) The host answers it as an unknown tool, and the registry server never hears of it ✅
> - B) The registry server deletes the agent, since it's connected
> - C) The registry server rejects it with a protocol error
> - D) The host adds `delete_agent` to the catalog for the next request
>
> *Explanation:* Only allowed tools get routes. That's what makes an allowlist a limit on what the agent can do, not just a shorter list.

> **Q7.** What stays the same in the agent loop when its tools move from a local registry to MCP servers?
> - A) The tool names the model sees
> - B) Where the tool code runs
> - C) The loop's structure: append the assistant's content once, answer every call in one message, stop when there are none ✅
> - D) Nothing; the loop has to be rewritten
>
> *Explanation:* Only two things change: the tool list comes from the catalog, and each call runs through its route.

> **Q8.** Prompt caching makes a long, stable tool list cheaper on repeated requests. Why is a shorter list still better?
> - A) Cached tools can't be called
> - B) Caching only works with one server
> - C) Caching makes each token more expensive
> - D) The definitions still take up the context window, and a long list still makes the right tool harder to pick ✅
>
> *Explanation:* Caching lowers the price of repeated input. It doesn't shorten the list the model has to choose from.

---

### Comprehensive sandbox

*(applied, multi-file — the registry agent, connected to three MCP servers)*

**Task shown to learner:** The registry agent is connected to three in-process MCP servers in `servers.py`, which is read-only:

- **registry:** `get_agent_model`, `set_agent_model` and `delete_agent`
- **monitoring:** `get_status` and `alerts.list`
- **calendar:** `list_meetings`, which this agent has no use for

This agent's job is to check on agents and change their models, never to delete them. Complete `host.py`:

- **`build_tool_catalog(servers, allowed)`:**
  - skip any server not in `allowed`, without listing its tools
  - keep only each server's allowed tools; `"*"` means all of them
  - give each a prefixed, cleaned name via `model_tool_name`, and store its `inputSchema` as `input_schema`
  - route each model-facing name to `(label, original_name)`, and leave out names over 64 characters
- **`run_tool_call(call, servers, routes)`:**
  - answer a call with no route as an error `tool_result`, without contacting any server
  - otherwise call the routed server with the original name, convert the response with `to_tool_output`, and add `"is_error": True` only on failure
- **`run_agent(llm, user_message, servers, allowed, max_steps)`:**
  - build the catalog once, and pass it as `tools=` on every `llm.create(...)`
  - append the assistant's content once, and answer every `tool_use` block in one user message
  - return the text when there are no calls; return a step-limit message if `max_steps` runs out

The tests use `ALLOWED = {"registry": {"get_agent_model", "set_agent_model"}, "monitoring": "*"}`.

**Tab: `servers.py`** (read-only)
```python
# in-process stand-ins for MCP servers and clients, shared by every demo in this lesson
class InProcessServer:
    def __init__(self, tools: dict):
        # tools maps a tool name to (function, description, input_schema)
        self.tools = tools

    def handle(self, request: dict) -> dict:
        request_id = request["id"]
        if request["method"] == "tools/list":
            listed = [{"name": name, "description": description, "inputSchema": schema}
                      for name, (function, description, schema) in self.tools.items()]
            return {"jsonrpc": "2.0", "id": request_id, "result": {"resultType": "complete", "tools": listed}}
        if request["method"] == "tools/call":
            name = request["params"]["name"]
            if name not in self.tools:
                return {"jsonrpc": "2.0", "id": request_id, "error": {"code": -32602, "message": f"Unknown tool: {name}"}}
            function = self.tools[name][0]
            try:
                text, is_error = function(**request["params"].get("arguments", {})), False
            except ValueError as e:
                text, is_error = str(e), True
            return {"jsonrpc": "2.0", "id": request_id,
                    "result": {"resultType": "complete", "content": [{"type": "text", "text": text}], "isError": is_error}}
        return {"jsonrpc": "2.0", "id": request_id, "error": {"code": -32601, "message": "Method not found"}}

class InProcessClient:
    """One client per server, as in Lesson 5. Builds requests and returns raw responses."""
    def __init__(self, server: InProcessServer):
        self.server = server
        self.next_id = 1
        self.calls = []   # every tools/call this client sent, for inspection

    def _send(self, method: str, params: dict) -> dict:
        meta = {"io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientCapabilities": {}}
        request = {"jsonrpc": "2.0", "id": self.next_id, "method": method, "params": {**params, "_meta": meta}}
        self.next_id += 1
        return self.server.handle(request)

    def list_tools(self) -> list:
        return self._send("tools/list", {})["result"]["tools"]

    def call_tool(self, name: str, arguments: dict) -> dict:
        self.calls.append((name, arguments))
        return self._send("tools/call", {"name": name, "arguments": arguments})

AGENT_NAME_SCHEMA = {"type": "object", "properties": {"agent_name": {"type": "string"}}, "required": ["agent_name"]}
SET_MODEL_SCHEMA = {"type": "object", "properties": {"agent_name": {"type": "string"}, "model": {"type": "string"}}, "required": ["agent_name", "model"]}
REGISTRY = {"research_agent": "claude-sonnet", "support_agent": "claude-haiku"}

def get_agent_model(agent_name: str) -> str:
    if agent_name not in REGISTRY:
        raise ValueError(f"No agent named '{agent_name}'.")
    return REGISTRY[agent_name]

def set_agent_model(agent_name: str, model: str) -> str:
    if agent_name not in REGISTRY:
        raise ValueError(f"No agent named '{agent_name}'.")
    REGISTRY[agent_name] = model
    return f"{agent_name} now runs on {model}"

def delete_agent(agent_name: str) -> str:
    REGISTRY.pop(agent_name, None)
    return f"deleted {agent_name}"

def get_health(agent_name: str) -> str:
    return f"{agent_name}: 99.9% uptime over the last 24 hours"

def list_alerts(agent_name: str) -> str:
    return f"no open alerts for {agent_name}"

def list_meetings(agent_name: str) -> str:
    return "no meetings"

registry_server = InProcessServer({
    "get_agent_model": (get_agent_model, "The model a registered agent runs on.", AGENT_NAME_SCHEMA),
    "set_agent_model": (set_agent_model, "Switch a registered agent to a different model.", SET_MODEL_SCHEMA),
    "delete_agent": (delete_agent, "Permanently remove an agent from the registry.", AGENT_NAME_SCHEMA),
})
monitoring_server = InProcessServer({
    "get_status": (get_health, "An agent's uptime and health over the last 24 hours.", AGENT_NAME_SCHEMA),
    "alerts.list": (list_alerts, "Open alerts for an agent.", AGENT_NAME_SCHEMA),
})
calendar_server = InProcessServer({
    "list_meetings": (list_meetings, "Meetings on the team calendar.", AGENT_NAME_SCHEMA),
})
```

**Tab: `host.py`** (starter, entry file)
```python
import re

def model_tool_name(label: str, tool_name: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_-]", "_", f"{label}__{tool_name}")

def to_tool_output(response: dict) -> tuple:
    if "error" in response:
        error = response["error"]
        return (f"Error: MCP error {error['code']}: {error['message']}", True)
    result = response["result"]
    if result["resultType"] == "complete":
        text = "\n".join(item["text"] for item in result.get("content", []) if item["type"] == "text")
        return (text, result.get("isError", False))
    return (f"Error: unsupported resultType '{result['resultType']}'", True)

def build_tool_catalog(servers: dict, allowed: dict) -> tuple:
    # TODO: list each allowed server's tools, keep only the allowed ones,
    # convert them for the model, and record a route back for each
    ...

def run_tool_call(call, servers: dict, routes: dict) -> dict:
    # TODO: answer an unknown tool locally; otherwise call the routed server
    # with the original name and turn its response into a tool_result
    ...

def run_agent(llm, user_message: str, servers: dict, allowed: dict, max_steps: int = 10) -> str:
    # TODO: the collect-every-call loop, offering the catalog on every request
    ...
```

**Hidden tests:**
```python
from fake import *
import servers as srv
from host import run_agent

ALLOWED = {"registry": {"get_agent_model", "set_agent_model"}, "monitoring": "*"}

class CountingClient(srv.InProcessClient):
    def __init__(self, server):
        super().__init__(server)
        self.list_calls = 0
    def list_tools(self):
        self.list_calls += 1
        return super().list_tools()

def connect():
    return {
        "registry": CountingClient(srv.registry_server),
        "monitoring": CountingClient(srv.monitoring_server),
        "calendar": CountingClient(srv.calendar_server),
    }

# 1. the model is offered exactly the allowed tools, with model-facing names
servers = connect()
llm = ToolAwareClient([[TextBlock(text="nothing to do")]])
run_agent(llm, "hi", servers, ALLOWED)
assert sorted(t["name"] for t in llm.tools_seen[0]) == [
    "monitoring__alerts_list", "monitoring__get_status", "registry__get_agent_model", "registry__set_agent_model"]
assert all("input_schema" in t and "inputSchema" not in t for t in llm.tools_seen[0])

# 2. a server the agent doesn't use is never even asked for its tools
assert servers["calendar"].list_calls == 0

# 3. a text block, then calls to two servers in one response: each server gets only its own call
servers = connect()
a = ToolUseBlock(name="registry__get_agent_model", input={"agent_name": "research_agent"})
b = ToolUseBlock(name="monitoring__alerts_list", input={"agent_name": "research_agent"})
llm = ToolAwareClient([[TextBlock(text="Checking."), a, b], [TextBlock(text="all good")]])
assert run_agent(llm, "status?", servers, ALLOWED) == "all good"
assert servers["registry"].calls == [("get_agent_model", {"agent_name": "research_agent"})]
assert servers["monitoring"].calls == [("alerts.list", {"agent_name": "research_agent"})]
results = llm.seen[1][-1]["content"]
assert [r["tool_use_id"] for r in results] == [a.id, b.id]
assert results[0]["content"] == "claude-sonnet" and "is_error" not in results[0]

# 4. a disallowed tool can't be reached, even though its server is connected
servers = connect()
llm = ToolAwareClient([[ToolUseBlock(name="registry__delete_agent", input={"agent_name": "research_agent"})], [TextBlock(text="ok")]])
run_agent(llm, "delete it", servers, ALLOWED)
r = llm.seen[1][-1]["content"][0]
assert r["is_error"] is True and servers["registry"].calls == []
assert "research_agent" in srv.REGISTRY

# 5. a tool error from a server comes back flagged
servers = connect()
llm = ToolAwareClient([[ToolUseBlock(name="registry__set_agent_model", input={"agent_name": "ghost_agent", "model": "claude-opus"})], [TextBlock(text="ok")]])
run_agent(llm, "x", servers, ALLOWED)
r = llm.seen[1][-1]["content"][0]
assert r["is_error"] is True and "ghost_agent" in r["content"]

# 6. a multi-step task: a write through one server, then a read that sees it
servers = connect()
llm = ToolAwareClient([
    [ToolUseBlock(name="registry__set_agent_model", input={"agent_name": "support_agent", "model": "claude-opus"})],
    [ToolUseBlock(name="registry__get_agent_model", input={"agent_name": "support_agent"})],
    [TextBlock(text="support_agent now runs on claude-opus")],
])
assert run_agent(llm, "move support_agent to opus and confirm", servers, ALLOWED) == "support_agent now runs on claude-opus"
assert llm.seen[2][-1]["content"][0]["content"] == "claude-opus"

# 7. max_steps still bounds the loop
servers = connect()
llm = ToolAwareClient([[ToolUseBlock(name="monitoring__get_status", input={"agent_name": f"a{i}"})] for i in range(5)])
out = run_agent(llm, "x", servers, ALLOWED, max_steps=3)
assert llm.call_count == 3 and "3" in out
```

**Hint (shown on request):** This is the lesson's three exercises in one file: the third concept's allowlisted `build_tool_catalog`, and the second concept's `run_tool_call` and `run_agent`, with `allowed` passed through to the catalog. Keep the original tool name in each route, since that's what the server has to receive.

**Reference solution — `host.py`:**
```python
import re

def model_tool_name(label: str, tool_name: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_-]", "_", f"{label}__{tool_name}")

def to_tool_output(response: dict) -> tuple:
    if "error" in response:
        error = response["error"]
        return (f"Error: MCP error {error['code']}: {error['message']}", True)
    result = response["result"]
    if result["resultType"] == "complete":
        text = "\n".join(item["text"] for item in result.get("content", []) if item["type"] == "text")
        return (text, result.get("isError", False))
    return (f"Error: unsupported resultType '{result['resultType']}'", True)

def build_tool_catalog(servers: dict, allowed: dict) -> tuple:
    tools_for_model, routes = [], {}
    for label, client in servers.items():
        if label not in allowed:
            continue
        for tool in client.list_tools():
            if allowed[label] != "*" and tool["name"] not in allowed[label]:
                continue
            name = model_tool_name(label, tool["name"])
            if len(name) > 64:
                continue
            tools_for_model.append({"name": name, "description": tool["description"], "input_schema": tool["inputSchema"]})
            routes[name] = (label, tool["name"])
    return tools_for_model, routes

def run_tool_call(call, servers: dict, routes: dict) -> dict:
    if call.name not in routes:
        return {"type": "tool_result", "tool_use_id": call.id, "content": f"Error: there is no tool called {call.name}", "is_error": True}
    label, original_name = routes[call.name]
    text, is_error = to_tool_output(servers[label].call_tool(original_name, call.input))
    result = {"type": "tool_result", "tool_use_id": call.id, "content": text}
    if is_error:
        result["is_error"] = True
    return result

def run_agent(llm, user_message: str, servers: dict, allowed: dict, max_steps: int = 10) -> str:
    tools, routes = build_tool_catalog(servers, allowed)
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

**Explanation:** Each test checks one of the host's responsibilities:

- **What the model is offered:** exactly the four allowed tools, in the model API's format (test 1). The calendar server isn't even asked for its tools (test 2).
- **Routing:** a text block and two calls to two servers in one response; each server gets only its own call, under its original name (test 3).
- **The allowlist as a limit:** the model asks for `registry__delete_agent`, which exists on a connected server but wasn't allowed. The host answers it locally, the registry server's call log stays empty, and the agent is still in the registry (test 4).
- **Failures and multi-step work:** a server's failure comes back flagged (test 5), and a write followed by a read shows real work across steps (test 6).

The allowlist in test 4 is doing a security job, not just a tidying one. An agent that can't reach `delete_agent` can't be talked into calling it, however it's asked. [Lesson 10](→ this module, the tool threat model lesson) shows how an agent can be manipulated into calling tools it shouldn't, and [Lesson 11](→ this module, designing for least privilege lesson) builds on exactly this kind of limit.
