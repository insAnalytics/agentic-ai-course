# Module 0, Lesson 9 — Concept 5: Response models, status codes, and exception handling

> **Sandbox note:** same caveat as Concept 2 — live-execution approach
> for this lesson isn't finalized. This concept's exercise is written
> against `TestClient`-style checks as the intended grading mechanism,
> regardless of how it ultimately runs on the site.

---

## `response_model` — controlling what actually goes out

Just as a `BaseModel` parameter validates what comes *in*, a route's
`response_model` controls and validates what goes *out* — and, notably,
strips anything not declared on that model, even if the function
actually returns more:

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class AgentConfig(BaseModel):
    name: str
    model: str

class StoredAgent(BaseModel):
    id: int
    name: str
    model: str
    internal_notes: str

@app.get("/agents/{agent_id}", response_model=AgentConfig)
def get_agent(agent_id: int):
    return StoredAgent(id=agent_id, name="research_agent", model="claude-sonnet", internal_notes="flagged for review")
```

Even though `get_agent` actually returns a `StoredAgent` — including
`id` and `internal_notes` — the response sent to the client only
contains `AgentConfig`'s fields:

```json
{"name": "research_agent", "model": "claude-sonnet"}
```

`id` and `internal_notes` are silently dropped, not because the function
didn't have them, but because `response_model` defines the actual public
contract. This matters for exactly the reason it sounds like it would:
keeping something like `internal_notes` out of the response entirely,
by declaring the response shape explicitly, rather than trusting every
route to remember not to leak it.

---

## `status_code` — the response isn't always `200`

By default, a successful response is `200 OK`. `status_code` on the
route decorator sets a different one — `201 Created` is the conventional
choice for a successful `POST`:

```python
@app.post("/agents", response_model=AgentConfig, status_code=201)
def create_agent(config: AgentConfig):
    return config
```

---

## `HTTPException` — the HTTP-flavored version of a custom exception

[Custom exceptions from the I/O lesson](→ Module 0, the I/O and error handling lesson, custom exceptions concept) communicated a specific failure by type. `HTTPException` is FastAPI's version of the same idea, specifically shaped for HTTP — it carries a status code and a detail message, and raising it anywhere inside a route short-circuits straight to an error response:

```python
from fastapi import HTTPException

agents_db = {42: {"name": "research_agent", "model": "claude-sonnet"}}

@app.get("/agents/{agent_id}", response_model=AgentConfig)
def get_agent(agent_id: int):
    if agent_id not in agents_db:
        raise HTTPException(status_code=404, detail=f"agent {agent_id} not found")
    return agents_db[agent_id]
```

`GET /agents/999` produces:

```json
{"detail": "agent 999 not found"}
```

with status `404` — `raise HTTPException(...)` works exactly like
[any other `raise` you've written](→ Module 0, the I/O and error handling lesson, re-raising and exception chaining concept), it just happens to be an exception type FastAPI specifically knows how to turn into a proper HTTP error response.

---

## Global exception handlers — closing the loop on custom exceptions

`HTTPException` is fine per-route, but [a custom exception hierarchy, like `AgentError`/`ConfigError` from the I/O lesson](→ Module 0, the I/O and error handling lesson, custom exceptions and exception hierarchies concept), can be handled *globally*, once, rather than wrapped in a `try`/`except`/`HTTPException` in every single route that might raise it:

```python
from fastapi import Request
from fastapi.responses import JSONResponse

class AgentError(Exception):
    pass

class DuplicateAgentError(AgentError):
    def __init__(self, name: str):
        self.name = name
        super().__init__(f"an agent named '{name}' already exists")

@app.exception_handler(AgentError)
def handle_agent_error(request: Request, exc: AgentError):
    return JSONResponse(status_code=409, content={"detail": str(exc)})

@app.post("/agents", response_model=AgentConfig, status_code=201)
def create_agent(config: AgentConfig):
    if config.name in existing_names:
        raise DuplicateAgentError(config.name)
    return config
