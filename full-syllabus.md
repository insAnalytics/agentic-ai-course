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

7. **The Training Pipeline** — Locked
   Title confirmed by the bookends mockup (folder renamed from the working
   name `07-how-models-are-trained` to `07-the-training-pipeline`). Concept 1
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
   resolves. Concept 3 drafted: preference training (RLHF/RLAIF/DPO),
   why message roles are just learned conventions over special tokens,
   sycophancy, and the mechanistic root of prompt injection.
   `TrainingPipeline.tsx` now describes stage 3. **Finding:** the mockup
   said roles are learned "specifically" in preference training; the chat
   format is typically introduced in SFT and reinforced by preference
   training, so the prose was corrected. Backed the "roles are just
   tokens" claim with a real chat template (`Qwen2.5-0.5B-Instruct`'s
   `<|im_start|>`/`<|im_end|>` special tokens) and added a Sharma et al.
   (2023) citation for sycophancy — see architecture.md §2. The "Agentic
   AI basics module" callback stays plain text (module not built).
   Concept 4 drafted: RL for reasoning (correctness as a
   verifiable reward signal; reasoning models as the product of a
   deliberate training stage; why they cost more — more tokens, each a
   full generation step). Prose-only, nothing to verify.
   `TrainingPipeline.tsx` is now fully populated with all four stages.
   The "next lesson ... test-time compute" callback stays plain text (that
   lesson isn't built). Also added (not in the mockups, at the user's suggestion): a
   real training-example card for each of Concepts 1-4
   (`TrainingExampleCard.tsx`, data from C4, databricks-dolly-15k,
   Anthropic HH-RLHF, and GSM8K via `scripts/generate-training-examples.py`
   — see architecture.md §2's "Real training examples" row). Concept 5 drafted (the final concept section, per its own
   mockup): fine-tuning as a builder's option — prompting vs. retrieval vs.
   fine-tuning, and LoRA. The mockup's decision-flow interactive is
   `AdaptationChooser.tsx`. LoRA demo verified exactly (`0.0286%`), and a
   real measured GPT-2 LoRA ratio (`0.24%`, via `peft`) was added beside
   the illustrative 70B figure — see architecture.md §2. The "Agentic AI
   basics" and "RAG Systems" module callbacks stay plain text (modules not
   built).

   Bookends: outcomes/why-it-matters intro (`00-intro.mdx`) and a
   Recap & Practice page (`06-recap-practice.mdx`) with a 10-question
   comprehensive quiz spanning all five concepts (Q4's "learned from
   preference training" wording aligned with Concept 3's corrected
   "learned from training") plus an ungraded closing synthesis — decide
   between prompting, retrieval, and fine-tuning for a support agent's
   tone, changing pricing, and persistent-refusal needs, tying back to
   SFT, the knowledge cutoff, and prompt injection. Deliberately not a
   graded sandbox (no learner-authored code). No new verification
   findings in the bookends. Lesson 1.7 is now fully Locked.

