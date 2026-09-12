# Module 0, Lesson 9 — Concept 8: Dependency injection with `Depends()`

---

## The problem: repeated logic across routes

Several routes often need the exact same piece of setup or validation —
pagination parameters, a database connection, a shared check — and
writing it out in every route function duplicates it:

```python
from fastapi import Query

@app.get("/agents")
def list_agents(skip: int = Query(default=0, ge=0), limit: int = Query(default=10, gt=0, le=100)):
    return {"skip": skip, "limit": limit}

@app.get("/tools")
def list_tools(skip: int = Query(default=0, ge=0), limit: int = Query(default=10, gt=0, le=100)):
    return {"skip": skip, "limit": limit}
```

Identical `skip`/`limit` definitions, copied into every route that needs
pagination — a maintenance problem the moment the constraints need to
change (raising the max `limit`, say) in more than one place.

---

## `Depends()` — declaring a shared dependency once

A plain function, used as a parameter's default via `Depends(...)`,
lets FastAPI call that function for you and inject its return value —
written once, reused everywhere:

```python
from fastapi import Depends, Query

def pagination_params(skip: int = Query(default=0, ge=0), limit: int = Query(default=10, gt=0, le=100)):
    return {"skip": skip, "limit": limit}

@app.get("/agents")
def list_agents(pagination: dict = Depends(pagination_params)):
    return pagination

@app.get("/tools")
def list_tools(pagination: dict = Depends(pagination_params)):
    return pagination
```

`Depends(pagination_params)` tells FastAPI: before running `list_agents`,
call `pagination_params(...)` (itself receiving `skip`/`limit` from the
query string, exactly as before), and pass its return value in as
`pagination`. Both routes now share one single definition — changing the
`limit` constraint in `pagination_params` updates every route that
depends on it, automatically.

---

## A dependency that returns a real, meaningful object

Pagination returning a plain dict is a simple case — dependencies
commonly stand in for something more substantial, like a shared
resource:

```python
def get_agent_registry():
    return agents_db   # a shared dict, database session, or similar resource

@app.get("/agents/{agent_id}")
def get_agent(agent_id: int, registry: dict = Depends(get_agent_registry)):
    return registry.get(agent_id, {})
```

`get_agent_registry` here is trivial, but the pattern generalizes
directly to something like a real database session — a dependency
function that opens a connection, and every route needing database
access declares `Depends(get_db_session)` rather than opening its own
connection by hand.

---

## A dependency used only for its side effect

A dependency doesn't need its return value to matter — sometimes the
point is purely the validation or side effect it performs, [raising an `HTTPException` before the route even runs](→ this lesson, response models and exception handling concept, the HTTPException explanation) if some shared condition fails:

```python
from fastapi import Header, HTTPException

def verify_request_id(x_request_id: str = Header(default=None)):
    if x_request_id is None:
        raise HTTPException(status_code=400, detail="X-Request-Id header is required")

@app.get("/agents", dependencies=[Depends(verify_request_id)])
def list_agents():
    return {"agents": []}
```

`dependencies=[Depends(verify_request_id)]` on the route decorator itself
(rather than as a function parameter) runs `verify_request_id` before
`list_agents`, without needing its result injected anywhere — its only
job is to reject the request early if the header's missing, which it
does exactly like any other `raise` you've written.

---

## Quiz cards

> **Q1.** What problem does `Depends()` solve, compared to repeating the
> same parameter definitions across multiple routes?
> - A) It makes routes run faster
> - B) It lets shared setup or validation logic be written once, in a separate function, and reused across every route that needs it ✅
> - C) It removes the need for Pydantic models entirely
> - D) It's required for any route to accept query parameters at all

> **Q2.** In `pagination: dict = Depends(pagination_params)`, what
> actually gets assigned to `pagination`?
> - A) The `pagination_params` function itself, uncalled
> - B) The return value of calling `pagination_params(...)`, with FastAPI supplying its own parameters (like the query params it needs) automatically ✅
> - C) A string containing the function's name
> - D) `None`, always — `Depends()` only works for side effects

> **Q3.** What's the benefit of pulling pagination logic into one shared
> `pagination_params` dependency, rather than duplicating `skip`/`limit`
> definitions in every route?
> - A) There's no real benefit — both approaches behave identically
> - B) Changing a constraint (like the maximum `limit`) only needs to happen in one place, and every route using that dependency picks up the change automatically ✅
> - C) Dependencies run faster than duplicated code
> - D) `Depends()` is required syntax for any route with more than one parameter

> **Q4.** What does `dependencies=[Depends(verify_request_id)]` on a
> route decorator do, compared to using `Depends()` as a function
> parameter?
> - A) They're functionally identical in every way
> - B) It runs the dependency before the route, for its side effect (like raising an `HTTPException`), without needing its return value injected as a parameter ✅
> - C) It only works for `GET` routes
> - D) It disables the route entirely

---

*(End of Concept 8. This lesson continues with Concept 9 — authentication
— drafted separately.)*
