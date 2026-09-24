# Module 3, Lesson 6 — Concept 2: Answering `tools/call` by hand

---

## Five ways a tool call can end

`tools/call` is where the server's real work happens, and it's also where most of the decisions are. [Lesson 5](→ this module, the model context protocol lesson, json rpc as the message format concept) showed that MCP has two ways to report a failure: a **protocol error** (a JSON-RPC `error`, no result) or a **tool error** (a normal result with `isError: true`). The spec says which to use when, and the rule of thumb behind it is simple: *could the model fix this by calling differently?* If yes, it's a tool error, because the model should see it. If no, it's a protocol error.

Applied to every way a call can end:

| What happened | How it's reported | Why |
|---|---|---|
| The tool ran and succeeded | a result, `isError: false` | |
| No tool by that name | protocol error, `-32602` | the request itself is wrong for this server |
| The arguments failed validation | tool error | the model chose the arguments, and can choose better ones |
| The tool refused, e.g. an unknown agent | tool error | the model can pick a different agent, or tell the user |
| The tool crashed with a bug | tool error, with a generic message | the model should know it failed, but not see your internals |

Invalid arguments being a *tool* error surprises some people, since the request looks malformed. But the spec lists input validation errors explicitly as tool execution errors, for exactly the reason in the table: the model wrote those arguments, and a clear message like "agent_name: Field required" lets it fix them on the next call.

---

## Raise, don't return

Tools in this module have so far reported failure by *returning* a string starting with "Error:", as in [Lesson 2's validation concept](→ this module, tool schemas and argument validation lesson, validate and return failures as observations concept). That worked because your own loop was the one reading the result. Over MCP, the server has to set `isError` on the wire, and a returned string can't do that: to the server, a returned string is just a successful answer that happens to start with "Error".

So a tool served over MCP signals failure by **raising** an exception the server recognizes, and the server turns it into `isError: true`. Here that exception is `ToolError`. A second exception, `ProtocolError`, lets a handler reject a request outright with a JSON-RPC error code. The SDK in the next concept has the same two exceptions under the same idea.

---

## The handler

```python
import sys
from pydantic import BaseModel, Field, ValidationError

REGISTRY = {"research_agent": "claude-sonnet", "support_agent": "claude-haiku"}

class ToolError(Exception):
    """A failure the model should see and can react to."""

class ProtocolError(Exception):
    """A request the server can't handle at all; becomes a JSON-RPC error."""
    def __init__(self, code: int, message: str):
        super().__init__(message)
        self.code = code

class GetAgentModelArgs(BaseModel):
    agent_name: str = Field(description="Exact registered name of the agent.")

def get_agent_model(agent_name: str) -> str:
    """Return the model one registered agent runs on, looked up by its exact name."""
    if agent_name not in REGISTRY:
        raise ToolError(f"No agent named '{agent_name}'. Registered agents: {', '.join(REGISTRY)}.")
    return f"{agent_name} runs on {REGISTRY[agent_name]}"

class GetAgentOwnerArgs(BaseModel):
    agent_name: str = Field(description="Exact registered name of the agent.")

def get_agent_owner(agent_name: str) -> str:
    """Return the team that owns a registered agent."""
    # a bug: this lookup table was never filled in
    owners = {}
    return owners[agent_name]

TOOLS = {"get_agent_model": (get_agent_model, GetAgentModelArgs), "get_agent_owner": (get_agent_owner, GetAgentOwnerArgs)}

def text_result(text: str, is_error: bool = False) -> dict:
    return {"content": [{"type": "text", "text": text}], "isError": is_error}

def handle_tools_call(params: dict) -> dict:
    name = params.get("name")
    if name not in TOOLS:
        raise ProtocolError(-32602, f"Unknown tool: {name}")
    function, args_model = TOOLS[name]

    try:
        args = args_model(**params.get("arguments", {}))
    except ValidationError as e:
        problems = "; ".join(f"{'.'.join(str(part) for part in err['loc'])}: {err['msg']}" for err in e.errors())
        return text_result(f"Invalid arguments for {name}: {problems}", is_error=True)

    try:
        return text_result(str(function(**args.model_dump())))
    except ToolError as e:
        return text_result(str(e), is_error=True)
    except Exception as e:
        # an unexpected crash: log the details for yourself, tell the model only that it failed
        print(f"tool {name} crashed: {e!r}", file=sys.stderr)
        return text_result(f"Error executing tool {name}", is_error=True)
```

Five calls, one for each row of the table:

```python
cases = [
    {"name": "get_agent_model", "arguments": {"agent_name": "research_agent"}},
    {"name": "get_agent_model", "arguments": {"agent_name": "ghost_agent"}},
    {"name": "get_agent_model", "arguments": {"name": "research_agent"}},
    {"name": "get_agent_owner", "arguments": {"agent_name": "research_agent"}},
    {"name": "delete_agent", "arguments": {"agent_name": "research_agent"}},
]
for params in cases:
    try:
        result = handle_tools_call(params)
        print(f"{params['name']}: isError={result['isError']} -> {result['content'][0]['text']}")
    except ProtocolError as e:
        print(f"{params['name']}: protocol error {e.code} -> {e}")
```
```
get_agent_model: isError=False -> research_agent runs on claude-sonnet
get_agent_model: isError=True -> No agent named 'ghost_agent'. Registered agents: research_agent, support_agent.
get_agent_model: isError=True -> Invalid arguments for get_agent_model: agent_name: Field required
get_agent_owner: isError=True -> Error executing tool get_agent_owner
delete_agent: protocol error -32602 -> Unknown tool: delete_agent
```
*(runs live, shows output — read-only demo snippet, not graded; the crash's details go to stderr, which the demo doesn't show)*

Step by step:

- **Look up the tool first.** An unknown name raises `ProtocolError`, since no argument the model could send would make `delete_agent` exist on this server.
- **Validate the arguments with the tool's model.** Constructing `args_model(**arguments)` runs [Pydantic's validation](→ this module, tool schemas and argument validation lesson, validate and return failures as observations concept), and a `ValidationError` becomes a tool error. `e.errors()` gives one entry per problem, trimmed here to "field: message", the same trimming Lesson 2 did, so the model gets a short, specific message instead of Pydantic's full report.
- **Call the function with the validated values.** `args.model_dump()` turns the validated model back into a dict to unpack into the function, so the function only ever receives arguments that passed validation.
- **Catch `ToolError` for the tool's own refusals,** and pass its message through unchanged. The tool author wrote that message for the model.
- **Catch everything else as a crash.** A `KeyError` from a bug is logged to stderr in full for the server's owner, and the model gets only "Error executing tool get_agent_owner".

