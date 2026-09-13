# Implement Real-Time Communication Across Protocols

> **You'll be able to**
> - Explain why polling is wasteful, and choose correctly between SSE,
>   WebSockets, and gRPC based on the actual shape of a communication
>   need — not just familiarity or sophistication
> - Implement a streaming HTTP response with `StreamingResponse`, in the
>   real SSE wire format
> - Build a WebSocket endpoint — accepting connections, running a message
>   loop, handling disconnects cleanly, and authenticating a connection
>   via a query-parameter token
> - Define a `.proto` schema, generate real client/server code from it,
>   and implement both a unary RPC and at least one gRPC streaming mode
> - Test streaming responses, WebSocket connections, and a gRPC service,
>   extending this course's existing testing practice to each
> - Manage multiple simultaneous WebSocket connections with a broadcast
>   pattern, and explain why cleanup on disconnect matters

**Why it matters**
An agent that only ever answers one request at a time, with one
response at the end, is a narrow slice of what real agent systems
actually need to do: stream a response as it's generated, let a user
cancel a running task, push a status update to everyone watching, or
call an internal tool service reliably at scale. Every protocol in this
lesson is a different, deliberate answer to "how should these two things
actually talk to each other" — and choosing correctly, not defaulting to
whichever one you know best, is as much the point as knowing how to
implement any one of them.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all nine concepts, mixed order)*

> **Q1.** What are the concrete costs of polling for a long-running
> task's status?
> - A) None — polling is just as efficient as any alternative
> - B) Wasted requests, added latency, and server load that scales with client impatience rather than actual work happening ✅
> - C) Polling only has a latency cost, no load cost
> - D) Polling requires a persistent connection, unlike the alternatives

> **Q2.** A live dashboard needs both server-pushed updates and the
> ability for a client to cancel a running task at any moment. Which
> protocol fits, and why?
> - A) SSE, since it handles server push
> - B) WebSockets — the client needs to send something back mid-interaction, which SSE structurally can't support ✅
> - C) Polling, since it's simpler
> - D) gRPC, since it's the most sophisticated option

> **Q3.** What does `media_type="text/event-stream"` actually signal on
> a `StreamingResponse`?
> - A) Nothing functional — purely cosmetic
> - B) That the response should be treated as a long-lived SSE event stream, not a normal response to buffer and close ✅
> - C) That the response body must be plain text, never JSON
> - D) It's unrelated to SSE specifically

> **Q4.** What does `await websocket.accept()` actually do?
> - A) It sends the first message to the client
> - B) It completes the protocol handshake, upgrading the initial HTTP request into a persistent WebSocket connection ✅
> - C) It's optional — connections work identically without it
> - D) It closes the connection immediately after opening it

> **Q5.** Why doesn't header-based API key auth carry over directly to
> WebSocket authentication?
> - A) WebSockets don't support authentication at all
> - B) A browser's WebSocket API can't easily set custom headers on the connection request, so a token is typically passed as a query parameter instead ✅
> - C) Headers only work over gRPC
> - D) WebSocket connections are always pre-authenticated

> **Q6.** Why is protobuf's binary encoding typically more compact than
> the equivalent JSON message?
> - A) Protobuf compresses data with a general-purpose algorithm
> - B) Protobuf never transmits field names at all — only compact numeric tags — while JSON repeats every field's name as a string in every message ✅
> - C) JSON always includes more fields than protobuf allows
> - D) There's no real size difference

> **Q7.** Where does the generated class name `ToolServiceServicer`
> actually come from?
> - A) An arbitrary name the developer chooses independently
> - B) It's generated directly from the `.proto` file's service declaration, following protoc's fixed naming pattern of the service name plus `Servicer` ✅
> - C) A built-in gRPC class unrelated to the `.proto` file
> - D) It only exists for services with more than one RPC method

> **Q8.** How does a server-streaming RPC's implementation differ from a
> unary RPC's, in Python?
> - A) No difference at all
> - B) It becomes a generator, `yield`-ing each response instead of `return`-ing a single one ✅
> - C) It must use `async def` instead of `def`
> - D) It requires a separate thread per response

