# Module 0, Lesson 8 — Concept 6: A brief look ahead — docker-compose

> **Note: this draft assumes an ideal, infra-unconstrained sandbox** — see
> the note at the top of Concept 1. Interactive elements describe the
> target experience, not something runnable in the current site today.
> This concept is deliberately kept light — full depth belongs closer to
> when this course introduces a real database, later in the course.

---

## The problem: more than one container, working together

Every container so far has run alone. A real app is often more than
one piece — your app, plus a database it talks to — each one usually
its own separate container, since [an image is meant to be one focused, reusable definition](→ this lesson, images vs. containers concept), not a bundle of unrelated things. `docker-compose` is the tool for describing and starting several related containers together, as one unit.

---

## `docker-compose.yml` — describing the pieces

```yaml
services:
  app:
    build: .
    ports:
      - "8000:5000"
    environment:
      - DATABASE_URL=postgresql://db:5432/mydb
    depends_on:
      - db

  db:
    image: postgres:16
    environment:
      - POSTGRES_PASSWORD=devpassword
```

Two `services`: `app` (built from the local `Dockerfile`, exactly as
before) and `db` (using an existing, pre-built `postgres` image directly,
no `Dockerfile` of its own needed). `depends_on` tells Compose to start
`db` before `app`. Everything from the previous concepts — port mapping,
environment variables — appears here too, just written as YAML instead
of `docker run` flags.

---

## Starting everything together

```bash
docker-compose up
```

**Ideal interactive demo:** running this in the terminal streams
interleaved startup logs from both containers, clearly labeled by
service name:

```
db_1   | PostgreSQL init process complete; ready for start up.
db_1   | database system is ready to accept connections
app_1  | Starting app on port 5000...
app_1  | Connected to database at db:5432
```

Worth noticing: `app`'s log line reaches the database at the hostname
`db` — the *service name* from `docker-compose.yml` — not `localhost`
or any IP address. Compose automatically gives each service a way to
reach the others by name, on a shared network it sets up between them,
without any manual network configuration.

---

## Quiz cards

> **Q1.** What problem does `docker-compose` solve that a single
> `Dockerfile`/`docker run` doesn't?
> - A) It replaces the need for a Dockerfile entirely
> - B) It describes and starts several related containers together as one unit, rather than running each one separately by hand ✅
> - C) It makes a single container run faster
> - D) It's only used for testing, never for real apps

> **Q2.** In the `docker-compose.yml` example, why does `db` use `image:
> postgres:16` instead of `build: .`?
> - A) This is a typo — `db` needs its own Dockerfile too
> - B) `db` uses an existing, pre-built image directly rather than building a new one from a local Dockerfile — not every service needs its own custom build ✅
> - C) `image:` and `build:` do the exact same thing
> - D) Only one service per `docker-compose.yml` is allowed to use `build:`

> **Q3.** How does the `app` service reach the `db` service at the
> hostname `db`, rather than needing an IP address or `localhost`?
> - A) This wouldn't actually work — it's a mistake in the example
> - B) Compose automatically sets up a shared network between the services in one file, letting each reach the others by their service name ✅
> - C) `db` must be manually added to a hosts file first
> - D) `localhost` and `db` are always interchangeable in Docker

---

*(End of Concept 6 — final concept section of Lesson 8. This lesson
continues with the outcomes callout, comprehensive quiz, and comprehensive
sandbox, drafted separately.)*
