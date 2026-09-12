# Module 0, Lesson 9 — Concept 7: Async routes

---

## `async def` vs. plain `def` routes

A route can be declared either way:

```python
@app.get("/sync-agent")
def get_agent_sync():
    return {"name": "research_agent"}

@app.get("/async-agent")
async def get_agent_async():
    return {"name": "research_agent"}
```

Both work, and for a route like this — no actual waiting involved —
there's no real difference. The distinction only matters once a route
actually does I/O-bound waiting: [calling an LLM API, another service, or awaiting anything else](→ Module 0, the async lesson, why concurrency matters concept) inside the route function.

---

## Where it actually matters

```python
import asyncio

async def call_llm_api(prompt: str) -> str:
    await asyncio.sleep(1)   # standing in for a real network call
    return f"response to: {prompt}"

@app.post("/generate")
async def generate(prompt: str):
    result = await call_llm_api(prompt)
    return {"result": result}
```

`async def generate` can `await call_llm_api(...)` directly — exactly
[the coroutine-calling-coroutine pattern from the async lesson](→ Module 0, the async lesson, async/await and coroutines concept, the await-ing from inside another coroutine explanation). While this one request is waiting on `call_llm_api`, FastAPI's event loop is free to handle *other* incoming requests concurrently — the entire reason this course built up `asyncio` in the first place, now paying off directly inside route handling.

---

## The trap: a blocking call inside `async def`

This is [the exact poisoning behavior from the async lesson](→ Module 0, the async lesson, asyncio.sleep vs time.sleep concept, the blocking explanation), now in a context where it's easy to hit by accident — a route declared `async def` that calls a genuinely blocking function (a synchronous database driver, `time.sleep()`, a non-async HTTP library) blocks the *entire server*, not just that one request:

```python
import time

@app.post("/generate-blocking")
async def generate_blocking(prompt: str):
    time.sleep(1)   # blocking — freezes every other request too
    return {"result": f"response to: {prompt}"}
```

While this route is inside `time.sleep(1)`, *no other request to this
server* — to any route, from any client — can be processed, exactly like
[one blocking call poisoning an entire `gather()` in the async lesson](→ Module 0, the async lesson, asyncio.sleep vs time.sleep concept). The rule from that lesson applies unchanged: never call a blocking function from inside `async def` code.

---

## The fix, if a route genuinely needs blocking code

If a route needs to call something blocking that has no async
alternative, the fix is simply *not* declaring it `async def` — FastAPI
automatically runs a plain `def` route in a separate thread pool, rather
than directly on the event loop:

```python
@app.post("/generate-safe")
def generate_safe(prompt: str):
    time.sleep(1)   # blocking, but this route isn't async def —
    return {"result": f"response to: {prompt}"}   # FastAPI runs it in a thread pool instead
```

This route still takes a full second to respond, and it's still not
*concurrent* with itself the way `await`-ing a real async call would be
— but it no longer blocks the *entire server* the way the broken
`async def` version did, since it isn't running on the shared event
loop at all.

**The practical rule:** declare a route `async def` only when it
actually `await`s something — an async database driver, an async HTTP
client, another coroutine. If a route's logic is entirely synchronous
(plain, blocking calls, no `await` anywhere in its body), leave it a
plain `def` and let FastAPI's thread pool handle it safely, rather than
declaring `async def` out of habit and accidentally introducing the
poisoning trap.

---

## Quiz cards

> **Q1.** For a route with no actual waiting involved (just returning a
> value immediately), does it matter whether it's declared `async def`
> or plain `def`?
> - A) Yes, significantly — one is always faster
> - B) No meaningful difference — the distinction only matters once a route actually does I/O-bound waiting ✅
> - C) `async def` is required for every route regardless of content
> - D) Plain `def` routes can't return JSON

> **Q2.** What does `await call_llm_api(...)` inside an `async def` route
> allow the server to do while that one request is waiting?
> - A) Nothing — the whole server pauses until it finishes
> - B) Handle other incoming requests concurrently, since the event loop is free during that wait ✅
> - C) It automatically retries the call if it's slow
> - D) It cancels any other in-progress requests

> **Q3.** Why does calling `time.sleep(1)` inside an `async def` route
> block *every* request to the server, not just that one?
> - A) It doesn't — this only affects the current request
> - B) A blocking call inside async code freezes the entire shared event loop, the same poisoning behavior covered in the async lesson — nothing else scheduled on that loop can make progress either ✅
> - C) `time.sleep()` isn't allowed inside route functions at all
> - D) This only happens if `await` is also used in the same route

> **Q4.** Why does calling `time.sleep(1)` inside a plain `def` route
> (not `async def`) not have the same server-wide blocking effect?
> - A) It does have the exact same effect — there's no real difference
> - B) FastAPI automatically runs plain `def` routes in a separate thread pool rather than directly on the shared event loop ✅
> - C) `time.sleep()` behaves differently depending on the route's HTTP method
> - D) Plain `def` routes can't call blocking functions at all

> **Q5.** What's the practical rule for deciding whether a route should
> be `async def` or plain `def`?
> - A) Always use `async def` — it's strictly better in every case
> - B) Use `async def` only when the route actually `await`s something; otherwise leave it a plain `def` and let FastAPI's thread pool handle any blocking work safely ✅
> - C) Always use plain `def` — `async def` should be avoided entirely
> - D) The choice only affects the response's status code

---

*(End of Concept 7. This lesson continues with Concept 8 — dependency
injection with `Depends()` — drafted separately.)*
