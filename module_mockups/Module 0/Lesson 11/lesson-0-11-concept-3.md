# Module 0, Lesson 11 — Concept 3: Implementing SSE with `StreamingResponse`

---

## `StreamingResponse` — sending a response incrementally

Every response so far has been built completely, then sent all at once.
`StreamingResponse` instead takes a generator — [an async generator, specifically, using `async def` with `yield`](→ Module 0, the async lesson, async/await and coroutines concept) — and streams each yielded chunk to the client as soon as it's produced, rather than waiting for everything to be ready first:

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import asyncio

app = FastAPI()

async def generate_tokens():
    tokens = ["The", " agent", " is", " responding", "."]
    for token in tokens:
        yield token
        await asyncio.sleep(0.3)   # standing in for real generation time

@app.get("/stream")
async def stream_response():
    return StreamingResponse(generate_tokens(), media_type="text/plain")
```

A client connected to `GET /stream` receives `"The"`, then `" agent"`,
then `" is"`, and so on — each one arriving roughly 0.3 seconds after
the last, rather than the client waiting 1.5 seconds for the entire
response to be built before receiving anything at all.

---

## The actual SSE wire format

Plain streamed text works for a simple case, but SSE has a specific,
lightweight format worth using for anything real — each event is
`data: <content>`, followed by a blank line, with an optional
`event: <name>` line before it to label what kind of event it is:

```python
import json

async def generate_status_events():
    steps = [
        {"status": "started", "progress": 0},
        {"status": "running", "progress": 40},
        {"status": "running", "progress": 80},
        {"status": "complete", "progress": 100},
    ]
    for step in steps:
        yield f"event: status\ndata: {json.dumps(step)}\n\n"
        await asyncio.sleep(1)

@app.get("/tasks/{task_id}/stream")
async def stream_task_status(task_id: int):
    return StreamingResponse(generate_status_events(), media_type="text/event-stream")
```

`media_type="text/event-stream"` is what actually marks this as SSE —
it tells the client (and any intermediate proxies) to treat the
connection as a long-lived event stream rather than a normal response
to buffer and close. `json.dumps(step)` [is exactly the JSON-serialization step from the I/O lesson](→ Module 0, the I/O and error handling lesson, working with JSON concept), just producing one small JSON payload per event instead of one JSON document for the whole response.

---

## What this replaces, concretely

This is the direct fix for [the polling baseline from earlier in this lesson](→ this lesson, the protocol landscape for agentic systems concept, the baseline polling explanation): instead of a client repeatedly asking `GET /tasks/42/status` in a loop, it opens `GET /tasks/42/stream` once and receives each status change the moment the server actually has one — no wasted requests, no polling-interval latency, and the server only sends data when something genuinely changed.

---

## Quiz cards

> **Q1.** What does `StreamingResponse` do differently from a normal
> FastAPI response?
> - A) Nothing — it's just a different name for the same thing
> - B) It sends each yielded chunk to the client as soon as it's produced, rather than building the entire response before sending anything ✅
> - C) It only works for JSON responses
> - D) It requires a WebSocket connection underneath

> **Q2.** What does `media_type="text/event-stream"` actually signal?
> - A) Nothing functional — it's purely cosmetic
> - B) That this response should be treated as a long-lived SSE event stream, not a normal response to buffer and close ✅
> - C) That the response body must be plain text, never JSON
> - D) It's required for `StreamingResponse` to work at all, regardless of format

> **Q3.** In the SSE wire format, what does a blank line after each
> `data: ...` line signal?
> - A) Nothing — it's optional formatting
> - B) The end of that individual event — the client knows one complete event has been sent ✅
> - C) That the connection should close
> - D) That an error occurred

> **Q4.** How does streaming task status via SSE avoid the wasted
> requests and latency problems of polling, described earlier in this
> lesson?
> - A) It doesn't — it has the exact same characteristics as polling
> - B) The client opens one connection and receives each status change the moment the server has one, rather than repeatedly asking and receiving mostly "nothing changed" responses ✅
> - C) SSE requires the client to poll even more frequently than before
> - D) SSE only works for a single event, never a sequence of updates

---

## Applied sandbox exercise 1

*(a streaming task-status endpoint using the real SSE format)*

*Task shown to learner:* Implement `GET /tasks/{task_id}/stream`,
returning a `StreamingResponse` with `media_type="text/event-stream"`,
yielding four SSE-formatted `status` events in sequence:
`{"status": "started", "progress": 0}`,
`{"status": "running", "progress": 50}`,
`{"status": "complete", "progress": 100}` — each formatted exactly as
`f"event: status\ndata: {json.dumps(step)}\n\n"`, with a short
`asyncio.sleep` between each.

*Grading:* the endpoint's raw streamed response body is read in full
and checked to contain all three `event: status` blocks in order, each
with the correct JSON payload on its `data:` line.

*Hint (shown on request):* This is nearly identical to
`generate_status_events` shown in this concept — an `async def`
generator function `yield`-ing each formatted string, passed directly
as `StreamingResponse`'s first argument.

*Correct answer + explanation (shown on failure, if requested):*
```python
import json
import asyncio
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

app = FastAPI()

async def generate_task_events():
    steps = [
        {"status": "started", "progress": 0},
        {"status": "running", "progress": 50},
        {"status": "complete", "progress": 100},
    ]
    for step in steps:
        yield f"event: status\ndata: {json.dumps(step)}\n\n"
        await asyncio.sleep(0.1)

@app.get("/tasks/{task_id}/stream")
async def stream_task_status(task_id: int):
    return StreamingResponse(generate_task_events(), media_type="text/event-stream")
```
This is the minimal, complete shape of a real SSE endpoint: an async
generator producing correctly-formatted events, and `StreamingResponse`
handing each one to the client as it's yielded — the actual mechanism
behind streaming an LLM's tokens or any other progressive server-side
update.

---

*(End of Concept 3. This lesson continues with Concept 4 — WebSockets
fundamentals — drafted separately.)*
