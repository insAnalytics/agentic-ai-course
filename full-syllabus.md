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

2. **Embeddings** — Locked
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
   already see visually.

   Bookends: outcomes/why-it-matters intro, an 8-question comprehensive
   quiz (mixed order, spans all 4 concepts), and — like Lesson 1.1 — an
   ungraded closing synthesis rather than a graded comprehensive
   sandbox, for the same reason: no learner-authored code anywhere in
   this lesson either. A predict-then-check exercise over 4 sentence
   pairs, 3 of them brand new (a support-query paraphrase pair plus an
   unrelated one), appended to `embedding-sentences.json` rather than
   inserted, so Concepts 3/4's own hardcoded default-checked indices
   stayed valid. `SentenceEmbeddingSpace.tsx` gained a `defaultChecked`
   prop so this page could default-check exactly the 6 sentences the
   4 predictions need, embedded directly (plot + live similarity table)
   rather than only linking to Concept 4's copy of the same tool — same
   pattern as Lesson 1.1's own closing synthesis. All four real
   similarity numbers verified before shipping: 0.56/0.07/0.68/-0.06,
   matching the mockup's high/low/high/low predictions exactly.

Both Lesson 1.1 (Tokenization) and Lesson 1.2 (Embeddings) are now
fully Locked.

3. **Attention and Transformer Architecture** — Locked
   Not in this module's original rough-outline description above
   either (added once its mockup arrived, same as Lessons 1 and 2 were)
   — this is where the "architecture" and "attention" forward
   references from Lessons 1.1 and 1.2 actually land, confirming those
   earlier guesses (both left as unlinked plain text at the time,
   correctly, since the target didn't exist yet). Concept 1 drafted:
   why a token needs context, not just its own fixed embedding — a
   token embedding lookup is context-blind by construction (`"bank"` in
   `"river bank"` and `"bank"` in `"deposited money at the bank"` get
   the literal identical vector, verified live), motivating attention
   as the mechanism that lets a token's representation actually shift
   based on its real neighbors in a specific sentence. Purely
   conceptual, no new component.

   Concept 2 drafted: the attention mechanism itself — a weighted
   combination of every token's Value, weighted by Query/Key relevance,
   producing a new context-shifted representation per token. A toy
   6-token weighted-combination demo, verified live (also caught
   another hand-calculation error in the mockup: it claimed
   `[0.775, 0.115]`, the real computed result for those exact numbers is
   `[0.772, 0.103]`). `AttentionExplorer.tsx`: click any token in one of
   a small curated bank of sentences, see every other token shaded by
   real attention weight from an actual small transformer
   (`all-MiniLM-L6-v2`'s own encoder). Real attention turned out to be
   genuinely inconsistent across candidate sentences (~25 tested, only
   some showed a clean dominant pattern — a documented real limitation
   of small models, not a mistake), and raw `[CLS]` attention alone
   absorbed ~60% of the signal before excluding it — both asked about
   and logged as findings; see architecture.md §2's "Real attention
   weights" row for the full account. Went with hand-verifying a small
   curated bank rather than a broader, sometimes-unreliable "any
   sentence" tool.

   Concept 3 drafted: positional encoding — attention's Query/Key
   comparison depends only on token content, not sequence position, so
   "The dog bit the man" and "The man bit the dog" (same tokens,
   different order, opposite meaning) would score identically without
   it. A position-specific vector added onto each token's embedding
   before attention runs, so the same word at two different positions
   starts from two genuinely different vectors — verified live (this
   mockup's own numbers checked out exactly, unlike Concepts 2 and 4 of
   the previous two lessons). Purely conceptual otherwise, no new
   component.

   Concept 4 drafted: multi-head attention (several parallel Query/Key/
   Value computations, each potentially sensitive to a different kind
   of relationship, combined into one richer representation) and
   transformer blocks stacking into a real model (attention +
   feedforward = one block; each block refines the previous block's
   output, not the raw embeddings). `TransformerStack.tsx` — a
   step-through diagram of tokens flowing up through 6 stacked blocks
   (6 chosen deliberately to match the real depth of `all-MiniLM-L6-v2`,
   the small real model already grounding Concepts 1 and 3 of this
   lesson). Unlike the previous two concepts' interactives, this one
   needed no real-vs-curated-data decision: it's a structural diagram
   of the architecture, not a numeric claim about real model internals,
   and the lesson's own prose is explicit that per-layer content claims
   are unsettled research it deliberately avoids asserting — so the
   diagram only shows the same token labels flowing through, never
   invented per-layer semantic content.

   Concept 5 drafted (final concept of this lesson, per its own
   mockup): mixture-of-experts (MoE) — a router picks a small subset of
   "expert" feedforward networks per token (commonly 2 of 8), instead
   of every token using the same parameters, verified live with a
   `top_k_experts` toy router demo (numbers checked out exactly).
   Decouples "how big is this model" from "how expensive is it to run
   per token," flagged explicitly as groundwork for this module's later
   cost discussion — the same "quantization cost and operational
   concerns" forward reference first seen in Lesson 1.1, still not
   built, left as unlinked plain text a third time now. Purely
   conceptual otherwise, no new component.

   Bookends: outcomes/why-it-matters intro, a 9-question comprehensive
   quiz (mixed order, spans all 5 concepts), and — like Lessons 1.1 and
   1.2 — an ungraded closing synthesis rather than a graded
   comprehensive sandbox, for the same reason (no learner-authored code
   anywhere in this lesson). Different shape than the previous two
   lessons' synthesis, though: rather than a predict-then-check
   exercise with a fresh embedded tool, this one is a 6-step narrative
   walkthrough tracing `"bank"` in `"I sat by the river bank"` through
   the entire pipeline (token embedding → positional encoding → each
   transformer block's attention + feedforward → what an MoE router
   would additionally do), linking back into all 5 concepts including
   two anchor-specific links into Concepts 2 and 4's own interactive
   tools (`AttentionExplorer.tsx`, `TransformerStack.tsx`) rather than
   re-embedding fresh copies — the mockup's own phrasing ("revisit...
   side by side with this walkthrough") pointed at linking back to the
   originals, not rebuilding them here. Lesson 1.3 is now fully Locked.

All three Module 1 lessons built so far (1.1 Tokenization, 1.2
Embeddings, 1.3 Attention and Transformer Architecture) are now fully
Locked.

4. **How LLMs Generate Text** — Locked
   Matches this module's original rough-outline description (decoding
   parameters) — this is where Lesson 1.2's own forward reference
   ("the same normalized-probability idea covered directly in the next
   lesson," pointing at softmax) actually lands. Concept 1 drafted:
   logits (one raw score per vocabulary entry, from the final
   transformer layer) and softmax turning them into a real probability
   distribution, verified live with a toy 5-token example.
   `NextTokenDistribution.tsx` — a prompt picker + bar chart of a real
   language model's actual next-token probabilities, not illustrative
   numbers. This needed a genuine causal/autoregressive model (GPT-2,
   via `transformers`), unlike the BERT-style encoder used for
   embeddings/attention elsewhere in this module, since only a real
   language-modeling head produces a real next-token distribution at
   all — same curated-bank approach as the sentence-embedding and
   attention-weight demos (a "type any sentence" box can't be
   precomputed), but GPT-2's prediction quality didn't need the same
   heavy filtering attention did, since next-token prediction is
   literally what it's trained for. **Finding:** the mockup's own toy
   softmax numbers were wrong again (claimed `mat: 0.618`, real value
   `0.631`, etc.) — the fourth mockup-cited number this project has
   caught by actually running the code; see architecture.md §2's "Real
   next-token predictions" row.

   Concept 2 drafted: autoregressive generation — one token at a time,
   each step a full fresh pass through the entire model over the whole
   sequence so far (including everything generated in earlier steps),
   never a cheaper incremental shortcut. Verifying the toy demo caught
   a real logic bug this time, not just a wrong cited number: the
   mockup's lookup sliced to a fixed last-3-tokens window, which never
   matches its own 4- and 5-token dict keys, so run as written the loop
   never actually reaches `"the"`/`"mat"` and prints `.` twice instead
   — fixed by keying the lookup on the full sequence; see
   architecture.md §2's "Real next-token predictions" row for the full
   account. Purely conceptual otherwise, no new component.

   Concept 3 drafted: "the model predicts, it doesn't know," grounded
   in the exact mechanics of Concepts 1-2 — the same uniform
   logit-then-softmax process runs for every token regardless of
   whether the true answer is a well-established fact or something
   entirely fabricated, with no separate fact-checking step anywhere in
   the loop. A live fact-vs-fabrication softmax demo (a fifth
   hand-calculation error caught in this demo's cited numbers — the
   real values make the lesson's own point even more strongly than the
   claimed ones did; see architecture.md §2). Sets up hallucination as
   a direct, expected consequence of this mechanism, not a malfunction
   — covered next. Purely conceptual otherwise, no new component.

   Concept 4 drafted: hallucination as a direct, expected consequence
   of the same mechanism — not a malfunction, but that mechanism
   succeeding at its actual objective (a plausible continuation) where
   plausible and true have diverged. Includes the important nuance that
   hallucination isn't only an "obscure topic" problem — a popular
   misconception (Einstein/relativity vs. his actual Nobel-winning work
   on the photoelectric effect) can outscore the correct answer if
   repeated often enough in training text, verified live (a sixth
   hand-calculation error caught, same shape as the fifth — see
   architecture.md §2). Explicitly scopes out measuring/reducing
   hallucination (Evaluations and RAG modules' jobs, neither built yet
   — left as unlinked plain text, no page type even exists yet for a
   module-level link).

   Concept 5 drafted (final concept of this lesson, per its own
   mockup): knowledge cutoff — parameters freeze once training ends, so
   nothing after that point could have shaped them; asking about a
   post-cutoff event is mechanically identical to the fabricated-city
   case from Concept 3 (same generation process, nothing real to draw
   on). Notes a model's own awareness of its cutoff date is itself just
   a learned pattern, not guaranteed-accurate self-knowledge, and closes
   with the two real fixes (retrieval/RAG, tool use) as forward pointers
   to modules that don't exist yet, left unlinked. Purely conceptual,
   no code, no new component.

   Bookends: outcomes/why-it-matters intro, a 9-question comprehensive
   quiz (mixed order, spans all 5 concepts), and — like the previous
   three lessons — an ungraded closing synthesis rather than a graded
   comprehensive sandbox (no learner-authored code anywhere in this
   lesson). A "reason it through, then check" exercise over 4 scenarios,
   verified against `NextTokenDistribution.tsx` (now generalized with a
   `promptIndices` prop, pinned-default-preserving Concept 1's own
   six — same pattern as the `defaultChecked`/`initialRows` props on
   earlier lessons' components). One scenario's real result flatly
   contradicted the mockup's assumption (a genuinely unknowable
   future-event prompt produces honest uncertainty, not false
   confidence, after 8+ phrasings tested) — asked the user, then
   rewrote that scenario's reasoning to report the real, more nuanced
   finding rather than force or fake the assumed result; see
   architecture.md §2's "Real next-token predictions" row. The
   knowledge-cutoff scenario landed as the cleanest single result this
   project has produced — GPT-2 predicts "Dorsey" at 99.5% confidence
   for Twitter's CEO, accurate throughout its training window and
   therefore a genuine, unstaged demonstration of exactly what a
   cutoff means. Lesson 1.4 (How LLMs Generate Text) is now fully
   Locked.

All four Module 1 lessons built so far (1.1 Tokenization, 1.2
Embeddings, 1.3 Attention and Transformer Architecture, 1.4 How LLMs
Generate Text) are now fully Locked.

5. **Decoding Strategies and Generation Controls** — Locked
   Matches the "how llms generate text lesson" forward reference from
   Lesson 1.4 Concept 2, which correctly anticipated this as its own
   separate lesson rather than a concept within 1.4. Concept 1 drafted:
   greedy decoding (deterministic argmax, tends toward repetitive
   output over a long generation) vs. sampling (a genuine weighted draw
   via `random.choices`, respecting every candidate's real nonzero
   probability). `DecodingPlayground.tsx` reuses Lesson 1.4's own real
   GPT-2 bank (the same pinned six prompts) with a live greedy/sampling
   toggle — sampling performs a real client-side weighted draw over the
   real top-8 probabilities, re-drawable on demand. **Finding:** the
   mockup's seeded `random.choices` demo cited a 5-draw output that
   doesn't match reality — verified identically on two CPython versions
   and the actual shipped Pyodide demo (a seventh mockup-cited number
   this project has caught, and a new shape: a seeded PRNG sequence
   isn't something anyone could have hand-derived correctly, unlike a
   softmax calculation). See architecture.md §2's "Real next-token
   predictions" row for the full account.

   Concept 2 drafted: temperature — dividing every logit by the
   temperature value before softmax, sharpening the distribution below
   1 and flattening it above 1, with temperature approaching 0 provably
   equivalent to greedy decoding. Toy demo verified live — the first
   genuinely accurate mockup-cited numbers this project has found (off
   by 0.001 in one value, after seven straight misses). Extended
   `DecodingPlayground.tsx` with a live temperature slider rather than
   building a new tool, per the mockup's own "extending Concept 1's
   decoding playground" framing. Testing the slider live caught two
   real bugs neither related to a wrong number: a genuine SSR/client
   hydration mismatch from an unrounded float in a CSS width (fixed in
   both this component and `NextTokenDistribution.tsx`, which had the
   same latent pattern), and a design bug where switching between
   raw and renormalized percentages right at temperature=1 made the top
   candidate's shown probability visibly jump the wrong direction —
   fixed by renormalizing consistently at every temperature. See
   architecture.md §2's "Real next-token predictions" row for the full
   account.

   Concept 3 drafted: top-p and top-k, cutting candidates out of the
   sampling pool entirely (rather than reshaping probabilities the way
   temperature does) — top-k keeps a fixed count, top-p adaptively keeps
   just enough to cross a cumulative-probability threshold. All four
   LiveDemos verified exactly against real Python execution, the first
   concept in this lesson with zero hand-calculation errors to fix.
   Extended `DecodingPlayground.tsx` with top-k/top-p sliders, rendering
   discarded candidates dimmed and struck through rather than removed.
   Also self-caught and fixed a design-consistency bug: the shared
   `DecodingPlayground.tsx` had no prop-based feature gating, so the
   temperature and top-k/top-p sliders added in Concepts 2 and 3 were
   silently leaking onto Concept 1's already-shipped page. Fixed with
   `showTemperature`/`showTopKTopP` props (both default `false`, same
   pattern as `SentenceEmbeddingSpace.tsx`/`NextTokenDistribution.tsx`
   elsewhere in the project); re-verified via Playwright that each
   concept's page now shows exactly the controls it should. See
   architecture.md §2's "Real next-token predictions" row for the full
   account.

   Concept 4 drafted: frequency penalty (logit minus `penalty × times_used`,
   growing with repetition) vs. presence penalty (one flat subtraction
   once a token has appeared at all), with a live side-by-side demo.
   Demo output verified exactly against real Python and the shipped
   Pyodide `LiveDemo` (no error to fix; pure arithmetic, no interactive
   component needed).

   Concept 5 drafted: logprobs — why the log (products of many small
   probabilities become stable sums), reading a logprob (near 0 = high
   confidence), and the Lesson 4 confident-fact vs. fabricated-scenario
   distributions re-read as logprobs. **Finding:** the mockup's cited
   logprobs (`Paris -0.066`, `Aldric Thorne -0.931`, ...) were computed
   from the *old, incorrect* Lesson 4 probabilities, despite claiming to
   be "the exact distributions from Lesson 4"; the demo now runs the
   real Lesson 4 logits through `softmax` first, giving `Paris -0.001`,
   `Lyon -7.701`, `Aldric Thorne -0.819` — same point, sharper
   contrast. See architecture.md §2. Concept 6 drafted (the final
   concept section, per its own mockup): stop sequences (controlling
   *when* generation ends rather than *which* token is picked) and why
   temperature 0 still isn't a byte-for-byte determinism guarantee
   (floating-point order-sensitivity plus request batching). Both demos
   verified in local Python and the shipped Pyodide `LiveDemo`; added one
   clarifying sentence that the toy function keeps the stop sequence in
   its result while real APIs typically omit it, and reworded the
   mockup's slightly-off "isn't perfectly consistent regardless of the
   order" to "can depend on the order". No architecture change.
   Bookends: outcomes/why-it-matters intro
   (`00-intro.mdx`), and a Recap & Practice page (`07-recap-practice.mdx`)
   with a 10-question comprehensive quiz spanning all six concepts plus
   an ungraded closing synthesis — pick temperature/top-p/top-k/penalty
   settings for three use cases (support bot, brainstorming tool, code
   assistant), checked against `DecodingPlayground.tsx` with all three
   sliders enabled. Deliberately not a graded sandbox: like Lessons 1.1
   and 1.4, there's no learner-authored code in this lesson. The
   playground doesn't model the frequency/presence penalties, so the
   page says so and points back to Concept 4 for those. No new
   verification findings in the bookends.

6. **Context Windows and KV Cache** — Locked
   Title confirmed by the bookends mockup (folder renamed from the working
   name `06-context-windows` to `06-context-windows-and-kv-cache`). Concept 1
   drafted: what a context window is (one shared token budget covering
   prompt, history, and response), why the limit exists at all
   (attention's pairwise cost grows with the square of sequence length),
   and what happens past it (error, truncation, sliding window — none
   universal). Demo verified exactly against real Python and the shipped
   Pyodide `LiveDemo`; no mockup errors. Concept 2 drafted: max output length vs. context
   window (input and output share one token budget; `max_tokens` is
   only a ceiling, capped by whatever room remains). Demo verified
   (`500`/`4000`) in local Python and the shipped Pyodide `LiveDemo`;
   added one hedge sentence and a matching quiz-question qualifier,
   since some providers reject an over-budget request instead of
   clamping it as the demo does. Concept 1's "next concept" callback now
   links to this page.

   Concept 3 drafted: KV cache — why a token's Key/Value never needs
   recomputing, and what the cache stores. Demo verified exactly
   (`4`/`5`/`6`) in local Python and the shipped Pyodide `LiveDemo`. The
   mockup's interactive became `KVCacheDiagram.tsx` (step-through, fresh
   vs. "reused" tokens, running with/without-cache computation totals —
   structural, no data-accuracy claims; see architecture.md's component
   tree). Small accuracy edits to the mockup's prose: added a
   causal-masking parenthetical (a token's Key/Value are stable because
   tokens only look backward), reworded "the exact same lookup pattern as
   `.get()`" (the demo uses an `in` membership check, only closely
   related to `.get()`), and explained why the demo's first line prints
   `4`, not `1` (the cache starts empty, so the prompt tokens get filled
   in too). Concept 4 drafted: why prompt structure affects
   cache-hit rate and cost (a shared token-for-token prefix can be reused
   across separate requests, so stable content belongs first). **Finding:**
   the mockup's shared-prefix demo cited `9` shared tokens; the real
   output is `10` (the prompts also share `"Question : What is"`), a
   ninth mockup-cited-number error, verified in local Python and the
   shipped Pyodide `LiveDemo` — see architecture.md §2's "Real next-token
   predictions" row. Also reworded a garbled Concept 3 callback. Concept 5 drafted (the final concept section, per its
   own mockup): the lost-in-the-middle effect. The mockup's "accuracy by
   position" interactive is `PositionAccuracyChart.tsx`, plotting the
   *real* published data from Liu et al. (2023), Appendix G.2 Table 6
   (four models, 20 documents), not an invented curve — extracted
   programmatically from the paper and logged in architecture.md §2.
   **Finding:** the mockup called the shape "consistently U-shaped"; the
   real data is cleanly U-shaped only for GPT-3.5-Turbo (its middle
   accuracy even falls below its no-documents baseline) and much
   shallower or start-heavy for the others, so the prose was written to
   say what actually holds (best accuracy at an edge, middle used less
   reliably). The "later prompt engineering scope in the Agentic AI basics
   module" callback is left as plain text (that module isn't built).
   Bookends: outcomes/why-it-matters intro (`00-intro.mdx`) and a
   Recap & Practice page (`06-recap-practice.mdx`) with a 9-question
   comprehensive quiz spanning all five concepts (Q3 gained the same
   "assuming the provider clamps rather than rejects" qualifier as
   Concept 2's version) plus an ungraded closing synthesis — structure
   a prompt for a repeated, document-heavy policy-Q&A agent, then check
   against reasoning that ties Concepts 2-5 together. Deliberately not a
   graded sandbox (no learner-authored code in this lesson, same as
   Lessons 1.1, 1.4, and 1.5). No new verification findings in the
   bookends. Lesson 1.6 is now fully Locked.

7. **How Models Are Trained** — Building
   Title is a working name (the mockup names only Concept 1 — rename the
   folder/`_lesson.yaml` if the drafter's real title differs). Concept 1
   drafted: pretraining, the base stage (next-token prediction over
   massive raw text; a base model has no learned notion of following
   instructions or ending an answer). The mockup's pipeline-diagram
   interactive is `TrainingPipeline.tsx`, built to be reused across the
   lesson (`active`/`revealed` props; later stages are dimmed
   placeholders until their concept exists). The mockup's base-model
   example was explicitly illustrative; added a *real* GPT-2 greedy
   output alongside it (it answers, then loops forever — see
   architecture.md §2's "Real next-token predictions" row). Concept 2 drafted:
   SFT (same training process on a small, curated instruction-response
   dataset; teaches behavior, not primarily facts). `TrainingPipeline.tsx`
   now describes stage 2. **Finding:** a real current base/instruct pair
   (`Qwen2.5-0.5B` vs. `-Instruct`) both answer the simple example
   prompt identically, unlike the mockup's illustrative contrast, so the
   page keeps the illustration but adds an honest caveat with the real
   result — see architecture.md §2. Concept 1's link to Concept 2 now
   resolves. Remaining concepts not yet drafted (preference training and
   message roles next, per its own mockup). No bookends yet.

The rest of Module 1 (model landscape/benchmark literacy, raw API
mechanics, structured outputs) remains a rough outline — not yet broken
into lessons.

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