That last point is a security rule, not a style choice. Exception messages from deep inside a server regularly contain things that should never leave it: database connection strings, file paths, API keys, internal hostnames. Anything in a tool result goes to the model, and from there possibly to the user or into logs elsewhere. So the details of an *unexpected* failure stay on the server, and only failures the tool author deliberately described travel to the model.

---

## Wiring it into the server

`tools/call` joins the dispatch table from [the previous concept](→ this lesson, what a server does one request in one response out concept), and `handle_request` turns a raised `ProtocolError` into a proper error response:

```python
METHOD_HANDLERS["tools/call"] = handle_tools_call

def handle_request(request: dict) -> dict:
    # ... the _meta checks and method lookup from the previous concept ...
    try:
        return result_response(request.get("id"), handler(request["params"]))
    except ProtocolError as e:
        return error_response(request.get("id"), e.code, str(e))
```
*(illustrative — the full version is this lesson's comprehensive sandbox)*

---

## Quiz cards

> **Q1.** A model calls a server's `set_agent_model` with `model: "gpt-5"`, which the arguments model doesn't allow. How should the server report it?
> - A) As a JSON-RPC error, since the request is invalid
> - B) As a tool error with `isError: true` and a message naming the bad field, so the model can correct it ✅
> - C) By ignoring the bad value and using a default model
> - D) By running the tool anyway and letting it fail
>
> *Explanation:* The spec classifies input validation errors as tool execution errors. The model chose the value, so it should see the problem and get the chance to fix it.

