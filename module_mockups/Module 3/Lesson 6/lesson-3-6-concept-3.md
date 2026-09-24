# Module 3, Lesson 6 — Concept 3: The same server with the official SDK

---

## What you wrote by hand, the SDK writes for you

The previous two concepts built a working MCP server from scratch: `_meta` checks, method routing, `server/discover`, `tools/list`, argument validation, and the two kinds of error. All of that is the same in every server, so the official Python SDK, the `mcp` package, does it for you. What's left for you to write is the tools themselves.

The SDK's server class is `MCPServer`, and tools are registered with a decorator. If [Module 0's FastAPI lessons](→ Module 0, the FastAPI lesson) are fresh, this will look very familiar: a decorator registers a plain function, type hints become the contract, and Pydantic's `Field` adds descriptions and constraints. FastAPI turns a function into an HTTP endpoint; `MCPServer` turns a function into an MCP tool.

---

## The registry server, rewritten

```python
from typing import Annotated, Literal

from pydantic import Field

from mcp.server import MCPServer
from mcp.server.mcpserver.exceptions import ToolError

mcp = MCPServer("registry-server", version="1.0.0", instructions="Read and update the agent registry.")

REGISTRY = {"research_agent": "claude-sonnet", "support_agent": "claude-haiku"}

AgentName = Annotated[str, Field(description="Exact registered name of the agent.")]


@mcp.tool()
def get_agent_model(agent_name: AgentName) -> str:
    """Return the model one registered agent runs on, looked up by its exact name."""
    if agent_name not in REGISTRY:
        raise ToolError(f"No agent named '{agent_name}'. Registered agents: {', '.join(REGISTRY)}.")
    return f"{agent_name} runs on {REGISTRY[agent_name]}"


@mcp.tool()
def set_agent_model(
    agent_name: AgentName,
    model: Annotated[Literal["claude-sonnet", "claude-haiku", "claude-opus"], Field(description="The model to switch to.")],
) -> str:
    """Switch a registered agent to a different model."""
    if agent_name not in REGISTRY:
        raise ToolError(f"No agent named '{agent_name}'.")
    REGISTRY[agent_name] = model
    return f"{agent_name} now runs on {model}"


if __name__ == "__main__":
    mcp.run()
```
*(illustrative — this course's in-browser sandbox can't install the SDK, so this code isn't runnable on the page. It was run against the `mcp` package, version 2.2.0.)*

Two tools, and no protocol code at all. `mcp.run()` at the bottom starts the server on stdio, which is the default. [The next concept](→ this lesson, errors running and testing with the sdk concept) covers running it over HTTP instead.

`Annotated[str, Field(description=...)]` is how a plain function parameter gets a description. It attaches Pydantic's `Field` to the type hint, exactly as FastAPI does, and it's the function-parameter equivalent of the `Field` on a model field in [Lesson 1's parameter design](→ this module, designing tools a model can use well lesson, parameter design concept). Defining it once as `AgentName` keeps the same description on both tools.

---

## What the SDK derives from each function

The SDK's own in-memory `Client` can talk to a server object directly, with no subprocess or port, much like FastAPI's `TestClient`. Here it lists the tools and calls them:

```python
import asyncio
import json

from mcp import Client

from registry_server import mcp


async def main() -> None:
    # an in-memory client: talks to the server object directly, with no subprocess or port
    async with Client(mcp) as client:
        tools = await client.list_tools()
        for tool in tools.tools:
            print(tool.name, "->", tool.description)
        print(json.dumps(tools.tools[1].input_schema, indent=2))

        for name, arguments in [
            ("get_agent_model", {"agent_name": "research_agent"}),
            ("get_agent_model", {"agent_name": "ghost_agent"}),
            ("set_agent_model", {"agent_name": "research_agent", "model": "gpt-5"}),
        ]:
            result = await client.call_tool(name, arguments)
            print(f"{name}: is_error={result.is_error} -> {result.content[0].text}")


asyncio.run(main())
```
```
get_agent_model -> Return the model one registered agent runs on, looked up by its exact name.
set_agent_model -> Switch a registered agent to a different model.
{
  "type": "object",
  "properties": {
    "agent_name": {
      "description": "Exact registered name of the agent.",
      "title": "Agent Name",
      "type": "string"
    },
    "model": {
      "description": "The model to switch to.",
      "enum": [
        "claude-sonnet",
        "claude-haiku",
        "claude-opus"
      ],
      "title": "Model",
      "type": "string"
    }
  },
  "required": [
    "agent_name",
    "model"
  ],
  "title": "set_agent_modelArguments"
}
get_agent_model: is_error=False -> research_agent runs on claude-sonnet
get_agent_model: is_error=True -> Error executing tool get_agent_model: No agent named 'ghost_agent'. Registered agents: research_agent, support_agent.
set_agent_model: is_error=True -> Error executing tool set_agent_model: 1 validation error for set_agent_modelArguments
model
  Input should be 'claude-sonnet', 'claude-haiku' or 'claude-opus' [type=literal_error, input_value='gpt-5', input_type=str]
    For further information visit https://errors.pydantic.dev/2.13/v/literal_error
```
*(illustrative — run against `mcp` 2.2.0; the output shown is that run's real output)*

Reading that output against the hand-written server:

| In the hand-written server | In the SDK |
|---|---|
| a `TOOLS` table of functions and arguments models | `@mcp.tool()` on each function |
| a Pydantic model per tool, for the schema | the function's own type hints; `Annotated` and `Field` add descriptions and constraints |
| `function.__doc__` as the description | the docstring, the same way |
| `handle_tools_list` | built in: the tool list above came from the decorators alone |
| validating arguments and trimming the error | built in, but the full Pydantic message is sent, not a trimmed one |
| raising your own `ToolError` | raising the SDK's `ToolError`; it prefixes "Error executing tool …" |
| raising `ProtocolError` | raising the SDK's `MCPError` |
| `_meta` checks, `server/discover`, routing, JSON-RPC, transports | all built in |

The `Literal` type became an `enum` in the schema, just as in [Lesson 1](→ this module, designing tools a model can use well lesson, parameter design concept), and `"gpt-5"` was rejected before `set_agent_model` ever ran.

Two places where the SDK behaves slightly differently from what you wrote by hand, and both are worth knowing:

- **Validation messages aren't trimmed.** The model receives Pydantic's full report, including a documentation link. It's still an accurate tool error the model can act on, just wordier than [Lesson 2's trimmed version](→ this module, tool schemas and argument validation lesson, validate and return failures as observations concept). If your tools take complicated arguments, that verbosity costs tokens on every failed call.
- **An unknown tool comes back as a tool error.** The spec's error section lists "unknown tool" as a protocol error, but the SDK reports it as a result with `isError: true` and the text `Unknown tool: delete_agent`. Either way the model learns the call failed, and a client must handle both shapes, which is exactly why [Lesson 5's `to_tool_output`](→ this module, the model context protocol lesson, json rpc as the message format concept) treats a protocol error and a tool error the same way.

---

## Why build it by hand first

With the SDK, the registry server is two decorated functions. It's reasonable to ask why this lesson spent two concepts on a hand-written version.

The reason is the same one [Module 2 gave for writing the agent loop by hand before using a framework](→ Module 2, from hand-rolled to a runtime lesson, what control was given up concept): when something goes wrong, you debug what the SDK is doing, not the SDK itself. A tool that doesn't appear in a host is a `tools/list` problem. A model that keeps retrying the same bad call is reading a tool error, and you know where that text comes from. A 400 from an HTTP server is probably a `_meta` or header check. Each of those is something you've now written yourself.

---

## Quiz cards

> **Q1.** In the SDK version, where does a tool's input schema come from?
> - A) A Pydantic model you pass to the decorator
> - B) The function's type hints, with `Annotated` and `Field` adding descriptions and constraints ✅
> - C) A JSON schema written in the docstring
> - D) The client, which sends it with each call
>
> *Explanation:* The SDK builds the schema from the signature itself, the same way FastAPI does for a request body. `Annotated[str, Field(description=...)]` is how a plain parameter gets a description.

