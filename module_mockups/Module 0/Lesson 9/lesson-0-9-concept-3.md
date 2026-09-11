# Module 0, Lesson 9 — Concept 3: Routes, path/query parameters, and validation

---

## Path parameters — part of the URI itself

A `{...}` segment in a route's path becomes a function parameter,
automatically extracted from the actual URI a request came in on:

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/agents/{agent_id}")
def get_agent(agent_id: int):
    return {"agent_id": agent_id, "name": "research_agent"}
```

A request to `/agents/42` calls `get_agent(agent_id=42)` — as an actual
`int`, already converted, not the string `"42"`. This is [the same automatic-validation mechanism from the previous concept](→ this lesson, what FastAPI is concept, the automatic validation explanation), now applied to a path segment: the type hint isn't just documentation here, it's a real parsing step.

Requesting `/agents/not-a-number` — something that can't be parsed as an
`int` — never reaches `get_agent` at all:

```json
{
  "detail": [
    {
      "type": "int_parsing",
      "loc": ["path", "agent_id"],
      "msg": "Input should be a valid integer, unable to parse string as an integer",
      "input": "not-a-number"
    }
  ]
}
```
*(automatic response, HTTP status 422 — illustrating expected output)*

FastAPI rejects it automatically, before your function body ever runs,
with a structured error response — no manual `isinstance` check, no
`try`/`except` needed for this case at all.

---

## Query parameters — everything else in the function signature

Any function parameter *not* named in the path becomes a **query
parameter** instead — read from the URI's `?key=value` portion:

```python
@app.get("/agents")
def list_agents(model: str = None, limit: int = 10):
    return {"model_filter": model, "limit": limit}
```

`GET /agents?model=claude-sonnet&limit=5` calls
`list_agents(model="claude-sonnet", limit=5)`. A default value (`= None`,
`= 10`) makes the parameter optional — omitting it from the URI just
uses the default, exactly like [a regular function's default argument](→ Module 0, the functions lesson, function fundamentals concept, the default arguments explanation).

---

## `Query()` and `Path()` — validation beyond just the type

A type hint alone only checks *shape* (is this an `int`). `Query()` and
`Path()` add real constraints — a minimum, a maximum, a length limit —
directly in the function signature:

```python
from fastapi import FastAPI, Query, Path

app = FastAPI()

@app.get("/agents")
def list_agents(limit: int = Query(default=10, gt=0, le=100)):
    return {"limit": limit}

@app.get("/agents/{agent_id}")
def get_agent(agent_id: int = Path(gt=0)):
    return {"agent_id": agent_id}
```

`Query(default=10, gt=0, le=100)` means: default to `10` if omitted,
reject anything not strictly greater than `0`, reject anything above
`100` — `GET /agents?limit=500` gets rejected automatically with the
same structured `422` shape shown above, `limit` never even reaching
`list_agents`. `Path(gt=0)` does the same for a path parameter — here,
refusing an `agent_id` of `0` or negative, even though it's already a
valid `int`.

---

## `Header()` and `Cookie()` — the same mechanism, different source

Extracting an HTTP header or cookie value works identically — a
parameter typed with `Header()` or `Cookie()` instead of `Query()`/`Path()`:

```python
from fastapi import Header, Cookie

@app.get("/whoami")
def whoami(x_request_id: str = Header(default=None), session_id: str = Cookie(default=None)):
    return {"request_id": x_request_id, "session_id": session_id}
```

FastAPI automatically converts a parameter name like `x_request_id` to
the header name `X-Request-Id` — headers conventionally use hyphens,
Python identifiers can't, so this conversion happens for you.

---

## The route-ordering gotcha

Routes are matched top to bottom, and the *first* matching route wins —
worth being careful with, since a dynamic path segment matches almost
anything:

```python
@app.get("/agents/{agent_id}")
def get_agent(agent_id: str):
    return {"agent_id": agent_id}

@app.get("/agents/me")
def get_current_agent():
    return {"agent_id": "current-user's-agent"}
```

A request to `/agents/me` matches `/agents/{agent_id}` *first* — `me`
is a perfectly valid string for `agent_id` — so `get_current_agent`
never actually runs; `get_agent(agent_id="me")` handles it instead. The
fix is ordering the more specific, static route *before* the dynamic
one:

```python
@app.get("/agents/me")
def get_current_agent():
    return {"agent_id": "current-user's-agent"}

@app.get("/agents/{agent_id}")
def get_agent(agent_id: str):
    return {"agent_id": agent_id}
```

This is [the same top-to-bottom, first-match-wins principle from `except` clause ordering](→ Module 0, the Python setup lesson, error handling concept, the except ordering explanation), applied to routes instead of exception types: list the more specific case first, or it never gets a chance to match.

---

## Quiz cards

> **Q1.** In `@app.get("/agents/{agent_id}") def get_agent(agent_id: int):`,
> what does the `int` type hint actually do?
> - A) It's purely documentation with no runtime effect
> - B) It's a real parsing step — FastAPI converts the path segment to an actual `int` before the function runs, and rejects the request automatically if it can't ✅
> - C) It only affects the automatic docs, not real requests
> - D) It has no effect unless combined with `Path()`

> **Q2.** How does FastAPI decide whether a function parameter is a path
> parameter or a query parameter?
> - A) Query parameters must always come first in the function signature
> - B) A parameter matching a `{...}` segment in the route path is a path parameter; anything else in the signature becomes a query parameter ✅
> - C) They're identical — FastAPI doesn't distinguish between the two
> - D) Query parameters require a special decorator

> **Q3.** What does `Query(default=10, gt=0, le=100)` add beyond what a
> plain `int` type hint alone would check?
> - A) Nothing — it's purely stylistic
> - B) Real value constraints — a default, a minimum (`gt`), and a maximum (`le`) — rejecting values outside that range automatically, not just checking that it's an `int` ✅
> - C) It makes the parameter required instead of optional
> - D) It converts the parameter into a path parameter

> **Q4.** How does a parameter named `x_request_id`, typed with
> `Header()`, map to an actual HTTP header name?
> - A) It doesn't — headers can't be extracted this way
> - B) FastAPI automatically converts it to `X-Request-Id`, since HTTP headers conventionally use hyphens that Python identifiers can't contain ✅
> - C) The header name must be passed as a string argument manually every time
> - D) `Header()` only works with headers that are already lowercase

> **Q5.** Given `/agents/{agent_id}` defined before `/agents/me`, why
> does a request to `/agents/me` never actually reach the `/agents/me`
> route's function?
> - A) `/agents/me` is invalid syntax
> - B) Routes match top to bottom, first match wins — `/agents/{agent_id}` matches first, since `"me"` is a valid value for a dynamic path segment ✅
> - C) FastAPI requires routes to be registered in alphabetical order
> - D) This isn't actually a real issue — both routes would run

---

*(End of Concept 3. This lesson continues with Concept 4 — request
bodies with Pydantic, plus file uploads — drafted separately.)*
