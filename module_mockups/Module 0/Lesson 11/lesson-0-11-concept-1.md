# Module 0, Lesson 11 — Concept 1: The protocol landscape for agentic systems

---

## The baseline: polling, and why it's wasteful

Before any new protocol, the default approach everyone reaches for
first: a client repeatedly asking "is it done yet?"

```python
import time
import requests

while True:
    response = requests.get("http://localhost:8000/tasks/42/status")
    status = response.json()["status"]
    if status == "complete":
        break
    time.sleep(2)

print("task finished")
```

For a long-running agent task — generating a response, running several
tool calls — this has real costs: **wasted requests** (most polls
return "still running," carrying no actual new information),
**latency** (the client only learns "complete" up to 2 seconds after it
actually finished — on average, half the polling interval, purely from
waiting for the next scheduled check), and **server load** that scales
with how *impatient* clients are, not with how much actual work is
happening. Polling isn't wrong, exactly — it's simple, and works
everywhere plain HTTP works — but it's the fallback of last resort this
lesson's actual protocols exist to improve on.

---

## Server-Sent Events (SSE) — one-way server push

SSE lets a server push updates to a client over a single, long-lived
HTTP connection, without the client needing to ask again — the server
sends new data whenever it has some, and the client just listens:

```
event: status
data: {"status": "running", "progress": 40}

event: status
data: {"status": "complete", "progress": 100}
```

The defining trait: **one direction only**, server to client. A perfect
fit for exactly the case this course keeps returning to — streaming an
LLM's tokens back to a client as they're generated, or pushing status
updates for a long-running task — where the client has nothing further
to say once the request starts.

---

## WebSockets — genuine two-way communication

A WebSocket is a different kind of connection entirely: after an initial
handshake, both sides can send messages to each other, at any time,
over the same persistent connection — not request/response at all
anymore.

```
client → server: {"action": "start_task", "prompt": "..."}
server → client: {"status": "running", "progress": 10}
client → server: {"action": "cancel"}
server → client: {"status": "cancelled"}
```

This fits situations SSE structurally can't: a chat interface where the
user keeps sending new messages mid-conversation, or letting a client
cancel a running task — anything genuinely bidirectional, not just a
one-way feed.

---

## gRPC — structured, service-to-service communication

Unlike the previous two — both aimed at a browser or CLI client — gRPC
is primarily for **service-to-service** communication: one backend
calling another, internally, rather than a client-facing API. It's
built on HTTP/2, uses a binary, schema-first data format called
**Protocol Buffers** instead of JSON, and formally defines four
communication shapes: a plain one-request-one-response call, plus
server-streaming, client-streaming, and fully bidirectional streaming —
directly echoing the same shapes SSE and WebSockets cover, just for the
internal-service case rather than a public-facing one.

The realistic fit here: an agent backend calling an internal tool
service — reliably, with a strict, versioned schema — rather than that
tool service being reachable directly from a browser.

---

## The landscape, side by side

| | Direction | Persistent connection | Typical fit |
|---|---|---|---|
| **Polling** | Client asks, repeatedly | No | Fallback only |
| **SSE** | Server → client only | Yes | Streaming tokens, status updates |
| **WebSockets** | Both directions | Yes | Chat, cancellable tasks, live collaboration |
| **gRPC** | Either, service-defined | Depends on RPC type | Internal service-to-service calls |

The rest of this lesson implements SSE, WebSockets, and gRPC each in
turn, then covers testing all three and a broadcast pattern for
managing many connected clients at once.

---

## Quiz cards

> **Q1.** What are the concrete costs of polling for a long-running
> task's status?
> - A) None — polling is just as efficient as any alternative
> - B) Wasted requests (most polls carry no new information), added latency (up to a full polling interval before the client learns something changed), and server load that scales with client impatience ✅
> - C) Polling only has a latency cost, no load cost
> - D) Polling requires a persistent connection, unlike the alternatives

> **Q2.** What's the defining structural limit of SSE?
> - A) It requires a binary data format
> - B) It's one-directional — server to client only; the client can't send anything back over that same connection ✅
> - C) It only works over gRPC
> - D) It can't be used for streaming text at all

> **Q3.** What makes WebSockets structurally different from both polling
> and SSE?
> - A) Nothing — they're functionally identical to SSE
> - B) Genuine two-way communication over one persistent connection — either side can send a message at any time, not just server-to-client ✅
> - C) WebSockets can only send binary data, never text
> - D) WebSockets require gRPC underneath

> **Q4.** What's the primary intended use case for gRPC, compared to SSE
> and WebSockets?
> - A) The exact same use case — a client-facing browser API
> - B) Service-to-service communication — one backend calling another internally, using a strict, versioned schema rather than a public-facing connection ✅
> - C) gRPC can only be used for one-way communication
> - D) gRPC replaces the need for HTTP entirely

> **Q5.** What data format does gRPC use instead of JSON?
> - A) It still uses JSON, just over a different connection type
> - B) Protocol Buffers — a binary, schema-first format ✅
> - C) XML
> - D) Plain text, with no defined schema at all

---

*(End of Concept 1. This lesson continues with Concept 2 — choosing the
right protocol — drafted separately.)*
