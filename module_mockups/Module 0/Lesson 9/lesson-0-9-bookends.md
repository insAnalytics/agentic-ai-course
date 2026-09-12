# Develop and Document REST API Endpoints

> **You'll be able to**
> - Explain REST's core building blocks (resources, URIs, the five HTTP
>   methods, idempotency) and its guiding principles, and articulate why
>   FastAPI's ASGI/Pydantic foundation fits an agent backend specifically
> - Define routes with path/query/header/cookie parameters and real
>   validation constraints, and avoid the route-ordering gotcha
> - Validate request bodies (including file uploads) with Pydantic, and
>   shape, status-code, and error-handle responses — per-route with
>   `HTTPException`, or globally with `@app.exception_handler`
> - Read the automatically generated `/docs` and `/redoc` pages, and
>   explain what they're actually built from
> - Write both `async def` and plain `def` routes correctly, know which
>   fits which situation, and avoid blocking the entire server
> - Use `Depends()` for shared logic, implement API key auth, and
>   describe how JWT-based auth fits REST's statelessness
> - Organize a multi-file app with `APIRouter`, and add CORS, rate
>   limiting, startup/shutdown logic, and background tasks

**Why it matters**
This lesson is where nearly everything else in Module 0 converges into
one deployable thing: Pydantic validates what a client sends, decorators
wire up what happens when a request arrives, `async`/`await` lets one
route wait on an LLM call without blocking every other request, and
custom exceptions from the I/O lesson become real HTTP error responses.
An agent that serves tool endpoints, receives webhooks, or exposes
results to a frontend needs exactly this — and needs it done with real
attention to who's allowed to call it and how often, not just that it
technically works.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all ten concepts, mixed order)*

> **Q1.** What does "idempotent" mean for an HTTP method?
> - A) The method can only be called once, ever
> - B) Making the same request multiple times has the same effect as making it once ✅
> - C) The method never modifies any data
> - D) The method always returns an identical response body every time

> **Q2.** What's the key difference between ASGI and WSGI that matters
> for FastAPI specifically?
> - A) There's no real difference
> - B) ASGI is async-native from the ground up, allowing `async def` routes to work natively — something a WSGI-based framework can't natively support ✅
> - C) WSGI is newer and faster
> - D) ASGI only supports GET requests

> **Q3.** Given `/agents/{agent_id}` defined before `/agents/me`, why
> does a request to `/agents/me` never reach the `/agents/me` route?
> - A) `/agents/me` is invalid syntax
> - B) Routes match top to bottom, first match wins — `/agents/{agent_id}` matches first, since `"me"` is a valid value for the dynamic segment ✅
> - C) FastAPI requires alphabetical route ordering
> - D) This isn't a real issue

> **Q4.** What happens when a route function parameter is typed as a
> Pydantic `BaseModel`?
> - A) Nothing special
> - B) FastAPI validates the request's JSON body against that model automatically, before the route function runs ✅
> - C) It only works for `GET` requests
> - D) It must be the route's only parameter

> **Q5.** What does `response_model` do to a route's return value?
> - A) Nothing — purely documentation
> - B) It validates and filters the outgoing response, stripping any fields not declared on the model, even if the function returned more ✅
> - C) It converts the response to plain text
> - D) It requires the function to return exactly that model instance

> **Q6.** What's the benefit of `@app.exception_handler(AgentError)` over
> wrapping every route in its own `try`/`except`/`HTTPException`?
> - A) No real benefit
> - B) One handler, registered once, catches that exception (and any subclass) anywhere in the app, rather than repeating the same handling logic per route ✅
> - C) Global handlers only work for built-in exceptions
> - D) It replaces the need for `response_model`

> **Q7.** What actually generates the content shown at `/docs`?
> - A) A separate documentation file written by hand
> - B) An OpenAPI schema FastAPI builds automatically by inspecting routes, parameters, and Pydantic models ✅
> - C) Comments manually added to each route
> - D) A third-party service

> **Q8.** Why does a blocking call like `time.sleep()` inside an
> `async def` route block every other request to the server, not just
> that one?
> - A) It doesn't
> - B) A blocking call inside async code freezes the entire shared event loop — nothing else scheduled on it can make progress ✅
> - C) `time.sleep()` isn't allowed inside routes at all
> - D) Only `POST` routes are affected

