# Module 0, Lesson 9 — Concept 2: What FastAPI is, and why it fits agent backends

> **Sandbox note:** this lesson's live-execution approach (in-browser via
> `TestClient`, E2B, or another path) hasn't been finalized yet. Code and
> expected output below are shown as the authoritative content regardless
> of how it ends up executing on the site.

---

## What FastAPI actually is

FastAPI is a Python web framework, but it's worth naming precisely what
it's built on, since both pieces matter directly to this course: it's
built on **Starlette** (an ASGI framework handling the actual HTTP
mechanics) and **Pydantic** (for request/response validation — [the exact library from earlier in this course](→ Module 0, the Pydantic lesson)). 

**ASGI** (Asynchronous Server Gateway Interface) is the modern successor to **WSGI** (what older frameworks like Flask were originally built on) — the key difference being ASGI is async-native from the ground up, which is exactly what makes [`async def` routes, covered later in this lesson](→ this lesson, async routes concept), possible at all. A WSGI-based framework can't natively support the concurrent-request-handling model [Lesson 7 built up from scratch](→ Module 0, the async lesson).

---

## A minimal app

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "agent backend running"}
```

`app = FastAPI()` creates the application instance. `@app.get("/")` is
—worth saying plainly—[just a decorator](→ Module 0, the OOP lesson, decorators concept), doing familiar work in a new context: it registers `read_root` to run whenever a `GET` request arrives at the path `/`. Returning a plain dict is enough — FastAPI serializes it to JSON automatically.

---

## Running it: `uvicorn`

FastAPI itself doesn't run a server — it defines *what* should happen
for a given request; something else has to actually listen on a port and
call it. `uvicorn` is the standard ASGI server used to run a FastAPI app:

```bash
uvicorn main:app --reload
```
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Application startup complete.
```
*(illustrating expected output on a real machine)*

`main:app` means "in `main.py`, find the object named `app`" — the
`FastAPI()` instance from above. `--reload` restarts the server
automatically whenever a source file changes, useful during development
so you don't have to manually stop and restart after every edit. Hitting
`http://127.0.0.1:8000/` in a browser, or with `curl`, returns:

```json
{"message": "agent backend running"}
```

---

## Why this fits agent backends specifically

This isn't an arbitrary framework choice for this course — three things
about FastAPI line up directly with what this course has already built:

- **Automatic validation is Pydantic**, the exact library from Lesson
  5 — a request body typed as a `BaseModel` gets validated before your
  route function ever runs, the identical mechanism that closed [the validation gap back then](→ Module 0, the Pydantic lesson, Pydantic fundamentals concept), just now validating an incoming HTTP request instead of a config file.
- **Async routes are Lesson 7's `async def`/`await`**, directly — an
  agent backend that calls an LLM API, or fans out to multiple tools per
  request, is exactly the I/O-bound situation `asyncio` was built to
  handle, and FastAPI's ASGI foundation means that's a first-class,
  natively supported way to write a route, not a workaround.
- **A route is genuinely just a decorator** applying to a function — the
  exact mechanism from Lesson 4, now doing the work of wiring up an HTTP
  endpoint instead of logging or counting calls.

None of the rest of this lesson is teaching unfamiliar *mechanisms* —
decorators, Pydantic models, `async`/`await` are all already yours. It's
teaching how those mechanisms compose into something that serves an
actual, network-reachable API.

---

## Quiz cards

> **Q1.** What two things is FastAPI built on top of?
> - A) Flask and Django
> - B) Starlette (handling ASGI/HTTP mechanics) and Pydantic (for validation) ✅
> - C) Node.js and Express
> - D) Only Pydantic — FastAPI implements HTTP handling from scratch

> **Q2.** What's the key difference between ASGI and WSGI?
> - A) There's no real difference — they're interchangeable names
> - B) ASGI is async-native from the ground up, which is what allows `async def` routes to work natively; WSGI-based frameworks can't natively support that concurrent-request model ✅
> - C) WSGI is newer and faster than ASGI
> - D) ASGI only works with Pydantic, WSGI doesn't support any validation library

> **Q3.** What does `@app.get("/")` actually do, mechanically?
> - A) It's special FastAPI-only syntax, unrelated to anything covered earlier in this course
> - B) It's a decorator — the same mechanism from the OOP lesson — registering the function below it to run whenever a `GET` request arrives at that path ✅
> - C) It starts the server immediately
> - D) It only works if the function returns a string

> **Q4.** Why doesn't `python3 main.py` alone run a FastAPI app?
> - A) It's actually the correct way to run it
> - B) FastAPI only defines what should happen for a given request — something else, `uvicorn`, has to actually listen on a port and call it ✅
> - C) FastAPI apps can't be run locally at all
> - D) `main.py` is always the wrong filename to use

> **Q5.** What does `--reload` do when running `uvicorn main:app --reload`?
> - A) It reloads the client's browser automatically
> - B) It restarts the server automatically whenever a source file changes, useful during development ✅
> - C) It reruns every test in the project
> - D) It's required for the server to start at all

> **Q6.** Why does the "automatic validation" argument for FastAPI
> directly connect back to Lesson 5, rather than being a new concept?
> - A) It doesn't — FastAPI's validation is unrelated to Pydantic
> - B) FastAPI uses Pydantic `BaseModel`s directly for request validation — the exact same mechanism that closed the validation gap in the Pydantic lesson, just applied to HTTP requests now ✅
> - C) FastAPI reimplements its own separate validation system
> - D) Validation in FastAPI only works for `GET` requests

---

*(End of Concept 2. This lesson continues with Concept 3 — routes,
path/query parameters, and validation — drafted separately.)*
