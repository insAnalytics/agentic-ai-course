# Module 3, Lesson 7 — Concept 3: When there are too many tools

---

## Every server you connect adds to every request

Connecting a server is one line of configuration, and a useful server might offer ten, twenty or fifty tools. So it's easy for an agent to end up with far more tools than any single task needs. That has two costs, and both grow with every server added.

**Tokens, on every request.** [The previous concept](→ this lesson, routing the models calls inside the loop concept) sent the whole catalog with every `create(...)` call. Tool definitions are ordinary input, so this is [Lesson 3's cost problem](→ this module, shaping what tools return lesson, why a huge tool result hurts concept) again, from the other direction: not one oversized result, but a large block of definitions resent on every step.

```python
import json

def fake_tool(server: str, action: str) -> dict:
    # a typical tool definition: a name, a sentence of description, and a small schema
    return {
        "name": f"{server}__{action}",
        "description": f"{action.replace('_', ' ').capitalize()} in {server}. Use this when the user asks about {server} {action.split('_')[-1]}.",
        "input_schema": {
            "type": "object",
            "properties": {
                "id": {"type": "string", "description": "The identifier of the item to act on."},
                "limit": {"type": "integer", "description": "Maximum number of results to return."},
            },
            "required": ["id"],
        },
    }

ACTIONS = ["list_items", "get_item", "create_item", "update_item", "delete_item",
           "search_items", "get_status", "list_users", "get_user", "list_events"]
SERVERS = ["registry", "monitoring", "github", "slack", "calendar"]

catalog = [fake_tool(server, action) for server in SERVERS for action in ACTIONS]
tokens_per_request = len(json.dumps(catalog)) // 4

print(f"{len(catalog)} tools from {len(SERVERS)} servers")
print(f"roughly {tokens_per_request:,} tokens of tool definitions, sent with every request")
print(f"a 10-step task resends them 10 times: roughly {tokens_per_request * 10:,} tokens")
print("tools with the same action name on different servers:",
      sum(1 for tool in catalog if tool["name"].endswith("__get_status")))
```
```
50 tools from 5 servers
roughly 4,541 tokens of tool definitions, sent with every request
a 10-step task resends them 10 times: roughly 45,410 tokens
tools with the same action name on different servers: 5
```
*(runs live, shows output — read-only demo snippet, not graded; characters ÷ 4 is [a rough token estimate](→ this module, shaping what tools return lesson, why a huge tool result hurts concept))*

These toy definitions are short, about 90 tokens each. Real ones are much longer, with detailed descriptions, many parameters and nested schemas. Anthropic's documentation gives a real example: a typical setup of five servers, such as GitHub, Slack, Sentry, Grafana and Splunk, uses around 55,000 tokens of tool definitions before the model has done any work at all. [Prompt caching](→ Module 1, context windows and kv cache lesson, prompt structure and cache hits concept) softens the price, since the definitions are the same stable prefix on every request, but they still take up the context window every time, and caching does nothing for the second problem.

**Worse choices.** The more tools a model sees, the more likely it is to pick the wrong one. Anthropic's documentation puts the threshold plainly: Claude's ability to pick the right tool degrades once it has more than about 30 to 50 tools available. Anthropic's engineering team reports that the most common failures are choosing the wrong tool and passing incorrect parameters, especially when tools have similar names. The demo's catalog has five `get_status` tools; a real multi-server setup has many near-duplicates like that.

---

## Fix 1: connect only what the agent needs

The simplest fix happens before any code: an agent that manages the registry doesn't need the calendar server. Each agent gets its own list of servers, chosen for its job, rather than every agent connecting to everything the organization has.

## Fix 2: offer only the tools the task needs

Even a relevant server usually offers more tools than one agent uses. An **allowlist** names, per server, exactly which tools this agent may see, and the catalog builder skips everything else:

```python
import re

def model_tool_name(label: str, tool_name: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_-]", "_", f"{label}__{tool_name}")

# this agent only answers questions about agents' models and health
ALLOWED = {
    "registry": {"get_agent_model"},
    "monitoring": {"get_status"},
}

def build_tool_catalog(servers: dict, allowed: dict) -> tuple:
    tools_for_model, routes = [], {}
    for label, client in servers.items():
        if label not in allowed:
            continue
        for tool in client.list_tools():
            if tool["name"] not in allowed[label]:
                continue
            name = model_tool_name(label, tool["name"])
            tools_for_model.append({"name": name, "description": tool["description"], "input_schema": tool["inputSchema"]})
            routes[name] = (label, tool["name"])
    return tools_for_model, routes

servers = {"registry": InProcessClient(registry_server), "monitoring": InProcessClient(monitoring_server)}
tools, routes = build_tool_catalog(servers, ALLOWED)
print("offered to the model:", [t["name"] for t in tools])
```
```
offered to the model: ['registry__get_agent_model', 'monitoring__get_status']
```
*(runs live, shows output — read-only demo snippet, not graded)*

Two tools instead of four. The registry's `get_status` and the monitoring server's `alerts.list` still exist on their servers; this agent just isn't offered them. Two details matter here:

- **The allowlist uses the servers' original tool names,** `get_agent_model` rather than `registry__get_agent_model`, because it's written against what each server actually offers.
- **A tool the model isn't offered can't be called.** The route for it never exists, so [the routing step](→ this lesson, routing the models calls inside the loop concept) answers any attempt as an unknown tool, without contacting a server. That makes the allowlist more than a performance fix: it's the first step toward [limiting what an agent is able to do](→ this module, designing for least privilege lesson), covered properly later in this module.

## Fix 3: different tools for different stages

An agent that plans, then acts, then checks its work rarely needs the same tools in every stage. [Module 2's phase-aware system prompts](→ Module 2, the system prompt as agent design lesson, phase aware prompting concept) changed the instructions per stage; the same idea applies to the tool list. Building a catalog per stage, a read-only set while researching, a write set only when it's time to act, keeps each stage's list short.

## Fix 4: make similar tools easy to tell apart

When two tools really are both needed and look alike, the fix is [Lesson 1's](→ this module, designing tools a model can use well lesson, names and descriptions as prompts concept): descriptions that say when to use each one, and when *not* to. The server prefix from [the first concept](→ this lesson, discovering tools from several servers concept) helps too: `registry__get_status` and `monitoring__get_status` are already clearer than two tools both called `get_status`.

---

## Beyond static lists

All four fixes decide the tool list *before* the task starts. For agents that genuinely need access to hundreds of tools, there's a different approach: offer the model a small search tool, and load the definitions it asks for only when it needs them. Anthropic's API has this built in, and it's one of several techniques for managing what goes into the context window at all, which is [Module 4's subject](→ this course, the context and memory module). For most agents, a well-chosen allowlist is enough.

---

## Quiz cards

> **Q1.** Why do more connected tools cost tokens on every request, not just once?
> - A) The servers charge per tool listed
> - B) The model API is stateless, so the tool definitions are part of every request's input ✅
> - C) Each tool is called once per request to check it still works
> - D) Tool definitions are stored in the model's weights
>
> *Explanation:* Like the conversation, the tool list is resent on every call. Caching can reduce the price, but the definitions still occupy the context window each time.

