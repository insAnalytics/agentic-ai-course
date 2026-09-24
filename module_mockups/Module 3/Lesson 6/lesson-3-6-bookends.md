# Building an MCP Server

## Intro

> **You'll be able to**
> - Write the core of an MCP server by hand: one function that checks a request, routes it, and returns a JSON-RPC response
> - Answer `server/discover`, `tools/list` and `tools/call`, with tool schemas generated from Pydantic models
> - Report every way a tool call can end the way the spec intends, as a result, a tool error or a protocol error, without leaking a crashed tool's internals
> - Build the same server with the official Python SDK, and say exactly what the SDK now does for you
> - Run an SDK server over stdio or Streamable HTTP, mark tools with behavior hints, and test it with the in-memory client

**Why it matters**

[Lesson 5](→ this module, the model context protocol lesson) looked at MCP from the client's side of the wire. This lesson crosses to the other side and puts the agent registry's tools behind a real server, which any MCP host can then connect to: an IDE assistant, a chat app, or the registry agent itself in [the next lesson](→ this module, connecting an agent to mcp servers lesson).

With the SDK, a server is a handful of decorated functions, and that's how you'll build real ones. The hand-written version comes first on purpose. The decisions a server makes, which failures the model sees, what a crash is allowed to reveal, which checks happen before any tool runs, don't disappear when the SDK makes them for you. Knowing them is what lets you debug a server that isn't behaving, and tell whether a third-party server is one you'd trust.

---

## Recap & Practice

### Comprehensive quiz

*(spans all four concepts, mixed order)*

> **Q1.** Why can the core of an MCP server be a single function from request to response?
> - A) JSON-RPC allows only one request per connection
> - B) The SDK requires servers to be written that way
> - C) MCP is stateless, so each request carries everything needed to answer it ✅
> - D) Servers can only offer one tool at a time
>
> *Explanation:* With no session to consult, answering a request needs only the request and the server's own data. That makes the core a plain function, which is easy to test.

> **Q2.** A model calls a tool with an argument that fails validation. How should the server report it?
> - A) As a protocol error, `-32602`, because the request is invalid
> - B) As a tool error with `isError: true`, naming the bad field so the model can fix it ✅
> - C) By substituting a default value and running the tool
> - D) By closing the connection
>
> *Explanation:* The spec lists input validation errors as tool execution errors. The model chose the value, so it's the one who can correct it.

> **Q3.** A tool crashes with an exception whose message includes a database password. What should the model receive?
> - A) A generic "Error executing tool …" tool error, with the details logged on the server ✅
> - B) The full exception message, so it can explain the problem
> - C) A protocol error carrying the exception as `data`
> - D) An empty successful result
>
> *Explanation:* Unexpected exceptions can contain credentials and internal addresses. Only failures the tool author deliberately described should travel to the model.

> **Q4.** Why does a tool raise `ToolError` rather than return `"Error: no such agent"`?
> - A) Python can't return strings from a decorated function
> - B) Returned strings are sent as protocol errors
> - C) The SDK rejects any string starting with "Error"
> - D) A returned string is sent as a successful result with `isError: false`, so the failure flag never reaches the client ✅
>
> *Explanation:* The server can only set `isError` if the tool signals failure, and raising a recognized exception is that signal.

> **Q5.** In the SDK server, where does a tool's description come from?
> - A) Its docstring ✅
> - B) Its function name
> - C) A `description` argument that's required on every `@mcp.tool()`
> - D) The client, which asks the model to describe the tool
>
> *Explanation:* Exactly as in the hand-written server's `function.__doc__`. The decorator also accepts an explicit `description=` if you'd rather not use the docstring.

> **Q6.** What does `destructive_hint=True` on a tool actually do?
> - A) Makes the SDK refuse to run the tool without confirmation
> - B) Prevents the model from calling the tool
> - C) Tells hosts the tool may delete or overwrite something; a well-behaved host may use it, but it enforces nothing ✅
> - D) Makes every call to the tool a protocol error
>
> *Explanation:* Annotations are hints. Enforcing what an agent may do belongs on the host's side, where you control it.

> **Q7.** When should a tool raise the SDK's `MCPError` rather than `ToolError`?
> - A) Whenever an upstream API fails
> - B) When the request should be rejected outright and no different call from the model would help, such as the server being in maintenance ✅
> - C) Whenever the arguments are invalid
> - D) Never; `MCPError` is for the SDK's internal use
>
> *Explanation:* The SDK docs frame it as one question: could a smarter model have avoided this? If yes, `ToolError`; if no, `MCPError`.

