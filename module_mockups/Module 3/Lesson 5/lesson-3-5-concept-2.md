# Module 3, Lesson 5 — Concept 2: JSON-RPC as the message format

---

## A small, old standard for "call this, get that back"

Every message between an MCP client and server follows **JSON-RPC 2.0**, a short specification from 2010 for making remote calls with JSON. It isn't MCP-specific and it isn't new. It just pins down the shape of three kinds of message, so both sides always know what they're looking at:

- a **request**: "please run this method with these parameters"
- a **response**: the answer to one request, either a result or an error
- a **notification**: a one-way message that expects no answer

If [Module 0's FastAPI lessons](→ Module 0, the FastAPI lesson) are fresh, the contrast is useful. REST spreads meaning across the URL, the HTTP verb and the status code. JSON-RPC puts all of it inside the JSON body: which method to run, its arguments, and whether it succeeded. That's why the same messages work unchanged over a local pipe and over HTTP, as [this lesson's transports concept](→ this lesson, transports concept) shows.

---

## The four shapes

Here is each kind, as MCP uses them:

```python
import json

request = {
    "jsonrpc": "2.0",
    "id": 7,
    "method": "tools/call",
    "params": {"name": "get_agent_model", "arguments": {"agent_name": "research_agent"}},
}

success = {
    "jsonrpc": "2.0",
    "id": 7,
    "result": {
        "resultType": "complete",
        "content": [{"type": "text", "text": "research_agent runs on claude-sonnet"}],
        "isError": False,
    },
}

failure = {
    "jsonrpc": "2.0",
    "id": 8,
    "error": {"code": -32601, "message": "Method not found: tools/cal"},
}

notification = {"jsonrpc": "2.0", "method": "notifications/tools/list_changed"}

for label, message in [("request", request), ("success", success), ("failure", failure), ("notification", notification)]:
    print(f"{label}: {json.dumps(message)}")
```
```
request: {"jsonrpc": "2.0", "id": 7, "method": "tools/call", "params": {"name": "get_agent_model", "arguments": {"agent_name": "research_agent"}}}
success: {"jsonrpc": "2.0", "id": 7, "result": {"resultType": "complete", "content": [{"type": "text", "text": "research_agent runs on claude-sonnet"}], "isError": false}}
failure: {"jsonrpc": "2.0", "id": 8, "error": {"code": -32601, "message": "Method not found: tools/cal"}}
notification: {"jsonrpc": "2.0", "method": "notifications/tools/list_changed"}
```
*(runs live, shows output — read-only demo snippet, not graded)*

Field by field:

- **`jsonrpc: "2.0"`** is on every message, marking which version of the standard it follows.
- **`method`** names the operation. MCP's methods use a `category/action` style: `tools/list`, `tools/call`, `resources/read`, `server/discover`.
- **`params`** carries the arguments. For `tools/call` that's the tool's `name` and its `arguments`, the same name and input a model's `tool_use` block contains.
- **`id`** ties a response to its request. MCP requires it to be a string or an integer, never `null`, and never reused while an earlier request with that id is still waiting.
- **`result`** or **`error`**: a response has exactly one of them, never both.
- **Notifications have no `id`,** and that's what makes them notifications: with no id, there's nothing a response could point back to, so none is sent.

MCP adds one rule of its own on top of JSON-RPC: every `result` must carry a **`resultType`**. It's almost always `"complete"`. The other value, `"input_required"`, means the server needs something more before it can finish, such as a confirmation from the user. That's an advanced pattern this lesson won't build, but a client has to recognize it. A server written for an earlier version of MCP won't send `resultType` at all, and the spec says to treat a missing one as `"complete"`.

---

## Why every request needs an id

[Lesson 4](→ this module, tools that call the outside world lesson, running independent tool calls concurrently concept) ran several tool calls at once. With MCP, those calls can all be in flight to the same server together, and the server may answer them in any order. The id is how the client tells the answers apart:

```python
requests = [
    {"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "get_agent_status", "arguments": {"agent_name": "research_agent"}}},
    {"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "get_agent_model", "arguments": {"agent_name": "research_agent"}}},
]

# the client remembers what each outstanding request id was for
pending = {request["id"]: request["params"]["name"] for request in requests}

# the model lookup was faster, so its response arrives first
responses_in_arrival_order = [
    {"jsonrpc": "2.0", "id": 2, "result": {"resultType": "complete", "content": [{"type": "text", "text": "claude-sonnet"}]}},
    {"jsonrpc": "2.0", "id": 1, "result": {"resultType": "complete", "content": [{"type": "text", "text": "active"}]}},
]

for response in responses_in_arrival_order:
    tool_name = pending.pop(response["id"])
    print(f"response id {response['id']} answers {tool_name}: {response['result']['content'][0]['text']}")
print(f"still waiting on: {pending}")
```
```
response id 2 answers get_agent_model: claude-sonnet
response id 1 answers get_agent_status: active
still waiting on: {}
```
*(runs live, shows output — read-only demo snippet, not graded)*

The second request's answer came back first, and it didn't matter: each response names its id, and the client's `pending` dict says what that id was for. This is the same idea as [`tool_use_id` in the model's API](→ Module 1, structured output and tool calling lesson, the full round trip concept), one layer further out: `tool_use_id` pairs a model's call with its result, and the JSON-RPC `id` pairs the host's request to a server with the server's answer.

---

## Two different ways a tool call can fail

This is the detail that matters most for an agent. A `tools/call` can fail in two distinct ways, and they look different on the wire:

- **A protocol error** means the request itself couldn't be handled: an unknown tool name, a malformed request, a server crash. It comes back as a JSON-RPC `error` with a numeric code, and there's no `result` at all.
- **A tool execution error** means the tool ran and something about the task went wrong: an API it called failed, an argument was invalid, a business rule said no. It comes back as a normal `result` with `"isError": true`, and its `content` explains the problem in words.

```json
{"jsonrpc": "2.0", "id": 4, "error": {"code": -32602, "message": "Unknown tool: get_agnet_status"}}
```
```json
{"jsonrpc": "2.0", "id": 5, "result": {"resultType": "complete", "content": [{"type": "text", "text": "Invalid date: must be in the future."}], "isError": true}}
```
*(illustrative shapes, taken from the 2026-07-28 specification's examples)*

The spec's reasoning is about who can fix the problem. A tool execution error is written for the model: "that date is in the past" is something it can correct on its next call, the same idea as [the error messages from Lesson 3](→ this module, shaping what tools return lesson, structured results and useful error messages concept). The spec says clients **should** pass these to the model. A protocol error usually isn't something the model can fix, so passing it on is optional. Both should end up as a `tool_result` flagged as a failure, like [the `is_error` flag from Lesson 4](→ this module, tools that call the outside world lesson, running independent tool calls concurrently concept), so the model never mistakes a failure for a real answer.

The error codes worth recognizing:

| Code | Meaning |
|---|---|
| `-32700` | the message wasn't valid JSON |
| `-32600` | the JSON wasn't a valid JSON-RPC request |
| `-32601` | method not found, e.g. a typo in `tools/call` |
| `-32602` | invalid params, including an unknown tool name or missing required `_meta` fields |
| `-32603` | an internal error on the server |
| `-32020` to `-32022` | MCP's own: a header mismatch, a missing client capability, an unsupported protocol version |

The first five come from JSON-RPC itself. MCP reserves `-32020` to `-32099` for errors defined by its own specification. [The next concept](→ this lesson, stateless by design concept) covers the situations that produce the last two.

---

## Quiz cards

> **Q1.** What makes a JSON-RPC message a notification rather than a request?
> - A) Its `method` starts with `notifications/`
> - B) It has no `id`, so no response is expected or possible ✅
> - C) It has an empty `params` object
> - D) It's sent from the server to the client
>
> *Explanation:* The `id` is what a response points back to. Without one, the message is one-way. The `notifications/` naming is a convention, not the rule.

