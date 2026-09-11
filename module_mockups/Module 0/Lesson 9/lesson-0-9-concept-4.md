# Module 0, Lesson 9 — Concept 4: Request bodies with Pydantic, and file uploads

---

## A `BaseModel` parameter is the request body

This is where [Lesson 5's Pydantic payoff](→ Module 0, the Pydantic lesson, Pydantic fundamentals concept) actually lands: a function parameter typed as a `BaseModel` tells FastAPI to read and validate the request's JSON body against that model, automatically, before the route function runs at all.

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class AgentConfig(BaseModel):
    name: str
    model: str
    temperature: float = 0.7

@app.post("/agents")
def create_agent(config: AgentConfig):
    return {"created": config.name, "model": config.model}
```

A `POST /agents` request with this JSON body:

```json
{"name": "research_agent", "model": "claude-sonnet"}
```

calls `create_agent(config=AgentConfig(name="research_agent", model="claude-sonnet"))`
— `config` arrives already validated, already a real `AgentConfig`
instance with `temperature` defaulted to `0.7`, exactly as
[`AgentConfig(**raw)` worked back in the Pydantic lesson](→ Module 0, the Pydantic lesson, Pydantic fundamentals concept, the model_dump explanation), just triggered by an incoming HTTP request instead of a manually-constructed dict. A malformed body — a missing `name`, a `temperature` that can't be coerced to a float — produces the same structured `422` response [covered in the previous concept](→ this lesson, routes and parameters concept, the path parameter validation explanation), automatically, before `create_agent` ever runs.

---

## Combining a body with path and query parameters

FastAPI figures out where each parameter comes from by its type and
whether it matches a path segment — a `BaseModel` parameter is
understood as the body, a plain type matching `{...}` in the path is a
path parameter, and anything else falls back to a query parameter, all
in the same function signature:

```python
@app.put("/agents/{agent_id}")
def update_agent(agent_id: int, config: AgentConfig, notify: bool = False):
    return {"agent_id": agent_id, "updated": config.name, "notify": notify}
```

A `PUT /agents/42?notify=true` request with an `AgentConfig`-shaped JSON
body populates all three from their respective sources — `agent_id`
from the URI path, `config` from the JSON body, `notify` from the query
string — without needing to say so explicitly anywhere; FastAPI infers
each parameter's source from its type and its name.

---

## File uploads

A file in a request is a different kind of data than JSON — `UploadFile`
(paired with `File()`) is FastAPI's way of receiving one, relevant here
specifically for a case like a document an agent needs to process:

```python
from fastapi import FastAPI, File, UploadFile

app = FastAPI()

@app.post("/documents")
async def upload_document(file: UploadFile = File(...)):
    contents = await file.read()
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "size_bytes": len(contents),
    }
```

`File(...)` (the `...` meaning "required, no default") marks `file` as
an uploaded file rather than a JSON body field. `UploadFile` gives you
`.filename`, `.content_type`, and — since reading a file's contents is
I/O — an `async` `.read()` method, [exactly the `await`-a-coroutine pattern from the async lesson](→ Module 0, the async lesson, async/await and coroutines concept). This is also why `upload_document` is declared `async def` here: reading an uploaded file's bytes is genuinely I/O-bound work, the same category [Lesson 7 built concurrency around](→ Module 0, the async lesson, why concurrency matters concept).

---

## Quiz cards

> **Q1.** What happens when a function parameter is typed as a Pydantic
> `BaseModel` in a route function?
> - A) Nothing special — it's treated like any other parameter
> - B) FastAPI reads and validates the request's JSON body against that model automatically, before the route function runs ✅
> - C) It must always be the only parameter in the function
> - D) It only works for `GET` requests

> **Q2.** Given `POST /agents` with a body missing a required `name`
> field, what happens?
> - A) `create_agent` runs normally with `name` set to `None`
> - B) FastAPI returns a structured `422` error automatically — `create_agent` never actually runs ✅
> - C) The server crashes with an unhandled exception
> - D) FastAPI silently fills in an empty string for the missing field

> **Q3.** In `def update_agent(agent_id: int, config: AgentConfig, notify: bool = False):`
> on the route `/agents/{agent_id}`, how does FastAPI know `config` is
> the request body and `notify` is a query parameter?
> - A) It doesn't — this would be ambiguous and raise an error
> - B) `config`'s type is a `BaseModel`, which FastAPI treats as the body; `notify` doesn't match a path segment and isn't a `BaseModel`, so it's inferred as a query parameter ✅
> - C) Parameter order in the function signature determines this exclusively
> - D) Every parameter after the first one is always treated as the body

> **Q4.** Why is `upload_document` declared `async def`, and why does it
> `await file.read()`?
> - A) `async def` is required for every FastAPI route, regardless of what it does
> - B) Reading an uploaded file's contents is I/O-bound work — the same category of operation the async lesson built `await`-based concurrency around ✅
> - C) `await` is only needed for `POST` requests specifically
> - D) `UploadFile` doesn't work at all without `async def`

---

*(End of Concept 4. This lesson continues with Concept 5 — response
models, status codes, and exception handling — drafted separately.)*
