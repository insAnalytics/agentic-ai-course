# Module 0, Lesson 11 — Concept 5: The WebSocket lifecycle, disconnects, and authenticating a connection

---

## Handling disconnects: `WebSocketDisconnect`

A client can disconnect at any moment — closing a browser tab, losing
network — and the next `await websocket.receive_text()` (or
`receive_json()`) after that raises `WebSocketDisconnect`. Left
unhandled, this produces the same kind of noisy, unhandled traceback
[covered all the way back in the Python setup lesson](→ Module 0, the Python setup lesson, error handling concept, the seeing the crash first explanation) — the fix is the same tool from that lesson, applied here:

```python
from fastapi import WebSocket, WebSocketDisconnect

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            message = await websocket.receive_text()
            await websocket.send_text(f"echo: {message}")
    except WebSocketDisconnect:
        print("client disconnected")
```

Wrapping the message loop in `try`/`except WebSocketDisconnect` catches
a disconnect cleanly, giving you a specific place to run cleanup logic
— [the same shape as `finally` guaranteeing cleanup regardless of how a block ends](→ Module 0, the Python setup lesson, error handling concept, the finally explanation), just handling one particular, expected kind of "ending" (the client leaving) rather than an arbitrary error.

---

## Authenticating a WebSocket connection

[Header-based auth from the FastAPI lesson](→ Module 0, the FastAPI lesson, authentication concept, the api key auth with depends explanation) doesn't carry over cleanly here — a browser's WebSocket API can't easily set custom headers the way a normal HTTP request can. The common fix: pass a token as a **query parameter** in the connection URL instead, validated before (or immediately after) accepting the connection:

```python
from fastapi import WebSocket, WebSocketDisconnect, status

VALID_TOKEN = "secret-key-123"

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = None):
    if token != VALID_TOKEN:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    await websocket.accept()
    try:
        while True:
            message = await websocket.receive_text()
            await websocket.send_text(f"echo: {message}")
    except WebSocketDisconnect:
        print("client disconnected")
```

A client connects to `ws://localhost:8000/ws?token=secret-key-123` —
`token` arrives as a query parameter [exactly like any other query parameter from the FastAPI lesson](→ Module 0, the FastAPI lesson, routes and parameters concept, the query parameters explanation), just on a WebSocket route instead of a regular one. An invalid token closes the connection immediately, with a specific WebSocket close code (`1008`, "policy violation" — WebSockets have their own status-code system, separate from HTTP's), *before* `accept()` ever runs — the connection is rejected at the handshake, not accepted and then abandoned.

---

## Quiz cards

> **Q1.** What raises `WebSocketDisconnect`, and when?
> - A) It's raised manually by the developer whenever they want to end a connection
> - B) It's raised automatically the next time the server tries to receive a message after the client has actually disconnected ✅
> - C) It's raised immediately when `accept()` is called
> - D) It only occurs if `send_text()` is called incorrectly

> **Q2.** Why wrap a WebSocket's message loop in
> `try`/`except WebSocketDisconnect`?
> - A) It's optional and has no real effect either way
> - B) Without it, a client disconnecting produces an unhandled exception and a noisy traceback; catching it gives a clean, specific place to run cleanup logic ✅
> - C) It prevents the client from ever disconnecting
> - D) It's required syntax for every `async def` function

> **Q3.** Why doesn't the header-based API key pattern from the FastAPI
> lesson carry over directly to WebSocket authentication?
> - A) WebSockets don't support authentication at all
> - B) A browser's WebSocket API can't easily set custom headers on the connection request the way a normal HTTP request can, so a token is typically passed as a query parameter instead ✅
> - C) Headers are only supported over gRPC, never WebSockets
> - D) WebSocket connections are always considered pre-authenticated

> **Q4.** In the token-validation example, why does an invalid token
> close the connection *before* `accept()` is called, rather than after?
> - A) There's no meaningful difference between the two orderings
> - B) Rejecting at the handshake means the connection is never actually accepted in the first place, rather than being accepted and then immediately abandoned ✅
> - C) `accept()` must always be called first, regardless of validation
> - D) Closing before `accept()` is technically impossible

---

## Applied sandbox exercise 2

*(a token-authenticated WebSocket echo endpoint with proper disconnect
handling)*

*Task shown to learner:* Implement `@app.websocket("/ws")` accepting a
`token: str = None` query parameter. If `token != "secret-key-123"`,
close the connection with `status.WS_1008_POLICY_VIOLATION` before
accepting it. Otherwise, accept the connection and run a loop echoing
back `f"echo: {message}"` for each received text message, wrapped in
`try`/`except WebSocketDisconnect` that prints `"client disconnected"`.

*Grading:* using `TestClient`'s WebSocket testing support, a connection
with the correct token successfully sends and receives an echoed
message; a connection with a missing or wrong token is rejected at
connect time, before any message exchange is possible.

*Hint (shown on request):* The structure is exactly the two examples in
this concept, combined — token check and `close()` first, `accept()`
only if the token is valid, then the same `try`/`while`/`except` message
loop as the plain echo example.

*Correct answer + explanation (shown on failure, if requested):*
```python
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, status

app = FastAPI()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = None):
    if token != "secret-key-123":
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    await websocket.accept()
    try:
        while True:
            message = await websocket.receive_text()
            await websocket.send_text(f"echo: {message}")
    except WebSocketDisconnect:
        print("client disconnected")
```
This is the complete, realistic shape of a protected WebSocket endpoint:
rejected at the handshake for bad credentials, a normal message loop for
valid connections, and a specific, clean handler for the moment the
client eventually leaves — every piece from this concept, composed.

---

*(End of Concept 5. This lesson continues with Concept 6 — gRPC
fundamentals — drafted separately.)*
