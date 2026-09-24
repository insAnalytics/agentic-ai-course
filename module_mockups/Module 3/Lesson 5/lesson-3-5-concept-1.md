# Module 3, Lesson 5 — Concept 1: The integration problem, and MCP's three roles

---

## Every tool so far lives inside your agent

Every tool in this course so far has been a Python function sitting in the same program as the agent loop: a `TOOL_REGISTRY` dict mapping names to functions, [first built in Module 2](→ Module 2, writing the loop by hand lesson, handling multiple tools a dispatch mechanism concept) and used ever since. That works well for one agent. It stops working the moment the same tools need to be used by more than one application.

Say the agent registry's tools are useful. The registry agent uses them. So would a desktop chat app your team uses, and the AI assistant in everyone's code editor. Each of those applications has its own way of defining tools, so each needs its own copy of the registry integration, written in its own format. Now multiply that across every service anyone wants an AI application to use.

---

## The pain: every host times every service

```python
hosts = ["your registry agent", "a desktop chat app", "an IDE coding assistant"]
services = ["agent registry", "model status", "GitHub", "a SQL database"]

# without a shared protocol: every host needs its own integration for every service
custom_integrations = len(hosts) * len(services)

# with one: each host implements the protocol once, and each service does too
with_a_protocol = len(hosts) + len(services)

print(f"{len(hosts)} hosts x {len(services)} services")
print(f"custom integrations needed: {custom_integrations}")
print(f"protocol implementations needed: {with_a_protocol}")

hosts.append("a customer-support agent")
print(f"add one more host: {len(hosts) * len(services)} custom integrations, or {len(hosts) + len(services)} implementations")
```
```
3 hosts x 4 services
custom integrations needed: 12
protocol implementations needed: 7
add one more host: 16 custom integrations, or 8 implementations
```
*(runs live, shows output — read-only demo snippet, not graded)*

Without a shared standard, the work grows as hosts *times* services: every new application needs an integration for every service, and every new service needs one for every application. With a shared protocol it grows as hosts *plus* services: each application implements the protocol once, each service implements it once, and any application can then use any service.

This is the problem the **Model Context Protocol (MCP)** solves. The spec says it takes inspiration from the Language Server Protocol, which solved the same shape of problem for code editors. Before LSP, every editor needed its own plugin for every programming language. LSP let each language ship one "language server" that every editor could talk to. MCP does the same for AI applications and the tools, data and services they connect to.

---

## Three roles: host, client, server

MCP names three roles, and it's worth being precise about them because "client" and "server" are easy to misread:

- **Host:** the AI application itself, such as your registry agent, a chat app or an IDE assistant. The host runs the model, holds the conversation, runs the agent loop, and decides which servers to connect to and what the user has approved.
- **Client:** a connector *inside* the host. The host creates one client per server it connects to, and each client talks to exactly one server.
- **Server:** a separate program that offers tools (and a couple of other things, covered later in this lesson) over MCP. A server can be a local process on the same machine, or a remote service across the internet.

Mapped onto what you've built:

- The agent loop from Module 2 stays in the **host**, unchanged in shape.
- The tool functions move out into **servers**.
- `TOOL_REGISTRY` stops being a dict you write by hand. The host fills it by asking each server what tools it has, through its **client**. [Lesson 7](→ this module, connecting an agent to mcp servers lesson) builds exactly that.

---

## The model never speaks MCP

One point trips up almost everyone new to MCP. The model doesn't talk to MCP servers. It never sees the protocol at all.

