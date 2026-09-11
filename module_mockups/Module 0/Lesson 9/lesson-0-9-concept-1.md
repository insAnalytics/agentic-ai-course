# Module 0, Lesson 9 — Concept 1: REST API fundamentals

---

## Resources, URIs, and the data format

REST (**Re**presentational **S**tate **T**ransfer) is a set of
conventions for designing APIs around **resources** — the "things" an
API exposes. An agent's config, a single tool call's logged result, a
user — each is a resource, and REST's core idea is that every resource
gets its own address, and a small, consistent set of operations applies
to *any* resource the same way.

That address is a **URI** (Uniform Resource Identifier) — you've likely
seen "URL" more often; a URL is specifically a URI that also tells you
*how* to reach the resource (`https://...`), and in practice the two
terms are used almost interchangeably for web APIs. A well-designed
REST API's URIs are hierarchical and resource-shaped:

```
/agents           — the collection of all agents
/agents/42        — one specific agent, identified by id
/agents/42/logs   — the logs belonging to that specific agent
```

And the data flowing back and forth is, almost universally today, JSON
— [exactly the format covered in the I/O lesson](→ Module 0, the I/O and error handling lesson, working with JSON concept) — a request body and a response body are both typically just JSON text, parsed and serialized the same way you've already practiced.

---

## The five core HTTP methods

REST reuses HTTP's own built-in vocabulary for *what kind of operation*
is happening, rather than inventing a new one — five methods cover
almost everything:

| Method | Meaning | Idempotent? |
|---|---|---|
| `GET` | Retrieve a resource (or collection) | Yes |
| `POST` | Create a new resource | No |
| `PUT` | Replace a resource entirely | Yes |
| `PATCH` | Partially update a resource | Not guaranteed |
| `DELETE` | Remove a resource | Yes |

**Idempotent** means: making the same request multiple times has the
same effect as making it once. `GET /agents/42` five times in a row
just reads the same data five times — no side effect accumulates.
`DELETE /agents/42` is also idempotent in the REST sense, even though
only the *first* call actually deletes anything — every call after that
leaves the agent in the exact same state (deleted), which is what
idempotency actually means: repeating it doesn't change the outcome
further, not that every repeat has to "do something."

`POST /agents` is the one genuine exception — calling it twice with the
same data typically creates *two* separate new agents, each with its own
new id, which is exactly why creation is `POST` and not `PUT`: `PUT`
promises that repeating the request leaves things exactly as they'd be
after one call; `POST` makes no such promise.

`PATCH` sits between `PUT` and `POST` in spirit: `PUT /agents/42` with
a full agent object *replaces* everything about that agent; `PATCH
/agents/42` with just `{"temperature": 0.9}` changes only that one
field, leaving everything else untouched.

---

## REST's guiding principles

A few principles are what actually make an API "RESTful," beyond just
using these five verbs somewhere:

- **Resource-oriented URIs, not action-oriented ones.** `/agents/42`
  paired with `DELETE`, not `/deleteAgent?id=42`. The URI names a
  *thing*; the HTTP method says what to *do* to it — the action lives in
  the method, not baked into the path as a verb.
- **Statelessness.** Every request contains everything the server needs
  to process it — the server doesn't remember anything about a "session"
  between one request and the next. If a request needs authentication,
  that proof travels *with* the request (a header, a token), every
  single time, rather than the server recalling "oh, this client already
  logged in earlier."
- **Uniform interface.** The same five methods, the same status-code
  conventions, apply consistently across *every* resource in the API —
  `GET /agents/42` and `GET /tools/7` behave the same shape of way, so a
  client (or a person) who understands one part of the API can predict
  the rest.
- **Client-server separation.** The client and the server can change
  independently, as long as the interface between them (the URIs, the
  methods, the data format) stays the same — the server doesn't need to
  know anything about what's rendering the response, and the client
  doesn't need to know how the server stores its data.

---

## Quiz cards

> **Q1.** In REST, what does a URI like `/agents/42` actually identify?
> - A) An action to perform
> - B) A specific resource — in this case, the agent with id `42` ✅
> - C) A database table name
> - D) A function to call

> **Q2.** What does "idempotent" mean for an HTTP method?
> - A) The method can only be called once, ever
> - B) Making the same request multiple times has the same effect as making it once — repeating it doesn't change the outcome further ✅
> - C) The method never modifies any data
> - D) The method always returns the exact same response body every time

> **Q3.** Why is creating a new resource typically done with `POST`
> rather than `PUT`?
> - A) `POST` is faster than `PUT`
> - B) `PUT` promises idempotency — repeating it leaves things as they'd be after one call — while `POST` makes no such promise, and calling it twice typically creates two separate resources ✅
> - C) `PUT` can't include a request body
> - D) There's no real difference; either would work identically

> **Q4.** What's the difference between `PUT` and `PATCH`?
> - A) They're interchangeable
> - B) `PUT` replaces a resource entirely; `PATCH` updates only the specific fields included in the request, leaving the rest untouched ✅
> - C) `PATCH` can only be used on collections, never a single resource
> - D) `PUT` is read-only

> **Q5.** What does "statelessness" mean as a REST principle?
> - A) The server never stores any data at all
> - B) Every request carries everything the server needs to process it — the server doesn't remember anything about a client between one request and the next ✅
> - C) Resources can never change state
> - D) The client can't send any data to the server

> **Q6.** Why does REST favor resource-oriented URIs like `/agents/42`
> with `DELETE`, over action-oriented ones like `/deleteAgent?id=42`?
> - A) Action-oriented URIs are technically invalid HTTP
> - B) The URI should name a resource; the HTTP method itself already expresses the action, keeping the interface uniform and predictable across every resource ✅
> - C) `/deleteAgent?id=42` is slower to process
> - D) There's no meaningful difference between the two approaches

---

*(End of Concept 1. This lesson continues with Concept 2 — what FastAPI
is, and why it fits agent backends — drafted separately.)*
