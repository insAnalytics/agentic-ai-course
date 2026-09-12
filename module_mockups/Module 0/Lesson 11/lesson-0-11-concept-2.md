# Module 0, Lesson 11 — Concept 2: Choosing the right protocol

---

## A decision framework, not a preference ranking

None of the four options [from the previous concept](→ this lesson, the protocol landscape for agentic systems concept) is universally "better" — each fits a specific shape of communication need. The questions worth asking, in order:

1. **Is this service-to-service, not client-facing?** — one backend
   calling another internally, not a browser or CLI client at the other
   end → **gRPC**.
2. **Does the other side need to send data back mid-interaction, not
   just at the start of the request?** → **WebSockets**.
3. **Is it purely one-way, server pushing updates to a client that has
   nothing further to say once the connection starts?** → **SSE**.
4. **Is genuine real-time not actually needed** — infrequent updates,
   where a few seconds of staleness is completely fine? → **polling is
   the correct choice**, not a fallback to feel bad about.

That last point matters as much as the other three: reaching for
WebSockets or gRPC because they're more sophisticated, for a situation
polling would serve just as well, is over-engineering — the same
judgment call [this course has applied elsewhere](→ Module 0, the data structures lesson, comprehensions concept, the when not to use a comprehension explanation), choosing the tool that actually fits the problem's real shape, not the most impressive-sounding one available.

---

## Applying it to real agent-system scenarios

**Streaming an LLM's tokens to a chat interface.** The server is
producing output progressively; the client has nothing to say back once
it's sent its prompt. Purely one-way → **SSE**.

**A live agent dashboard where a user can also cancel a running task
mid-execution.** The server pushes status updates, but the client needs
to send something back (`cancel`) at an unpredictable moment, not just
at the start → **WebSockets**.

**An agent backend calling an internal tool-execution service to run a
calculation.** Neither end is a browser; this is one internal service
calling another, and a strict, versioned schema matters for reliability
between services that evolve independently → **gRPC**.

**An admin panel showing whether last night's batch job succeeded,
refreshed on page load.** Nothing here needs sub-second freshness — a
plain `GET /status`, called once when the page loads (or even every 30
seconds, if it must auto-refresh) → **polling**, and reaching for
anything more sophisticated here would be solving a problem that doesn't
exist.

---

## Quiz cards

> **Q1.** What's the first question worth asking when choosing a
> communication protocol, according to this framework?
> - A) Which protocol is newest or most technically impressive
> - B) Whether the communication is service-to-service (internal) or client-facing — this determines whether gRPC is even in consideration ✅
> - C) How much data needs to be sent per message
> - D) Whether the team already has experience with a particular protocol

> **Q2.** A live dashboard needs to both receive server-pushed updates
> *and* let the client cancel a running task at any moment. Which
> protocol fits, and why?
> - A) SSE, since it handles server push
> - B) WebSockets — the client needs to send something back mid-interaction, at an unpredictable time, which SSE structurally can't support ✅
> - C) Polling, since it's simpler
> - D) gRPC, since this is the most sophisticated option

> **Q3.** Why does this framework treat polling as sometimes the
> *correct* choice, not just a fallback to avoid?
> - A) Polling is always technically superior to the alternatives
> - B) When genuine real-time freshness isn't actually needed, reaching for a more sophisticated protocol anyway is over-engineering — the same judgment already applied elsewhere in this course, matching the tool to the problem's real shape ✅
> - C) Polling is required by law for certain types of applications
> - D) The other three protocols can't be implemented in Python

> **Q4.** Why does an agent backend calling an internal tool-execution
> service fit gRPC better than SSE or WebSockets?
> - A) gRPC is always faster than the alternatives
> - B) Neither end is a browser or CLI client — this is internal service-to-service communication, where gRPC's strict, versioned schema fits the need for reliability between independently-evolving services ✅
> - C) SSE and WebSockets can't be used between two backend services at all
> - D) gRPC is the only option that supports binary data

---

*(End of Concept 2. This lesson continues with Concept 3 — implementing
SSE with `StreamingResponse` — drafted separately.)*
