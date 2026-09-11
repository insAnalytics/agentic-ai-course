# Module 0, Lesson 8 — Concept 7: A brief look ahead — docker-compose

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
    volumes:
      - db-data:/var/lib/postgresql/data

volumes:
  db-data:
```

Two `services`: `app` (built from the local `Dockerfile`, exactly as
before) and `db` (using an existing, pre-built `postgres` image
directly, no `Dockerfile` of its own needed). `depends_on` tells Compose
to start `db` before `app`. Everything from earlier in this lesson
appears here too, just written as YAML instead of flags: port mapping,
environment variables, and — worth noticing specifically — [a named volume, exactly like the one covered earlier](→ this lesson, persisting data with volumes concept, the volumes explanation), mounted at Postgres's actual data directory. Without it, the database's data would vanish every time this container gets recreated — the same ephemeral-filesystem problem from that section, just one Postgres restart away from actually happening here.

---

## Starting everything together

```bash
docker-compose up
```

**Interactive terminal demo:** running this streams interleaved startup
logs from both containers, clearly labeled by service name:

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

> **Q2.** Why does the `db` service include a `volumes:` entry mounted at
> Postgres's data directory?
> - A) It's optional and purely cosmetic
> - B) Without it, the database's data would be lost every time the container is recreated — the same ephemeral-filesystem problem covered earlier in this lesson ✅
> - C) It's required syntax for every Compose service, regardless of what it does
> - D) It makes the database start faster

> **Q3.** How does the `app` service reach the `db` service at the
> hostname `db`, rather than needing an IP address or `localhost`?
> - A) This wouldn't actually work — it's a mistake in the example
> - B) Compose automatically sets up a shared network between the services in one file, letting each reach the others by their service name ✅
> - C) `db` must be manually added to a hosts file first
> - D) `localhost` and `db` are always interchangeable in Docker

---

*(End of Concept 7 — final concept section of Lesson 8. This lesson
continues with the outcomes callout, comprehensive quiz, and the
comprehensive downloadable project — drafted separately.)*
