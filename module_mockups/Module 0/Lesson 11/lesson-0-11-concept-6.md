# Module 0, Lesson 11 — Concept 6: gRPC fundamentals

---

## A different trade-off than JSON

Every data format this course has used so far — [JSON, from the I/O lesson](→ Module 0, the I/O and error handling lesson, working with json concept) — is plain text, self-describing, and readable without any special tooling: open the file, see the keys. Protocol Buffers ("protobuf"), what gRPC is built on, trade all of that away for something that pays off specifically once two services are calling each other constantly, across team and language boundaries: a **binary**, schema-first format, where the schema lives in a separate `.proto` file both sides are generated from, rather than something each side checks independently.

That schema-first shape is what actually earns its keep for
service-to-service communication: two independently-deployed services
using Pydantic on each side can still drift apart if one team changes a
field and the other doesn't notice — nothing forces the two to agree,
since each is just checking its own copy of the shape. A `.proto` file
removes that possibility structurally: both the client and the server
are compiled from the *same* file, so there's no "each side's
understanding" to drift apart in the first place. It also means the two
sides don't even need to be written in the same language — the same
`.proto` file can generate a Python client and a Go server. And because
the format itself is binary rather than repeated JSON text, the
messages it produces are meaningfully smaller — worth much more once a
call happens thousands of times a second internally than it would for a
single browser loading a page, which is exactly why SSE and WebSockets,
both plain JSON-over-text, stayed the right call for anything
client-facing.

---

## Writing a `.proto` file

```protobuf
// tool_service.proto
syntax = "proto3";

service ToolService {
  rpc ExecuteTool (ToolRequest) returns (ToolResponse);
}

message ToolRequest {
  // field numbers, not names, are what's actually sent on the wire —
  // never reuse or renumber one once a service has shipped
  string tool_name = 1;
  string arguments_json = 2;
}

message ToolResponse {
  string result = 1;
}
```

`ToolRequest`/`ToolResponse` are message schemas — each field gets a
type and a number (`= 1`, `= 2`). `ToolService` declares one RPC method,
`ExecuteTool` — this single **unary** RPC (one request, one response) is
the simplest of gRPC's four call shapes, [the other three covered next](→ this lesson, grpc streaming modes concept).

Those field numbers do real work in the binary encoding covered next — a
protobuf-encoded message never transmits the *name* `tool_name` at all,
only its number, with the human-readable name existing solely in the
`.proto` source and the generated Python wrapper around it. This is the
direct mechanical reason a protobuf message tends to be smaller than the
equivalent JSON: a short number in place of a repeated string key, on
every field, every message.

---

## From schema to real code: `protoc`

```bash
python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. tool_service.proto
```

This reads `tool_service.proto` and writes two Python files:
`tool_service_pb2.py`, containing `ToolRequest` and `ToolResponse` as
real Python classes, and `tool_service_pb2_grpc.py`, containing the
service-specific scaffolding — a base class to implement on the server,
and a client-side stub — both named directly after `ToolService` from
the `.proto` file, following one fixed pattern every gRPC service uses:
the service name plus `Servicer` for the class you subclass on the
server, and the service name plus `Stub` for the class you instantiate
on the client. A service called `AgentRegistry` in its `.proto` file
would produce `AgentRegistryServicer` and `AgentRegistryStub` the exact
same way — nothing about these two names is specific to this one
example.

Worth seeing that this is real, ordinary code and not a black box —
here's `tool_service_pb2_grpc.py`, trimmed to its essential shape:

```python
class ToolServiceStub:
    def __init__(self, channel):
        self.ExecuteTool = channel.unary_unary(
            "/ToolService/ExecuteTool",
            request_serializer=tool_service_pb2.ToolRequest.SerializeToString,
            response_deserializer=tool_service_pb2.ToolResponse.FromString,
        )

class ToolServiceServicer:
    def ExecuteTool(self, request, context):
        raise NotImplementedError("Method not implemented!")

def add_ToolServiceServicer_to_server(servicer, server):
    # wires servicer.ExecuteTool up to handle incoming "/ToolService/ExecuteTool" calls
    ...
```

