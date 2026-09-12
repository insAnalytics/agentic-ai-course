# Module 0, Lesson 9 — Concept 10: Building a real app

---

## `APIRouter` — organizing routes across files

Every example so far has lived in one file. A real app splits routes
across files the same way [any Python project splits code across modules](→ Module 0, the functions lesson, modules and imports concept) — `APIRouter` is FastAPI's version of that split:

```python
# agents.py
from fastapi import APIRouter

router = APIRouter(prefix="/agents", tags=["agents"])

@router.get("/{agent_id}")
def get_agent(agent_id: int):
    return {"agent_id": agent_id}
```

```python
# main.py
from fastapi import FastAPI
from agents import router as agents_router

app = FastAPI()
app.include_router(agents_router)
```

`prefix="/agents"` means every route on this router is automatically
prefixed — the route defined as `"/{agent_id}"` in `agents.py` actually
serves `GET /agents/{agent_id}` once included in `main.py`. `main.py`
just imports and includes routers, the same [`from module import name` pattern from the functions lesson](→ Module 0, the functions lesson, modules and imports concept, the importing your own module explanation), keeping the app's entry point small as more routers get added for other resources.

---

## CORS — allowing cross-origin requests

A browser blocks a web page from one origin (`https://my-frontend.com`)
from calling an API on a different origin (`https://api.my-app.com`) by
default — a security restriction browsers enforce, called **CORS**
(Cross-Origin Resource Sharing). An agent frontend calling this API from
a different domain is exactly this situation, and needs the API to
explicitly opt in:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://my-frontend.com"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

`add_middleware` wraps every request/response passing through the app —
here, adding the specific headers that tell a browser "requests from
`https://my-frontend.com` are allowed." Without this, a browser-based
frontend calling this API from a different origin would have its
requests blocked by the browser itself, before your API even sees them.

---

## Rate limiting

Beyond *who* can call an endpoint ([Concept 9's authentication](→ this lesson, authentication concept)), a real API also needs to limit *how often* — especially relevant for an endpoint that calls an LLM, where each request carries a real cost. `slowapi` is a common library for this, not built into FastAPI itself:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.get("/generate")
@limiter.limit("5/minute")
def generate(request: Request):
    return {"result": "..."}
```

`@limiter.limit("5/minute")` restricts each client (identified here by
IP address, via `get_remote_address`) to 5 requests per minute to this
route — a 6th request within that window gets rejected automatically
with a `429 Too Many Requests` response, before `generate`'s own logic
runs.

---

## Startup and shutdown: the `lifespan` context manager

Some setup should happen exactly once — when the app starts — rather
than on every single request: opening a shared database connection pool,
initializing a client for an external API. FastAPI's `lifespan` is [a context manager](→ Module 0, the I/O and error handling lesson, file I/O and context managers concept, the with statement explanation), the same mechanism as `with open(...)`, just scoped to the entire application's lifetime instead of one file:

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("starting up: connecting to shared resources...")
    app.state.llm_client = create_llm_client()
    yield
    print("shutting down: closing connections...")
    app.state.llm_client.close()

app = FastAPI(lifespan=lifespan)
```

Everything before `yield` runs once, at startup; everything after
`yield` runs once, at shutdown — [the exact same before-yield/after-yield structure a context manager always has](→ Module 0, the I/O and error handling lesson, file I/O and context managers concept), guaranteeing the shutdown code runs even if the app is stopped abnormally, the same guarantee `with` gives a single file.

---

## Background tasks — work after the response is sent

Some work shouldn't delay a response at all — logging an analytics
event, sending a notification — but also doesn't need to block the
client waiting for it to finish. `BackgroundTasks` schedules a function
to run *after* the response has already been sent:

```python
from fastapi import BackgroundTasks

def log_generation(prompt: str):
    print(f"logging: generated a response for '{prompt}'")

@app.post("/generate")
def generate(prompt: str, background_tasks: BackgroundTasks):
    result = f"response to: {prompt}"
    background_tasks.add_task(log_generation, prompt)
    return {"result": result}
```

The client receives `{"result": "..."}` immediately — `log_generation`
runs afterward, in the background, without the client waiting on it at
all. This is a different tool than [Lesson 7's `create_task()`](→ Module 0, the async lesson, asyncio.sleep vs time.sleep concept, the create_task explanation): `create_task()` starts something concurrent *within* a running coroutine; `BackgroundTasks` specifically defers work until *after* a response has already gone out, which is the shape that fits logging or notification work tied to one specific request.

---

## Quiz cards

> **Q1.** What does `prefix="/agents"` on an `APIRouter` do?
> - A) It has no effect on the final route paths
> - B) It's automatically prepended to every route defined on that router — a route defined as `/{agent_id}` actually serves `/agents/{agent_id}` once included ✅
> - C) It requires every route on the router to accept an `agent_id` parameter
> - D) It renames the router itself, not its routes

> **Q2.** What problem does CORS middleware solve?
> - A) It speeds up requests between the frontend and backend
> - B) By default, browsers block a web page on one origin from calling an API on a different origin — CORS middleware explicitly allows specified origins to make those cross-origin requests ✅
> - C) It encrypts all traffic between client and server
> - D) It's required for any API to accept `POST` requests

> **Q3.** Why might rate limiting matter more for an LLM-backed endpoint
> than a typical API endpoint?
> - A) It doesn't — rate limiting is equally important everywhere
> - B) Each request to an LLM-backed endpoint carries a real, ongoing cost, making unrestricted repeated calls from one client more costly to allow unchecked ✅
> - C) LLM endpoints can't be rate limited at all
> - D) Rate limiting only applies to `POST` requests

> **Q4.** In FastAPI's `lifespan` context manager, when does the code
> after `yield` actually run?
> - A) Before every single request
> - B) Once, at application shutdown — the same before-yield/after-yield structure any context manager has, just scoped to the app's entire lifetime ✅
> - C) It never runs unless an exception occurs
> - D) Immediately after the code before `yield`, with no relationship to shutdown

> **Q5.** What's the difference between `BackgroundTasks` and
> `asyncio.create_task()` from the async lesson?
> - A) They're identical in every way
> - B) `create_task()` starts something running concurrently within a coroutine; `BackgroundTasks` specifically defers work until after a response has already been sent to the client ✅
> - C) `BackgroundTasks` can only be used with `async def` routes
> - D) `create_task()` is FastAPI-specific, `BackgroundTasks` is part of core Python

---

*(End of Concept 10 — final concept section of Lesson 9. This lesson
continues with the outcomes callout, comprehensive quiz, and
comprehensive sandbox — drafted separately.)*
