# Module 3, Lesson 6 — Concept 4: Errors, running and testing with the SDK

---

## Three ways a tool can fail

[Concept 2](→ this lesson, answering tools call by hand concept) sorted every failure by one question: could the model fix this by calling differently? The SDK uses the same split, and gives each outcome its own exception:

- **Raise `ToolError`** for a failure the model should see: an unknown agent, a value out of range, an upstream API that timed out. It becomes a tool error with your message.
- **Raise `MCPError`** when the request should be rejected outright and no retry from the model would help: the server is in maintenance, or a required client capability is missing. It becomes a JSON-RPC protocol error, and on the client side the call raises instead of returning a result.
- **Anything else is a crash.** The model gets a generic tool error, with none of the exception's text. The full traceback goes to the server's log.

Here's one of each, run through the in-memory client:

```python
from mcp import MCPError
from mcp.server import MCPServer
from mcp.server.mcpserver.exceptions import ToolError
from mcp.types import INVALID_REQUEST, ToolAnnotations

mcp = MCPServer("registry-server", version="1.0.0")

REGISTRY = {"research_agent": "claude-sonnet"}
MAINTENANCE_MODE = True


@mcp.tool()
def get_agent_model(agent_name: str) -> str:
    """Return the model one registered agent runs on."""
    if agent_name not in REGISTRY:
        raise ToolError(f"No agent named '{agent_name}'.")
    return REGISTRY[agent_name]


@mcp.tool(annotations=ToolAnnotations(read_only_hint=False, destructive_hint=True, idempotent_hint=True))
def delete_agent(agent_name: str) -> str:
    """Permanently remove an agent from the registry."""
    if MAINTENANCE_MODE:
        raise MCPError(INVALID_REQUEST, "The registry is in maintenance mode and not accepting writes.")
    del REGISTRY[agent_name]
    return f"Deleted {agent_name}"


@mcp.tool(annotations=ToolAnnotations(read_only_hint=True))
def get_agent_owner(agent_name: str) -> str:
    """Return the team that owns a registered agent."""
    owners = {}
    return owners[agent_name]
```
```python
import asyncio

from mcp import Client, MCPError

from errors_server import mcp


async def main() -> None:
    async with Client(mcp) as client:
        result = await client.call_tool("get_agent_model", {"agent_name": "ghost_agent"})
        print("ToolError     ->", result.is_error, "|", result.content[0].text)

        result = await client.call_tool("get_agent_owner", {"agent_name": "research_agent"})
        print("crash         ->", result.is_error, "|", result.content[0].text)

        try:
            await client.call_tool("delete_agent", {"agent_name": "research_agent"})
        except MCPError as e:
            print("MCPError      -> raised on the client:", e)

        tools = await client.list_tools()
        for tool in tools.tools:
            print(f"{tool.name}: {tool.annotations}")


asyncio.run(main())
```
```
ToolError     -> True | Error executing tool get_agent_model: No agent named 'ghost_agent'.
crash         -> True | Error executing tool get_agent_owner
MCPError      -> raised on the client: The registry is in maintenance mode and not accepting writes.
get_agent_model: None
delete_agent: title=None read_only_hint=False destructive_hint=True idempotent_hint=True open_world_hint=None
get_agent_owner: title=None read_only_hint=True destructive_hint=None idempotent_hint=None open_world_hint=None
```
*(illustrative — run against `mcp` 2.2.0; the output shown is that run's real output)*

The first two lines are exactly Concept 2's behavior: the `ToolError` message reaches the model, and the `KeyError` from the empty `owners` table doesn't, because an unexpected exception's text can hold internals such as database addresses. The SDK's own docs put the choice between `ToolError` and `MCPError` as one question: *could a smarter model have avoided this?* If yes, raise `ToolError`. If no, raise `MCPError`.

One consequence of the SDK's design catches people out: returning a string that says "Error: …" from a tool is a *successful* result, with `is_error` false. [Concept 2 explained why](→ this lesson, answering tools call by hand concept): the only way to set the failure flag is to raise.

---

## Tool annotations: hints for the host

The same run printed each tool's `annotations`. These are optional hints a server attaches to a tool, describing its behavior for the host's benefit:

- **`read_only_hint`:** the tool doesn't change anything.
- **`destructive_hint`:** it may delete or overwrite something.
- **`idempotent_hint`:** calling it twice with the same arguments has the same effect as calling it once, so it's safe to retry, [the property that decided which calls Lesson 4 could safely retry](→ this module, tools that call the outside world lesson, which failures to retry and how concept).
- **`open_world_hint`:** it reaches out to the open world, such as the web, rather than a closed system.

A well-behaved host uses them to decide things like "should I ask the user before running this?", so marking `delete_agent` as destructive is how the registry server tells hosts to be careful with it.

They are hints, not security. A host is free to ignore them, and a malicious or careless server can label anything as read-only. Deciding what an agent is actually *allowed* to do, and putting approval gates in front of destructive calls, is [the least-privilege lesson](→ this module, designing for least privilege lesson), and it happens on the host's side, where you're in control.

---

## Running the server

`mcp.run()` starts serving and blocks for as long as the server runs. With no argument it uses stdio, the right choice for a server a host launches on the same machine. For Streamable HTTP, name the transport and, optionally, where to listen:

```python
if __name__ == "__main__":
    mcp.run(transport="streamable-http", host="127.0.0.1", port=8000)
```
*(illustrative)*

That serves the MCP endpoint at `http://127.0.0.1:8000/mcp`, and a client points at that URL. A few things to know:

- **Keep `mcp.run()` under `if __name__ == "__main__":`.** Tests, the SDK's command-line tools and other code *import* your server file to get the `mcp` object. Without the guard, importing it would start a server and never return.
- **Transport options go to `run()`, not to `MCPServer(...)`.** The constructor describes what the server *is*, its name, version and instructions. `run()` describes how it's served.
- **The HTTP side enforces Lesson 5's rules for you.** Running the registry server this way and connecting the SDK's client to the URL worked on the first call. A plain `POST` to the same endpoint *without* the MCP headers came back as HTTP 400, [the header check from Lesson 5](→ this module, the model context protocol lesson, transports concept), done by the SDK without any code of yours.
- **For interactive poking, there's the MCP Inspector.** Installing the package as `mcp[cli]` adds an `mcp` command, and `mcp dev server.py` launches your server with a web UI for listing and calling its tools, the same way a real host would.

### Logging on stdio

Over stdio, [stdout is the wire](→ this module, the model context protocol lesson, transports concept). While it's serving, the SDK diverts most stray output, such as a flushed `print()`, away from stdout to stderr, but not all of it: output before serving starts, or a `print()` that stays buffered, can still land on the wire. The dependable choice is Python's `logging` module, which writes each record to stderr as it happens.

---

## Testing the server

The in-memory `Client` used throughout this lesson is also how you test a server, and it plays the same role as [the `TestClient` from Module 0's testing lesson](→ Module 0, the testing lesson): real requests, handled by the real server, with no subprocess or port. With `pytest`, each test gets a connected client from a fixture:

```python
import pytest

from mcp import Client

from registry_server import mcp


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    async with Client(mcp) as c:
        yield c


@pytest.mark.anyio
async def test_lists_both_tools(client: Client):
    tools = await client.list_tools()
    assert {tool.name for tool in tools.tools} == {"get_agent_model", "set_agent_model"}


@pytest.mark.anyio
async def test_known_agent(client: Client):
    result = await client.call_tool("get_agent_model", {"agent_name": "research_agent"})
    assert result.is_error is False
    assert result.content[0].text == "research_agent runs on claude-sonnet"


@pytest.mark.anyio
async def test_unknown_agent_is_a_tool_error(client: Client):
    result = await client.call_tool("get_agent_model", {"agent_name": "ghost_agent"})
    assert result.is_error is True
    assert "research_agent" in result.content[0].text


@pytest.mark.anyio
async def test_invalid_model_never_reaches_the_tool(client: Client):
    result = await client.call_tool("set_agent_model", {"agent_name": "support_agent", "model": "gpt-5"})
    assert result.is_error is True
```
```
....                                                                     [100%]
4 passed in 0.68s
```
*(illustrative — run with `pytest` against `mcp` 2.2.0; the output shown is that run's real output)*

Two details in the fixtures come from async testing rather than MCP: `@pytest.mark.anyio` lets `pytest` run `async def` tests, and the `anyio_backend` fixture tells it to use `asyncio`. The tests themselves check exactly what the rest of this lesson cared about: that the tool list is what the host will see, that a bad agent name comes back as a tool error the model can read, and that an invalid model never reaches the tool.

---

## Quiz cards

> **Q1.** A tool looks up a customer, and the external CRM it calls times out. What should it raise?
> - A) `MCPError`, since the failure happened outside the tool
> - B) Nothing; it should return the string "Error: CRM timed out"
> - C) `ToolError`, so the model sees the failure and can retry or tell the user ✅
> - D) The original `TimeoutError`, so the full details reach the model
>
> *Explanation:* It's a failure of execution the model can respond to. `MCPError` would hand the model nothing, and a raw exception's text never reaches the model at all.

