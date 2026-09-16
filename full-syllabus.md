# AgenticAI Course — Full Syllabus (Reference)

> Status key: **Locked** = content fully drafted and written to file.
> **Building** = some concepts drafted and written to file, lesson not
> yet complete — see the note under that lesson for exactly how far.
> **Planned** = lesson name and scope agreed, content not yet drafted.
> **Rough outline** = module scope agreed, not yet broken into lessons.

---

## Module 0 — Python Essentials for Agents

*The only module broken down to full lesson-and-concept detail so far.*

1. **Python Setup & Core Syntax** — Locked
   Environment setup (Python install, VS Code, venv, pip), Python's
   execution model vs. compiled languages, control flow and syntax
   compared to other languages, try/except/finally, reading tracebacks.

2. **Working with Collections** — Locked
   Lists, tuples, dicts, sets, and comprehensions (list/dict/set) — given
   real depth as one of Python's strongest tools.

3. **Functions and Reusable Code** — Locked
   Function fundamentals with type hints and docstrings (load-bearing
   later for tool-calling schemas), `*args`/`**kwargs`, scope (local,
   global, closures, `nonlocal`, the mutable default argument trap),
   `lambda`/`map`/`filter`, modules and imports (multi-file).

4. **Object-Oriented Programming** — Locked
   Class fundamentals; instance vs. class variables; decorators via
   `@staticmethod`/`@classmethod` (first place decorator syntax is taught
   in the course); dunder methods (`__str__`/`__repr__`/`__eq__`);
   inheritance.

5. **Typed Data Models** — Locked
   Classes vs. dicts (when to use which); `@dataclass`; the validation gap
   (a `@dataclass` still silently accepts bad data); Pydantic fundamentals
   (`BaseModel`, type hints becoming real runtime validation). Narrative
   arc: dict → class → dataclass → still broken → Pydantic.

6. **Files, Errors, and Validation** — Locked
   Files, JSON, environment variables/secrets, layered exception handling,
   custom exceptions, re-raising/chaining, logging.

7. **Asynchronous Python** — Locked
   `async`/`await`/coroutines, `asyncio.gather`, `time.sleep` vs.
   `asyncio.sleep`, error handling in async code, and when async isn't the
   right tool (CPU-bound work needs multiprocessing instead).

8. **Docker for Python Apps** — Locked
   Why containers (environment consistency *and* a real access-restriction
   boundary); images vs. containers; writing a Dockerfile (core
   instructions plus the `COPY`/`ADD`, `CMD`/`ENTRYPOINT`, `ENV`/`ARG`
   pairs, `USER`, `EXPOSE`); building/running and the full lifecycle
   (`ps`/`logs`/`exec`/`stop`/`rm`) via a real interactive terminal backed
   by a live E2B sandbox, not a script; persisting data with volumes;
   layer caching and `.dockerignore`; a brief look ahead at
   `docker-compose`. Comprehensive project is a downloadable Flask +
   Postgres app (its own GitHub repo, `agentic-ai-course-agent-registry`)
   rather than an in-browser exercise — see architecture.md §4.3.

9. **Building APIs with FastAPI** — Locked
   FastAPI routes, request/response models, dependency injection,
   auto-generated docs (Swagger). Builds directly on decorators from
   Lesson 4.

10. **Testing FastAPI Applications** — Locked
    pytest basics, testing FastAPI endpoints, fixtures.