> **Q8.** Why should `mcp.run()` sit under `if __name__ == "__main__":`?
> - A) It selects stdio as the transport
> - B) Tests and tools import the server file, and an unguarded `run()` would start a blocking server on import ✅
> - C) The decorators only register tools inside that block
> - D) It's required for Streamable HTTP
>
> *Explanation:* Importing the file should register the tools and nothing more. Only running it as a script should start serving.

---

### Comprehensive sandbox

*(applied, multi-file — a complete hand-written MCP server for the agent registry)*

**Task shown to learner:** `registry_tools.py` holds the registry's four tools, each with its Pydantic arguments model, plus `ToolError`. It's read-only. One tool, `audit_agent`, has a bug that crashes with a database password in its error message. Complete `server.py` so `handle_request(request)` answers any request the way this lesson's server does. The response helpers and `ProtocolError` (which carries a `code` and optional `data`) are provided.

- **`check_meta(params)`:** raise `ProtocolError(-32602, ...)` for a missing required `_meta` field, or `ProtocolError(-32022, "Unsupported protocol version", {"supported": ..., "requested": ...})` for a version not in `SUPPORTED_VERSIONS`.
- **`handle_discover`:** return the server's supported versions, `{"tools": {}}` as capabilities, and its `serverInfo` in `_meta`.
- **`handle_tools_list`:** return every tool with its name, docstring as `description`, and its model's schema as `inputSchema`.
- **`handle_tools_call`:**
  - an unknown tool raises a `-32602` `ProtocolError`
  - invalid arguments return a tool error naming the fields
  - a `ToolError` returns a tool error with its message
  - any other exception returns a generic tool error naming the tool, and logs the details to stderr
  - success returns the result as text
- **`METHOD_HANDLERS`:** map all three methods to their handlers.
- **`handle_request`:** check `_meta`, raise a `-32601` `ProtocolError` for an unknown method, call the handler, and wrap the answer in `result_response`. Turn any `ProtocolError` into an `error_response` that echoes the request's `id`.

**Tab: `registry_tools.py`** (read-only)
```python
# the registry server's tools -- read-only
from typing import Literal
from pydantic import BaseModel, Field

REGISTRY = {"research_agent": "claude-sonnet", "support_agent": "claude-haiku", "billing_agent": "claude-haiku"}

class ToolError(Exception):
    """A failure the model should see and can react to."""

class GetAgentModelArgs(BaseModel):
    agent_name: str = Field(description="Exact registered name of the agent.")

class ListAgentsArgs(BaseModel):
    model: str | None = Field(default=None, description="Only list agents on this model. Omit to list all.")

class SetAgentModelArgs(BaseModel):
    agent_name: str = Field(description="Exact registered name of the agent.")
    model: Literal["claude-sonnet", "claude-haiku", "claude-opus"] = Field(description="The model to switch to.")

class AuditAgentArgs(BaseModel):
    agent_name: str = Field(description="Exact registered name of the agent.")

def get_agent_model(agent_name: str) -> str:
    """Return the model one registered agent runs on, looked up by its exact name."""
    if agent_name not in REGISTRY:
        raise ToolError(f"No agent named '{agent_name}'. Registered agents: {', '.join(REGISTRY)}.")
    return REGISTRY[agent_name]

def list_agents(model: str | None = None) -> str:
    """List registered agent names, optionally only those on one model."""
    return ", ".join(name for name, m in REGISTRY.items() if model is None or m == model)

def set_agent_model(agent_name: str, model: str) -> str:
    """Switch a registered agent to a different model."""
    if agent_name not in REGISTRY:
        raise ToolError(f"No agent named '{agent_name}'.")
    REGISTRY[agent_name] = model
    return f"{agent_name} now runs on {model}"

def audit_agent(agent_name: str) -> str:
    """Run a configuration audit on a registered agent."""
    raise ConnectionError("could not reach postgres://admin:hunter2@db.internal:5432/registry")

TOOLS = {
    "get_agent_model": (get_agent_model, GetAgentModelArgs),
    "list_agents": (list_agents, ListAgentsArgs),
    "set_agent_model": (set_agent_model, SetAgentModelArgs),
    "audit_agent": (audit_agent, AuditAgentArgs),
}
```

