# Module 3, Lesson 5 — Concept 5: Transports — how the messages travel

---

## Same messages, two ways to deliver them

Everything so far in this lesson has been about the *content* of MCP messages: JSON-RPC requests and responses, each carrying its own `_meta`. None of it said how a message actually gets from the client to the server. That's the job of a **transport**, and MCP defines two standard ones:

- **stdio**, for a server running as a local program on the same machine as the host
- **Streamable HTTP**, for a server running as a service somewhere on a network

The messages themselves are identical on both. A `tools/call` request looks exactly the same whether it travels down a pipe or inside an HTTP POST, which is one of the payoffs of JSON-RPC keeping everything inside the message body, [as the JSON-RPC concept pointed out](→ this lesson, json rpc as the message format concept).

---

## stdio: a local server as a subprocess

With stdio, the host starts the server itself, as a child process, and talks to it through that process's standard streams:

- the client writes requests to the server's **stdin**
- the server writes responses to its **stdout**
- each message is one line of JSON, and a message may never contain a newline, so a newline always means "end of this message"
- the server may write logs to **stderr**, which the client is free to show, save or ignore

This is the transport for tools that live on the user's own machine: reading local files, running the project's tests, querying a local database. Nothing listens on a network port, so there's no network exposure to secure. The server runs with the same permissions as the user who started the host, which is convenient and also means it can do anything that user can.

### The classic stdio bug: printing to stdout

One rule in the spec is easy to break without noticing: the server must never write anything to stdout that isn't an MCP message. In Python, a stray `print()` does exactly that, because `print()` writes to stdout by default:

```python
import json

def encode_for_stdio(message: dict) -> str:
    # one message per line: json.dumps without indent never contains a newline
    return json.dumps(message) + "\n"

def read_stdout(stream: str) -> list:
    messages = []
    for line in stream.splitlines():
        try:
            messages.append(json.loads(line))
        except json.JSONDecodeError:
            messages.append(f"<unreadable line: {line!r}>")
    return messages

response_1 = {"jsonrpc": "2.0", "id": 1, "result": {"resultType": "complete", "content": [{"type": "text", "text": "claude-sonnet"}]}}
response_2 = {"jsonrpc": "2.0", "id": 2, "result": {"resultType": "complete", "content": [{"type": "text", "text": "active"}]}}

clean_stdout = encode_for_stdio(response_1) + encode_for_stdio(response_2)
print("clean:", [m["id"] for m in read_stdout(clean_stdout)])

# the server's author left a debug print() in a tool, and print() writes to stdout
polluted_stdout = encode_for_stdio(response_1) + "looking up support_agent...\n" + encode_for_stdio(response_2)
for message in read_stdout(polluted_stdout):
    print("polluted:", message if isinstance(message, str) else f"message id {message['id']}")
```
```
clean: [1, 2]
polluted: message id 1
polluted: <unreadable line: 'looking up support_agent...'>
polluted: message id 2
```
*(runs live, shows output — read-only demo snippet, not graded)*

The debug line lands in the middle of the protocol stream, and the client reads it as a malformed message. Depending on the client, that means an error, a dropped connection, or a request that never gets its answer. The fix is to send diagnostic output to stderr instead, with `print(..., file=sys.stderr)` or Python's `logging` module, which writes to stderr by default. It's one of the most common reasons a new stdio server "doesn't work", and nothing about it is visible until a client tries to read the output.

---

## Streamable HTTP: a server as a network service

With Streamable HTTP, the server is its own long-running service with a single URL, its **MCP endpoint**, such as `https://registry.example.com/mcp`. Many clients, from many hosts, can use it at once. This is the transport for shared, remote tools: a company's agent registry, a SaaS product's MCP server, anything that lives on someone else's machine.

Every message is its own HTTP POST to that one endpoint. Here's a `tools/call` request, with the headers the spec requires:

```http
POST /mcp HTTP/1.1
Content-Type: application/json
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: get_agent_model

{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "get_agent_model", "arguments": {"agent_name": "research_agent"}, "_meta": {"io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientCapabilities": {}}}}
```
*(illustrative — the header set is taken from the 2026-07-28 specification)*