11. **Streaming, WebSockets, and gRPC** — Locked
    WebSockets/SSE/gRPC mechanics, generic here — applied specifically
    to LLM streaming once Module 1 exists. Nine concepts (protocol
    landscape/choice, SSE, WebSockets fundamentals + lifecycle/auth,
    gRPC fundamentals + streaming modes, testing all three, a
    broadcast pattern) plus intro/comprehensive-quiz/comprehensive-
    sandbox. Graded exercises for SSE, WebSocket auth, gRPC
    server-streaming, and the comprehensive sandbox (WebSocket
    broadcast + REST, graded together against the same running app).
    Three notable Pyodide/verification findings from building this
    lesson, logged in architecture.md §4.1: real `grpcio` has no
    pure-Python wheel at all (can't install in Pyodide — grading calls
    a learner's servicer directly instead of using real gRPC
    transport); Starlette's `TestClient.websocket_connect()`/plain
    `TestClient` both need a real OS thread Pyodide doesn't have
    (WebSocket grading drives the ASGI `websocket` scope by hand
    instead); and two real mockup bugs were caught by testing against
    real installs before writing content in (a gRPC fixture mixing up
    two different services' naming, and a claim citing `pytest.raises`
    as taught somewhere it actually isn't).

12. **Enhance Code, Tests, and Documentation Using Coding Assistance** — Planned
    Using an AI coding assistant critically — prompting it well, reviewing
    its output rather than accepting it blindly. Closes the module.

---

## Module 1 — LLM Foundations

*Being broken down lesson by lesson, starting with Lesson 1 below. The
rest of the module (decoding parameters, model landscape/benchmark
literacy, raw API mechanics, structured outputs) is still a rough
outline — not yet broken into lessons.*

Conceptual grounding before any framework touches the model: tokenization,
decoding parameters (temperature, top-p, etc.), the model landscape and
benchmark literacy. Also where **"Call LLM APIs and Process Responses"**
lives — moved here from Module 0 so raw API mechanics come after the
learner understands what they're actually calling, not before. Likely also
covers structured outputs (getting reliable JSON back from a model) as a
bridge into Module 2's tool-calling content.

1. **Tokenization** — Building
   Concept 1 drafted: the vocabulary problem (why text has to become
   numbers at all, a fixed word-level vocabulary and its `KeyError`
   failure mode, the lossy `<UNK>` fallback, why scale makes a fixed
   vocabulary unworkable — motivating subword tokenization next).
   Remaining concepts (subword tokenization/BPE, and whatever else this
   lesson covers) not yet drafted. No bookends (intro/comprehensive
   quiz/comprehensive sandbox) yet — added once every concept exists.

---

## Module 2 — Build Intelligent Conversation Agents

*Original 10-lesson outline, adjusted: frontend, auth, and observability
lessons pulled out into their own modules (3 and 4). Not yet re-broken into
final lesson-by-lesson detail post-split.*

1. Build AI Chatbot with No Code
2. Configure and Call LLM APIs with LangChain
3. Manage Prompts for Agents
4. Enable Tool Calling for Agents
5. Create Multi-Step LLM Chains with LCEL
6. Implement Short-Term Memory for Multi-Turn Conversations
7. Build Conversational Agent on Cloud

*(Originally also included "Build Agent Frontends," "Implement User
Authentication and Authorization," and "Observe Agent Workflows with
Langfuse Observability" — these three moved to Modules 3 and 4 below.)*

---

## Module 3 — Agent Frontends

*Rough outline — pulled out of the original Module 2 list, not yet
broken into final lesson detail.*

Quick-UI frontends (Streamlit/Gradio) for early agent work, then a more
production-oriented frontend, plus user authentication and authorization
— originally lessons 7-8 of the pre-split Module 2 list.

---

## Module 4 — Evaluation & Observability

*Rough outline — deliberately sequenced before Modules 5 and 6 ("you
cannot debug an agent you cannot measure"). Not yet broken into lessons.*

Golden test sets, RAGAS-style evaluation metrics, and observability
tracing (Langfuse) — originally lesson 9 of the pre-split Module 2 list,
now expanded into its own module and moved earlier in the sequence.

---

## Module 5 — Build RAG Based Systems

*Original 10-lesson outline, kept as-is — this one was already strong
relative to the comparison with an outside curriculum.*

1. Setup Infrastructure for RAG Solutions
2. Build RAG Ingestion Pipeline with LangChain
3. Build a Retrieval Pipeline for Retrieval-Augmented Generation
4. Implement Advanced Document Processing with LlamaIndex
5. Implement Multimodal Document Parsing with LlamaParse
6. Implement RAG with Fusion Retrieval and Guardrails
7. Query Structured Data in Agentic RAG Workflows
8. Integrate External Systems with the Model Context Protocol (MCP)
9. Evaluate RAG Pipeline Against SLO
10. Add Human Handoff with Context Transfer

---

## Module 6 — Build Autonomous Multi-Agent Systems

*Original 10-lesson outline, kept as-is. Possible +1 lesson on sandboxing
and human approval gates flagged as worth considering, not yet decided.*

1. Build Your First Stateful Agent with LangGraph
2. Design Multi-Agent Workflows as State Machines with LangGraph
3. Implement ReAct Agents with LangGraph
4. Build Plan-Act-Check Agent Loops with LangGraph
5. Build Self-Correcting Agents with Reflection using LangGraph
6. Build Your First Crew of Role-Based Agents with CrewAI
7. Implement Hierarchical Crews with CrewAI
8. Orchestrate Multi-Crew Workflows with CrewAI Flows
9. Optimize Agentic Systems for Cost, Latency, and Quality
10. Complete Readiness Review, Industry Trends, and Handover

---

## Module 7 — Production: Security, Compliance & Deployment

*Rough outline — not yet broken into lessons.*

Guardrails and red-teaming, a compliance-awareness lesson, fine-tuning and
self-hosting basics, and deployment/cost considerations. Added in response
to a gap identified when comparing against an outside curriculum that had
dedicated coverage here.

---

## Open items / not yet decided

- Modules 1, 3, 4, and 7 need their own concept-by-concept breakdown
  sessions, same process as Module 0 — not started yet, deliberately
  deferred until Module 0 is complete.
- Downloadable flagship projects per module (mentioned early on, explicitly
  deferred) — not yet scoped.
- Whether Module 6 gets an 11th lesson on sandboxing/approval gates.