> **Q9.** Why does the same blocking call inside a plain `def` route not
> have that server-wide effect?
> - A) It does have the exact same effect
> - B) FastAPI runs plain `def` routes in a separate thread pool rather than directly on the shared event loop ✅
> - C) `time.sleep()` behaves differently based on HTTP method
> - D) Plain `def` routes can't call blocking functions

> **Q10.** What does `Depends()` let you avoid, compared to repeating the
> same setup or validation logic in every route?
> - A) Nothing — it's purely stylistic
> - B) Duplicating shared logic — it's written once in a function and reused across every route that declares it as a dependency ✅
> - C) The need for Pydantic models
> - D) The need for type hints

> **Q11.** How does JWT-based authentication connect to REST's
> statelessness principle?
> - A) It doesn't — JWTs require the server to remember logged-in users
> - B) Everything needed to verify a request travels in the token itself, every time — the server never needs to recall anything about a client between requests ✅
> - C) Statelessness makes authentication impossible
> - D) JWTs are only used in non-RESTful APIs

> **Q12.** What does CORS middleware actually address?
> - A) It speeds up requests
> - B) Browsers block a page on one origin from calling an API on a different origin by default — CORS middleware explicitly permits specified origins to do so ✅
> - C) It encrypts traffic between client and server
> - D) It's required for any API accepting `POST` requests

> **Q13.** In FastAPI's `lifespan` context manager, when does code after
> `yield` run?
> - A) Before every request
> - B) Once, at application shutdown — the same before/after-yield structure any context manager has ✅
> - C) Never, unless an exception occurs
> - D) Immediately, with no relationship to shutdown

---

## Comprehensive sandbox

*(end of lesson, applied — a small multi-file agent registry app,
combining nearly every concept: `APIRouter`, Pydantic request/response
validation, a global exception handler, API key auth via `Depends()`,
a `lifespan`-initialized shared registry, a background-logged
registration, and CORS)*

*Starter code shown to learner — two file tabs:*

**Tab: `agents.py`**
```python
from fastapi import APIRouter, Depends, Header, HTTPException, Path, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel

API_KEY = "secret-key-123"

class AgentConfig(BaseModel):
    name: str
    model: str

class DuplicateAgentError(Exception):
    def __init__(self, name: str):
        self.name = name
        super().__init__(f"an agent named '{name}' already exists")

def verify_api_key(x_api_key: str = Header(default=None)):
    """
    TODO: raise HTTPException(status_code=401, detail="invalid or missing API key")
    if x_api_key doesn't match API_KEY.
    """
    pass

def log_registration(name: str):
    print(f"registered new agent: {name}")

router = APIRouter(prefix="/agents", tags=["agents"])

@router.post("", response_model=AgentConfig, status_code=201, dependencies=[Depends(verify_api_key)])
def create_agent(config: AgentConfig, request: Request, background_tasks: BackgroundTasks):
    """
    TODO:
      - access the shared registry via request.app.state.registry (a dict)
      - if config.name already exists as a value's "name" in the registry, raise DuplicateAgentError
      - otherwise, store it under a new auto-incrementing id (request.app.state.next_id,
        incrementing it afterward) and schedule log_registration as a background task
      - return config
    """
    pass

@router.get("/{agent_id}", response_model=AgentConfig, dependencies=[Depends(verify_api_key)])
def get_agent(request: Request, agent_id: int = Path(gt=0)):
    """
    TODO: look up agent_id in request.app.state.registry; raise
    HTTPException(status_code=404, detail=f"agent {agent_id} not found") if missing.
    """
    pass
```

**Tab: `main.py`**
```python
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from agents import router as agents_router, DuplicateAgentError

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    TODO: initialize app.state.registry = {} and app.state.next_id = 1
    before yield. Nothing needed after yield for this exercise.
    """
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://my-frontend.com"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

@app.exception_handler(DuplicateAgentError)
def handle_duplicate(request: Request, exc: DuplicateAgentError):
    return JSONResponse(status_code=409, content={"detail": str(exc)})

app.include_router(agents_router)
```