> **Q2.** Why does a tool served over MCP raise `ToolError` instead of returning `"Error: no such agent"`?
> - A) Returned strings are too long for MCP
> - B) Python functions can't return strings from inside a server
> - C) A returned string is sent as a successful result with `isError: false`, so the failure flag never reaches the client ✅
> - D) Raising is faster than returning
>
> *Explanation:* The server only knows a call failed if the tool tells it so. Raising a recognized exception is how the tool says "this failed", and the server sets `isError` from that.

> **Q3.** A tool crashes with `ConnectionError: could not reach postgres://admin:secret@db.internal/registry`. What should the model receive?
> - A) The full exception message, so it knows exactly what went wrong
> - B) A protocol error with the exception as its `data`
> - C) Nothing; the call should be retried silently
> - D) A tool error with a generic message like "Error executing tool audit_agent", while the full details are logged on the server ✅
>
> *Explanation:* Unexpected exceptions can contain credentials and internal details. The model needs to know the call failed, and only the server's owner needs the specifics.

> **Q4.** Which of these should be a protocol error rather than a tool error?
> - A) A call to a tool name the server doesn't have ✅
> - B) An argument that fails validation
> - C) A lookup for an agent that doesn't exist
> - D) An upstream API timing out inside the tool
>
> *Explanation:* No change of arguments makes a nonexistent tool exist on this server. The other three are all problems the model can respond to, so the spec makes them tool errors.

> **Q5.** Why does the handler call the function with `args.model_dump()` rather than the raw `arguments` dict?
> - A) The raw dict is in the wrong order
> - B) So the function only ever receives values that passed validation, in the types the model declares ✅
> - C) `model_dump()` removes the tool's name from the arguments
> - D) It's required by JSON-RPC
>
> *Explanation:* Validating and then using the validated copy means a function never has to re-check its own inputs, and never sees a value the schema didn't allow.

---

## Applied sandbox exercise

*(graded — the `tools/call` handler)*

**Task shown to learner:** Implement `handle_tools_call(params)` for a registry server with three tools. `ToolError`, `ProtocolError`, `TOOLS` and `text_result` are provided.

- If `params["name"]` isn't in `TOOLS`, **raise** `ProtocolError(-32602, ...)` with a message naming the tool.
- Validate `params["arguments"]` (treat a missing `arguments` as `{}`) with the tool's model. On a `ValidationError`, **return** a tool error whose text names each failing field.
- Call the function with the validated values and return its result as text.
- If the function raises `ToolError`, return a tool error with exactly that message.
- If it raises anything else, return a tool error that names the tool but doesn't include the exception's text, and log the details to stderr.

**Provided code:**
```python
import sys
from typing import Literal
from pydantic import BaseModel, Field, ValidationError

REGISTRY = {"research_agent": "claude-sonnet", "support_agent": "claude-haiku"}

class ToolError(Exception):
    """A failure the model should see and can react to."""

class ProtocolError(Exception):
    """A request the server can't handle at all; becomes a JSON-RPC error."""
    def __init__(self, code: int, message: str):
        super().__init__(message)
        self.code = code

class GetAgentModelArgs(BaseModel):
    agent_name: str = Field(description="Exact registered name of the agent.")

class SetAgentModelArgs(BaseModel):
    agent_name: str = Field(description="Exact registered name of the agent.")
    model: Literal["claude-sonnet", "claude-haiku", "claude-opus"] = Field(description="The model to switch to.")

class AuditArgs(BaseModel):
    agent_name: str

def get_agent_model(agent_name: str) -> str:
    """Return the model one registered agent runs on."""
    if agent_name not in REGISTRY:
        raise ToolError(f"No agent named '{agent_name}'.")
    return REGISTRY[agent_name]

def set_agent_model(agent_name: str, model: str) -> str:
    """Switch a registered agent to a different model."""
    if agent_name not in REGISTRY:
        raise ToolError(f"No agent named '{agent_name}'.")
    REGISTRY[agent_name] = model
    return f"{agent_name} now runs on {model}"

def audit_agent(agent_name: str) -> str:
    """Run a configuration audit on an agent."""
    raise ConnectionError("could not reach postgres://admin:hunter2@db.internal:5432/registry")

TOOLS = {
    "get_agent_model": (get_agent_model, GetAgentModelArgs),
    "set_agent_model": (set_agent_model, SetAgentModelArgs),
    "audit_agent": (audit_agent, AuditArgs),
}

def text_result(text: str, is_error: bool = False) -> dict:
    return {"content": [{"type": "text", "text": text}], "isError": is_error}
```

