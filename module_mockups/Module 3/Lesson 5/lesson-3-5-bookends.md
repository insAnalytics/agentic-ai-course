# The Model Context Protocol

## Intro

> **You'll be able to**
> - Explain the integration problem MCP solves, and the roles of host, client and server
> - Read and write JSON-RPC requests, responses and notifications, and tell a protocol error from a tool execution error
> - Explain why every MCP request carries its own `_meta`, validate it, and negotiate a protocol version
> - Describe what a server can offer (tools, resources and prompts) and who decides to use each
> - Choose between the stdio and Streamable HTTP transports, and build a correct HTTP request for either kind of call

**Why it matters**

Up to now, every tool in this course was a function inside your own program. That's fine for one agent, and it doesn't scale past it: every application that wants the same tools has to rebuild them in its own format. MCP is the shared standard that fixes this, and most agent platforms and a large and growing number of services now support it.

This lesson is the protocol itself, on the wire, without an SDK hiding it. That's deliberate. The next lesson uses the official SDK to build a server in a few lines, and the one after connects the registry agent to servers. Both go much more smoothly when you know exactly what the SDK is sending for you, and what it means when something comes back as an error.

---

## Recap & Practice

### Comprehensive quiz

*(spans all five concepts, mixed order)*

> **Q1.** Who runs the model and the agent loop in an MCP setup?
> - A) The MCP server
> - B) The MCP client
> - C) The host application ✅
> - D) Whichever server the model called most recently
>
> *Explanation:* The host is the AI application. Clients are its connectors, one per server, and servers offer tools but never run the model or see the whole conversation.

> **Q2.** A tool rejects its arguments because a date is in the past. How should the server report that?
> - A) As a JSON-RPC `error` with code `-32602`
> - B) As a result with `"isError": true` and a message the model can act on ✅
> - C) As a notification
> - D) By closing the connection
>
> *Explanation:* The tool ran and the task failed for a reason the model can fix. That's a tool execution error; protocol errors are for requests the server couldn't handle at all.

> **Q3.** Why does an MCP request include a protocol version and client capabilities every single time?
> - A) The server keeps no memory between requests, so each one must carry what it needs ✅
> - B) JSON-RPC requires them on every message
> - C) Servers use them to identify and authorize the caller
> - D) They're only required on the first request of a connection
>
> *Explanation:* MCP is stateless, like the REST and LLM APIs earlier in the course. JSON-RPC itself doesn't define `_meta`, and `clientInfo` must never be used for security decisions.

> **Q4.** A client's request fails with `-32022` and `"supported": ["2025-11-25"]`. What should it do?
> - A) Give up, because the server is too old
> - B) Resend the same request unchanged
> - C) Call `server/discover` and wait for the server to upgrade
> - D) Retry with a version from the supported list that the client also speaks, or report an error if there's none ✅
>
> *Explanation:* The error tells the client exactly which versions the server accepts, so the client can choose a mutual one and retry.

> **Q5.** Which primitive is chosen by the model itself, in the middle of a task?
> - A) Tools ✅
> - B) Resources
> - C) Prompts
> - D) Notifications
>
> *Explanation:* Resources are chosen by the host application and prompts by a person. Tools are the only primitive the model reaches for on its own.

> **Q6.** A developer's stdio server logs "looking up agent..." with `print()` before each lookup. What happens?
> - A) The log line appears in the host's chat window
> - B) The log goes to stderr, which the client ignores
> - C) The log line lands in stdout between protocol messages, and the client can't read it as a message ✅
> - D) Nothing; stdio servers can't print
>
> *Explanation:* On stdio, stdout carries protocol messages only. `print()` writes to stdout by default, so logs must go to stderr.

> **Q7.** A Streamable HTTP request's `Mcp-Name` header says one tool while its body calls another. What must the server do?
> - A) Trust the body, since it's the source of truth
> - B) Reject it with HTTP 400 and the header-mismatch error ✅
> - C) Trust the header, since gateways read it
> - D) Run both tools
>
> *Explanation:* Headers let gateways route without parsing the body, so they must agree with it. A mismatch could be used to slip a request past rules written against its headers.

> **Q8.** A server needs to let an agent build up a draft across several tool calls. What's the stateless way to do it?
> - A) Remember the draft per connection
> - B) Keep the draft in the client's `_meta`
> - C) Store it under the caller's `clientInfo` name
> - D) Return a server-minted draft ID from a creation tool, and accept it as an argument on later calls ✅
>
> *Explanation:* An explicit handle makes the state visible and independent of any connection. `clientInfo` is self-reported and can't identify a caller safely.

> **Q9.** What does the MCP server see when the model calls one of its tools?
> - A) The whole conversation, so it has context
> - B) The tool's name and arguments, sent by the host ✅
> - C) The model's reasoning before the call
> - D) The results of every other server's tools
>
> *Explanation:* Servers get only what they need for the call. The conversation stays with the host, and servers can't see into each other.

