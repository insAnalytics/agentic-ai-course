# Module 0, Lesson 11 — Concept 8: Testing streaming, WebSocket, and gRPC endpoints

---

## Testing an SSE endpoint

[`TestClient`, from the testing lesson](→ Module 0, the testing lesson, testing endpoints with testclient concept), handles a streaming response the same way it handles any other — the streamed body is just read in full:

```python
def test_stream_task_status(client):
    with client.stream("GET", "/tasks/42/stream") as response:
        body = "".join(chunk for chunk in response.iter_text())

    assert "event: status" in body
    assert '"status": "complete"' in body
```

`client.stream(...)` is `TestClient`'s streaming-aware version of
`.get()`/`.post()` — used as a context manager, since a streamed
response is conceptually an open connection being read from, [the same shape as `with open(...)` guaranteeing proper handling regardless of how the block ends](→ Module 0, the I/O and error handling lesson, file I/O and context managers concept). `response.iter_text()` yields each chunk as it was produced by the server, which the test joins back into one string to check.

---

## Testing a WebSocket endpoint

`TestClient` has dedicated WebSocket support too —
`client.websocket_connect(...)`, also used as a context manager, giving
you an object with the same `send_text()`/`receive_text()`/
`send_json()`/`receive_json()` methods [the server side already uses](→ this lesson, websockets fundamentals concept):

```python
def test_websocket_echo(client):
    with client.websocket_connect("/ws?token=secret-key-123") as websocket:
        websocket.send_text("hello")
        response = websocket.receive_text()
        assert response == "echo: hello"
```

The connection opens when the `with` block starts and closes
automatically when it ends — [the same guaranteed-cleanup pattern as any other context manager](→ Module 0, the I/O and error handling lesson, file I/O and context managers concept, the with statement explanation), here specifically making sure the test doesn't leave a WebSocket connection dangling even if an assertion fails partway through.

Testing the rejection case — an invalid token — checks that the
connection attempt itself fails, rather than checking a message once
connected:

```python
from starlette.websockets import WebSocketDisconnect

def test_websocket_rejects_bad_token(client):
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect("/ws?token=wrong") as websocket:
            pass
```

This is [`pytest.raises`](→ Module 0, the testing lesson, testing error paths and status codes systematically concept) — confirming the connection closing at handshake time raises the expected exception on the client side, the direct test-side counterpart to [the server explicitly closing with a policy-violation code](→ this lesson, the websocket lifecycle disconnects and authenticating a connection concept, the authenticating a websocket connection explanation).

---

## Testing a gRPC service

gRPC isn't part of the FastAPI app at all, so `TestClient` doesn't apply
— testing it means running a real gRPC server (on a test port) and
connecting a real client to it, the actual client/server pair from
[Concept 6](→ this lesson, gRPC fundamentals concept), just started and torn down around a test rather than run as a long-lived process:

```python
import grpc
from concurrent import futures
import pytest
import task_service_pb2
import task_service_pb2_grpc

@pytest.fixture
def grpc_stub():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=1))
    task_service_pb2_grpc.add_TaskServiceServicer_to_server(TaskServiceServicer(), server)
    port = server.add_insecure_port("localhost:0")   # 0 picks an available port
    server.start()

    channel = grpc.insecure_channel(f"localhost:{port}")
    stub = task_service_pb2_grpc.TaskServiceStub(channel)

    yield stub

    server.stop(grace=None)

def test_execute_tool(grpc_stub):
    response = grpc_stub.ExecuteTool(task_service_pb2.ToolRequest(tool_name="search", arguments_json="{}"))
    assert "search" in response.result
```

`grpc_stub` is [a fixture, exactly the mechanism from the testing lesson](→ Module 0, the testing lesson, fixtures concept) — everything before `yield` sets up a real server on an available port; the test receives a working `stub` connected to it; everything after `yield` tears the server down once the test finishes, [the same before/after-yield fixture shape already established](→ Module 0, the testing lesson, fixtures concept, the pytest fixture declare it once explanation). `add_insecure_port("localhost:0")` with port `0` asks the OS for any free port, avoiding collisions if tests happen to run in parallel.

---

## Quiz cards

> **Q1.** Why is `client.stream(...)` used as a context manager, rather
> than called directly like `client.get(...)`?
> - A) There's no real reason — it's just a stylistic choice
> - B) A streamed response is conceptually an open connection being read from, the same shape as any other context manager guaranteeing proper handling regardless of how the block ends ✅
> - C) `client.stream()` can only be called once per test file
> - D) Context managers are required for any test involving `async def`

> **Q2.** What does `client.websocket_connect(...)` give you access to,
> once inside its `with` block?
> - A) Nothing usable — it only confirms the connection succeeded
> - B) An object with the same `send_text()`/`receive_text()`/`send_json()`/`receive_json()` methods the server side uses ✅
> - C) Only a status code, similar to a normal HTTP response
> - D) Direct access to the server's internal state

> **Q3.** Why does testing a rejected WebSocket connection check for a
> raised exception, rather than checking a received message?
> - A) Rejected connections behave identically to accepted ones
> - B) An invalid token causes the server to close the connection at handshake time, before any message exchange is even possible — the rejection shows up as the connection attempt itself failing ✅
> - C) `pytest.raises` is required for every WebSocket test, regardless of outcome
> - D) There's no way to test a rejected connection at all

> **Q4.** Why can't `TestClient` be used to test a gRPC service?
> - A) `TestClient` can test any protocol without modification
> - B) gRPC isn't part of the FastAPI app at all — testing it means running an actual gRPC server and connecting a real client to it ✅
> - C) gRPC services can never be tested automatically
> - D) `TestClient` only works with `async def` routes

> **Q5.** Why does the `grpc_stub` fixture use
> `server.add_insecure_port("localhost:0")` with port `0`, rather than a
> fixed port number?
> - A) Port `0` disables the server's networking entirely
> - B) Port `0` asks the OS to assign any currently available port, avoiding collisions if multiple tests happen to start servers at the same time ✅
> - C) It's required syntax with no functional meaning
> - D) It restricts the server to local connections only

---

*(End of Concept 8. This lesson continues with Concept 9 — managing
multiple connections: a broadcast pattern — drafted separately.)*
