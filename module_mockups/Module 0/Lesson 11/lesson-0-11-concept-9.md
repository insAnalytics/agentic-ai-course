# Module 0, Lesson 11 — Concept 9: Managing multiple connections — a broadcast pattern

---

## The realistic case: more than one client watching

Every WebSocket example so far has handled one connection at a time.
The realistic case for an agent system is usually several clients
watching the same thing at once — multiple people watching one agent's
status, say — and a single event (the status changing) needing to reach
*all* of them, not just whoever happens to be connected on the
connection that triggered it.

---

## A connection manager

A small class tracking every active connection, with methods to add,
remove, and push a message to all of them:

```python
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections = []   # every currently-connected WebSocket

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()
```

`self.active_connections` is [an ordinary list](→ Module 0, the data structures lesson, lists concept), holding every `WebSocket` object currently connected — `.append()` on connect, `.remove()` on disconnect, and `broadcast()` looping over all of them to send the same message to each.

---

## Wiring it into a route

```python
from fastapi import WebSocketDisconnect

@app.websocket("/ws/watch")
async def watch_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()   # keeps the connection open; incoming messages aren't otherwise used
    except WebSocketDisconnect:
        manager.disconnect(websocket)
```

The route doesn't call `broadcast()` itself — its only job is
registering and cleaning up connections. Something else triggers the
actual broadcast:

```python
@app.post("/agents/{agent_id}/status")
async def update_status(agent_id: int, status: dict):
    await manager.broadcast({"agent_id": agent_id, **status})
    return {"ok": True}
```

A normal `POST` route — nothing WebSocket-specific about it at all —
calls `manager.broadcast(...)`, which pushes the update to every client
currently connected to `/ws/watch`, regardless of which client (if any)
happened to trigger the status change in the first place.

---

## Why cleanup on disconnect matters

Removing a connection from `active_connections` when it disconnects
isn't optional bookkeeping — without it, two real problems compound:
`active_connections` grows forever, holding references to connections
that are no longer actually open, and every future `broadcast()` call
tries to `send_json()` to those dead connections too, which would raise
an exception the moment it's attempted. The `try`/`except
WebSocketDisconnect` wrapping the route is what guarantees
`manager.disconnect(websocket)` actually runs the moment a client
leaves — [the same guaranteed-cleanup shape from earlier in this lesson](→ this lesson, the websocket lifecycle disconnects and authenticating a connection concept, the handling disconnects websocketdisconnect explanation), just now cleaning up a shared, multi-client resource instead of ending one isolated connection's own loop.

---

## Quiz cards

> **Q1.** What problem does a connection manager solve that a single
> WebSocket route handling one connection at a time doesn't?
> - A) It makes individual messages send faster
> - B) It lets one event (like a status change) reach every currently-connected client, not just whichever connection happened to trigger it ✅
> - C) It replaces the need for `accept()` entirely
> - D) It only matters for gRPC, not WebSockets

> **Q2.** In the wiring shown, what triggers `manager.broadcast(...)` —
> the WebSocket route itself, or something else?
> - A) The WebSocket route calls it directly, every time a client connects
> - B) Something else — an ordinary `POST` route, with no WebSocket-specific code at all — calls it whenever the underlying event actually happens ✅
> - C) `broadcast()` is called automatically on a fixed timer
> - D) Only a `GET` request can trigger a broadcast

> **Q3.** What two problems would result from never removing a
> disconnected client from `active_connections`?
> - A) There's no real problem — the list would simply stay accurate
> - B) The list would grow forever holding dead connections, and every future broadcast would try to send to those dead connections too, raising an exception ✅
> - C) The server would refuse all new connections after the first disconnect
> - D) Broadcasting would silently stop working entirely

> **Q4.** Why does `manager.disconnect(websocket)` sit inside the
> `except WebSocketDisconnect:` block, rather than being called some
> other way?
> - A) It doesn't need to be reliably called at all
> - B) It's what guarantees cleanup actually happens the moment a client leaves — the same guaranteed-cleanup pattern used for a single connection, now applied to a shared resource tracking many connections ✅
> - C) `except` blocks are required for any method call involving a list
> - D) `disconnect()` only works when called from inside a `try` block

---

*(End of Concept 9 — final concept section of Lesson 11. This lesson
continues with the outcomes callout, comprehensive quiz, and
comprehensive sandbox — drafted separately.)*