> **Q2.** On the client side, what's different about a tool that raised `MCPError`?
> - A) The call raises an exception instead of returning a result, so there's no `is_error` flag or content for the model to read ✅
> - B) The result has `is_error` true with the message in `content`
> - C) The result has `is_error` false
> - D) The server retries the call automatically
>
> *Explanation:* `MCPError` becomes a JSON-RPC error. The host gets the error; the model gets a tool result only if the host chooses to create one.

> **Q3.** A server marks its `delete_agent` tool with `destructive_hint=True`. What does that guarantee?
> - A) Hosts will always ask the user before calling it
> - B) Models can't call it without approval
> - C) The SDK will refuse to run it more than once
> - D) Nothing; it's a hint a well-behaved host may use, not a security control ✅
>
> *Explanation:* Annotations describe behavior. Enforcing what an agent may do is the host's job, covered in the least-privilege lesson.

> **Q4.** Why should `mcp.run()` sit under `if __name__ == "__main__":`?
> - A) `MCPServer` refuses to start otherwise
> - B) Tests and tools import the server file to get the `mcp` object, and an unguarded `run()` would start a blocking server on import ✅
> - C) It switches the transport from HTTP to stdio
> - D) It's needed to register the tools
>
> *Explanation:* The decorators register tools when the file is imported. Only running it as a script should start serving.

> **Q5.** What does testing with `Client(mcp)` give you that calling the tool functions directly doesn't?
> - A) Faster tests with no async code
> - B) Access to the server's private variables
> - C) Real MCP requests through the SDK, so tests cover the schema, validation and error handling a host will actually see ✅
> - D) A network port to test HTTP behavior
>
> *Explanation:* Calling `get_agent_model()` directly skips everything the SDK adds. The in-memory client goes through the whole server, without a subprocess or port.

---

*(End of Concept 4 — final concept of Lesson 6. The lesson continues with the recap and comprehensive sandbox.)*
