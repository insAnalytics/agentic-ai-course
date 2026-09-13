# Module 0, Lesson 11 — Concept 7: gRPC streaming modes

---

## Four shapes, one mechanism

[Concept 6's `ExecuteTool`](→ this lesson, gRPC fundamentals concept) was a **unary** RPC — one request, one response, the simplest of gRPC's four call shapes. The other three let either side send more than one message over the same call, and each has a direct analog already covered in this lesson: server-streaming mirrors SSE, and bidirectional streaming mirrors WebSockets. All four are declared the same way — as an RPC method in a `.proto` file — with `stream` marking which side sends more than one message.

---

## Server-streaming — the gRPC analog to SSE

One request, many responses streamed back — [directly comparable to the status-streaming SSE endpoint from earlier in this lesson](→ this lesson, implementing SSE with StreamingResponse concept):

```protobuf
service TaskService {
  rpc StreamTaskStatus (TaskRequest) returns (stream TaskStatus);
}

message TaskRequest {
  int32 task_id = 1;
}

message TaskStatus {
  string status = 1;
  int32 progress = 2;
}
```

`returns (stream TaskStatus)` is the only difference from a unary RPC's
declaration — one `stream` keyword. On the server, the method becomes a
generator, `yield`-ing each response instead of `return`-ing one:

```python
import time

class TaskServiceServicer(task_service_pb2_grpc.TaskServiceServicer):
    def StreamTaskStatus(self, request, context):
        for progress in [0, 50, 100]:
            yield task_service_pb2.TaskStatus(status="running", progress=progress)
            time.sleep(1)
```

On the client, iterating the call directly — a plain `for` loop, [the same iterable pattern from the very first lesson of this course](→ Module 0, the Python setup lesson, control flow concept, the for loops explanation) — receives each streamed response as it arrives:

```python
for status in stub.StreamTaskStatus(task_service_pb2.TaskRequest(task_id=42)):
    print(status.progress)
```

---

## Client-streaming — many requests, one response

The reverse shape: the client sends a sequence of messages, and the
server replies once, after receiving all of them:

```protobuf
rpc UploadChunks (stream ChunkRequest) returns (UploadSummary);
```

The server's method receives an iterable of incoming requests instead
of one:

```python
def UploadChunks(self, request_iterator, context):
    total_bytes = 0
    for chunk in request_iterator:
        total_bytes += len(chunk.data)
    return task_service_pb2.UploadSummary(total_bytes=total_bytes)
```

The client passes a generator of messages instead of a single one:

```python
def generate_chunks():
    for chunk in ["first", "second", "third"]:
        yield task_service_pb2.ChunkRequest(data=chunk.encode())

summary = stub.UploadChunks(generate_chunks())
print(summary.total_bytes)
```

---

## Bidirectional streaming — the gRPC analog to WebSockets

Both sides send a sequence of messages over the same call, each
independent of the other's timing — [directly comparable to a WebSocket connection](→ this lesson, websockets fundamentals concept):

```protobuf
rpc Chat (stream ChatMessage) returns (stream ChatMessage);
```

```python
def Chat(self, request_iterator, context):
    for message in request_iterator:
        yield task_service_pb2.ChatMessage(text=f"echo: {message.text}")
```

The server here both receives an iterator (like client-streaming) and
`yield`s responses (like server-streaming) — the two earlier shapes
combined into one call. The client side works the same way it did for
client-streaming, passing a generator, and iterates the return value the
same way it did for server-streaming.

---

## Quiz cards

> **Q1.** What's the only syntactic difference in a `.proto` file
> between a unary RPC and a server-streaming RPC?
> - A) An entirely different section of the file
> - B) The `stream` keyword before the response message type ✅
> - C) Server-streaming RPCs can't be declared in a `.proto` file at all
> - D) A separate file is required for streaming RPCs

> **Q2.** How does a server-streaming RPC's implementation differ from a
> unary RPC's, in Python?
> - A) There's no difference at all
> - B) It becomes a generator, `yield`-ing each response instead of `return`-ing a single one ✅
> - C) It must use `async def` instead of `def`
> - D) It requires a separate thread per response

> **Q3.** In a client-streaming RPC, what does the server's method
> receive instead of a single request object?
> - A) Nothing — client-streaming RPCs don't receive any input
> - B) An iterable of incoming request messages, arriving one at a time as the client sends them ✅
> - C) A single, pre-combined message containing everything the client sent
> - D) A file path to a temporary file the client wrote to

> **Q4.** What makes bidirectional streaming structurally different from
> both server-streaming and client-streaming?
> - A) Nothing — it's identical to server-streaming
> - B) The server's method both receives an iterator of incoming messages and `yields` its own responses, combining the two other streaming shapes into one call ✅
> - C) Bidirectional streaming can only be used with unary RPCs
> - D) It requires a completely separate protocol from gRPC

> **Q5.** Which two protocols from earlier in this lesson does
> gRPC's server-streaming and bidirectional streaming most directly
> resemble?
> - A) Polling and gRPC unary calls
> - B) Server-streaming resembles SSE; bidirectional streaming resembles WebSockets ✅
> - C) Both resemble plain HTTP polling
> - D) Neither resembles anything else covered in this lesson

---

## Applied sandbox exercise 3

*(a server-streaming gRPC service, implemented end to end)*

*Task shown to learner:* Given the `.proto` declaration
`rpc StreamTaskStatus (TaskRequest) returns (stream TaskStatus);` with
`TaskRequest { int32 task_id = 1; }` and
`TaskStatus { string status = 1; int32 progress = 2; }`, implement
`TaskServiceServicer.StreamTaskStatus` to `yield` three `TaskStatus`
messages in sequence: `("started", 0)`, `("running", 50)`,
`("complete", 100)`. Then write a client-side function
`collect_statuses(stub, task_id)` that calls `stub.StreamTaskStatus(...)`
and returns a list of `(status, progress)` tuples collected from the
stream.

*Grading:* the server is run for real, the client connects and calls
`collect_statuses`, and the returned list is checked against the
expected three-item sequence in order.

*Hint (shown on request):* The servicer method is a plain generator —
three `yield task_service_pb2.TaskStatus(status=..., progress=...)`
statements in a row. `collect_statuses` just needs
`[(s.status, s.progress) for s in stub.StreamTaskStatus(task_service_pb2.TaskRequest(task_id=task_id))]`
— a [list comprehension](→ Module 0, the data structures lesson, comprehensions concept) over the streamed responses.

*Correct answer + explanation (shown on failure, if requested):*
```python
class TaskServiceServicer(task_service_pb2_grpc.TaskServiceServicer):
    def StreamTaskStatus(self, request, context):
        for status, progress in [("started", 0), ("running", 50), ("complete", 100)]:
            yield task_service_pb2.TaskStatus(status=status, progress=progress)

def collect_statuses(stub, task_id):
    return [
        (s.status, s.progress)
        for s in stub.StreamTaskStatus(task_service_pb2.TaskRequest(task_id=task_id))
    ]
```
This is server-streaming's complete real shape: the servicer method
looks almost exactly like any other Python generator function, and the
client consumes it the same way it would consume any iterable — the
gRPC machinery underneath handles the actual streaming, encoding, and
decoding invisibly, the same division of labor [Concept 6's unary example](→ this lesson, gRPC fundamentals concept) already established.

---

*(End of Concept 7. This lesson continues with Concept 8 — testing
streaming, WebSocket, and gRPC endpoints — drafted separately.)*