`ToolServiceStub.__init__` is what makes `stub.ExecuteTool(...)` behave
like a plain method call — it's assigned as a real attribute, built from
`channel.unary_unary(...)`, wiring in exactly the request-encoding and
response-decoding functions [described in the previous section](→ this lesson, gRPC fundamentals concept, the how the binary encoding actually works explanation). `ToolServiceServicer.ExecuteTool` starts out just raising `NotImplementedError` — subclassing it and overriding `ExecuteTool` is what [Concept 6's server implementation](→ this lesson, gRPC fundamentals concept, the implementing the server explanation) is actually doing: replacing that placeholder with real logic.

(`tool_service_pb2.py` — the message classes — isn't shown here: in
current versions of `protoc`, that file is a compact serialized
descriptor decoded at import time, not readable Python class
definitions, so pasting its actual contents would look like noise
rather than clarify anything.)

---

## Implementing the server

```python
import grpc
from concurrent import futures
import tool_service_pb2
import tool_service_pb2_grpc

class ToolServiceServicer(tool_service_pb2_grpc.ToolServiceServicer):
    # method name must match the rpc name declared in the .proto file exactly
    def ExecuteTool(self, request, context):
        result = f"executed {request.tool_name} with {request.arguments_json}"
        return tool_service_pb2.ToolResponse(result=result)

server = grpc.server(futures.ThreadPoolExecutor(max_workers=4))
# registers this instance so incoming ExecuteTool calls actually reach it
tool_service_pb2_grpc.add_ToolServiceServicer_to_server(ToolServiceServicer(), server)
server.add_insecure_port("[::]:50051")
server.start()
server.wait_for_termination()
```

`class ToolServiceServicer(tool_service_pb2_grpc.ToolServiceServicer):`
is [ordinary inheritance from the OOP lesson](→ Module 0, the OOP lesson, inheritance concept) — subclassing the generated base class and implementing `ExecuteTool`, matching the exact method name declared in the `.proto` file. `request.tool_name` and `request.arguments_json` are already-decoded Python attributes by the time your method runs — the binary parsing from the previous section has already happened before `request` ever reaches your code. `add_ToolServiceServicer_to_server(...)` is the matching generated function that registers an instance of your class with the running gRPC server, so incoming calls to `ExecuteTool` actually reach it.

---

## Implementing the client

```python
import grpc
import tool_service_pb2
import tool_service_pb2_grpc

channel = grpc.insecure_channel("localhost:50051")
stub = tool_service_pb2_grpc.ToolServiceStub(channel)

response = stub.ExecuteTool(
    tool_service_pb2.ToolRequest(tool_name="calculator", arguments_json='{"expr": "2+2"}')
)
print(response.result)
```
```
executed calculator with {"expr": "2+2"}
```

`stub.ExecuteTool(...)` reads like an ordinary function call, but behind
it is a real network round trip: encoding the `ToolRequest` into the
binary format, sending it over the connection, and decoding the
server's `ToolResponse` back into an object with a normal `.result`
attribute — this is the realistic shape [Concept 2's decision framework](→ this lesson, choosing the right protocol concept) pointed at: an agent backend calling `stub.ExecuteTool(...)` to reach an internal tool service, on a schema both sides are structurally guaranteed to agree on.

---

## Quiz cards

> **Q1.** Why is protobuf's binary encoding typically more compact than
> the equivalent JSON message?
> - A) Protobuf compresses the data using a general-purpose algorithm
> - B) Protobuf never transmits field names at all — only compact numeric tags from the `.proto` file — while JSON repeats every field's name as a string in every message ✅
> - C) JSON always includes more fields than protobuf allows
> - D) There's no real size difference between the two

> **Q2.** Why must a `.proto` file's field numbers (`= 1`, `= 2`) never
> be reused or changed once a service has shipped?
> - A) They're purely cosmetic and can be changed freely
> - B) They're the actual identifiers used in the binary wire format — changing them would make old and new messages decode into different things at the byte level ✅
> - C) Field numbers must always be sequential starting from 0
> - D) Changing them only affects the generated Python class names

> **Q3.** Why does gRPC's schema-first setup pay off for
> service-to-service communication specifically, more than it would for
> a browser talking to an API?
> - A) It doesn't — gRPC is strictly better in every situation
> - B) The benefits — a shared contract two sides can't silently drift apart on, language independence, and compact encoding at high call volume — matter most for frequent, cross-team internal calls, not a single browser session ✅
> - C) Browsers technically cannot make gRPC calls under any circumstances
> - D) JSON is always faster than protobuf regardless of context

> **Q4.** Where does the class name `ToolServiceServicer` actually come
> from?
> - A) It's an arbitrary name the developer must choose independently
> - B) It's generated directly from the `.proto` file's `service ToolService` declaration, following protoc's fixed naming pattern of the service name plus `Servicer` ✅
> - C) It's a built-in gRPC class unrelated to the `.proto` file's contents
> - D) It only exists if the service has more than one RPC method

> **Q5.** What does `stub.ExecuteTool(...)` actually do when called on
> the client?
> - A) It runs `ExecuteTool`'s logic locally, without any network call
> - B) It makes a real network call — encoding the request into the binary format, sending it, and decoding the response — while reading like an ordinary function call ✅
> - C) It only prepares the request; a separate method must send it
> - D) It requires manually managing the binary encoding yourself

> **Q6.** In the actual generated `ToolServiceStub.__init__`, what makes
> `stub.ExecuteTool` callable like a normal method?
> - A) Nothing generated — the developer must write this method by hand afterward
> - B) It's assigned as a real attribute built from `channel.unary_unary(...)`, already wired to the correct request/response encoding functions ✅
> - C) `ExecuteTool` is inherited from a built-in gRPC base class with no connection to this specific service
> - D) It only works after `add_ToolServiceServicer_to_server` has also been called on the client

---

*(End of Concept 6. This lesson continues with Concept 7 — gRPC
streaming modes — drafted separately.)*