**Tab: `server.py`** (starter, entry file)
```python
import sys
from pydantic import ValidationError
from registry_tools import TOOLS, ToolError

SUPPORTED_VERSIONS = ["2026-07-28"]
REQUIRED_META = ["io.modelcontextprotocol/protocolVersion", "io.modelcontextprotocol/clientCapabilities"]

class ProtocolError(Exception):
    def __init__(self, code: int, message: str, data=None):
        super().__init__(message)
        self.code = code
        self.data = data

def error_response(request_id, code: int, message: str, data=None) -> dict:
    error = {"code": code, "message": message}
    if data is not None:
        error["data"] = data
    return {"jsonrpc": "2.0", "id": request_id, "error": error}

def result_response(request_id, result: dict) -> dict:
    return {"jsonrpc": "2.0", "id": request_id, "result": {"resultType": "complete", **result}}

def text_result(text: str, is_error: bool = False) -> dict:
    return {"content": [{"type": "text", "text": text}], "isError": is_error}

def check_meta(params: dict) -> None:
    # TODO: raise ProtocolError(-32602, ...) for a missing required _meta field,
    # or ProtocolError(-32022, ..., data) for an unsupported version
    ...

def handle_discover(params: dict) -> dict:
    # TODO
    ...

def handle_tools_list(params: dict) -> dict:
    # TODO
    ...

def handle_tools_call(params: dict) -> dict:
    # TODO
    ...

METHOD_HANDLERS = {}   # TODO

def handle_request(request: dict) -> dict:
    # TODO: check _meta, route by method, and turn any ProtocolError into an error response
    ...
```

**Hidden tests:**
```python
import registry_tools
from server import handle_request

META = {"io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientCapabilities": {}}
def req(method, params=None, request_id=1, meta=META):
    p = dict(params or {})
    if meta is not None:
        p["_meta"] = meta
    return {"jsonrpc": "2.0", "id": request_id, "method": method, "params": p}
def call(name, arguments, request_id=1):
    return handle_request(req("tools/call", {"name": name, "arguments": arguments}, request_id))

# 1. server/discover
r = handle_request(req("server/discover", request_id="d"))
assert r["id"] == "d" and r["result"]["resultType"] == "complete"
assert r["result"]["supportedVersions"] == ["2026-07-28"] and "tools" in r["result"]["capabilities"]

# 2. tools/list: all four tools, docstring descriptions, generated schemas
r = handle_request(req("tools/list"))
tools = {t["name"]: t for t in r["result"]["tools"]}
assert set(tools) == {"get_agent_model", "list_agents", "set_agent_model", "audit_agent"}
assert tools["set_agent_model"]["description"] == registry_tools.set_agent_model.__doc__
assert tools["set_agent_model"]["inputSchema"]["properties"]["model"]["enum"] == ["claude-sonnet", "claude-haiku", "claude-opus"]

# 3. a successful call
r = call("get_agent_model", {"agent_name": "research_agent"}, request_id=3)
assert r == {"jsonrpc": "2.0", "id": 3, "result": {"resultType": "complete", "content": [{"type": "text", "text": "claude-sonnet"}], "isError": False}}, r

# 4. invalid arguments: a tool error, and the tool never runs
r = call("set_agent_model", {"agent_name": "research_agent", "model": "gpt-5"})
assert r["result"]["isError"] is True and "model" in r["result"]["content"][0]["text"]
assert registry_tools.REGISTRY["research_agent"] == "claude-sonnet"

# 5. a ToolError: its message reaches the model unchanged
r = call("get_agent_model", {"agent_name": "ghost_agent"})
assert r["result"]["isError"] is True and r["result"]["content"][0]["text"].startswith("No agent named 'ghost_agent'")

# 6. a crash: flagged, but no internals leak
r = call("audit_agent", {"agent_name": "research_agent"})
text = r["result"]["content"][0]["text"]
assert r["result"]["isError"] is True and "audit_agent" in text and "hunter2" not in text and "postgres" not in text

# 7. an unknown tool: a protocol error, not a result
r = call("delete_agent", {"agent_name": "research_agent"}, request_id=7)
assert r["id"] == 7 and r["error"]["code"] == -32602 and "result" not in r

# 8. an unknown method
r = handle_request(req("prompts/list", request_id=8))
assert r["id"] == 8 and r["error"]["code"] == -32601

# 9. the stateless checks run before anything else, even for tools/call
r = handle_request(req("tools/call", {"name": "get_agent_model", "arguments": {"agent_name": "research_agent"}}, meta=None))
assert r["error"]["code"] == -32602
r = handle_request(req("tools/list", meta={**META, "io.modelcontextprotocol/protocolVersion": "1900-01-01"}))
assert r["error"]["code"] == -32022 and r["error"]["data"] == {"supported": ["2026-07-28"], "requested": "1900-01-01"}

# 10. a write through the server really happens, and a later read sees it
r = call("set_agent_model", {"agent_name": "billing_agent", "model": "claude-opus"})
assert r["result"]["isError"] is False
assert call("get_agent_model", {"agent_name": "billing_agent"})["result"]["content"][0]["text"] == "claude-opus"
assert call("list_agents", {"model": "claude-opus"})["result"]["content"][0]["text"] == "billing_agent"
```