> **Q9.** Why can't `TestClient` be used to test a gRPC service?
> - A) `TestClient` can test any protocol without modification
> - B) gRPC isn't part of the FastAPI app at all — testing it means running an actual gRPC server and connecting a real client to it ✅
> - C) gRPC services can never be tested automatically
> - D) `TestClient` only works with `async def` routes

> **Q10.** What problem does a connection manager solve that a single
> WebSocket route handling one connection at a time doesn't?
> - A) It makes individual messages send faster
> - B) It lets one event reach every currently-connected client, not just whichever connection happened to trigger it ✅
> - C) It replaces the need for `accept()` entirely
> - D) It only matters for gRPC

> **Q11.** What two problems would result from never removing a
> disconnected client from a connection manager's active-connections
> list?
> - A) No real problem — the list would simply stay accurate
> - B) The list would grow forever holding dead connections, and every future broadcast would try to send to those dead connections too, raising an exception ✅
> - C) The server would refuse all new connections
> - D) Broadcasting would silently stop working entirely

---

## Comprehensive sandbox

*(end of lesson, applied — extending the agent registry app once more:
adding a broadcast-on-creation WebSocket feature, and testing both the
existing REST behavior and the new real-time behavior together)*

*Context provided:* the `main.py`/`agents.py` agent registry app,
already extended through [Lesson 10's test suite](→ Module 0, the testing lesson, the comprehensive sandbox explanation).

*Starter code shown to learner — additions to `agents.py`:*
```python
from fastapi import WebSocket, WebSocketDisconnect, status

class ConnectionManager:
    """
    TODO: implement connect (accept + append), disconnect (remove),
    and an async broadcast(message: dict) that send_json's to every
    active connection.
    """
    def __init__(self):
        self.active_connections = []
    # TODO: implement connect, disconnect, broadcast

manager = ConnectionManager()

@router.websocket("/watch")
async def watch_agents(websocket: WebSocket, token: str = None):
    """
    TODO:
      - if token != "secret-key-123", close with status.WS_1008_POLICY_VIOLATION and return
      - otherwise, connect via manager, then loop receiving text (ignoring
        the content) until WebSocketDisconnect, then call manager.disconnect
    """
    pass

# TODO: modify create_agent (from Lesson 9) to call
# `await manager.broadcast({"event": "agent_created", "name": config.name})`
# after successfully storing a new agent, before returning.
```

*Task shown to learner:* Implement `ConnectionManager` and
`watch_agents` as described, and modify the existing `create_agent`
route to broadcast an event to every connected watcher whenever a new
agent is successfully created.

*Hidden test cases (via `TestClient`, combining REST and WebSocket
checks in one test):*
```python
def test_agent_creation_broadcasts_to_watchers(client):
    with client.websocket_connect("/agents/watch?token=secret-key-123") as ws:
        response = client.post(
            "/agents",
            json={"name": "research_agent", "model": "claude-sonnet"},
            headers={"X-Api-Key": "secret-key-123"},
        )
        assert response.status_code == 201

        event = ws.receive_json()
        assert event == {"event": "agent_created", "name": "research_agent"}

def test_watch_rejects_bad_token(client):
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect("/agents/watch?token=wrong"):
            pass
```

*Hint (shown on request):* `ConnectionManager` is nearly identical to
the one in this lesson's broadcast-pattern concept. In `create_agent`,
add the `await manager.broadcast(...)` call as the last thing before
`return config` — after the agent is actually stored, so a watcher never
receives an event for something that failed to save.

*Correct answer + explanation (shown on failure, if requested):*
```python
class ConnectionManager:
    def __init__(self):
        self.active_connections = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

@router.websocket("/watch")
async def watch_agents(websocket: WebSocket, token: str = None):
    if token != "secret-key-123":
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# inside create_agent, after storing the new agent successfully:
await manager.broadcast({"event": "agent_created", "name": config.name})
```
This is the full arc of the lesson landing on the one app this course
has carried since Lesson 9: a REST endpoint's ordinary success path now
also drives a real-time push, a WebSocket connection is authenticated
the same way any protected WebSocket in this lesson has been, and the
test verifying it all uses both `TestClient`'s normal request methods
and its WebSocket support in the same test — checking the REST response
and the resulting broadcast together, exactly the kind of end-to-end
behavior a real agent system actually needs to get right.
