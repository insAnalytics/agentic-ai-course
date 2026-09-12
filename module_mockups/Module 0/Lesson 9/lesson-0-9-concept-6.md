# Module 0, Lesson 9 — Concept 6: Automatic docs — `/docs` and `/redoc`

---

## Documentation you didn't write

Every FastAPI app automatically serves two documentation pages, generated
entirely from what you've already written — no separate documentation
effort, no extra annotations beyond what's already in your route
signatures and Pydantic models:

- **`/docs`** — an interactive UI (Swagger UI) listing every route,
  grouped and expandable, with a "Try it out" button that sends a real
  request from the browser and shows the actual response.
- **`/redoc`** — a cleaner, read-only reference view (ReDoc) of the same
  information, better suited to sharing as reference documentation than
  to interactively poking at.

Both are generated from the exact same source: an **OpenAPI schema**
FastAPI builds automatically by inspecting your routes, their parameters,
and their Pydantic models — visiting `/openapi.json` on any FastAPI app
shows that schema directly, as raw JSON.

---

## What ends up in the docs, and where it comes from

Nothing here is new information — it's everything from this lesson so
far, surfaced automatically:

```python
from fastapi import FastAPI, Query
from pydantic import BaseModel, Field

app = FastAPI()

class AgentConfig(BaseModel):
    name: str = Field(description="the agent's unique identifier")
    model: str = Field(description="which LLM this agent runs on")
    temperature: float = Field(default=0.7, description="sampling temperature, 0 to 1")

@app.post("/agents", response_model=AgentConfig, status_code=201)
def create_agent(config: AgentConfig):
    """Register a new agent configuration."""
    return config

@app.get("/agents")
def list_agents(limit: int = Query(default=10, gt=0, le=100, description="max results to return")):
    """List existing agents, most recently created first."""
    return []
```

Visiting `/docs` for this app shows: both routes, each with its
docstring — [exactly the same docstring mechanism from the functions lesson](→ Module 0, the functions lesson, function fundamentals concept, the docstrings explanation), now read by FastAPI's docs generator instead of an LLM tool-calling framework, though it's worth noticing these are genuinely the same underlying idea — as its description; `create_agent`'s expected request body shown field-by-field, each with its `Field(description=...)` text and whether it's required; `list_agents`'s `limit` parameter shown as optional, with its range constraint and description visible directly.

---

## Why this matters more than "nice to have"

This isn't just convenient for humans browsing the API — it's the same
throughline as [why type hints and docstrings mattered for tool-calling frameworks back in the functions lesson](→ Module 0, the functions lesson, function fundamentals concept, the type hints explanation): a machine-readable OpenAPI schema, generated the same automatic way, is exactly the kind of structured description an LLM-based tool-calling system can consume directly to know what an endpoint expects and returns — the same underlying description serving both a human reading `/docs` and, potentially, an agent deciding how to call your API as a tool.

---

## Quiz cards

> **Q1.** What generates the content shown at `/docs` and `/redoc`?
> - A) A separate documentation file the developer must write by hand
> - B) An OpenAPI schema FastAPI builds automatically by inspecting your routes, parameters, and Pydantic models ✅
> - C) Comments manually added to each route
> - D) A third-party service FastAPI calls out to

> **Q2.** What's the practical difference between `/docs` and `/redoc`?
> - A) They show completely unrelated information
> - B) Both are generated from the same underlying schema; `/docs` is interactive (Swagger UI, with "Try it out"), `/redoc` is a cleaner read-only reference view ✅
> - C) `/redoc` only works for `GET` routes
> - D) `/docs` requires a separate server to run

> **Q3.** Where does a route's description shown in `/docs` come from?
> - A) It must be added with a special `@app.description(...)` decorator
> - B) The route function's own docstring — the same mechanism from the functions lesson, now read by FastAPI's docs generator ✅
> - C) FastAPI generates a generic description automatically, ignoring docstrings
> - D) Descriptions can only be added to Pydantic model fields, not routes

> **Q4.** What does `Field(description="...")` on a Pydantic model field
> add to the automatic docs?
> - A) Nothing — `Field()` only affects validation, never documentation
> - B) A human-readable description of that specific field, shown alongside its type and whether it's required in the generated docs ✅
> - C) It changes the field's actual validation rules
> - D) It's required for the field to appear in `/docs` at all

> **Q5.** Why does this section connect FastAPI's automatic docs back to
> the functions lesson's point about type hints and docstrings mattering
> for tool-calling frameworks?
> - A) It doesn't — the two are unrelated
> - B) Both are the same underlying idea: a structured, machine-readable description generated from type hints and docstrings, usable by a human reading documentation or a system (like an LLM) deciding how to call something ✅
> - C) FastAPI's docs only work if the app is also used as an LLM tool
> - D) Docstrings are required for a FastAPI app to run at all

---

*(End of Concept 6. This lesson continues with Concept 7 — async routes
— drafted separately.)*