**Hint (shown on request):** Every earlier exercise in this lesson and Lesson 5 is a piece of this file: `check_meta` is Lesson 5's `validate_request_meta`, rewritten to raise; the three handlers come from this lesson's first two concepts. The one new idea is in `handle_request`: wrap *all* the work, from checking `_meta` to calling the handler, in a single `try`, so any `ProtocolError` raised anywhere along the way becomes an error response in one place.

**Reference solution — `server.py`:**
```python
import sys
from pydantic import ValidationError
from registry_tools import TOOLS, ToolError

SUPPORTED_VERSIONS = ["2026-07-28"]
REQUIRED_META = ["io.modelcontextprotocol/protocolVersion", "io.modelcontextprotocol/clientCapabilities"]

class ProtocolError(Exception):
    def __init__(self, code: int, message: str, data=None):
        super().__init__(message)
        self.code = code
        self.data = data

def error_response(request_id, code: int, message: str, data=None) -> dict:
    error = {"code": code, "message": message}
    if data is not None:
        error["data"] = data
    return {"jsonrpc": "2.0", "id": request_id, "error": error}

def result_response(request_id, result: dict) -> dict:
    return {"jsonrpc": "2.0", "id": request_id, "result": {"resultType": "complete", **result}}

def text_result(text: str, is_error: bool = False) -> dict:
    return {"content": [{"type": "text", "text": text}], "isError": is_error}

def check_meta(params: dict) -> None:
    meta = params.get("_meta", {})
    for field in REQUIRED_META:
        if field not in meta:
            raise ProtocolError(-32602, f"Invalid params: missing _meta field {field}")
    requested = meta["io.modelcontextprotocol/protocolVersion"]
    if requested not in SUPPORTED_VERSIONS:
        raise ProtocolError(-32022, "Unsupported protocol version", {"supported": SUPPORTED_VERSIONS, "requested": requested})

def handle_discover(params: dict) -> dict:
    return {
        "supportedVersions": SUPPORTED_VERSIONS,
        "capabilities": {"tools": {}},
        "_meta": {"io.modelcontextprotocol/serverInfo": {"name": "registry-server", "version": "1.0.0"}},
        "instructions": "Read and update the agent registry.",
    }

def handle_tools_list(params: dict) -> dict:
    return {"tools": [
        {"name": name, "description": function.__doc__, "inputSchema": args_model.model_json_schema()}
        for name, (function, args_model) in TOOLS.items()
    ]}

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

METHOD_HANDLERS = {
    "server/discover": handle_discover,
    "tools/list": handle_tools_list,
    "tools/call": handle_tools_call,
}

def handle_request(request: dict) -> dict:
    request_id = request.get("id")
    params = request.get("params", {})
    try:
        check_meta(params)
        handler = METHOD_HANDLERS.get(request.get("method"))
        if handler is None:
            raise ProtocolError(-32601, f"Method not found: {request.get('method')}")
        return result_response(request_id, handler(params))
    except ProtocolError as e:
        return error_response(request_id, e.code, str(e), e.data)
```

**Explanation:** The whole server is the lesson's decisions, applied in order:

- **Stateless checks first, for every method,** including `tools/call` (test 9). Nothing about a request is trusted until its `_meta` checks out.
- **Protocol errors from one place.** Raising `ProtocolError` means every handler can reject a request the same way, and `handle_request` alone turns it into a JSON-RPC error with the right `id` (tests 7 to 9).
- **Tool outcomes by the spec's rules:**
  - bad arguments never reach the tool (test 4 checks the registry wasn't changed)
  - a `ToolError` passes through word for word (test 5)
  - a crash is reported without its internals (test 6)
- **It really works as a server.** Test 10 writes through `set_agent_model` and then reads the change back through two other tools, all via `handle_request`, exactly as a host would.

Put this function behind the three-line stdio loop from the first concept and any MCP host can use it. The SDK version from the third concept does the same job in two decorated functions, and now you know everything it's doing on your behalf.