> **Q2.** What happens when a client calls `set_agent_model` with `model: "gpt-5"` on the SDK server?
> - A) The function runs and stores `"gpt-5"`
> - B) The SDK raises a Python exception on the server and the call hangs
> - C) The SDK rejects the arguments before the function runs, and returns a tool error with Pydantic's message ✅
> - D) The SDK silently picks the closest allowed model
>
> *Explanation:* The `Literal` type hint is the contract. Validation happens before your code, and the failure goes back to the model as a tool error it can correct.

> **Q3.** Which part of the hand-written server has *no* equivalent you write yourself in the SDK version?
> - A) The docstring on each tool
> - B) The type hints on each parameter
> - C) Raising `ToolError` when an agent doesn't exist
> - D) Checking `_meta` and routing each request by method ✅
>
> *Explanation:* The protocol machinery is the same in every server, so the SDK owns it entirely. Docstrings, type hints and tool-specific failures are still yours, because only you know what your tools do.

> **Q4.** A host calls a tool name the SDK server doesn't have. What does the client get?
> - A) A result with `isError: true` and the text "Unknown tool: …" ✅
> - B) A JSON-RPC error with code `-32601`
> - C) A result with `isError: false` and no content
> - D) Nothing; the request times out
>
> *Explanation:* The SDK reports unknown tools as tool errors, even though the spec's error section lists them among protocol errors. A robust client treats both as failures.

> **Q5.** Why is the SDK's untrimmed validation message worth noticing?
> - A) It's sent to the user instead of the model
> - B) It's wordier than a trimmed message, and every failed call puts all of it in the model's context ✅
> - C) It contains the server's internal file paths
> - D) The model can't read Pydantic's format
>
> *Explanation:* It's still a correct, actionable tool error. The cost is tokens, which matters when a model repeatedly gets complicated arguments wrong.

---

*(End of Concept 3. This lesson continues with Concept 4 — errors, running and testing with the SDK.)*