**Starter code:**
```python
def handle_tools_call(params: dict) -> dict:
    # TODO: look up the tool, validate its arguments, run it, and report the outcome
    ...
```

**Hidden tests:**
```python
# 1. success
r = handle_tools_call({"name": "get_agent_model", "arguments": {"agent_name": "research_agent"}})
assert r == {"content": [{"type": "text", "text": "claude-sonnet"}], "isError": False}, r

# 2. an unknown tool is a protocol error, not a result
try:
    handle_tools_call({"name": "delete_agent", "arguments": {}})
    raise AssertionError("expected ProtocolError")
except ProtocolError as e:
    assert e.code == -32602 and "delete_agent" in str(e)

# 3. invalid arguments are a tool error naming the field, and the tool never runs
r = handle_tools_call({"name": "set_agent_model", "arguments": {"agent_name": "research_agent", "model": "gpt-5"}})
assert r["isError"] is True and "model" in r["content"][0]["text"]
assert REGISTRY["research_agent"] == "claude-sonnet"
r = handle_tools_call({"name": "get_agent_model", "arguments": {}})
assert r["isError"] is True and "agent_name" in r["content"][0]["text"]

# 4. a ToolError reaches the model with its own message
r = handle_tools_call({"name": "get_agent_model", "arguments": {"agent_name": "ghost_agent"}})
assert r == {"content": [{"type": "text", "text": "No agent named 'ghost_agent'."}], "isError": True}, r

# 5. an unexpected crash is flagged, but its internal details never leave the server
r = handle_tools_call({"name": "audit_agent", "arguments": {"agent_name": "research_agent"}})
assert r["isError"] is True and "audit_agent" in r["content"][0]["text"]
assert "hunter2" not in r["content"][0]["text"] and "postgres" not in r["content"][0]["text"]

# 6. valid arguments reach the tool, and the write happens
r = handle_tools_call({"name": "set_agent_model", "arguments": {"agent_name": "support_agent", "model": "claude-opus"}})
assert r["isError"] is False and REGISTRY["support_agent"] == "claude-opus"

# 7. a call with no arguments key at all is still handled
r = handle_tools_call({"name": "get_agent_model"})
assert r["isError"] is True
```

**Hint (shown on request):** Two separate `try` blocks keep the cases apart: one around building the arguments model (catching `ValidationError`), and one around calling the function (catching `ToolError` first, then `Exception`). The order of the two `except` clauses in the second block matters, because `ToolError` is itself an `Exception`.

**Reference solution:**
```python
def handle_tools_call(params: dict) -> dict:
    name = params.get("name")
    if name not in TOOLS:
        raise ProtocolError(-32602, f"Unknown tool: {name}")
    function, args_model = TOOLS[name]

    try:
        args = args_model(**params.get("arguments", {}))
    except ValidationError as e:
        problems = "; ".join(f"{'.'.join(str(part) for part in err['loc'])}: {err['msg']}" for err in e.errors())
        return text_result(f"Invalid arguments for {name}: {problems}", is_error=True)

    try:
        return text_result(str(function(**args.model_dump())))
    except ToolError as e:
        return text_result(str(e), is_error=True)
    except Exception as e:
        print(f"tool {name} crashed: {e!r}", file=sys.stderr)
        return text_result(f"Error executing tool {name}", is_error=True)
```

**Explanation:** The two `try` blocks map onto the table at the top of this concept: bad arguments are caught before the tool runs, which test 3 confirms by checking the registry wasn't changed. `ToolError` passes its message through word for word (test 4), because the tool author wrote it for the model. The final `except Exception` is the safety net test 5 checks: the audit tool's crash message contains a database password, and none of it reaches the result. The unknown tool raises rather than returns (test 2), leaving `handle_request` to turn it into a JSON-RPC error.

---

*(End of Concept 2. This lesson continues with Concept 3 — the same server with the official SDK.)*
