# Module 3, Lesson 7 — Concept 1: Discovering tools from several servers

---

## From servers to a tool list the model can use

[Lesson 6](→ this module, building an mcp server lesson) built a server. This lesson builds the other end: the host, the registry agent itself, connected to several MCP servers at once and using their tools inside [Module 2's loop](→ Module 2, react and reasoning in the loop lesson, the react pattern concept).

The loop needs two things it used to get from a hand-written `TOOL_REGISTRY`: a list of tools to offer the model, and a way to run whichever one the model picks. With MCP, both come from the servers. At startup the host asks each server for its tools with `tools/list`, reshapes them into the model's tool format, and remembers which server each one came from. This concept builds that step; [the next one](→ this lesson, routing the models calls inside the loop concept) runs the calls.

The demos in this lesson use in-process stand-ins for two servers and their clients: a **registry** server and a **monitoring** server. They speak real MCP message shapes, but live in the same program so the sandbox can run them:

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
MODELS = {"research_agent": "claude-sonnet", "support_agent": "claude-haiku"}

def registry_get_status(agent_name: str) -> str:
    if agent_name not in MODELS:
        raise ValueError(f"No agent named '{agent_name}'.")
    return f"{agent_name} is registered and active"

def get_agent_model(agent_name: str) -> str:
    if agent_name not in MODELS:
        raise ValueError(f"No agent named '{agent_name}'.")
    return MODELS[agent_name]

def monitoring_get_status(agent_name: str) -> str:
    return f"{agent_name}: 99.9% uptime over the last 24 hours"

def list_alerts(agent_name: str) -> str:
    return f"no open alerts for {agent_name}"

registry_server = InProcessServer({
    "get_status": (registry_get_status, "Whether an agent is registered, and its registry status.", AGENT_NAME_SCHEMA),
    "get_agent_model": (get_agent_model, "The model a registered agent runs on.", AGENT_NAME_SCHEMA),
})
monitoring_server = InProcessServer({
    "get_status": (monitoring_get_status, "An agent's uptime and health over the last 24 hours.", AGENT_NAME_SCHEMA),
    "alerts.list": (list_alerts, "Open alerts for an agent.", AGENT_NAME_SCHEMA),
})
```
*(defined once here and already loaded for every demo in this lesson)*

---

## The pain: two servers, one name

Each server is written independently, so nothing stops two of them choosing the same tool name. Here both have a `get_status` tool, meaning different things:

```python
SERVERS = {"registry": InProcessClient(registry_server), "monitoring": InProcessClient(monitoring_server)}

# the naive approach: one dict of tools keyed by their own names
tools_by_name = {}
for label, client in SERVERS.items():
    for tool in client.list_tools():
        tools_by_name[tool["name"]] = (label, tool)

print("tools the servers offer:", sum(len(c.list_tools()) for c in SERVERS.values()))
print("tools the model would see:", len(tools_by_name))
print("get_status now means:", tools_by_name["get_status"][0], "->", tools_by_name["get_status"][1]["description"])
```
```
tools the servers offer: 4
tools the model would see: 3
get_status now means: monitoring -> An agent's uptime and health over the last 24 hours.
```
*(runs live, shows output — read-only demo snippet, not graded)*

The registry's `get_status` silently vanished, overwritten by the monitoring one. No error, no warning: the model would simply never see the registry version, and a call meant for one server could land on the other. Collisions like this are common, because short, obvious names like `search`, `get_status` and `list` are exactly what server authors reach for.

The MCP spec anticipates it: a host combining tools from several servers **should** give each tool a server prefix. It adds that the server's own name, the one in its `serverInfo`, isn't guaranteed to be unique and shouldn't be relied on for this. So the prefix comes from the host's own configuration: the label *you* gave each server when you connected it, `"registry"` and `"monitoring"` here.

---

## The fix: prefix, clean up, and keep a route back

Two more rules shape the model-facing name. MCP allows tool names up to 128 characters, including dots, as in `alerts.list`. Model APIs are stricter: Claude's API caps names at 64 characters, and some Claude apps reject dots. The safe set is letters, digits, underscores and hyphens, so the host replaces anything else, and leaves out any tool whose name would be too long:

```python
import re

SERVERS = {"registry": InProcessClient(registry_server), "monitoring": InProcessClient(monitoring_server)}

def model_tool_name(label: str, tool_name: str) -> str:
    # prefix with the host's own label for the server, and keep only characters every model API accepts
    return re.sub(r"[^a-zA-Z0-9_-]", "_", f"{label}__{tool_name}")

def build_tool_catalog(servers: dict) -> tuple:
    tools_for_model = []
    routes = {}
    for label, client in servers.items():
        for tool in client.list_tools():
            name = model_tool_name(label, tool["name"])
            if len(name) > 64:
                print(f"skipping {label}/{tool['name']}: name too long for the model API")
                continue
            tools_for_model.append({"name": name, "description": tool["description"], "input_schema": tool["inputSchema"]})
            routes[name] = (label, tool["name"])
    return tools_for_model, routes

tools_for_model, routes = build_tool_catalog(SERVERS)
for tool in tools_for_model:
    print(f"{tool['name']:28} -> {routes[tool['name']]}")
```
```
registry__get_status         -> ('registry', 'get_status')
registry__get_agent_model    -> ('registry', 'get_agent_model')
monitoring__get_status       -> ('monitoring', 'get_status')
monitoring__alerts_list      -> ('monitoring', 'alerts.list')
```
*(runs live, shows output — read-only demo snippet, not graded)*

The result is two structures:

- **`tools_for_model`**, in the model API's format. Two names change on the way: the tool's name gets its server prefix, and MCP's `inputSchema` becomes `input_schema`, [the rename Lesson 5 pointed out](→ this module, the model context protocol lesson, what a server offers tools resources and prompts concept). The description is copied unchanged, because [it's the prompt the model reads](→ this module, designing tools a model can use well lesson, names and descriptions as prompts concept).
- **`routes`**, mapping each model-facing name back to its server and the tool's **original** name. That second part matters: `monitoring__alerts_list` is what the model calls, but the monitoring server only knows `alerts.list`. The route is how the host translates back.

`re.sub(pattern, "_", text)` replaces every match of a regular-expression pattern; `[^a-zA-Z0-9_-]` matches any character that *isn't* a letter, digit, underscore or hyphen. The double underscore as a separator is just a convention: it's unlikely to appear inside a tool's own name, so a prefixed name stays readable.

One more point about the prefix: it also helps the model. `registry__get_status` and `monitoring__get_status` tell the model where each tool comes from before it reads a word of either description.

---

## When the tool list changes

A server's `tools/list` result can change over time, when it's upgraded or when a tool is enabled for some users. [Lesson 5's `ttlMs`](→ this module, the model context protocol lesson, stateless by design concept) says how long a list may be cached. A simple host builds its catalog once at startup; a long-running one rebuilds it when the cache expires, so the model isn't offered tools that no longer exist.

---

## Quiz cards

> **Q1.** Two servers each offer a tool called `search`. What happens if the host keys its tools by their own names?
> - A) The API rejects the duplicate and returns an error
> - B) The model sees both and picks one at random
> - C) One silently overwrites the other, so the model never sees it and calls may reach the wrong server ✅
> - D) The two tools are merged into one
>
> *Explanation:* A dict holds one value per key. Nothing fails loudly, which is exactly why collisions are dangerous.

> **Q2.** What should the prefix that tells two servers' tools apart come from?
> - A) The server's `serverInfo` name
> - B) The label the host gave the server in its own configuration ✅
> - C) The tool's description
> - D) A random ID generated at startup
>
> *Explanation:* The spec says server names aren't guaranteed unique and shouldn't be relied on. The host's own labels are unique because the host chose them. A random ID would also be unique, but would change on every restart and mean nothing to the model.

> **Q3.** A server offers `alerts.list`, and the host shows the model `monitoring__alerts_list`. When the model calls it, which name goes to the server?
> - A) `monitoring__alerts_list`, since that's what the model called
> - B) `alerts_list`, with the prefix removed
> - C) `monitoring.alerts.list`
> - D) `alerts.list`, the server's original name, found through the route ✅
>
> *Explanation:* The server only knows its own names. The route records the original so the host can translate the model's call back exactly.

> **Q4.** Why does the host replace dots in tool names, when MCP allows them?
> - A) Model APIs are stricter than MCP about tool names, and some clients reject dots ✅
> - B) Dots are reserved for JSON-RPC methods
> - C) Dots make tool names case-sensitive
> - D) Servers can't read names with dots
>
> *Explanation:* A name that's valid in MCP can still fail the model API's rules. The host cleans names for the model and keeps the original for the server.

> **Q5.** What's the key rename when turning an MCP tool into a tool for Claude's API?
> - A) `description` becomes `prompt`
> - B) `inputSchema` becomes `input_schema` ✅
> - C) `name` becomes `id`
> - D) Nothing; the formats are identical
>
> *Explanation:* The schema itself is the same JSON Schema. Only the key's spelling differs between the two formats.

---

## Applied sandbox exercise

*(graded — building the host's tool catalog)*

**Task shown to learner:** Implement `build_tool_catalog(servers)`. `servers` maps each server's label to its client, and each client has `list_tools()`. `model_tool_name(label, tool_name)` is provided. Return a tuple `(tools_for_model, routes)`:

- `tools_for_model`: one dict per tool, with `name` (from `model_tool_name`), the original `description`, and the tool's `inputSchema` stored under `input_schema`.
- `routes`: maps each model-facing name to `(label, original_tool_name)`.
- Leave out any tool whose model-facing name is longer than 64 characters, but keep the rest of that server's tools.

**Provided code:**
```python
import re

def model_tool_name(label: str, tool_name: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_-]", "_", f"{label}__{tool_name}")
```

**Starter code:**
```python
def build_tool_catalog(servers: dict) -> tuple:
    # TODO: list every server's tools, convert them for the model, and record a route back for each
    ...
```

**Hidden tests:**
```python
long_name = "export_every_agent_configuration_including_archived_ones_as_csv"
reports_server = InProcessServer({
    long_name: (get_agent_model, "Export everything.", AGENT_NAME_SCHEMA),
    "summary": (get_agent_model, "A one-line summary.", AGENT_NAME_SCHEMA),
})
servers = {
    "registry": InProcessClient(registry_server),
    "monitoring": InProcessClient(monitoring_server),
    "reports": InProcessClient(reports_server),
}
tools, routes = build_tool_catalog(servers)
names = [t["name"] for t in tools]

# 1. both get_status tools survive, told apart by prefix
assert "registry__get_status" in names and "monitoring__get_status" in names

# 2. every model-facing name fits the model API's rules
assert all(re.fullmatch(r"[a-zA-Z0-9_-]{1,64}", n) for n in names), names

# 3. a dotted name is cleaned for the model, but the route keeps the server's real name
assert "monitoring__alerts_list" in names
assert routes["monitoring__alerts_list"] == ("monitoring", "alerts.list")

# 4. the schema key is renamed, and descriptions and schemas are carried over unchanged
by_name = {t["name"]: t for t in tools}
t = by_name["registry__get_agent_model"]
assert t["input_schema"] == AGENT_NAME_SCHEMA and "inputSchema" not in t
assert t["description"] == "The model a registered agent runs on."

# 5. a tool whose prefixed name would be too long is left out, and the rest of its server still loads
assert not any(long_name in n for n in names)
assert "reports__summary" in names
assert len(tools) == 5 and set(routes) == set(names)
```

**Hint (shown on request):** Two nested loops: over `servers.items()`, then over `client.list_tools()`. Compute the model-facing name first, `continue` past it if it's too long, then append to `tools_for_model` and add to `routes`. Store `tool["name"]`, not the cleaned name, in the route.

**Reference solution:**
```python
def build_tool_catalog(servers: dict) -> tuple:
    tools_for_model = []
    routes = {}
    for label, client in servers.items():
        for tool in client.list_tools():
            name = model_tool_name(label, tool["name"])
            if len(name) > 64:
                continue
            tools_for_model.append({"name": name, "description": tool["description"], "input_schema": tool["inputSchema"]})
            routes[name] = (label, tool["name"])
    return tools_for_model, routes
```

**Explanation:** The two structures come out of the same loop, so they always agree: every tool the model can see has exactly one route (the last test checks that). The tests cover each thing that can go wrong: a collision (test 1), a name the model API would reject (test 2), a route that lost the server's real name (test 3), the schema key left unrenamed (test 4), and one bad tool taking a whole server down with it (test 5).

---

*(End of Concept 1. This lesson continues with Concept 2 — routing the model's calls inside the loop.)*