> **Q2.** A client sends requests with ids 1 and 2, and the response for id 2 arrives first. What should the client do?
> - A) Reject it, because responses must arrive in request order
> - B) Treat it as the answer to request 1, since that one was sent first
> - C) Match it to request 2 by its id, and keep waiting for id 1 ✅
> - D) Resend request 1 to restore the order
>
> *Explanation:* Responses carry the id of the request they answer, so arrival order doesn't matter. That's what lets several calls be in flight at once.

> **Q3.** A model calls a tool with a date in the past, and the server's tool rejects it. How should the server report that?
> - A) As a `result` with `"isError": true` and a message explaining the date problem ✅
> - B) As a JSON-RPC `error` with code `-32602`
> - C) As a JSON-RPC `error` with code `-32603`
> - D) As a notification, since no answer is needed
>
> *Explanation:* The tool ran and the task failed for a reason the model can fix, which makes it a tool execution error. Protocol errors are for requests the server couldn't handle at all, like an unknown tool.

> **Q4.** A result arrives with no `resultType` field. What should a 2026-07-28 client do?
> - A) Reject it as invalid
> - B) Treat it as `"complete"`, since it likely comes from a server on an earlier protocol version ✅
> - C) Treat it as `"input_required"` and wait for more
> - D) Resend the request with a different id
>
> *Explanation:* Earlier protocol versions didn't have `resultType`, and the spec tells clients to treat its absence as `"complete"` for backward compatibility.