*Task shown to learner:* Fill in every `TODO` across both files so the
app behaves as described — a working multi-file agent registry with
shared, auto-incrementing storage initialized once at startup, protected
by API key auth, with proper validation, a global duplicate-name
handler, and background-logged registrations.

*Hidden test cases (via `TestClient`-style requests against the
assembled app):*
```python
no_key = client.post("/agents", json={"name": "research_agent", "model": "claude-sonnet"})
assert no_key.status_code == 401

headers = {"X-Api-Key": "secret-key-123"}

created = client.post("/agents", json={"name": "research_agent", "model": "claude-sonnet"}, headers=headers)
assert created.status_code == 201
assert created.json() == {"name": "research_agent", "model": "claude-sonnet"}

duplicate = client.post("/agents", json={"name": "research_agent", "model": "claude-haiku"}, headers=headers)
assert duplicate.status_code == 409
assert "already exists" in duplicate.json()["detail"]

not_found = client.get("/agents/999", headers=headers)
assert not_found.status_code == 404

invalid_id = client.get("/agents/-1", headers=headers)
assert invalid_id.status_code == 422

found = client.get("/agents/1", headers=headers)
assert found.status_code == 200
assert found.json()["name"] == "research_agent"
```

*Hint (shown on request):* `verify_api_key` and the exercise from
Concept 9 are identical in shape. In `create_agent`, check for a
duplicate by scanning `request.app.state.registry.values()` for a
matching `"name"`; store with
`request.app.state.registry[request.app.state.next_id] = config.model_dump()`,
then increment `request.app.state.next_id`. In `lifespan`, both state
values must be set *before* `yield` — that's the startup phase.

*Correct answer + explanation (shown on failure, if requested):*

**`agents.py`**
```python
from fastapi import APIRouter, Depends, Header, HTTPException, Path, Request, BackgroundTasks
from pydantic import BaseModel

API_KEY = "secret-key-123"

class AgentConfig(BaseModel):
    name: str
    model: str

class DuplicateAgentError(Exception):
    def __init__(self, name: str):
        self.name = name
        super().__init__(f"an agent named '{name}' already exists")

def verify_api_key(x_api_key: str = Header(default=None)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="invalid or missing API key")

def log_registration(name: str):
    print(f"registered new agent: {name}")

router = APIRouter(prefix="/agents", tags=["agents"])

@router.post("", response_model=AgentConfig, status_code=201, dependencies=[Depends(verify_api_key)])
def create_agent(config: AgentConfig, request: Request, background_tasks: BackgroundTasks):
    registry = request.app.state.registry
    if any(a["name"] == config.name for a in registry.values()):
        raise DuplicateAgentError(config.name)
    registry[request.app.state.next_id] = config.model_dump()
    request.app.state.next_id += 1
    background_tasks.add_task(log_registration, config.name)
    return config

@router.get("/{agent_id}", response_model=AgentConfig, dependencies=[Depends(verify_api_key)])
def get_agent(request: Request, agent_id: int = Path(gt=0)):
    registry = request.app.state.registry
    if agent_id not in registry:
        raise HTTPException(status_code=404, detail=f"agent {agent_id} not found")
    return registry[agent_id]
```

**`main.py`**
```python
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from agents import router as agents_router, DuplicateAgentError

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.registry = {}
    app.state.next_id = 1
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://my-frontend.com"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

@app.exception_handler(DuplicateAgentError)
def handle_duplicate(request: Request, exc: DuplicateAgentError):
    return JSONResponse(status_code=409, content={"detail": str(exc)})

app.include_router(agents_router)
```
Every mechanism from this lesson does real work here: `lifespan`
initializes shared, request-independent state exactly once; `APIRouter`
keeps `agents.py` self-contained and `main.py` a thin assembly point;
`Depends(verify_api_key)` gates both routes identically; `response_model`
and `Path(gt=0)` validate on the way out and in; the global
`DuplicateAgentError` handler means `create_agent` never needs its own
`try`/`except` for that case; and `BackgroundTasks` logs a successful
registration without making the client wait on it — a real, small,
working slice of exactly the kind of backend an agent needs.