8. **Scaling Laws and Emergent Behavior** — Locked
   Title confirmed by the bookends mockup (it matched the working name, so
   no rename was needed). Concept 1 drafted: scaling laws, the
   training-time picture (smooth, predictable power-law decrease in
   training loss with scale; why the predictability is useful; what it
   does and doesn't describe). The mockup's log-log scaling curve is
   `ScalingCurveChart.tsx`, plotting the *published fits* from Kaplan et
   al. (2020) for compute, parameters, and data (constants read straight
   from the paper and cross-checked against its own break-down estimate);
   the paper's raw points are only figure images, so the chart says
   "published fits" rather than implying raw data — see architecture.md
   §2's "Real scaling laws" row. The next-concept (emergent behavior)
   reference is plain text until that page exists. Lesson 1.7 Concept 4's
   forward reference to this lesson's test-time compute is likewise still
   plain text.

   Concept 2 drafted: emergent behavior as a contested debate (the
   sudden-jump claim, the measurement-artifact counterargument, neither
   view stated as settled). The mockup's two-chart interactive is
   `EmergenceMetricChart.tsx`, deliberately a **labeled illustration**
   computed from a toy model (exact match = per-digit accuracy^k), not
   measured data — a real Pythia-family experiment was tried first and
   abandoned as too slow and unlikely to show a jump; see architecture.md
   §2's "Real scaling laws" row for the decision. Concept 1's next-concept
   reference now links here.

   Concept 3 drafted: in-context learning as a mechanism (a task learned
   from prompt examples alone, frozen weights, and why it belongs in a
   scaling lesson). Beyond the mockup's illustrative example, added a
   *real* run of that same kind of task on four Pythia sizes
   (`InContextLearningDemo.tsx`, via `scripts/generate-icl-demo.py`):
   70M `0/40`, 160M `7/40`, 410M `40/40`, 1B `40/40` — with the exact-match
   caveat from Concept 2 noted in the prose. See architecture.md §2's
   "Real in-context learning demo" row. The "Agentic AI basics" callback
   stays plain text (module not built). Concept 4 drafted (the final concept
   section, per its own mockup): test-time compute and reasoning models
   (a second scaling axis at inference time; where it comes from; the
   real cost and latency tradeoffs). Prose plus one cost demo, no
   interactive. **Finding:** the mockup's cost demo printed `$0.0023` for
   the standard response; the real output is `$0.0022` (a float-rounding
   tie: `0.00225` is stored just below the boundary) — see
   architecture.md §2. Lesson 7 Concept 4's forward reference to this
   concept now links here. The "quantization, cost and operational
   concerns" lesson callback stays plain text (not built).

   Bookends: outcomes/why-it-matters intro (`00-intro.mdx`) and a
   Recap & Practice page (`05-recap-practice.mdx`) with an 8-question
   comprehensive quiz spanning all four concepts plus an ungraded closing
   synthesis — classify four scenarios as training-time vs. inference-time
   scaling and decide when a reasoning model is worth its cost. Deliberately
   not a graded sandbox (no learner-authored code). No new verification
   findings in the bookends. Lesson 1.8 is now fully Locked.

9. **Calling LLM APIs and Processing Responses** — Locked
   Title confirmed by the bookends mockup (folder renamed from the working
   name `09-calling-llm-apis` to `09-calling-llm-apis-and-processing-responses`).
   Concept 1 drafted: the request shape (endpoint + API-key header + JSON
   body; where `messages`, `temperature`/`top_p`/`stop`, `max_tokens`, and
   the key header each came from earlier in the course). Illustrative,
   non-runnable code blocks, per the mockup's own note. **Finding:** the
   mockup's request mixed Anthropic and OpenAI conventions and included
   `temperature`/`top_p` for a model that no longer accepts them (400) —
   fixed with a generic `example-model` request plus an accurate
   Anthropic-shaped one; also softened Lesson 1.5's "every major LLM API"
   overclaim. See architecture.md §2's "Real in-context learning demo"
   row for the finding log.

   Concept 2 drafted: the response shape (content, `usage` token counts,
   and `stop_reason` — why generation stopped, including detecting a
   `max_tokens` truncation programmatically). Both parsing demos are
   ordinary Python and were verified live against the mockup's expected
   output (exact match, no errors). Small accuracy edits: the example
   response now uses `claude-haiku-4-5` (matching Concept 1's request) and
   includes the real `type` and `stop_sequence` fields; added a note that
   field names vary by provider (OpenAI-style `choices[0].message.content`,
   `prompt_tokens`/`completion_tokens`, `finish_reason`) and that
   `stop_reason` has other values beyond the three named. Concept 3 drafted: multi-turn conversations (the API is
   stateless, so the client resends the full history every request; REST
   statelessness made concrete; the compounding input-token cost and its
   link to the context window). **Finding:** the mockup's demo had an
   off-by-one — it counted the history *after* the assistant's reply, so
   it printed `3 / 5 / 7` messages sent; what a request actually sends is
   `2 / 4 / 6`. Demo, prose, and quiz Q2 corrected and verified live — see
   architecture.md §2's finding log. Concept 4 drafted: sending non-text inputs (`content` as an array
   of typed blocks; why images are base64-encoded text inside JSON) —
   demo verified exactly; added the verified PNG-prefix and 4/3-size-inflation
   details. Concept 5 drafted: streaming a response (the same SSE mechanism
   from Module 0 applied to a real LLM call; why it works — generation is
   already token by token; the perceived-latency benefit) — demo verified
   exactly; the illustrative SSE payloads now use the real event shape
   (`type`/`index`/`delta.type`) rather than a stripped-down one. See
   architecture.md §2's finding log. Concept 6 drafted (the final concept
   section, per its own mockup): reasoning output in responses (a separate
   `thinking` content block, reasoning tokens counted and billed in
   `output_tokens`, and provider variation in what's exposed). **Finding:**
   the mockup's demo printed `...capital of Fran...` but `[:50]` yields
   `...capital of France. Th...` — corrected by showing the real live
   output; see architecture.md §2. Added an accurate note on how Claude
   returns thinking blocks (summary or empty, billed either way). 

   Bookends: outcomes/why-it-matters intro (`00-intro.mdx`) and a
   Recap & Practice page (`07-recap-practice.mdx`) with an 11-question
   comprehensive quiz spanning all six concepts (Q1's "learned from
   preference training" wording aligned with Lesson 1.7's corrected
   "learned from training") plus an ungraded closing synthesis tracing a
   streamed, reasoning-model, turn-3 request and response. The mockup's
   closing synthesis linked "the shared context-window budget" to Module
   0's FastAPI lesson, which is the wrong target; it now links to Lesson
   1.6's max-output-length concept, where that budget is actually covered.
   Deliberately not a graded sandbox (no learner-authored code). Lesson
   1.9 is now fully Locked.

10. **Structured Output and Tool Calling** — Locked
    Title confirmed by the bookends mockup (folder renamed from the working
    name `10-structured-outputs` to `10-structured-output-and-tool-calling`).
    Concept 1
    drafted: the naive approach (asking for JSON in the prompt) and its two
    failure modes — extra text breaking `json.loads`, and valid JSON with
    wrong types failing Pydantic validation. Both demos verified live in
    the shipped Pyodide environment; the only difference from the mockup's
    expected output is Pydantic's own trailing docs-link line, now
    explained on the page. Concept 1's link to Concept 2 now resolves.

    Concept 2 drafted: constrained decoding — masking invalid tokens'
    logits to negative infinity before softmax so schema violations are
    structurally unreachable, contrasted with Lesson 1.5's soft penalties.
    Demo verified (added `round(p, 3)` so the live output matches the
    mockup's rounded expected output); added a note that the guarantee
    covers shape, not truth of values. Concept 3 drafted: from a Pydantic model to an enforceable
    schema (`.model_json_schema()`, the same `BaseModel` doing double duty
    for FastAPI validation and LLM output constraints, the full round trip).
    Both demos verified exactly. **Finding:** the mockup's illustrative
    request used a `response_format`/`json_schema` field that's valid for
    neither Claude (`output_config.format`) nor OpenAI-style APIs (which
    need a `{name, schema}` wrapper); replaced with the accurate Claude
    shape and a provider-variation note, and added a `max_tokens`
    truncation caveat tying back to Lesson 1.9 — see architecture.md §2's
    finding log. Concept 4 drafted: tool calling as structured output applied to
    a specific use case (the model produces structured data naming a tool
    and arguments; your code decides whether to execute it) — demo verified
    exactly. Added two accuracy notes: real response shapes differ by
    provider (Anthropic `tool_use`/`input` dict vs. OpenAI JSON-string
    arguments), and the schema guarantee is opt-in (`strict: true`), so
    validating arguments client-side stays worthwhile — see
    architecture.md §2's finding log. Concept 5 drafted (the final concept section, per its own
    mockup): the full tool-calling round trip (the result goes back as a
    new message and a second API call produces the final answer — nothing
    new mechanically, just statelessness, history resending, and structured
    output composed). **Finding:** the mockup's example omitted the
    `tool_use` `id` and the matching `tool_result` `tool_use_id` that
    Claude's API requires; added both and explained the pairing — see
    architecture.md §2's finding log. Demo verified live.

    Bookends: outcomes/why-it-matters intro (`00-intro.mdx`) and a
    Recap & Practice page (`06-recap-practice.mdx`) with a 9-question
    comprehensive quiz spanning all five concepts plus an ungraded
    closing synthesis (design a `search_flights` tool end to end), whose
    four callbacks deep-link to Subsection anchors verified against the
    built HTML. Deliberately not a graded sandbox (no learner-authored
    code). No new verification findings in the bookends. Lesson 1.10 is
    now fully Locked.

11. **Quantization, Cost, and Operational Concerns** — Locked
    Title confirmed by the bookends mockup (folder renamed from the working
    name `11-quantization-and-the-model-landscape` to
    `11-quantization-cost-and-operational-concerns`). Concept 1
    drafted: quantization (FP16 → INT8 → INT4 as fewer bits per weight,
    the memory/speed vs. quality tradeoff, and that it's a decision for
    whoever self-hosts a model, not for API users). The
    `quantize_to_n_levels` demo was checked against an equivalent
    computation and matches the mockup's expected output exactly. The
    mockup's two lesson-level callbacks (attention/transformer lesson,
    training pipeline lesson) were resolved to the attention-mechanism
    concept and the pretraining "parameters behind every logit"
    subsection respectively.

    Concept 2 drafted: the model landscape and selection (open-weight vs.
    closed, size tiers, reasoning vs. standard as an orthogonal axis, and
    why total parameter count misleads under MoE). The mockup's
    "interactive model-selection framework" is `ModelSelectionGrid.tsx` — a
    3x3 grid (task complexity x privacy/control needs) whose cells and
    detail panel split each recommendation into hosting, size tier, and
    standard-vs-reasoning, so the two orthogonal axes stay visibly
    separate; structural, no data claims, captioned as a rough starting
    point. All five callbacks resolved to verified anchors. Quiz Q3's
    correct option was reworded from the mockup's muddled "complexity and
    need for control/privacy/size" to "whether a task benefits from
    extended reasoning and how large a model it needs", matching the
    concept's actual reasoning-vs-size axes.

    Concept 3 drafted: token-based pricing and every cost driver from the
    module pulled together (input vs. output rates, cached input, reasoning
    tokens, language, non-text inputs). The combined-cost demo was run in
    real Python and matches the mockup exactly (`$0.0034` vs. `$0.0334`,
    ~9.8x); added a one-line note reconciling that with Lesson 8's output-
    only `~14x` (the mostly-cached input cost is fixed, so the whole-
    request multiple is lower). All six callbacks resolved to verified
    anchors (the mockup's two-target "non-text inputs" callback became two
    links). Lesson 1.8's Concept 4 still says the pricing math is "covered
    forward in this module's cost lesson" as plain prose — left as is.
    Concept 4 drafted (the final concept section of the lesson, and of
    Module 1's concept content, per its own mockup): provider-side rate
    limits (RPM/TPM caps, `429`, exponential backoff). Backoff demo run in
    real Python and matches the mockup exactly. **Finding:** the mockup
    pointed its `429` callback at Module 0's "response models and exception
    handling" concept, which never mentions `429` — the status is actually
    shown in the FastAPI lesson's rate-limiting subsection, so both
    callbacks now link there. Added a short note on jitter and the
    `Retry-After` header (standard practice the bare demo omits).

    Bookends: outcomes/why-it-matters intro (`00-intro.mdx`) and a
    Recap & Practice page (`05-recap-practice.mdx`) with an 8-question
    comprehensive quiz spanning all four concepts plus an ungraded closing
    synthesis (a deployment decision: API vs. self-host, quantization
    level, size/reasoning tier, rate-limit handling), whose four callbacks
    deep-link to Subsection anchors verified against the built HTML.
    Deliberately not a graded sandbox (no learner-authored code). The
    fourth outcome says "implement exponential backoff", but the lesson
    only demos a simulated backoff loop (no graded exercise) — wording kept
    as drafted. Lesson 1.11 is now fully Locked.

The rest of Module 1 (benchmark literacy and anything beyond this
lesson) remains a rough outline — not yet broken into lessons.

---

## Module 2 — The Agent Loop

*Renamed from "Build Intelligent Conversation Agents" as part of a newer,
more refined syllabus structure. The 7-item list below is the **old**
outline and is superseded — kept only until the new lesson breakdown is
handed over; lessons actually being built are tracked in the "Built so
far" list directly below it.*

**Built so far:**

1. **Agents, Workflows, and the Loop** — Locked
   Title confirmed by the bookends mockup (folder renamed from the working
   name `01-what-an-agent-is` to `01-agents-workflows-and-the-loop`).
   Module folder is `02-the-agent-loop`. Concept 1 drafted: what an agent is,
   structurally (Module 1's tool-call round trip wrapped in a loop the
   model itself controls; the perceive → reason → act → observe cycle; a
   live demo of a two-cycle loop). Demo run in real Python, output matches
   the mockup exactly. **Finding:** the mockup's tool-call/tool-result
   messages omitted the `id` / `tool_use_id` pairing that Lesson 1.10
   Concept 5 established Claude's API requires; added both to the demo
   (output unchanged) with a note linking back. Both callbacks resolved to
   Module 1 anchors verified in the built HTML.

   Concept 2 drafted: agent vs. workflow vs. chatbot (the distinguishing
   question is who controls the sequence — a human, the code, or the
   model; sophistication and structure as independent axes). Prose plus a
   static `run_workflow` sketch (`...` bodies, labeled illustrative in the
   mockup, so not a live demo). Both callbacks link to Concept 1
   Subsection anchors verified in the built HTML.

   Concept 3 drafted (the final concept section of the lesson, per its
   own mockup): the honest case for not using an agent (unpredictable
   cost/latency, harder to test, harder to debug; when a fixed workflow is
   clearly better; the runtime-information decision test; how to read the
   rest of the module). Prose only, no demo. All four callbacks resolved
   to verified anchors/pages; the testing callback targets the Module 0
   error-paths concept's "systematic checklist" subsection, the closest
   match for the "assert exactly these steps" discipline the mockup
   contrasts against.

   Bookends: outcomes/why-it-matters intro (`00-intro.mdx`) and a
   Recap & Practice page (`04-recap-practice.mdx`) with a 7-question
   comprehensive quiz spanning all three concepts plus an ungraded
   closing synthesis (classify three new scenarios as chatbot / workflow /
   agent and apply the decision test), whose two callbacks link to the
   Concept 3 "actual decision test" subsection, verified in the built
   HTML. Deliberately not a graded sandbox (no learner-authored code). No
   new verification findings in the bookends. Lesson 2.1 is now fully
   Locked.

2. **Prompting Fundamentals** — Locked
   Title confirmed by the bookends mockup (the working title was correct,
   so no folder rename was needed). Concept 1
   drafted: specificity and clear instructions (a vague prompt vs. a
   specific one — what/how/constraints — and why vagueness has structural,
   not just stylistic, consequences inside an agent's own instructions).
   Prose only; the prompt/output examples are static and labeled
   illustrative (the mockup notes no live LLM is available in the
   sandbox). The mockup's callback to "the system prompt as agent design"
   lesson (the next lesson, not yet built) is left as plain text "covered
   in the next lesson" — link it once that lesson exists. The Lesson 1
   loop callback links to Lesson 2.1's "loop's length isn't fixed"
   subsection, verified in the built HTML.

   Concept 2 drafted: examples in the prompt (few-shot) — zero-shot vs.
   few-shot, where a description alone falls short, how many examples
   help, representative vs. merely numerous examples — plus Applied
   sandbox exercise 1, the first graded exercise in Module 2. No live LLM
   exists in the sandbox, so it grades the learner's written *prompt text*
   directly via the stock `GradedExercise` (a `prompt` variable checked by
   four hidden Python tests); see architecture.md §4.1 for the harness and
   the 13-submission verification against real Pyodide. All four callbacks
   resolved to verified anchors/pages.

   Concept 3 drafted: output format and delimiters (the data-vs-instruction
   ambiguity in an unstructured prompt, delimiters as an explicit boundary,
   stating the output format in the prompt, and why that's a request rather
   than a guarantee — complementary to Module 1's constrained decoding).
   Prose only, static illustrative prompts, no demo. Both callbacks resolve
   to Lesson 1.10 anchors verified in the built HTML. Added one sentence
   the mockup lacks: delimiters clarify the boundary but aren't a security
   boundary against text deliberately written to fool the model (in keeping
   with the concept's own request-not-guarantee framing).

   Concept 4 drafted: chain-of-thought prompting (a multi-step problem
   answered badly when only the final number is requested, asking for the
   reasoning explicitly and why that helps mechanically, CoT prompting vs.
   a trained reasoning model) plus Applied sandbox exercise 2, a second
   prompt-text-graded exercise using the same `prompt`-variable pattern
   (four hidden tests; verified against real Pyodide with 14 submissions —
   see architecture.md §4.1). **Finding:** the mockup's exercise problem
   (140 − 45 + 60 books, then "a third" removed) gives 155 books and a
   non-integer third; donation changed to 70 (answer: 110). Three callbacks
   resolved to verified pages/anchors; the fourth (the next lesson, ReAct
   and reasoning in the loop) isn't built yet, so it's plain text — link it
   once that lesson exists.

   Concept 5 drafted (the final concept section of the lesson, per its
   own mockup): iterating systematically rather than by vibes — a small
   representative test set checked together instead of judging a change
   from one output, deliberately not formal evaluation. Prose only, static
   illustrative results. The mockup's authoring note about not being formal
   evaluation became a short learner-facing intro paragraph (the later
   evaluation module isn't built, so it's referenced as plain text). The
   one callback (Concept 2's representative-examples discussion) links to
   a verified anchor.

   Bookends: outcomes/why-it-matters intro (`00-intro.mdx`) and a Recap &
   Practice page (`06-recap-practice.mdx`) with a 9-question comprehensive
   quiz spanning all five concepts plus a **graded comprehensive sandbox**
   (unlike Lessons 1.9-1.11 and 2.1, this lesson has a real learner-authored
   artifact — a prompt): a receipt-totalling prompt combining a delimiter, a
   worked example, a step-by-step request, an output format, and a final
   unanswered receipt, graded as text by six hidden tests (see
   architecture.md §4.1; verified against real Pyodide with 19
   submissions). The task text also requires stating that discount/tax
   lines are ignored, which the mockup's grading list didn't name, so it's
   its own check. The intro's "system prompt" and "tool descriptions"
   callbacks point at lessons not built yet, so they're plain text; the
   mockup's unmarked "warned about in Lesson 1" now links to Lesson 2.1's
   honest-case concept. The hint's Concept 4 callback links to that page.
   Lesson 2.2 is now fully Locked.

3. **The System Prompt as Agent Design** — Locked
   Title confirmed by the bookends mockup (taken originally from an
   earlier mockup's callback text, so no folder rename was needed).
   Concept 1 drafted: what the system prompt actually is
   and why it carries weight (a learned convention over ordinary tokens,
   not an architectural channel; standing instructions vs. the per-turn
   task; resent in full every call per Module 1's statelessness). Demo run
   in real Python; output matches the mockup exactly. **Finding:** the
   mockup said roles are learned "during preference training"; Lesson 1.7
   (corrected) established the chat format is introduced in SFT and
   reinforced by preference training, so the prose and Q1's correct option
   now say "post-training" with that detail (same fix Lesson 1.9's Q1
   already made). Added a short note that the demo's `system`-role message
   is the generic shape while Anthropic's API takes a top-level `system`
   field, linking Lesson 1.9's provider-differences subsection, and Q3's
   explanation notes prompt caching is a billing optimization, not the
   model remembering. All three callbacks link to verified anchors.

   Concept 2 drafted: role, persona, and behavioral constraints (a
   role-less system prompt as vagueness in the highest-stakes place; a
   role plus explicit always/never constraints as the guardrail against
   ungrounded claims). Prose only, static illustrative system prompts, no
   demo. The mockup's five callbacks resolved to verified pages/anchors
   (the lesson-level "every technique from Lesson 2" links to that lesson's
   intro). Added one sentence the mockup lacks: these constraints are a
   strong nudge, not a mechanical guarantee, in keeping with Lesson 2.2's
   request-not-guarantee framing.

   Concept 3 drafted: tool guidance — strategic, not mechanical (a tool's
   schema guarantees a call's shape but says nothing about when to call it
   or how to use the result; that guidance lives in the system prompt as a
   request, not a guarantee) plus Applied sandbox exercise 1, graded as
   system-prompt *text* through the stock `GradedExercise` (a
   `system_prompt` variable, five hidden tests — see architecture.md §4.1,
   verified against real Pyodide with 11 submissions, which caught and
   fixed a real bug in the constraint check). The `check_inventory`
   schema demo ran in real Pyodide and matches the mockup exactly. The
   task text says the constraint must not just be about the tool, which
   the mockup's grading description doesn't state explicitly. The
   Module 1 callback and the Lesson 2.2 "request, not guarantee" callback
   link to verified pages/anchors; added a note in Q1's explanation that
   the schema guarantee is opt-in per provider (Lesson 1.10). 

   Concept 4 drafted (the final concept section of the lesson, per its
   own mockup): phase-aware prompting (a single static prompt vs. asking
   the model to track its own phase vs. code-tracked `current_phase` with
   phase-specific instructions). The two-phase instructions demo ran in
   real Python and matches the mockup's output exactly. Its one callback
   (the next lesson, "writing the loop by hand") points at a lesson not
   built yet, so it's plain text — link it once that lesson exists.

   Bookends: outcomes/why-it-matters intro (`00-intro.mdx`) and a Recap &
   Practice page (`05-recap-practice.mdx`) with a 7-question comprehensive
   quiz spanning all four concepts (Q1 aligned to "post-training", as in
   Concept 1) plus a **graded comprehensive sandbox** — a full system
   prompt for the agent-registry agent (role, constraint, guidance for
   both `check_agent_exists` and `create_agent_entry`, and check-before-
   create ordering), graded as text by eight hidden tests (architecture.md
   §4.1; verified against real Pyodide with 16 submissions). **Finding
   (real bug in an earlier exercise):** building this exercise's
   sentence-level checks showed the Concept 3 exercise's splitter also
   split on hard line wraps, so a learner's differently-wrapped but valid
   prompt could fail a check the shipped reference only passed by luck of
   where its lines break; fixed in both exercises with a shared
   join-single-newlines step and re-verified (see architecture.md's
   follow-up note). The Module 0 callback ("the same agent registry app")
   links to the FastAPI lesson's comprehensive registry-app exercise; the
   hint and explanation's Concept 4 callbacks link to that concept's page.
   Lesson 2.3 is now fully Locked.

4. **Writing the Loop by Hand** — Locked
   Title confirmed by the bookends mockup. Concept 1 drafted: the fake LLM client
   (what it is, a minimal working version, using it, and why a scripted
   response sequence makes grading the loop's structural correctness
   possible). This is the first Module 2 material that genuinely runs live
   against real-shaped responses rather than illustrative snippets. Demo
   verified in real Pyodide; output matches the mockup exactly. **Deviation:**
   `ToolUseBlock` gains an auto-generated `.id` (constructor signature
   unchanged) so a loop can send back a matching `tool_use_id`, per Lesson
   1.10 Concept 5; see architecture.md §4.1. Also noted on the page: the
   blocks are attribute-style objects like a real SDK's (Lesson 2.1's
   illustrative snippets used dicts) and a real client's `create` takes
   more parameters. All four callbacks resolve to verified pages/anchors
   (the "not this one" pointer, whose target text the mockup gave only as
   "agents workflows and the loop lesson", links to that lesson's "what an
   agent's dynamism actually costs" subsection, where harder-to-test/debug
   is covered). 

   Concept 2 drafted: from round trip to loop — the minimal viable
   transformation (a real `while` loop calling the fake client, executing
   one hardcoded tool, and breaking on a text block), plus Applied sandbox
   exercise 1, graded for real against the fake client's scripted
   responses by six hidden tests (architecture.md §4.1; verified against
   real Pyodide with 12 submissions). The fake client's source moved to
   `src/lib/fakeClient.ts` so demos and exercises share it. **Deviation:**
   the loop's `tool_result` message and the exercise's task, hidden tests,
   and reference answer include `"tool_use_id": block.id`, which the mockup
   omitted (see Lesson 1.10 Concept 5). Callbacks resolve to verified
   pages.

   Concept 3 drafted: handling multiple tools — a dispatch mechanism (the
   `elif`-chain pain, then a `TOOL_REGISTRY` dict of name -> callable and
   the one-line `TOOL_REGISTRY[block.name]` dispatch), plus Applied sandbox
   exercise 2, graded for real against the fake client by seven hidden
   tests including an extensibility test that registers a third tool after
   the learner's code runs (architecture.md §4.1; verified against real
   Pyodide with 13 submissions). **Deviation:** `"tool_use_id": block.id`
   again added to the demo, task, and reference answer. Concept 2's "next
   concept fixes it" forward pointer now links here.

   Bookends: outcomes/why-it-matters intro (`00-intro.mdx`) and a Recap &
   Practice page (`04-recap-practice.mdx`) with a 7-question comprehensive
   quiz spanning all three concepts, plus a **graded multi-file
   comprehensive sandbox** (`tools.py` + `agent_loop.py`: in-memory
   agent-registry tools, `TOOL_REGISTRY`, and the dispatch loop, entry file
   `agent_loop.py`), graded by one hidden-test script (the multi-file
   harness gives a single pass/fail; architecture.md §4.1; verified against
   real Pyodide with 15 submissions). **Deviation:** `"tool_use_id":
   block.id` again added to the task and reference answer. The hint's two
   Concept 3 callbacks link to that concept's page (the dict-of-callables
   one to its "The fix" subsection); the Lesson 3 sandbox callback links to
   Lesson 2.3's Recap & Practice page. Lesson 2.3 Concept 4's plain-text
   "covered directly in the next lesson" pointer now links to this lesson's
   intro. **Open content gap:** that concept (and its quiz Q) promises the
   next lesson covers tracking `current_phase` in the loop, but this lesson
   never does — flagged for the mockup author. Lesson 2.4 is now fully
   Locked.

5. **ReAct and Reasoning in the Loop** — Locked
   Title confirmed by the bookends mockup. Folder `05-react-and-reasoning-in-the-loop`. Concept 1
   drafted: the ReAct pattern (an explicit `thinking` block ahead of each
   action; the fake client evolves to scripted *lists* of blocks, added as
   `REACT_FAKE_CLIENT` in `src/lib/fakeClient.ts` so Lesson 2.4 is
   untouched; the loop iterates every block and appends `response.content`
   whole; live demo matches the mockup's output exactly), plus Applied
   sandbox exercise 1, graded for real by seven hidden tests (architecture.md
   §4.1; verified against real Pyodide with 13 submissions). **Deviation:**
   `"tool_use_id": block.id` added throughout, as in Lesson 2.4.
   **Finding:** the mockup's inner-loop `break` is behaviorally a no-op with
   scripted responses, so it can't be graded. All four callbacks link to
   verified pages/anchors. Lesson 2.2 Concept 4's plain-text "the next
   lesson extends" pointer (which the mockup says points here, though
   Lesson 2.3 is actually next in order) now links to this concept. Lesson
   2.2's bookends also point a "tool descriptions" callback at this lesson;
   that stays plain text until a concept on tool descriptions exists.

   Concept 2 drafted: why reasoning before acting improves tool choice —
   prose only (no demo or exercise, per its mockup): applies Lesson 2's
   chain-of-thought scaffolding effect to tool selection, with a
   `search_database` vs. `search_web` example and an explicit statement
   that the scripted fake client can't prove the claim. All three callbacks
   link to the chain-of-thought concept's "The fix" subsection (verified in
   the built HTML); also linked "Concept 1's `thinking` block" back to
   Concept 1. Note the mockup describes Lesson 2's outputs as "real
   numbers", though that concept's outputs are labeled illustrative; the
   converted text keeps the mockup's wording. 
   Concept 3 drafted (the final concept section of the lesson, per its
   own mockup): the historical text-parsed ReAct format vs. native tool
   calling, and why native won. Live demo of a `Thought:/Action:` text
   parser breaking on `"Action :"` (run in real Pyodide; output matches the
   mockup exactly); no graded exercise, per its mockup. All four callbacks
   link to verified pages/anchors (three to Module 1's structured-output
   lesson, one back to Concept 1).

   Bookends: outcomes/why-it-matters intro (`00-intro.mdx`) and a Recap &
   Practice page (`04-recap-practice.mdx`) with a 6-question comprehensive
   quiz spanning all three concepts, plus a **graded multi-file
   comprehensive sandbox**: the learner upgrades `agent_loop.py` to the
   ReAct loop while Lesson 2.4's finished `tools.py` is provided read-only
   (graded by one hidden-test script; architecture.md §4.1; verified against
   real Pyodide with 13 submissions). **Deviation:** `"tool_use_id":
   block.id` again added to the task and reference answer. The task's
   "Lesson 4's comprehensive sandbox" callback links to that lesson's Recap
   & Practice page, the hint's "Concept 1's exercise answer" to Concept 1's
   page (its exercise has no anchor), and the explanation's Lesson 3
   check-before-create callback to Lesson 2.3's Recap & Practice page
   (where that prompt is actually written, rather than the lesson intro).
   Lesson 2.2's bookends still have a plain-text "tool descriptions"
   callback pointing at this lesson, which stays plain: no concept here
   teaches tool descriptions. Lesson 2.5 is now fully Locked.

6. **Termination, Failure, and Control** — Locked
   Title confirmed by the bookends mockup (renamed from the working name
   "Termination and Control"; folder renamed from
   `06-termination-and-control` to `06-termination-failure-and-control`,
   links updated). Concept 1 drafted: the pain, a
   loop that never stops (nothing in the loop asks "have I done enough?";
   live demo of a model stuck re-requesting the same call, ending only when
   the finite 20-response script runs out with an `IndexError`, using
   `REACT_FAKE_CLIENT`; why it's a real, billed cost). Demo run in real
   Pyodide: no output, 20 calls, 41 messages, then the `IndexError` (the
   mockup's traceback is illustrative; the live one shows `<exec>` frames).
   **Deviation:** `"tool_use_id": block.id` added to the demo's tool result,
   as in Lessons 2.4-2.5. Both callbacks link to verified anchors (Lesson
   2.4 Concept 2's loop; Module 1's token-pricing mechanics). No exercise in
   this concept, per its mockup. 
   Concept 2 drafted: max steps — the first, simplest fix (a `for` loop
   over `range(1, max_steps + 1)` that stops cleanly with a message; the
   honest limitation that a count can't tell productive work from a stuck
   loop). Live demo run in real Pyodide against Concept 1's 20-response
   repeated-call script: prints the mockup's stop message after exactly 10
   calls. **Deviation:** `"tool_use_id": block.id` added, as before. The
   Concept 1, Module 0 `range()`, and "from Concept 1" callbacks link to
   verified anchors; the "covered next (repeated action detection)"
   pointer is a forward reference to Concept 3, not yet written, so it's
   plain text. 
   Concept 3 drafted: repeated-action detection (the `seen_calls` list of
   `(name, input)` tuples; stops on the second identical call; why
   `max_steps` stays as a backstop) plus Applied sandbox exercise 1, graded
   for real against the fake client by eight hidden tests (architecture.md
   §4.1; verified against real Pyodide with 12 submissions). Demo output
   matches the mockup (stops after 2 calls). **Deviations:** `"tool_use_id":
   block.id` added; the task now says the cap returns a message rather than
   raising (unspecified in the mockup); six tests added to the mockup's two.
   The "max steps" callback and Concept 2's forward pointer link to verified
   anchors/pages; the "dicts already support equality" callback links to the
   dicts concept page (no anchor: that page doesn't discuss equality
   explicitly, so it's a page-level link, worth a look from the mockup
   author). 
   Concept 4 drafted: goal-state termination checks (a deterministic,
   code-evaluated check on real state after each tool call, so the loop
   stops the moment the goal is met; scoped explicitly away from
   model-judged self-critique). Live demo is **multi-file** (read-only
   `fake_llm_client.py` tab, `tools.py`, `main.py`) because the mockup's loop
   reads `tools._registry`; run in real Pyodide, output matches the mockup
   exactly (goal reached, "stopped after 1 calls"). No exercise, per its
   mockup. **Deviation:** `"tool_use_id": block.id` added. The two guard
   callbacks link to Concept 2 and 3 subsection anchors; the "later in this
   module, reflection and self critique lesson" pointer isn't built yet, so
   it's plain text. 
   Concept 5 drafted: tool errors as observations, not exceptions (an
   unhandled tool exception crashes the whole loop; `try`/`except` turns it
   into an ordinary `tool_result` the model reads). Two **multi-file** live
   demos (shared `tools.py` whose `create_agent_entry` raises on a duplicate;
   the second adds the read-only fake client tab), run in real Pyodide:
   the first ends in the `ValueError` traceback, the second prints the
   mockup's final answer. No exercise, per its mockup. **Findings:** the
   mockup's error-handling demo never actually triggered the error (the
   registry started empty, so `create_agent_entry` succeeded and the scripted
   "already exists" text was unearned); the demo now registers
   `research_agent` up front so the error really happens. **Deviation:**
   `"tool_use_id": block.id` added. The Module 0 error-handling callback links
   to that page's "The basic shape" subsection. 
   Concept 6 drafted (the final concept section of the lesson, per its
   own mockup): timeouts (conceptual only), retry with exponential backoff
   for transient failures, and graceful give-up, plus Applied sandbox
   exercise 2, graded for real by seven hidden tests (architecture.md §4.1;
   verified against real Pyodide with 13 submissions). Two live demos
   (success on attempt 3; persistent failure, using `setupCode` for the
   shared definitions) match the mockup's output exactly. **Deviations:**
   the task now specifies the printed wait form (`waiting 1s`) so it can be
   checked; the tests neutralize `sleep`. The Concept 5 callbacks and the
   Module 1 backoff callback link to verified anchors. **Finding:** the
   demo's output says "waiting 8s before retrying" after the final failure
   though no retry follows (kept, as it matches the code).

   Bookends: outcomes/why-it-matters intro (`00-intro.mdx`, six outcomes)
   and a Recap & Practice page (`07-recap-practice.mdx`) with a 9-question
   comprehensive quiz spanning all six concepts, plus a **graded multi-file
   comprehensive sandbox** (`execute_tool_safely` + the fully hardened
   `run_agent_loop` in `agent_loop.py`, with `tools.py` provided read-only;
   architecture.md §4.1; verified against real Pyodide with 13 submissions).
   **Finding (real bug in the mockup):** the provided `tools.py` is described
   as Lesson 4's, unchanged, but Lesson 4's `create_agent_entry` never raises,
   so scenario 3's "definitive tool error" never occurred; `tools.py` now
   includes Concept 5's duplicate check and scenario 3 asserts the model saw
   the error. **Deviation:** `"tool_use_id": block.id` added. Callbacks link
   to verified anchors (Lesson 4's intro for "Lesson 4's loop", its Recap &
   Practice page for `tools.py`, and Concepts 3-6 subsections in the hint).
   Lesson 2.6 is now fully Locked.

7. **Agent State and the Scratchpad** — Locked
   Title confirmed by the bookends mockup (my working name was right; folder
   `07-agent-state-and-the-scratchpad`). Concept 1 drafted: what the loop accumulates — the
   scratchpad (the `messages` list, named as the agent's entire state,
   grounded in Module 1's statelessness; a live demo of it growing from 1 to
   3 entries using `REACT_FAKE_CLIENT`; scoped explicitly away from a fuller
   memory system). Demo run in real Pyodide, output matches the mockup
   exactly. No exercise, per its mockup. **Deviation:** `"tool_use_id":
   action_block.id` added to the tool result. The Lesson 4 and Module 1
   statelessness callbacks link to verified anchors; the "context and memory
   module" pointer isn't built, so it's plain text. 
   Concept 2 drafted: serializing state — from Python objects to JSON (the
   `TypeError` from `json.dumps` on block objects; a `to_dict()` per block
   class plus a `serialize_messages` helper using `hasattr`), plus Applied
   sandbox exercise 1, graded for real by six hidden tests (architecture.md
   §4.1; verified against real Pyodide with 10 submissions). Two live demos
   (the crash; the fix, self-contained). **Deviations:** `ToolUseBlock` gets an
   `.id` that `to_dict()` includes (so a saved scratchpad keeps
   `tool_use_id` pairings; the demo output therefore shows an `id` field);
   each demo builds its own `messages`; the task says not to mutate the
   original list. The mockup's "same attribute-checking pattern from earlier
   in this course" has no Module 0 target (no `hasattr` coverage exists), so
   it's plain prose; the Module 0 JSON callbacks link to verified anchors, and
   "checkpoint and resume, covered next" is a forward pointer to Concept 3
   (plain text until it exists). 
   Concept 3 drafted (the final concept section of the lesson, per its
   own mockup): checkpoint and resume (`save_checkpoint`/`load_checkpoint`
   using Concept 2's serialization; loading needs no object reconstruction; a
   two-"session" demo that resumes without redoing the tool call), plus
   Applied sandbox exercise 2, graded for real against a save-then-load cycle
   by six hidden tests (architecture.md §4.1; verified against real Pyodide
   with 10 submissions). Demo output matches the mockup exactly. **Deviations:**
   the `tool_use` dict includes `id` and the demo/tests carry `tool_use_id`, as
   in Concept 2 and Lessons 2.4-2.6; the exercise's tests clean up their own
   files. Callbacks link to verified anchors (Module 1 pricing mechanics,
   Module 0 `with open`, Concept 2's fix subsection).

   Bookends: outcomes/why-it-matters intro (`00-intro.mdx`) and a Recap &
   Practice page (`04-recap-practice.mdx`) with a 7-question comprehensive
   quiz spanning all three concepts, plus a **graded multi-file
   comprehensive sandbox**: the learner writes `run_partial_session` and
   `resume_and_finish` in `checkpoint_demo.py`, with `tools.py` (Lesson 4's,
   unchanged) and `checkpoint.py` (this lesson's serialize/save/load) provided
   read-only; graded by one hidden-test script that runs a real
   save-then-resume cycle through a file (architecture.md §4.1; verified
   against real Pyodide with 11 submissions). **Deviations:** `"tool_use_id":
   block.id` added; the mockup's "context provided" functions live in a
   read-only `checkpoint.py` so the tests can import them. The hint's
   "familiar dispatch pattern" callback links to Lesson 4 Concept 3's "The
   fix" subsection; the task links Lesson 4's Recap & Practice page for
   `tools.py`. Lesson 2.7 is now fully Locked.

8. **Planning and Decomposition** — Locked
   Title confirmed by the bookends mockup (renamed from the working name
   "Planning"; folder `08-planning` renamed to `08-planning-and-decomposition`,
   links updated). Concept 1
   drafted: goal decomposition (every loop so far is reactive; decomposing a
   goal into sub-tasks *before* any execution; a `PlanBlock` and a live demo
   printing a two-sub-task plan, using `REACT_FAKE_CLIENT`). Demo run in real
   Pyodide, output matches the mockup exactly. No exercise, per its mockup.
   The "every loop since Lesson 4" callback links to Lesson 4's intro (the
   mockup points at the lesson, not a concept), the constrained-decoding
   callback to Module 1's "A hard guarantee" subsection. **Finding:** the
   mockup's "`enumerate`, from Module 0, the data structures lesson" callback
   has no target (Module 0 never covers `enumerate`), so the prose now just
   says what it is. 
   Concept 2 drafted: plan representations — linear, tree, and dependency
   graph (a static tree example; a live `compute_execution_order` demo that
   finds tasks whose prerequisites are done, matching the mockup's output), plus
   Applied sandbox exercise 1, graded for real by six constraint-based hidden
   tests (architecture.md §4.1; verified against real Pyodide with 11
   submissions). The mockup's single test passes a bare `list(graph)`, so
   tests were added (out-of-order graph, independent tasks, chain, non-mutation,
   cycles); the task now states the cycle `ValueError` and non-mutation.
   **Finding:** the mockup's async callback points at "Module 1, the training
   pipeline lesson", which has nothing on concurrency; it's Module 0's async
   lesson, so the prose and link were corrected. The Concept 1 callback links to
   its "Decomposing" subsection. 
   Concept 3 drafted: Tree of Thought as a plan-search variant (several
   candidate next steps at a decision point, scored, the best kept and the rest
   abandoned; the contrast with chain-of-thought; the real cost tradeoff and when
   it's worth it), with a scope note (the scripted client can show ToT's
   structure but not the quality of a model's evaluation) and a live demo using
   `REACT_FAKE_CLIENT` and a `CandidateBlock` (run in real Pyodide; output
   matches the mockup exactly). No exercise, per its mockup. Callbacks link to
   verified anchors (Concept 2's tree subsection, Lesson 2's CoT "The fix",
   Module 1 pricing and test-time compute). **Finding:** the `key=`-selection
   callback names "Module 0, the data structures lesson", but that pattern is
   actually taught in Module 0's functions lesson (lambda/map/filter, "Closing
   the loop: sorted(..., key=...)"), so it links there. 
   Concept 4 drafted: plan-and-execute vs. purely reactive (naming the
   reactive choice every loop in Lessons 4-7 made; a live demo of
   plan-and-execute whose step count is known before any execution, with
   `PlanBlock` repeated in the demo so it runs alone, using `REACT_FAKE_CLIENT`;
   the foresight-vs-adaptiveness tradeoff). Demo run in real Pyodide, output
   matches the mockup exactly. No exercise, per its mockup. Callbacks link to
   verified pages/anchors: "Lessons 4-7" and "Lesson 6" point at those lessons'
   intros (the mockup names lessons, not concepts), and Lesson 1's honest case
   links to "What an agent's dynamism actually costs". 
   Concept 5 drafted (the final concept section of the lesson, per its
   own mockup): replanning when a step fails (a plan's remaining steps can be
   invalidated by one failure; the fix is calling the planner again with the
   failure reason), with a live demo (matches the mockup's output exactly) plus
   Applied sandbox exercise 2, graded for real against scripted planner and
   executor clients by six hidden tests (architecture.md §4.1; verified against
   real Pyodide with 11 submissions). The task now states the block/message
   contract the mockup implied. Both Lesson 6 callbacks link to the
   tool-errors concept's subsections. 
   Bookends: outcomes/why-it-matters intro (`00-intro.mdx`, five outcomes) and
   a Recap & Practice page (`06-recap-practice.mdx`) with an 8-question
   comprehensive quiz spanning all five concepts, plus a **graded multi-file
   comprehensive sandbox** (`run_plan_execute_replan` in `plan_execute.py`,
   with `tools.py` provided read-only): the full plan/execute/replan cycle with
   real tool dispatch, graded by one hidden-test script (architecture.md §4.1;
   verified against real Pyodide with 10 submissions). The hint's callbacks link
   to Concept 5's "The fix" subsection and Lesson 4 Concept 3's "The fix"
   subsection; the task links Lesson 4's Recap & Practice for `tools.py`. Lesson
   2.8 is now fully Locked.

9. **Reflection and Self-Critique** — Locked
   Title is a working name (folder `09-reflection-and-self-critique`) taken from
   Lesson 6 Concept 4's callback text ("reflection and self critique lesson").
   Concept 1 drafted: the
   evaluator-optimizer pattern implemented (a model-judged check where Lesson 6's
   goal-state check couldn't be deterministic; generate, evaluate, feed the
   critique into a revised prompt, repeat, with `max_attempts` as a backstop),
   with a live demo (matches the mockup's output exactly) plus Applied sandbox
   exercise 1, graded for real against scripted generation and evaluation
   clients by six hidden tests (architecture.md §4.1; verified against real
   Pyodide with 12 submissions). The mockup's two tests would pass a loop that
   never feeds the critique back, so tests were added and the task now states the
   contract. Callbacks link to verified anchors (Lesson 6 goal-state check and max
   steps, Lesson 2 CoT). Lesson 6 Concept 4's plain-text "covered properly later
   in this module" pointer now links here. 
   Concept 2 drafted: when a second pass genuinely helps (generating vs.
   checking as different tasks; omissions, format violations and internal
   inconsistency as concrete shapes), with an explicit epistemic-care note that
   the scripted client can't prove the asymmetry. Prose only, no demo or
   exercise, per its mockup. Both callbacks link to verified anchors (Lesson 8's
   Tree of Thought subsection, Concept 1's pattern subsection).
   Concept 3 drafted: the limits, shared blind spots (the evaluator is the same
   model with the same knowledge, so a genuine understanding gap survives both
   generation and evaluation), with a live demo (the Einstein/Nobel Prize
   example, reusing Concept 1's exact fake-client pattern) showing a factually
   wrong candidate pass evaluation uncaught. No graded exercise, per its
   mockup — no new grading logic, so no separate Pyodide verification needed
   beyond Concept 1's already-verified harness. Callbacks link to verified
   anchors (Concepts 1 and 2 here, Module 1's hallucination concept's Einstein
   subsection); the RAG Systems module callback stays plain text (module not
   built).
   Bookends drafted: intro (outcomes + why-it-matters, linking Lesson 6's
   goal-state check concept), comprehensive quiz (6 questions spanning all
   three concepts, mixed order), and a comprehensive sandbox reusing Concept
   1's exact `run_evaluator_optimizer` on a new registry-app scenario, graded
   by two hidden tests (the mockup's revise-and-pass scenario, plus an added
   never-passes test enforcing the task's stated `max_attempts` backstop
   contract — same reasoning as Concept 1's added tests). No new grading
   logic, so no separate Pyodide verification beyond Concept 1's
   already-verified harness. The correct-answer explanation links Concept 3's
   limit. Lesson 9 is now fully Locked.

10. **Workflow Patterns Beyond a Single Loop** — Locked
    Title confirmed by the bookends mockup (folder renamed from the working
    name `10-workflow-patterns` to `10-workflow-patterns-beyond-a-single-loop`).
    Concept 1 drafted: prompt
    chaining and routing (chaining as a name for the already-built
    fixed-sequence pattern; routing as a classification step dispatching to
    a fixed set of downstream paths via a dict, contrasted with an agent's
    open-ended tool choice). Live demo (plain Python, no fake client needed
    — no LLM call in the demo itself) matches the mockup's output exactly;
    no new grading logic, so no Pyodide harness verification needed. The
    mockup's own callback text said "Lesson 2's `run_workflow`," but
    `run_workflow` (`summarize` before `translate`) actually lives in
    Lesson 1 Concept 2, not Lesson 2 — linked to the actual matching
    content (Lesson 1's anchor) rather than the mislabeled lesson number,
    since the described code unambiguously exists only there. Other two
    callbacks link to verified anchors (Lesson 4's `TOOL_REGISTRY` dispatch
    fix, Lesson 1 Concept 2's agent-decides-the-sequence subsection). No
    graded exercise, per its mockup.
    Concept 2 drafted: parallelization (the concurrency payoff Lesson 8's
    dependency graph pointed at, actually implemented via
    `asyncio.gather`, applied to the two genuinely independent sub-tasks
    from that lesson's own example). **Finding:** the mockup's shown code
    didn't actually print the mockup's own first output line
    ("calling both concurrently...") — no matching `print` call existed in
    the source — so a `print("calling both concurrently...")` was added
    before the `gather` call so the live demo's real output matches what
    the mockup claims to show. No new grading logic, so no separate
    Pyodide verification needed. The mockup's callback again said "Module
    1, the training pipeline lesson" for the async coverage, but
    `asyncio.gather` and its timing proof actually live in Module 0's
    async-python lesson — linked there instead, same reasoning as
    Concept 1's `run_workflow` mislabeling. No graded exercise, per its
    mockup.
    Concept 3 drafted: orchestrator-workers (decomposing a task into several
    sub-tasks — the same shape as Lesson 8's `PlanBlock` — dispatching all
    of them to workers via `asyncio.gather`, and aggregating into one
    output; genuinely different from a smaller agent loop, not a shrunk
    version of one, since no worker ever decides anything dynamically),
    with a live demo plus Applied sandbox exercise 1, graded by two hidden
    tests (architecture.md §4.1). The mockup's own single correctness test
    can't distinguish real concurrent dispatch from a sequential loop
    producing the identical joined string, so a second, added test times
    three workers and asserts the total stays well under the sequential
    sum — verified against real Pyodide with 2 submissions (the reference,
    and a sequential rewrite that fails only the added timing test, exactly
    as intended). Callbacks link to verified anchors (Lesson 8's `PlanBlock`
    subsection, Lesson 4's intro, this lesson's Concept 2).
    Bookends drafted: intro (outcomes + why-it-matters, linking Lesson 4's
    intro and Lesson 1's honest-case-for-not-using-an-agent concept), and a
    5-question comprehensive quiz spanning all three concepts. **Content
    conflict, resolved with the user:** the mockup's closing section was an
    ungraded "match the pattern to the problem" synthesis, but
    lesson-structure.md reserves that slot for lessons with no
    learner-authored code anywhere in them — this lesson already has
    Concept 3's graded exercise, so per that section's own rule a real
    graded comprehensive sandbox was owed instead. Asked the user, who
    confirmed building the graded version. `run_ticket_pipeline` composes
    all three code-bearing patterns from the lesson: chaining
    (`normalize_request` then routing, per ticket), routing (`ROUTES[...]`,
    a real dict dispatch, confirmed by a hidden test adding a new `"sales"`
    category at runtime), and orchestrator-workers (`asyncio.gather` across
    all tickets, timed the same way as Concept 3's test to reject a
    sequential rewrite). Verified against real Pyodide with 3 submissions
    (architecture.md §4.1). Lesson 10 is now fully Locked.

11. **From Hand-Rolled to a Runtime** — Locked
    Title confirmed by the bookends mockup (folder renamed from the working
    name `11-agent-frameworks` to `11-from-hand-rolled-to-a-runtime`).
    Concept 1 drafted: what a
    framework actually provides (four pieces — the loop and state handling,
    already built by hand in Lessons 4 and 7 respectively, plus tracing
    hooks and a deployment path as genuinely new; none of it is new
    capability, just packaging). Prose only, no demo or exercise, per its
    mockup. Callbacks link to verified anchors (Lesson 4 Concept 2's actual
    loop subsection; Lesson 7's intro, covering both the scratchpad and
    serialization concepts it names together).
    Concept 2 drafted: rebuilding the Lesson 4–6 agent in LangChain (`@tool`
    mapped to Lesson 4's `TOOL_REGISTRY`, with the docstring load-bearing
    the same way a Pydantic model's fields became a schema in Module 1;
    `"{agent_scratchpad}"` confirming Lesson 7's own term is standard,
    real-framework terminology; `create_tool_calling_agent` as the
    dispatch/reasoning logic; `AgentExecutor` as Lesson 4's `while` loop,
    with `max_iterations` as the exact same guard as Lesson 6's
    `max_steps`). Explicitly illustrative per its mockup (genuine LangChain
    API shape, not executed — no package/network access in this sandbox),
    a static code block, not a `LiveDemo`; no graded exercise. Callbacks
    link to verified anchors (Lesson 4's `TOOL_REGISTRY` fix, Module 1's
    Pydantic-to-schema concept, Lesson 7's scratchpad concept page, Lesson
    4's intro for the "Lessons 4–5" reference, Lesson 4 Concept 2's loop
    subsection, Lesson 6's max-steps guard subsection).
    Concept 3 drafted (final concept of Lesson 11 and Module 2): what
    control was given up (termination logic, state serialization, and
    dispatch-on-failure all still happen under a framework, just no longer
    as code you wrote and can read directly; framed as an honest trade,
    not a criticism, since having built the loop by hand is what makes
    adopting a framework an informed choice rather than a leap of faith).
    Prose only, no demo or exercise, per its mockup. Callbacks link to
    verified anchors/pages (this lesson's Concept 2; Lesson 6's max-steps
    guard subsection; Lesson 7's serializing-state concept page; Lesson 6's
    comprehensive sandbox page, the only place `execute_tool_safely`
    actually exists, matching the mockup's own general, no-concept-named
    callback; Lesson 8's plan-and-execute-vs-reactive concept page).
    Bookends drafted: intro (outcomes + why-it-matters, linking Lesson 1's
    intro), a 5-question comprehensive quiz spanning all three concepts,
    and an ungraded reflective closing synthesis naming the module's full
    arc (Lessons 1, 4, 6, 7, 8, 9's intros) — the correct slot here per
    lesson-structure.md, since unlike Lesson 10 this lesson genuinely has
    no learner-authored code anywhere in it, matching the mockup exactly
    with no conflict to resolve. Lesson 11 is now fully Locked — **Module
    2 (The Agent Loop) is now fully built, all 11 lessons Locked.**

*Audit pass (2026-09-23), Lessons 9–11: every reference solution now
passes its own hidden tests in Pyodide. Three Lesson 10 references were
missing given code, and two Lesson 10 test sets compared against a literal
backslash-n (architecture.md §4.1). "Concept N" wording was removed from
Lesson 9. Lesson 11's framework-provides page gained a tracing-hook demo
and 2 quiz questions; its control-given-up page gained a max_steps vs
recursion_limit side-by-side demo and 1 quiz question.*

**Old outline (superseded):**

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

## Module 3 — Tool Design for Agents

*Working title — the first Module 3 mockup arrived with tool-design
content (names/descriptions/parameters as prompts the model reasons
over), not the "Agent Frontends" rough outline previously logged here;
same situation as Module 2's earlier rename, kept as-is until a bookends
mockup confirms the real module title. The original "Agent Frontends"
scope (Streamlit/Gradio UIs, a production frontend, auth) is not yet
re-homed to a specific module — flagged for the mockup author.*

*Enrichment pass (2026-09-23): Lessons 1–3 were brought up to the course's
normal depth. Each Lesson 1–2 concept page now has live demos, 4–5 quiz
questions and a graded exercise (Lesson 2's validation concept has two:
the original, plus a loop exercise). Both recaps have 8-question quizzes
and a comprehensive sandbox. Lesson 3's first concept gained the
compounding-cost demo and a 4-question quiz. The rest of Lesson 3 already
matched its mockups. `Literal`, `str | None`, `model_validator` and
`ValidationError.errors()` are taught in place where first used. The entries
below describe each lesson as first converted; see the git log
(`Enrich Module 3 Lesson N`) for the full change list.*

1. **Designing Tools a Model Can Use Well** — Locked
   Title confirmed by the bookends mockup (folder renamed from the working
   name `01-writing-tools-models-can-use` to
   `01-designing-tools-a-model-can-use-well`, all three concepts' `lesson`
   frontmatter updated to match). Concept 1 drafted: names and descriptions as
   prompts — a tool's name/description is literally what the model reasons
   over when choosing and calling a tool, the same specificity/vagueness
   stakes as Module 2's prompting-fundamentals lesson and system-prompt
   always/never constraints, just applied at the individual-tool level.
   Static illustrative code (function stubs with `...` bodies — nothing to
   actually run), no live demo or graded exercise, per its own mockup. Both
   Module-1 and Module-2 callbacks resolved to verified anchors (Module 1's
   tool-calling concept's "The model doesn't call anything" subsection;
   Module 2's specificity concept's "The pain" subsection; Module 2's
   role/persona concept's "Role, and explicit behavioral constraints"
   subsection). Concept 2 drafted: parameter design — a valid Pydantic
   schema guarantees argument *shape* (via Module 1's constrained
   decoding), not that the parameters themselves are well-designed;
   contrasts a vague `BadArgs` (`d: str`, `flag: str`) against a clear
   `GoodArgs` (`date: str` with a format comment, a real `include_archived:
   bool`). Static illustrative code (class definitions only, nothing to
   run), no live demo or graded exercise, per its own mockup. Both
   callbacks resolved to verified anchors (Module 1's constrained-decoding
   concept's "A hard guarantee, not a soft nudge" subsection; its
   from-Pydantic-to-schema concept's "Generating the schema directly from a
   model you already know" subsection, where `AgentConfig` is shown).
   Concept 3 drafted (the final concept of this lesson, per its own
   mockup): granularity — narrow vs. broad tools (`get_user_profile` as
   narrow, little room to call incorrectly, vs. `run_sql` as broad, more
   flexible but asking the model to correctly construct something more
   complex on every call), scoped explicitly to the usability question
   only — the security dimension of a broad tool's misuse potential is
   named as covered "properly in Lesson 11" of this module, but no such
   lesson exists yet, so it's left as plain text ("a later lesson on
   designing for least privilege") rather than a link. Static illustrative
   code, no live demo or graded exercise, per its own mockup.

   Bookends: outcomes/why-it-matters intro (`00-intro.mdx`, linking Module
   2's writing-the-loop-by-hand lesson intro, where `TOOL_REGISTRY`
   dispatch against scripted responses was built) and a Recap & Practice
   page (`04-recap-practice.mdx`) with a 5-question comprehensive quiz
   spanning all three concepts, plus a **graded comprehensive sandbox** —
   the lesson's first real learner-authored code: redesign a poorly-named
   agent-registry tool (`def q(s: str) -> str`) into a well-designed,
   narrow `get_agent_config` tool, graded by four hidden tests checking a
   renamed function, a docstring naming both the parameter and what's
   returned, a real `str` type hint (not the original's ambiguous
   catch-all), and a granularity-justifying comment. The last check needed
   a small shared-harness addition (`__source__`, exposing the learner's
   raw source text to hidden tests, since exec'd code has no comments left
   to inspect) — see architecture.md §4.1; verified against real Pyodide
   with 6 submissions (the correct answer, the unmodified starter, and one
   violation per hidden-test requirement, each failing only its own check).
   The task's "agent registry app" callback links to Module 0's FastAPI
   comprehensive-registry-app exercise; the hint's three callbacks link to
   this lesson's own three concept pages. Lesson 3.1 is now fully Locked —
   Module 3 (Tool Design for Agents) has one lesson built so far.

2. **Tool Schemas and Argument Validation** — Locked
   Title confirmed by the bookends mockup (folder renamed from the working
   name `02-schemas-and-their-limits` to
   `02-tool-schemas-and-argument-validation`, all files' `lesson`
   frontmatter updated to match). Concept 1 drafted: the schema, generated — the payoff
   completed (`.model_json_schema()` on a Pydantic `BaseModel`, unchanged
   from Module 1, is the standard every tool in this module uses; explicitly
   ties Lesson 1's parameter-design discipline and this schema mechanism
   together as two halves of one job). Live demo (`GetAgentConfigArgs`)
   verified exactly against real Pyodide/Pydantic 2.7 — no mockup error.
   Both callbacks resolved to verified anchors (Module 1's from-Pydantic-
   to-schema concept's `AgentConfig` subsection; Lesson 1's parameter-design
   concept page). Concept 2 drafted: the gap constrained decoding doesn't
   close — a schema-valid call (`ScheduleMaintenanceArgs` with a
   correctly-typed but years-in-the-past `date`) still succeeds, since the
   schema has no concept of "in the past" or of an `agent_name` actually
   existing in the real registry; both are real-world facts the schema
   structurally can't check. Live demo verified exactly against real
   Pyodide/Pydantic 2.7 — no mockup error. Its one callback resolved to the
   same constrained-decoding "hard guarantee" anchor used in Concept 2 of
   Lesson 1. Concept 3 drafted (the final concept of this lesson, per its
   own mockup): validate, and return failures as observations — a
   `field_validator` closes the date-validity gap, an explicit registry
   membership check closes the existence gap, and both failures return a
   plain `"Error: ..."` string rather than raising, the same
   failure-as-observation pattern from Module 2's termination lesson. Live
   demo verified exactly against real Pyodide/Pydantic 2.7, with one
   real-Pydantic addition beyond the mockup's own hand-written expected
   output: a real validation error also appends a `[type=value_error, ...]`
   detail and a trailing docs-link line (the same 2.7-vs-hand-written gap
   noted for Lesson 1.10 Concept 1 and Module 0's error-paths concept),
   called out in a short caveat rather than left to surprise a learner.
   Plus Applied sandbox exercise 1: implement `schedule_maintenance`
   against a provided `registry`, graded by the mockup's own three hidden
   tests, verified unchanged against real Pyodide — the correct answer
   passes all three, the unmodified starter fails all three, and a
   submission that skips the registry-existence check and lets the
   validator's exception propagate fails two of three, exactly as
   intended. **Finding:** the mockup's "Pydantic's semantic-check mechanism
   from Module 0" callback claims Module 0's Pydantic lesson already taught
   `field_validator`, but that lesson only covers `BaseModel` and
   type-level validation — `field_validator` is genuinely new here, so the
   prose was reworded to credit Module 0 for the `BaseModel` groundwork
   without overclaiming it taught this specific mechanism. Its link still
   points to Module 0's Pydantic-fundamentals page.

   Bookends: outcomes/why-it-matters intro (`00-intro.mdx`, linking Module
   2's tool-errors-as-observations concept) and a Recap & Practice page
   (`04-recap-practice.mdx`) with a 5-question comprehensive quiz spanning
   all three concepts, plus a **graded comprehensive sandbox**: a second
   tool with its own semantic gap — `update_agent_model`, validating a
   model name against an allowed set (a Pydantic validator) and registry
   existence, mutating the registry and returning a success message.
   **Finding:** the mockup's own three hidden test cases each define a
   fresh `registry` before their one assertion, so none of them can
   actually observe whether a prior call mutated it — a submission that
   returns the right success string without writing
   `registry[agent_name]["model"] = ...` passes all three unnoticed;
   added a fourth test that calls the function once and then asserts the
   registry was actually updated. Verified against real Pyodide/Pydantic
   2.7 with 3 submissions (the correct answer, the unmodified starter, and
   the non-mutating submission the added test exists to catch) — the
   correct answer passes all four, the starter fails all four, and the
   non-mutating submission passes exactly the three original tests and
   fails only the new one, as intended. Lesson 3.2 is now fully Locked —
   Module 3 (Tool Design for Agents) has two lessons built so far.

3. **Shaping What Tools Return** — Locked
   Title confirmed by the bookends mockup (folder renamed from the working
   name `03-designing-tool-results` to `03-shaping-what-tools-return`, all
   concepts' `lesson` frontmatter and intra-lesson links updated to match).
   Concept 1 drafted: why a huge tool result hurts (a
   tool's result is ordinary input content — the same token accounting,
   context-window budget, and per-token cost as anything else sent to the
   model; a `list_all_agents` demo over 5,000 registry entries makes the
   cost concrete). **Finding:** the mockup's hand-computed demo output
   (`210000 characters, roughly 52500 tokens`) doesn't match reality; the
   real output (verified against real Pyodide) is `193889 characters,
   roughly 48472 tokens` — the live demo shows the real number, but the
   mockup's own prose claim ("over 50,000 tokens") was corrected to "nearly
   50,000 tokens" to match. All three callbacks resolved to verified
   anchors (Module 1's response-shape concept's `usage` subsection, its
   context-window concept's token-budget subsection, its token-pricing
   concept's basic-mechanics subsection). Concept 2 drafted: truncation
   and pagination (cap the result *and say so* — an explicit "showing 3
   of 5000" marker so the model can't mistake a slice for the whole; then
   an `offset`/`limit` pair so it can fetch more pages only when needed),
   with a graded `list_all_agents_paginated` exercise. Its demo outputs
   match the mockup exactly; the hidden tests were checked to fail both
   an always-append and a never-append continuation message. Concept 3
   drafted: structured results and useful error messages (return JSON text
   via `json.dumps` instead of blending fields into prose, since a
   `tool_result` is text; prose is fine only for results the model just
   relays; an error should say what failed, list real options (capped),
   and point at the likely cause, not just "Error: failed"), with a graded
   `get_agent_status` exercise. Hidden tests checked to fail dumping the
   whole config, prose success output, an uncapped name list, and a bare
   "Error: failed". A later mockup revision added a short live demo of
   `**` inside a dict literal (Module 0 only taught `**` at call sites),
   with a JavaScript object-spread comparison.
   Bookends: intro (5 outcomes; why-it-matters frames this as the output
   side of Lessons 1–2) and Recap & Practice (an 8-question comprehensive
   quiz, plus a comprehensive sandbox, `search_agents_by_model`, combining
   a bounded page, `total`/`next_offset` pagination metadata as JSON, and
   an error listing the distinct models in use). Sandbox tests checked to
   fail an always-set `next_offset`, a page-sized `total`, a bare error,
   and JSON returned instead of an error on zero matches. **Deviation:**
   the mockup points to "Module 4's job (→ this course, the context and
   memory module)", but Module 4 here is Evaluation & Observability and no
   context/memory module exists yet — rendered as plain text ("the later
   context and memory module") with no module number, same as Lesson 2.7's
   unbuilt context/memory pointer. Lesson 3.3 is now fully Locked.

4. **Tools That Call the Outside World** — Locked
   The bookends mockup confirmed the title. The folder was renamed from
   the working name `04-timeouts-retries-and-concurrency` to
   `04-tools-that-call-the-outside-world`, and every `lesson` frontmatter
   field and intra-lesson link was updated to match.
   The mockup's concepts point to retries (Concept 2) and concurrent tool
   calls (the last concept). Concept 1 is drafted: timeouts. A tool that
   never returns can't be stopped by any of Module 2's between-step
   guards. `asyncio.wait_for` inside a `call_with_timeout` wrapper returns
   an `"Error: <tool> did not respond within N seconds"` observation, and
   the lesson wires it into the async version of the collect-every-call
   loop (`REACT_FAKE_CLIENT`). It notes that a timed-out write has an
   unknown outcome, gives per-tool rules for choosing a value, and adds
   an illustrative httpx example. httpx timeouts apply to each stage, not
   the whole call. Three live demos match the mockup exactly. There are
   5 quiz questions and a graded `call_with_timeout` exercise. Its timing
   test now also checks the result, so the empty starter can't pass it
   (see architecture.md §4.1). Callbacks link to Module 2's termination
   lesson intro, its tool-errors fix, its minimal-agent-class `__name__`
   registry, and the ReAct collect-every-call fix. **Deviation:** the
   mockup's "Module 0's FastAPI lessons" httpx callback points to
   Lesson 0.10's parametrized-tests subsection instead. That is where
   `httpx.AsyncClient` is introduced to the learner; Lesson 0.9 only uses
   httpx inside hidden grading scripts. Forward references to Concept 2
   and the concurrency concept are plain text until those pages exist.
   Concept 2 is drafted: which failures to retry, and how. Status codes
   sort into retryable (408, 429, 5xx) and non-retryable (other 4xx, which
   go back to the model as an observation). `call_with_retries` honors
   `Retry-After`, otherwise uses exponential backoff with jitter, and
   doesn't wait after the last attempt. The page notes that LLM SDKs
   already retry model calls but not your tools. It shows that retrying a
   write can repeat it, with idempotency keys (`uuid.uuid4()`, created
   once per action) or check-before-retry as the fix. There are 3 live
   demos, 5 quiz questions and a graded `call_with_retries` exercise with
   6 hidden tests. **Fix:** the hidden tests now import `time` themselves
   (see architecture.md §4.1). Callbacks link to Module 2's retry
   subsection, Module 0's `status_code` subsection, Module 1's
   rate-limit handling subsection, Concept 1's "A timeout doesn't mean it
   didn't happen" subsection, and the system-prompt lesson's Recap &
   Practice page, where check-before-create is the graded task. The
   forward reference to Concept 3 (client-side throttling) was plain text
   when this entry was written. It still is: pages built earlier aren't
   updated with new links.
   Concept 3 is drafted: staying under the limit, with client-side
   throttling. Backoff reacts to a 429 and throttling prevents one. The
   model shapes an agent's traffic, so one response can fan out into a
   burst of calls. A shared `LimitedService` stand-in (a concurrency limit
   of 3) is shown once and preloaded as `setupCode`. The page has three
   live demos: a burst through `asyncio.gather` gets 3 through and 7
   rejected; a shared `asyncio.Semaphore(3)` gets all 10 through, with a
   peak of 3 in flight, in 0.4s; creating a semaphore per call is a bug
   that limits nothing. It then contrasts concurrency limits with rate
   limits (token bucket), covers several agents sharing one quota, and
   explains why throttling doesn't replace backoff. It has 5 quiz
   questions and no graded exercise, per its own mockup. All three demos
   match the mockup exactly in real Pyodide 0.26.4. Callbacks link to
   Concept 2's retry fix, Module 2's multi-block-response subsection, and
   Module 0's `return_exceptions=True` subsection. The forward reference
   to Concept 4 (running independent tool calls concurrently) is plain
   text.
   Concept 4 is drafted, the final concept per its own mockup: running
   independent tool calls concurrently. Calls in one response are meant
   to be independent (Anthropic's parallel tool-use guidance), so the
   loop replaces its sequential `for` with `asyncio.gather` and pairs
   results by position with `zip`. `return_exceptions=True` and
   `is_error: True` keep one failure from sinking the batch. A combined
   demo runs the full loop with a timeout per call and a shared
   semaphore. The page also covers the timeout's placement inside the
   semaphore, dependent calls in one batch (return the natural error),
   and `disable_parallel_tool_use`. It has 4 live demos, 5 quiz questions
   and a graded concurrent `run_agent` exercise with 6 hidden tests. The
   overlap test was tightened so the starter can't pass it; see
   architecture.md §4.1. All callbacks resolve to verified anchors:
   Module 2's collect-every-call fix and tool-errors fix, Module 0's
   `gather` and `return_exceptions` subsections, Module 1's round-trip
   `tool_use_id` subsection, and this lesson's Concept 1 and Concept 3
   fixes.
   Module 2 Lesson 6 also has a timeouts page
   (`06-timeouts-retry-and-graceful-give-up`), which the mockup doesn't
   reference. It's flagged here for the mockup author to decide whether
   it's worth a callback.

   Bookends: an intro with 5 outcomes, where why-it-matters says every
   earlier tool answered instantly and real services don't. The Recap &
   Practice page has a 10-question comprehensive quiz across all four
   concepts and a **multi-file graded comprehensive sandbox**, a
   resilient tool executor. `services.py` (read-only) simulates two
   services, each limited to 2 in flight and scriptable to fail, hang or
   rate-limit. `agent.py` needs `SERVICE_SLOTS`, `execute_tool` (a
   timeout inside a shared semaphore, status-aware retries, `Retry-After`,
   and the sleep outside the semaphore) and a concurrent `run_agent`.
   This needed async support in the multi-file harness (see
   architecture.md §4.1). The hint links to all four concept pages.
   Lesson 3.4 is now fully Locked.

5. **The Model Context Protocol** — Locked
   The bookends mockup confirmed the working title, so the folder
   `05-the-model-context-protocol` stays as it is.
   Concept 1 is drafted: the integration problem and MCP's three roles.
   Without a shared protocol, integrations grow as hosts × services; with
   one, they grow as hosts + services. A live counting demo makes this
   concrete, and the page draws the LSP analogy. The three roles are
   host (the AI application that runs the model and the loop), client (a
   connector inside the host, one per server) and server (a separate
   program offering tools). The model never speaks MCP: it still emits
   `tool_use`, and the host forwards the call. A live demo with a
   stand-in `RegistryServer` and `REACT_FAKE_CLIENT` shows that the server
   only ever sees a tool name and its arguments, never the conversation
   (MCP's isolation principle), while its responses still reach the
   model. Both demos match the mockup exactly in real Pyodide 0.26.4.
   There are 5 quiz questions and no graded exercise, per its own
   mockup. Callbacks link to Module 2's `TOOL_REGISTRY` fix subsection
   and Module 1's "The model doesn't call anything" subsection. The
   mockup's forward references to "Lesson 7" (connecting an agent to MCP
   servers) and "Lesson 10" (the tool threat model) are plain,
   number-free text, since no Module 3 lesson list exists yet and those
   lessons aren't built. The same goes for the pointer to Concept 2
   (JSON-RPC).
   Concept 2 is drafted: JSON-RPC as the message format. It covers the
   three message kinds (request, response, notification) and a live demo
   of the four shapes. The field rules are that ids are a string or
   integer, never null and never reused while pending; notifications
   carry no id; and MCP requires a `resultType` on every result
   (`"complete"` or `"input_required"`). A live demo shows out-of-order responses matched by id.
   It separates protocol errors (a JSON-RPC `error` with a code) from
   tool execution errors (a `result` with `isError: true`), and has an
   error-code table. There are 5 quiz questions and a graded
   `to_tool_output(response)` exercise with 6 hidden tests. **Checked
   against the published 2026-07-28 spec**
   (modelcontextprotocol.io/specification/2026-07-28/basic): `resultType`
   and its two values, an unrecognised value being
   invalid, the id rules, the -32020 to -32099 reserved range, the names
   of -32020, -32021 and -32022, and `-32602` for missing required
   `_meta` all match the mockup. Verified in Pyodide 0.26.4 against the
   built page. The reference passes all 6 tests and the starter fails
   all 6. Single-rule violations each fail exactly one test: no
   text-type filter, ignoring `isError`,
   treating `input_required` as complete, treating an unknown type as
   complete, and a protocol error without its code. Callbacks link to
   Module 0's REST-methods subsection, Lesson 3.4's gather-and-pair and
   `is_error` subsections, Module 1's round-trip `tool_use_id`
   subsection, and Lesson 3.3's useful-error-messages subsection. The
   forward references to this lesson's transports and statelessness
   concepts are plain text. A later mockup revision dropped the
   backward-compatibility rule (a missing `resultType` treated as
   `"complete"`) from the prose, quiz Q4 (now "what does
   `input_required` mean?"), the hint, the reference and the hidden
   tests. The revised reference reads `result["resultType"]` directly.
   Concept 3 is drafted: stateless by design. It opens by linking the
   three stateless systems the course has already built (Module 0's REST
   principles, Module 1's resend-everything multi-turn API, Module 2's
   scratchpad). Then it shows every request carrying `_meta` with
   `protocolVersion` and `clientCapabilities` (required) and `clientInfo`
   (recommended), with `-32602` for a missing field and `-32022` plus a
   `supported` list for an unsupported version. It covers
   `server/discover` with a version-choice demo and `ttlMs` caching, the
   operational payoff (any instance, restarts, one connection for
   unrelated work), and server-minted handles for state that has to
   persist (a live `create_draft`/`add_agent_to_draft` demo with
   `structuredContent`, plus the spec's four handle-design rules). There
   are 4 quiz questions and a graded
   `validate_request_meta(request, supported_versions)` exercise with 6
   hidden tests. A shared test prelude (`SUPPORTED`, `req`, `good_meta`)
   is prepended to each test, since each test runs in its own namespace
   copy. Verified in Pyodide 0.26.4: all three demos match the mockup's
   output (apart from the random draft ids), the reference passes 6/6,
   checking the version before the fields fails tests 3 and 6, indexing
   `request["params"]` directly fails test 6, requiring `clientInfo`
   fails tests 1 and 5, and returning a bare error object without the
   JSON-RPC envelope fails tests 3 to 6. The do-nothing starter passes
   tests 1 and 2 (both expect `None`) and fails the rest. Callbacks link
   to Module 0's REST-principles subsection, Module 1's no-memory
   subsection, Module 2's why-the-scratchpad-exists subsection, Concept
   2's two-ways-to-fail subsection, and Lesson 3.4's retrying-a-write
   (idempotency key) subsection.
   Concept 4 is drafted: what a server offers (tools, resources and
   prompts). The three primitives are sorted by who decides to use them:
   tools by the model, resources by the host application, and prompts by
   the user. A live demo shows example `tools/list`, `resources/list` and
   `prompts/list` results, followed by a method reference (`tools/call`,
   `resources/read` by URI, `prompts/get` returning messages). A second
   live demo shows a host using one of each: the tool is reshaped from
   `inputSchema` to `input_schema`, the resource is wrapped in a
   `<policy>` delimiter inside the user message, and the prompt's
   messages start the conversation. The page closes on why agents mostly
   use tools, and suggests wrapping a resource read in a tool. There are 5
   quiz questions and a graded `resource_to_context(read_result)`
   exercise with 4 hidden tests. Verified in Pyodide 0.26.4: both demos
   match the mockup's output, the reference passes 4/4 and the starter
   fails 4/4. Single-rule violations fail the right tests: no newlines
   inside the tag, leaking the blob, dropping the URI on binary items,
   keeping only the first item, and crashing on empty `contents`. One
   small wording fix: the mockup says the "middle" column of the
   four-column table matters, and the page says "second". The mockup's
   "Lesson 7" forward reference (translating `inputSchema` for every
   listed tool) is plain, number-free text, since that lesson isn't
   built. Callbacks link to Module 2's actual-loop subsection, Concept
   3's `server/discover` subsection, Lesson 3.2's full-tool-definition
   subsection, Lesson 3.1's what-a-description-should-say subsection,
   Module 2's delimiters-fix subsection and Module 2's who-decides
   subsection. The graded exercise's explanation mentions Lesson 3's
   oversized tool results as plain text, since explanations aren't
   linked.
   Concept 5 is drafted: transports (how the messages travel). This is
   the lesson's last concept. It covers stdio (the host spawns the server
   as a subprocess, one JSON message per line on stdin/stdout, logs on
   stderr) and a live demo of the classic stray-`print()` bug corrupting
   the stdout stream. It covers Streamable HTTP: one POST per message to
   a single MCP endpoint, and the `MCP-Protocol-Version`, `Mcp-Method`
   and `Mcp-Name` headers that mirror the body for gateways, with a
   mismatch rejected as HTTP 400 / `-32020`. Replies come back as either
   a single JSON response or an SSE stream. It also covers the transport
   security rules (Origin validation, bind to localhost,
   authentication), and ends on a stdio vs. HTTP comparison table. The
   mockup's three `###` sub-headings became their own Subsections, since
   no lesson page uses H3. There are 5 quiz questions and a graded
   `build_http_request(message)` exercise with 4 hidden tests. A shared
   `import json` / `META` prelude is prepended to each test. Verified in
   Pyodide 0.26.4: the demo matches the mockup's output, the reference
   passes 4/4 and the starter fails 4/4. Single-rule violations fail the
   right tests: a hardcoded version fails test 4, always adding
   `Mcp-Name` fails 2 and 4, ignoring `uri` fails 2, handling only
   `tools/call` fails 2 and 3, and a `str()` body fails 1. The forward
   references to the least-privilege lesson and "Lesson 6" (building an
   MCP server) are plain, number-free text, since neither is built.
   Callbacks link to Concept 2's JSON-RPC intro subsection, Module 0's
   SSE wire-format subsection, and Concept 3's
   why-stateless-is-worth-it subsection.
   Bookends: an outcomes/why-it-matters intro (`00-intro.mdx`, 5
   outcomes, one per concept) and a recap (`06-recap-practice.mdx`). The
   recap has a 10-question comprehensive quiz spanning all five concepts
   and a multi-file comprehensive sandbox: a `RegistryClient` in
   `client.py` (entry file, with this lesson's `build_http_request` and
   `to_tool_output` exercise solutions pre-filled) talking to a
   read-only simulated Streamable HTTP `server.py`. The server supports
   only `2025-11-25`, checks `_meta` and the headers, and records every
   request. The learner implements `_send_once` (fresh id, `_meta`,
   headers, send, parse), `request` (a single `-32022` fallback to the
   first mutually supported version, remembered for later calls) and
   `call_tool`. The hidden tests run as one script (6 numbered
   sections), as in Lesson 3.4's recap. Verified in Pyodide 0.26.4 with
   the project's multi-file harness flow (per-instance sandbox dir,
   module-cache eviction, entry run then hidden tests): the reference
   passes, the starter fails, and each single-bug variant fails at its
   own section. No fallback fails section 1, not persisting the version
   fails 2, a fixed id fails 3, retrying with the same version fails 6,
   bypassing `to_tool_output` fails 5, and dropping
   `clientCapabilities` fails 1. The hint links Concept 3's `_meta`
   subsection and Concept 5's Streamable HTTP subsection (the transports
   exercise itself has no anchor).

6. **Building an MCP Server** — Locked
   The folder `06-building-an-mcp-server` was named from Lesson 3.5's
   forward reference, and the bookends mockup confirmed the title.
   Concept 1 is drafted: what a server does (one request in, one response
   out). Statelessness makes a server's core one function,
   `handle_request`: check `_meta`, route by `method` through a
   `METHOD_HANDLERS` dispatch dict (unknown method gives `-32601`), and
   wrap the answer with `result_response`. The tool table stores each
   tool's function with its Pydantic args model, so `tools/list` uses
   `__doc__` as the description and `model_json_schema()` as the
   `inputSchema`. The whole hand-written server is a static code block,
   as in the mockup (it prints nothing on its own). The request demo is
   a live demo with that server as its hidden `setupCode`. There's a
   static stdio loop sketch, and a note that notifications never get a
   response. There are 4 quiz questions and a graded exercise
   (`handle_discover`, `handle_tools_list`, `METHOD_HANDLERS`,
   `handle_request`) with 4 hidden tests. The provided tool table,
   helpers and `validate_request_meta` sit at the top of the editor in
   the `# --- provided ---` block, the same pattern as Lesson 3.4
   Concept 4. Verified in Pyodide 0.26.4 (Pydantic 2.7.0): the request
   demo's output matches the mockup character for character, including
   the schema key order. The reference passes 4/4 and the starter fails
   4/4. Skipping the `_meta` check fails test 4, answering an unknown
   method with an empty result fails 3, a hand-written schema marking
   every field required fails 2, using the name as the description
   fails 2, and building the result without `resultType` fails 1 and 2.
   Callbacks link to the Lesson 3.5 intro page (lesson-level), Lesson
   3.5 Concept 3's opening subsection and its `_meta` subsection, Module
   2's `TOOL_REGISTRY` fix subsection, Lesson 3.2's full-tool-definition
   subsection, Lesson 3.1's what-the-model-receives subsection (where
   `__doc__` is introduced), Lesson 3.5 Concept 5's stdio subsection,
   Module 0's BaseModel-request-body subsection (for a POST endpoint),
   and Lesson 3.5 Concept 2's four-shapes subsection.
   Concept 2 is drafted: answering `tools/call` by hand. A five-row table
   sorts every way a call can end with the "could the model fix it?"
   rule. Only an unknown tool is a protocol error (`-32602`); invalid
   arguments, a tool's own refusal and a crash are tool errors, and a
   crash gets a generic message. The page covers "raise, don't return"
   (`ToolError` / `ProtocolError`) and a handler that validates with the
   tool's Pydantic model, calls with `model_dump()`, passes `ToolError`
   text through and logs crashes to stderr. It closes with a static
   sketch of wiring `ProtocolError` into `handle_request`. The handler is
   a static block, and the five-case demo is live with the handler as
   hidden `setupCode`, the same pattern as Concept 1. One deviation: the
   mockup says the demo doesn't show stderr, but LiveDemo captures
   stderr too. So the crash's log line appears just before the
   `get_agent_owner` result, and the note under the demo explains that
   instead. There are 5 quiz questions and a graded
   `handle_tools_call(params)` exercise with 7 hidden tests, with
   `# --- provided ---` code at the top. Verified in Pyodide 0.26.4
   (Pydantic 2.7.0): the demo's stdout lines match the mockup exactly,
   the reference passes 7/7 and the starter fails 7/7. Returning
   instead of raising for an unknown tool fails test 2, skipping
   validation fails 3, a generic validation message fails 3, leaking the
   exception text fails 5, catching `Exception` before `ToolError` fails
   4, and indexing `params["arguments"]` fails 7. Calling with the raw
   arguments instead of `model_dump()` isn't detectable (no coercion
   happens in these tools), which is fine since that's quiz material,
   not a graded rule. Callbacks link to Lesson 3.5 Concept 2's
   two-ways-to-fail subsection, Lesson 3.2 Concept 3's
   failure-as-observation and trim-the-error subsections, and Concept
   1's tool-table subsection.
   Concept 3 is drafted: the same server with the official SDK
   (`mcp.server.MCPServer`, `@mcp.tool()`, `Annotated[..., Field(...)]`
   parameters, the SDK's `ToolError`, and the in-memory `mcp.Client`).
   Everything is static code, with no live demo and no graded exercise,
   per its own mockup, since Pyodide can't install the SDK. The page has
   5 quiz questions. **The mockup's code and output were re-run locally**
   in a scratch venv (CPython 3.14, `mcp` 2.2.0, Pydantic 2.13.5): the
   printed output matches the page byte for byte, including the
   `set_agent_modelArguments` schema title and the untrimmed Pydantic
   message with its 2.13 docs link. A separate call confirmed that an
   unknown tool comes back as `is_error=True` with "Unknown tool:
   delete_agent", and that `mcp.MCPError` exists
   (`mcp.shared.exceptions`). The forward reference to Concept 4
   (errors, running and testing with the SDK) is plain text. Callbacks
   link to Module 0's minimal FastAPI app subsection, Lesson 3.1's
   Field-description and Literal subsections, Lesson 3.2's trim-the-error
   subsection, Lesson 3.5 Concept 2's two-ways-to-fail subsection, and
   Module 2's explicit-becomes-implicit subsection.
   Concept 4 is drafted: errors, running and testing with the SDK. This
   is the lesson's last concept. It covers `ToolError`, `MCPError` and
   crashes (the client raises on `MCPError`, and a crash's text never
   reaches the model), tool annotations as hints rather than security,
   `mcp.run()` for stdio vs. `transport="streamable-http"`, the
   `__main__` guard, the MCP Inspector, logging on stdio (a separate
   Subsection, since pages don't use H3), and pytest with an in-memory
   `Client` fixture. It's all static code, with 5 quiz questions and no
   graded exercise, per its own mockup. **Re-run locally against `mcp`
   2.2.0:** the errors demo's output matches the page byte for byte, and
   the pytest file gives "4 passed" (only the timing differs). The
   stdio `print()`-diversion claim holds: prints inside tools, flushed
   or not, went to stderr and every call still succeeded. **One
   correction to the mockup:** it said a plain `POST` without the MCP
   headers gets HTTP 400 from "the header check from Lesson 5". Running
   it showed that a POST with no `Accept` header gets 406. One with
   `Accept` but no `MCP-Protocol-Version` gets 400 "Missing session ID",
   which is the SDK's legacy, session-based path, not the header check.
   Only with the version header present does a missing or mismatched
   `Mcp-Method` / `Mcp-Name` get 400 with `-32020`. The bullet now
   describes that case, which is the real header check. The
   least-privilege forward reference is plain, number-free text. This
   concept also turned Concept 3's plain "the next concept" pointer into
   a link to its running-the-server subsection. Callbacks link to
   Concept 2's five-ways and raise-don't-return subsections, Lesson
   3.4's retrying-a-write subsection, Lesson 3.5 Concept 5's Streamable
   HTTP and stdio-bug subsections, and Module 0's TestClient subsection.
   Bookends: an outcomes/why-it-matters intro (`00-intro.mdx`, 5
   outcomes, linking the Lesson 3.5 intro; the "next lesson" pointer to
   connecting an agent to MCP servers is plain text) and a recap
   (`05-recap-practice.mdx`). The recap has an 8-question comprehensive
   quiz and a multi-file comprehensive sandbox: a read-only
   `registry_tools.py` (four tools with Pydantic arg models, `ToolError`,
   and an `audit_agent` that crashes with a DB password) plus
   `server.py` (entry file). In `server.py` the learner writes
   `check_meta` (raising), the three handlers, `METHOD_HANDLERS`, and a
   `handle_request` that turns any `ProtocolError` into an error
   response in one `try`. The hidden tests run as one script with 10
   numbered sections. The starter's shared head (imports, `ProtocolError`
   and the helpers) is one `SERVER_HEAD` constant reused by the starter
   and the reference. A check confirmed that the tools file, starter,
   tests and reference all equal the mockup's blocks byte for byte.
   Verified in Pyodide 0.26.4 (Pydantic 2.7.0) with the multi-file
   flow: the reference passes, the starter fails, and each single-bug
   server fails at its own section. Skipping `_meta` for `tools/call`
   fails 9, an unknown tool as a result fails 7, dropping the error's
   `data` fails 9, leaking the crash text fails 6, skipping validation
   fails 4, a wrong error `id` fails 7, a missing `tools/call` handler
   fails 3, and swallowing `ToolError` into the generic message fails 5.
   The hint links Lesson 3.5 Concept 3's `_meta` subsection and this
   lesson's tool-table and handler subsections.

7. **Connecting an Agent to MCP Servers** — Locked
   The folder `07-connecting-an-agent-to-mcp-servers` was named from the
   forward references in Lessons 3.5 and 3.6, and the bookends mockup
   confirmed the title.
   Concept 1 is drafted: discovering tools from several servers. The
   lesson's in-process stand-ins (`InProcessServer`, `InProcessClient`,
   and registry and monitoring servers that both offer `get_status`)
   live in the new shared `src/lib/mcpStandins.ts` (`MCP_STANDINS`; see
   architecture.md §4.1). The page shows them as a static block that
   must stay byte-identical to that constant. The page covers the pain
   (a naive name-keyed dict silently drops the registry's `get_status`),
   the spec's host-side server prefix (from the host's own labels, not
   `serverInfo`), cleaning names to `[a-zA-Z0-9_-]` with a 64-character
   cap, and the `routes` map back to the server's original name. It
   ends with a short note on rebuilding the catalog when `ttlMs`
   expires. There are two live demos with `MCP_STANDINS` as
   `setupCode`, 5 quiz questions, and a graded
   `build_tool_catalog(servers)` exercise with 5 hidden tests. The
   provided `model_tool_name` sits at the top of the editor, and
   `MCP_STANDINS` plus the mockup's shared test setup are prepended to
   every test. Verified in Pyodide 0.26.4: both demos' output matches
   the mockup exactly, the reference passes 5/5 and the starter fails
   5/5. Leaving out the prefix fails all 5, storing the cleaned name in
   the route fails 3, keeping `inputSchema` fails 4, skipping the
   length check fails 2 and 5, `break` instead of `continue` fails 5,
   and prefixing without cleaning fails 2 and 3. Callbacks link to the
   Lesson 3.6 intro (lesson-level), Module 2 Lesson 5's
   gather-every-call fix subsection, Lesson 3.5's how-a-host-uses-each-one
   and `server/discover` subsections, and Lesson 3.1's
   what-the-model-receives subsection. The pointer to Concept 2 is
   plain text.
   Concept 2 is drafted: routing the model's calls inside the loop.
   Module 2's collect-every-call loop, with the catalog passed as
   `tools=` on every `create` and a new `run_tool_call` that looks up
   the route, calls the server with the original name, and converts the
   response with `to_tool_output`. A made-up tool name is answered
   locally and never forwarded. It ends with a short note that real
   hosts `asyncio.gather` the calls. The mockup's "note for the site
   build" became `TOOL_AWARE_CLIENT` in `fakeClient.ts`, and its
   "already loaded" helpers became `MCP_HOST_HELPERS` in
   `mcpStandins.ts` (both in architecture.md §4.1). There are two live
   demos, the second reusing the first's functions through `setupCode`,
   5 quiz questions (Q1's explanation links Module 1's no-memory
   subsection, since quiz explanations render links), and a graded
   `run_tool_call` + `run_agent` exercise with 6 hidden tests. The
   helpers are in the editor's provided block (see the namespace
   finding in §4.1), and the fake client, stand-ins and
   `fresh_servers` are prepended to each test. Verified in Pyodide
   0.26.4: the helpers block equals the constant, both demos' output
   matches the mockup exactly, the reference passes 6/6 and the starter
   fails 6/6. Sending the prefixed name to the server fails 1, 3 and 5,
   forwarding an unknown tool fails 4, always including `is_error`
   fails 5, not passing `tools` (or only on the first request) fails 2,
   answering only the first call fails 1, dropping `is_error` fails 3,
   and ignoring `max_steps` fails 6. Callbacks link to Concept 1's fix
   subsection, Module 2 Lesson 5's gather-every-call fix subsection,
   Lesson 3.5's JSON-RPC two-ways-to-fail and three-roles subsections,
   and Lesson 3.4's one-failure and putting-it-together subsections.
   Concept 3 is drafted: when there are too many tools. This is the
   lesson's last concept. It covers the token cost (a live demo: 50 toy
   tools from 5 servers is about 4,541 tokens a request) and worse tool
   choice, then four fixes, each its own Subsection: connect only the
   servers the agent needs; an allowlist per server, keyed by original
   names (a live demo with `MCP_STANDINS` as `setupCode`); tool lists
   per stage; and distinguishable descriptions. It closes with a
   "beyond static lists" pointer to tool search and Module 4 (plain
   text). **Both Anthropic-docs claims were checked against the live
   tool-search page** (platform.claude.com, tool-search-tool): about 55k
   tokens for GitHub, Slack, Sentry, Grafana and Splunk, and selection
   accuracy degrading past 30 to 50 tools. There are 5 quiz questions
   and a graded `build_tool_catalog(servers, allowed)` exercise with 5
   hidden tests. The provided `model_tool_name` is at the top of the
   editor, and `MCP_STANDINS` plus a shared `servers` dict are prepended
   to each test. The mockup's tests 4 and 5 shared a result, so test 5
   rebuilds it. The task text links Concept 1's fix subsection (task
   text renders links). Verified in Pyodide 0.26.4: both demos' output
   matches the mockup exactly, the reference passes 5/5 and the starter
   fails 5/5. No `"*"` support fails 2, listing a server before checking
   the allowlist fails 3, an allowlist matched against prefixed names
   fails 1, 3, 4 and 5, filtering only tools and not servers fails 2 to
   4, keeping `inputSchema` fails 5, and adding routes for allowed but
   unoffered names fails 4. The least-privilege forward reference is
   plain text. Callbacks link to Concept 2's routed-loop and
   three-things subsections, Lesson 3.3's tool-result-is-input-tokens
   subsection (twice: the cost problem and the ÷4 estimate), Module 1's
   cache-across-requests subsection, Module 2's phase-as-real-state
   subsection, Lesson 3.1's what-a-description-should-say subsection,
   and Concept 1's fix subsection.
   Bookends: an outcomes/why-it-matters intro (`00-intro.mdx`, 5
   outcomes, linking the Lesson 3.5, Lesson 3.6 and Module 2 Lesson 5
   intros) and a recap (`04-recap-practice.mdx`). The recap has an
   8-question comprehensive quiz and a multi-file comprehensive
   sandbox: a read-only `servers.py` (its own three-server variant of
   the stand-ins, with registry `get_agent_model`, `set_agent_model`
   and `delete_agent`; monitoring `get_status` and `alerts.list`; and an
   unused calendar server) plus `host.py` (entry file, with
   `model_tool_name` and `to_tool_output` pre-filled). The learner writes
   the allowlisted `build_tool_catalog`, `run_tool_call` and
   `run_agent`. The hidden tests run as one script with 7 numbered
   sections. The mockup's `from fake import *` became a
   `REACT_FAKE_CLIENT + TOOL_AWARE_CLIENT` prefix, as in Lesson 3.4.
   Verified in Pyodide 0.26.4 with the multi-file flow: the reference
   passes, the starter fails, and each single-bug host fails at its own
   section. Ignoring the allowlist fails 1, listing the skipped server
   fails 2, sending the prefixed name fails 3, always including
   `is_error` fails 3, forwarding an unknown tool fails 4, dropping
   `is_error` fails 5, answering only the first call fails 3, and
   ignoring `max_steps` fails 7. The explanation's forward references
   to the tool threat model and least-privilege lessons (the mockup's
   "Lesson 10" and "Lesson 11") are plain, number-free text, since
   neither is built. The hint links Concept 3's allowlist subsection
   and Concept 2's routed-loop subsection.

8. **Code Execution as a Tool** — Locked
   Title confirmed by the bookends mockup; intro and recap
   (`05-recap-practice`, 8-question quiz plus a two-file `sandbox.py` /
   `agent.py` comprehensive exercise with a `sys.settrace` step-budget
   timeout, verified in Pyodide 0.26.4: reference passes 7/7, starter
   fails) added. All four concepts are drafted: (1) the most powerful tool and the most
   dangerous, (2) why restricted `exec` isn't a sandbox, (3) real
   isolation and the tool wrapper, (4) WebAssembly and Pyodide, with
   the graded `code_execution_tool` exercise. Verified in Pyodide
   0.26.4: the reference passes 6/6 and the starter fails 6/6. Dropping
   the `__builtins__` allowlist fails test 2, skipping truncation fails
   test 5, skipping the empty-output note fails test 3, and not
   catching exceptions fails tests 2 and 4. **Findings:** the
   subclasses demo's hard-coded output (162 classes, only
   `_wrap_close`) doesn't hold in Pyodide, which reports 357 classes
   including `Popen` too, so the static output blocks were dropped for
   live demos with a note that the count varies by build. The first
   demo's label said "even sum() is gone" but the error is about
   `print`, so it now says `print()`. Concept 3's mockup said the
   timeout is "this lesson's exercise", but the exercise only truncates
   output, so the prose now says a real sandbox enforces the timeout
   from outside. The mockup's "Lesson 10" tool-threat-model reference
   is plain text. Callbacks link to verified anchors in Lesson 3.1, 3.3
   and 3.4, Module 0's Docker lesson, Module 1's prompt-injection
   subsection and Module 2's tool-errors subsection.

9. **Web Interaction** — Locked
   Title confirmed by the bookends mockup (folder renamed from the working
   name `09-web-access-for-agents` to `09-web-interaction`). Four concepts
   plus intro and recap: (1) search and fetch as two tools with two jobs,
   with a graded `web_search` exercise; (2) getting the useful part out of a
   page with an `HTMLParser` extractor, with a graded `<main>`-preferring
   extractor exercise; (3) browsers and computer use (accessibility
   snapshots vs screenshots, and the API > fetch > browser > computer-use
   ladder), quiz only; (4) everything from the web is untrusted input, with
   a live injection demo and a graded `as_untrusted` wrapper exercise.
   The recap has an 8-question quiz and a three-file research-agent
   exercise (search, fetch, URL allowlist, labeling). The concept 1-2
   canned web lives in `src/lib/webStandins.ts`. Verified in Pyodide
   0.26.4: every reference passes and every starter fails; dropping the
   allowlist, the user-URL seeding, the `.update(found)` step, or the
   closing-tag neutralising each fail the right test. **Finding:** in the
   comprehensive exercise's injected page, the mockup wrote the page's own
   `</web_content>` as a literal tag, but `HTMLParser` treats that as an
   end tag and `extract_text` silently drops it, so test 4 passed even
   without neutralising. The page now writes it as `&lt;/web_content&gt;`
   (which `HTMLParser` decodes back into text), so the test really needs
   the fix. The mockup's demo imported a nonexistent `c2core`; the
   extractor is inlined. References to the tool-threat-model and
   least-privilege lessons (the mockup's "Lesson 10" and "Lesson 11") are
   plain text. Callbacks link to verified anchors.

10. **The Tool Threat Model** — Locked
   Working title (folder `10-the-tool-threat-model`), taken from Lessons
   3.8 and 3.9's forward references, all four concepts and the bookends
   now drafted. Concept 1 drafted: prompt injection
   through tool results (direct vs indirect injection, and a live
   scripted-model ticket demo where an injected postscript changes the
   registry), with a 4-question quiz and no graded exercise, per its
   mockup. The demo's output matches the mockup exactly when run in
   Pyodide 0.26.4. Callbacks link to verified pages in Lessons 3.9 and
   3.8 and Module 2's ReAct concept.
   Concept 2 drafted: why the model can't be the security boundary
   (parameterized SQL queries as the structural fix LLMs lack, the request
   shown as one token sequence, mitigations that lower but never zero the
   rate, and the shift to "how much harm can a fooled model do"). Three live
   read-only demos, all matching the mockup's output in Pyodide 0.26.4
   (the `sqlite3` one loads through `loadPackagesFromImports`), a 5-question
   quiz, no graded exercise. The next concept and the least-privilege
   lesson are plain text, as neither is built; other callbacks link to
   verified anchors.
   Concept 3 drafted: the dangerous combination (the lethal trifecta of private data,
   untrusted content and an external channel, a scripted inbox-triage demo where
   an injected newsletter line exfiltrates a confidential email, and cutting a leg
   as the structural fix). One live read-only demo matching the mockup's output in
   Pyodide 0.26.4, a 5-question quiz, and a graded `has_lethal_trifecta` audit exercise
   (5 hidden tests; the reference passes all, and an always-true and an
   `or`-instead-of-`and` version each fail the right tests). The least-privilege
   lesson is plain text; other callbacks link to verified anchors.
   Concept 4 drafted: thinking in terms of the blast radius (the worst case of a
   fully compromised agent, set by its tools and each tool's reach; the same
   injected "delete everything" against a read-only and an admin agent; matching
   the radius to the agent's exposure to untrusted content). One live read-only
   demo matching the mockup's output in Pyodide 0.26.4, a 5-question quiz, no
   graded exercise. The least-privilege lesson is plain text; other
   callbacks link to verified anchors.
   Bookends drafted: intro (4 outcomes, why it matters), an 8-question
   comprehensive quiz, and a graded two-file (`catalog.py` read-only,
   `audit.py` entry) pre-ship toolset audit with 5 hidden tests. Verified in
   Pyodide 0.26.4: the reference passes; the starter and four wrong versions
   (no destructive list, no cut, `any` instead of `all`, counts instead of
   names) each fail. Lesson 10 is now fully Locked.

11. **Designing for Least Privilege** — Building
   Working title (folder `11-designing-for-least-privilege`), taken from
   Lesson 3.10's forward references; no bookends mockup yet, so the title,
   intro and recap are still owed. Concept 1 drafted: narrow tools shrink
   the blast radius (a broad `run_query` dumping the whole registry versus
   purpose-built `get_agent_model`/`list_agent_names`, and the flexibility
   cost of narrowing). Two live read-only demos matching the mockup's output
   in Pyodide 0.26.4, a 4-question quiz, and a graded exercise replacing the
   broad tool with two narrow ones (4 hidden tests; the reference passes all,
   and versions that leak the row, add a field parameter, crash on a missing
   agent or leak the list each fail the right tests; the starter only passes
   the signature test, as in the mockup). Callbacks link to verified anchors.
   Concept 2 drafted: separate reads from writes, and gate the writes (the
   read/write split, and a code-level approval gate keyed to the specific
   call id). Two live read-only demos matching the mockup's output in
   Pyodide 0.26.4, a 5-question quiz, and a graded `execute_tool` approval-gate
   exercise. The mockup's 5 hidden tests never exercised the "a tool that
   raises is caught" case its task promises, so a 6th test was added for it
   (without it a submission with no try/except passed). The reference passes
   all 6; per-tool approval, no gate and no try/except each fail the right
   tests. Callbacks link to verified pages in Module 2 and Lessons 3.10/3.11.
   Concept 3 drafted: allowlists and per-tool credentials (an allowlisted
   send-email tool, scoped credentials one layer below the tool, and the
   principle of least privilege named). Two live read-only demos matching the
   mockup's output in Pyodide 0.26.4, a 5-question quiz, and a graded
   `make_send_email` allowlist exercise (4 hidden tests, each rebuilding its
   own outbox; the reference passes all, and no-check, sends-anyway,
   no-list-in-error and shared-global-list versions each fail the right
   tests). The mockup's forward reference to the production-security module
   is plain text, as that module isn't built. This was the last concept
   mockup so far; the bookends are still owed.

---

## Modules 4–11 — current plan

*Updated 2026-09-24 from the Module 3 handover. The course now has 12
modules (0–11). Modules 0–3 are above; the rest, in order:*

4. Context & Memory
5. RAG
6. Reliability
7. Evaluation & Observability
8. Multi-Agent Systems
9. UX
10. Production
11. Capstone

*Write forward references against this plan. The four outlines below are
from the earlier 8-module plan; they're kept for their scope notes, with
headings updated to the new module numbers. The new modules (Context &
Memory, Reliability, UX, Capstone) have no outline yet.*

---

## Module 7 — Evaluation & Observability (outline from the old plan, where it was Module 4)

*Rough outline — deliberately sequenced before Modules 5 and 6 ("you
cannot debug an agent you cannot measure"). Not yet broken into lessons.*

Golden test sets, RAGAS-style evaluation metrics, and observability
tracing (Langfuse) — originally lesson 9 of the pre-split Module 2 list,
now expanded into its own module and moved earlier in the sequence.

---

## Module 5 — Build RAG Based Systems (outline from the old plan)

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

## Module 8 — Build Autonomous Multi-Agent Systems (outline from the old plan, where it was Module 6)

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

## Module 10 — Production: Security, Compliance & Deployment (outline from the old plan, where it was Module 7)

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