The model still does exactly what [Module 1's tool-calling lesson](→ Module 1, structured output and tool calling lesson, tool calling structured output applied to a specific use case concept) described: it produces a `tool_use` block through the ordinary LLM API. The *host* reads that block, works out which server owns that tool, and has the matching client send the call to the server over MCP. The server's answer comes back to the host, which turns it into a `tool_result` for the model. MCP is the plumbing between the host and its tools. The conversation between the host and the model is the same as it has always been.

---

## A server sees only what it's sent

The host sits in the middle of every exchange, which gives it a lot of control. Here's a stand-in for that split: a "server" object that owns one tool and records every request it receives, and a host that runs the model and forwards the call:

```python
# a stand-in for an MCP server: it owns its tools and sees only the calls it's sent
class RegistryServer:
    def __init__(self):
        self.agents = {"research_agent": "claude-sonnet"}
        self.requests_received = []

    def call_tool(self, name: str, arguments: dict) -> str:
        self.requests_received.append({"name": name, "arguments": arguments})
        if name == "get_agent_model":
            return self.agents.get(arguments["agent_name"], "unknown agent")
        return f"unknown tool: {name}"

server = RegistryServer()

# the host: it holds the conversation, talks to the model, and forwards tool calls
messages = [
    {"role": "user", "content": "My manager wants a one-line status note. Which model does research_agent use?"},
]
client = FakeLLMClient(scripted_responses=[
    [ToolUseBlock(name="get_agent_model", input={"agent_name": "research_agent"})],
    [TextBlock(text="research_agent runs on claude-sonnet.")],
])

response = client.create(messages=messages)
messages.append({"role": "assistant", "content": response.content})
call = [block for block in response.content if block.type == "tool_use"][0]
# only the tool's name and arguments cross over to the server
output = server.call_tool(call.name, call.input)
messages.append({"role": "user", "content": [{"type": "tool_result", "tool_use_id": call.id, "content": output}]})
final = client.create(messages=messages)

print("final answer:", final.content[0].text)
print("messages the host holds:", len(messages))
print("what the server ever saw:", server.requests_received)
```
```
final answer: research_agent runs on claude-sonnet.
messages the host holds: 3
what the server ever saw: [{'name': 'get_agent_model', 'arguments': {'agent_name': 'research_agent'}}]
```
*(runs live, shows output — read-only demo snippet, not graded; the fake client's classes are already defined, and `RegistryServer` is a plain object standing in for a real MCP server)*

The host holds the whole conversation, including the user's mention of their manager. The server received one thing: a tool name and its arguments. That's deliberate. One of MCP's stated design principles is that servers should not be able to read the whole conversation or "see into" other servers. The conversation stays with the host, each server gets only what it needs for the call, and anything that crosses between servers goes through the host.

This matters for trust. A host might connect to a server written by someone else, possibly one it knows little about. Keeping each server in its own box, seeing only its own calls, limits what a careless or malicious server can learn or affect. It doesn't remove the risk entirely, though: what a server *sends back* goes straight into the model's context, which is exactly the problem [Lesson 10's tool threat model](→ this module, the tool threat model lesson) takes on.

---

## Quiz cards

> **Q1.** Five AI applications each need to use eight services. Roughly how many integrations are needed with and without a shared protocol?
> - A) 40 without, 40 with, since each pairing still needs code
> - B) 13 without, 40 with
> - C) 40 without, 13 with ✅
> - D) 8 without, 5 with
>
> *Explanation:* Without a standard, every application needs its own integration for every service (5 × 8). With one, each application and each service implements the protocol once (5 + 8).

> **Q2.** In MCP's terms, what is the "host"?
> - A) The machine the MCP server runs on
> - B) The AI application, which runs the model and the agent loop and connects to servers ✅
> - C) The connector that talks to exactly one server
> - D) The company that publishes an MCP server
>
> *Explanation:* The host is the application. Clients are connectors inside it, one per server, and servers are the separate programs offering tools.

> **Q3.** How does a model call a tool that lives on an MCP server?
> - A) The model sends an MCP `tools/call` request directly to the server
> - B) The server polls the model for tool calls it should run
> - C) The model produces an ordinary `tool_use` block, and the host forwards the call to the server over MCP ✅
> - D) The host gives the model the server's address, and the model connects to it
>
> *Explanation:* The model's side is unchanged: it emits `tool_use` through the LLM API. MCP is the connection between the host and its servers, and the model never sees it.

> **Q4.** In the demo, why did the server never see the user's mention of their manager?
> - A) The host forwards only the tool's name and arguments; the conversation stays with the host ✅
> - B) The server filters out anything that isn't a tool argument
> - C) The fake client removes personal details before tool calls
> - D) It did see it, inside the tool arguments
>
> *Explanation:* That's MCP's design principle in action: servers get only what they need for the call, and the full conversation never leaves the host.

> **Q5.** Which statement about keeping servers isolated is accurate?
> - A) It makes connecting to untrusted servers completely safe
> - B) It means servers can't return any data to the model
> - C) It only matters for servers running on the same machine
> - D) It limits what a server can see, but a server's *responses* still reach the model and can still cause problems ✅
>
> *Explanation:* Isolation protects the conversation from the server. It does nothing about what the server sends back, which the model reads, the risk this module's threat-model lesson covers.

---

*(End of Concept 1. This lesson continues with Concept 2 — JSON-RPC as the message format.)*