The three `MCP-` headers repeat information that's already in the body: the protocol version from `_meta`, the `method`, and the tool's `name` (or a resource's `uri`, for `resources/read`). That looks redundant, and on purpose it is. Load balancers, API gateways and monitoring tools sit in front of real services, and they can route or rate-limit a request by reading its headers, without parsing its JSON body. Because they must match the body, a server rejects a request whose headers disagree with it, with HTTP 400 and MCP's header-mismatch error, `-32020`. Otherwise a gateway could be tricked into treating a request as something it isn't.

### Two ways the answer can come back

The `Accept` header lists two content types because the server may reply either way, and the client must handle both:

- **A single JSON response** (`application/json`): the JSON-RPC response, all at once. This suits quick calls.
- **An SSE stream** (`text/event-stream`): the same [Server-Sent Events from Module 0's real-time lesson](→ Module 0, the real time communication lesson, implementing sse with streamingresponse concept). The server can send progress notifications while it works, then the final response, which ends the stream:

```
data: {"jsonrpc": "2.0", "method": "notifications/progress", "params": {"progressToken": "tok-1", "progress": 40, "total": 100}}

data: {"jsonrpc": "2.0", "id": 1, "result": {"resultType": "complete", "content": [{"type": "text", "text": "Audit complete: 3 issues found."}]}}
```
*(illustrative)*

Every stream belongs to one request, so the stateless design from [earlier in this lesson](→ this lesson, stateless by design concept) holds here too: there's no long-lived session tying requests together, and any server instance behind a load balancer can answer any POST.

### Security that comes with the network

A network service can be reached by things you didn't intend, and the spec's transport rules include three protections:

- **Validate the `Origin` header** on every request, and reject unexpected origins with 403. This blocks a malicious web page in the user's browser from quietly sending requests to an MCP server running on their machine.
- **Bind local servers to localhost** (`127.0.0.1`), not all network interfaces, so a server meant for one machine isn't reachable from the rest of the network.
- **Require authentication**, so a remote server knows who's calling.

These are rules for whoever *runs* a server. The deeper question of what an agent should be allowed to do with the tools it connects to is [this module's least-privilege lesson](→ this module, designing for least privilege lesson).

---

## Choosing between them

| | stdio | Streamable HTTP |
|---|---|---|
| Where the server runs | on the user's machine, started by the host | anywhere, as its own service |
| Who uses it | one host | many hosts and users at once |
| Typical tools | local files, local git, local databases | shared company systems, SaaS products |
| Security concerns | it runs with the user's own permissions | Origin checks, authentication, network exposure |
| Scaling | one process per host | many instances behind a load balancer |

The rule of thumb: if the tool is about *this* user's machine, use stdio. If it's a shared system that lives elsewhere, use Streamable HTTP. [Lesson 6](→ this module, building an mcp server lesson) builds a server that can run either way, since the SDK handles the transport and the tool code doesn't change.

---

## Quiz cards

> **Q1.** A developer's new stdio server works when tested by hand but fails when a host connects. The server's tools contain `print()` calls for debugging. What's the likely cause?
> - A) stdio servers can't run Python code
> - B) The `print()` output goes to stdout, corrupting the stream of protocol messages the client reads ✅
> - C) The host's model can't read printed text
> - D) `print()` is too slow for real-time protocols
>
> *Explanation:* On stdio, stdout is reserved for MCP messages only. Logs belong on stderr, via `print(..., file=sys.stderr)` or the `logging` module.

> **Q2.** Why does Streamable HTTP repeat the method and tool name in headers, when they're already in the JSON body?
> - A) The JSON body is optional over HTTP
> - B) HTTP servers can't parse JSON bodies
> - C) So load balancers, gateways and monitoring can route and inspect requests without parsing the body ✅
> - D) The headers replace `_meta` on HTTP
>
> *Explanation:* The headers are for the infrastructure in front of the server. The body stays the source of truth, which is why a mismatch between them is rejected.

> **Q3.** A server receives an HTTP request where `Mcp-Name` says `get_agent_model` but the body calls `delete_agent`. What must it do?
> - A) Reject it with HTTP 400 and the header-mismatch error ✅
> - B) Trust the body and run `delete_agent`
> - C) Trust the header and run `get_agent_model`
> - D) Run both tools and return both results
>
> *Explanation:* Headers and body must agree. Accepting a mismatch would let a request slip past gateway rules written against its headers.