> **Q2.** According to Anthropic's documentation, roughly when does Claude's tool selection start to degrade?
> - A) Beyond about 5 tools
> - B) Only beyond about 1,000 tools
> - C) Beyond about 30 to 50 tools available at once ✅
> - D) It doesn't; more tools always help
>
> *Explanation:* That's the threshold Anthropic's docs give. The most common failures are choosing the wrong tool and passing incorrect parameters, especially among similarly named tools.

> **Q3.** An allowlist names `{"registry": {"get_agent_model"}}`, and the model calls `registry__get_status` anyway. What happens?
> - A) The registry server rejects it with a protocol error
> - B) The call goes through, since the registry server is connected
> - C) The host adds the tool to the catalog and retries
> - D) The host answers it as an unknown tool, because no route exists for it, and no server is contacted ✅
>
> *Explanation:* Only allowed tools get routes. That's what makes an allowlist a limit on what the agent can do, not just a shorter list.

> **Q4.** Why does the allowlist use `get_agent_model` rather than `registry__get_agent_model`?
> - A) It's written against the names each server actually offers, keyed by server ✅
> - B) Prefixed names are only valid inside the model API
> - C) The allowlist is sent to the servers
> - D) Prefixes are removed before the catalog is built
>
> *Explanation:* The allowlist is configuration about servers and their tools. The prefix is only added afterwards, when building names for the model.

