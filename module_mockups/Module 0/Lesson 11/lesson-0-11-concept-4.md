# Module 0, Lesson 11 — Concept 4: WebSockets fundamentals

---

## `@app.websocket` — a different kind of route

A WebSocket route uses its own decorator, not `@app.get`/`@app.post` —
it's handling something structurally different from a normal HTTP
request/response cycle:

```python
from fastapi import FastAPI, WebSocket

app = FastAPI()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        message = await websocket.receive_text()
        await websocket.send_text(f"echo: {message}")
```

`await websocket.accept()` completes the protocol handshake — a
WebSocket connection starts as a normal HTTP request, then "upgrades"
to the WebSocket protocol; `accept()` is what agrees to that upgrade.
After it, `websocket` represents a genuinely persistent, open
connection — not a single request being handled once, but a channel
that stays open until something closes it.

---

## The message loop

Unlike a normal route, which runs once per request and returns, a
WebSocket route typically runs a `while True:` loop for as long as the
connection stays open — [an intentional, correct use of an infinite loop](→ Module 0, the Python setup lesson, control flow concept, the while loops explanation), since the connection itself, not a fixed number of iterations, determines when the loop ends. `receive_text()` and `send_text()` are both `await`-able — [genuinely I/O-bound operations](→ Module 0, the async lesson, why concurrency matters concept), waiting on the network exactly the way any other I/O this course has covered does.

---

## `receive_json()` / `send_json()` — the convenience version

Sending plain text and parsing it yourself is rarely how real messages
look — `receive_json()`/`send_json()` handle [the JSON conversion from the I/O lesson](→ Module 0, the I/O and error handling lesson, working with json concept) automatically, working with dicts directly instead of strings:

```python
@app.websocket("/ws/agent")
async def agent_websocket(websocket: WebSocket):
    await websocket.accept()
    while True:
        message = await websocket.receive_json()
        if message["action"] == "start_task":
            await websocket.send_json({"status": "started", "progress": 0})
        elif message["action"] == "cancel":
            await websocket.send_json({"status": "cancelled"})
```

A client sending `{"action": "start_task"}` (as JSON text over the
connection) gets it automatically parsed into a Python dict by
`receive_json()` — no manual `json.loads()` needed — and
`send_json({"status": "started", "progress": 0})` handles the reverse
serialization the same way.

---

## Quiz cards

> **Q1.** What does `await websocket.accept()` actually do?
> - A) It sends the first message to the client
> - B) It completes the protocol handshake, agreeing to upgrade the initial HTTP request into a persistent WebSocket connection ✅
> - C) It's optional — connections work identically without it
> - D) It closes the connection immediately after opening it

> **Q2.** Why does a WebSocket route typically run a `while True:` loop,
> unlike a normal HTTP route?
> - A) This is a mistake — WebSocket routes should never loop
> - B) The connection stays open for as long as both sides keep it open, not for a single request/response — the loop is what keeps handling messages for the connection's entire lifetime ✅
> - C) `while True:` is required syntax for any `async def` function
> - D) WebSocket routes can only send exactly one message per connection

> **Q3.** What does `receive_json()` do that `receive_text()` doesn't?
> - A) Nothing — they're identical
> - B) It automatically parses the incoming text as JSON into a Python dict, rather than handing back the raw string ✅
> - C) `receive_json()` only works for outgoing messages, not incoming ones
> - D) `receive_text()` can only be used once per connection

> **Q4.** Why are `receive_text()` and `send_text()` both `await`-able,
> rather than plain synchronous calls?
> - A) This is arbitrary — they could just as easily be synchronous
> - B) They're genuinely I/O-bound — waiting on the network — the same category of operation the async lesson built `await`-based handling around ✅
> - C) `await` is required syntax for every WebSocket-related call, regardless of whether it does I/O
> - D) Only `send_text()` needs `await`; `receive_text()` doesn't

---

*(End of Concept 4. This lesson continues with Concept 5 — the
WebSocket lifecycle, disconnects, and authenticating a connection —
drafted separately.)*