> **Q4.** A team wants an MCP server for their shared agent registry, used by several agents and a few people's chat apps. Which transport fits?
> - A) stdio, because it's simpler
> - B) Streamable HTTP, since it's a shared service used by many hosts at once ✅
> - C) Either; they're interchangeable for this
> - D) Neither; shared services can't use MCP
>
> *Explanation:* stdio runs one server process per host, on the host's machine. A shared system that many hosts reach over a network is what Streamable HTTP is for.

> **Q5.** When does a Streamable HTTP server answer with an SSE stream rather than a single JSON response?
> - A) Always, for every request
> - B) Only for `tools/list`
> - C) Only when the request failed
> - D) When it's useful to send notifications, such as progress updates, before the final response ✅
>
> *Explanation:* The server chooses per request. A quick call can return plain JSON; a long one can stream progress, then end the stream with the final response.

---

## Applied sandbox exercise

*(graded — building a Streamable HTTP request)*

**Task shown to learner:** A client sending a JSON-RPC message over Streamable HTTP needs the right headers alongside the body. Implement `build_http_request(message)`, returning a tuple `(headers, body)`:

- `body` is the message as a JSON string.
- `headers` is a dict containing:
  - `"Content-Type"`: `"application/json"`
  - `"Accept"`: `"application/json, text/event-stream"`
  - `"MCP-Protocol-Version"`: the value of `io.modelcontextprotocol/protocolVersion` in the message's `params._meta`
  - `"Mcp-Method"`: the message's `method`
  - `"Mcp-Name"`: only for `tools/call` and `prompts/get` (from `params.name`) and `resources/read` (from `params.uri`). Leave it out for every other method.

**Starter code:**
```python
import json

def build_http_request(message: dict) -> tuple:
    # TODO: return (headers, body) following the rules above
    ...
```

**Hidden tests:**
```python
META = {"io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientCapabilities": {}}

call = {"jsonrpc": "2.0", "id": 1, "method": "tools/call",
        "params": {"name": "get_agent_model", "arguments": {"agent_name": "research_agent"}, "_meta": META}}
headers, body = build_http_request(call)
assert headers["MCP-Protocol-Version"] == "2026-07-28"
assert headers["Mcp-Method"] == "tools/call"
assert headers["Mcp-Name"] == "get_agent_model"
assert "application/json" in headers["Accept"] and "text/event-stream" in headers["Accept"]
assert headers["Content-Type"] == "application/json"
assert json.loads(body) == call

read = {"jsonrpc": "2.0", "id": 2, "method": "resources/read",
        "params": {"uri": "registry://policies/naming", "_meta": META}}
headers, _ = build_http_request(read)
assert headers["Mcp-Name"] == "registry://policies/naming"

prompt = {"jsonrpc": "2.0", "id": 3, "method": "prompts/get",
          "params": {"name": "review_agent_config", "arguments": {"agent_name": "x"}, "_meta": META}}
assert build_http_request(prompt)[0]["Mcp-Name"] == "review_agent_config"

listing = {"jsonrpc": "2.0", "id": 4, "method": "tools/list", "params": {"_meta": {**META, "io.modelcontextprotocol/protocolVersion": "2025-11-25"}}}
headers, _ = build_http_request(listing)
assert "Mcp-Name" not in headers
assert headers["Mcp-Method"] == "tools/list" and headers["MCP-Protocol-Version"] == "2025-11-25"
```

**Hint (shown on request):** A small dict mapping each method that needs `Mcp-Name` to the params field it comes from, `{"tools/call": "name", "prompts/get": "name", "resources/read": "uri"}`, turns the three cases into one lookup. Build the four always-present headers first, then add `Mcp-Name` only if the method is in that dict.

**Reference solution:**
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
```

**Explanation:** Every header is copied from the body, never invented, which is exactly why a server can check that they match. The version comes from `_meta`, not from a constant in the code, so a client that falls back to an older version for one server (test 4) still sends headers that agree with its body. The lookup dict keeps the rule about which methods get `Mcp-Name` in one place, where it's easy to check against the spec.

---

*(End of Concept 5 — final concept of Lesson 5. The lesson continues with the recap and comprehensive sandbox.)*