> **Q5.** How is a JSON-RPC `id` different from a `tool_use_id`?
> - A) They're the same value, copied from one to the other
> - B) `tool_use_id` is chosen by the server; the JSON-RPC `id` by the model
> - C) The JSON-RPC `id` is only used for notifications
> - D) `tool_use_id` pairs the model's call with its result; the JSON-RPC `id` pairs the host's request to a server with that server's response ✅
>
> *Explanation:* Same idea, two different conversations: one between the model and the host, one between the host's client and a server. The host translates between them.

---

## Applied sandbox exercise

*(graded — turning a JSON-RPC response into what the model sees)*

**Task shown to learner:** When a `tools/call` response comes back from an MCP server, the host has to turn it into the text of a `tool_result` for the model, plus whether that result is a failure. Implement `to_tool_output(response)`, returning a tuple `(text, is_error)`:

- **An `error` response** (a protocol error): return text starting with `"Error:"` that includes the error's code and message, and `is_error` `True`.
- **A `result`:** read its `resultType`, treating a missing one as `"complete"`.
  - `"complete"`: join the `text` of every content item whose `type` is `"text"` with newlines, skipping other types. `is_error` is the result's `isError`, or `False` if it's absent.
  - `"input_required"`: this client doesn't support it. Return text starting with `"Error:"` saying so, and `True`.
  - anything else: the spec says an unrecognised `resultType` is invalid. Return text starting with `"Error:"` that names it, and `True`.

**Starter code:**
```python
def to_tool_output(response: dict) -> tuple:
    # TODO: return (text, is_error) following the rules above
    ...
```

**Hidden tests:**
```python
ok = {"jsonrpc": "2.0", "id": 1, "result": {"resultType": "complete", "content": [{"type": "text", "text": "research_agent: active"}], "isError": False}}
assert to_tool_output(ok) == ("research_agent: active", False)

multi = {"jsonrpc": "2.0", "id": 2, "result": {"resultType": "complete", "content": [
    {"type": "text", "text": "line one"}, {"type": "image", "data": "iVBOR...", "mimeType": "image/png"}, {"type": "text", "text": "line two"}]}}
assert to_tool_output(multi) == ("line one\nline two", False)

tool_error = {"jsonrpc": "2.0", "id": 3, "result": {"resultType": "complete", "content": [{"type": "text", "text": "Invalid date: must be in the future"}], "isError": True}}
assert to_tool_output(tool_error) == ("Invalid date: must be in the future", True)

protocol_error = {"jsonrpc": "2.0", "id": 4, "error": {"code": -32602, "message": "Unknown tool: get_agnet_status"}}
text, is_error = to_tool_output(protocol_error)
assert is_error is True and text.startswith("Error:") and "-32602" in text and "Unknown tool" in text

legacy = {"jsonrpc": "2.0", "id": 5, "result": {"content": [{"type": "text", "text": "from an older server"}]}}
assert to_tool_output(legacy) == ("from an older server", False)

needs_input = {"jsonrpc": "2.0", "id": 6, "result": {"resultType": "input_required", "inputRequests": {}}}
text, is_error = to_tool_output(needs_input)
assert is_error is True and text.startswith("Error:")

weird = {"jsonrpc": "2.0", "id": 7, "result": {"resultType": "something_new"}}
text, is_error = to_tool_output(weird)
assert is_error is True and "something_new" in text
```

**Hint (shown on request):** Check `"error" in response` first; a response has either `error` or `result`, never both. For a result, `result.get("resultType", "complete")` covers older servers in one step, and the same `.get(..., default)` pattern works for `isError` and `content`. Build the text with a generator inside `"\n".join(...)`, keeping only items where `item["type"] == "text"`.

**Reference solution:**
```python
def to_tool_output(response: dict) -> tuple:
    if "error" in response:
        error = response["error"]
        return (f"Error: MCP error {error['code']}: {error['message']}", True)
    result = response["result"]
    # results from servers on an earlier protocol version may omit resultType
    result_type = result.get("resultType", "complete")
    if result_type == "complete":
        text = "\n".join(item["text"] for item in result.get("content", []) if item["type"] == "text")
        return (text, result.get("isError", False))
    if result_type == "input_required":
        return ("Error: the server needs more input to finish this call, which this client doesn't support", True)
    return (f"Error: unrecognised resultType '{result_type}'", True)
```

**Explanation:** The function is the seam between two layers: MCP's two kinds of failure on one side, and the model's single `is_error` flag on the other. Protocol errors and tool execution errors look different on the wire (tests 3 and 4) but both reach the model as a flagged failure. Test 5 checks backward compatibility with a server that doesn't send `resultType`, and tests 6 and 7 check that a result type the client can't handle is reported rather than silently treated as an empty success. Test 2 checks that non-text content, like an image, doesn't break the text the model receives.

---

*(End of Concept 2. This lesson continues with Concept 3 — stateless by design.)*