> **Q5.** Prompt caching makes a large, stable tool list cheaper. What problem does it leave unsolved?
> - A) The definitions still fill the context window, and a long list still makes tool choice harder ✅
> - B) Cached tools can't be called
> - C) Caching only works for a single server
> - D) Caching increases the per-token price
>
> *Explanation:* Caching reduces what you pay for repeated input. It doesn't shorten the list the model has to choose from, or free up the space it takes.

---

## Applied sandbox exercise

*(graded — a catalog limited by an allowlist)*

**Task shown to learner:** Extend `build_tool_catalog(servers, allowed)` from this lesson's first concept with an allowlist. `allowed` maps a server label either to a set of the server's **original** tool names, or to the string `"*"` meaning every tool on that server.

- A server whose label isn't in `allowed` is skipped entirely. Don't even call its `list_tools()`.
- For an allowed server, keep only the tools its entry allows (or all of them for `"*"`).
- Everything else is as before: prefixed, cleaned names; `inputSchema` stored as `input_schema`; a route to `(label, original_name)`; names over 64 characters left out.

**Starter code:**
```python
def build_tool_catalog(servers: dict, allowed: dict) -> tuple:
    # TODO: the first concept's catalog, limited by the allowlist
    ...
```

**Hidden tests:**
```python
servers = {"registry": InProcessClient(registry_server), "monitoring": InProcessClient(monitoring_server)}

# 1. only the listed tools from each listed server
tools, routes = build_tool_catalog(servers, {"registry": {"get_agent_model"}, "monitoring": {"alerts.list"}})
assert sorted(t["name"] for t in tools) == ["monitoring__alerts_list", "registry__get_agent_model"]
assert routes["monitoring__alerts_list"] == ("monitoring", "alerts.list")

# 2. "*" allows every tool from that server
tools, routes = build_tool_catalog(servers, {"monitoring": "*"})
assert sorted(t["name"] for t in tools) == ["monitoring__alerts_list", "monitoring__get_status"]

# 3. a server not in the allowlist contributes nothing, and is never even asked for its tools
class CountingClient(InProcessClient):
    def __init__(self, server):
        super().__init__(server)
        self.list_calls = 0
    def list_tools(self):
        self.list_calls += 1
        return super().list_tools()
unused = CountingClient(registry_server)
tools, routes = build_tool_catalog({"registry": unused, "monitoring": InProcessClient(monitoring_server)}, {"monitoring": {"get_status"}})
assert [t["name"] for t in tools] == ["monitoring__get_status"] and unused.list_calls == 0

# 4. an allowed name the server doesn't actually offer is simply absent
tools, routes = build_tool_catalog(servers, {"registry": {"get_agent_model", "delete_agent"}})
assert [t["name"] for t in tools] == ["registry__get_agent_model"] and set(routes) == {"registry__get_agent_model"}

# 5. the conversion from the earlier concept is unchanged
t = tools[0]
assert t["input_schema"] == AGENT_NAME_SCHEMA and "inputSchema" not in t
```

**Hint (shown on request):** Two `continue` checks do all the new work: one at the top of the server loop (`label not in allowed`), and one at the top of the tool loop (`allowed[label] != "*" and tool["name"] not in allowed[label]`). The rest of the loop body is the first concept's solution, unchanged.

**Reference solution:**
```python
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
```

**Explanation:** Test 3 checks the skipped server's `list_tools()` is never called. That's not only tidy: listing a server's tools is a real request, and there's no reason to make it for a server this agent will never use. Test 4 shows that allowing a tool name the server doesn't actually offer is harmless: the allowlist can only narrow what the servers offer, never add to it.

---

*(End of Concept 3 — final concept of Lesson 7. The lesson continues with the recap and comprehensive sandbox.)*
