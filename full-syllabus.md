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

1. **Tokenization** — Locked
   All 4 concepts plus bookends drafted. Concept 1: the vocabulary
   problem (why text has to become numbers at all, a fixed word-level
   vocabulary and its
   `KeyError` failure mode, the lossy `<UNK>` fallback, why scale makes a
   fixed vocabulary unworkable — motivating subword tokenization next).
   Concept 2: subword tokenization / BPE (the merge algorithm, a toy
   from-scratch implementation, and `TokenizerVisualizer.tsx` — a real
   `gpt-tokenizer`-backed live tokenizer, not an illustrative fake, so a
   learner can type their own words and see real splits). Concept 3:
   tokens as the real unit of context-window and pricing cost, and why
   language changes that cost (`TokenLanguageComparison.tsx` — real,
   editable, side-by-side token counts across as many languages as the
   learner adds). The mockup's original Hindi example was swapped for
   Khmer after verifying against the real tokenizer — see architecture.md
   §2's "Real tokenization" row finding. Concept 4 (final concept of this
   lesson, per its own mockup): non-text inputs — images/documents also
   become tokens via the same conceptual mechanism as BPE, and count
   against the same context window and pricing. Purely conceptual, no
   live demo needed (nothing to run). Note: Concepts 1 and 3 both
   forward-reference a "context windows and KV cache" concept as if it
   were later in this lesson, but Concept 4's mockup confirmed this
   lesson ends at 4 concepts — that callback must land in a later
   Module 1 lesson instead, not yet scoped; left as unlinked plain text
   in both places, so nothing needs fixing once it's clear where it
   actually goes.

   Bookends: outcomes/why-it-matters intro, a 7-question comprehensive
   quiz (mixed order, spans all 4 concepts), and a closing synthesis
   that's deliberately *not* a graded comprehensive sandbox — this
   lesson has no learner-authored code anywhere in it (Concept 2's BPE
   demo is a read-only live illustration, not an exercise), so there's
   no natural "write code, pass hidden tests" task to build one around.
   Instead: an ungraded predict-then-check activity reusing
   `TokenLanguageComparison.tsx` (now generalized via `initialRows`/
   `title`/`labelPlaceholder` props, still with its original defaults
   for Concept 3's own usage) pre-loaded with plain English, jargon-
   dense English, a blank row for the learner's own language, and
   nonsense words — a compact, hands-on payoff for the whole lesson,
   since watching nonsense syllables shatter into individual-character
   tokens is the most direct possible confirmation that BPE's
   character-level fallback is real, not just a claim in the reading.
   This is now a second sanctioned deviation from the default
   comprehensive-sandbox shape, alongside the existing downloadable-
   project exception — see
   [lesson-structure.md §2](lesson-structure.md#2-section-by-section-rules).

2. **Embeddings** — Building
   Not in this module's original rough-outline description above (added
   once its mockup arrived, same as Tokenization was) — token vectors
   and semantic distance, building directly on Lesson 1's token-ID
   concept. Concept 1 drafted: what an embedding actually is (a token ID
   alone carries no meaning; an embedding represents something as a
   vector positioned so that distance corresponds to semantic
   similarity), via `EmbeddingSpace.tsx` — a real GloVe-embedding 2D
   scatter (PCA-projected offline, see architecture.md §2's "Real word
   embeddings" row), not hand-placed illustrative coordinates. A learner
   can type any of ~250 curated words and see it placed for real.
   Concept 2 drafted: token embeddings as the transformer's actual entry
   point — a token ID's first real processing step is a lookup into a
   learned embedding table (toy 2-row version verified live), those
   numbers start random and are shaped by training like any other
   weight (nothing hand-designed), and this whole layer is strictly
   internal — never something an API caller requests directly, setting
   up next concept's contrast with text embeddings (an API-facing kind
   an API user *does* request). Concept 3 drafted: text embeddings as a
   genuinely distinct use case from token embeddings (one vector per
   whole text, requested directly by an API user, for comparing meaning
   across texts) — `SentenceEmbeddingSpace.tsx`, a curated bank of ~16
   real sentences (several paraphrase pairs sharing almost no wording,
   plus unrelated ones for contrast) embedded via a real
   sentence-transformer model and PCA-projected offline, same rigor as
   Concept 1's word demo. A sentence box can't reuse Concept 1's "fixed
   vocabulary" trick (sentences are open-ended), so this asked the user
   again — went with a precomputed curated bank the learner toggles
   through, over a heavier live-in-browser model or a weaker
   free word-averaging approximation; see architecture.md §2's "Real
   sentence embeddings" row. Sets up a preview of RAG (comparing
   embeddings to find relevant text) as explicit groundwork for a much
   later module, and a forward reference to cosine similarity, covered
   next.

   Concept 4 drafted (final concept of this lesson, per its own
   mockup): cosine similarity — the actual computable operation behind
   every "close together on a plot" claim so far (angle between two
   vectors, not raw distance; `-1` to `1`). A from-scratch
   `cosine_similarity` implementation, verified live (its call against
   Concept 2's toy `cat`/`kitten`/`car` vectors uses `LiveDemo`'s
   `setupCode` prop to hide the function definitions, already shown
   separately as static reading, so only the actual check runs as the
   visible/editable snippet). Caught a real error while verifying:
   the mockup's hand-computed `cosine_similarity(cat, car) = 0.0173`
   doesn't match reality — the real value for those exact coordinates
   is `-0.1078`; fixed by citing the live-verified number instead (see
   architecture.md §2's "Real sentence embeddings" row finding).
   `SentenceEmbeddingSpace.tsx` (from Concept 3) gained an optional
   `showSimilarityTable` prop rather than a new component — Concept 4's
   page passes it, adding a live pairwise cosine-similarity table
   (color-intensity-coded by value) under the same plot and checklist,
   so a learner sees the exact number behind whatever clustering they
   already see visually. Lesson 1.2 (Embeddings) now has all 4 concepts
   drafted, awaiting its bookends mockup.

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