> **Q10.** Two requests with ids 5 and 6 are in flight, and the response for id 6 arrives first. What does the client do?
> - A) Match it to request 6 by its id, and keep waiting for 5 ✅
> - B) Treat it as the answer to request 5
> - C) Discard it and resend both requests
> - D) Wait for 5 before reading it
>
> *Explanation:* Each response carries the id of the request it answers, so arrival order doesn't matter.

---

### Comprehensive sandbox

*(applied, multi-file — a client for a registry MCP server over Streamable HTTP)*

**Task shown to learner:** `server.py` simulates the agent registry's MCP server over Streamable HTTP. `handle_http(headers, body)` takes the request headers and JSON body and returns `(status, response_body)`, just as an HTTP call would. It supports one protocol version, `2025-11-25`, and one tool, `get_agent_model`. Complete `RegistryClient` in `client.py`. `build_http_request` and `to_tool_output`, from this lesson's exercises, are already in the file.

- **`_send_once(method, params)`:**
  - build a JSON-RPC message with a fresh, increasing `id`
  - give it a `_meta` with `self.version`, a `clientInfo` and empty `clientCapabilities`
  - build its headers with `build_http_request`, send it with `self.send`, and return the parsed response body
- **`request(method, params)`:**
  - send once
  - if the response is a `-32022` error, switch `self.version` to the first of `self.preferred_versions` that appears in the error's `supported` list, and send once more
  - if there's no version in common, return the error as it is
  - return the response
- **`call_tool(name, arguments)`:** make a `tools/call` request and return `to_tool_output(response)`.

**Tab: `server.py`** (read-only)
```python
# a simulated Streamable HTTP MCP server for the agent registry -- read-only
import json

SUPPORTED_VERSIONS = ["2025-11-25"]
AGENTS = {"research_agent": "claude-sonnet", "support_agent": "claude-haiku"}
REQUIRED_META = ["io.modelcontextprotocol/protocolVersion", "io.modelcontextprotocol/clientCapabilities"]

received = []   # every (headers, message) the server has been sent, for inspection

def _error(request_id, code, message, data=None, status=400):
    error = {"code": code, "message": message}
    if data is not None:
        error["data"] = data
    return status, json.dumps({"jsonrpc": "2.0", "id": request_id, "error": error})

def _result(request_id, result):
    return 200, json.dumps({"jsonrpc": "2.0", "id": request_id, "result": {"resultType": "complete", **result}})

def handle_http(headers: dict, body: str) -> tuple:
    message = json.loads(body)
    received.append((headers, message))
    request_id = message.get("id")
    params = message.get("params", {})
    meta = params.get("_meta", {})

    for field in REQUIRED_META:
        if field not in meta:
            return _error(request_id, -32602, f"Invalid params: missing _meta field {field}")
    version = meta["io.modelcontextprotocol/protocolVersion"]
    if headers.get("MCP-Protocol-Version") != version or headers.get("Mcp-Method") != message["method"]:
        return _error(request_id, -32020, "Header mismatch")
    if version not in SUPPORTED_VERSIONS:
        return _error(request_id, -32022, "Unsupported protocol version", {"supported": SUPPORTED_VERSIONS, "requested": version})

    method = message["method"]
    if method == "tools/call":
        if headers.get("Mcp-Name") != params.get("name"):
            return _error(request_id, -32020, "Header mismatch")
        if params["name"] != "get_agent_model":
            return _error(request_id, -32602, f"Unknown tool: {params['name']}")
        agent = params.get("arguments", {}).get("agent_name")
        if agent not in AGENTS:
            return _result(request_id, {"content": [{"type": "text", "text": f"No agent named '{agent}'. Known agents: {', '.join(AGENTS)}."}], "isError": True})
        return _result(request_id, {"content": [{"type": "text", "text": f"{agent} runs on {AGENTS[agent]}"}], "isError": False})
    return _error(request_id, -32601, f"Method not found: {method}", status=404)
```

**Tab: `client.py`** (starter, entry file)
```python
import json

NAMED_METHODS = {"tools/call": "name", "prompts/get": "name", "resources/read": "uri"}

def build_http_request(message: dict) -> tuple:
    params = message.get("params", {})
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "MCP-Protocol-Version": params["_meta"]["io.modelcontextprotocol/protocolVersion"],
        "Mcp-Method": message["method"],
    }
    if message["method"] in NAMED_METHODS:
        headers["Mcp-Name"] = params[NAMED_METHODS[message["method"]]]
    return headers, json.dumps(message)

def to_tool_output(response: dict) -> tuple:
    if "error" in response:
        error = response["error"]
        return (f"Error: MCP error {error['code']}: {error['message']}", True)
    result = response["result"]
    result_type = result["resultType"]
    if result_type == "complete":
        text = "\n".join(item["text"] for item in result.get("content", []) if item["type"] == "text")
        return (text, result.get("isError", False))
    if result_type == "input_required":
        return ("Error: the server needs more input to finish this call, which this client doesn't support", True)
    return (f"Error: unrecognised resultType '{result_type}'", True)

class RegistryClient:
    def __init__(self, send, preferred_versions: list):
        self.send = send
        self.preferred_versions = preferred_versions
        self.version = preferred_versions[0]
        self.next_id = 1

    def request(self, method: str, params: dict) -> dict:
        # TODO: send once; if the error is -32022, switch to the first preferred version
        # the server supports and send once more. Return the response dict.
        ...

    def _send_once(self, method: str, params: dict) -> dict:
        # TODO: build the message with a fresh id and _meta for self.version,
        # build its headers, send it, and return the parsed response body.
        ...

    def call_tool(self, name: str, arguments: dict) -> tuple:
        # TODO: make a tools/call request and return (text, is_error)
        ...
```