```

`@app.exception_handler(AgentError)` registers `handle_agent_error` to
run whenever *any* `AgentError` — including any subclass, like
`DuplicateAgentError`, [the same `isinstance`-based catching from the OOP and I/O lessons](→ Module 0, the I/O and error handling lesson, custom exceptions and exception hierarchies concept, the isinstance explanation) — is raised anywhere in the app, converting it into a proper `409 Conflict` response, without `create_agent` (or any other route) needing its own `try`/`except` for this case at all.

---

## Quiz cards

> **Q1.** What does `response_model=AgentConfig` actually do to a route
> function's return value?
> - A) Nothing — it's purely for documentation purposes
> - B) It validates and filters the outgoing response against that model, stripping any fields not declared on it, even if the function returned more ✅
> - C) It converts the response into plain text instead of JSON
> - D) It requires the function to return exactly an `AgentConfig` instance, nothing else

> **Q2.** Why might a route intentionally return a fuller object (like
> `StoredAgent`, with `internal_notes`) than its declared
> `response_model` (`AgentConfig`)?
> - A) This is always a mistake and should be avoided
> - B) `response_model` defines the actual public contract — fields not on it are dropped automatically, which is a deliberate way to keep something like internal data out of the response ✅
> - C) FastAPI requires the return value to always match `response_model` exactly
> - D) There's no reason — the two must always be identical types

> **Q3.** What does `status_code=201` on `@app.post(...)` change?
> - A) It makes the request take longer to process
> - B) It sets the HTTP status code returned on success to `201` instead of the default `200` — the conventional choice for a successful creation ✅
> - C) It only affects error responses, not successful ones
> - D) It's required for `POST` routes to work at all

> **Q4.** How does raising `HTTPException(status_code=404, detail="...")`
> inside a route behave?
> - A) It crashes the server with an unhandled error
> - B) It works like any other `raise`, short-circuiting to an error response — FastAPI specifically knows how to turn `HTTPException` into a proper HTTP response with that status code and detail ✅
> - C) It's silently ignored unless wrapped in `try`/`except`
> - D) It only works for `GET` requests

> **Q5.** What's the practical benefit of `@app.exception_handler(AgentError)`
> over wrapping every route that might raise it in its own
> `try`/`except`/`HTTPException`?
> - A) There's no real benefit — both approaches are equivalent
> - B) One handler, registered once, catches `AgentError` (and any subclass) anywhere in the app, rather than needing that same error-handling logic repeated in every route ✅
> - C) Global handlers only work for built-in exceptions, not custom ones
> - D) `@app.exception_handler` replaces the need for `response_model` entirely

> **Q6.** Does `@app.exception_handler(AgentError)` also catch a raised
> `DuplicateAgentError`, given `DuplicateAgentError(AgentError)`?
> - A) No — only the exact type `AgentError` is caught, never a subclass
> - B) Yes — the same `isinstance`-based inheritance matching from earlier in this course applies here too ✅
> - C) Only if `DuplicateAgentError` is registered with its own separate handler
> - D) This raises an error, since a handler can only be registered for one exact type

---

## Applied sandbox exercise 1

*(a small CRUD-ish endpoint combining path validation, request bodies,
response models, status codes, `HTTPException`, and a global handler)*

*Task shown to learner:* Build a small in-memory agent registry with two
endpoints:
- `POST /agents`, taking an `AgentConfig` body (`name: str`, `model: str`),
  returning a `201` with `response_model=AgentConfig`. If an agent with
  that `name` already exists, raise a custom `DuplicateAgentError`
  (registered with a global exception handler returning `409` and
  `{"detail": "an agent named '<name>' already exists"}`), rather than
  handling it with `HTTPException` directly in the route.
- `GET /agents/{agent_id}`, where `agent_id: int = Path(gt=0)`, returning
  the matching agent with `response_model=AgentConfig`. If no agent with
  that id exists, raise `HTTPException(status_code=404, detail=f"agent {agent_id} not found")`.

*Grading (via `TestClient`-style requests):*
```python
response = client.post("/agents", json={"name": "research_agent", "model": "claude-sonnet"})
assert response.status_code == 201
assert response.json() == {"name": "research_agent", "model": "claude-sonnet"}

duplicate = client.post("/agents", json={"name": "research_agent", "model": "claude-haiku"})
assert duplicate.status_code == 409
assert "already exists" in duplicate.json()["detail"]

not_found = client.get("/agents/999")
assert not_found.status_code == 404

invalid_id = client.get("/agents/-1")
assert invalid_id.status_code == 422   # Path(gt=0) rejects it before the route runs

found = client.get("/agents/1")
assert found.status_code == 200
assert found.json()["name"] == "research_agent"
```

*Hint (shown on request):* Store created agents in a plain dict keyed by
an auto-incrementing id. Register the `DuplicateAgentError` handler with
`@app.exception_handler(DuplicateAgentError)` before defining the routes
that might raise it. `Path(gt=0)` on `agent_id` handles the negative-id
case automatically — no manual check needed for that part.

*Correct answer + explanation (shown on failure, if requested):*
```python
from fastapi import FastAPI, HTTPException, Path, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI()

class AgentConfig(BaseModel):
    name: str
    model: str

class DuplicateAgentError(Exception):
    def __init__(self, name: str):
        self.name = name
        super().__init__(f"an agent named '{name}' already exists")

@app.exception_handler(DuplicateAgentError)
def handle_duplicate(request: Request, exc: DuplicateAgentError):
    return JSONResponse(status_code=409, content={"detail": str(exc)})

agents_db = {}
next_id = 1

@app.post("/agents", response_model=AgentConfig, status_code=201)
def create_agent(config: AgentConfig):
    global next_id
    if any(a["name"] == config.name for a in agents_db.values()):
        raise DuplicateAgentError(config.name)
    agents_db[next_id] = config.model_dump()
    next_id += 1
    return config

@app.get("/agents/{agent_id}", response_model=AgentConfig)
def get_agent(agent_id: int = Path(gt=0)):
    if agent_id not in agents_db:
        raise HTTPException(status_code=404, detail=f"agent {agent_id} not found")
    return agents_db[agent_id]
```
This composes everything from this lesson so far: `Path(gt=0)` rejects
an invalid id before `get_agent` even runs, `response_model` shapes both
endpoints' output consistently, `HTTPException` handles the
route-specific "not found" case, and the global `DuplicateAgentError`
handler shows the alternative — a reusable, app-wide way to turn a
custom exception into a proper structured response, exactly the payoff
[the custom exception hierarchy concept from the I/O lesson](→ Module 0, the I/O and error handling lesson, custom exceptions and exception hierarchies concept) was building toward.

---

*(End of Concept 5. This lesson continues with Concept 6 — automatic
docs: `/docs` and `/redoc` — drafted separately.)*