**Hidden tests:**
```python
import server
from client import RegistryClient

server.received.clear()
client = RegistryClient(server.handle_http, ["2026-07-28", "2025-11-25"])

# 1. the first call is refused for its version, falls back, and succeeds
assert client.call_tool("get_agent_model", {"agent_name": "research_agent"}) == ("research_agent runs on claude-sonnet", False)
assert len(server.received) == 2
assert server.received[0][1]["params"]["_meta"]["io.modelcontextprotocol/protocolVersion"] == "2026-07-28"
assert server.received[1][1]["params"]["_meta"]["io.modelcontextprotocol/protocolVersion"] == "2025-11-25"

# 2. later calls use the fallback straight away: one request, not two
assert client.call_tool("get_agent_model", {"agent_name": "support_agent"}) == ("support_agent runs on claude-haiku", False)
assert len(server.received) == 3

# 3. every request carried matching headers, required _meta, and a fresh id
ids = []
for headers, message in server.received:
    meta = message["params"]["_meta"]
    assert headers["MCP-Protocol-Version"] == meta["io.modelcontextprotocol/protocolVersion"]
    assert headers["Mcp-Method"] == message["method"] and headers["Mcp-Name"] == message["params"]["name"]
    assert "io.modelcontextprotocol/clientCapabilities" in meta
    ids.append(message["id"])
assert len(set(ids)) == len(ids)

# 4. a tool execution error reaches the model as a flagged failure, with the server's words
text, is_error = client.call_tool("get_agent_model", {"agent_name": "ghost_agent"})
assert is_error is True and "ghost_agent" in text and "research_agent" in text

# 5. a protocol error does too
text, is_error = client.call_tool("delete_agent", {"agent_name": "research_agent"})
assert is_error is True and text.startswith("Error:") and "-32602" in text

# 6. a server with no version in common: the client gives up after one fallback attempt, flagged as an error
server.received.clear()
stuck = RegistryClient(server.handle_http, ["2026-07-28"])
text, is_error = stuck.call_tool("get_agent_model", {"agent_name": "research_agent"})
assert is_error is True and "-32022" in text
assert len(server.received) == 1
```

**Hint (shown on request):** `_send_once` is the demo from the statelessness concept plus the exercise from the transports concept: build `_meta`, merge it into `params` with `{**params, "_meta": meta}`, then `build_http_request`, `self.send`, and `json.loads`. In `request`, check `response.get("error")` before reading its code, since a successful response has no `error` key.

**Reference solution — `RegistryClient` in `client.py`:**
```python
class RegistryClient:
    def __init__(self, send, preferred_versions: list):
        self.send = send
        self.preferred_versions = preferred_versions
        self.version = preferred_versions[0]
        self.next_id = 1

    def request(self, method: str, params: dict) -> dict:
        response = self._send_once(method, params)
        error = response.get("error")
        if error and error["code"] == -32022:
            supported = error["data"]["supported"]
            for version in self.preferred_versions:
                if version in supported:
                    self.version = version
                    return self._send_once(method, params)
        return response

    def _send_once(self, method: str, params: dict) -> dict:
        meta = {
            "io.modelcontextprotocol/protocolVersion": self.version,
            "io.modelcontextprotocol/clientInfo": {"name": "registry-agent", "version": "1.0.0"},
            "io.modelcontextprotocol/clientCapabilities": {},
        }
        message = {"jsonrpc": "2.0", "id": self.next_id, "method": method, "params": {**params, "_meta": meta}}
        self.next_id += 1
        headers, body = build_http_request(message)
        status, response_body = self.send(headers, body)
        return json.loads(response_body)

    def call_tool(self, name: str, arguments: dict) -> tuple:
        response = self.request("tools/call", {"name": name, "arguments": arguments})
        return to_tool_output(response)
```

**Explanation:** The sandbox puts the whole lesson on one wire:

- **Negotiation:** test 1 shows the client's first request refused for its version, then a fallback retry that succeeds.
- **Statelessness:** test 2 shows the client remembering the version *itself* and using it straight away on the next call. The server remembers nothing, so the client has to.
- **The wire format:** test 3 checks every request had matching headers, the required `_meta` and a unique id.
- **Both failure kinds:** tests 4 and 5 check that a tool error and a protocol error both reach the model as flagged failures.
- **No loop of retries:** test 6 checks that a server with no version in common gets one attempt, not a loop.

This client is also most of what the official SDK's client does for you on every request. Knowing that makes the next two lessons read as "the SDK does this part" rather than as magic.
