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

**Citation audit (2026-09-30).** A light pass; the full per-claim tables
are in [citation-audit/module-1.md](citation-audit/module-1.md). Prose and
quiz text, plus two comments in LiveDemo code (all three demos on those
pages re-run in Pyodide 0.26.4, output unchanged). The data-backed charts
match their sources (Liu et al. v3, all 28 values; Kaplan's fits).
- **Corrected:** UTF-8's byte counts; how o200k splits digits; the
  cosine-similarity baseline, to match the page's own tool; GPT-2's learned
  positions; RoPE for open-weight models; Chroma's claim on multi-part
  tasks; Kaplan et al. as not the first on power laws; RL for reasoning
  rewards correct answers (DeepSeek-R1); API users can choose quantization
  on open-weight hosts; INT4's cost; image token counts; vocabulary sizes.
- **Updated:** Kalai et al. now cites *Nature* (2026); each model's own
  output cap is mentioned alongside the window.
- **Linked** every named paper (Vaswani, Liu, Kaplan, Chinchilla, Wei,
  Schaeffer, Sharma, InstructGPT, DPO, LoRA and others) with its venue.
- **Approved and applied:** lost-in-the-middle's cause (L6 C5, its quiz
  and the recap) now cites the measured attention bias toward the start and
  end of the input (Hsieh et al., ACL Findings 2024), and Liu et al.'s
  finding that instruction tuning isn't necessarily responsible. The
  unsourced training-documents explanation is gone.
- **Concept coverage (second pass, light):** each concept page and intro was
  checked as a whole. Six prose edits anchor the few builder-facing claims
  that lacked a source (token counts across languages, penalties, logprobs,
  when to use a reasoning model, structured outputs, agent cost). The table
  is at the top of `citation-audit/module-1.md`.

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

**Citation audit (2026-09-30).** A light pass; the full per-claim tables
are in [citation-audit/module-2.md](citation-audit/module-2.md). Prose and
quiz text only; no demo or exercise changed. The module had no external
links before this pass. Now:
- The three named papers are linked (Wei et al., Yao et al.'s ReAct, Huang
  et al.). Each pattern name is credited to Anthropic's "Building effective
  agents" where it appears.
- **Corrected:** the `Action Input:` format is LangChain's, not the ReAct
  paper's; chain-of-thought prompting "can be used with any model", and Wei
  et al. found gains only at about 100B parameters; the OpenAI Agents SDK
  isn't tied to one provider; a recap quiz on "scratchpad" as a framework
  term.
- **Added:** evidence and a boundary for reflection (Self-Refine, Kamoi et
  al.), Tree of Thoughts' figures and cost, the AWS Builders' Library on
  retries, Gemini CLI's loop detection, LangGraph checkpoints, and
  Anthropic's and OpenAI's prompting guides.
- **Retry demo fixed (L6 C6):** after its last attempt, `call_with_retry`
  (the demo, the exercise's reference and the recap's `execute_tool_safely`)
  printed a wait that never happened. It now prints "no retries left". The
  hidden tests are unchanged. Re-verified in Pyodide 0.26.4: the demos, 7 of
  7 exercise tests, the recap's tests, and a wrong variant still failing.
- **Concept coverage (second pass, light):** each concept page and intro was
  checked as a whole. Six prose edits anchor the concepts that lacked a
  source (iterating on prompts with tests, where tool guidance goes, a fake
  LLM client, goal-state checks, tool errors as observations, goal
  decomposition). The table is at the top of `citation-audit/module-2.md`.

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

**Citation audit (2026-09-30).** A light pass; the full per-claim tables
are in [citation-audit/module-3.md](citation-audit/module-3.md). Prose and
quiz text only; no demo or exercise changed. The MCP facts match the
current spec (2026-07-28), and the SDK facts match `mcp` 2.2.0.
- **Corrected:** Anthropic's parallel tool-use docs no longer say dependent
  calls come in a later turn; a `tool_result` can hold more than text;
  Playwright MCP's `target`; not every fetch tool blocks private
  addresses; Pydantic's `allOf` note is 2.7 only; the SDK also retries 409;
  a server crash is classified consistently across L5 and L6.
- **Replaced paraphrases with real quotes:** Saltzer and Schroeder (1975),
  and Python's own docs on `__builtins__`.
- **Added:** the spec's `resultType` back-compat rule (one sentence); and
  industry anchors (Anthropic's tool and error docs and its tool-writing
  post, the Amazon Builders' Library, Stripe, GitHub, OWASP LLM01/LLM06
  and SSRF, Invariant Labs, Greshake et al., Microsoft's spotlighting
  preprint).
- **Added at the owner's request:** one sentence in L9 C4 on respecting
  robots.txt (RFC 9309), as Anthropic's web fetch and the reference MCP
  fetch server do. MCP authorization is deferred to the production,
  security and deployment module (see its outline below).
- **Concept coverage (second pass, light):** of 51 pages, 44 were backed,
  1 rested on our data only and 6 lacked a source for the technique. Six
  prose edits anchor all but one. **Approved and applied:** L8 C4's "Pyodide
  is often the sweet spot" is now scoped to the browser (NVIDIA). For agents
  on a server, it now says the usual answer is a container or micro-VM,
  since Pydantic and LangChain archived their Pyodide sandboxes. The table is at the top of
  `citation-audit/module-3.md`.

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
   only `2026-07-28` (the client prefers a stand-in future revision,
   `2027-07-01`, so there is something to negotiate), checks `_meta` and the headers, and records every
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
   **Review pass (2026-09-24):** Concept 4 overstated Pyodide's
   isolation. This site loads Pyodide on the page's main thread, so
   learner code has the `js` bridge (`js.document`, `js.fetch`, page
   storage), verified in Chromium. The "no network" and "reaches nothing
   that matters" claims were replaced by a new "What this page hands in"
   subsection with a live `js` demo: the boundary protects the learner's
   computer, not the page. The "no server / no backend" wording now
   acknowledges the E2B (Firecracker micro-VM) Docker exercises, which
   Concept 3's micro-VM bullet also names. All 14 quiz cards were
   rebalanced (the correct option had been the longest in every one) and
   throwaway distractors replaced. Concept 3's quiz no longer says the
   timeout is part of the wrapper. Concept 1 gained a live demo (fixed
   tools vs. one code tool, which also lists the filesystem root) and a
   source link for the code-execution-efficiency claim. The multi-file
   callback now points at Lesson 0.3's modules concept. The graded
   exercise moved from Concept 4 to Concept 3, where the wrapper is
   taught (still 0/6 starter, 6/6 reference in Chromium).
   **Recap follow-up (2026-09-25):** the recap's 8-question quiz was
   rewritten with new questions instead of repeats of the concept
   quizzes, and rebalanced (the correct option had been the longest in
   every one). Its hint now links the wrapper exercise, which the review
   pass moved to Concept 3.

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
   **Review pass (2026-09-25):** all 27 quiz cards rebalanced (the
   correct option had been the longest in every one) and throwaway
   distractors replaced. The recap quiz is 8 new questions instead of
   repeats of the concept quizzes. Concept 3's "private database + web
   browsing" question now uses support tickets, because Concept 3 itself
   says fetching any URL is an external channel. Concept 2's Willison
   quote is corrected to "99% is a failing grade". Concept 4's
   blast-radius demo now runs the real loop with a scripted fooled model
   against two toolsets, instead of a set-membership check. Its "broad
   tools safely" claim is softened to note honest mistakes. The recap's
   test-4 comment and explanation are fixed (the notes agent has the
   private-data leg).

11. **Designing for Least Privilege** — Locked
   Working title (folder `11-designing-for-least-privilege`), taken from
   Lesson 3.10's forward references, all three concepts and the bookends
   now drafted. Concept 1 drafted: narrow tools shrink
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
   is plain text, as that module isn't built.
   Bookends drafted: intro (4 outcomes, why it matters), an 8-question
   comprehensive quiz, and a graded two-file (`backend.py` read-only,
   `agent.py` entry) least-privilege registry agent combining narrow tools,
   the approval gate, the recipient allowlist and scoped access objects
   inside the collect-every-call loop. The hidden tests use the fake
   client and ToolAwareClient. Verified in Pyodide 0.26.4 as multi-file:
   the reference passes; the starter and versions with no gate, no
   allowlist, a leaking read tool, a missing is_error flag, and a loop that
   handles only the first call each fail. The mockup's 7 tests didn't catch
   a per-tool (not per-call) approval, so an 8th test (approving a
   different call id must not release a delete) was added. Lesson 11 is now
   fully Locked; it is the last Module 3 lesson built so far.
   **Review pass (2026-09-25):** the approval gate was redesigned. It
   used to answer a gated call with an "awaiting approval" `tool_result`
   and run the same call id later, which the real API rejects, since
   every `tool_use` gets exactly one `tool_result`. It now pauses the
   loop before answering and resumes on the same `messages` once a human
   decides (see architecture.md §4.1). Concept 2's prose, demo, quiz and
   exercise were rewritten (6 hidden tests; verified in Chromium: starter
   0/6, reference 6/6; answering early, re-asking the model on resume,
   per-tool approval and ignoring a decline each fail). The recap
   exercise uses the same pausing loop (8 tests, reference passes). Its
   old test 6, which only checked read-only `backend.py`, is replaced by
   a real per-tool-credential test: read tools work with no write or
   mail access, and delete works with no read access. Concept 1's demos
   now run real SQLite (`run_query` really returns the whole table; the
   narrow tool's `?` placeholder defeats SQL-shaped input). Concept 3's
   credential demo uses a read-only SQLite connection, so the refusal
   comes from the database. All 22 quiz cards were rebalanced, and the
   recap quiz is 8 new questions.

---

## Module 4 — Context & Memory

**Citation audit (2026-09-30).** Every outside-source claim was checked
against its primary source; the full per-claim tables are in
[citation-audit/module-4.md](citation-audit/module-4.md). Prose and quiz
text only; no demo or exercise changed.
- **Corrected:** token counting is an estimate on Anthropic's API (L1 C1);
  cache minimums now run 512 to 4,096 tokens (L3 C1); Chroma calls the
  decline "non-uniform", not gradual, and the "hurts most" wording was
  softened across L2 and L8; the 13–15% longer runs held for two of five
  models (L5 C1, its quiz and the recap); Claude's threshold compaction
  doesn't keep thinking valid (L5 C2); Lesson 12's break-even quiz is now
  about 25 to about 35 checks; its "26 times" links the recap that shows it.
- **Updated:** L5 C4 now leads with Claude's on-demand compaction (which
  its docs recommend) and OpenAI's `compact_threshold`; the memory tool
  "no longer needs a beta header"; preserved thinking names Sonnet 5.5 and
  the beta setting; Letta's links and wording follow its current docs;
  Xiong et al. is ACL 2026, with the paper's conditions stated.
- **Industry sources added:** Anthropic's context-engineering post,
  advanced tool use (58 tools, about 55K tokens), caching, token-counting
  and memory-tool docs; OpenAI's compaction, tool search and truncation;
  Ollama; Gemini; LangGraph/LangMem; Claude Code's memory limits; Google
  ADK; OpenTelemetry; Factory; Cursor; Manus; OWASP's agentic Top 10; the
  Claude and ChatGPT memory help pages; GDPR Art. 17; Zep.
- **Approved and applied:** re-anchoring is kept, with its caveat: on
  providers that bind reasoning to everything before it, an anchor that
  comes and goes is an edit (L4 C4, with Claude's turn-scoped system message
  as the provider's own form). L3 scopes "best available" to a plain prefix
  cache, and L2 C4 mentions the built-in option.
- **Concept coverage (second pass):** each concept page and intro was
  checked as a whole. Of 53 pages, 40 were backed, 2 rested on our data
  only and 11 had no source for the technique itself. All 13 are now
  anchored, with 23 prose edits. **Approved and applied:** keep teaching
  append (L5 C3/C4), and note in L5 C4 that Claude's own on-demand
  compaction folds. The table is at the top of
  `citation-audit/module-4.md`.

1. **Context as a Budget** — Locked. Intro; Concept 1 (what fills the
   window; `count_tokens`); Concept 2 (measuring one request part by part;
   graded `measure_request`); Concept 3 (watching it grow across the loop;
   graded `TurnTracker`, whose 6 mockup tests became 7 with a boundary
   test: `<=` instead of `<` on the warning line passed all six); recap
   with a 7-question comprehensive quiz and a multi-file comprehensive
   sandbox (`tokens.py` + `budget.py` read-only, `agent.py` entry:
   `run_instrumented_agent` and `summarize_budget`). Sandbox verified with
   real Python imports: the reference passes, and wrong versions (record
   after appending the reply, average including turn 1, no `tools=`
   passed, unknown tool crashing, no step limit, wrong first-warning turn,
   only the first call handled, recording only once) each fail. Two tests
   were tightened: `llm.tools_seen` is checked, and the first warning must
   fall after turn 1 (the mockup's `warn_below` warned from turn 1). The
   lesson title comes from the bookends file. Forward references to later
   lessons (prompt caching, context quality) are plain prose until those
   lessons exist.

2. **Context That Fits But Still Hurts** — Locked. Concept 1 (agents get worse before the window is
   full: Chroma "Context Rot" and Anthropic context-engineering evidence,
   a position-drift demo whose printed output matches the mockup exactly,
   5 quiz cards; no exercise) and Concept 2 (what goes stale in a
   scratchpad: `prune_superseded` demo matching the mockup's output
   exactly, 5 quiz cards, graded exercise with six hidden tests; verified
   against real Python: the reference passes, and versions that delete
   stale results, mutate the input, ignore arguments, prune errors, keep
   the first instead of the latest result, or omit the tool name each
   fail) are built. The mockup's dict-spread callback pointed at Module 3
   but that isn't where it's taught; it links to Module 0's `*args` and
   `**kwargs` concept instead. Concept 3 (instructions that pile up and
   contradict: `set_rule` history and `<current_rules>` block demo
   matching the mockup exactly, 4 quiz cards, graded exercise with four
   hidden tests, verified against real Python: the reference passes;
   using the first value, counting non-`set_rule` calls, reporting every
   rule as changed, sorting rules, and overwriting history each fail) is
   built. The mockup referred to a `changed_rules` function "below" that
   it never shows; the page says it's written in the exercise. Concept 4
   (re-anchoring the goal: Manus-style recitation, an `update_plan` tool
   and `assemble_context` restating the current plan and rules at the end
   of the context, demo matching the mockup's output exactly, 5 quiz
   cards, graded exercise with six hidden tests — starter code provides
   `current_rules_block` from Concept 3, learner implements `latest_plan`
   and `assemble_context`; verified against real Python under the actual
   grading harness semantics, not just a flat script: the reference
   passes, and versions that mutate messages in place, put the anchor
   before the tool_result blocks, or skip the no-plan-no-rules early
   return each fail) is built — this is the last concept of the lesson.
   The mockup's forward references to a caching lesson and to lessons on
   overflowing/compacting history are plain prose, per Lesson 1's
   precedent, since no such lesson exists yet in Module 4 (a same-titled
   page exists in Module 1, but that's LLM-foundations content, not the
   Module-4 lesson the mockup is pointing at). Intro (5 outcomes, why-it-
   matters linking back to Lesson 1) and recap are now built: a 7-question
   comprehensive quiz spanning all four concepts, and a multi-file
   comprehensive sandbox (`tokens.py` + `rules.py` — the latter carrying
   `current_rules_block` forward from Concept 3 — read-only, `agent.py`
   entry: `prune_superseded`, `latest_plan`, `assemble_context`,
   `prepare_context`, `run_agent`) combining every concept: a rollout task
   whose scratchpad has a superseded status check, a failed check, a
   rule, and two plan updates. Verified against real Python with actual
   multi-file imports (not a flattened script): the reference passes all
   7 hidden tests, and a version whose `prepare_context` assembles
   without pruning first fails on the superseded-result check (test 1).
   The mockup's hidden tests import a `fake` module that was never a real
   file anywhere in this codebase; converted to this project's existing
   convention instead (`REACT_FAKE_CLIENT` + `TOOL_AWARE_CLIENT` prefixed
   onto the hidden-tests string, as Lesson 1's recap does).

3. **Prompt Structure and Cache Hits** — Locked (title from the bookends
   file; the folder is still `03-prompt-caching`, named before the
   bookends existed, and its links are unchanged).
   Concept 1 (what a prefix cache is worth to an agent: a provider-neutral
   `estimate_cost` cost model — reused prefix tokens read at a discount,
   new tokens written at a surcharge — applied to Lesson 1's own
   log-reading run (`[101, 1_828, 3_538, 5_247, 6_939, 8_631, 10_323]`,
   confirmed by re-running that lesson's exact demo in Pyodide before
   reusing the numbers), 5 quiz cards, graded exercise with five hidden
   tests; verified against real Python: the reference passes, output
   matches the mockup's demo exactly (58%/74% savings)) is built.
   Callbacks link to Lesson 1's watching-it-grow-across-the-loop page and
   to Module 1's KV-cache and prompt-structure-and-cache-hits concepts
   (both already built, confirmed real destinations rather than
   hand-slugified guesses). Concept 2 (what makes an agent cache-friendly,
   and what breaks it: a `first_divergence` function locating where two
   consecutive requests stop matching byte-for-byte, a four-case demo
   (append-only, time in the system prompt, an early result edited, a
   tool added) and a key-order demo, both matching the mockup's printed
   output exactly, 5 quiz cards, graded exercise with six hidden tests)
   is built. **Test-coverage bug found and fixed:** the mockup's own
   hidden test 6 (meant to prove that same-content-different-key-order
   still counts as a cache miss) built its fixture from `ToolUseBlock`
   instances, which have no `__eq__`, so two *different* instances are
   never `==` regardless of content — a learner who wrote the naive
   `previous == current` instead of `serialize(previous) !=
   serialize(current)` would still pass all 6 hidden tests, verified by
   actually running that exact wrong implementation in Pyodide under the
   real grading harness. Fixed by rebuilding test 6's fixture from plain
   dict blocks (`{"type": "tool_use", ...}`) with the same key/value pairs
   in a different order — those genuinely are `==` in Python, so the
   naive version now fails test 6 specifically (confirmed), while the
   reference (using `serialize`) still passes all 6. Callbacks link to
   Concept 1, to Lesson 2's pruning subsection (used twice — once for the
   "early result edited" case and once for its `sort_keys=True` mention),
   to Lesson 2's re-anchoring concept, and to Module 2's
   checkpoint-and-resume concept's "Saving and loading" subsection — all
   confirmed against the built HTML. The mockup's forward references to
   Concept 3 ("where Lesson 2's techniques stand") and to a later
   just-in-time-context lesson are plain prose, since neither exists yet.
   Concept 3 (where Lesson 2's techniques stand, and the fights ahead:
   an anchor demo showing re-anchoring costs one message per turn
   (`messages[2]`, 63 reusable tokens), and a rollout demo comparing
   never-prune / prune-every-turn / `BatchPruner` (9,741 / 16,721 /
   10,345 token-units, +72% and +6%), both matching the mockup's printed
   output exactly when re-run; 5 quiz cards; graded exercise `stale_tokens`
   + `BatchPruner` with five hidden tests) is built. **Test-coverage gap
   fixed:** the mockup's tests never checked the threshold boundary, so a
   strict `>` instead of `>=` passed all five; test 3 now also asserts a
   threshold exactly equal to the stale tokens prunes (the `>` variant
   fails it). Mutations also confirmed: pruning every turn fails tests 2
   and 4, building from the raw history each turn fails test 4, never
   storing the view fails all five. The mockup's test 3-5 built on one
   `BatchPruner`'s state across tests; each hidden test is now
   self-contained (shared `TEST_SETUP`), since the harness runs them
   separately. Intro and Recap & Practice (8-card comprehensive quiz; the
   multi-file "cache-aware context builder" sandbox with read-only
   `tokens.py` and `lib.py` and `agent.py` to complete: `add_to_end`,
   `CacheAwareContext`, a collect-every-call `run_agent` recording every
   request sent; six hidden tests, incl. aware cost < half the naive
   builder's, 15,433 vs 44,413 with the reference) are built. Verified
   against real CPython by extracting the strings from the built lesson
   files; not re-run in Pyodide since no new harness or component is
   involved. Forward references to Lessons 5, 7 and 12 are plain prose
   (unbuilt).

4. **When the History Won't Fit** — Locked (title from the bookends file;
   the folder is still `04-when-the-window-fills`, named before the
   bookends existed). Concept 1
   (hitting the wall) is built: a new `WINDOWED_CLIENT` in `fakeClient.ts`
   (`WindowedClient` raising `ContextWindowExceeded`, or silently dropping
   the oldest messages with `on_overflow="drop_front"`, as the mockup's
   build note specifies), Lesson 1's `TurnTracker` reused via a local
   `TRACKER_FUNC` copy, a wall demo (turn 5 fits but not the reply room,
   turn 6 rejected, retry rejected identically) and a silent-trim demo
   (`dropped` = `[0, 0, 0, 0, 0, 3, 5]`, original task lost, 4 of 6
   results seen), both matching the mockup's printed output exactly when
   re-run; 4 quiz cards; no exercise (per the mockup). Callbacks link to
   Lesson 1's tracker and measuring concepts, Module 1's "what happens
   when you exceed it" subsection (anchor confirmed in built HTML) and
   max-output-length concept, Module 2's tool-errors and retry concepts,
   and Lessons 2 and 3. Concept 2 (cutting whole rounds, not messages) is
   built: `CHECK_PAIRING` added to `fakeClient.ts` per the mockup's build
   note; a two-careless-cuts demo and a trim-in-the-loop demo, both
   matching the mockup's printed output exactly when re-run; 4 quiz cards;
   graded exercise `split_rounds` + `trim_to_fit` with nine hidden tests.
   **Bugs found and fixed:** (1) the mockup's `trim_to_fit` reference used
   `len(rounds) == 1`, which loops forever on a task-only history (no
   rounds), so the built version uses `<= 1`; (2) a learner version that
   also drops the newest round hangs the browser (no harness timeout), so
   the tests run `trim_to_fit` under a `sys.settrace` step limit (see
   architecture.md §4.1); (3) a strict `<` instead of `<=` at the budget
   passed all eight mockup tests, so a new test 8 checks a budget exactly
   equal to the history's size drops nothing. The mockup's shared-state
   tests are now self-contained. Mutations confirmed: no round grouping
   fails 1, 6, 7; dropping the task fails 3-7; mutating the input fails
   4, 6, 7, 9. Forward references to the next concept and Lesson 5 are
   plain prose (unbuilt). Concept 3 (clear before you cut, and cut in
   batches) is built: `clear_old_results`, `fit` and `HistoryFitter`, with
   Lesson 3's `serialize` / `first_divergence` / `cost_of_run` and
   Concept 2's round functions in the demo setup; a clearing-in-the-loop
   demo (last request 6 of 6 calls visible, 2 results in full, about
   3,800 tokens against trimming's 5,100) and a 30-check batching demo
   (67,393 / 27,456 / 19,002 token-units, 17 / 17 / 3 prefix breaks), both
   matching the mockup's printed output exactly when re-run; 5 quiz cards;
   graded exercise `clear_old_results` + `fit` with nine hidden tests.
   **Test-coverage gap fixed:** a strict `<` instead of `<=` in `fit`
   passed all nine mockup tests, so test 7 now also checks a budget
   exactly equal to the history's size returns it unchanged. Mutations
   confirmed: `successful[-keep_last:]` fails test 5, clearing errors
   fails 3 and 5, errors counting toward `keep_last` fails 1 and 3,
   per-message counting fails 1-4, writing the placeholder into the
   original block fails 6, trimming before clearing fails 8, always
   clearing fails 7. The mockup's shared-state tests are self-contained.
   Forward reference to Lesson 6 is plain prose (unbuilt). No
   intro/bookends yet.
   Concept 4 (reasoning travels with its tool call) is built:
   `CHECK_OPEN_ROUND` added to `fakeClient.ts`; a strip-all-vs-trim-by-rounds
   demo (2,537 tokens / 636 of reasoning; 1,873 with an open-round
   problem vs 910 clean) and an old-reasoning-first demo at three budgets
   (2,143 / 1,082 / 996 tokens), both matching the mockup's printed output
   exactly when re-run; the provider-binding section (Claude's
   newest-model rule, dated September 2026) and the context-editing
   section are prose from the mockup as written; 5 quiz cards; graded
   exercise `strip_old_thinking` + `fit_history` with seven hidden tests.
   **Test-coverage gap fixed:** a strict `<` in `fit_history` (and an
   unconditional strip) passed all seven mockup tests, so test 5 now also
   checks a budget exactly equal to the history's size returns it
   unchanged. Mutations confirmed: stripping the newest message fails
   1, 2 and 7, emptying a thinking-only message fails 4, mutating the
   original fails 3 and 4, never stripping or stripping after `fit` fails
   6. Forward reference to Lesson 5 is plain prose (unbuilt). All four
   concepts now exist; the intro and Recap & Practice (bookends mockup)
   are still to come, so the lesson stays Building.
   Intro and Recap & Practice are built: 8-card comprehensive quiz, and
   the multi-file "context step that makes a long run fit" sandbox
   (read-only `tokens.py` and `lib.py`, `agent.py` to complete:
   `FittingContext` with a budget, low-water target and `seen` counter,
   and a collect-every-call `run_agent` that records every request and
   doesn't catch `ContextWindowExceeded`; seven hidden tests). The
   mockup's `fake` module became a concatenated prefix
   (`REACT_FAKE_CLIENT + COUNT_TOKENS + WINDOWED_CLIENT`), as in earlier
   Module 4 recaps. **Bug fixed:** the mockup's `lib.py` still had
   `trim_to_fit`'s `len(rounds) == 1` (infinite loop on a task-only
   history), so it uses `<= 1` like the concept. Verified against real
   CPython: the reference passes (4 prefix breaks, 23,819 vs 28,490
   token-units, a 16% saving, matching the mockup's stated figure);
   mutations (fitting every turn, low-water = budget, ignoring
   `max_tokens`, `len(view)` instead of `seen`, never fitting, catching
   the overflow, not updating `seen`, copying the prefix) all fail.
   Forward references to Lessons 5 and 12 are plain prose (unbuilt).
   Lesson 4 is now fully Locked.

5. **Compaction and Summarization** — **Locked** (folder
   `05-compaction-and-summarization`; the mockup names no lesson title, so
   this one is the mockup's own heading).
   Concept 1 (what clearing can't do) is built: a 200-round growth demo
   (raw 142,249 vs cleared 21,712 tokens, about 100 tokens per round) and
   a dropped-round demo (the 4.8s figure and the billing call disappearing
   across three budgets), both matching the mockup's printed output
   exactly when re-run, and the prose figures (about 710 to about 100
   tokens per round, under a sixth) checked against them; the JetBrains
   "Complexity Trap" and Anthropic context-engineering evidence are
   prose and links from the mockup as written; 5 quiz cards; no exercise
   (per the mockup). The demo setup is Lesson 4's full stack, as the
   mockup's build note says; nothing new was added to `fakeClient.ts`.
   Callbacks link to Lesson 4's intro and clearing concept, Lesson 2's
   stale-results concept and Lesson 3's batching concept. No
   intro/bookends yet.
   Concept 2 (compacting: a summary in, rounds out) is built: a
   `summary_request` / `compact` pair (whole rounds only, newest
   `keep_recent` kept verbatim, summary placed inside the task message in
   `<summary_of_earlier_work>` tags so roles keep alternating), with a
   scripted-summary demo matching the mockup's printed output exactly
   when re-run (19 messages / 3,662 tokens down to 5 / 1,107; the summary
   request first differs from the normal request at `messages[14]`; the
   4.8s figure survives); 5 quiz cards; graded exercise `summary_request`
   + `compact` with six hidden tests. **Lesson 4 correction applied, as
   the mockup's build note requires:** `is_tool_results` and
   `check_pairing` now accept a results message that also carries text
   (they look for `tool_result` blocks with `any`, and `check_pairing`
   only reads the `tool_result` blocks of the next message). Updated in
   all three places they live (`CHECK_PAIRING` in `fakeClient.ts`, Lesson
   4 concept 2's displayed code, Lesson 4's recap `lib.py`); every Lesson
   4 demo and hidden test was re-run afterwards and still passes, and the
   old `all(...)` version was confirmed to fail this concept's test 1.
   `clear_old_results` was left as the mockup has it and still assumes
   results messages without text (history never contains one, since
   anchors and summary instructions are added to sent copies only).
   **Test-coverage gap fixed:** `rounds[-keep_recent:]` at
   `keep_recent=0` (which keeps every round) passed all six mockup tests,
   so test 4 now also checks `compact(..., keep_recent=0)` returns just
   the task-with-summary message. Mutations confirmed: separate summary
   message fails 1, 2 and 5 (and the alternation check), summary in its
   own message fails 3-5, mutating the task fails 3 and 6, `>` instead of
   `>=` fails 2. Forward references to later concepts are plain prose.
   **Update:** the mockup's `SUMMARY_INSTRUCTIONS` gained the line "If an
   earlier summary appears above, don't repeat it: cover only the work
   after it." (used by Concept 3's append-summaries design); both the
   constant and the displayed block in Concept 2 were updated and the
   demo and six tests re-run unchanged.
   Concept 3 (when a summary loses something) is built: `changes_ledger`
   and `anchor_from_history` (plan, rules and every write-tool call read
   from the full history, restated at the end of the compacted copy), a
   shared rollout scenario loaded into every demo, and three demos (an
   omission demo, a ledger demo, an append-vs-fold demo) all matching the
   mockup's printed output exactly when re-run; 5 quiz cards; graded
   exercise with six hidden tests. Mutations confirmed: reading the plan,
   rules or ledger from `messages` instead of `history` fails test 3,
   listing unanswered write calls fails 2, listing reads fails 1, 2, 3
   and 5, dropping the FAILED marker fails 1 and 3, keeping the whole
   result instead of its first line fails 1-3, appending in place fails
   6, adding an empty anchor fails 5. The "What to Keep, What to Forget"
   arXiv citation is as written in the mockup. **Escaped-backtick
   cleanup:** Python constants written in `String.raw` with `\`` (used
   in docstrings) keep the backslash, so the code shown in the editor had
   stray backslashes and Python warned about an invalid escape. All 34
   occurrences in Module 4 were removed (the executed code only; the
   displayed markdown blocks keep their backticks) and every Module 4 demo
   and hidden test was re-run afterwards. Earlier modules (0 and 3) still
   have the same pattern in a few docstrings and were left alone.
   Concept 4 (when to compact, and what it costs) is built: a
   `Compactor` (strip and clear first, compact only if still over the
   low-water mark) and a 120-round cost demo run three ways, matching the
   mockup's printed output exactly when re-run (clear first 209,210 with 1
   compaction; compact first 189,556 with 7; separate summary call
   273,996, about 45% more; the output-cost table at 300, 1,000 and 3,000
   tokens per summary); 5 quiz cards; graded exercise `next_step` ("send"
   / "clear" / "compact" / "trim") with six hidden tests. Mutations
   confirmed: comparing with the budget instead of the low-water mark
   fails 3 and 5, not stripping old thinking before clearing fails 2 and
   4. The demo setup reuses Lesson 3's `cost_of_run`; nothing new added
   to `fakeClient.ts`. The Claude compaction-API details (150,000 default
   trigger, `compact_20260112`, `pause_after_compaction`) are prose from
   the mockup as written. Module 8 is a plain-prose forward reference.
   Intro and bookends are built: 4 outcomes and why-it-matters, an
   8-question comprehensive quiz, and a multi-file comprehensive sandbox
   (`tokens.py` and `lib.py` read-only, `agent.py` entry) implementing
   `CompactingContext` and `run_agent`, with ten hidden tests. Built like
   Lesson 4's sandbox: the fake client, `count_tokens` and
   `WindowedClient` are prepended to the tests rather than imported as a
   `fake` module, and backticks in `lib.py`'s docstrings were removed
   (they'd end the template literal). Verified natively: the reference
   passes; the starter fails; mutations confirmed: no anchor reservation,
   anchor saved into the view, summary sent as a separate call, and
   rebuilding the view from the history all fail. Known gaps in the
   mockup's tests (left as authored): a context that skips the trim
   fallback when a summary comes back empty, and one that compacts without
   clearing on the compaction turn itself, both still pass. The forward
   reference to Lesson 12 is plain prose (unbuilt).

6. **Offloading Context to Storage** — **Locked** (folder
   `06-offloading-context-to-storage`, named from Lesson 5's forward
   reference "offloading context to storage, and note taking"; the
   bookends' own heading is "Offloading Context to Storage, and
   Note-Taking"). Concept 1 (keep the reference, not the
   result) is built: `ResultStore`, `offload`, `read_result` and
   `find_in_result` in the shared demo setup, a four-way comparison demo
   (7,326 / 490 tokens, page 2 repeating 5 lines, 159 offloaded) and an
   in-the-loop demo (30,656 vs 3,030 tokens sent, 5 vs 7 requests), both
   matching the mockup's printed output exactly when re-run; 5 quiz
   cards; graded exercise `offload` + `read_result` with seven hidden
   tests (the mockup's tests shared one store across steps; each is now
   self-contained, so the res_N handles are asserted per test). Verified
   natively (no new Pyodide harness): the reference passes and the starter
   fails; mutations confirmed: storing only the preview fails 2, sizing in
   lines instead of tokens fails 3b, `<` instead of `<=` at the threshold
   fails 3, `<=` for the continuation note fails 5. Backticks removed from
   `find_in_result`'s executed docstring (they'd end the template
   literal); the displayed block keeps them. Callbacks link to Module 3's
   truncation/pagination page, MCP handles subsection, validation
   concept and threat-model lesson, and Lessons 1 and 4; Lesson 8 is plain
   prose (unbuilt). **Update:** the mockup changed `ResultStore` to mint
   handles from a `minted` counter instead of `len(self.items) + 1`, so a
   number is never reused once something is removed; both the executed
   class and the displayed block were updated and the demos and seven
   tests re-run unchanged.
   Concept 2 (clearing and compaction that can be undone) is built:
   `clear_to_store` (Lesson 4's clearing, storing each cleared result and
   skipping placeholders so clearing twice changes nothing),
   `transcript` + `compact_with_archive`, and `BoundedStore` (size cap,
   removed handles answer with a note), with three demos matching the
   mockup's printed output exactly when re-run (1,066 -> 495 tokens, 2
   items stored after the second clearing; the archive summary with the
   4.8s figure one search away; kept res_2/res_3, removed res_1); 5 quiz
   cards; graded exercise `clear_to_store` with seven hidden tests (made
   self-contained, as the mockup's shared `out`/`store`). Mutations
   confirmed: no already-cleared skip fails 5 and 6, clearing the newest
   results too fails 2, 5 and 6, clearing errors fails 2 and 5, not
   storing fails 1, 4 and 5. Callbacks link to Lesson 4's clearing
   concept, Lesson 5's order subsection and summary-loss concept, this
   lesson's Concept 1 subsections and Module 3's least-privilege lesson;
   Lesson 9 is plain prose (unbuilt).
   Concept 3 (notes the agent keeps) is built: a `Notes` class (three
   fixed sections, add and mark-done only, numbered ids, a cap, errors as
   messages, `render` and `index_line`) and a notes-across-a-compaction
   demo matching the mockup's printed output exactly when re-run (rate
   limit absent from what's sent, index line present, `mark_done('n1')`
   refused); 5 quiz cards; graded exercise `Notes` from scratch with eight
   hidden tests (the mockup's tests were one sequential script; each is
   now self-contained, sharing a `build()` helper for the later ones).
   Mutations confirmed: a class-level shared list fails 6 and 8, allowing
   any item to be marked done fails 3, counting done items in the index
   fails 5, a `>` cap fails 6 and 7, no section check fails 2. Known weak
   spot inherited from the mockup: test 7 (an error never changes the
   notes) passes for the empty starter. The Anthropic long-running-agents
   harness article is cited as written in the mockup. Callbacks link to
   Lesson 2's re-anchoring concept, Lesson 5's ledger-anchor subsection
   and summary concepts and Module 3's granularity concept; Lessons 7
   and 8 are plain prose (unbuilt).
   Intro and bookends are built: 4 outcomes and why-it-matters linking
   Lessons 4 and 5, an 8-question comprehensive quiz, and a multi-file
   comprehensive sandbox (`tokens.py` and `lib.py` read-only, `agent.py`
   entry) implementing `offloading`, `make_tools`, `RestorableContext`
   (Lesson 5's `CompactingContext` with `clear_to_store`,
   `compact_with_archive` and the notes index in the anchor) and
   `run_agent`, with eleven hidden tests. Built like Lessons 4 and 5: the
   fake client and `count_tokens` are prepended to the tests instead of a
   `fake` module, and backticks were removed from `lib.py` docstrings and
   the starter's TODO comment (they'd end the template literal). Verified
   natively: the reference passes and the starter fails; mutations
   confirmed: plain clearing, plain compaction, not reserving room for
   the notes index, not sending the index, not offloading service tools,
   not sending the anchor, and a late-binding lambda in `make_tools` each
   fail. The recap is `04-recap-practice.mdx` (the lesson has three
   concepts).

7. **Just-in-Time Context and Dynamic Tool Exposure** — **Locked** (title is
   a placeholder: the mockup names no lesson; folder
   `07-just-in-time-context-and-dynamic-tool-exposure`, named from
   Lesson 6's forward reference). Concept 1 (what you load, and where it
   goes) is built: a 40-tool catalog and a four-policy cost demo (all
   tools 23,276 / per area 20,057 with 9 orphans / appended 24,028 /
   loaded into the conversation 13,854), and a stage-gating demo (tool
   list identical in every request, prefix never broken), both matching
   the mockup's printed output exactly when re-run; 5 quiz cards; graded
   exercise `stage_line` + `gated_dispatch` with five hidden tests (made
   self-contained: the mockup's tests shared `ran` and `call` state).
   Verified natively (no new Pyodide harness): the reference passes and
   the starter fails; mutations confirmed: no stage gate fails 2, checking
   the stage before the tool's existence fails 4, dropping `is_error` fails
   2 and 4, reversing the stage line fails 5. Backticks appear only in
   displayed markdown. Callbacks link to Lesson 1's request-measuring
   concept, Lesson 3's intro, Lesson 2's re-anchoring concept, Module 2's
   phase-aware prompting concept and Module 3's too-many-tools concept
   (fix 2 and fix 3 subsections, anchors verified). The provider details
   (Claude tool search, OpenAI `allowed_tools`, Manus masking) are prose
   and links from the mockup as written.
   Concept 2 (tools on demand) is built: `check_arguments` (required
   fields, known fields, simple types, with the bool-is-not-an-integer
   guard) and `ToolIndex` (keyword `find_tools`, `call_tool` refusing
   unknown, not-yet-found and invalid calls), with a three-refusals demo
   and an index-vs-all-40-tools loop demo, both matching the mockup's
   printed output exactly when re-run (6,406 tokens over 6 requests vs
   18,930 over 3); 5 quiz cards; graded exercise `ToolIndex` with seven
   hidden tests (made self-contained: the mockup's tests built on one
   shared index). Verified natively: the reference passes and the starter
   fails; mutations confirmed: no result limit fails 1, 2, 3 and 5,
   case-sensitive search fails 7, duplicate `found` entries fail 3,
   skipping validation fails 5, skipping the found check fails 3 and 5.
   Module 5 (semantic search) is a plain-prose forward reference. Callbacks
   link to the previous concept and Module 3's names-and-descriptions and
   validate-failures concepts.
   Concept 3 (instructions and reference material on demand) is built:
   `GuideLibrary` (index in the system prompt, `read_guide` for a body or
   a section, errors that list what exists, names only ever looked up in
   the library) and a six-guide, ten-turn cost demo matching the mockup's
   printed output exactly when re-run (system prompt 3,074 vs 106 tokens;
   sent 37,265 vs 11,946; cost 8,690 vs 3,307; the path-like name refused);
   5 quiz cards; graded exercise `GuideLibrary` with five hidden tests
   (already self-contained). Verified natively: the reference passes and
   the starter fails; mutations confirmed: an always-present sections
   pointer fails 2, dropping the "none" fallback fails 4, returning the
   body for a section fails 3, no unknown-guide check fails 4 and 5. The
   Agent Skills post and open-standard links are as written in the
   mockup. Callbacks link to Lesson 2's evidence concept, this lesson's
   rule subsection, Lesson 4's clearing concept, Module 3's
   prompt-injection concept and Lesson 6's store-bounds subsection
   (anchors verified); Lesson 10 is plain prose (unbuilt). All three
   concepts exist. Bookends built: `00-intro.mdx` and `04-recap-practice.mdx`
   (8-question comprehensive quiz; multi-file comprehensive sandbox with
   read-only `lib.py`, entry `agent.py`: `build_system`, `dispatch`,
   `run_agent` with a fixed 3-tool prefix, stage gating and a guide index,
   eight hidden test groups). Verified natively: the reference passes and
   the starter fails; mutations confirmed: no stage gate and no stage line
   each fail. Docstring backticks in `lib.py` removed (they break
   `String.raw`). Callbacks link to Lesson 1's what-fills-the-window
   concept, Lesson 2's re-anchoring concept, Lesson 3's intro and this
   lesson's concepts 1 and 3.

8. **Short-Term and Long-Term Memory** — **Locked** (title from the
   bookends mockup's heading; folder `08-long-term-memory`, chosen before
   the bookends existed, from the concepts' subject and their forward
   references to Lessons 9-11).
   Concept 1 (what dies with the session, and what shouldn't) is built:
   a three-way session-start demo (nothing 20 tokens / whole transcript
   2,748 / three memories 79), matching the mockup's printed output
   exactly when re-run; 5 quiz cards; no graded exercise, per the
   mockup. Callbacks link to Lessons 1, 2, 6 and 7 and Module 2's
   checkpoint-and-resume concept; Lessons 9-11 are plain prose (unbuilt).
   Concept 2 (storage, retrieval, injection) is built: `keywords`,
   `recall`, `session_prompt` and `recall_for` on plain strings, with a
   raw-words-vs-keywords demo and a two-user scoped-recall demo (prefix
   stable across a session, checked with Lesson 3's `first_divergence`),
   both matching the mockup's printed output exactly when re-run; 5 quiz
   cards; graded exercise with five hidden tests (split into
   self-contained snippets; docstring/comment backticks removed).
   Verified natively: the reference passes and the starter fails;
   mutations confirmed: sorting the pairs directly fails 2, recalling from
   the whole store fails 3, keeping one-letter words fails 1. Callbacks
   link to concept 1, Lesson 7's concept 3 and its `the-rule` subsection
   (anchor verified) and Lesson 2's re-anchoring concept; the next
   concept and Lessons 9-10 are plain prose (unbuilt).
   Concept 3 (episodic, semantic, procedural) is built:
   `assemble_memory` and `memory_block` on top of concept 2's final
   `keywords` (which also drops one-letter words) and `recall`, a
   one-rule-vs-per-type demo
   matching the mockup's printed output exactly when re-run; 5 quiz
   cards; graded exercise with six hidden tests (split into
   self-contained snippets). Verified natively: the reference passes and
   the starter fails; mutations confirmed: no relevance check fails 3,
   oldest-first fails 3 and 5, no empty-section skip fails 5, unlimited
   facts fails 4. Concept 2 now links forward to it. The CoALA paper link
   is as written in the mockup; Lesson 10 is plain prose (unbuilt). No
   bookends built: `00-intro.mdx` and
   `04-recap-practice.mdx` (8-question comprehensive quiz; multi-file
   comprehensive sandbox with read-only `lib.py`, entry `agent.py`:
   `remember`, `start_session`, `run_session` with the memory block built
   once into the fixed system prompt, six hidden test groups run as one
   script). Verified natively: the reference passes and the starter
   fails; mutations confirmed: no copy, no validation, rebuilding the
   prompt per request, recalling from all users and dropping the
   empty-block fallback each fail. Docstring backticks in `lib.py`
   removed. Lesson 9 is plain prose (unbuilt).

9. **Building a Memory Store** — **Locked** (folder
   `09-building-a-memory-store`, named from Lesson 8's forward reference). Concept 1 (a memory record, and a
   store scoped by design) is built: a Pydantic `Memory` record (content,
   type, source, created, tags) and `MemoryStore` (every method takes
   the user; `save` stores a copy; `search` filters by kind and tags,
   ranks by shared keywords over content and tags, newest first on ties),
   with a record demo and a store demo, both matching the mockup's
   printed output exactly when re-run, and the record demo's Pydantic
   error messages confirmed under real Pyodide 0.26.4 (pydantic 2.7.0);
   5 quiz cards; graded exercise `MemoryStore` with five hidden tests
   (split into self-contained snippets). Verified natively: the
   reference passes and the starter fails; mutations confirmed: no copy
   fails 5, searching all users fails 1, 2 and 4, matching all tags fails
   3, ignoring tags in the score fails 2, skipping the newest-first sort
   fails 1, 3 and 5. Module 0's Pydantic and Module 3's `Literal` are
   linked (anchor verified); the mockup's `Field(min_length=...)` gap
   (Module 0 teaches `Field` only through Module 3's `description=`) is
   covered by the code comment as authored. Lessons 10-11 are plain prose
   (unbuilt).
   Concept 2 (three ways an agent uses the store) is built:
   `make_memory_tools` (tools bound to the session's user, with no
   `user_id` parameter), `write_after_session` and `CoreBlock` (hard
   limit, exact first-match replace), with two demos matching the
   mockup's printed output exactly when re-run; 5 quiz cards; graded
   exercise with seven hidden tests (split into self-contained
   snippets; test 4 now saves one of Simar's own memories so the
   'Ravi can't see it' check is meaningful on its own). Verified
   natively: the reference passes and the starter fails all seven;
   mutations confirmed: a `user_id` parameter fails 4, source `user`
   fails 1, not catching `ValidationError` fails 2, replacing every
   match fails 5, an off-by-one limit fails 6, editing before the length
   check fails 6. Callbacks link to Module 3's prompt-injection and
   validate-failures concepts, Lesson 6's store-bounds subsection
   (anchor verified) and Module 0's decorators concept; Lesson 10 and
   the next concept are plain prose.
   Concept 3 (where recalled memories go, and what it costs) is built:
   a four-placement, twelve-turn cost demo plus a block-edit placement
   comparison (8,077 / 11,231 / 9,990 / 8,693; 9,148 vs 8,077), matching
   the mockup's printed output exactly when re-run, and every quoted
   percentage (39%, 24%, 8%, 13%) re-derived from it; `MemoryContext`;
   the Claude memory-tool section as written in the mockup (not
   re-checked against the docs); 5 quiz cards; graded exercise
   `MemoryContext` with six hidden tests (split into self-contained
   snippets, each rebuilding its own store and block). Verified natively:
   the reference passes and the starter fails all six; mutations
   confirmed: rebuilding the system prompt on edit fails 4, mutating the
   history fails 4, returning the same list fails 3, ignoring the limit
   fails 6, never comparing with the start text fails 3 and 5, keeping
   the block by reference instead of its text fails 3 and 5. Callbacks
   link to Lesson 8's injection subsection, concept 2's block subsection
   and Lesson 2's re-anchoring concept (anchors verified). No
   bookends built: `00-intro.mdx` and `04-recap-practice.mdx` (8-question
   comprehensive quiz; multi-file comprehensive sandbox with read-only
   `lib.py`, entry `agent.py`: `make_session_tools` and
   `run_memory_session`, seven hidden test groups run as one script;
   the lib needs Pydantic, loaded from its import). Verified natively:
   the reference passes and the starter fails; mutations confirmed: a
   block not kept in `blocks`, no `TypeError` catch, no post-session
   pipeline, sending the raw history, no block tools, rebuilding the
   prefix, and an unbound `user_id` parameter each fail. Docstring and
   comment backticks removed. Concept 2's `save_memory` message changed
   in the mockup to `Saved as KIND memory.` and the page, exercise and
   tests were updated to match. Title confirmed by the bookends heading.

10. **Deciding What to Remember** — Locked (title is a placeholder: the
   mockup names no lesson; folder `10-deciding-what-to-remember`, named
   from Lessons 8 and 9's forward references). Concept 1 (extraction,
   with evidence) is built: `entries`, `numbered_transcript`,
   `EXTRACTION_INSTRUCTIONS`, `parse_candidates` and `derive_source`,
   with a labels-vs-quote-check demo matching the mockup's printed output
   exactly when re-run; 5 quiz cards; graded exercise with seven hidden
   tests (split into self-contained snippets; the fake client and
   `entries`/`numbered_transcript` are provided in the starter, as in
   Lesson 7). Code fences inside code are written as an interpolated
   backtick-repeat expression in the template literals (a raw backtick
   can't appear in `String.raw`; a separate `FENCE` constant isn't in
   scope inside MDX exports), and shown with four-backtick fences in the
   page. Verified natively: the reference passes and the starter
   fails; mutations confirmed: not stripping fences fails 2, searching
   all entries fails 6, allowing negative entries fails 7, accepting an
   empty quote fails 6, accepting a string entry fails 4. Trusting a
   candidate's own `source` label is not caught (the tests' candidates
   carry none), as authored. Callbacks link to Lesson 9's pipeline
   subsection (anchor verified) and concept 1, and Module 3's
   prompt-injection concept; the later concepts are plain prose
   (unbuilt at the time). **Revised:** the mockup was later updated to
   build the demo's scripted `reply` from a runtime `FENCE` variable
   (a single backtick, repeated) and string concatenation, instead of
   embedding a literal fence directly inside the Python source; the
   page's `EXTRACT_DEMO` const was updated to match (a single-backtick
   JS interpolation in place of the old triple-backtick one) —
   functionally identical, verified natively to still print the same
   output.

   Concept 2 (duplicates and contradictions) is also built:
   `MemoryRecord`, `VersionedStore`, `find_duplicate` and
   `apply_decision`, redefining Lesson 9's `keywords`/`Memory`/
   `MemoryStore` locally (this file's own consts, same pattern as every
   other lesson page) rather than importing them. Live demo reproduces
   the mockup's naive-vs-ruled batch exactly (verified natively,
   `python -c` with real `pydantic` 2.12.5); 5 quiz cards; graded
   exercise with seven hidden tests. Verified natively: the reference
   passes all seven and the starter (`...` stubs) fails everything;
   three targeted mutations (skipping the duplicate check, dropping the
   only-the-user's-word rule, and having `find_duplicate` search
   superseded memories too) each fail exactly the test that checks the
   violated requirement (2, 5, and 2 respectively). The one callback
   (to the previous concept) links to its page (anchor verified); the
   other (Lesson 11's forgetting rules) stays plain prose since Lesson
   11 isn't built yet, matching how concept 1 left its own forward
   references to concept 3. Concept 3 (memory poisoning, and the source
   rule) is also built — the lesson's final concept: `admit` and
   `render_memories`, redefining `entries`/`numbered_transcript`/
   `parse_candidates`/`derive_source` (concept 1), `Memory`/
   `MemoryRecord` (Lesson 9/concept 2) and Lesson 8's `memory_block`
   locally, same self-contained-consts pattern as every other page
   (this concept's demos never touch `MemoryStore`/`VersionedStore`, so
   they're left out of its setup). Two live demos: the SpAIware-style
   poisoning walkthrough (evidence check correctly tags the planted line
   as `tool`, naive storage still files it as a standing instruction,
   the source rule refuses it) and the disguised-fact demo (passes
   `admit`, shown attributed under "what sources said" instead of as an
   instruction). Both verified natively (`python`, real `pydantic`
   2.12.5) to match the mockup's printed output exactly, including the
   nested `memory_block`/`render_memories` section text. 5 quiz cards;
   graded exercise with five hidden tests. Verified natively: the
   reference passes all five and the starter fails; three targeted
   mutations (letting only tool-sourced procedural memories get
   refused, so the agent's inference slips through; dropping the
   tool-origin check; and removing the procedural-type guard from
   `render_memories`'s sections) each fail exactly the test guarding
   that rule (1, 2, and 3+4 respectively). Callbacks: the previous
   concept's rule links to its `only-the-user's-word` subsection anchor
   (verified), Lesson 8's procedural-memory warning links to its
   subsection anchor (verified), and the two Module 3 references
   (prompt injection, blast radius) link to their concept pages, same
   as concept 1's existing Module 3 link.

   The bookends mockup has since arrived, and both files are now built.
   `00-intro.mdx`: 4 learning outcomes and why-it-matters, matching the
   mockup verbatim; its one callback (Lesson 9) links to Lesson 9's
   intro page. `04-recap-practice.mdx`: 8-question comprehensive quiz
   (mixed order, spanning all three concepts), and a multi-file
   comprehensive sandbox — the whole write path (`decide`,
   `remember_session`) over a scripted 8-candidate extraction reply
   covering every rule the lesson taught in one session. New file-tab
   pattern for this course: `fake.py` (read-only) now exists as its own
   provided module — `ToolUseBlock`/`TextBlock`/`FakeResponse`/
   `FakeLLMClient` from `src/lib/fakeClient.ts`'s `FAKE_CLIENT`, written
   out as a real file rather than prepended as raw text into
   `hiddenTests` (Lesson 9 recap's older convention) — alongside
   `tokens.py` (Lesson 9's own pattern) and a `lib.py` carrying this
   lesson's code on top of Lessons 8/9, plus two additions,
   `entry_origins` and `DECISION_INSTRUCTIONS`. `entry.py` is `agent.py`.
   Verified natively (`python`, real `pydantic` 2.12.5): the reference
   solution passes all seven hidden tests exactly, reproducing the
   mockup's report line for line; three targeted mutations (removing
   the pre-emptive duplicate check so a duplicate always costs a model
   call, swapping the admit/duplicate check order, and setting `origin`
   regardless of source) were tried — the first is caught by test 4's
   exact request-count assertion (5 requests instead of 4) even though
   the report text is unaffected; the other two don't change behavior
   on this exercise's specific test data (no candidate is both a
   duplicate and admit-refused, and non-tool records never show their
   origin in `render_memories` anyway), so they're not meaningfully
   different mutations here — noted rather than claimed as caught. The
   hidden tests' own scripted fence uses the same runtime-`FENCE`
   pattern as concept 1's revised demo. Lesson 10 is now **Locked**:
   all three concepts plus both bookends exist and build cleanly.

11. **Forgetting, Aging, and Retrieval Quality** — Locked (working
   title, taken from Lesson 10 concept 2's own forward reference —
   "this module, forgetting aging and retrieval quality lesson" — folder
   `11-forgetting-aging-and-retrieval-quality`). Concept 1 (why a store
   that keeps everything gets worse) is built: no new shared code, just
   a live demo over Lesson 10's `MemoryRecord`/`VersionedStore` and
   Lesson 8's `keywords`, redefined locally per this project's usual
   per-page pattern. The demo simulates a year of weekly memory writes
   (three memories that matter, plus a routine note every week and an
   old latency figure every fourth) and shows recall of the three
   "useful" memories degrading from 3/5 to 0/5 as the store fills with
   look-alike clutter — verified natively (`python`, real `pydantic`
   and `datetime`) to print the mockup's exact table, week by week and
   count by count. 5 quiz cards; no graded exercise, matching the
   mockup's own note that this lesson's exercises start in concept 2.
   Callbacks: Lesson 10's intro (whole-lesson reference, no single
   concept named); Lesson 2's look-alike-distractor evidence, linked to
   its specific subsection anchor (verified) rather than the generic
   second reference to "Lesson 2's argument," which links to Lesson 2's
   intro page instead, since that one names no specific subsection;
   and Lesson 9's search-ranking rule, linked to its subsection anchor
   (verified). The two forward references (concept 2's scoring, concept
   3's forgetting) stay plain prose, unbuilt. **Module 0 gap noted by
   the mockup:** `datetime` (`date`, `timedelta`) is used from here on
   with one-line glosses in the code itself; Module 0 doesn't teach it,
   so no page-level explanation was added beyond the mockup's own
   comment.

   Concept 2 (scoring what to recall) is also built: `ScoredMemory`,
   `ScoredStore`, `days_between`, `min_max`, `score_memories` and
   `recall_scored`, on top of Lesson 10's classes, redefined locally as
   usual. The Generative Agents-style three-signal score (recency since
   last use, importance, keyword relevance, each min-max scaled then
   weighted) is verified natively (`python`, real `pydantic` and
   `datetime.fromisoformat`/subtraction) against the mockup's own
   hand-worked numbers in the hidden tests, and the "a year again" demo
   (three signals vs. keyword-only, and scored-without-refresh vs.
   scored-with-refresh) reproduces the mockup's exact 0-of-3/1-of-3/3-of-3
   result and recalled-memory list. 5 quiz cards; graded exercise with
   seven hidden tests. Verified natively: the reference passes all
   seven and the starter fails; three targeted mutations (recency always
   counting from `created`, ignoring `last_used`; `recall_scored` not
   excluding procedural memories; and `recall_scored` never marking
   `last_used`) each fail the tests that check exactly those things
   (1+2, 5+6, and 6 respectively) — a second **Module 0 gap** from the
   mockup (`datetime.fromisoformat`, and subtracting two datetimes for a
   `timedelta`) is glossed the same way, in the code comment only.
   Callbacks: the previous concept (page link, no single subsection
   named), Lesson 8's "procedures are always loaded" rule (subsection
   anchor verified), and the same Xiong et al. citation concept 1 used.

   Concept 3 (forgetting on purpose) is also built — the lesson's final
   concept: `ArchivableMemory`, `ArchiveStore` (`archive_one`, `restore`,
   `delete`) and `forget`, on top of concept 2's scoring code, redefined
   locally as usual. `forget` archives superseded memories past a
   retention period, then, if the store is over a cap, archives the
   lowest-scoring active memories (by concept 2's scoring with no task
   in view, so only recency and importance decide), never touching the
   user's own standing instructions. The "a year, with forgetting" demo
   (cap of 15, policy run weekly) and the restore/delete walkthrough are
   verified natively (`python`, real `pydantic`/`datetime`) to reproduce
   the mockup's exact counts (69 stored, 15 active, 54 archived) and
   restore/delete sequence. 5 quiz cards; graded exercise with five
   hidden tests. Verified natively: the reference passes all five and
   the starter fails; two targeted mutations (dropping the
   standing-instruction guard from the cap rule, and ignoring
   `retention_days` so every superseded memory is archived immediately)
   each fail multiple tests that check exactly those rules (2+4, and
   1+2+3 respectively). Callbacks: the previous concept (page link),
   Lesson 10's "supersede, don't delete" (subsection anchor verified),
   and Lesson 10's source rule (subsection anchor verified).

   Bookends are now built too, from the mockup's `lesson-4-11-bookends.md`:
   an intro (learning outcomes + why-it-matters, with a whole-lesson
   callback to Lesson 10's intro) and a comprehensive `recap-practice`
   page. 8-question comprehensive quiz spanning all three concepts. The
   comprehensive sandbox is a `MultiFileGradedExercise` (`lib.py`
   read-only — Lessons 8-11's memory code in full, needing a `tokens.py`
   companion file for `count_tokens`/`_plain` the same way Lesson 10's
   did — plus an `agent.py` entry file implementing `run_week`: save the
   week's new memories, pull the user's standing instructions, recall
   for the task with `recall_scored` (refreshing what it returns), render
   instructions + recalled with `render_memories`, then run `forget`,
   returning `(block, report)`). Verified against a real Pyodide instance
   (`pyodide@0.26.4`, real `pydantic`): the reference solution passes all
   seven hidden-test assertions (a full year of `run_week` calls with an
   owner change at week 30), and two targeted mutations — swapping the
   recall/forget order, and dropping the initial save of new
   memories — each fail, confirming the tests actually catch the two
   things the lesson is about (recall-before-forget, and the store
   actually growing). Lesson 11 is now **Locked**: all three concepts
   plus both bookends exist and build cleanly.

12. **Assembling the Context Step** — **Locked** (folder
    `12-assembling-the-context-step`, slugified from the mockup's own
    framing — this lesson integrates the whole module's context code into
    one `ContextManager` class and measures it, so no single earlier
    lesson's title fit). Concept 1 (one context step, in order) is built:
    `anchor_text` (the plan, the rules, the change ledger, the notes
    index, and the memory block's edit, in a fixed order, each only if
    there's something to say, read from the full history) and
    `ContextManager` (a fixed prefix built once at session start; each
    turn strips old reasoning, clears to the store, compacts with an
    archive, folds piled-up summaries past `fold_share` of the budget,
    then trims whole rounds as a last resort; the anchor is added, with
    room reserved for it in the budget). This lesson's setup carries
    forward the corrected version of every piece the module built:
    `is_tool_results`/`check_pairing` (Lesson 4, via
    `src/lib/fakeClient.ts`'s `CHECK_PAIRING`), Lesson 2's
    `latest_plan`/`current_rules_block`/`changes_ledger`, Lesson 3's
    `add_to_end`/`serialize`/`first_divergence`/`cost_of_run`, Lesson 4's
    `trim_to_fit`/`clear_old_results`/`strip_old_thinking`, Lesson 5's
    `summary_request`/`compact`/`next_step`, Lesson 6's counter-based
    `ResultStore`/`offload`/`read_result`/`find_in_result`/
    `clear_to_store`/`compact_with_archive`/`Notes`, Lesson 8's corrected
    `keywords`, and Lessons 9-11's memory chain (`Memory` through
    `ArchiveStore`/`forget`, pulled from Lesson 11 recap's own
    consolidated `LIB_PY`) plus `CoreBlock` from Lesson 9 (with its
    corrected `save_memory` message, though `save_memory` itself isn't
    called by this lesson's demos, which call `memory.save()` directly).
    The "one session, end to end" demo (a scripted 17-turn investigation
    with a rule, a plan, an offloaded log, seven detail checks, a memory-
    block edit, and a fix) was verified against a real Pyodide instance
    (`pyodide@0.26.4`, real `pydantic`) by extracting the exact exported
    `SETUP`/`SESSION_DEMO` strings straight out of the built `.mdx` file
    (not a hand-copied re-transcription) and running them in a fresh
    interpreter — this reproduces the mockup's turn-by-turn step table,
    token counts, and every closing assertion (`True`) exactly. One
    subtlety this caught: `ToolUseBlock`'s id counter is a class
    variable, so re-running a demo in a Pyodide session that already
    ran an earlier demo (without redefining the class) drifts the
    counter and shifts a few token counts by one; the real site is safe
    because each `LiveDemo`'s `setupCode` redefines every class fresh on
    every Run click (confirmed against `src/lib/pyodide.ts`'s "one
    shared interpreter, but setup reruns each click" design) — this was
    confirmed by running each demo against a *fresh* interpreter (as a
    lone Run click would see it) rather than chaining demos in one
    session, which is what initially produced numbers a few tokens off
    in two of concept 2's checks-scaling rows before the fix. 5 quiz
    cards; graded exercise for `anchor_text` with four hidden tests
    (order and format; empty parts including an unchanged block; only
    write-tool calls become changes; a compacted copy loses the plan,
    which is why the full history is always passed). Verified natively
    (extracted from the built file): the reference passes all four; two
    targeted mutations (swapping the plan/rules order, and ledger-ing
    every tool's calls instead of only `write_tools`) each fail the test
    that pins exactly that rule. Callbacks: Lesson 3 (intro, no
    subsection), Lesson 7 (intro), the memory-store lesson (intro, for
    the "Lessons 9-11" prefix item), Lesson 6 (intro), the
    history-won't-fit lesson (intro, for "Lessons 4-6"), the
    re-anchoring concept in the context-that-fits lesson (page link, for
    "Lessons 2, 5, 6 and 9"), the deciding-what-to-remember and
    forgetting lessons (intro links), the summary-loses-something concept
    in the compaction lesson (page link, and its `summaries-of-summaries`
    subsection anchor — verified against the built HTML — for the
    piled-up-summaries rule), the compaction lesson's intro (for "Lesson
    5's sandbox"), the when-to-compact concept (page link), the
    where-recalled-memories-go concept (page link), and the
    what-you-load-and-where-it-goes concept (page link). All anchors
    were verified against `dist/`'s built HTML rather than hand-slugified.

    Concept 2 (measuring the before and after) is also built: `run_report`
    (per-request token totals, largest/total, `cost_of_run`, prefix
    breaks via `first_divergence`, and per-check missing-turn lists) plus
    `WindowedScripted` (the scripted agent behind a real
    `WindowedClient` window, logging every call including summary/fold
    requests) and `Naive` (no context step at all). The three-run demo
    (naive at the same window, naive unlimited, managed) and the
    cost-at-length table (7/20/40/80/160 checks, plus a folding-vs-never-
    folding comparison at 160) were verified the same way as concept 1 —
    extracted straight from the built `.mdx`'s exported strings and run
    fresh in Pyodide — and reproduce the mockup's numbers exactly,
    including the break-even point shifting to between 20 and 40 checks
    and the folding fix (151 tokens of summaries and 0 dropped-without-
    trace turns, vs. 1,584 tokens and 106 turns without it). This
    concept's `ContextManager` is concept 1's already-`fold`-equipped
    version, per the mockup's own note that the class changed mid-concept
    to gain `fold` and the final fitting guarantee. 5 quiz cards; graded
    exercise for `run_report` with six hidden tests (split into
    self-contained snippets, mirroring the mockup's six numbered
    assertions). Verified natively (extracted from the built file): the
    reference passes all six; two targeted mutations (counting any
    request difference, not just tools/system, as a prefix break; and
    checking only a request's `messages` instead of the whole request for
    "missing") each fail exactly the test that catches that behavior.
    Callbacks: the context-that-fits and forgetting lessons (intro
    links), the previous concept (page link, and its `the-integration-
    rules` subsection anchor — verified against the built HTML — for
    where `fold` was added), and the same summary-loses-something
    subsection anchor as concept 1.

    No new grading component or Pyodide-harness pattern was needed — this
    lesson recombines existing helpers behind the existing single-file
    `GradedExercise`/`LiveDemo` machinery.

    Concept 3 (what to leave out) is also built — the lesson's final
    concept, per the mockup's own closing note. It's the module's synthesis
    and has no code: the mockup says explicitly that every figure it cites
    comes from a demo built earlier in the module, linked to it rather than
    repeated. No live demo and no graded exercise, matching that. It gives
    a decision guide (a stable prefix and the anchor for almost every
    agent; fitting-in-batches, offloading and compaction for long single
    tasks; tool search for many tools; memory with the source rule and,
    later, scoring/forgetting for repeat users; nothing extra for short
    tasks that already fit) and hands off six open questions to later
    modules (retrieval by meaning to Module 5, guardrails to Module 6,
    measuring task performance to Module 7, sub-agents to Module 8, user-
    facing memory to Module 9, retention/compliance to Module 10). 5 quiz
    cards. Callbacks: this lesson's own previous concept (page link, twice,
    for `run_report` and for folding); Lesson 1's `TurnTracker` concept
    (page link); Lessons 2-11's lesson-level intros (page links); Lesson
    3's and Lesson 4's and Lesson 5's and Lesson 6's specific-figure
    callbacks (page links to the concept that measured each number — no
    subsection named in the mockup's own pointer for any of these, so each
    resolves to the concept page as a whole); and Lesson 10's source-rule
    subsection anchor (`#the-source-rule`, verified against the built
    HTML, reusing the same anchor Lesson 11 already linked). All targets
    confirmed to exist post-build; no numeric claim in this concept needed
    Pyodide verification, since none of them are new — they're citations of
    figures already verified when each earlier lesson's own demo was
    built.

    Concept 1 also gained one bullet after its initial build: the mockup's
    `lesson-4-12-concept-1.md` was updated post-build with a new
    integration rule, "the write path fits the window too" (Lesson 10's
    extraction can't send a long session's whole transcript in one
    request, so it reads the session in chunks with entry numbers kept
    global), added as the last bullet in the-integration-rules subsection,
    linked to Lesson 10's extraction-with-evidence concept page (page
    link, verified against the built HTML — the mockup's pointer names
    only the concept, no subsection).

    Bookends are now built too, from the mockup's
    `lesson-4-12-bookends.md`: an intro (learning outcomes + why-it-matters,
    no callbacks) and a comprehensive `recap-practice` page. 8-question
    comprehensive quiz spanning all three concepts (lesson-number
    references in explanations reworded to descriptive phrases, e.g. "the
    compaction lesson", matching this lesson's established style). The
    comprehensive sandbox is a `MultiFileGradedExercise`: `lib.py`
    (read-only) is the whole module's code in the order it was built —
    Lesson 2's plan/rules helpers through Lesson 11's `ArchiveStore`/
    `forget`, plus this lesson's `anchor_text`/`ContextManager`, and two
    new pieces the sandbox itself needed, `transcript_chunks` and
    `remember_long_session` (Lesson 10's write path, reading a session in
    budgeted chunks instead of one request) — needs `pydantic`. `fake.py`
    combines the base fake client (`ToolUseBlock`/`TextBlock`/
    `ThinkingBlock`/`FakeResponse`/`FakeLLMClient`, via
    `REACT_FAKE_CLIENT`) with the windowed-client upgrade
    (`ContextWindowExceeded`/`WindowedClient`, via `WINDOWED_CLIENT`, both
    from `src/lib/fakeClient.ts`) plus its own `from tokens import
    count_tokens` line, since `WindowedClient.create` calls `count_tokens`
    as a bare name and needs it in its own module's namespace when split
    across real files (concept 2's single-file `SETUP` never needed this,
    since everything shares one namespace there). `tokens.py` is the usual
    `count_tokens`/`_plain` companion. `agent.py` implements `run_session`:
    a fresh `Notes()`/`ResultStore()` per task, this user's `CoreBlock`
    from a `blocks` dict (created once, kept across sessions), a
    `ContextManager` built once per session, the canonical loop, then
    `remember_long_session` with a budget of
    `window - max_tokens - count_tokens(EXTRACTION_INSTRUCTIONS) - 100`
    followed by `forget`. Verified against a real Pyodide instance
    (`pyodide@0.26.4`, real `pydantic`, multi-file `sys.path` setup
    matching `src/lib/pyodide.ts`'s convention): the reference solution
    passes all seven hidden-test assertions (naive-vs-managed on the same
    3,500-token window; every model call, summaries and folds included,
    fits the window with prefix breaks at zero; the history outgrew 3x the
    window and was compacted without losing the task/rule/finding; the
    write path kept the user's instruction and the finding while refusing
    a planted "page the on-call engineer" instruction with no real quote
    behind it; session 2 inherits session 1's instructions, finding and
    edited memory block in its prefix while starting with no notes of its
    own; another user starts clean; forgetting keeps a 60-memory store
    within its 50-item cap without touching the user's standing
    instruction). Two targeted mutations were also verified to fail for
    the right reason, not indiscriminately: an `agent.py` that calls
    Lesson 10's single-shot `remember_session` instead of the chunked
    `remember_long_session` fails immediately with
    `ContextWindowExceeded: prompt is too long: 9,960 tokens > 3,500
    maximum` — reproducing, digit for digit, the exact bug the mockup's
    own "Explanation" section describes finding during its authoring; and
    an `agent.py` that reuses one module-level `Notes()`/`ResultStore()`
    across every session and user (instead of a fresh pair per task) fails
    only test 5's assertion that session 2 starts with no notes of its own
    (`"Your notes:"` leaking in from session 1's shared `Notes`), passing
    tests 1-4 exactly as the correct version does. This confirms the
    hidden tests actually catch the two things the exercise is about
    (window-safe chunked extraction; per-task-scoped `Notes`/`ResultStore`),
    not just "something is different." Callbacks: none new beyond what
    concept 1 and 2 already resolved — the bookends mockup's own callbacks
    live inside `lib.py`'s carried-forward docstrings/comments, already
    covered by those concepts' link resolution.

    Lesson 12 is now **Locked**: all three concepts plus both bookends
    exist and build cleanly.

   **Fix (2026-09-29, found while building Module 5 Lesson 14):** the recap's
   `String.raw` exports wrote backticks as `\``, which `String.raw` keeps, so
   `lib.py` had a literal backslash before backticks in 21 places: docstrings
   (a Python 3.12 `SyntaxWarning` on import) and `parse_candidates`'
   `startswith("\`\`\`")`, which never matched a real code fence, so a
   fenced extraction reply went to `json.loads` unstripped. All are now
   `${"`"}`. Re-verified from the built page: no backslash-backticks left,
   the reference passes, the starter fails, `lib` imports with no
   warnings, and a fenced reply parses. Module 5 Lesson 14 imports these
   files and was re-checked too.

**Module 4 quality pass (2026-09-27).** A full content review, then fixes
made directly in the `.mdx` files. The mockups in `module_mockups/Module 4`
were *not* updated to match, so they now lag the site. The course stays
provider-neutral on purpose: provider specifics appear only as examples.
Every exercise reference and demo in the module was re-run in CPython
under the harness semantics. All references pass, and the only demo output
that changed is the one intended (L10 C1's extraction demo). Changes:
- **Bugs.**
  - `clear_old_results` sliced `successful[len - keep_last:]`. The index
    went negative when `keep_last` exceeded the number of results. It's now
    `max(0, ...)` in all 19 copies (L4, L5, L6, L12), with a new L4 C3 test.
  - L10 C2 hidden test 6 never superseded anything before asserting "already
    superseded is refused", so the reference answer failed its own test. It
    now supersedes first.
  - L10 C1 `derive_source`: a procedural candidate now needs at least half
    of its keywords in its quote, because a real user quote could otherwise
    carry an injected instruction. New test 8 and a sixth demo proposal.
  - L10 C2 `find_duplicate`: skips memories that differ on a new provided
    `negated()`, since "Don't X" otherwise deduped against "X". New assertion
    in test 1.
  - L11 retention clock: `ArchiveStore.supersede` records `superseded_on`,
    and `forget` measures retention from it, not from last use. The C3
    fixture and test 1/2 were adjusted, and the recap test 4 expects week 43.
  - L5 recap: the summarizer only saw cleared placeholders. The scenario's
    agent now states its finding in visible text, and test 1 asserts that
    the *summary request* contains it. New L5 C4 subsection "What the
    summarizer gets to read".
  - L2 C2: new test 7 (reordered argument keys; a success followed only by
    an error).
- **Real APIs vs the course's estimates.**
  - L1 C1: new subsection "Estimates and real counts" (token-count calls,
    usage fields, tokenizer drift). The reply room now covers reasoning
    tokens and the difference between rejecting and silently truncating.
  - L3 C1: new "Using a real cache" subsection (automatic vs marker,
    minimum size, expiry, per-model scope, checking cache reads).
  - L3 C2: the request-order claim is qualified.
  - L12 C2: caveat that the break-even is a result of an input-only cost
    model.
- **Prose corrections.**
  - L2: superseded ≠ wrong; new "Not stale: repeated actions, and
    baselines" subsection; new "Who may set a rule" subsection.
  - L2: the original goal is "least at risk", not "not lost"; the Manus
    structured-variation remedy is added.
  - L8: the "the" claim fixed, the option-letter reference removed, the
    write path named as a fourth decision, episodes vs live state and
    procedures vs L7 reconciled.
  - L10: role ≠ authorship.
  - L11: labelled recall@k/precision@k named; the archive-as-cold-storage
    and deletion scope made honest.
  - L6: line-bounded readers; pinning non-refetchable results.
  - L7: per-area cost; L9: "almost never".
  - L12: prefix-break meaning.
  - Authoring-history text removed from L6 and L12.
  - Plain-prose forward references in L1 and L2 are now links.
- **Not done here:** quiz option-length balancing (deferred until every
  module is drafted). (The L11 year demos that saved memories before the
  week they were learned were fixed afterwards: only C1's weeks 1-2 rows
  and one sentence changed; C2 and C3 print the same output.)

**Module 4 content additions (2026-09-27, same session).** These were
written straight into the `.mdx` files (no mockups) and verified the same
way. The only existing demo whose output changed is L10 C1's (intended).
- **New concepts:**
  - **L7 C4 "Data on demand: letting the agent explore".** A bounded
    `Workspace` (list/grep/read slices), an explore-vs-preload measurement,
    the map-plus-explore hybrid, and what exploring can miss, with a
    `require_reading` dispatcher gate. It has an exercise and five quiz
    cards. The recap moved to `05-recap-practice` and its sandbox gained
    required reading (test 9).
  - **L12 C3 "Seeing inside each request".** A per-request manifest via an
    `Inspected` wrapper (`ContextManager` unchanged), per-section limits
    with `over_budget`, the fixed order of what gives first, and latency as
    extra calls per turn. It has an exercise. "What to leave out" is now
    `04-` and has an ablation demo; the recap is now `05-`.
- **Additions to existing concepts:**
  - L10 C3 `looks_secret` in `admit`, with a demo and test 6, carried into
    the L10/L11/L12 recap libs.
  - L11 C2 "Measuring recall": recall@k/precision@k, a relevance floor, and
    a demo. The exercise is now `ranked` + `evaluate_recall`, so it no
    longer re-types code shown on the page.
  - L9 C1 "Scope is a design decision", with a namespaces demo.
  - L8 C1: framework vocabulary, transcript search, "The user's side".
  - L5 C3 "Testing a summary by asking it questions", a probe demo with
    exact grading.
  - L2 C1 "Four ways a context goes wrong" (Breunig's taxonomy mapped to
    the module).
  - L11 C3 "Merging instead of archiving" (consolidation/reflection).
- **Intros and recaps:** L7, L11 and L12 intro outcomes updated to match,
  with new quiz cards and recap questions throughout.

---

## Module 5 — RAG Systems

Folder `05-rag-systems`. Corpus: `public/data/rag/` (architecture.md §3.1).
All 15 lessons are **Locked** (Lesson 15's recap is the module's last page).
**Citation audit (2026-09-30).** Every outside-source claim was checked
against its primary source; the full per-claim tables are in
[citation-audit/module-5.md](citation-audit/module-5.md). Prose and quiz
text only; no demo or exercise changed. What changed:
- **Corrected:** hosted embedders mostly truncate over-long text by
  default, and only OpenAI rejects it (L3 C1); Chroma's report has no
  "simple splitter as the default" recommendation (L3 C4); the log2(i+1)
  nDCG discount is the common form, not Järvelin and Kekäläinen's (L2 C3);
  Sun et al.'s sliding window was for token limits (L7 C4); both Anthropic
  and OpenAI now cache automatically or at a marked breakpoint (L10 C1);
  LightRAG writes per-entity summaries (L12 C5); GraphRAG's `update`
  command and its quiz card now follow Microsoft's 1.0 post (L12 C5);
  EchoLeak links Aim's disclosure, with the arXiv paper as a later case
  study (L13 C4); OpenFGA offers its two calls as alternatives (L13 C2).
- **Re-labelled:** venues (Ovadia, LaRA, Bruch, Self-RAG, LightRAG, Qu,
  Yoon, Nasr et al.) and preprints (CRAG, the GraphRAG paper, Zeng, the
  two keyword-search papers, olmOCR, ColPali's earlier caveat); Anthropic's
  contextual-retrieval figures as a vendor's, with absolute rates; case
  counts for our own results; the models behind Lesson 15's ledger.
- **Industry sources added** for practice stated without one: OpenAI file
  search's 800/400 default, LangChain's splitters and retrievers,
  LlamaIndex's engines and evaluators, Elasticsearch/Lucene BM25 and RRF
  defaults, Azure AI Search, Weaviate, Qdrant, Vespa, pgvector, Pinecone,
  Cohere's threshold guide, Voyage and Cohere input types, Anthropic's
  caching, prompting and hallucination guides, OWASP LLM08, Microsoft's
  MSRC, GPTCache and LiteLLM; plus Greshake, Ma, Nogueira and Cho, MS
  MARCO, SPLADE, ColBERT and Leiden.
- **Softened:** RRF's k now notes Bruch et al.'s per-list sensitivity;
  "every deployed system", "the usual shape", "most vector stores' default"
  and "a common pattern in production" now say what the source supports.
- **Approved and applied:** filtering after ranking is now presented as
  common but costlier (OpenFGA calls it "the most common approach", and
  over-fetching narrows the gap without closing it), with filtering first as
  the default (L13 C1, its quiz, the recap question, and L13 C2's link text).
- **Concept coverage (second pass):** each concept page and intro was
  checked as a whole. Of 82 pages, 59 were backed, 15 rested on our data
  only and 8 had no source for the technique itself. All 23 are now
  anchored, with 27 prose edits. L1 now names "retrieval-augmented
  generation", with Lewis et al.'s paper for the term. One decision was
  flagged and applied as wording only: L8 C3's round-robin merge is labelled
  as the course's own choice. The table is at the top of
  `citation-audit/module-5.md`.
- **Not recorded:** which Claude version wrote the course's model-written
  data (questions, chunk contexts, query variants, graph extraction). No
  record was kept, so the pages and data files say "Claude" without a
  version, and that stands. Record the version for any data generated from
  now on.
**Final audit (2026-09-29), all against the built site and real Pyodide:**
- **Callbacks:** no `(→ ...)` left in any Module 5 source. Every internal
  link on the 88 built pages resolves to a built page, and all 54 anchored
  links (5 of them inside exercise text, rendered by `LinkedText` with the
  base path) find their `id`. All 20 external links respond; the three that
  return 403 to scripts (two DOIs, Microsoft's LazyGraphRAG post) resolve
  from a browser, and both DOIs redirect to their publishers.
- **Lesson numbers after the Lesson 5 insertion:** no link names a lesson
  other than its target; no mention names a lesson past 14; the 311 prose
  mentions were checked against each lesson's topic, and every flagged one
  (including a targeted check for off-by-one references to Lessons 5 to 9)
  was read and is correct. In all 14 recaps' `lib.py`, section headers run
  in order and every definition sits under the lesson it comes from;
  lesson numbers named in shared code are correct. No other module refers
  to a Module 5 lesson by number.
- **Data:** all 26 files the pages request exist and parse in Pyodide, with
  every embedding matrix matching its keys, unit length and NaN-free; every
  loader runs (the PDF loaders under Lesson 5's own setup, since later
  setups leave that lesson's code out). The five licence notices under
  `rag/licenses/` and the six linked PDF-lesson files aren't loaded as
  data, by design. Packages, loaded from imports as the pages do: Python
  3.12.1, numpy 1.26.4, sqlite 3.39.0 (read-only URI and authorizer
  working), networkx 3.3 (Louvain on the lesson graph) and pydantic 2.7.0
  (Module 4's `m4` imports and builds).

**Content review and accuracy pass (2026-09-29).** A full read of all 88
pages for coverage and accuracy (report kept outside the repo) led to these
fixes, each checked against the lesson's own code or data:
- **L10 recap:** the exercise now sends `system=request["system"]`, and the
  hidden tests check it (architecture.md §4.1).
- **L8:** the recap explanation and intro no longer claim that rewriting
  every question gained nothing. It reached 36 against the router's 34; the
  router is now described as the conservative choice. "Keep the original
  too" now lowers the drift risk rather than removing it.
- **L7:** a planted passage can demote the real answer too, and a high
  rank carries it to the answering model.
- **L13:** uses Module 3's name, the lethal trifecta. Read-only tools and
  rendered answers can still leak (Markdown images, EchoLeak). The
  trifecta doesn't cover planted false facts.
- **L12:**
  - the fixed-schema graph and its traversal are labelled as the lesson's
    own design;
  - the Leiden vs Louvain note is added;
  - global search is described as batched calls rather than one call per
    community;
  - LazyGraphRAG's saving is credited to model-free concept extraction.
- **L2:**
  - the "structural" zeros are softened (the stopword fix gains q21 and
    q31);
  - the count reads 43 labelled of 46;
  - the half-quote "never counted twice" exception (an exact middle cut)
    is noted;
  - the held-out rule now reads "never used to choose a setting", matching
    the later lessons that count over it. No lesson yet reports the final
    held-out number the rule anticipates.
- **L4:**
  - a saved index records its embedding model and settings;
  - some vector stores filter after approximate search;
  - the brute-force arithmetic and scale are corrected.
- **L5:**
  - tagged PDFs and outlines do mark structure;
  - the intro credits 7→9 to image descriptions.
- **L1:**
  - cache lifetime is five minutes by default, with a paid one-hour option;
  - the module map lists Lesson 5.
- **L3:**
  - the heading path isn't searchable until Lesson 9;
  - Chroma's is no longer "the one" study.
- **L6:**
  - tuned weighted score fusion (Bruch et al.) is added as an alternative
    to RRF.
- **L10:**
  - adds the cache minimum size and lifetime;
  - recency boosting is narrowed to the across-the-board case.
- **L11:**
  - the citation-check claim is corrected;
  - caching does cut time to first token;
  - "no single search" and "SQL answers exactly" are softened.
- **L14:**
  - cleared results are still citable but no longer visible to the model;
  - Lesson 10's floor was on the reranker score;
  - retrieval as a tool is justified by the agent choosing when to search;
  - the clearing explanation is corrected;
  - stray `*` at the ends of explanations are removed.

**Prose additions from the same review (2026-09-29).** No new demos,
exercises or quiz cards, only paragraphs:
- **L1:** why fine-tuning doesn't replace retrieval (Ovadia et al. 2023);
  agents that search files with no index, as a third option.
- **L3:**
  - scored and sent pieces can differ (forward reference to Lesson 9);
  - long-input embedders move the input-limit problem to dilution;
  - structure has to be recovered first for PDFs and tables (forward
    reference to Lesson 5);
  - semantic, proposition, LLM and late chunking, with Chroma's and Qu et
    al.'s evidence.
- **L4:** input types as the hosted form of query prefixes; forward
  references to Lesson 7 and HyDE.
- **L6:** standard analysers split `REG-1007`; SPLADE, ColBERT, and where
  hybrid search runs in production.
- **L7:**
  - scores aren't probabilities (forward reference to Lesson 10's
    threshold);
  - current rerankers and the call's shape;
  - pointwise vs listwise, and RankGPT's sliding window.
- **L8:**
  - multi-query vs splitting;
  - dependent parts need multi-hop (forward reference to Lesson 11);
  - an agent writes its own queries, and can ask a clarifying question.
- **L11:** forward references to Lesson 12 (graphs for chains), Lesson 13
  (reader-bound tools, queries written after reading untrusted text) and
  Lesson 14 (clearing old results).
- **Recorded in this file:** the Module 6/7/9/10 promises, and Lesson 15.

**Content additions from the review (2026-09-29).** Written directly in
Claude Code (no mockups, at the author's request), one lesson per commit.
Each lesson's demos and exercises were checked from the page text in the
CPython stand-in (architecture.md §4.1), every new exercise has a
wrong-answer matrix, and every link and anchor was checked against the
build.
- **L2:**
  - where real questions come from;
  - model-written questions and their wording bias (`generated-questions.json`:
    18 of 20 answerable when written in the passage's words, 0 of 20
    paraphrased, against 19 of 43 for the set's own);
  - a model as the relevance judge;
  - nDCG, hit rate and the RAGAS names;
  - Wilson intervals, McNemar and the paired bootstrap;
  - latency and tokens as metrics.
- **L4:**
  - choosing a model beyond one page (MTEB and its limits);
  - vectors from different models don't mix. The mixed pairings still
    answer 19 and 17 of 43, so a mixed index looks like a worse search,
    not a broken one; the reordered control answers 0;
  - the index records what made its vectors;
  - 8-bit and 1-bit storage, 1-bit shortlists rescored with full vectors,
    and Matryoshka.
- **L5:**
  - vision-language models as parsers, with a check against the text layer
    and a comparison table;
  - page numbers kept per chunk (a demo-only helper);
  - ColPali reframed, and single-vector page embedders;
  - DOCX, HTML, PPTX and spreadsheets.
- **L8:** a new concept, "Filters hidden in the question"
  (`05-filters-in-the-question`, with the `validate_filters` and
  `filtered_search` exercise and `query-filters.json`). Filters gain one
  question (32 to 33); a model-written access filter is stripped by the
  schema; a wrong filter hides answers, so the search falls back when
  nothing passes. The recap moved to `06`, and the agents paragraph moved
  from HyDE to the new concept.
- **L10:**
  - quote-backed citations checked by code;
  - built-in citation features (Anthropic citations and `search_result`
    blocks, OpenAI annotations);
  - the threshold confirmed on the held-out questions (run once, with
    nothing chosen on them);
  - partial answers;
  - the recap's `fact_pattern` disagreement flag.
- **L11:**
  - a new concept, "Whether, where and how hard to search"
    (`06-whether-where-and-how-hard-to-search`): adaptive retrieval,
    Adaptive-RAG, CRAG and Self-RAG, a demo of the reranker-score grade
    as a second-attempt trigger (at 0 it catches 4 of 10 failures and
    re-sends 3 of 36 good answers), and choosing between sources,
    including MCP and web search;
  - the recap, moved to `07`, reworked so the agent gets grounding rules as
    a system prompt, cites SQL rows by id, and reports uncited statements,
    declines and answers that cite nothing.
- **L12:**
  - finding where to start, with fuzzy entity linking over the 20 named
    entities;
  - graphs and vectors together (local search, DRIFT, LightRAG, HippoRAG
    1 and 2);
  - a graph database as an agent's tool (text-to-Cypher guardrails);
  - incremental indexing.
- **L13:**
  - the answer as an exfiltration channel, with EchoLeak and an allowlist
    output filter;
  - deletion reaching every derived store (demo on D11);
  - permission changes at the source (a two-layer check, Zanzibar-style
    systems);
  - detection classifiers and their limits;
  - links to Module 3's `as_untrusted` and Module 4's memory poisoning;
  - the recap's graph now built only from indexed documents (a
    quarantined document's edges had reached the tool; test 8).
- **L10 to L14 recap libraries:** `format_source` neutralises a planted
  `</source>` (architecture.md §4.1).

Decided by the author (2026-09-29):
- **Unknown-tool shortcut.** The agent loops that run tools with a bare
  `tools[call.name](**call.input)` stay as they are, each with a one-line
  comment saying a production loop returns an unknown tool or bad arguments
  as an `is_error` result. The loops are: Module 2 Lesson 11's framework
  demo; Module 4 Lesson 6's offloading demo and Lesson 9's recap reference;
  and Module 5's shared `run_agent` (`ragCorpus.ts`, Lesson 11's page and
  the Lesson 11 to 14 recap libraries, kept byte-identical). Module 3's
  least-privilege loop already handles it properly.
- **Position-keyed graph triples.** Lesson 12's "Keeping it current" now
  explains that triples filed under `D11:1`-style positions go silently
  wrong when an edit renumbers chunks, and that filing them under a hash of
  the chunk's text, as Lesson 4 does for vectors, makes the change visible.
  Doing it on a live system is still Module 10's.
- **Cache lifetime.** Module 4 Lesson 3 concept 1 now says five minutes by
  default on Anthropic's API, with longer lifetimes at a higher write price.

1. **Why Retrieval, When the Window Is Huge** — **Locked** (folder
   `01-why-retrieval`; the title comes from the bookends mockup).
   Concept 1 (what the model can't know) is built: the kinds of knowledge a
   model can't have from training, the fix being text in the prompt, the
   corpus introduced with `load_documents()`, and two live demos (corpus
   size by source type; finding the one `REG-1007` row, 37 of 232,241
   tokens). Both demos were verified in real Pyodide 0.26.4 against the
   real `documents.json`, and reproduce the mockup's output exactly. This
   is the first page to load the corpus, via the new `LiveDemo`
   `dataFiles` prop. Concept 2 (what pasting everything costs) is built:
   `everything_cost` (uncached / cached as a fixed prefix) vs
   `retrieval_cost` in Module 4's token-units, live demo table for 1 to
   1,000 questions (verified in real Pyodide, exact match), why the cached
   column is the best case (expiry, a changing corpus, per-permission
   prefixes), and per-turn cost in an agent. The prose's "average section
   is about 115 tokens" was checked against the corpus (2,024
   heading-delimited sections, 115.1 tokens average). Concept 3 (which
   answers better: everything, or the right few) is built, prose and quiz
   only: each approach's failure mode, the DeepMind 2024 (arXiv 2407.16833)
   and LaRA 2025 (arXiv 2502.09977) head-to-head results, what the evidence
   supports, and the benchmark-independent reasons (cost, scale,
   freshness, permissions) plus Self-Route. Figures were spot-checked
   against both papers. Self-Route's "82% answered by retrieval" is from
   v1's table (81.74%); v2 revised it to 76.78% but kept the abstract's
   "65% cost reduction". Links to both papers were added as a sources
   line. Forward references to Lessons 8, 10, 11, 12 and 13 are plain prose
   until those exist. Concept 4 (the pipeline's two halves) is built:
   indexing vs querying, heading-split sections (`SECTION_SEARCH` in
   `ragCorpus.ts`: `split_sections`, `load_sections`, `keywords` with
   backticks as punctuation), an end-to-end demo (1,145 sections, 262
   tokens sent), two failure demos, the module map, and a graded
   `KeywordIndex` exercise (6 tests, test 6 on the full corpus). All three
   demos reproduce the mockup's output exactly in real Pyodide. **Change
   from the mockup:** hidden test 1 rebound `keywords` in the test's own
   namespace copy, which the learner's methods never see, so it failed the
   reference solution. It now patches `KeywordIndex.add.__globals__`
   (architecture.md §4.1). New infrastructure: `GradedExercise` gains
   `namespaceSetup` (hidden helpers exec'd into the learner namespace) and
   `dataFiles`. Bookends are built: intro (3 outcomes, why it matters) and
   recap with an 8-question comprehensive quiz and a multi-file sandbox
   (`lib.py` read-only, the lesson's code; `agent.py` entry:
   `RetrievalAssistant`, indexing in `__init__`, `ask` returning answer,
   sources, `sent_tokens`, `everything_tokens`, with no model call when
   nothing is retrieved). `MultiFileGradedExercise` gained `dataFiles` for
   hidden test 7 (full corpus: 262 tokens sent vs 232,256). Verified with
   the real multi-file harness: the reference passes, the starter fails, and
   eight mutations each fail (re-indexing per question, `content[0]` only,
   no early return, `everything_tokens` without the question, sources as
   dicts, `k` ignored, question placed first, `sent_tokens` counting only
   the passages). `lib.py` was checked line-for-line against the shared
   constants. The mockup's hidden tests shipped unchanged: test 1's
   `lib.keywords` patch works in a real module.

   Lesson 1 is now **Locked**: all four concepts plus both bookends exist
   and build cleanly.

2. **Measuring Retrieval Before Improving It** — **Locked** (folder
   `02-measuring-retrieval`; the title comes from the bookends mockup). Concept 1 (measure before
   you change anything) is built: question words as stopwords fixes
   "What does REG-1007 mean?" (live demo), then the same change over the 43
   main queries with evidence at k=5 answers 19 before and 23 after (five
   gained, q01 lost; live demo); three lessons (set not example, totals
   hide movement, small sets are noisy); measure first, linked to Module
   4's measure-first subsection (anchor verified); retrieval vs answer
   quality (Module 7). Both demos restore `STOPWORDS` and reproduce the
   mockup's output exactly in real Pyodide 0.26.4. Concept 2 (what a
   labelled query set is) is built: five live demos (57 queries by type;
   q21's two evidence groups; a quote cut in two, only the side holding
   half of it counts; q21 not answerable in keyword search's top 5; 127
   quotes each found exactly once), the static `EVALUATION` block (the
   shared helpers, byte-identical to `ragCorpus.ts`, checked by script),
   how the set was built, what it can't score, 4 quiz cards. All demos on
   both pages match the mockups exactly in real Pyodide against
   `queries.json` **v2** (the 127-quote count needs v2's added labels), so
   this conversion synced `public/data/rag/queries.json` from
   `scripts/rag_corpus/queries.json`. Concept 1's figures are unchanged by
   the v2 labels and the shown `is_relevant`. Callbacks to "reading the
   numbers honestly" and "when the labels are wrong" are plain prose until
   those concepts exist. Concept 3 (the metrics) is built: precision@k
   (divides by k), recall@k over evidence groups, reciprocal rank / MRR,
   answerable@k; a hand-worked example; a live demo of the precision
   ceiling (1 to 6 relevant sections per query, best possible
   precision@5 0.456, exact match in real Pyodide); which number to watch,
   linked to Module 1's lost-in-the-middle subsection (anchor verified);
   4 quiz cards; graded exercise (the four metrics plus `evaluate`, six
   hidden tests shipped as in the mockup, shared fixtures prepended to each
   test since every test gets a fresh namespace copy). Verified with the
   real `TEST_HARNESS`: the reference passes (test 6 on the full corpus:
   recall 0.509, precision 0.144, MRR 0.418, answerable 0.442), the starter
   fails all six, and nine mutations each fail (precision over returned
   count, no `[:k]` in recall or reciprocal rank, 0-based rank, recall over
   spans, stale evidence counted, no evidence filter, answerable as any
   part found, search without k). Shared setup in `ragCorpus.ts`:
   `KEYWORD_INDEX`, `EVALUATION`, `RAG_EVAL_DATA`, and `METRICS` (the
   exercise's reference, loaded only on pages after concept 3). Concept 4
   (reading the numbers honestly) is built: three live demos, all exact
   matches in real Pyodide (the keyword baseline at k = 1, 3, 5, 10;
   answerable@5 by query type; the stopword fix's 5 gained / 1 lost with a
   two-sided sign test, 0.22, restoring `STOPWORDS`), the held-out set, 4
   quiz cards. First page to load `METRICS` in its setup. Concepts 1 and
   2's "reading the numbers honestly" mentions now link here (to
   `#which-questions-moved` and `#the-held-out-set`, anchors verified).
   Concept 5 (when the labels are wrong) is built: two live demos, both
   exact matches in real Pyodide (q09 scored against its first-draft and
   reviewed labels, precision@3 0.33 vs 1.00; a 57-query top-20 pool of
   both keyword searches, 1,459 unlabelled sections to judge; both restore
   `STOPWORDS`), pooling and its bias (Zobel 1998, Büttcher et al. 2007),
   what labels can't settle, 4 quiz cards. The prose's claims about the
   v1 to v2 review were checked against the two files: 19 passages added
   across 12 queries (9 main, 3 held out), q09 gained 4, nothing removed;
   the keyword baseline at k = 5 moves only in precision (0.140 to 0.144).
   Concept 2's "When the labels are wrong" now links here
   (`#a-label-that-was-right-and-incomplete`, anchor verified).
   Bookends are built: intro (3 outcomes, why it matters) and recap with an
   8-question comprehensive quiz and a multi-file sandbox (`lib.py`
   read-only, Lessons 1 and 2's code; entry **`harness.py`**, not
   `agent.py`: `compare_searches(search_a, search_b, labelled, k)`
   returning both searches' `evaluate` averages, answerable by type,
   sorted gained/lost ids and a rounded sign-test p-value, main set only,
   each search called once per question). `lib.py`, starter, reference and
   hidden tests were generated from the mockup and checked byte-for-byte
   against it; `lib.py` contains every line of the shared setup the
   lesson's pages ran. Verified with the real multi-file harness
   (`runMultiFileAgainstHiddenTests`): the reference passes (test 5 on the
   full corpus: q05, q09, q20, q21, q31 gained, q01 lost, p = 0.219, about
   0.3 s), the starter fails, and eight mutations each fail (held-out
   questions run, no evidence filter, `evaluate` searching again, gained
   and lost swapped, p-value unrounded, totals counting only answered
   questions, `k` ignored, plus the starter).

   Lesson 2 is now **Locked**: all five concepts plus both bookends exist
   and build cleanly.

   Moved to labels **v3** (2026-09-28; the dense pool's review, 18
   passages across 12 queries, 10 main and 2 held out, checked against
   v2). The site has one labels file, `public/data/rag/queries.json`. Five
   demos' live output changed and matches the update's expected values
   exactly: q21's evidence (group 2 now has four alternatives), 145 quotes
   checked, the precision@5 ceiling (2.6 relevant sections on average,
   0.502), the k table's precision column (0.209, 0.153, 0.093) and the
   pool size (1,454). The other nine demos are unchanged. Concept 3's test
   6 and the recap's test 5 now expect precision 0.153. Prose updated in
   concepts 3, 4 and 5 and the recap quiz (0.46 to 0.50; 0.144/0.088 to
   0.153/0.093; concept 5's pooling-bias paragraphs now describe the dense
   pool's review and the v1 to v3 baseline). Re-verified by script in real
   Pyodide: all 14 demos match, both references pass, both starters fail.

3. **Chunking** — **Locked** (folder `03-chunking`; the title comes from
   the bookends mockup). Concept 1 (why documents are split) is
   built: the chunk is both what's scored and what's sent; three live
   demos, all exact matches in real Pyodide 0.26.4 (documents vs heading
   sections: 119 / median 995 / largest 23,000 / 77 over 512 tokens, and
   1,145 / 107 / 4,301 / 91; the largest section, `postgresql/wal.md` WAL
   Configuration, and 37 sections of 10 tokens or fewer; D06's "Step 4"
   heading and first paragraph, which never say "registry", checked
   against the corpus); embedding input limits and silent truncation; the
   too-large / too-small trade-off; 4 quiz cards. Forward references to
   the next lesson and Lesson 9 are plain prose. Shared setup is Lesson 2's
   recap `lib.py` in full, via the new `SIGN_TEST` export in
   `ragCorpus.ts`. Concept 2 (fixed-size splitting) is built: the shared
   `fixed_chunks` shown as a static block (byte-identical to the new
   `FIXED_CHUNKS` export, checked by script; setup from concept 2 on);
   four live demos, all exact matches in real Pyodide (1,212 chunks at 200
   tokens vs 1,564 / 131% stored with 50 overlap; D07's mid-word cut in
   "`priority`"; 155 of 1,212 chunks with an unpaired code fence; the
   split sentence whole only with overlap, in characters 600-1400); the
   costs of overlap and Chroma's 2024 study, linked (figures checked
   against its tables: 82.4 vs 77.1 recall for TokenTextSplitter 250 with
   all-MiniLM-L6-v2, 88.6 vs 89.2 at 400 with text-embedding-3-large); 4
   quiz cards. The "comparing chunkings fairly" callback links to
   concept 4's page. Concept 3 (structure-aware splitting) is
   built: `split_blocks`, `heading_sections` and `pack_lines` shown as a
   static block (byte-identical to the new `STRUCTURE_HELPERS` export,
   checked by script; setup from concept 3 on); two live demos, both exact
   matches in real Pyodide (Alertmanager configuration's heading paths;
   first_steps' "Downloading Prometheus" section, 7 naive pieces vs 5
   blocks, the 8-line `--help` example kept whole); packing; what every
   chunk carries; 4 quiz cards. The mockup's "## Metrics ... in the
   previous concept" (it was concept 1, not 2) now reads "earlier in this
   lesson" and links to concept 1's `#the-corpus-uncut` (anchor
   verified). Forward references to Lessons 9, 10 and 13 are plain prose.
   Graded exercise (`pack_blocks`, `structured_chunks`; 5 hidden tests,
   starter and tests checked byte-for-byte against the mockup, the `DOC`
   fixture prepended to each test). Verified with the real `TEST_HARNESS`:
   the reference passes (test 5 on the full corpus: 1,968 chunks at 200
   tokens), the starter fails all five, and eight mutations each fail (no
   heading budget, budget without the blank line, single-newline join, no
   heading in the text, chunk numbers per section, big blocks not split,
   heading instead of path, `>=` limit). The reference is the new
   `STRUCTURED_CHUNKS` export, for pages after concept 3 only; it becomes
   `scripts/rag_chunking.py` with Lesson 4's embeddings. Concept 4
   (comparing chunkings fairly) is built: setup now includes
   `STRUCTURED_CHUNKS`. Three live demos, code and output both exact
   matches with the mockup in real Pyodide (four chunkings at k = 5 with
   tokens sent, median sizes and cut code; seven chunkings at 500 / 1,000
   / 2,000-token budgets via `within_budget`, defined in each demo; the
   structured-vs-fixed 200 head-to-head at 1,000 tokens, q18 and q31
   gained, q27 lost, sign test 1.00; about 2 s for the slowest in Node).
   Prose-only figures checked by script: 21 of 43 heading-section top
   results over 1,000 tokens, 3,415 structured-100 chunks, 106 cut-code
   chunks. The module's choice (structured, up to 200 tokens) with chunk
   size left to Lesson 4; Chroma's report linked; 4 quiz cards. "Mixed
   evidence in the previous concept" links to concept 2's
   `#overlap-repeating-the-edges` (anchor verified).
   Bookends are built: intro (3 outcomes, why it matters) and recap with an
   8-question comprehensive quiz and a multi-file sandbox (`lib.py`
   read-only, Lessons 1 to 3's code including `structured_chunks` and
   `within_budget`; entry **`pipeline.py`**: `evaluate_chunker(chunker,
   documents, labelled, budget, max_tokens)` refusing chunks missing or
   empty in `doc_id`/`section`/`access` or over `max_tokens`, scoring main
   questions with evidence at a token budget, returning chunks, largest,
   answered, answerable, tokens_sent). `lib.py`, starter and reference were
   generated from the mockup and checked byte-for-byte against it; every
   line of the setup the lesson's pages ran is in `lib.py`, and its
   `within_budget` is identical to concept 4's. **Change from the
   mockup:** hidden test 4 gains an empty-`access` case, because a
   presence-only check (`field not in chunk`) passed every original test
   although the task says "missing or empty". Verified with the real
   `runMultiFileAgainstHiddenTests`: the reference passes (test 5 on the
   full corpus: structured 1,968 chunks, largest 200, 0.581; fixed 200
   0.558; heading sections refused; about 0.3 s in Node), the starter
   fails, and ten mutations each fail (no evidence filter, held-out
   questions run, no size check, no required-field check, presence-only
   check, top 5 instead of the budget, answerable unrounded, total instead
   of mean tokens, largest in characters, documents counted as chunks).
   Leaving `answered` unsorted still passes, harmlessly: the questions are
   already in id order.

   Lesson 3 is now **Locked**: all four concepts plus both bookends exist
   and build cleanly.

4. **Search by Meaning** — **Locked** (folder `04-search-by-meaning`;
   the title comes from the bookends mockup). Embeddings from
   `scripts/generate-rag-embeddings.py` are committed under
   `public/data/rag/embeddings/` (architecture.md §3.1). Concept 1 (from
   similarity to search) is built: the two halves (linked to Lesson 1's
   pipeline page); vectors computed ahead of time, with the `VECTORS`
   helpers shown as a static block (byte-identical to the export and the
   mockup, checked by script); three live demos, all exact matches in real
   Pyodide 0.26.4 with numpy (1,968 vectors of 384, 3.0 MB, all length 1;
   q01's top three by dot product, 0.774 D14 "Can my agent use the
   biggest model?"; keyword search's top three for the same question);
   cosine as dot product, linked to Module 1's
   `#the-actual-computation` (anchor verified); 4 quiz cards; graded
   `VectorIndex` exercise. Shared setup is Lesson 3's recap `lib.py` in
   full (checked line by line) plus `VECTORS`. **Changes from the
   mockup's hidden tests:** test 4 rebuilds test 3's index (each test runs
   in a fresh namespace copy), and test 3 gains a 20-chunk tie, because
   numpy's default `argsort` passed the original two-way tie
   (architecture.md §4.1). Verified with the real `TEST_HARNESS`: the
   reference passes (test 5 on the full corpus), the starter fails all
   five, and nine mutations each fail (stored or query vectors not
   normalized, unstable sort, numpy float score, stored chunk mutated, no
   count check, no source check, replacing instead of appending,
   ascending order). The reference is the new `VECTOR_INDEX` export, for
   pages after concept 1 only. Concept 2 (queries aren't documents) is
   built: symmetric vs asymmetric models and bge-small's query
   instruction; the `MEANING_SEARCH` helpers shown as a static block
   (byte-identical to the export and mockup; setup from concept 2 on, with
   `VECTOR_INDEX`); three live demos, code and output exact matches in
   real Pyodide (plain vs instructed query cosine 0.936 to 0.980; with vs
   without the instruction, q11 and q46 gained, sign test 0.50; bge-small
   vs MiniLM, q08 and q45 gained, q27 lost, sign test 1.00, using the new
   `RAG_MINILM_DATA`); the real-tokenizer table, checked against
   `embedding-report.json`; prose claims checked (the "Outside those
   hours" quote is in the corpus; keyword search misses q08 at k = 5 on
   both heading sections and structured chunks); 4 quiz cards. Concept 3
   (meaning against keywords, measured) is built: three live demos, code
   and output exact matches in real Pyodide (answered in the top 5 by
   query type, 23 vs 28 of 43, paraphrases 4 vs 8; 8 gained and 3 lost,
   q10 "MON-2002", q20, q43, sign test 0.227; structured 100/200/400 and
   fixed 200 at 500/1,000/2,000-token budgets by meaning, via the new
   `RAG_BGE_ALL_DATA`, about 1 s in Node); the "more than half of
   structured 400's chunks are identical to structured 200's" claim
   checked (844 of 1,378, 61%); the module keeps structured 200; 4 quiz
   cards. No new shared code. Concept 4 (what a vector store adds) is
   built: three live demos, code and output exact matches in real Pyodide
   (saving and reloading the index under `/tmp/vector-store`, 3.0 MB of
   vectors and 1.6 MB of chunks; q41 filtered after vs before ranking for
   an all-staff reader, 3 vs 5 results, D13 confirmed finance-only;
   k-means clusters with 1/2/4/8/32 probes, 2% to 100% scored, 62% to
   100% of the exact top 5 found, about 0.5 s in Node); HNSW explained,
   Malkov and Yashunin linked; the FAISS example as a static code block
   plus output (byte-identical to the mockup), reproduced exactly with
   faiss-cpu 1.15.1 on the committed vectors (96/99/100% at efSearch
   8/16/64); when a plain matrix is enough; 4 quiz cards. No new shared
   code.
   Bookends are built: intro (3 outcomes, why it matters) and recap with an
   8-question comprehensive quiz and a multi-file sandbox (`lib.py`
   read-only, Lessons 1 to 4's code; entry **`retrieval.py`**:
   `FilteredVectorIndex`, a `VectorIndex` subclass whose
   `search(query_vector, k, groups)` filters before ranking, and
   `access_report` over the main set's `access_cases`). `lib.py`, starter
   and reference were generated from the mockup and checked
   byte-for-byte; every line of the setup the lesson's pages ran is in
   `lib.py`. **Change from the mockup:** test 4's labels gain a held-out
   question with an access case, because a report that also ran
   `labelled["held_out"]` passed every original test. Verified with the
   real `runMultiFileAgainstHiddenTests`: the reference passes (test 5 on
   the full corpus: q40 and q41's four access cases as labelled, no D12 or
   D13 chunk reaching an all-staff reader for any main question; about 1 s
   in Node), the starter fails, and nine mutations each fail (filtering
   after ranking, positions not mapped back through `allowed`, query not
   normalized, numpy score, `groups=[]` treated as no filter, `k` ignored,
   groups ignored, held-out questions run, ascending order). An unstable
   sort still passes, harmlessly: the task sets no tie order for filtered
   search.

   Lesson 4 is now **Locked**: all four concepts plus both bookends exist
   and build cleanly.

5. **Documents That Aren't Clean Text** (provisional title) — **Locked**
   (folder `05-document-parsing`; inserted on 2026-09-28). Data: the PDF
   corpus under `public/data/rag/pdf/` (architecture.md §3.1). Shared setup
   is Lesson 4's recap `lib.py` plus the new `PDF_LOADERS`; data
   `RAG_PDF_DATA`. Concept 1 (what a PDF actually contains) is built: the
   loaders shown as a static block (byte-identical to the export and the
   mockup); the four PDFs linked (the mockup's `/data/rag/pdf/files/...`
   links get the site's base path at build, checked in the built HTML);
   three live demos on the stored extraction, code and output exact
   matches in real Pyodide (pypdf's text for P01's first page; pdfplumber's
   fonts and sizes; five tables and two text-free images, and which
   service names are in P04's text); prose claims checked (the page number
   is drawn at the bottom but extracted first, P03's table has 13 weeks,
   auth-service appears only in the diagram); 4 quiz cards. No changes from
   the mockup. The mockup later added `from collections import Counter` to
   the loaders block (for concept 2's `to_markdown`); the export and the
   shown block were updated to match. Concept 2 (cleaning extracted text)
   is built: setup now includes the new `PDF_LINES` (`page_lines`,
   `inside`, `table_as_markdown`, static block byte-identical to the
   export, the mockup and `scripts/rag_pdf.py`); two live demos, code and
   output exact matches in real Pyodide (P01's first lines rebuilt from
   positions; the 45-point margin rule catching exactly each page's header
   and page number); 4 quiz cards; graded `to_markdown` exercise, the
   reference identical to `scripts/rag_pdf.py`. **Change from the
   mockup's hidden tests:** the four tests share a fixtures block
   (`import hashlib`, the helpers and the sample page), since each runs
   alone. Verified with the real `runAgainstHiddenTests`: the reference
   passes (test 4's digests of all four PDFs and P01's five headed
   chunks), the starter fails all four, and nine mutations each fail (body
   size per page, no furniture drop, table words kept, tables ignored,
   every heading `##`, no gap rule, a paragraph run across pages,
   `render_table` ignored, lines joined by newlines); one more, measuring
   the gap after a table from its top, passes and is equivalent, since the
   paragraph is always empty right after a table. The explanation's counts
   checked: plain text makes 3 chunks of P01 and 8 across the four PDFs,
   cleaned 13. **Data fix:** `public/data/rag/pdf/corpus.json` had been
   written in cp1252 (`write_text` without an encoding, on Windows), so it
   wasn't valid UTF-8 and `load_pdf_corpus()` failed; it's rewritten as
   UTF-8, checked identical in content to what the script meant to write,
   and `scripts/generate-rag-pdf.py` now writes and reads with
   `encoding="utf-8"`. The content side sent the same fix, extended to
   every `write_text` in `generate-rag-pdf.py` and `extract.py`; both
   files were replaced with it. Concept 3 (tables for retrieval) is built:
   setup now includes `TO_MARKDOWN` and the new `PDF_TABLES`
   (`table_as_rows`, `pdf_query_vectors`, `contains_facts`, `plain_text`,
   `added_chunks`, `pdf_chunks`, `index_with_pdfs`; static block
   byte-identical to the export and the mockup, and the three shared with
   `scripts/rag_pdf.py` identical to it); three live demos, code and output
   exact matches in real Pyodide (the late rota chunk without its header,
   failing p08's facts; the tiers table three ways; the five table
   questions' ranks in four versions, rows with headers the only one at
   rank 1 throughout); prose claims checked (the tiers summary ranks 7th
   for p07, below its table at 3rd; the rota summary ranks 1st for p08 but
   doesn't state the answer; the summary prompt matches the stored one); 4
   quiz cards. No changes from the mockup. Concept 4 (images for
   retrieval) is built: no new shared code; the pypdf extraction shown as
   a static block with its output (pypdf doesn't run in the browser);
   three live demos, code and output exact matches in real Pyodide (the
   description prompt and the two stored descriptions; the three image
   questions without and with descriptions, p04 and p09 to rank 1 and p05
   still unanswered; the module's 43 questions before and after the PDFs
   join the index, 28 to 27, q11 lost to P01's Incidents section); two
   callbacks linked to verified anchors (Module 1's non-text inputs,
   `#content-becomes-an-array-of-typed-blocks-not-a-plain-string`;
   Lesson 2's incomplete labels, `#a-label-that-was-right-and-incomplete`);
   ColPali (Faysse et al., ICLR 2025) linked, its claims checked against
   the paper (the bias caveat about Claude-3 Sonnet-written ViDoRe queries
   is in v1 to v3's limitations, not the latest version); the chart and
   diagram images linked; prose claims checked (the chart's last bar is
   310 and its peak 4,200; P01's Incidents section describes INC-2093);
   4 quiz cards. **Change from the mockup:** the pypdf output's byte count
   is 40,918, not 47,781, run on the committed PDF with pypdf 6.19.0 (and
   5.9.0, the mockup's version, gives the same); the mockup's figure came
   from its own copy of the PDF, whose chart PNG was drawn by a different
   matplotlib. The name and 1050 x 480 size match. The caption names the
   version used. Concept 5 (scans and layout-aware parsers) is built: no
   shared code and no live demos, all three code blocks static with their
   outputs, as the mockup asks (pypdf, pypdfium2 and Tesseract don't run
   in the browser). The first block's empty text layer was reproduced
   locally (pypdf 6.19.0, pypdfium2 5.13.0); Tesseract isn't installed
   here, so the two OCR outputs weren't rerun, but every word of the
   200 dpi OCR text appears in P02's own text. Docling linked, its claims
   checked against its README (IBM Research, MIT licence, layout, reading
   order, tables, OCR, Markdown and JSON output, local execution); the
   support-tiers PDF linked; 4 quiz cards. No changes from the mockup.
   Bookends are built: intro (3 outcomes, why it matters, verbatim from
   the mockup), 8 quiz cards, and the multi-file `ingest_pdf` sandbox
   (`lib.py` read-only, `ingest.py` entry, data `RAG_PDF_DATA`). `lib.py`,
   starter and reference are byte-identical to the mockup, and `lib.py`
   matches the Lesson 5 setup line for line (Lesson 4's recap `lib.py` plus
   `from collections import Counter` and the Lesson 5 section). Verified
   with the real `runMultiFileAgainstHiddenTests`: the reference passes
   (under a second, including the two whole-corpus indexes), the starter
   fails, and 12 mutations fail. **Change from the mockup's hidden tests:**
   three mutations passed the mockup's tests (early return when *any* page
   is blank, images counted on page 1 only, and "missing of total"
   swapped), since no test document was partly scanned or had more than
   one image. A new test 5 (the old 5 is
   now 6) ingests P01 with page 2 blanked and its image also copied onto
   page 1, expecting `["P01 page 2: no text layer, needs OCR", "P01: 1 of
   2 images not described"]` and some text chunks. Lesson 5 is now
   **Locked**. Inserting it moved the lessons after it up by one: folders
   `06-hybrid-search` to `10-grounded-answers`, every Module 5 lesson number
   of 5 or more in the pages, code and shared files, and the forward
   references to the planned Lessons 10 to 13, which are now 11 to 14. The
   recap sandboxes' `lib.py` headers now read "code from this module's
   earlier lessons", since the new lesson's code won't be in them, and
   their task text says `lib.py` holds "code from this module's earlier
   lessons". The mockup folders moved too (`module_mockups/Module 5/Lesson
   6` to `Lesson 10`), and their files were renamed to match
   (`lesson-5-6-*.md` to `lesson-5-10-*.md`); the mockups' text is unchanged.
   The entries below keep their history as written, renumbered.

6. **Keyword Search and Hybrid Retrieval** — **Locked** (folder
   `06-hybrid-search`, named while the title was provisional; the title
   comes from the bookends mockup). Shared setup is Lesson 4's
   recap `lib.py`, which is exactly the Lesson 4 page setup (`... + VECTORS
   + VECTOR_INDEX + MEANING_SEARCH`, checked line by line in both
   directions); data `RAG_BGE_DATA`. Concept 1 (rare words should count
   for more) is built: IDF from Robertson and Zaragoza (2009, linked);
   three live demos, code and output exact matches in real Pyodide (the
   four words of "What does REG-1007 mean?" with their chunk counts and
   weights; rarity-weighted search still ranking two Prometheus pages
   first, on "mean" plus "what"; the whole set, 23 answered either way, q31
   gained and q01 lost); prose claims checked ("mean" in 6 chunks, all
   Prometheus; the error table says "Meaning", never "mean"; no keyword in
   more than half the chunks, though the heading marker `##` counts as a
   keyword and is in 939 of 1,968); 4 quiz cards. No new shared code.
   Concept 2 (BM25) is built: saturation and length normalisation, two
   live demos (tf / (k1 + tf) at k1 = 1.2, ten mentions worth 2.0x one;
   one mention at a quarter, one and four times average length, 0.66 /
   0.45 / 0.20), both exact matches in real Pyodide; the whole score and
   parameter ranges from Robertson and Zaragoza (linked); `terms` shown as
   a static block (byte-identical to the new `TERMS` export, setup from
   concept 2 on); 4 quiz cards; graded `BM25Index` exercise. **Change
   from the mockup's hidden tests:** tests 3 and 4 build their own
   `index` over `SMALL` and test 6 loads its own `queries`, because each
   test runs in a fresh namespace copy and the mockup's versions borrowed
   them from tests 1 and 5 (the reference failed all three before the
   fix). Verified with the real `TEST_HARNESS`: the reference passes (test
   5: 25 answered, q05 and q09 gained over word overlap, none lost; test 6:
   17 at b = 0 and 26 at b = 0.75 on heading sections; about 2 s in Node),
   the starter fails all six, and eleven mutations each fail (statistics
   over the last batch only, idf without the 0.5s, no length
   normalisation, linear tf, question repeats counted, zero scores kept,
   length in distinct words, rounded score, stored chunk mutated, no
   source check, `keywords` instead of `terms`). The explanation's claim
   checked: for q09, BM25's top five holds D03's v2.3 changelog entry
   fourth and not the error table. The reference is the new `BM25_INDEX`
   export, for pages after concept 2 only. Concept 3 (fusing rankings) is
   built: setup now includes `BM25_INDEX`. Three live demos, code and
   output exact matches in real Pyodide (BM25 and cosine top-5 scores on
   different scales; RRF on "MON-2002", D02's error table first from BM25
   rank 1 and meaning rank 16, and only D02 and D08 contain the code; 27,
   28, 27, 27 answered at k = 1, 10, 60, 100, about 1 s in Node); RRF
   paper linked, and its claims checked against the PDF: the "mitigates
   the impact of high rankings by outlier systems" quote, k = 60 fixed in
   a pilot and not altered, Table 1's MAP values at k = 0/20/60/100/500
   (.2072/.2134/.2145/.2142/.2098), and "outperforms Condorcet, CombMNZ
   and the best system by 4% to 5% on average"; 4 quiz cards. No new
   shared code. Concept 4 (hybrid search, measured honestly) is built:
   two live demos, code and output exact matches in real Pyodide (word
   overlap, BM25, meaning and hybrid at k = 1/3/5/20 with MRR@5: hybrid
   20 at rank 1 vs meaning's 15, MRR 0.702 vs 0.624, but 27 vs 28 at 5 and
   31 vs 34 at 20; by type and question by question, hybrid vs meaning
   gained q10 and q43, lost q04, q08 and q11, sign test 1.00; about 2 s
   each in Node); prose claims checked (BM25 ranks q43's answer first,
   meaning 17th; for q08 and q11 meaning has the answer 4th while BM25's
   top places go elsewhere; INC-2093 appears only in D11's title line,
   never in a structured chunk's text); what to use depending on how many
   results are read; 4 quiz cards. No new shared code. After the
   bookends, one paragraph was added to "What to use, then" (not in the
   concept mockup): weighted RRF as a middle setting, and that a weight
   chosen on the main questions must be confirmed on the held-out set
   (linked to Lesson 2's `#the-held-out-set`, anchor verified). It grounds
   the comprehensive quiz's Q8 and the sandbox explanation's "the lever
   the previous concept suggested", which referred to it before it existed.
   Bookends are built: intro (3 outcomes, why it matters) and recap with an
   8-question comprehensive quiz and a multi-file sandbox (`lib.py`
   read-only, Lessons 1 to 6's code; entry **`fusion.py`**: `fuse`,
   weighted RRF over any number of searches returning a search function,
   and `report`, answered counts overall and by type). `lib.py`, starter,
   reference and hidden tests were generated from the mockup and checked
   byte-for-byte; `lib.py` equals the lesson's page setup line for line in
   both directions. Verified with the real `runMultiFileAgainstHiddenTests`:
   the reference passes (test 6 on the full corpus: hybrid 27, meaning 28,
   BM25 at weight 0.25 28; paraphrases 6/8/7; about 7 s in Node), the
   starter fails, and eleven mutations each fail (weights ignored, ranks
   from 0, chunks keyed by document only, searches asked for n not depth,
   no weight check, zero weight allowed, no-evidence questions counted,
   held-out questions counted, `k` ignored in `report`, ascending order,
   `n` ignored). Keeping the last copy of a chunk instead of the first
   still passes, harmlessly: both copies are the same chunk and the fused
   score replaces theirs. The explanation's claim checked: weight 0.25
   gains q10 and q43 and loses q08 and q11 against search by meaning.

   Lesson 6 is now **Locked**: all four concepts plus both bookends exist
   and build cleanly.

7. **Reranking** — **Locked** (folder `07-reranking`; the title comes
   from the bookends mockup). Data: the cross-encoder scores committed
   under `public/data/rag/rerank/` (architecture.md §3.1). Shared setup is
   Lesson 6's recap `lib.py` (checked line by line) plus the new
   `RERANK_SCORES`; data `RAG_RERANK_DATA`. Concept 1 (two stages) is
   built: why a reranker can't be precomputed, the two stages; the
   `CrossEncoderScores` block shown as a static block (byte-identical to
   the export and the mockup); two live demos, code and output exact
   matches in real Pyodide (the measured GPU timing and its projection to
   30 pairs, the corpus and a million chunks; q09 reranked from search by
   meaning's top 30: one answering chunk in the top 5 before, four after);
   4 quiz cards. **Change from the mockup:** quiz Q4 said "all four
   answering chunks" were in the top 30; there are five answering chunks,
   all in the top 30, of which the reranker lifts four into the top five,
   so it now says "every answering chunk". Concept 2 (why reading
   together scores better) is built: bi-encoders vs cross-encoders, linked
   to Module 1's attention subsection
   (`#the-core-idea-a-weighted-combination-of-every-other-token`, anchor
   verified); two live demos, code and output exact matches in real
   Pyodide (six questions' first answering position before and after
   reranking meaning's top 30: q10 16 to 1, q43 17 to 1, q16 4 to 1, q20 16
   to 5, q08 4 to 6, q44 3 to 14; q08's top two reranked chunks against
   D15's "Quiet hours" answer at -4.99); prose claims checked (the Zen page
   says "wake anyone up"; q44's evidence is about the WAL write location;
   q16's answering chunk never says "registry"); 4 quiz cards. No new
   shared code. Concept 3 (reranking, measured) is built: one live demo,
   code and output an exact match in real Pyodide (BM25, meaning and
   hybrid first stages at no rerank and depths 10/20/30/50, answered at
   rank 1 and in the top 5: hybrid + rerank 30 reaches 22 / 32; against
   meaning alone 6 gained and 2 lost, sign test 0.29; against hybrid alone
   6 and 1, 0.12; about 1.2 s in Node); the module's retrieval becomes
   hybrid with the top 30 reranked; 4 quiz cards; graded `rerank`
   exercise, its explanation's "two stages" callback linked to concept 1's
   `#precise-but-too-slow-for-everything` (anchor verified). **Change
   from the mockup's hidden tests:** test 2 builds its own `search` and
   `results`, which it borrowed from test 1 (each test runs in a fresh
   namespace copy). Verified with the real `TEST_HARNESS`: the reference
   passes (test 5: 15 to 22 at rank 1, 30 in the top 5), the starter fails
   all five, and eight mutations each fail (candidates at k not depth, no
   depth check, ascending, stored chunk mutated, first-stage score kept,
   each candidate scored twice, ties flipped, k ignored). The reference is
   the new `RERANK` export, for pages after concept 3 only. Concept 4 (a
   model call as the reranker) is built: setup now includes `RERANK` and
   the new `LISTWISE_RERANK` (`rerank_prompt`, `parse_ranking`, shown as a
   static block, byte-identical to the export and the mockup); listwise
   reranking and Sun et al. (EMNLP 2023, linked); three live demos, code
   and output exact matches in real Pyodide (q08's top 5 reranked from a
   scripted fake-client reply, 566-token prompt, the first demo alone
   given `REACT_FAKE_CLIENT + RECORDING_CLIENT`; four malformed replies
   parsed; top-30 prompts of 3,180 to 6,324 tokens, median 4,096); a reply
   is untrusted text and the output is only a permutation; 4 quiz cards.
   Bookends are built: intro (3 outcomes, why it matters) and recap with an
   8-question comprehensive quiz and a multi-file sandbox (`lib.py`
   read-only, Lessons 1 to 7's code; entry **`pipeline.py`**:
   `ModelReranker`, a callable class reranking any search's top `depth`
   with one model call, counting `calls` and `prompt_tokens`; hidden tests
   prefixed with `REACT_FAKE_CLIENT + RECORDING_CLIENT`). `lib.py`,
   starter and reference generated from the mockup and checked
   byte-for-byte; `lib.py` equals the lesson's setup line for line.
   **Change from the mockup:** test 3's second text block is now
   `" > [3]"`, not `" > [1]"` (expected order D02, D03, D01), because
   reading only the first text block produced the same order as joining
   them, so the test couldn't catch it. Verified with the real
   `runMultiFileAgainstHiddenTests`: the reference passes (test 6: three
   stages over the full corpus, 43 calls and the exact prompt-token total;
   under a second in Node), the starter fails, and ten mutations each fail
   (candidates at k not depth, no depth check, model called for one
   candidate, first text block only, calls or tokens not counted, the
   first stage's own dicts returned, k applied before ranking, own prompt,
   the model's order ignored).

   Lesson 7 is now **Locked**: all four concepts plus both bookends exist
   and build cleanly.
   At Lesson 8 concept 1, `CrossEncoderScores` changed from
   `stored["timing"]` to `stored.get("timing")` (with a comment), as that
   mockup asked, in the shared export, concept 1's shown block and the
   recap `lib.py`. Re-verified: concept 1's shown block still equals the
   export, its timing demo prints the same, and the recap reference still
   passes. The Lesson 7 mockup files weren't edited.

8. **Better Queries** — **Locked** (folder `08-query-transformation`,
   named while the title was provisional; the title comes from the
   bookends mockup).
   Data: the query variants committed under `public/data/rag/`
   (architecture.md §3.1), model-written for the course and replayed
   through the fake client. Shared setup is Lesson 7's recap `lib.py`
   (checked line by line) plus the new `MODULE_PIPELINE` and
   `REWRITE_QUERY`; data `RAG_VARIANTS_DATA`. Concept 1 (the question as
   asked isn't always the best query) is built: both new blocks shown as
   static blocks (byte-identical to the exports and the mockup); two live
   demos, code and output exact matches in real Pyodide (three rewrites
   replayed through the fake client, that demo alone given
   `REACT_FAKE_CLIENT + RECORDING_CLIENT`; the full pipeline as asked vs
   rewritten, 32 vs 36 in the top 5, q08, q15, q25, q26, q44 gained, q11
   lost, sign test 0.22, about 3 s in Node); the q11 claim checked (its
   rewrite's top five opens with three chunks of Alertmanager's
   `<incidentio_config>`); costs and safeguards of rewriting; 4 quiz
   cards. Concept 2 (follow-up questions) is built: three live demos, code
   and output exact matches in real Pyodide (the three conversational
   questions as asked, one answered; BM25 on q24 with its history glued
   on, answered with the short history and not with two added error-code
   exchanges; the three rewritten with their conversations via the fake
   client, all answered); linked to Module 2's scratchpad subsection
   (`#why-it-has-to-exist-the-model-remembers-nothing-on-its-own`, anchor
   verified); 4 quiz cards. **Change from the mockup:** "all five results
   come from the INC-2041 report" now reads "four of the five", since the
   demo's own output shows D09 four times and D13 fifth. The "three
   incident reports' What we changed sections" claim was checked (D09,
   D12, D11). No new shared code. Concept 3 (splitting questions that ask
   for two things) is built: `split_query` shown as a static block
   (byte-identical to the new `SPLIT_QUERY` export and the mockup; setup
   from concept 3 on); linked to Module 2's goal decomposition
   (`#decomposing-before-executing-anything`, anchor verified); two live
   demos, code and output exact matches in real Pyodide (the three
   multi-part questions split via the fake client; BM25 top 2 as asked vs
   the sub-queries concatenated, q22 and q23 still missing part 2); 4 quiz
   cards; graded `interleave` exercise. **Changes from the mockup's
   hidden tests:** test 5 now loads its own `variants`, `queries` and
   `chunks`, which it borrowed from test 4; test 1 gains `merged == [A1,
   B1, A2, B2]`, because returning altered copies (the task says "the
   chunks themselves, unchanged") passed every original test. The
   explanation's claim checked: q22's first sub-query ranks D14's "Can my
   agent use the biggest model?" first through the full pipeline. Verified
   with the real `TEST_HARNESS`: the reference passes (tests 4 and 5 on
   the full corpus: BM25 split and interleaved answers all three at top 2,
   RRF-fused one; the full pipeline answers two as asked and one split),
   the starter fails all five, and eight mutations each fail (lists
   concatenated, repeats kept, a repeat using a place, no default for no
   lists, k ignored, chunks keyed by document only, altered copies
   returned, only the shortest list's length used). The reference is the
   new `INTERLEAVE` export, for pages after concept 3 only. Concept 4
   (HyDE, and what the model already knows) is built: setup now includes
   `INTERLEAVE` and the new `HYDE` (`hypothetical_document`, static block
   byte-identical to the export and the mockup); Gao et al. (ACL 2023)
   and Yoon et al. (ACL 2025 Findings) linked, the latter's details
   checked against the full paper (seven models; FEVER, SciFact,
   AVeriTeC; worse than baseline for passages without supported
   sentences; "niche or novel knowledge"); three live demos, code and
   output exact matches in real Pyodide (MON-2002 moved from rank 16 to 1
   by a wrong but well-worded passage, via the fake client; search by
   meaning with passages, private 24 to 28 of 38 and public 4 to 5 of 5;
   the full pipeline unchanged at 32 either way, about 3 s in Node); prose
   claims checked (MON-2002 means REGISTRY_UNREACHABLE; the q20 and q36
   passages resemble the labelled guidance; the invented 1,000 per hour
   and 99.9% figures are in the stored passages, and q37 has no answer in
   the corpus); 4 quiz cards.
   Bookends are built: intro (3 outcomes, why it matters) and recap with an
   8-question comprehensive quiz and a three-file sandbox (`lib.py` and
   `stages.py` read-only, entry **`route.py`**: `choose_queries`, one
   model call per question, rewriting follow-ups with their history and
   offering everything else to `split_query`, and `smart_search`,
   interleaving the chosen queries' `search_text` results; hidden tests
   prefixed with `REACT_FAKE_CLIENT + RECORDING_CLIENT`). All five code
   blocks generated from the mockup and checked byte-for-byte; `lib.py`
   matches the lesson's setup line for line except that it merges `from
   collections import Counter` and `... import defaultdict` into one line.
   Verified with the real `runMultiFileAgainstHiddenTests`: the reference
   passes (test 5 on the full labelled set: 43 calls, 32 to 34 answered,
   q25 and q26 gained, none lost; about 3.5 s in Node), the starter fails,
   and nine mutations each fail (no history passed, always split, always
   rewrite, wrong prompt, results concatenated, only the first query, k
   ignored in the merge, the question searched too, `search_text` reached
   through the module so test 4's patch can't replace it). No changes
   from the mockup.

   Lesson 8 is now **Locked**: all four concepts plus both bookends exist
   and build cleanly.

9. **Chunks That Lose Their Meaning Out of Context** — **Locked** (folder
   `09-contextual-chunks`, named while the title was provisional; the
   title comes from the bookends mockup). Data: the headers and contextual chunk
   versions committed under `public/data/rag/` (architecture.md §3.1).
   Shared setup is Lesson 8's recap `lib.py` plus the new `WITH_HEADER`
   and `VERSIONED_PIPELINE`; data `RAG_CONTEXTUAL_DATA`. Concept 1 (chunks
   that don't say what they're about) is built: both new blocks shown as
   static blocks (byte-identical to the exports and the mockup); three
   live demos, code and output exact matches in real Pyodide (the three
   incident reports' ids in 0 of their 4 chunks each; D11's summary with
   its header; plain vs headers through the full pipeline, 22 to 23 at
   rank 1 and 32 to 34 in the top 5, q15, q27, q28 gained, q23 lost, sign
   test 0.62, 15 tokens a header, about 3 s in Node); prose claims
   checked (q15's v2.4 entry ranks first with headers, displacing
   Prometheus's migration guide; q27 and q28 gain their incident
   reports' summaries; the key-rotation steps never say "registry"); 4
   quiz cards. **Change from the mockup:** "one of them crowded the table
   out" now reads "its steps crowded the table out", since the demo's
   data shows two runbook steps (Steps 1 and 3) entering q23's top five
   while the table dropped out. Concept 2 (contextual retrieval) is
   built: setup now includes the new `WITH_CONTEXT` (`with_context`,
   `situate_chunk`, static blocks byte-identical to the export and the
   mockup); Anthropic's contextual retrieval post linked, prompt shown as
   a text block (its tags and braces would otherwise parse as MDX) and
   checked equal to the stored prompt; three live demos, code and output
   exact matches in real Pyodide (D11's timeline with its context via the
   fake client; plain, headers and contexts through the full pipeline,
   32, 34 and 36 in the top 5, contexts against plain gained q08, q25,
   q27, q28 and lost none, sign test 0.12, against headers gained q08,
   q23, q25 and lost q15, 0.62, about 4.5 s in Node; indexing cost, 75
   calls 46,863 units uncached and 22,159 cached, 1,968 calls 14,005,435
   and 2,013,020); prose claims checked (75 internal and 1,893 vendor
   chunks, contexts for exactly the internal ones, 15 internal documents,
   232,241 corpus tokens, contexts averaging 31 tokens, the quoted D07:1
   and D15:4 contexts); 4 quiz cards. **Change from the mockup:** q15's
   loss was explained as the reranker scoring other changelog entries
   above v2.4; the pipeline shows the entry never reaches the reranker
   (BM25 searches "v2" after splitting at the dot, search by meaning
   doesn't find it in its top 100, and it fuses 32nd, outside the 30
   candidates), while the reranker would score it 5.75, above the 1.80 of
   the chunk it ranked first. The bullet now says so. Concept 3
   (returning more than was matched) is built: data `RAG_EXPANSION_DATA`
   (adds bge-small `structured-100` and `fixed-200`); three live demos,
   code and output exact matches in real Pyodide (q05's best 100-token
   chunk is D06 #1 with the answer in #0; 200-token, 100-token and
   whole-section expansion at 500/1,000/2,000 tokens, 26/28/31, 26/28/31,
   25/25/27, about 18 s in Node, so the page says allow twenty seconds;
   structured plain, contexts and fixed windows by half and whole quote,
   about 8 s); prose claims checked (D06 #0 holds "rotated first and
   investigated second"); 4 quiz cards; graded `expand_neighbours`
   exercise. **Changes from the mockup's hidden tests:** tests 5 and 6
   each get their own `queries`, `first_stage` and `within` (test 6
   borrowed them from test 5); test 1 gains `expanded == DOC[1:4]`,
   because returning altered copies passed every original test; test 4
   gains an exact-fit case (budget 30 for three 10-token chunks), because
   `>=` in place of `>` passed every original test. Verified with the real
   `runAgainstHiddenTests`: the reference passes (tests 5 and 6 on the full
   corpus reproduce 26/28/31 against 26/29/32, and fixed windows 27 against
   22 at 500 and 33 against 35 at 2,000; about 18 s in Node), the starter
   fails all six, and nine mutations each fail (skip rather than stop at
   the budget, no dedupe, document edges raising, one-sided window, off by
   one at the far edge, `>=` budget, result before its neighbours, altered
   copies, budget ignored). The reference is the new `EXPAND_NEIGHBOURS`
   export, for pages after concept 3 only.
   Bookends are built: intro (3 outcomes, why it matters) and recap with an
   8-question comprehensive quiz and a two-file sandbox (`lib.py`
   read-only, entry **`prompt.py`**: `strip_added`, the source chunk behind
   a retrieved one with what indexing added kept apart and a `ValueError`
   unless the retrieved text ends with the source text, and
   `prompt_chunks`, source chunks expanded with `expand_neighbours`). All
   four code blocks generated from the mockup; `lib.py` is Lesson 8's recap
   `lib.py` plus a Lesson 9 section and matches the lesson's setup line for
   line except the merged `collections` import, as in Lesson 8. Data
   `RAG_EXPANSION_DATA`. **Change from the mockup's hidden tests:** test 1
   gains a retrieved chunk carrying a `"score"`, which must not come back,
   because returning the retrieved chunk's fields with the source text
   passed every original test (the task says the original chunk's fields).
   Verified with the real `runMultiFileAgainstHiddenTests`: the reference
   passes (test 4 on the full labelled set: 36 answered within 1,000
   tokens, 39 with one neighbour either side, q15, q26 and q30 gained and
   none lost; about 2 s in Node), the starter fails, and eight mutations
   each fail (no integrity check, `added` not stripped, the retrieved
   chunk's fields, no `added` key, window ignored, budget ignored, no
   expansion, `startswith` in place of `endswith`; one more, expanding the
   retrieved chunks rather than the sources, passes and is equivalent,
   since `expand_neighbours` takes every chunk from `originals`). The
   intro's figures checked: the contextual pipeline answers 36 in the top
   five and 26 at rank 1, against 32 and 22 plain.

   Lesson 9 is now **Locked**: all three concepts plus both bookends exist
   and build cleanly.

10. **Answering from Retrieved Context** — **Locked** (folder
   `10-grounded-answers`, named while the title was provisional; the title
   comes from the bookends mockup). Shared setup is Lesson 9's recap `lib.py` plus
   the new `ANSWER_RETRIEVER` and `ANSWER_INSTRUCTIONS`; data
   `RAG_EXPANSION_DATA`. Concept 1 (assembling the request) is built: both
   new blocks shown as static blocks (byte-identical to the exports and the
   mockup); two live demos, code and output exact matches in real Pyodide
   (Lesson 1's `build_prompt` for q35's top five; two requests sharing 20
   tokens, instructions 140 tokens); three callbacks linked to verified
   anchors (Module 4's prefix cache,
   `#the-same-work-done-again-on-every-turn`; Module 1's lost-in-the-middle,
   `#the-lost-in-the-middle-effect`; Module 4's context that hurts,
   `#what-the-evidence-shows`); prose claims checked (D01 says 60 and D08
   says 100 requests per minute, dated 2026-08-18 and 2026-03-02; q35's
   top ten come to 1,138 tokens; the ninth is D13, readable by finance
   only); 4 quiz cards; graded `format_source`/`assemble_request` exercise.
   **Change from the mockup's hidden tests:** test 2 rebuilds the
   `request` and `content` it borrowed from test 1. Verified with the real
   `runAgainstHiddenTests`: the reference passes, the starter fails all
   four, and eleven mutations each fail (budget skipped rather than
   stopped, budget ignored, `>=` budget, budget counting the text only,
   question first, single-newline join, instructions in the message, no
   date, wrong type field, sources mapped to doc ids, ids from S0); one
   more, numbering ids by blocks rather than sources, passes and is
   equivalent. The reference is the new `ASSEMBLE_REQUEST` export, for
   pages after concept 1 only. Concept 2 (citations that point back) is
   built: setup now includes `ASSEMBLE_REQUEST` and the new
   `CHECK_CITATIONS` (`CITATION`, `check_citations`, static block
   byte-identical to the export and the mockup); ALCE (Gao et al., EMNLP
   2023) linked, its "lack complete citation support 50% of the time" on
   ELI5 checked against the abstract; two live demos, code and output exact
   matches in real Pyodide (a scripted answer checked via the fake client,
   every statement cited and every id resolved; three flawed replies, an
   unknown id and an uncited statement flagged, a wrong-source citation
   passing); prose claims checked (S3, the error-code table, never says
   60; S2 is v2.4, which lowered the limit from 100 to 60); 4 quiz cards.
   No changes from the mockup. Concept 3 (abstaining when retrieval is
   weak) is built: setup now includes the new `DECLINED` (`DECLINE`,
   `declined`, static block byte-identical to the export and the mockup;
   the export writes its `\u2019` through an interpolation, because the
   TypeScript build turned a raw `\u2019` into the character itself); two
   callbacks linked to verified anchors (Module 1's hallucination concept,
   `#not-a-malfunction-the-same-mechanism-landing-on-a-wrong-answer`;
   Module 1's constrained decoding, `#a-hard-guarantee-not-a-soft-nudge`);
   three live demos, code and output exact matches in real Pyodide (top
   reranker scores by outcome, 36 retrieved, 7 missed, 3 with no answer;
   the threshold table from -3 to 2; q39's decline via the fake client,
   top score 4.93 on D11's timeline); prose claims checked (q24 and q25
   are the follow-ups; D11's timeline pages the on-call engineer at 14:11
   without naming them; `declined` accepts a curly apostrophe and misses
   "the documents don't mention"); 4 quiz cards. **Change from the
   mockup:** "three of the ten lowest scores belong to questions whose
   answer was retrieved" now reads "four", and "Two of those three" reads
   "Two of those four", since the demo's own output lists q25, q04, q24 and
   q05. Concept 4 (sources that disagree) is built: no new shared code;
   three live demos, code and output exact matches in real Pyodide (q36's
   five sources with dates, types and rate lines, the March monitoring
   guide first and the changelog third; two fixed answers, both passing
   the citation checks, citing dates March only against March, August and
   September; `stated_values`, defined in the demo, finding 60 against 100
   for q35 and q36); prose claims checked (D08 dated 2026-03-02, v2.4
   dated 2026-05-12, D01 and D03 dated 2026-08-18 and stating 60); 4 quiz
   cards. No changes from the mockup.
   Bookends are built: intro (3 outcomes, why it matters) and recap with an
   8-question comprehensive quiz and a two-file sandbox (`lib.py`
   read-only, entry **`answer.py`**: `answer_question`, abstaining below
   the threshold without a model call, otherwise sending
   `assemble_request`'s messages, returning "declined" for a decline and
   "answered" with cited sources and flags; hidden tests prefixed with
   `REACT_FAKE_CLIENT + RECORDING_CLIENT`). All four code blocks generated
   from the mockup; `lib.py` is Lesson 9's recap `lib.py` plus a Lesson 10
   section and matches the lesson's setup line for line except the merged
   `collections` import. The generator writes `lib.py`'s escape through an
   interpolation, and the built page was checked to keep it as an escape.
   Data `RAG_EXPANSION_DATA`. **Changes from the mockup's hidden tests:**
   test 1 gains a score exactly at the threshold, which must be answered,
   because `<=` passed every original test; test 2 gains a one-source
   budget, which must reach `assemble_request`, and a reply with
   surrounding spaces, which must come back stripped, because ignoring the
   budget and not stripping both passed. Verified with the real
   `runMultiFileAgainstHiddenTests`: the reference passes (test 5 on the
   real corpus: q37 abstains without a call, q39 is declined, q35 answered
   with S1 resolved to D01's rate limits; about 1 s in Node), the starter
   fails, and twelve mutations each fail (model called before the
   threshold, `<=` threshold, no check for empty results, first block
   only, k ignored, budget ignored, declines flagged, flags in the wrong
   order, own prompt, the request's sources returned, reply not stripped,
   searching with the question text).

   Lesson 10 is now **Locked**: all four concepts plus both bookends exist
   and build cleanly.

11. **Retrieval as a Tool** — **Locked** (folder `11-agentic-rag`, named
   while the title was provisional; the title comes from the bookends
   mockup). Shared setup is
   Lesson 10's recap `lib.py`, then `REACT_FAKE_CLIENT + RECORDING_CLIENT`,
   then the new `AGENT_SEARCH` (`CORPUS_CHUNKS`, a BM25 `CORPUS_INDEX`,
   `SEARCH_TOOL`, `run_agent`); data `RAG_DATA`, since nothing in the setup
   reads stored vectors (checked in Pyodide with only `documents.json`
   mounted). Concept 1 (from pipeline to tool) is built: the setup block
   shown static, byte-identical to the export and the mockup; two live
   demos, output exact matches in real Pyodide (BM25's top three for
   "REG-1009 rate limited"; the scripted loop searching for the first
   question and not the follow-up); links to Module 2's framework page and
   Module 3's names-and-descriptions page, anchors checked in the built
   HTML; 4 quiz cards; graded `search_documents` exercise, reference
   exported as `SEARCH_DOCUMENTS` for later pages. **Change from the
   mockup's hidden tests:** test 3 gains a no-match query containing a
   single quote, which must come back in `repr`'s double quotes, because
   `'{query}'` passed every original test though the task asks for `repr`.
   Verified with the real `runAgainstHiddenTests`: the reference passes,
   the starter fails all four, and eleven mutations each fail (no strip,
   raising on an empty query, no `int`, no upper or lower clamp, quotes
   instead of `repr`, a single newline between results, `doc_id` alone as
   the id, raising when nothing matches, `k` ignored). Concept 2 (multi-hop
   questions) is built: setup now appends `SEARCH_DOCUMENTS` and the new
   `CONTEXTUAL_SEARCH`, shown as a static block byte-identical to the
   export and the mockup; data `RAG_CONTEXTUAL_DATA` (chunk contexts, and
   everything `AnswerRetriever` reads). Three live demos, code and output
   exact matches in real Pyodide (no chunk contains "INC-2067"; the
   scripted two-hop run on q27 with real searches; the four-way table for
   q27 to q29, where only two hops answer q29). The Lesson 9 link goes to
   "The subject is somewhere else", anchor checked in the built HTML; 4
   quiz cards; no exercise, as in the mockup. No changes from the mockup.
   Concept 3 (searching again, and stopping) is built: no new shared code;
   two live demos, code and output exact matches in real Pyodide (the stuck
   model spending all five steps; the two-hop run's per-call input tokens
   against Lesson 10's single request); the prose's "3 of the 43
   answerable" checked against `queries.json` (q27 to q29 in the main
   set); 4 quiz cards; graded `SearchBudget` exercise, reference exported
   as `SEARCH_BUDGET` for later pages. **Changes from the mockup's hidden
   tests:** tests 2 and 3 reused test 1's `budget` and `calls`, so each now
   starts from the shared fixture and replays the earlier searches it needs;
   test 3 gains a `max_searches=2` budget, because a message hard-coding
   "3 searches" passed every original test. Verified with the real
   `runAgainstHiddenTests`: the reference passes, the starter fails all
   four, and twelve mutations each fail (no normalising, lowercase only,
   limit checked before repeats, `>` for `>=`, raw query recorded, `k`
   dropped, the normalised query searched, query unstripped or normalised
   in the message, a repeat still searching, a repeat counted, "3"
   hard-coded).
   Concept 4 (when the answer is in a table) is built: setup now appends
   `SEARCH_BUDGET` and the new `REGISTRY_DB` (the SQLite snapshot and
   `SQL_TOOL`), shown as a static block byte-identical to the export and
   the mockup; `sqlite3` loads from the setup's import alone. Two live
   demos, code and output exact matches in real Pyodide (the naive tool
   reading `api_keys` and deleting every agent on a throwaway copy; both
   tools routed from one response). Links to Module 3's "The shift in
   thinking" and, in the exercise explanation, "Allowlists: bound what a
   tool can act on", anchors checked in the built HTML. The explanation's
   claim that `ATTACH`, `PRAGMA` and recursive queries come back as "not
   authorized" was checked in Pyodide. 4 quiz cards; graded
   `query_database` exercise, reference exported as `QUERY_DATABASE`.
   **Change from the mockup's hidden tests:** test 3 gains a spy on
   `sqlite3.connect` requiring the `mode=ro` URI, because dropping the
   read-only connection passed every original test (the authorizer alone
   refuses writes), though the task and explanation require both locks.
   Verified with the real `runAgainstHiddenTests`: the reference passes,
   the starter fails all six, and ten mutations each fail (no
   authorizer, no read-only connection, any table readable, functions
   denied, errors raised, no header row, commas between values, every row
   returned without the note, rows uncapped, an empty string for no rows).
   One more, fetching a fixed 21 rows, passes and is equivalent in output.
   **Mockup revision (same day):** the setup block now imports `time`; a
   new subsection, "Guardrails: allow, don't ban", with a live deny-list
   demo (exact match in real Pyodide: `DELETE` refused, `UPDATE` let
   through, an innocent "dropped" search refused) and a link to Module 3's
   "The split", anchor checked; a fifth quiz card; and the exercise gains
   `timeout` via `set_progress_handler`, with a new test 6 (old 6 is now 7).
   The read-only spy in test 3 is kept. **One more change from the
   mockup's hidden tests:** test 6 also times the stopped query and
   requires under half a second, because hard-coding a 1-second deadline
   while reporting the requested timeout passed the message check (the
   unstopped nine-way cross join, 1,953,125 rows, takes about 1.2 s in
   Node). Re-verified: the reference passes all seven, the starter fails
   all seven, and fourteen mutations each fail, adding no progress handler,
   a handler that never stops, the timeout ignored, and an interrupt
   reported as a plain error; the 21-row fetch still passes, equivalently.
   Concept 5 (keyword tools against the full pipeline) is built: setup now
   appends `QUERY_DATABASE`, no other new shared code; data
   `RAG_CONTEXTUAL_DATA` (which includes the query variants). Two live
   demos, code and output exact matches in real Pyodide (the four-way
   table, 25/28/31/36 of 43 in the top five, about 8.5 s in Node; the
   disagreement list, six pipeline-only against one keyword-only, sign test
   0.12). Both papers' claims checked against their full text: arXiv
   2602.23368 (AWS; Claude 3 Sonnet in a ReAct agent with rga and pdfgrep;
   Bedrock baseline with 300-token chunks and top five; RAGAS; averages
   over five datasets of 94.52%, 88.05% and 91.48%; "generally performed
   slightly below"; FinanceBench scored separately, answer correctness
   only, 30.40% against 24.24%; the listed limitations) and arXiv
   2605.15184 (116 LongMemEval questions; Chronos plus Claude Code, Codex
   and Gemini CLI; grep generally higher; scores depending strongly on the
   harness and tool-result delivery). Both paper titles link to arXiv. 4
   quiz cards; no exercise, as in the mockup. No changes from the mockup.
   Bookends are built: intro (3 outcomes, why it matters, verbatim from the
   mockup), 8 quiz cards, and the multi-file `CallBudget` /
   `answer_with_tools` sandbox (`lib.py` read-only, `agent.py` entry,
   hidden tests prefixed with `REACT_FAKE_CLIENT + RECORDING_CLIENT`, data
   `RAG_CONTEXTUAL_DATA`). Starter and reference byte-identical to the
   mockup. **Change from the mockup's `lib.py`:** it was written with the
   lesson numbers from before the PDF lesson was inserted, so its section
   headers read Lessons 5 to 9 and two docstrings said "as in Lesson 5"
   and "Lesson 8's best retrieval"; those seven lines are renumbered to
   match the site (Lessons 6 to 10). Otherwise `lib.py` matches the Lesson
   11 setup line for line, apart from the merged `collections` import, and
   extends Lesson 10's recap `lib.py` exactly, imports aside. **Changes
   from the mockup's hidden tests:** every limit in them was 2 and test 5's
   `max_calls=20` never mattered, so a hard-coded "(2 calls)" and a search
   budget ignoring `max_calls` both passed; test 1 gains a `max_calls=3`
   budget and test 5 requires four recorded calls. Verified with the real
   `runMultiFileAgainstHiddenTests`: the reference passes (about 1 s in
   Node), the starter fails, and fifteen mutations each fail (limit
   checked before repeats, repeats counted, `>` for `>=`, a hard-coded
   limit, budgets shared across questions, one budget for both tools,
   plain keyword search, `max_calls` ignored for either tool, `max_steps`
   ignored, SQL calls listed first, cited ids unfiltered, no unknown ids,
   `stopped` always false, sources unsorted).

   Lesson 11 is now **Locked**: all five concepts plus both bookends exist
   and build cleanly. Lesson 1's forward references to Lesson 11 stay plain
   prose.

12. **GraphRAG** — **Locked** (folder `12-graph-rag`, named while the
   title was provisional; the title comes from the bookends mockup). Shared setup is
   Lesson 11's recap `lib.py` (the Lesson 11 setup through
   `QUERY_DATABASE`), then `REACT_FAKE_CLIENT + RECORDING_CLIENT`; data
   `RAG_CONTEXTUAL_DATA` so far (later concepts will add `graph.json`, and
   networkx 3.3 in Pyodide, architecture.md §3.1). Concept 1 (when
   similarity search is the wrong shape) is built: two live demos, code and
   output exact matches in real Pyodide (the pipeline's top ten on q30 to
   q34, two answered; q30's five evidence groups, two found); the GraphRAG
   paper (Edge et al., arXiv 2404.16130) linked, its "global questions" and
   query-focused summarisation framing checked against the abstract; 4
   quiz cards; no exercise, as in the mockup. No changes from the mockup.
   Concept 2 (extracting entities and relationships) is built: setup now
   appends the new `GRAPH_DATA` (`load_graph_data`, `ALIASES`,
   `canonical`), shown as a static block byte-identical to the export and
   the mockup; data is the new `RAG_GRAPH_DATA` (`RAG_CONTEXTUAL_DATA` plus
   `graph.json`). The extraction prompt is shown as a static block,
   checked identical to `graph.json`'s. Two live demos, code and output
   exact matches in real Pyodide (D04:3's three triples, replayed through
   the fake client; 35 names merging to 29 entities); the Lesson 9 link
   reuses the anchor from Lesson 11 concept 2; 4 quiz cards; graded
   `build_graph` exercise, reference exported as `BUILD_GRAPH`. Verified
   with the real `runAgainstHiddenTests`: the reference passes (35 edges on
   the real extraction), the starter fails all four, and eight mutations
   each fail (no `canonical`, aliases not passed, only the subject made
   canonical, self-loops kept, self-loops checked before merging, the
   relation dropped, repeated sources, unsorted sources). No changes from
   the mockup.
   Concept 3 (answering by traversal) is built: setup now appends
   `BUILD_GRAPH`, no other new shared code. One live demo, code and output
   exact matches in real Pyodide (29 entities, 35 edges; the edges pointing
   at auth-service and at registry-api). The explanation's claims checked
   in Pyodide: auth-service's failure reaches billing_agent, monitoring,
   payments-gateway, registry-api, support_agent and triage_agent; the
   traversal cites 9 chunks for q30; the full pipeline's top ten answers
   q31, q32 and h07 but not q30. 4 quiz cards; graded `affected_by`
   exercise, reference exported as `AFFECTED_BY`. Verified with the real
   `runAgainstHiddenTests`: the reference passes, the starter fails all
   five, and eight mutations each fail (relations ignored, edges followed
   the wrong way, depth-first, the edge's own sources only, the failed
   entity listed, a later route overwriting the first, unsorted sources,
   direct dependents only). No changes from the mockup.
   Concept 4 (communities and summaries) is built: setup now appends
   `AFFECTED_BY` and the new `GRAPH_COMMUNITIES` (`graph_communities`,
   `community_sources`), shown as a static block byte-identical to the
   export and the mockup; its `import networkx as nx` alone loads
   networkx. Three live demos, code and output exact matches in real
   Pyodide with networkx 3.3 (the four Louvain communities, which match
   the mockup's 3.6.1 output; the four stored summaries and their chunk
   counts; the scripted map-reduce over them, 5 calls, 13 source chunks
   holding all of q33's evidence). The prose's claim that SEC-014 comes
   from a security-only report checked (D12's access is `["security"]`).
   Edge et al.'s paper linked again. 4 quiz cards; no exercise, as in the
   mockup. No changes from the mockup.
   Concept 5 (what it costs, and when it's worth it) is built: no new
   shared code, setup as concept 4's. One live demo, code and output exact
   match in real Pyodide (25 extraction calls, 7,876 input tokens; 1,968
   calls and 682,083 input tokens for the whole corpus, 2.94 times its
   232,241 tokens). Claims checked against their sources and linked:
   Microsoft Research's LazyGraphRAG post (indexing "identical to vector
   RAG and 0.1% of the costs of full GraphRAG", all model use deferred to
   query time, comparable quality to GraphRAG global search at "more than
   700 times lower query cost", on 5,590 AP news articles judged by a
   model comparing answer pairs) and Zeng et al. 2025, arXiv 2506.06331
   (two flaws, unrelated questions and evaluation biases; three GraphRAG
   methods' gains "much more moderate than reported previously"). 4 quiz
   cards; no exercise, as in the mockup. No changes from the mockup.
   Bookends are built: intro (3 outcomes, why it matters, verbatim from the
   mockup), 8 quiz cards, and the multi-file `find_dependents` /
   `answer_with_graph` sandbox (`lib.py` read-only, `graph_tool.py` entry,
   hidden tests prefixed with `REACT_FAKE_CLIENT + RECORDING_CLIENT`, data
   `RAG_GRAPH_DATA`). Starter and reference byte-identical to the mockup.
   **Change from the mockup's `lib.py`:** the same stale lesson numbers as
   Lesson 11's recap (headers Lessons 5 to 9, "as in Lesson 5", "Lesson 8's
   best retrieval"), renumbered to match the site; otherwise it matches the
   Lesson 12 setup line for line, apart from the merged `collections`
   import. **Changes from the mockup's hidden tests:** three mutations
   passed them, so test 3 gains a backticked name that must come back
   canonical in the nothing-depends message, test 5 requires the search
   result to be exactly `contextual_search`'s, and a new test 6 makes calls
   across two responses, which must all be listed. Verified with the real
   `runMultiFileAgainstHiddenTests`: the reference passes (about 2.5 s in
   Node), the starter fails, and fourteen mutations each fail (no
   `canonical`, the unknown name unstripped, every entity listed as known,
   known names unsorted, the raw name in the nothing-depends message, the
   listing unsorted, sources joined with spaces, cited chunks unsorted, no
   source chunks, plain keyword search, calls from the first response only,
   cited ids unfiltered, no unknown ids, `max_steps` ignored).

   Lesson 12 is now **Locked**: all five concepts plus both bookends exist
   and build cleanly. Lesson 1's and Lesson 2's forward references to
   Lesson 12 stay plain prose.

13. **Access Control and Poisoned Documents** — **Locked** (folder
   `13-permissions`, named while the title was provisional; the title comes
   from the bookends mockup). Shared setup is
   Lesson 12's recap `lib.py` (the Lesson 12 setup through
   `GRAPH_COMMUNITIES`), then `REACT_FAKE_CLIENT + RECORDING_CLIENT`; data
   `RAG_GRAPH_DATA`. Concept 1 (permissions at retrieval time) is built: two
   live demos, code and output exact matches in real Pyodide (20 of 57
   questions leaking D05, D06, D12 and D13 to an all-staff reader;
   filtering the top five afterwards leaving 20 short and 3 empty); links to
   Lesson 4's "Filtering, and filtering in the wrong place" and Module 3's
   "The shift in thinking", anchors checked in the built HTML; 4 quiz
   cards; graded `PermittedRetriever` exercise, reference exported as
   `PERMITTED_RETRIEVER`. The hint says `AnswerRetriever` is "in the setup"
   rather than "in `lib.py`", since this single-file exercise has no
   `lib.py` tab. **Changes from the mockup's hidden tests:** they shared a
   fixture section and test 1's `first`, so each test now starts with the
   fixtures and test 2 rebuilds `first`; test 2 also gains a `k=3` search,
   because ignoring `k` passed every original test. Verified with the real
   `runAgainstHiddenTests`: the reference passes (5 to 10 s in Node; test 5
   builds three readers' pipelines, and test 1 runs all 57 questions), the
   starter fails all five, and nine mutations each fail (filtering
   afterwards, a tuple cache key, no cache, contextual text returned, no
   `None` for unreadable groups, no score, `k` ignored, an unfiltered
   pipeline, plain chunks instead of contextual ones). Concept 2 (derived
   data carries its sources' permissions) is built: setup now appends
   `PERMITTED_RETRIEVER` and the new `READABLE` (`CHUNK_ACCESS`,
   `readable`), shown as a static block byte-identical to the export and
   the mockup. One live demo, code and output exact match in real Pyodide
   (17 restricted contexts, 2 SEC-014 edges, INC-2093's summary resting on
   2 restricted chunks). Morris et al. (EMNLP 2023, arXiv 2310.06816)
   linked, its 92%-of-32-token-inputs figure checked. 4 quiz cards; graded
   `graph_for_reader` / `summaries_for_reader` exercise, reference
   exported as `READER_VIEWS`. The task adds "already loaded" after
   `readable(chunk_id, groups)`, since the mockup's wording could read as if
   it were one of the two functions to write. **Changes from the mockup's
   hidden tests:** each test starts with the shared fixtures, since each
   runs alone; test 3 gains a summaries dict with two keys in one community,
   because taking the last matching key passed every original test.
   Verified with the real `runAgainstHiddenTests`: the reference passes,
   the starter fails all three, and nine mutations each fail (every source
   kept, an edge needing every source readable, empty edges kept, sources
   reordered, a summary shown if any source is readable, communities or
   sources taken from the filtered graph, no check for a missing summary,
   the last matching key). Concept 3 (retrieved text is untrusted input)
   is built: setup now appends `READER_VIEWS`, no other new shared code.
   Two live demos, code and output exact matches in real Pyodide (the
   planted wiki page W99 ranking first and second in a keyword index; the
   assembled request with W99 as S1 and a scripted reply passing every
   citation check). Link to Module 3's "Two sources of instructions",
   anchor checked in the built HTML; PoisonedRAG (Zou et al., USENIX
   Security 2025, arXiv 2402.07867) linked, its figures checked against the
   abstract (five texts per target question, millions of texts, 90% attack
   success, defences insufficient). 4 quiz cards; no exercise, as in the
   mockup. No changes from the mockup. Concept 4 (defences by design) is
   built: no new shared code, setup as concept 3's. One live demo, code and
   output exact match in real Pyodide (the planted page displacing D08, D01
   and D14 for q21, q35 and q36). Links to Lesson 11's "Guardrails: allow,
   don't ban", Lesson 10's "What each source carries, and what the model is
   told" and Module 3's "One injected instruction needs somewhere to send
   the data", anchors checked in the built HTML. 4 quiz cards; graded
   `IngestionGate` exercise, reference exported as `INGESTION_GATE`.
   **Change from the mockup's hidden tests:** tests 2 and 3 continued test
   1's `gate`, so each test starts with the shared fixtures, and tests 2 and
   3 replay what they need (D01 indexed and W1 quarantined by j.doe, then W1
   approved). Verified with the real `runAgainstHiddenTests`: the
   reference passes (test 4 indexes all 119 documents and keeps W99 out of
   the top five until it's approved), the starter fails all four, and eight
   mutations each fail (the document's own author kept, a pending edit not
   discarded, an edit replacing the indexed version, authors approving
   their own, an unknown source type trusting everyone, approval leaving a
   copy in quarantine, quarantine searchable, a writer trusted for any
   source type). Bookends are built: intro (3 outcomes, why it matters,
   verbatim from the mockup), 8 quiz cards, and the multi-file
   `make_tools` / `answer_securely` sandbox (`lib.py` read-only,
   `secure_tools.py` entry, hidden tests prefixed with `REACT_FAKE_CLIENT +
   RECORDING_CLIENT`, data `RAG_GRAPH_DATA`). Starter and reference
   byte-identical to the mockup. **Change from the mockup's `lib.py`:** the
   same stale lesson numbers as Lessons 11 and 12's recaps, renumbered;
   otherwise it matches the Lesson 13 setup plus `INGESTION_GATE` line for
   line, apart from the merged `collections` import. **Changes from the
   mockup's hidden tests:** three mutations passed them, so a new test 7
   checks incidents in sorted order (with a two-incident toy graph swapped
   in on `secure_tools.GRAPH` and restored), `k` kept between 1 and 10, and
   search over the contextual text ("INC-2067 affected agent" must find
   D10). Verified with the real `runMultiFileAgainstHiddenTests`: the
   reference passes (about 6 s in Node; test 2 searches all 57 questions),
   the starter fails, and thirteen mutations each fail (a `groups`
   parameter, no access filter, every document instead of the gate's, the
   full graph for incidents, no `canonical`, any relation counted as an
   incident, incidents unsorted, no source chunks, `k` unclamped, plain
   chunks indexed, cited ids unfiltered, no unknown ids, tools built for
   the wrong reader).

   Lesson 13 is now **Locked**: all four concepts plus both bookends exist
   and build cleanly. Earlier lessons' forward references to Lesson 13 stay
   plain prose.

14. **Putting It Together: Retrieval in the Context Step** — **Locked**
   (folder `14-context-step`, named while the title was provisional; the
   title comes from the bookends mockup). Shared
   setup is Lesson 13's recap `lib.py` (the Lesson 13 setup through
   `INGESTION_GATE`, without the fake client, which this lesson's mockup
   doesn't list), then the new `CONTEXT_STEP` (`load_context_step` and
   Module 4's matchers, renamed `m4_*`); data the new
   `RAG_CONTEXT_STEP_DATA` (`RAG_GRAPH_DATA` plus `context-step.json` and
   its two bge-small embedding files, architecture.md §3.1). Concept 1
   (what Module 4's keyword matching misses) is built: the matchers shown
   as a static block byte-identical to the export and the mockup; four live
   demos, code and output exact matches in real Pyodide (tool-finding: 5 of
   5 in the tools' own words, 1 of 7 otherwise, by luck; the "on" tie
   across all 40 tools; recall: 5 of 5 and 4 of 7; keyword overlap for
   duplicates, related pairs and contradictions). 4 quiz cards; no
   exercise, as in the mockup. No changes from the mockup. Concept 2
   (meaning alongside keywords, fused) is built: setup now appends the new
   `FUSE_HELPERS` (`text_vectors`, `task_vectors`, `fuse`, `by_meaning`,
   `by_keywords`), shown as a static block byte-identical to the export
   and the mockup. Two live demos, code and output exact matches in real
   Pyodide (tool-finding four ways, fused with keywords 5 of 5 and 4 of 7;
   recall three ways, meaning and fused 5 of 5 and 6 of 7). Link to Lesson
   6's "Reciprocal Rank Fusion", anchor checked in the built HTML. 4 quiz
   cards; graded `hybrid_search` exercise, reference exported as
   `HYBRID_SEARCH`. **Change from the mockup's hidden tests:** each test
   starts with the shared fixtures, since each runs alone. Verified with
   the real `runAgainstHiddenTests`: the reference passes (11 of 12 recall
   tasks), the starter fails all four, and nine mutations each fail (kind
   ignored, every tag required, oldest first, keywords over content only,
   meaning only, keywords only, `limit` ignored with or without a query,
   no newest-first order). Concept 3 (duplicates in different words) is
   built: setup now appends `HYBRID_SEARCH`, no other new shared code. Two
   live demos, code and output exact matches in real Pyodide (similarity for
   every labelled pair; counts at thresholds 0.75 to 0.9). Link to Module
   4's "Contradictions need judgment", anchor checked in the built HTML. 4
   quiz cards; graded `duplicate_candidates` exercise, reference exported as
   `DUPLICATE_CANDIDATES`. **Change from the mockup's hidden tests:** test 3
   reused test 2's `memories` and `vectors`, so it rebuilds them, since
   each test runs alone. Verified with the real `runAgainstHiddenTests`:
   the reference passes (0.967 and 0.858 for "support_agent belongs to
   Priya.", 0.839 for "Tom owns support_agent.", as the explanation says),
   the starter fails all three, and seven mutations each fail (not rounded,
   rounded to 2, strictly above the threshold, kind ignored, least similar
   first, memories without their similarity, the threshold ignored).
   Concept 4 (relevance in the recall score) is built: setup now appends
   `DUPLICATE_CANDIDATES` and the new `SCORE_MEMORIES` (`days_between`,
   `min_max`, `score_memories`), shown as a static block byte-identical to
   the export and the mockup. Two live demos, code and output exact matches
   in real Pyodide (keywords 7 at every relevance weight, meaning 6 at 1
   and 9 from 1.5; r08's score parts at equal weights). Link to Module 4's
   "Three signals", anchor checked in the built HTML. 4 quiz cards; graded
   `recall_scored` exercise, reference exported as `RECALL_SCORED`. **Change
   from the mockup's hidden tests:** each test starts with the shared
   fixtures, since each runs alone. Verified with the real
   `runAgainstHiddenTests`: the reference passes (9 of 10 eligible tasks),
   the starter fails all three, and six mutations each fail (procedures
   competing, weights ignored, `limit` ignored, lowest first, relevance
   only, no check for no candidates). Concept 5 (retrieval in the context
   step) is built. It needs Module 4's code as importable modules, so the
   setup is concept 4's plus `RECALL_SCORED`, then `REACT_FAKE_CLIENT +
   RECORDING_CLIENT` (the demo code uses `ToolUseBlock` and `TextBlock`),
   then `M4_MODULES`, then the new `CONTEXT_STEP_RETRIEVAL`
   (`search_tool_for`, `READ_RESULT_TOOL`, the scripted investigation and
   `run_investigation`), shown as a static block byte-identical to the
   export and the mockup. `M4_MODULES` is the new `pythonModules` helper
   writing `m4.py` (Module 4 Lesson 12's recap `LIB_PY`, imported from that
   page's `.mdx` and unchanged), `tokens.py` (its `TOKENS_PY`) and
   `fake.py` (its fake client plus `RecordingClient`, as the mockup lists)
   to `/m4_modules` on `sys.path`, with `import pydantic` written first so
   Pyodide loads it. Three live demos, checked from the built page's
   serialised props in real Pyodide: code and output exact matches (refused
   at 4,312 tokens without the context step, answered with a clear; the
   last request's two placeholders and `read_result`; 3,000 tokens with
   `keep_last` 2 trimming, 1 clearing), and the written modules identical
   to the recap's files. Link to Module 4's "Putting a number on it",
   anchor checked in the built HTML. 4 quiz cards; no exercise, as in the
   mockup. No changes from the mockup. Bookends are built: intro (3
   outcomes, why it matters, verbatim from the mockup), 8 quiz cards, and
   the multi-file `run_session` / `measure_tool` sandbox (`agent.py` entry;
   read-only `fake.py`, `tokens.py` and `m4.py` imported from Module 4
   Lesson 12's recap page, unchanged, and `lib.py`; hidden tests
   unprefixed, as the mockup says; data `RAG_CONTEXT_STEP_DATA`). Starter
   and reference byte-identical to the mockup. **Change from the mockup's
   `lib.py`:** the same stale lesson numbers as Lessons 11 to 13's recaps,
   renumbered; otherwise it matches the Lesson 14 setup line for line, plus
   concept 5's `search_tool_for` and `READ_RESULT_TOOL` (the scripted
   investigation stays page-only), apart from the merged `collections`
   import. **Changes from the mockup's hidden tests:** test 2 also requires
   `read_result`'s `limit` to reach the store ("lines 0-3 of"), and a check
   before test 4 requires `max_tokens` to reach the context step (the
   steps differ at 1,000), because ignoring either passed every original
   test. Verified against the built page's serialised props with the real
   `runMultiFileAgainstHiddenTests`: the three Module 4 files identical to
   that recap's, the reference passes (about 5.5 s in Node), the starter
   fails, and eleven mutations each fail (the context step rebuilt every
   turn, `keep_last` ignored, no context step, the tool bound to every
   group, only the first call answered, `read_result`'s limit ignored,
   `measure_tool` over the top 10 or with held-out questions, `max_tokens`
   ignored, `window` ignored). **Found and fixed in Module 4:** Lesson 12's
   recap wrote backticks inside its `String.raw` exports as `\``, which
   `String.raw` keeps, so its `m4.py` (and so this sandbox's) had a literal
   backslash before backticks: six docstrings printed a Python 3.12
   `SyntaxWarning` on import, and `parse_candidates`' fence check,
   `startswith("\`\`\`")`, never recognised a code fence. All 21 are now
   `${"`"}` (see Module 4 Lesson 12's entry); this sandbox imports the
   fixed files, and its checks were re-run with the same results.

   Lesson 14 is now **Locked**: all five concepts plus both bookends exist
   and build cleanly, and with it Module 5 is complete.

15. **A Retrieval System for a New Corpus** — **Locked** (folder
   `15-a-new-corpus`, written in Claude Code on 2026-09-29, after the
   module's content review, at the author's request; no mockups). Five
   concepts plus bookends:
   - **1. One question through the whole pipeline.** The indexing and
     querying halves, mapped to the lessons that built each step. A live
     trace of q11, "What happened in INC-2093?", for an all-staff reader:
     - 1,951 of 1,968 chunks readable;
     - BM25 has no answer in its top 100, because none of the four D11
       chunks contains "INC-2093";
     - search by meaning ranks it 4th, fusion 12th, the reranker 2nd, and
       contextual chunks 1st;
     - the best score is 7.53, and the request is 140 tokens of
       instructions plus 5 sources.
   - **2. What each stage bought.** A live ledger on the 43 main
     questions, at rank 1 and in the top 5: word overlap 17/23, BM25 17/25,
     meaning 15/28, fused 20/27, reranked 22/32, contextual 26/36. No
     single step has a sign test below 0.12; the first row to the last is
     +13 -0, sign test 0.0002. Also a table of results measured in other
     lessons (PDFs, rewriting, filters, neighbours, the threshold, agent
     retries, the graph, permissions) and a cost table (at indexing and per
     question).
   - **3. One honest number.** The finished pipeline on the held-out
     questions, run once, with Lesson 10's threshold of 0:
     - top 5: 9 of 10 (Wilson 0.60 to 0.98), against 36 of 43 (0.70 to
       0.92) on the main set;
     - rank 1: 5 of 10, against 26 of 43;
     - the threshold keeps 7 of 9 and declines h09, the one held-out
       question with no answer;
     - h06 is multi-hop and only partly found; h05 and h11 are answered but
       score below 0.

     It explains why the threshold isn't lowered on these questions, and
     points to Module 7 for live traffic.
   - **4. A new corpus, in order.** A quiz-only design guide:
     - first, questions, whether retrieval is needed at all (Anthropic's
       200,000-token guidance, checked; this corpus is 232,241 tokens) and
       permissions;
     - then the baseline;
     - then a table of which misses call for which later stage.
   - **5. Where the module leaves off.** Quiz-only. What Modules 10, 7, 6
     and 9 take over, and semantic caching with its three risks (close in
     meaning isn't the same question, staleness, permissions), set against
     prompt caching.
   - **Recap.** 8 mixed questions, and a multi-file sandbox. `lib.py` is
     Lesson 13's recap `LIB_PY` (imported from that page) plus `wilson`.
     The learner writes `ledger(stages, questions, k)` and
     `final_check(search, labelled, threshold, k)` in `report.py`.
     - 5 hidden tests: fixtures with exact counts, comparison with the row
       before and not the first, no-evidence questions never searched,
       held-out-only searching, and the real corpus (23/17 to 36/26, +13 -0,
       and held-out 9 of 10, (0.6, 0.98), kept 7, declined 1 of 1).
     - The reference passes and the starter fails. A wrong-answer matrix of
       12 all fail with clear messages, including a no-evidence question
       counted through `answerable`'s vacuous `all()`.

   Every demo was checked from the page in the CPython stand-in
   (architecture.md §4.1), all links were checked against the build, and
   Lesson 1's module map gained a line for this lesson.

---

## Module 6 — Reliability

Folder `06-reliability` (module title and description provisional). Data:
`public/data/reliability/` (set E and the four Qwen3.5 runs, generated per
`README-reliability.md`; loaded from Lesson 1 concept 2 on, see
architecture.md §3.1).

**Content review fixes (2026-09-30).** A module-wide quality review found
correctness problems that were fixed directly in the `.mdx`; the mockups were
not updated to match. Every changed exercise was re-verified in real Pyodide
0.26.4. Each reference still passes, every changed exercise's Run output is
unchanged, and wrong variants fail the new tests. By lesson:
- **L1:** C3 separates pass^1 (the average user's experience) from pass^k
  (whether a task can be promised), in the prose and in Q1. C2 now says
  τ-bench's 40+ runs per task were for validating the tasks. Miller's figure
  is now "three or more times". C4's "assumes wordings fail independently"
  was replaced: the product is exact per question.
- **L3:** C2's `check_health_result` rejects numbers sent as text,
  unreadable timestamps and timestamps with no time zone, with 3 new hidden
  tests (16 in all). The demo's `PLACEHOLDERS` includes `None`.
- **L4:** "the small model" is now "the NLI model" throughout. ContraDoc is
  described as contradictions within one document.
- **L5:** C4 no longer says "no practical limit" (15% of 4096-budget replies
  were still cut off). It discloses that most matched-budget thinking was
  truncated, and the different sampling settings.
- **L6:** in C4's pushback exercise, test 3's fixture said "lowered from 100
  to 60", so it rewarded switching to an outdated value. The test now has its
  own source. New prose says `in_sources` checks presence, not support, and
  links L4's support check. C1's demo runbook now lists two agents. C2 notes
  that OpenAI's reasoning models don't return logprobs, reports the 77.6% low
  band, and replaces a quiz distractor that was actually true.
- **L7:** C3 adds the fourth detail, "a step that failed may still have
  taken effect". C4 adds the log's two limits. In the recap `lib.py`,
  `restore()` now logs `restore_model` and `unsupported_claims` skips undone
  calls, so a report that claims a rolled-back move now fails.
- **L8:** timeouts trip breakers: `trips_on=(ConnectionError,
  TimeoutError)` in C3 and the recap, with a new recap test. C3 notes the
  simple half-open, and failure-rate windows. C1 says to classify errors by
  type, not by HTTP status. C4 notes that a pinned ID doesn't pin the
  serving stack, and that with a floating alias you compare against the
  evaluated snapshot.
- **L9:** a tool is labelled by where its arguments go, so `fetch_url` is
  `untrusted` + `external`. The C2 table row now reads "only reads, and
  nothing it's given leaves the system", with a paragraph on outbound reads
  and rendered links and images. C2 has a new hidden test. "Security tooling
  enforces exactly this" is now "some tooling".
- **L10:** three layers catch nothing alone, not two: the read-back as well.
  The session guard's stand-in person no longer reads `scenario.harmful`; it
  approves everything. Every demo and the recap produce identical output.

**Coverage additions (2026-09-30).** These were written directly as `.mdx`,
with no mockups, per the user. Each claim is backed by published research or
frontier-lab and practitioner writing, plus a measurement on the committed
runs where one was possible. Every new demo and exercise was verified in
real Pyodide 0.26.4.
- **L4 C2:** new NLI threshold sweep, which shows that raising the bar only
  adds false flags (4 → 12 of 40) until 0.97, since the one false pass had
  96% entailment. New subsection "Judges have habits": Zheng et al. on order
  and length, Panickssery et al. on self-preference (links Module 2's
  shared-blind-spots page), Kim et al., Hamel Husain, and Anthropic's
  agent-evals guide. It adds a local test: on its own drafts the 4B judge was
  stricter than the 9B (24 vs 9 of 33 disagreements), so these runs show no
  self-preference. 2 quiz cards.
- **L5:** new concept 6, "Better than a plain vote"; the recap is now
  `07-recap-practice`. It covers four things:
  - stopping at a lead of 2 (2B 96.9% with 2.24 samples vs 97.0% with 5;
    Adaptive-Consistency);
  - voting across wordings (the average doesn't move, 96.6% → 96.7%; it
    breaks the e68/e21 lock-in but hurts e83; DiVeRSe, Kim et al.);
  - choosing with a check (a sources check helps e41 at 78% → 100% but
    false-flags derived answers, e83 at 84% → 6%; Cobbe with the peak at
    400, Lightman, Snell);
  - voting on the tool call before it runs (MAKER).

  Also a graded `decide_by_vote` exercise (6 tests), 5 quiz cards, outcome 1
  extended and 2 recap questions.
- **L6 C2:** new subsection "Measuring a signal on your own cases":
  - AUROC for the answer-line probability (2B 0.53), agreement in a vote of 5
    (2B 0.86) and the judges' verdict probability (0.95);
  - a review-vs-catch threshold sweep (under 0.9: 18% reviewed, 21 of 23
    caught);
  - links Module 5's threshold concept; 2 quiz cards.

  `ANSWER_PROBABILITY` and `VERDICT_PROBABILITY` were split out of the demos
  so they can be preloaded; the output is byte-identical.
- **L7:** new concept 5, "When the agent games the check"; the recap is now
  `06-recap-practice`. It covers specification gaming and reward hacking
  (DeepMind, Lilian Weng, the Claude 3.7 and 4 system cards, OpenAI's CoT
  monitoring, METR, ImpossibleBench), with three scripted runs that all pass
  "error rate under the threshold". Habits: invariants, protected tools, a
  way out, and reviewing how. Graded `review_run` exercise (5 tests), 5 quiz
  cards, outcome 3 extended and 1 recap question.

- **L2:** new concept 5, "When checks add up"; the recap is now
  `06-recap-practice`.
  - False blocks compound across checks (five at 2% stop 9.6% of fine
    runs), so a run-level limit gets divided among the checks.
  - Base rates: the share of blocks that are real (8% to 92% for the same
    check), tied to L6's measured 21 of 66.
  - Checks that fail together: the 2B and 4B are both wrong 2.3x as often as
    independence predicts, and 6 of the 4B's 8 missed questions are the 2B's
    too; Kim et al., Goel et al., Module 2's blind spots.

  4 quiz cards, and outcome 3 extended. The recap explanation now notes the
  plan's run-level 5.9% false blocks, and the recap has a new base-rate
  question.
- **L10 C3:** new subsection "What the stack costs together": the stack
  blocks 2 of 8 while no layer alone blocks more than 1; latency adds up
  (judge on the answer path, approval waits); and the suite can't show
  shared blind spots or run-to-run variation (pass^k). 1 quiz card.

- **L9:**
  - C1 has a new subsection, "Taint spreads through what the model writes".
    It names taint tracking and information-flow control, contrasts
    per-session labels with CaMeL's and FIDES's per-value labels, and demos
    a summary laundered into a clean session unless its labels travel with
    it (links Module 4's source rule). 1 quiz card.
  - C3 adds what dual LLM and CaMeL leave open, and a new subsection,
    "Splitting the work": the utility cost of labels that only accumulate,
    an LLM map-reduce demo (isolated readers return one word from a fixed
    set, checked in code), and context-minimization. 2 quiz cards.
  - Outcome 1 is extended, and the recap has a new question.

- **L1 C2:** two new subsections.
  - "How many questions are enough?": Miller's power analysis and
    Anthropic's summary. The demo spends the same 420 replies two ways:
    84 questions × 5 runs gives an interval 7.0 points wide, against 9.9
    for 21 × 20, so spend on questions, with at least k runs for pass^k.
  - "Not every failure costs the same": the 4B's 18 failures are mostly
    "unknown" (10), the 2B's mostly wrong answers (106 of 119). Cites Kalai
    et al. (OpenAI 2025) on accuracy-only scoring rewarding guessing, with
    the SimpleQA table. Links L2's false refusals and Module 5's abstaining.

  2 quiz cards.
- **L3:**
  - C1 notes that secrets usually arrive in tool results.
  - C3 adds redacting a secret as a certain repair.
  - C4 has two new subsections. "Streaming: the user is the side effect"
    covers the OpenAI SDK's output guardrails running after completion and
    NeMo's default of streaming a chunk before checking it, with a demo of
    both orders. "When the check itself fails" covers fail safe vs fail
    secure (Google's *Building Secure and Reliable Systems*), with a demo of
    time limits and fail closed/open, where failing open is logged.
  - 2 quiz cards; outcome 3 extended.

- **L8:**
  - C1 has two new subsections. "Falling back in the middle of a run"
    covers Anthropic's echo-the-assistant-turn rule (a 400 if rebuilt), the
    400 for non-default temperature on Claude Opus 4.7 and later, and
    prompts not transferring, so fall back at a turn boundary. "A fallback
    that's never used" cites Gabrielson in the AWS Builders' Library:
    exercise the backup continuously.
  - C4 has a new subsection, "Pinned models retire": Anthropic's lifecycle
    states, 60 days' notice, and upgrading on purpose, gated by evaluations.
  - New concept 5, "A time budget for the whole run"; the recap is now
    `06-recap-practice`. It covers the Tail at Scale fan-out example (19%
    of 20-call runs hit a slow call in the simulation), Brooker's "retries
    are selfish" and deadlines (per-call timeouts from the run's budget),
    and hedged requests (p99.9 19.0 s → 2.7 s for 5.5% more calls; only for
    calls without side effects).
  - 7 quiz cards; outcomes 2 and 3 extended; 1 recap question.

- **L10 C3:** new subsection "Breaking the tools on purpose": chaos
  engineering (Basiri et al., Principles of Chaos) and ToolEmu. It injects
  faults (empty record, nulls, cut-off JSON) into two fine scenarios'
  read tools. As built, the trimmed result check crashes on cut-off JSON
  and misses an empty lookup record; swapping in Lesson 3's full result
  check catches all six. 1 quiz card.

Held back from that review, fixed the same day: L8 recap's `call_model` now
takes `(model, system, prompt)`, so the system prompt `record_run` hashes is
the one the model was sent (two new tests: the model receives it, and the
record's hash matches it). L10's intent check now also requires `set_model`'s
`model` to appear in the request or a successful tool result, and the
"invented argument" scenario names the agent ("Move research_agent to its new
model."), so it's caught by the model rule rather than by the missing name.

**Citation audit (2026-09-30).** Every outside-source claim in the module
was checked against its primary source; the full per-claim tables are in
[citation-audit/module-6.md](citation-audit/module-6.md). All the open items
below were reached and verified. Prose and quiz text only; no demo or
exercise changed. What changed:
- **Corrected (the source said something else):** Miller's "three times"
  is about grouped questions, not repeated runs (L1 C2, its quiz, the
  recap); Panickssery et al. now cite the NeurIPS version, where people
  did *not* rate the summaries equal (L4 C2); Tian et al.'s comparison was
  against sampled answer probabilities (L6 C2 and its quiz); ImpossibleBench's
  biggest drop came from hiding the tests (L7 C5 and its quizzes); a METR
  quiz distractor that was one of METR's own explanations; Sethi's 45% is
  dishonest answers, including made-up refusals (L8 C2); breakers let a
  set number of trial calls through (L8 C3); Beurer-Kellner's co-authors
  (L9 C3); ToolEmu finds risky agent actions, and doesn't inject faults
  (L10 C3); MAKER votes with at least three calls per move, and discards
  over-long samples too (L5 C6).
- **Updated to the latest version:** Kalai et al. now cites *Nature* (2026)
  and its own SimpleQA figures (63.2/16.0/20.8 vs 2.6/20.6/76.8, 3.7× the
  errors); METR's 59/15 is labelled as the first version, plus the latest
  4–6× range; OR-Bench is 0.89 (ICML 2025).
- **Re-labelled:** venues (Zheng, Snell ×3, Lightman, Sclar, τ-bench,
  Kapoor, FrugalGPT, OR-Bench, METR, SCoRe, Wu et al.) and preprints
  (Cobbe, USC, Ord, Zhu, Miller, Beurer-Kellner, FIDES); "concluded" →
  "suggested" (Cobbe); the DeepMind definition is now a direct quote.
- **Industry sources added:** Anthropic's agent-evals guide (pass^k,
  broken tasks, balanced sets), OpenAI's agent guide (tool risk ratings),
  SimpleQA's three grades, Microsoft's Saga and Compensating Transaction
  patterns, AWS Well-Architected, Terraform's automation guide,
  Resilience4j, gRPC's retry design, Hugging Face/vLLM `revision`, NeMo
  Guardrails' masking, Arize (a second model family as judge), Microsoft's
  reasoning-model parameter list, and Anthropic's approval-fatigue figure.
- **Still to check:** CaMeL's published IEEE SaTML 2026 figures (the page
  cites arXiv v2); Zhu et al.'s review status. Oso's docs moved, so L9 C1
  cites a February 2026 archived copy.
- **Approved and applied:** L7 C3 now teaches a conditional compensation
  ("set it to standard if it's still priority", the dry-run concept's
  compare-and-set applied to the undo); L9 C2 adds Meta's reply to
  Willison, that the second property covers any sensitive system.
- **Concept coverage (second pass):** each concept page and intro was
  checked as a whole. Of 56 pages, 42 were backed, 4 rested on our data
  only and 10 had no source for the technique itself. All 14 are now
  anchored, with 16 prose edits and no decisions needed. The table is at the
  top of `citation-audit/module-6.md`.

1. **Why Agents Fail, and What "Reliable" Means** — **Locked** (folder
   `01-per-step-reliability`, named before the title existed). Concept 1 (small errors
   compound over many steps) is built: *p*ⁿ and three live demos (the
   compounding table, the per-step reliability a 90% task needs, and a
   seeded simulation of recovery and clustered difficulty), METR's
   time-horizon study and Ord's reanalysis (59 against 15 minutes), where
   the model breaks, and 5 quiz cards. All three demos reproduce the
   mockup's output exactly in real Pyodide 0.26.4. Callbacks: Module 3's
   attacker calculation (`#mitigations-help-but-aren-t-boundaries`,
   verified against the built HTML) and Module 2's tool-errors-as-
   observations concept (page link). One quiz fix: the mockup's Q1
   distractor read "About 75%" but its explanation treats 75% as the
   failure rate, so the option now reads "About 25%, since 25 steps at 3%
   failure each add up to 75% failure". Concept 2 (the same question, run
   twice) is built: the first page to load the Qwen3.5 runs, via the new
   `src/lib/reliabilityData.ts` (`LOAD_RUNS` shown verbatim as a static
   block). Five live demos (e41's 13/7 split, how its replies open,
   per-question clustering for both models, naive vs question-bootstrap
   intervals, the paired sign test at 1.3e-07) all reproduce the mockup's
   output exactly in real Pyodide 0.26.4 against the committed `plain` and
   `plain.smaller` runs; the prose's claims about runs 1 and 5 and "none
   cut off" were checked against the reply texts. The sign-test demo
   preloads `SUCCESSES`, since demos don't share state. Callbacks: Module
   1's predicts-not-knows, greedy-vs-sampling and nondeterminism concepts
   (page links), concept 1's `#where-the-model-breaks` and Module 5
   Lesson 2's `#which-questions-moved` (where the sign test is; both
   verified against the built HTML). 5 quiz cards. Concept 3 (reliability
   as pass^k) is built: pass@k vs pass^k, τ-bench, the C(c,k)/C(n,k)
   estimator, per-task averaging vs mean ** k (made-up agents, then the
   real `plain`/`plain.smaller` runs), reading a pass^k curve, 5 quiz cards,
   and the lesson's first graded exercise, `pass_hat_k(results, k)`. All
   four demos reproduce the mockup's output exactly in real Pyodide 0.26.4.
   The mockup's hidden tests were split into 7 self-contained tests (each
   runs in its own namespace copy); verified in Pyodide from the page's own
   strings: the reference passes all 7, and every wrong turn the
   explanation names fails, with exactly the first-test values it quotes
   (0.25, 0.4167, 0.6111, 0.3333), as do skipping short tasks, pooling runs
   across tasks and omitting the checks. Callbacks: Module 1's
   nondeterminism concept (page link), concept 1's
   `#where-the-model-breaks` and concept 2's
   `#failures-cluster-on-particular-questions` (verified against the built
   HTML). Concept 1's prose was later revised from its mockup (τ-bench's
   30-action cap, cascading early mistakes, METR on adapting to mistakes);
   its Q1 fix stands. Concept 4 (reliable across wordings) is built:
   Sclar et al., Mizrahi et al. and τ-bench on phrasing sensitivity,
   accuracy by wording and the four questions that swing 50+ points, e41's
   four wordings, pass^10 across all wordings (4B 0.937 -> 0.881, 2B 0.707
   -> 0.488), and checking the wording before blaming the model (the
   e09 "scope" story, confirmed from the v2 run in git history: 9 unknown,
   1 right). All three demos reproduce the mockup's output exactly in real
   Pyodide 0.26.4 against the committed `plain`/`wordings` runs (v3
   wordings) for both models. New shared `BY_WORDING` in
   `reliabilityData.ts` (by_wording + rate, verbatim from the first demo)
   preloaded for the two demos that reuse them. Callbacks: concept 2 and
   Module 5 Lesson 2's when-the-labels-are-wrong concept (page links, as
   the mockup names no subsection). 4 quiz cards. Concept 5 (where agents
   fail, and where each failure is handled) is built, prose and quiz only:
   τ-bench's failure analysis (55/25/19% of 36), Zhu et al.'s
   AgentErrorTaxonomy and error propagation, a 13-row map from each failure
   to where the course handles it, and a four-step routine for a failed
   run. All 11 links in the map resolve in the built HTML, including the
   `#a-deterministic-check-on-real-state` and
   `#sycophancy-a-real-documented-side-effect` anchors; later Module 6
   lessons (3 to 9) are named as plain text, since they don't exist yet.
   5 quiz cards. Bookends built from `lesson-6-1-bookends.md`: an intro
   (3 outcomes, why-it-matters) and a `recap-practice` page with an
   8-question comprehensive quiz (Q2's explanation names the pass@5 formula
   instead of "the last option", since options are shuffled) and a
   `MultiFileGradedExercise`: read-only `lib.py` (load_run,
   task_pass_hat_k, pass_hat_k, question_bootstrap) and `report.py`'s
   `reliability_report(log, k)` over the real `plain`/`wordings` runs of
   both models. Verified in real Pyodide 0.26.4 with real imports: the
   reference's Run output matches the mockup byte for byte (4B 98.6%,
   97.4-99.5%, pass^5 0.904, 7 unreliable; 2B 92.0%, 88.8-94.7%, 0.564, 37
   unreliable), the hidden tests pass, and eight wrong variants each fail
   with the intended message (pooled accuracy, original wording only,
   pooled wordings, worst wording, a per-question run-count check,
   bootstrap in log order, `<= 0.5`, no k check). The page's code strings
   were generated from the verified files and compared byte for byte.

2. **Accuracy, Latency, Cost, and False Refusals** — **Locked** (folder
   `02-reliability-tradeoffs`, named before the title existed). Concept 1 (four things every
   technique trades) is built, prose and quiz only: accuracy, latency, cost
   and false refusals; Kapoor et al. on accuracy without cost; OR-Bench,
   XSTest and AgentDojo's two-defence table on false refusals; the
   report-every-check-as-a-pair habit; and a nine-row table of the module's
   levers by lesson (later lessons named as plain text). Callbacks: Lesson
   1's pass^k concept (page link) and Module 5 Lesson 10's
   `#choosing-a-threshold` (verified against the built HTML). 5 quiz cards.
   Concept 2 (what reliability costs, on things already built) is built:
   the reflection loop's calls and tokens counted with recording clients
   (1 / 2 / 4 calls, ~26 / 86 / 197 tokens sent), Huang et al. on
   self-correction, Module 5's reranker latency, and the committed runs'
   latency probes (one sample 0.48 s, five samples 0.86 s, thinking 11.21 s,
   medians over 10 questions). Both demos reproduce the mockup's output
   exactly in real Pyodide 0.26.4, against the exact `fakeClient.ts` classes
   and the committed `plain`/`thinking` runs; the prose's ratios were
   checked. New shared setup in `reliabilityData.ts`: `EVALUATOR_LOOP_COST`
   and `LOAD_RUN_ONLY`, shown verbatim as static blocks and written by
   script so the f-string's `
` escapes stay literal (checked in the
   source and the rendered HTML). Callbacks: concept 1, Module 2's
   evaluator-optimizer and shared-blind-spots concepts, Module 5's
   reranking-measured concept (page links), Module 5's
   `#what-reading-together-costs` (where the 3.55 ms figure is; the mockup
   named only the concept) and Module 1's autoregressive-generation
   concept. 4 quiz cards. Concept 3 (equal budgets need a stated unit) is
   built: the five budget units and Kapoor et al.'s scientist/builder
   split, five options from the committed runs costed in tokens,
   GPU-seconds and wait (three different orders), Kapoor et al.'s Table A1
   frontier by plain dominance, two cautions, 5 quiz cards, and a graded
   `pareto_frontier(options, cost_key)` exercise. Both demos and the
   starter's printout reproduce the mockup's output exactly in real
   Pyodide 0.26.4 (the cost demo against the `plain.smaller`,
   `thinking.smaller`, `plain` and `stronger` runs). The mockup's tests
   were split into 5 self-contained tests: the reference passes all 5, and
   seven wrong versions each fail at least one (a fixed "tokens" field, no
   strict-improvement clause, strict on both, the single-pass sort the
   explanation warns about, sorting by cost only, no ValueError, and the
   bare starter). The frontier demo's f"${...}" is written as `${"$"}{` in
   the String.raw template, and every template was evaluated in JS to
   confirm it round-trips to the verified Python. Callback: Lesson 1
   concept 2's `#how-sure-can-we-be-of-these-numbers` (verified against
   the built HTML). Concept 4 (spend reliability where the risk is) is
   built: why uniform checking fails, Snell et al. and Kapoor et al.'s
   escalation as evidence for uneven spending, the four properties that
   make a step risky, checking at the point of no return, and an
   expected-value rule demo (net 0.77 checking everything vs 3.64 checking
   only where it pays, made-up numbers). The demo reproduces the mockup's
   output exactly in real Pyodide 0.26.4. Callbacks: this lesson's concept
   1 and Lesson 1's concept 1 (page links), and Module 3 Lesson 11's
   `#not-all-tools-carry-the-same-risk` (verified against the built HTML).
   4 quiz cards. Bookends built from `lesson-6-2-bookends.md`: an intro
   (3 outcomes, why-it-matters) and a `recap-practice` page with a
   7-question comprehensive quiz and a `MultiFileGradedExercise`:
   read-only `lib.py` (concept 3's `pareto_frontier`) and `plan.py`'s
   `plan_agent(steps, max_latency, max_false_blocks)` on made-up
   measurements. Verified in real Pyodide 0.26.4 with real imports: the
   reference's Run output matches the mockup byte for byte (total cost
   9.0, latency 2.8 s), the hidden tests pass, and eight wrong versions
   each fail with the intended message (frontier before filtering,
   choosing from every allowed option, exclusive limits, no name
   tie-break, a ValueError without the step name, most-accurate or
   cheapest everywhere, totals over every allowed option). The page's
   code strings were generated from the verified files and compared byte
   for byte.

3. **Checks in the Loop** — **Locked** (folder `03-checks-in-the-loop`;
   the bookends confirmed the title). Concept 1 (where a check can
   sit in the loop) is built: the four hook points (before a model call,
   on a tool call, on a tool result, on the final answer) with what each
   can and can't catch, `Checks` and `run_checked_agent` (Module 2's loop
   with a check at each point; a failed tool check becomes an `is_error`
   observation, a failed input or answer check stops the run), a
   migration demo where three scripted mistakes are caught (an empty
   lookup, an unrequested change, a key in the request), and the OpenAI
   Agents SDK's matching guardrails. The demo reproduces the mockup's
   output exactly in real Pyodide 0.26.4 against the real `fakeClient.ts`
   classes. New shared `CHECKED_AGENT` in `reliabilityData.ts`, shown
   verbatim as a static block; the demo's `rk-` regex was written by
   script and checked to round-trip through String.raw. Callbacks (all
   verified against the built HTML): Lesson 2's concepts 4 and 1
   (`#a-refusal-can-be-a-reliability-failure`), Module 2's ReAct pattern
   (`#the-fix-gather-every-tool-call-act-on-all-of-them-reply-once`) and
   tool-errors-as-observations, Lesson 1's concept 5, and Module 3's
   validate-and-return-failures concept. 4 quiz cards. Concept 2
   (checking a tool result before the model reads it) is built: silent
   tool failures (Sun et al., Sethi et al.'s preprint), what a result
   check looks for, a `check_agent_record` demo on five hand-written
   results, the false-block traps ("nothing found" and zero), 4 quiz
   cards, and a graded `check_health_result(output, now)` exercise. The
   demo and the starter's printout reproduce the mockup's output exactly
   in real Pyodide 0.26.4. The mockup's test block was split into 13
   self-contained tests (each repeats the shared helpers); verified from
   the page's own strings: the reference passes all 13, and nine wrong
   versions each fail the test aimed at them (falsiness instead of `is
   None`, `>=` at exactly 15 minutes, an exclusive error-rate range,
   raising instead of returning, no stale check, missing fields not
   named, no p95 range check). Known gaps, not bugs: the bare starter
   passes the 5 "should pass" tests, and dropping `isinstance` still
   passes all 13 (only a non-container like `42` would need it; no test
   sends one). Callbacks: Module 2's tool-errors-as-observations (page
   link) and Module 3 Lesson 3's
   `#useful-error-messages-say-what-failed-and-what-to-do-next` and
   `#the-fix-return-structured-data-as-json-text` (verified against the
   built HTML). Concept 3 (what a failed check does) is built: the four
   responses (block and tell, repair, retry, stop) with their cost when the
   check is wrong, the research behind each (Sethi et al., Kapoor et al.'s
   retry baseline, AgentDojo's aborting detector), repairing only what's
   certain, retrying only what can safely repeat, and choosing by where the
   check sits. The repair demo reproduces the mockup's output exactly in
   real Pyodide 0.26.4. One quiz fix: Q2's explanation named options by
   letter ("only C is certain"), which breaks when options are shuffled, so
   it now names them by content. Callbacks (all verified against the built
   HTML): concept 2, Lesson 2's concepts 1
   (`#a-refusal-can-be-a-reliability-failure`), 3 and 4, and Module 3
   Lesson 4's retry concept and its `#retrying-a-write-can-do-it-twice`.
   4 quiz cards. Concept 4 (running checks in parallel, and tripwires) is
   built: in-line vs side-by-side checks with a timing demo, speculative
   work and the side-effects rule (the OpenAI Agents SDK's parallel vs
   blocking input guardrails), 4 quiz cards, and a graded async
   `guarded(step, checks, has_side_effects)` exercise. The demo (timings
   included) and the starter's printout reproduce the mockup's output
   exactly in real Pyodide 0.26.4. **The mockup's hidden tests were broken
   in the course harness:** their `run()` helper called `asyncio.run(...)`
   inside a plain `def`, which the harness's textual `asyncio.run(` ->
   `await (` rewrite turns into a SyntaxError, so the reference scored 0/6
   in the real `TEST_HARNESS`. Fixed by making `run` an `async def` called
   as `asyncio.run(run(...))` at top level (identical in plain Python); the
   page's own test strings then score 6/6 for the reference through the
   real harness, and six wrong versions each fail the test aimed at them
   (the `gather` shortcut, no cancel on a trip, checks in line before the
   step, a side-effecting step run alongside, first failure in list order,
   no `finally`). Logged in architecture.md 4.1. Tests split into 6
   self-contained tests, one per numbered section. Callback: Module 3
   Lesson 4's concurrent-tool-calls concept (page link). Bookends built
   from `lesson-6-3-bookends.md`: an intro (3 outcomes, why-it-matters) and
   a `recap-practice` page with a 7-question comprehensive quiz and a
   `MultiFileGradedExercise`: read-only `lib.py` (the fake client classes
   and `CHECKED_AGENT` verbatim, the registry tools, four checks and seven
   labelled scripted runs) and `measure.py`'s `measure(cases, checks)`,
   which counts each check point's catches, misses and false blocks.
   Verified in real Pyodide 0.26.4 with real imports: the reference's Run
   output matches the mockup byte for byte (the scope check shows one
   catch, one miss and one false block), the hidden tests pass, and six
   wrong versions each fail with the intended message (mutating the given
   Checks, counting firings not runs, a fired-set or tools shared across
   runs, miss and false block swapped, no zero rows). The reference's
   docstring backticks and `lib.py`'s `` regex are escaped for
   String.raw, and every template was evaluated in JS to confirm it equals
   the verified file. The explanation's callback is a real link, rendered
   by `LinkedText`.

4. **Verifying an Answer Against Its Sources** — **Locked** (folder
   `04-verifying-claims`; data from the second offline run,
   `README-verification.md`). Concept 1 (checking each claim against the
   source it cites) is built: Liu et al. on verifiability (51.5% / 74.5%),
   FActScore and sentence-level splitting, the shared `LOAD_VERIFICATION`
   (`split_claims` byte-identical to `scripts/reliability/claims.py`),
   q27's draft with its wrong first claim, the Ragas-style support prompt
   and Qwen3.5-9B's verdicts, all 145 drafts under both judges (286/104/21
   vs 271/119/21, 357 of 390 agree), the decontextualization flag on q04,
   and why dropping a claim can mislead. All five demos and the starter's
   printout reproduce the mockup's output byte for byte in real Pyodide
   0.26.4 against the committed run 2 files. 5 quiz cards and a graded
   `verify_claims(claims, sources, judge)` exercise (`LOAD_VERIFICATION` as
   `namespaceSetup`, for the starter's `split_claims`); the mockup's tests
   were split into 4 self-contained tests, and through the real
   `TEST_HARNESS` the reference passes all 4 while seven wrong versions
   each fail (the bare starter, `any([...])` without early stop, zero-based
   numbers, bad only if every number is bad, uncited counted as
   unsupported, every source must support, judging before the citation
   checks). Callbacks: Module 5's citations-that-point-back concept, Lesson
   3's what-a-failed-check-does and Lesson 2's
   spend-reliability-where-the-risk-is (page links, as the mockup names no
   subsection). Concept 2 (checking the checker) is built: why a judge must
   be measured (Zheng et al., Arize, AttributionBench), set V's three pair
   kinds on v36, the three judges on the 120 support pairs (9B 40/0/0, 4B
   37/0/0, NLI 36/1/0 passed as restated/altered/other source), the exact
   rule-of-three bound (7.2% / 3.7% / 7.2%, counting facts not pairs), why
   built pairs are the easy end (33 of 390 real disagreements), and per-pair
   cost (11.8 / 7.3 / 1.7 ms). All four demos and the exercise's Run output
   reproduce the mockup byte for byte in real Pyodide 0.26.4 against the
   committed `support.*` and `nli` runs; the prose's figures (one in eight,
   seven times cheaper, 8.5%) were checked. 5 quiz cards and a graded
   `score_checker(labels, verdicts)` exercise over the real verdicts. Its
   task says "when you click Run", but single-file exercises had no Run
   button, so `GradedExercise` gained an opt-in `runnable` prop
   (architecture.md 4.1), also turned on for concept 1's exercise, whose
   starter prints a report too. Tests split into 4 self-contained tests;
   through the real `TEST_HARNESS` the reference passes all 4 and seven
   wrong versions each fail (the bare starter, rates over the total, 0
   instead of None, no empty check, no length check, flags and passes
   swapped, agreement as a count). Callbacks: concept 1 (page link), Lesson
   2's `#a-refusal-can-be-a-reliability-failure`, Lesson 1's
   `#how-sure-can-we-be-of-these-numbers` (both verified against the built
   HTML) and Lesson 2's equal-budgets concept (page link). Concept 3
   (sources that disagree) is built: beyond Module 5's one-phrase check
   (its "sixty calls a minute" / per-hour caveat confirmed in its page),
   ContraDoc, the three judges on the 120 statement pairs (9B 35/0/0, 4B
   25/0/0, NLI 32/0/7 called contradictions, as altered/reworded/
   compatible), the 9B's five misses (three arguably the set's labels), the
   NLI model's near-certain false alarms on unrelated pairs, and the
   subject filter that keeps pairwise checking affordable. All three demos
   and the starter's printout reproduce the mockup byte for byte in real
   Pyodide 0.26.4 against the committed `statements.*` and `nli` runs. 4
   quiz cards and a graded `find_conflicts(statements, related, judge)`
   exercise (`runnable`; `LOAD_VERIFICATION` as `namespaceSetup` also gives
   the starter its `re`). Tests split into 3 self-contained tests; through
   the real `TEST_HARNESS` the reference passes all 3 and six wrong
   versions each fail (the bare starter, both orders, including self,
   judging every pair, counting only conflicts as calls, statements instead
   of indices). Callbacks: Module 5 Lesson 10's
   `#a-targeted-check-for-facts-that-matter` and
   `#giving-the-model-what-it-needs-to-choose` (verified against the built
   HTML). Concept 4 (figures traced to tool results, in code) is built,
   with no run data: a scripted two-tool conversation whose answer has two
   ungrounded facts (940 against 840, and `claude-sonnet`, correct but
   looked up by nothing), `FACT_ID`/`NUMBER` with ids taken out before
   numbers, `tool_results_in` skipping `is_error` results, matching by
   value (2.3% = 0.023, 1,212 = 1212), and the derived-number and
   non-fact false flags. The demo and the starter's printout reproduce the
   mockup byte for byte in real Pyodide 0.26.4 (the demo preloads
   `LOAD_VERIFICATION` for its `re`), and the hint's `1.1 / 100` claim was
   checked. 4 quiz cards and a graded `ungrounded(answer, tool_results)`
   exercise (`runnable`). Tests split into 8 self-contained tests; through
   the real `TEST_HARNESS` the reference passes all 8 and nine wrong
   versions each fail the test aimed at them (the bare starter, exact string
   matching, `==` instead of `math.isclose`, no percentage-as-fraction, ids
   left in the answer or in the results, no dedupe, `sorted(set(...))`, the
   `%` stripped). Callbacks: Lesson 3's where-a-check-can-sit and
   checking-a-tool-result concepts (page links) and
   `#the-loop-with-a-check-at-each-point` (verified against the built
   HTML); "this lesson's first concept" stays plain text, as the mockup
   doesn't mark it. Concept 5 (questions built on a false premise) is
   built from the committed `premises` run and set F: the marker counts
   (59/238 of 400 false premises rejected, 11/48 true ones), three
   "answered" replies that did rebut the premise, a 30-reply hand-labelled
   sample (22 C / 5 I / 3 W, with an assertion that each was counted
   "answered"), and three true-premise "rejections" (marker used as "no", a
   real misreading, a cut-off reply quoting the instruction). All four
   demos reproduce the mockup's output exactly against the committed data;
   later demos preload the run silently via a `PREMISES_SETUP`. Read-only,
   5 quiz cards, no graded exercise. Callbacks: Module 1's
   `#sycophancy-a-real-documented-side-effect`, Lesson 1's
   `#is-it-the-model-or-the-wording` (verified against the built HTML) and
   this lesson's concept 2 (page link). Concept 6 (claims with no source
   to check) is built, with no run data: Chain-of-Verification's four
   steps, the paper's 17% vs. ~70% and 0.17 to 0.36 figures, and the
   joint / two-step / factored comparison, with a read-only demo that
   builds the joint and factored prompts (no model call) and counts which
   see the draft and what each costs; its output matches the mockup
   exactly. 4 quiz cards, no graded exercise. Callbacks: Lesson 2's
   `#reflection-the-calls-are-certain-the-benefit-isn-t` (verified against
   the built HTML) and Module 2 Lesson 9's shared-blind-spots concept (page
   link). Concept 4's `NUMBER` was later tightened to
   `\d+(?:,\d{3})*`, so a number followed by a comma ("1212, 5") no longer
   keeps the comma; all 8 tests and the demo still pass in Pyodide 0.26.4.
   Bookends are built: the intro (outcomes, why it matters), an 8-card
   comprehensive quiz (options shuffled by `QuizGroup`; the mockup puts
   every answer on B), and a `MultiFileGradedExercise`, `review(answer,
   sources, judge)` in `review.py` over a read-only `lib.py` (the lesson's
   `split_claims`, `verify_claims`, `ungrounded`, plus `drafts()` and
   `recorded_judge(model)` over the committed `drafts` and
   `draft-support.*` runs, passed as `dataFiles`). In real Pyodide 0.26.4
   the reference passes the hidden tests and its Submit output matches the
   mockup (89 of 145 flagged; unsupported 73, uncited 20, ungrounded 10; 4
   for ungrounded alone), and six wrong versions each fail the assertion
   aimed at them (the starter, grounding on the raw answer, reasons out of
   order, no ungrounded reason, `flagged` as a list, judging every cited
   source instead of using `verify_claims`). The first hidden-test block's
   two assertions were swapped from the mockup's order so grounding on the
   raw answer gets the citation-number message, not a generic one. The
   lesson title, provisional until now, is the bookends'.

   Lesson 4 is now **Locked**: all six concepts plus both bookends exist
   and build cleanly.

5. **Self-Consistency and Voting** — **Locked** (folder
   `05-voting`; data: set E and the `plain` / `plain.smaller` runs from
   Lesson 1). Shared setup `LOAD_VOTING` in `reliabilityData.ts`, shown
   verbatim in concept 1, with `extract_answer`, `normalize` and
   `as_number` identical to `scripts/reliability/grading.py`. Concept 1
   (voting on exact answers) is built: self-consistency (Wang et al., +17.9
   on GSM8K) and Chen et al.; e73's answer forms as written vs. as numbers;
   votes of 3/5/9 against one sample (2B 92.9% to 97.1% at 5; 4B 98.9% to
   99.7%), averaged over 200 random draws (about 2.4 s in Pyodide). All
   three demos reproduce the mockup's output exactly in real Pyodide 0.26.4.
   4 quiz cards and a graded `majority_answer(replies, answer_type)`
   (`runnable`, `namespaceSetup={LOAD_VOTING}`); tests split into 6
   self-contained tests, each repeating the `reply` helper. Through the real
   `TEST_HARNESS` the reference passes all 6 and prints the mockup's
   `{'answer': '2', 'votes': 18, 'counted': 18}`, and nine wrong versions
   each fail (the starter, raw-string keys, counting every reply, returning
   the normalized key, alphabetical or last-seen tie-breaks, empty text
   voting, no empty case, last-written form). Callback: Lesson 1's
   same-question-run-twice concept (page link). Concept 2 (when voting
   helps, and when it hurts) is built: the 2B's vote of 9 by question group
   (51 always right; 24 at 80-95% to 100%; 7 at 50-79% to 98.4%; e21 and
   e68 from 20% to 0.2%), Chen et al.'s rise-then-fall, Condorcet's
   independent-voter table, e21/e68's favourite wrong answers (199 of 200
   votes), and pass^5 (80.5% to 97.0%; 0.05% to 0.00% on the two hard
   ones). All four demos reproduce the mockup's output exactly in Pyodide
   0.26.4; the prose's "about 88%" was checked (the middle group's mean p
   is 0.686, giving 88.3%). Later demos preload the first via
   `PER_QUESTION_SETUP`. Read-only, 4 quiz cards, no graded exercise.
   Callbacks: Lesson 1's same-question-run-twice and pass^k concepts (page
   links). Concept 3 (agreement as a confidence signal) is built: Xiong et
   al. on stated vs. consistency-based confidence; votes of 5 by agreement
   for both models (2B unanimous 78.4% of votes, right 99.6%; 2-2-1 right
   50.7%); the unanimous-but-wrong votes all from e21 and e68; and a
   threshold as a check with Lesson 2's two numbers. Both demos reproduce
   the mockup's output exactly in Pyodide 0.26.4 (the second preloads only
   the first's definitions via `VOTES_OF_SETUP`, so it needs just the 2B's
   run); the prose's 21.6% was checked. 4 quiz cards and a graded
   `trade_off(votes, min_agreement)` (`runnable`, no data); tests split
   into 5 self-contained tests, each repeating the `votes` it uses. Through
   the real `TEST_HARNESS` the reference passes all 5 and prints the
   mockup's three lines, and eight wrong versions each fail (the starter,
   `>` for `>=`, wrong_caught over all votes, right_escalated over the
   escalated, 0 instead of None twice, crashing on no votes, counting
   accepted wrong votes as caught). Callbacks: concept 2 and Lesson 4
   concept 1 (page links); "Lesson 6's subject" and "Lesson 2's two
   numbers" stay plain text, as the mockup doesn't mark them. Concept 4
   (voting, thinking, or a stronger model, at equal budget) is built from
   the `plain.smaller`, `thinking.smaller`, `plain` and `stronger` runs:
   options by tokens actually generated (vote of 3/5/9 against thinking
   budgets 84/253/759 and up to 4096), cut-off vs. finished thinking by
   budget, the sign test and question bootstrap on each matched pair, and
   the 4B and 9B answering once. All four demos reproduce the mockup's
   output exactly in Pyodide 0.26.4, each run the way the page runs it (a
   fresh namespace after its own setup: `MEAN_SETUP`, `OPTIONS_SETUP`,
   `COMPARE_SETUP`); the slowest takes about 1.3 s. The prose's "nearly
   four times the GPU-seconds" was checked against Lesson 2's formula
   (3.8x). Read-only, 4 quiz cards, no graded exercise. Callbacks: Lesson
   2's equal-budgets concept and its `#five-options-three-units`, concept 2,
   and Lesson 1's `#how-sure-can-we-be-of-these-numbers` (verified against
   the built HTML). Snell et al. stays unlinked, as in the mockup. Concept
   5 (free text: when there's nothing to count) is built from Lesson 4's
   `drafts` run: q27's five drafts (five different answers), universal
   self-consistency's selection prompt and a `chosen` parser (no model
   call), and consensus favouring the four drafts' shared `claude-sonnet`
   mistake (checked by reading the drafts in full). Both demos reproduce
   the mockup's output exactly in Pyodide 0.26.4; the second preloads the
   first via `DRAFTS_SETUP`, and they fetch only `drafts.json`. Read-only,
   4 quiz cards, no graded exercise. Callbacks: Lesson 4 concept 1 and
   Lesson 3's where-a-check-can-sit concept (page links). Bookends are
   built: the intro (outcomes, why it matters), a 7-card comprehensive
   quiz, and a `MultiFileGradedExercise` with `decide(replies, answer_type,
   min_agreement)` and `evaluate(records, questions, k, min_agreement)` in
   `policy.py` over a read-only `lib.py` (the loaders and `extract_answer`,
   `normalize`, `as_number` and `is_correct`, identical to `grading.py`,
   plus concept 1's `majority_answer`, identical to its reference), with
   `dataFiles={reliabilityData("plain.smaller", "plain")}`. In real Pyodide
   0.26.4 the reference passes the hidden tests and its Submit output
   matches the mockup's eight lines (2B unanimous-only: escalate 21.7%,
   accepted right 99.6%). One assertion was added to the mockup's hidden
   tests: grading by string comparison instead of `is_correct` passed all
   of them, so a group whose winner is written "7 days" now checks that it
   counts as the number 7. With it, ten wrong versions each fail (the
   starter, agreement from `counted`, `<=` for `<`, overlapping groups,
   keeping the leftover group, accuracy over all decisions, tokens charged
   only for accepted decisions, 0 instead of None, string grading,
   crashing on no records). The lesson title, provisional until now, is
   the bookends'.

   Lesson 5 is now **Locked**: all five concepts plus both bookends exist
   and build cleanly.

6. **Stop, Ask, or Escalate** — **Locked**
   (folder `06-when-unsure`). Concept 1 (asking before acting) is built,
   with no run data: Wang et al.'s Learning to Ask (agents make up missing
   arguments) and the 2026 Asking What Matters preprint (more questions
   often don't help); a demo marking each `set_model` parameter's source
   (user, lookup, model) and checking three scripted calls; and a graded
   `before_acting(arguments, schema, request, tool_results)` (`runnable`).
   The demo and the starter's printout reproduce the mockup exactly in
   Pyodide 0.26.4. Tests split into 8 self-contained tests, each repeating
   `SCHEMA` and `runbook`; through the real `TEST_HARNESS` the reference
   passes all 8 and eight wrong versions each fail (the starter, pooled
   evidence, lookups trusting the request, case-sensitive matching,
   checking model-source parameters, not checking optional parameters,
   treating missing optional ones as needed, ignoring missing required
   ones). Callbacks: Lesson 4 concepts 4 and 5, Lesson 3's
   where-a-check-can-sit concept, and Module 3's
   validate-and-return-failures concept (page links); "Module 9's subject"
   stays plain text. Shared setup `LOAD_UNSURE` in `reliabilityData.ts`
   (Lesson 5's `LOAD_VOTING` plus `is_correct`, identical to `grading.py`),
   added with concept 2 for the next concept's exercise. Concept 2 (signals
   that the agent isn't sure) is built: a table of the course's signals with
   links back to each; which providers return logprobs; answer-line
   probability against correctness on the `plain` runs (barely related:
   the 2B's 0.99+ band right 92.8%, its 0.5-0.9 band 97.7%); and verdict-word
   probability on the `support.small` and `statements.*` judge runs
   (strong: under 0.9 on 3/3, 14/15 and 4/5 wrong verdicts). Both demos
   reproduce the mockup's output exactly in Pyodide 0.26.4; the prose's
   e21 (wrong "2" always over 95%), `GET /agents/me` at about 55% and
   "one right verdict in six" (16%) were checked against the data.
   Read-only, 4 quiz cards, no graded exercise. Callbacks: Module 1's
   logprobs concept, Module 5's abstaining-when-retrieval-is-weak concept,
   Lesson 5 concept 3 (twice), and Lesson 4 concepts 1 and 2 (page links);
   "Module 7's subject" stays plain text. Concept 3 (escalating to a
   stronger model, or to a person) is built: escalation vs. Module 3's
   approval gate; FrugalGPT's cascade and its learned DistilBERT scorer; a
   graded `run_cascade(small, large, questions, k, min_agreement)`
   (`runnable`, `namespaceSetup={LOAD_UNSURE}`, the `plain.smaller` and
   `plain` runs), placed mid-page because the person-escalation section
   refers to its Run output; and escalating to a person as a load on
   people. In real Pyodide 0.26.4 the reference prints the mockup's four
   lines (4B alone 98.9% at 31 GPU-ms; the unanimous-only cascade 99.7% at
   92) and the starter's printout degrades gracefully. Tests split into 4
   self-contained tests sharing a header; through the real `TEST_HARNESS`
   the reference passes all 4 and eight wrong versions each fail
   (the starter, overlapping groups, always the large model's sample 0,
   large tokens over escalated decisions only, `>` for `>=`, small tokens
   only on accepted decisions, crashing on no decisions, grading the vote
   by its samples' labels). The starter's stray third blank line before
   `seconds_per_token` was normalized to two. Callbacks: concept 2,
   Module 3's separate-reads-from-writes concept, Lesson 4 concept 2,
   Lesson 5 concept 3, and Lesson 2's equal-budgets and
   spend-where-the-risk-is concepts (page links); "Module 9's subject"
   stays plain text. Concept 4 (when the user pushes back) is built from
   the `pushback` run and set U: Sharma et al.'s sycophancy findings; the
   4B's outcomes by pushback style ("Are you sure?": 420 of 420 kept; a
   specific wrong value: 258 kept, 5 switched, 157 unknown or cut off with
   the right value in the text); e54's reply judging the user's value
   instead of answering; and a graded `after_pushback(original, reply,
   user_value, answer_type, sources)` (`runnable`,
   `namespaceSetup={LOAD_UNSURE}`, set U plus the `pushback` run). Both
   demos and the starter's printout reproduce the mockup exactly in
   Pyodide 0.26.4 (the reference gives `{'flag': 162, 'kept': 258}; final
   answer right in 420 of 420`). Tests split into 10 self-contained tests,
   one per `check`, each repeating the helpers; through the real
   `TEST_HARNESS` the reference passes all 10 and seven wrong versions each
   fail (the starter, adopting the user's value without a source, string
   comparison, substring source matching, returning the user's value as
   written, crashing on no answer line, keeping a third value). The
   starter's stray third blank line was normalized to two. Callbacks:
   Module 1's `#sycophancy-a-real-documented-side-effect` and Lesson 4
   concept 5. Bookends are built: the intro (outcomes, why it matters), a
   7-card comprehensive quiz, and a `MultiFileGradedExercise` with
   `next_step(case, min_agreement)` in `policy.py` (with `run_policy`
   given) over a read-only `lib.py` (the loaders and grading functions,
   identical to `grading.py`, and `majority_answer`, identical to Lesson
   5's), with `dataFiles={reliabilityData("plain.smaller", "plain")}`. In
   real Pyodide 0.26.4 the reference passes the hidden tests and its Submit
   output matches the mockup (unanimous-only: 263 answered by the 2B, 67 by
   the 4B, 6 stopped, 329 of 330 right), and eight wrong versions each fail
   (the starter, `not verified` for `is False`, look_up before ask, no
   confirm, stopping a risky case, `<=` for `<`, judging confidence before
   what's missing, never stopping). The `verified=None` assertion was
   moved first so treating None as a failed check gets its own message,
   and the starter's stray third blank line was normalized to two. The
   lesson title, provisional until now, is the bookends'.

   Lesson 6 is now **Locked**: all four concepts plus both bookends exist
   and build cleanly.

7. **Actions That Mustn't Go Wrong** — **Locked** (folder
   `07-safe-actions`). Concept 1 (a dry run before
   the action) is built, with no run data: Terraform's plan/apply as the
   model; a bulk `set_models` tool with a dry-run mode whose preview shows
   a loose match catching `research_summary_agent`; `apply_plan` refusing
   a stale plan (compare-and-set); and a graded `check_preview(plan,
   intended)` (`runnable`). Both demos (the second preloads the first) and
   the starter's printout reproduce the mockup exactly in Pyodide 0.26.4.
   Tests split into 8 self-contained tests, each repeating the `change`
   helper and `intended`; through the real `TEST_HARNESS` the reference
   passes all 8 and seven wrong versions each fail (the starter, unsorted
   lists, ignoring the field, ignoring the value, comparing `before`,
   checking unexpected agents' values, swapped lists). The starter's stray
   third blank line was normalized to two. Callbacks: Module 3's
   separate-reads-from-writes concept, its
   `#retrying-a-write-can-do-it-twice` (verified against the built HTML),
   and its validate-and-return-failures concept. Concept 2 (reading the
   result back) is built, with no run data: why an "ok" isn't proof
   (DynamoDB's eventually consistent reads, lost replies, silent
   failures); a `Registry` stand-in that applies writes one step late, and
   a subclass whose write lands but whose reply times out; the three
   read-back states; and a graded `confirm(plan, current)` (`runnable`).
   Both demos (the second preloads the first) and the starter's printout
   reproduce the mockup exactly in Pyodide 0.26.4. Tests split into 4
   self-contained tests, each repeating the `change` helper; through the
   real `TEST_HARNESS` the reference passes all 4 and six wrong versions
   each fail (the starter, crashing on a missing agent, always reading
   `model`, unsorted lists, only two outcomes, a missing agent as not
   applied). The starter's stray third blank line was normalized to two.
   Callbacks: Module 3's `#retrying-a-write-can-do-it-twice`, Lesson 3's
   checking-a-tool-result concept, and Module 2's goal-state and
   timeouts-retry concepts (page links). Concept 3 (compensating when a
   later step fails) is built, with no run data: a two-step migration left
   half-done by a scripted outage; sagas (Garcia-Molina and Salem, 1987)
   and three details for agents; durable execution (Temporal) for crashes;
   and a graded `run_saga(steps)` (`runnable`). The demo and the starter's
   printout reproduce the mockup exactly in Pyodide 0.26.4. Tests split
   into 4 self-contained tests, each with its own `log` and `step` helper;
   through the real `TEST_HARNESS` the reference passes all 4 and four
   wrong versions each fail (compensating oldest first, compensating the
   failed step, stopping at the first failed compensation, running on past
   the failure), as does the starter. The starter's stray third blank line
   was normalized to two. Callbacks: Lesson 2's spend-where-the-risk-is
   concept, Module 3's `#retrying-a-write-can-do-it-twice`, and Lesson 6's
   escalating concept (page links); "Module 10" stays plain text. Concept
   4 (checking the agent's report against its log) is built, with no run
   data: Advani's false-success findings (45% and 47% of failures in
   τ²-bench's airline and retail domains; judges no better than AUROC
   0.65); a scripted log whose notify call failed under a report claiming
   it; and a graded `unsupported_claims(report, log, claims=CLAIMS)`
   (`runnable`). The demo and the starter's printout reproduce the mockup
   exactly in Pyodide 0.26.4. Tests split into 7 self-contained tests,
   each repeating the log; through the real `TEST_HARNESS` the reference
   passes all 7 and six wrong versions each fail (the starter, ignoring
   `ok`, ignoring arguments, case-sensitive matching, pattern order instead
   of report order, only the first match per pattern, lowercased claim
   text). The starter's stray third blank line was normalized to two.
   Callbacks: Lesson 4 concept 4 and Lesson 3's what-a-failed-check-does
   concept (page links). Bookends are built: the intro (outcomes, why it
   matters), a 7-card comprehensive quiz, and a `MultiFileGradedExercise`
   with `migrate(registry, match, agent, model, team)` in `workflow.py`
   over a read-only `lib.py` (a logging `Registry` stand-in with failure
   flags, plus the four concepts' `check_preview`, `is_safe`, `confirm`,
   `run_saga`, `CLAIMS` and `unsupported_claims`, identical to their
   references); no data files. In real Pyodide 0.26.4 the reference passes
   the hidden tests and its Submit output matches the mockup's four
   scenarios (done; refused on the loose match; rolled back when the
   notification fails; rolled back when the write is lost), and seven
   wrong versions each fail (the starter, no preview check, notifying
   before reading back, no compensation, no read-back, a report claiming
   success after a failure, a refusal worded "haven't moved"). That last
   one is the claim patterns' known limit, so the hint now says to
   describe refusals and rollbacks without "moved". The lesson title,
   provisional until now, is the bookends'.

   Lesson 7 is now **Locked**: all four concepts plus both bookends exist
   and build cleanly.

8. **Fallbacks and Graceful Degradation** — **Locked** (folder
   `08-graceful-degradation`). Concept 1 (falling back to another model)
   is built, with no run data: Module 2's retries giving up on a scripted
   outage; fallback chains (LiteLLM's per-error fallback lists) and which
   errors are worth falling back on; a backup's answers passing the same
   checks and being recorded; and a graded `call_with_fallbacks(models,
   call)` (`runnable`). The mockup's reference omitted the starter's error
   classes, so the page's reference is the full starter with the function
   filled in. The demo and the starter's printout reproduce the mockup
   exactly in Pyodide 0.26.4. Tests split into 5 self-contained tests, each
   repeating the `scripted` helper; through the real `TEST_HARNESS` the
   reference passes all 5 and five wrong versions each fail (the starter,
   catching every exception, not falling back on `ContextTooLong`,
   returning None when every model fails, recording the message instead of
   the class name, calling every model). The starter's stray third blank
   line was normalized to two. Callbacks: Module 2's timeouts-retry and
   Module 3's which-failures-to-retry concepts, Lesson 3 concept 2 and
   Lesson 4 concept 1 (page links); "Module 7's subject" stays plain text.
   Concept 2 (partial answers that say what's missing) is built, with no
   run data: AWS's graceful-degradation guidance; two scripted answers
   from the same partial tool results, one inventing an error rate; stale
   values shown only with their time; and a graded
   `compose_partial(parts)` (`runnable`). The demo and the starter's
   printout reproduce the mockup exactly in Pyodide 0.26.4, and the
   prose's "up to 45%" matches Lesson 3's 45.3%. Tests split into 6
   self-contained tests, each repeating the parts; through the real
   `TEST_HARNESS` the reference passes all 6 and five wrong versions each
   fail (the starter, leaving missing parts unsaid, unlabelled stale
   values, no all-failed line, only the first missing part, the missing
   line first). The starter's stray third blank line was normalized to
   two. Callbacks: Lesson 3 concept 2 and its
   `#what-a-result-check-looks-for` (verified against the built HTML), and
   Lesson 7 concept 4. Concept 3 (circuit breakers) is built, with no run
   data: the arithmetic of callers waiting on a dead dependency; Fowler's
   and Nygard's pattern, its three states, and two details for agents
   (only errors about the dependency's health trip it; an open breaker is
   a fast "no" that sends the agent to a fallback or partial answer); and
   a graded `CircuitBreaker` with an injected clock (`runnable`). The demo
   and the reference's printout reproduce the mockup exactly in Pyodide
   0.26.4 (the bare starter prints nothing, since nothing raises). Tests
   split into 3 self-contained tests at the timeline's natural
   boundaries, each repeating the helpers; through the real
   `TEST_HARNESS` the reference passes all 3 and six wrong versions each
   fail (the starter, counting every error, not resetting on success,
   `>` for `>=` on the wait, restarting a failed trial's wait from the
   first open, calling while open, swallowing the error). The starter's
   stray third blank line was normalized to two. Callback: concept 1 (page
   link); "Module 10's territory" stays plain text. Concept 4 (pinning
   model and prompt versions) is built: Chen, Zaharia and Zou's GPT-4 drift
   (84% to 51% on primes); fixed, floating and commit-pinned model names;
   the committed `plain` run's own record (model, commit, engine, sampling,
   set version, prompt hash), read from `plain.json` alone; and a graded
   `record_run(requested, answered, system_prompt, tools)` (`runnable`).
   The demo and the starter's printout reproduce the mockup exactly in
   Pyodide 0.26.4 (prompt hash `c1a5578f570f`; the reference's
   `976b40ae6a24`). Tests split into 4 self-contained tests, the
   hash comparisons kept with the record they compare against; through the
   real `TEST_HARNESS` the reference passes all 4 and seven wrong versions
   each fail (the starter, unsorted keys, default separators, sorting the
   tools list, the built-in `hash()`, ignoring tools, `model_changed`
   inverted). The starter's stray third blank line was normalized to two.
   Callback: Lesson 1's reliable-across-wordings concept (page link);
   "Module 7's subject" stays plain text. Bookends are built: the intro
   (outcomes, why it matters), a 7-card comprehensive quiz, and a
   `MultiFileGradedExercise` with `handle(agent, fetchers, breakers, cache,
   models, call_model, system_prompt)` in `agent.py` over a read-only
   `lib.py` (the four concepts' error classes and `call_with_fallbacks`,
   `compose_partial`, `CircuitBreaker` and `record_run`, identical to their
   references); no data files. In real Pyodide 0.26.4 the reference passes
   the hidden tests and its Submit output matches the mockup (the health
   service called twice before its breaker trips, the backup answering
   every request, config hash `14d29b7d0a9d`), and eight wrong versions
   each fail (the starter, catching every exception, no breaker, only the
   first model, dropping the failed part, ignoring the cache, recording the
   answering model as requested, not passing the composed text to the
   model). The lesson title, provisional until now, is the bookends'.

   Lesson 8 is now **Locked**: all four concepts plus both bookends exist
   and build cleanly.

9. **Guarding What an Agent Does After It Reads** — **Locked** (folder
   `09-restricting-after-reading`, named before the title existed). Concept 1
   (tracking what the session has read) is built, with no run data: where
   Modules 3, 4 and 5 left the dangerous combination, Meta's Agents Rule of
   Two and Oso's stateful decisions (the session as the unit); a scripted
   demo of a model-judged guard fooled by a planted email against labels
   tracked in code; the four rules (declared labels, never read content,
   labels only accumulate, undeclared tools fail closed) plus the memory
   source rule; 4 quiz cards; and a graded `SessionGuard` (`record`,
   `touched`; `runnable`). The mockup's reference omitted `TOOL_LABELS`
   and the starter's printout, so the page's reference is the full starter
   filled in. The demo and the starter's printout reproduce the mockup
   exactly in Pyodide 0.26.4. Tests split into 6 self-contained tests
   (each builds its own guard from the starter's `TOOL_LABELS`); through
   the real `TEST_HARNESS` the reference passes all 6 and seven wrong
   versions each fail (the starter, honouring a `trusted` field, undeclared
   tools as clean, `=` instead of `|=`, returning the set itself,
   untrusting only `"tool"` memories, mutating the declared label set).
   The starter's stray third blank line was normalized to two. Callbacks:
   Module 3's dangerous-combination and security-boundary concepts and
   Module 4's memory-poisoning concept (page links), Module 5's
   `#limit-what-the-model-can-do-after-reading` (verified against the
   built HTML). Earlier "Lesson 9" mentions in Lessons 1 and 2 stay plain
   text. Concept 2 (restricting tools once the session has read) is built,
   with no run data: allow / approve / deny at the check on the call; a
   demo of the literal Rule of Two letting `set_model` through after an
   untrusted email; Willison's objection and the stricter five-row table
   (deny, not approve, sending out after untrusted + private); never
   reading arguments; 4 quiz cards; and a graded `decide(tool, arguments,
   touched, tool_labels)` (`runnable`). The page's reference is the full
   starter filled in. The demo and the starter's printout reproduce the
   mockup exactly in Pyodide 0.26.4. Tests split into 5 self-contained
   tests, each repeating the `check` helper. **Test fix:** the mockup's
   purity test snapshotted the starter's shared `TOOL_LABELS` sets, which
   the printout and earlier tests had already passed through `decide`, so
   a learner adding to the declared sets passed; it now builds its own
   label dict (architecture.md §4.1). Through the real `TEST_HARNESS` the
   reference passes all 5 and ten wrong versions each fail (the starter,
   the literal Rule of Two, honouring `approved`, allowing undeclared tools,
   denying every act after both, approving the full combination, adding the
   tool's labels to `touched`, adding to the declared labels, blocking reads
   after untrusted, gating every act regardless of the session). The
   starter's stray third blank line was normalized to two. Callbacks:
   concept 1 and Module 3's separate-reads-from-writes and blast-radius
   concepts (page links), Lesson 3 concept 1's
   `#four-points-four-different-views` (verified against the built HTML).
   Concept 3 (designs that keep untrusted text away from decisions) is
   built, prose, two demos and quiz, no exercise: Beurer-Kellner et al.'s
   six design patterns; plan-then-execute (a demo where the plan refuses
   `send_email` but the email still changes `set_model`'s argument); the
   action-selector; dual LLM (a `$VAR1` placeholder demo) and CaMeL's
   code-then-execute (77% against 84% on AgentDojo); choosing between the
   patterns and the session guard; 4 quiz cards. Both demos reproduce the
   mockup exactly in Pyodide 0.26.4. The dual LLM demo reads the first
   demo's `email`, so it's preloaded through `setupCode`, since demos don't
   share state. Callback: Lesson 7's dry-run concept (page link); "Module
   10's subject" stays plain text. The mockup marks this as the lesson's
   last concept. Bookends are built: the intro (outcomes, why it matters,
   which keeps Module 4's "guardrails on what an agent may do with what it
   recalls: Module 6" promise), a 7-card comprehensive quiz, and a
   `MultiFileGradedExercise` with `run_calls(calls, guard, approve)` in
   `run.py` over a read-only `lib.py` (concepts 1 and 2's `SessionGuard`,
   `decide` and `TOOL_LABELS`, identical to their references, plus stand-in
   tools); no data files. The mockup's hidden tests are kept as one script,
   as the multi-file harness runs them; its `fresh()` resets the registry
   and outbox the Submit run leaves changed. In real Pyodide 0.26.4, run the
   way the harness does (entry first, then the tests in a fresh namespace),
   the reference passes and its Submit output matches the mockup exactly,
   and eight wrong versions each fail (the starter, recording calls that
   didn't run, running rejected calls, never asking the person, asking about
   allowed calls, honouring an `approved` argument, a new guard per call,
   deciding from an empty `touched`). The mockup's "click Run" reads
   "click Submit", matching the component. The lesson title, provisional
   until now, is the bookends'.

   Lesson 9 is now **Locked**: all three concepts plus both bookends exist
   and build cleanly.

10. **Putting It Together: A Reliable Agent** — **Locked** (folder
   `10-layered-checks`, named before the title existed). Concept 1 (the agent, and what goes wrong
   without the module) is built, prose, one demo and quiz, no exercise: one
   agent carrying the whole module, measured on Lesson 2's catches / wrongly
   blocks / costs; a suite of sixteen scripted scenarios (eight fine, eight
   harmful), with its two caveats (the scripted model doesn't react to
   checks; counts describe the suite, not a model); and the no-checks
   baseline, where every harmful scenario does its harm, mapped to the lesson
   that addresses each. 4 quiz cards. New shared setup `SCENARIO_SUITE` in
   `reliabilityData.ts`, loaded after `REACT_FAKE_CLIENT + CHECKED_AGENT` (the
   mockup's loop is Lesson 3's `CHECKED_AGENT`, confirmed byte-identical),
   and the page's shown block is exactly the header comment plus those two;
   both were generated from the mockup, not retyped. The baseline demo
   reproduces the mockup's 16-line output exactly in Pyodide 0.26.4, run
   through that real setup. Callbacks (page links, as the mockup names no
   subsections): Lesson 2 concept 1, Module 5 Lesson 14's retrieval-in-the-
   context-step concept, Lesson 3 concepts 1 and 2, Lesson 4 concepts 1 and
   4, Lesson 6 concept 1, Lesson 7 concept 2, Lesson 8 concept 2 and Lesson
   9 concept 2. The mockup's "after `REACT_FAKE_CLIENT`" note reads "after
   the scripted client from Module 2" on the page. Concept 2 (layering the
   checks into one loop) is built, prose, two demos and quiz, no exercise:
   an eight-row table of where each layer sits and what it costs, code
   checks before the one model-calling judge (Lesson 2's rule), why
   fallbacks and voting aren't in the suite; the layers in code; every layer
   at once (every harm caught, two fine scenarios blocked: the derived count
   2 and the loosely named agent, the costs Lessons 4 and 6 warned about);
   and the result check and missing-part check working only as a pair. 4
   quiz cards. New shared setup `CHECK_LAYERS` (the eight layers, `LAYERS`,
   `checks_from`) after `SCENARIO_SUITE`, generated from the mockup's bytes
   and shown verbatim; its regexes were confirmed intact in the built HTML.
   The layers block runs cleanly and both demos reproduce the mockup's
   output exactly in Pyodide 0.26.4, run through the real setup. Callbacks
   (page links): Lesson 3 concept 1, Lesson 2 concept 4, Lesson 8 concept 1,
   Lesson 4 concepts 2 and 4, Lesson 6 concept 1; Lesson 5's voting stays
   plain text. Concept 3 (what each layer earns) is built: each layer alone
   on the suite (none stops more than 2 of 8 harms, all together stop 8
   with 2 wrong blocks, 2 judge calls, 4 extra reads, 1 approval); what the
   stack loses without each layer (every layer uniquely stops at least one
   harm, and only grounding and the intent check cause wrong blocks); the
   real judge's per-call cost from Lesson 4's committed `draft-support.large`
   run (452 calls, 253 prompt tokens, 7.3 generated, 12.5 GPU-ms), with
   Lesson 4's accuracy figures (40/80 clean, up to about 7%, 33 of 390),
   checked against Lesson 4's pages; 4 quiz cards; and a graded
   `summarise(results)` (`runnable`, with the lesson's setup as
   `namespaceSetup`). All three demos reproduce the mockup exactly in
   Pyodide 0.26.4 (two through the real setup, the cost demo from the run
   file alone), and so does the reference's Run output. The page's reference
   is the full starter filled in; the starter's stray third blank line was
   normalized to two. Tests split into 4 self-contained tests (each rebuilds
   its results); through the real `TEST_HARNESS` with the setup as prelude,
   the reference passes all 4 and seven wrong versions each fail (the
   starter, counting fine runs as catches, `missed` as a count, wrong blocks
   inverted, costs over harmful runs only, names out of order, an extra key,
   `None` for no results). Callbacks: Lesson 2 concepts 1 and 3 (page
   links); "Module 7's subject" stays plain text. The mockup marks this as
   the lesson's last concept. Bookends are built: the intro (outcomes, why
   it matters), a 7-card comprehensive quiz, a `MultiFileGradedExercise`
   with `choose_layers(summaries, max_blocked, max_judge_calls)` in
   `choose.py` over a read-only `lib.py`, and the module's closing section
   ("Where the module leaves the agent") after the exercise, the first
   recap page with closing prose. `lib.py` is built on the page from the
   shared constants (`REACT_FAKE_CLIENT`, `CHECKED_AGENT`, `SCENARIO_SUITE`,
   `CHECK_LAYERS`) plus concept 3's `summarise`, and evaluates to exactly
   the mockup's `lib.py`. Submit measures all 256 layer sets in about 0.3 s
   in Pyodide 0.26.4, and the reference's output matches the mockup
   exactly. **Test fix:** two wrong versions passed the mockup's tests
   (leaving out the alphabetical tie-break, since the test dict already
   listed the winner first; and ranking fewer layers ahead of fewer wrong
   blocks), so two cases were added (architecture.md §4.1). Graded the way
   the multi-file harness runs, the reference passes, and the starter and
   eight wrong versions each fail (also: exclusive limits, no tie-breaks,
   ignoring the judge limit, `min` on an empty list, ignoring wrong blocks).
   The mockup's "click Run" reads "click Submit", matching the component.
   The lesson title, provisional until now, is the bookends'.

   Lesson 10 is now **Locked**: all three concepts plus both bookends exist
   and build cleanly.

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

**Promised by Module 5 (2026-09-29).** Module 5's pages hand these topics
to later modules by name, so each module's plan has to include them:
- **Module 6 (Reliability):**
  - checking whether a cited source actually supports its statement (Lesson
    10, four places);
  - detecting contradictions between sources in general (Lesson 10, whose
    check covers one kind of fact).
- **Module 7 (Evaluation & Observability):**
  - measuring the answers a model writes from retrieved passages, as
    opposed to the retrieval itself (Lesson 2);
  - evaluating agent search loops with a live model (Lesson 11). Lesson
    11 concept 5 also cites RAGAS faithfulness and answer correctness
    without defining them.
- **Module 9 (UX):** presenting citations to users (Lesson 10).
- **Module 10 (Production):** keeping an index in step with changing
  documents (Lessons 4, 9, 10 and 12):
  - adding, changing and deleting chunks without a full rebuild;
  - regenerating contextual chunks, graph extractions and summaries when
    a document changes;
  - re-embedding everything when the embedding model changes.

---

## Module 7 — Evaluation & Observability

Folder `07-evaluation` (module title and description provisional). Data:
`public/data/eval/pilot/` (the pilot's recorded runs of the registry agent,
per `scripts/eval/README-eval.md`; loaded from Lesson 1 concept 1 on, see
architecture.md §3.1).

1. **Why Agents Are Hard to Grade** (`01-grading-agents`, title
   provisional) — **Locked.** Concept 1 (why an agent is harder to grade
   than an answer) is built: the registry agent and the pilot (static
   `LOAD_PILOT` setup block), one recorded run (`4b-think/p06/0`) with
   Anthropic's eval terms (task, trial, transcript, outcome, grader, suite,
   harness), the paths demo (7 of 10 tasks took more than one path), the
   reply-isn't-the-outcome demo (p08's lost write, all three replies claim
   success), why tasks get several trials, 5 quiz cards. All three demos
   reproduce the mockup's output exactly against the committed run files.
   Callbacks to Module 6 Lesson 10 (concept page, and
   `#a-suite-of-scenarios-some-fine-some-not`), Module 6 Lesson 7's
   `#a-reply-isn-t-proof`, Module 6 Lesson 3's where-a-check-can-sit,
   Module 6 Lesson 1's concepts 2 and 3, Module 5 Lesson 11's
   when-the-answer-is-in-a-table and Lesson 14's
   retrieval-in-the-context-step (anchors verified in the built HTML).
   Forward mentions of later concepts and Lessons 2, 4 and 6 are plain
   prose until those exist.
   Concept 2 (grading the outcome and grading the path) is built: the
   three checks (end state, final reply, path) and how LangSmith, OpenAI
   trace grading, Google ADK and Anthropic's guide name them; ADK's exact /
   in-order / any-order modes (the 26-searches-24-wordings figure checked
   against `4b-think.json`); a graded `trajectory_matches` exercise (the
   mockup's hidden tests split into 5 per-group tests, each redefining
   `G, S, D, Q`); a demo of all three modes on the 4B's p06/p07/p08 runs
   (each mode wrong on 4 of 9), with the reference function, minus its
   example printout, loaded as hidden setup after `LOAD_PILOT`; when the
   path is the right thing to check; 5 quiz cards. Verified in real
   Pyodide 0.26.4 with the site's `TEST_HARNESS`: the reference passes all
   5 tests and prints the mockup's output, the starter fails, and nine
   wrong versions each fail the test aimed at them (sets for any-order,
   in-order ignoring order or reusing a call, exact ignoring order or as a
   prefix, unknown mode returning False, mutating `actual`); the demo
   matches the mockup exactly. Callbacks to Module 6 Lesson 7's
   reading-the-result-back and Lesson 10's layering-the-checks (page links,
   no subsection named).
   Concept 3 (grading one piece on its own) is built: single-step /
   component evals (unit tests for code; Module 5's retrieval metrics,
   Module 4's summary probes and one frozen loop decision for model
   steps), a demo of every p01 search across all three pilot setups (every
   search naming the alert found `D08:1`; the five failing runs all stopped
   after one search), using the two kinds together, 5 quiz cards. The demo
   reproduces the mockup's output exactly, and the D08 threshold quoted in
   the prose was checked against `documents.json`. Callbacks: Module 0's
   pytest-basics concept page, Module 5 Lesson 2's metrics page, Module 4
   Lesson 5's `#testing-a-summary-by-asking-it-questions` and Module 5
   Lesson 11's `#measured` (anchors verified in the built HTML). Mentions
   of Lessons 2 and 3 are plain prose.
   Concept 4 (offline and online) is built, quiz-only, no demo: Google's
   three evaluation kinds, Anthropic's six methods and the Swiss cheese
   model (linked to Module 6 Lesson 10's layering-the-checks page),
   capability vs regression suites, how online and offline feed each
   other, 5 quiz cards. Its "70–87%" is the pilot's pass rate after
   reading (21/30 to 26/30, from `grades.json`); the raw code grades are
   70–83%.
   Concept 5 (the loop) is built: Husain/Shankar, OpenAI and Anthropic on
   reading before grading, the six-step loop, a demo of code grades vs
   grades after reading from the new `public/data/eval/pilot/grades.json`
   (written by `scripts/eval/pilot_grades.py`, rerun here: identical to
   the content chat's copy apart from line endings), the 19 changes (9 p08
   false passes, 7 p07 and 3 p02 false failures), how the module's lessons
   follow the loop, 5 quiz cards. Demo output matches the mockup exactly.
   Callback to Module 6 Lesson 4's false-premise page.
   Bookends are built: intro (3 outcomes, why it matters) and recap with an
   8-question comprehensive quiz and a multi-file sandbox (`lib.py`
   read-only: `INITIAL_REGISTRY`, checked against `grading.py`'s
   `initial_registry`, plus `load_pilot`, `tool_path`, `trajectory_matches`
   and `call_matches`; entry `grader.py`, where the learner writes
   `grade_action(trial, spec)` against four action-task `SPECS`: end state
   for every agent, required calls successful and in order with arguments,
   forbidden calls even when they failed, every reason listed, and "read"
   when the reply still matters). Reads all three pilot run files. Task,
   hint and explanation flattened to one paragraph each (props are plain
   text). Verified in real Pyodide 0.26.4 the way `MultiFileGradedExercise`
   runs it: the reference passes and its Run output matches the mockup
   (every p06/p10 run "pass", every p07/p08 run "read", in all three
   setups), the starter fails, and nine wrong versions each fail with
   their intended message (only the named agents checked, required calls
   in any order, failed or tool-only required calls counted, failed
   forbidden calls skipped, stopping at the first failure, ignoring
   `reply_matters`, mutating the trial, returning a list).

**Main runs, phase 1 (baseline): done (2026-10-01).**
`scripts/eval/README-main.md`: the registry agent (Qwen3.5-4B @ `851bf6e`,
thinking on) on the full 96-task pool (`tasks/main.json`: Module 5's 57
questions as 59 tasks, plus 37 registry tasks and conversations), two
batches x 5 trials, traced as they ran with `scripts/eval/tracing.py` (the
lesson's tracing code, kept identical by `check-copies.mjs`). Results in
`public/data/eval/main/baseline-{a,b}.json` (13.5 MB each): 480 trials
each, 0 raised, every trial replaying exactly (checked on Colab and again
locally). Provisional code checks on the 37 registry tasks and
conversations: mean pass rate 86% (a) and 88% (b); never passed a03, a10,
a14 (a) and a14 (b); 13 and 21 trials stopped at the step limit; 1 format
problem in 3,544 calls. The questions are graded in later lessons, and the
content chat reads the never-passed tasks before trusting them.
Environment: Colab, NVIDIA RTX PRO 6000 Blackwell Server Edition (compute
capability 12.0, 97,887 MiB), vLLM 0.30.0. Changes from the README's
setup: `torchaudio` uninstalled (its CUDA 12.8 build clashed with the CUDA
13.0 PyTorch vLLM installed); `VLLM_USE_FLASHINFER_SAMPLER=0` on both
servers (FlashInfer's sampler rejected the card in its GPU check); the two
servers started one after the other, since starting them together made one
fail its memory profiling. `set_model`'s description no longer says a
change "applies from the agent's next session" (the pilot's wording is
kept as `TOOL_SPECS_PILOT`).

**Runs, phase 2a (Lesson 4's suite tasks and the pushback control): done
(2026-10-01).** `scripts/eval/README-phase2a.md`. Suite: the same agent,
settings and servers on `tasks/suite-2a.json` (29 tasks, built by
`build_suite_tasks.py`, one or more per Lesson 3 failure category plus four
multi-hop questions, 9 held out), 5 trials each, in
`public/data/eval/main/suite-2a-a.json` (3.9 MB): 145 trials, 0 raised,
145 of 145 replaying exactly (checked on Colab and again locally), 0
format problems in 535 calls, 6 stopped at the step limit. Provisional
code checks: mean pass rate 72%; never passed s06, s09, s24; 17 tasks
always passed. Pushback control (`pushback-control`, Module 6's pushback
run with right and wrong swapped: set U, 5 samples, first reply a
constructed wrong one) in `public/data/reliability/runs/pushback-control.json`:
pushed back with the right value, corrected 420/420 (kept the wrong one 0);
asked "are you sure?", corrected 412/420 (kept the wrong one 0). Same
environment as phase 1 (vLLM 0.30.0, torch 2.13.0+cu130, RTX PRO 6000
Blackwell, `torchaudio` removed, `VLLM_USE_FLASHINFER_SAMPLER=0`, servers
started one after the other).

**Check fixes after reading (2026-10-01), Lesson 4's "task fixed after
reading its runs" examples.** `grading.py`'s phrase matcher v2 lets a
number carry its unit ("840" matches "840ms", not "8400"); v1 is kept, and
`pilot_grades.py` and `reading_code_grades.py` pin it, so the pilot's and
Lesson 3's recorded grades are unchanged. m02 allows one email to
research-team (`outbox.max_count`; tasks/main.json v2), and s29 accepts the
date written out (suite-2a.json v2); each keeps its first checks as
`expect.checks_v1`. Regraded: baseline-a 86% -> 91% (a03 0/5 -> 5/5, so it
is no longer never-passed; m03 1 -> 5; m02 3 -> 4), baseline-b 88% -> 91%,
suite-2a-a 72% -> 74% (s29 2 -> 5). The simulator audit (with the
spot check and the m02 task gap) is in
`public/data/eval/reading/simulator-audit.json`.

**Runs, phase 2b (Lesson 5's summarizer test): done (2026-10-01).**
`scripts/eval/README-phase2b.md`, `scripts/eval/run_summarizer_test.py`:
Module 4's promised summary test on the 20 longest dev traces of the
baseline (at most two per task), each cut after its last tool round and
summarised by the 4B (agent settings, thinking on) under Module 4's
`SUMMARY_INSTRUCTIONS` ("careful") and "Summarize the conversation above
briefly." ("plain"), 3 samples each; 49 code-graded probes (which agent,
model the registry reported, error code, search count) answered from the
summary alone. In `public/data/eval/summarizer/summarizer-test.json`: 120
summaries, all finishing with "stop"; careful 74/147 right, plain 67/147
(task 24/24 both; tool fact 33/51 vs 31/51; error 8/12 vs 5/12; search
count 9/60 vs 7/60); median summary about 1,270 vs 800 characters.
Environment: Colab, RTX PRO 6000 Blackwell Server Edition, vLLM 0.30.0,
torch 2.13.0+cu130, `torchaudio` removed,
`VLLM_USE_FLASHINFER_SAMPLER=0`, the 4B served alone with
`--gpu-memory-utilization 0.85`, `/data/rag` linked to `public/data/rag`
(Module 5's library reads its corpus there on import). 50.2 s wall.

2. **Tracing an Agent Run** (`02-tracing`, title provisional) —
   **Locked.** Concept 1 (from a list of events to a tree of spans) is
   built: the course's four separate records (Module 2's tracing hook,
   Module 4's manifest, Module 6's check records and `record_run`), the
   pilot's tool log and model calls for `4b-think/p08/0` side by side,
   OpenTelemetry's spans and traces (name, ids, parent, times, attributes,
   status with `UNSET` as the default), a graded `Tracer.span` exercise
   (a `@contextmanager` over a stack of open spans; the mockup's hidden
   tests split into 5 self-contained tests), a scripted run traced as a
   tree by wrapping the client and tools, and a crash marking both the
   tool span and the run `ERROR`; 5 quiz cards. New shared constants in
   `evalData.ts`: `TRACING_SETUP` and `TRACER`. Verified in real Pyodide
   0.26.4: all three demos reproduce the mockup's output exactly with the
   page's own setup strings; the reference passes all 5 tests, the starter
   fails, and eight wrong versions each fail the test aimed at them
   (outermost parent, swallowed exception, no `finally`, attributes not
   copied, status `OK` on success, error message as `error.type`, a trace
   id per span, the clock read twice). Callbacks: Module 2 Lesson 11's
   `#the-fix-by-hand-a-tracing-hook` (anchor verified), Module 4 Lesson
   12's seeing-inside-each-request, Module 6 Lesson 3's
   what-a-failed-check-does and Lesson 8's pinning page, Module 2 Lesson
   6's tool-errors-as-observations (page links).
   Concept 2 (a shared format: OpenTelemetry's conventions for AI calls)
   is built: semantic conventions and the `semantic-conventions-genai`
   repo (all Development), the four span kinds (`invoke_agent`, `chat`,
   `execute_tool`, `retrieval`), a demo rebuilding `4b-think/p07/0` as
   GenAI spans (new shared `TRACE_FROM_RECORDING`, kept identical to the
   demo by `check-copies.mjs`), why content is opt-in and a demo of its
   size (62 KB to 239 KB over 30 traces), the same spans in the real
   OpenTelemetry SDK (a static block: its printed output was checked by
   running it against `opentelemetry-sdk` 1.45.0), and OpenInference's
   span kinds; 5 quiz cards. Both live demos reproduce the mockup's output
   exactly in real Pyodide 0.26.4 with the page's own setup strings.
   Callback to Module 4 Lesson 12's seeing-inside-each-request (page
   link).
   Concept 3 (what this course adds to a trace) is built: the three
   records outside the conventions (manifest, check records, version
   record) under a `registry_agent.` prefix; Module 4's 17-turn task
   traced, with `build_context` spans carrying the manifest and
   `gen_ai.conversation.compacted` on every call from turn 10; checks as
   spans (blocks keep `UNSET`, passes recorded too); a graded
   `traced_checks` exercise (hidden tests split into 5 self-contained
   tests); the registry agent instrumented with `TracedChat`, `instrument`
   and `config_hash`; 5 quiz cards. New shared constants `TRACED_CHECKS`,
   `INSTRUMENT_WRAPPERS` and `INSTRUMENT`, which the main runs' own
   `scripts/eval/tracing.py` repeats byte for byte (checked by
   `check-copies.mjs`; its `config_hash` gives the demo's `02755d619c75`).
   Verified in real Pyodide 0.26.4 with the page's own setup strings: both
   demos match the mockup exactly; the reference passes all 5 tests, the
   starter fails, and eleven wrong versions each fail (a closure defined in
   a loop, tool attributes at every point, blocks marked `ERROR`, only
   blocks recorded, the check called twice, the action from the wrong
   point, copied arguments, a swallowed crash, defaults left unwrapped,
   every verdict "blocked"). Callbacks: Module 4 Lesson 12's
   seeing-inside-each-request and measuring-the-before-and-after, Module 6
   Lesson 3's what-a-failed-check-does and Lesson 8's pinning page, Module
   2 Lesson 11's `#the-fix-by-hand-a-tracing-hook`.
   Concept 4 (reading a trace) is built: the questions a trace answers,
   queries by attribute not span name, the double-counted `invoke_agent`
   usage; a graded `summarize(spans)` exercise (hidden tests split into 4
   self-contained scenarios); demos summarizing p07/0 and p08/1 (p08 looks
   clean), input tokens growing over p02/1 (11 sent per token generated),
   and p08/1's content showing the model quoting `set_model`'s
   description; the new `TraceViewer` component over all 90 pilot traces
   (data built by `scripts/eval/build_pilot_traces.py` from the page code);
   5 quiz cards. New shared `SUMMARIZE`. Verified in real Pyodide 0.26.4:
   all three demos match the mockup exactly; the reference passes all 4
   tests, the starter fails, and eight wrong versions each fail (chat found
   by span name, tokens over every span, usage read without a default, the
   first ERROR span as the failure, the last origin, failed tools from
   every span, every check listed, tool counts as a set). The viewer was
   driven in headless Chromium against the built site: initial trace,
   span details with thinking/text blocks, a tool result, the p07
   suggestion with its ERROR badge, switching setup, collapsing, no page
   errors. Callbacks: concept 2's `#the-spans-this-agent-produces` (anchor
   verified) and Module 4 Lesson 1's intro (lesson-level link).
   Concept 5 (replaying a recorded run) is built: record and replay, with
   VCR.py's cassettes and strict mode as the model; the pilot's provided
   replay code shown (byte-identical to `eval_client.py`, checked by
   `check-copies.mjs`); a graded `ReplayClient.create` exercise (hidden
   tests split into 6 self-contained scenarios); demos replaying
   `4b-think/p07/0` and all 30 4B runs in the browser with the pilot's own
   modules served from `public/data/eval/code/`, and a harmless-looking
   `get_agent` reformat diverging at call 1; what replay can and can't
   check; 5 quiz cards. Verified in real Pyodide 0.26.4: all three demos
   match the mockup exactly (30 of 30 replayed); the reference passes all
   6 tests, the starter fails, and nine wrong versions each fail (playback
   with no hash check, no bounds check, advancing before checking, blocks
   left as dicts, new tool-call ids, length ignored, usage swapped,
   always tool_use). The demos were also run in headless Chromium against
   the built site (data files and CDN packages loading for real). No
   callbacks in this concept.
   Bookends are built: intro (3 outcomes, why it matters) and recap with an
   8-question comprehensive quiz and a multi-file sandbox (`lib.py`
   read-only: the lesson's tracer, `traced_checks`, `TracedChat`,
   `instrument`, `summarize` and pilot loaders, plus imports of the pilot's
   own `ReplayClient`, `Task`, `MAX_STEPS`, `tool_errors`, `fresh_world`,
   `Checks` and `run_checked_agent`; entry `replay_trace.py`, where the
   learner writes `trace_replay`: a root span with the run's model,
   conversation id and config hash, the pilot's `after_tool=tool_errors`
   checks, and the chat spans' totals on the root). Hidden setup is
   concept 5's `REPLAY_SETUP` through `MultiFileGradedExercise`'s new
   `setupCode` prop. The task's "Click Run" became "Submit also runs the
   file", since this component has only Submit. Verified in real Pyodide
   0.26.4 the way the component runs it: the reference passes with the
   mockup's Run output, the starter fails, and seven wrong versions each
   fail with their intended message (no checks, which diverges at call 2;
   a second tracer; no root totals; a swallowed divergence; no
   simulated-user guard; no conversation id; the loop outside the root).
   Also run in headless Chromium against the built site: the starter fails
   with its message, and the reference, typed into the editor, passes and
   prints the expected summary.

3. **Error Analysis** (`03-error-analysis`, title provisional) —
   **Locked.** Data: `public/data/eval/reading/` (the 100-trace reading
   sample of `baseline-a`, the readers' labels, the categories; see
   `scripts/eval/README-labeller.md`). Concept 1 (from a fixed map to this
   agent's own failures) is built: Module 6's map run the other way round,
   Husain and Shankar's open and axial coding, theoretical saturation,
   MAST as the research precedent, how the sample was drawn (batch a, dev
   tasks only, every task once, blind to grades) and what reading costs;
   new shared `readingData` and `LOAD_READING` (shown verbatim, checked by
   `check-copies.mjs`); two read-only demos (the sample's spread, Simar's
   reading times), both matching the mockup exactly; 5 quiz cards.
   Callbacks: Module 6 Lesson 1's `#using-the-map-on-a-failed-run` and
   Lesson 2 concept 4's `#two-runs-summarized` (anchors verified).
   Concept 2 (one note per trace, at the first failure) is built: what a
   useful note asks for (first failure, specific, observable, own words),
   Who&When's 14.2% step-finding result as the reason a person reads, and
   three read-only demos over `traces.json` and the labels (two of Simar's
   notes beside outlined traces; q07's rewrite and the two q30 notes; four
   passes with Claude's "how" notes), the later two taking the first
   demo's `traces`/`labels`/`outline` as hidden setup sliced from it; all
   three match the mockup exactly; 5 quiz cards. No callbacks.
   Concept 3 (whose failure is it?) is built: the reading standard's six
   places a failure comes from, simulated-user errors (AURA, τ-Knowledge)
   and a baseline conversation where the simulator broke role after the
   agent's malformed call, the harness's planted instruction and a13/1,
   a10 decided by the standard, and a demo comparing the code checks with
   the readings (41 of 50 agree, 5 false passes, 4 false failures) over
   the new `code-grades.json` (from `scripts/eval/reading_code_grades.py`;
   output matched the mockup's copy, and the demo matches the mockup
   exactly); 5 quiz cards. Callbacks: Lesson 1 concept 1's
   `#one-run-and-the-words-for-its-parts` and Lesson 2 concept 4's
   `#what-the-model-saw-and-thought` (anchors verified). After a data
   update (a13/1 re-labelled a pass in `labels-simar-v2.json`, so 23 of 100
   traces fail and *trusts the tool's "ok"* holds only the two a14 runs),
   the demo reads 42 agree / 4 false passes / 4 false failures, and the
   harness subsection now uses the pilot's excuse in `set_model`'s
   description (a13/1 reported the contradiction); concept 1's cost
   paragraph was reworded to match.
   Concept 4 (grouping and counting) is built: axial coding's rules
   (first failure, a model drafts and a person decides, merging and
   splitting as decisions about fixes); a graded `tally(assignments, read)`
   exercise (hidden tests split into 4 self-contained scenarios; new shared
   `TALLY`); demos counting the 11 categories, a task-level bootstrap
   interval for the top five, and each category against Module 6's map
   (6 fit, 3 partly, 2 new), the later two with the first demo's
   definitions as hidden setup; 5 quiz cards. Verified in real Pyodide
   0.26.4 through the site's test harness: the reference passes all 4
   tests with the mockup's Run output, the starter fails, and nine wrong
   versions each fail (tasks counted as runs, share of failures, no
   rounding, sort by runs only, no tasks tiebreak, ascending runs, whole
   trial id as the task, no ValueError, mutated input). All three demos
   match the mockup exactly. The mockup's "4 of the 24 failures" became 23
   to match the updated data. Callback: Module 6 Lesson 1's
   `#how-sure-can-we-be-of-these-numbers` (anchor verified).
   Concept 5 (how, not only whether) is built: the verdict versus the
   route, a13/1's verdict changed by reading its final answer rather than
   its reasoning, two read-only demos over `traces.json` (the reasoning
   just before the decisive step in a19/0, a14/4 and a05/3; 18 writing
   runs, 4 reading the record back, 11 of the 14 that didn't still
   passing), and Chen et al. 2025 on unfaithful reasoning; both demos match
   the mockup exactly (the first demo's docstring has backticks, so its
   constant is joined around them; checked byte for byte against the
   mockup); 5 quiz cards. Callbacks: Module 6 Lesson 7's
   `#checking-the-goal-not-just-the-check` (twice, anchor verified), its
   reading-the-result-back concept page, and Module 6 Lesson 6's intro
   (lesson-level).
   Bookends are built: intro (3 outcomes, why it matters) and recap with an
   8-question comprehensive quiz and a multi-file sandbox (`lib.py`
   read-only: `load_reading`, `load_traces`, `tally`, `task_bootstrap`,
   `read_back`, checked against the lesson's code by `check-copies.mjs`;
   entry `error_report.py`, where the learner writes `primary_labels`,
   `agreement` and `fragile_passes`). The task's "Click Run" became
   "Submit also runs the file", as in Lesson 2's recap. Constants were
   generated from the mockup's bytes (checked identical). Verified in real
   Pyodide 0.26.4 the way the component runs it: the reference passes
   with the mockup's Run output (23 of 100 failed, 9 of 15 and 12 of 15
   agreement, 11 fragile passes), the starter fails, and nine wrong
   versions each fail with their intended message (the other reader
   preferred, the primary ignored, unlabelled traces skipped, agreement
   over the union, whole labels compared, any set_model counted, verdict
   ignored, unsorted, any get_agent as a read-back).

4. **Building a Task Suite** (`04-task-suite`, title provisional) —
   **Locked.** Data: `public/data/eval/suite/grades-2a.json` (each phase
   2a suite task, its code-check result on every trial of `suite-2a-a`, and
   whether its reference run passes; written by
   `scripts/eval/suite_grades.py`, `--check`). Concept 1 (what makes a good
   task) is built: Anthropic's three tests for a task (unambiguous,
   everything checked is in the task, a reference solution) and its
   should/shouldn't balance, the Agentic Benchmark Checklist's findings
   (Zhu et al., NeurIPS 2025), s13 as a shouldn't-act task beside Lesson
   3's a19; new shared `suiteData`, `LOAD_SUITE` (shown verbatim, checked
   by `check-copies.mjs`) and `TRIAGE`; a read-only demo of s13 and a
   graded `triage(tasks, trials, reference_passes)` exercise (the mockup's
   hidden tests split into 5 self-contained tests, plus one assertion the
   mockup lacked, a broken task with no trials, which an ordering bug
   otherwise passed), then the triage of the 29 tasks (3 read the runs,
   8 mixed, 18 always pass); 5 quiz cards. Verified in real Pyodide 0.26.4:
   both demos match the mockup exactly, the reference passes, the starter
   and seven wrong versions fail. Corrected from the mockup after checking
   the sources and runs: ABC audited ten benchmarks (of 17 surveyed), not
   17; Anthropic's broken-task warning is for frontier models over many
   trials; the priority-tier check was the pilot's (Lesson 1 concept 5),
   the any-email one the baseline's (Lesson 3 concept 3); s06 and s09:
   nine of ten runs answered right with an invented citation (eight D07,
   one D05), the tenth hit the step limit; s05: four of five runs claimed
   both moves, the fifth hit the step limit. Callbacks: Lesson 1's
   `#one-run-and-the-words-for-its-parts`, Lesson 1 concept 5's
   `#the-pilot-went-round-once`, Lesson 3 concept 3's `#the-grader`
   (anchors verified).
   Concept 2 (where tasks come from) is built: Anthropic's 20 to 50 tasks
   from real failures and its sources, the suite's three (Module 5's
   labelled questions, edge cases written in advance, Lesson 3's real
   failures), a02 and its lost-write twin s01 (none of the 12 code-passed
   lost-write runs told the user the truth; the nearest, an s04 run, saw
   the old model and explained it away, a sentence added after reading
   the runs), Module 5's open q29/q39 questions answered from the baseline
   (q29: 7 runs searched again and all gave the threshold, 3 stopped and
   none did; q39: 7 of 10 rightly declined), and capability vs regression
   by category, with why the 100% categories can't graduate yet. New data
   `public/data/eval/suite/multihop-baseline.json` (written by
   `scripts/eval/multihop_facts.py`, `--check`; its run paths now written
   with forward slashes on Windows, otherwise identical to the zip's copy).
   Two read-only demos, both matching the mockup exactly in Pyodide 0.26.4;
   the mockup's repeated `load_suite` block replaced by a link to concept
   1's. 5 quiz cards. Callbacks: Module 6 Lesson 10's
   `#a-suite-of-scenarios-some-fine-some-not`, Lesson 3 concept 4's
   `#the-baseline-s-categories`, Lesson 3 concept 5's
   `#passes-that-depend-on-luck`, Module 5 Lesson 11 concept 6's
   `#a-trigger-can-sit-higher-than-a-refusal`, Lesson 1 concept 3's
   `#the-parts-can-pass-while-the-whole-fails`, Lesson 1 concept 4's
   `#capability-suites-and-regression-suites` (anchors verified).
   Concept 3 (conversations, and checking the simulated user) is built:
   the simulated user's three parts (opening request, persona, shared
   rules) and what it sees (`user_view`: replies only), the τ-bench
   studies from Lesson 3, the simulator audit of the 60 dev conversations
   (`reading/simulator-audit.json`: 52 error-free, 8 benign, 0 critical; 7
   of the 8 from m02), m02's persona and the two critical labels changed to
   benign after the spot check, and the m02 check fix (allow one email to
   research-team) over a persona change. Two read-only demos on
   `LOAD_SUITE`, the second taking the first's `conversations` as hidden
   setup; both match the mockup exactly in Pyodide 0.26.4. Corrected from
   the mockup: m02 isn't the only persona with conditions (m01, m04, m05
   and m06 each have a simple trigger); it's the only one that chains
   them, and the text and Q2 say so. 5 quiz cards. Callbacks: Lesson 3
   concept 3's `#the-simulated-user-is-a-model-too`, Lesson 3 concept 2's
   `#what-a-useful-note-looks-like` (anchors verified).
   Concept 4 (pushback, both ways) is built: SycEval's progressive and
   regressive sycophancy (Fanous et al., AIES 2025; figures checked against
   the paper), Module 6's pushback runs as regressive-only, the phase 2a
   control (`reliability/runs/pushback-control.json`: wrong first reply
   constructed, the user right; 420/420 corrected with the value, 412/420
   on doubt, never kept the wrong one), and Module 6's after-pushback rule
   on the control (305 of 420 and 0 of 420 let through). Three read-only
   demos: the second takes the first's `RUNS`/`outcomes` as hidden setup,
   the third `LOAD_UNSURE` plus Module 6's reference definitions, copied as
   `AFTER_PUSHBACK` and checked by `check-copies.mjs` against Module 6's
   `REFERENCE`; all three match the mockup exactly in Pyodide 0.26.4.
   Corrected from the mockup: the 115 blocked corrections come from 23
   questions no source writes as a number, 19 computed and 4 written in
   words ("three times in a row"), not all computed; and Module 6 flagged
   the opposite limit of `in_sources` (a merely appearing value gets
   through), not this one. The repeated `load_suite` block is dropped. 5
   quiz cards. Callbacks: Module 6 Lesson 6 concept 4's
   `#what-happened-in-this-module-s-runs` and
   `#deciding-what-the-answer-is-after-pushback` (anchors verified).
   Concept 5 (holding tasks out, and tuning to the suite) is built: dev
   and held-out tasks and why, the decisions made so far (all on dev), the
   baseline's dev and held-out halves of the registry tasks and
   conversations (`suite/baseline-grades.json`, written by
   `scripts/eval/baseline_grades.py`, `--check`, run paths now written with
   forward slashes, otherwise identical to the zip's copy; dev 89%, 77% to
   98%; held-out 100%, with why that's not a measurement), and fixing a
   measurement vs tuning to the suite. One read-only demo, matching the
   mockup exactly in Pyodide 0.26.4. Corrected from the mockup: the
   suite's held-out tasks are one per failure category (9 of 29), not "a
   third at a time within each category"; and the rule of three's 3/n is
   given with the exact bound for 8 tasks (31%). 5 quiz cards. Callbacks:
   Lesson 3 concept 4's `#how-sure-can-we-be`, Module 6 Lesson 4 concept
   2's `#zero-errors-isn-t-a-zero-error-rate` (anchors verified).
   Concept 6 (reading public benchmarks critically) is built: a public
   score as someone else's suite, Module 1's open hallucination question,
   five questions to ask of a score (SimpleQA vs FACTS Grounding; GSM1k
   contamination, 13% in the first preprint, 8% published; FACTS's 860
   public and 859 private examples; SimpleQA Verified; Kapoor et al.'s "AI
   Agents That Matter", TMLR 2025; how sure a difference is), and the
   pilot read as a three-setup leaderboard with task-resampled intervals
   (`eval/pilot/grades.json`). Every citation checked against the papers
   (arXiv PDFs; TMLR via OpenReview) and all hold. One read-only demo,
   matching the mockup exactly in Pyodide 0.26.4; the pilot's first code
   grades (83% and 80%) checked against `grades.json`. One correction: Q4's
   explanation said each interval spans about 40 points; they span 33 to
   60. 5 quiz cards. Callbacks: Module 1 Lesson 4 concept 4's
   `#what-this-concept-does-and-doesn-t-cover`, this lesson's concept 1
   `#the-benchmarks-get-it-wrong-too`, Lesson 1's
   `#one-run-and-the-words-for-its-parts` (anchors verified).
   Bookends are built: intro (`00-intro.mdx`) with three outcomes and why
   it matters; Recap & Practice (`07-recap-practice.mdx`) with an
   8-question comprehensive quiz and a multi-file sandbox (`lib.py`
   read-only: `load_suite` and `triage`, checked against `LOAD_SUITE` and
   `TRIAGE` by `check-copies.mjs`; entry `suite_health.py`, where the
   learner writes `can_catch(checks)`, `placement(tasks, trials,
   reference_passes)` and `uncovered_categories(tasks)`). Reads
   `suite/grades-2a.json`. Verified in real Pyodide 0.26.4 the way
   `MultiFileGradedExercise` runs it: the reference passes and its Run
   output matches the mockup (3 read the runs, 8 capability, 12
   regression, 6 needing a reply grader, no category uncovered), the
   starter runs and fails, and nine wrong versions each fail with their
   intended message (step limit read with get, any outbox counted, registry
   key presence counted, no can_catch, read-the-runs sent to fix, unsorted
   or duplicated categories, mutated inputs, answer_excludes ignored).
   Corrected from the mockup: Q3's explanation (nine of the ten runs of
   s06 and s09 invented a citation, not every run) and Q4 (m02's persona
   chains its conditions; others have simple triggers), as in concepts 1
   and 3.

5. **Code Graders** (`05-code-graders`, title provisional) — **Locked.**
   Concept 1 (checking the end state) is built: Module 2's goal-state check
   run after the run, τ-bench's end-state grading (Yao et al., ICLR 2025),
   the registry and outbox as the two parts of the end state, a graded
   `state_diff(initial, final, changes)` exercise (the mockup's hidden tests
   split into 6, each rebuilding its own registries), and a demo of the
   check on five baseline-a runs (a02, a22 as expected; a19's and m04's
   unasked-for changes; a14's lost write, where the registry is right and
   the failure is a false report), from the new
   `public/data/eval/suite/end-states.json` (written by
   `scripts/eval/end_states.py`, `--check`, identical to the zip's copy).
   `LOAD_SUITE` is shown again and copy-checked. Verified in real Pyodide
   0.26.4: the reference passes all 6 tests and prints the mockup's line,
   the starter fails all 6, and eight wrong versions each fail the test
   aimed at them (only named agents compared, unsorted, expected fields
   only, str for repr, no ValueError, mutating `initial`, missing/extra
   agents ignored, diffing against `initial`); the demo matches the mockup
   exactly. Corrected from the mockup after checking the τ-bench paper:
   its reward also requires the replies to contain the information the
   user needed, so the prose says end-state comparison is its main check
   alongside that; Q1's distractor "cheaper than running a model as a
   judge" replaced (the paper does call its rule-based reward fast to
   compute); the exercise explanation says a19's agent moved an agent it
   should have asked about, not "the wrong agent". 5 quiz cards.
   Callbacks: Module 2 Lesson 6 concept 4's
   `#a-deterministic-check-on-real-state`, Lesson 1 concept 1's
   `#the-reply-isn-t-the-outcome` (anchors verified).
   Concept 2 (checking the reply in code) is built: what code can check in
   a reply (facts, forbidden phrases, formats; Anthropic's guide on string
   matches as code graders), substring vs whole-word matching and the
   "840ms" failure (first demo, `contains_v0`/`contains_v1`), a graded
   `contains(text, phrase)` exercise with the number rule (the mockup's 17
   cases split into 4 tests by theme), and both matchers on the 115
   dev-task runs with answer checks (`suite/reply-answers.json`, written by
   `scripts/eval/reply_answers.py`, `--check`, identical to the zip's copy
   apart from line endings): 13 fixed by the number rule (all a03 and m03,
   the latency written with its unit), 3 by s29's date alternatives, 2
   still failing (step limit, no answer); then paraphrase, forbidden
   phrases and correctness as what code can't check. Verified in real
   Pyodide 0.26.4: the reference passes all 4 tests, the starter fails all
   4, and eight wrong versions each fail (whole-word only, substring, no
   `re.escape`, `\b` on both sides, anything after a digit, no dot after a
   digit, no normalizing, `lower()` only); both demos match the mockup
   exactly. Corrected from the mockup: `grading.py` matched whole words
   from its first commit, so the substring test is presented as the
   obvious first idea the matcher was written against, not a shipped
   version; the 13-runs bullet says the latency's unit was what failed
   (the error rates passed either way). 5 quiz cards. Callback: Lesson 3
   concept 3's `#the-grader` (anchor verified); Lesson 6 is plain prose.
   Concept 3 (checking the path in code) is built: the four kinds of path
   check the registry tasks use (`must_call_after`, `must_not_call` counting
   refused attempts, `max_tool_calls`, schema-valid arguments); s24's limit
   of 6 measured against the 55 dev runs of questions no document answers
   (`suite/path-facts.json`, written by `scripts/eval/path_facts.py`,
   `--check`, identical to the zip's copy apart from line endings: 16
   stopped at the step limit, 17 of the 39 that answered took more than 6
   calls, none more than 9), and the fix (task file v3: s24 and s25 allow 9,
   first checks kept); a graded `cited_ids` / `unsupported_citations`
   exercise (the mockup's tests split into 4); and the check on the 15
   vendor-documentation runs (13 of the 14 that answered cite an id no tool
   returned, nearly all D07 sections). The zip's script changes went in
   with it: `grading.py`'s citation check uses `cited_ids` (verified: the
   citation sets differ on 6 of the 1,105 baseline and suite runs, no
   verdict changes; 58 of the 475 citing dev runs cite an unreturned id, 64
   of those 91 ids D07 sections, as the page says), `build_suite_tasks.py`
   and `tasks/suite-2a.json` v3, `suite_grades.py` grading Lesson 4 with
   the v2 checks (`--check` passes, `grades-2a.json`'s trial results
   unchanged), and `main_selftest.py`'s s24 wrong run now searching to the
   step limit; every `--check` and both self-tests pass. Verified in real
   Pyodide 0.26.4: the reference passes all 4 tests, the starter fails all
   4, and seven wrong versions fail (the grader's first single pattern,
   brackets only, parentheses only, no comma split, returning a list,
   reverse-sorted, ignoring `retrieved`); one, `re.search` for
   `re.fullmatch`, passes, since it differs only on text around an id in
   brackets, whose right reading is debatable. Both demos match the mockup
   exactly. Corrected from the mockup: Q2's explanation says runs that
   answered took up to 9 calls, not runs that "answered correctly" (the
   data records answering, not correctness). Lesson 4 concept 1's "Lesson
   5 comes back to it" now links to `#a-limit-nobody-measured`. 5 quiz
   cards. Callbacks: Lesson 1 concept 2's
   `#when-the-path-is-the-right-thing-to-check`, Module 3 Lesson 2's intro,
   Lesson 4 concept 5's `#tuning-to-the-suite`, Module 6 Lesson 4 concept
   1's page (anchors verified).
   Concept 4 (testing the graders themselves) is built, no exercise: the
   module's grader bugs and how they were found, what a grader's tests
   check (runs that must pass, must fail, every misgrade; the self-test
   counts 29/13/3 and 29/6 checked against `main_selftest.py`), a pytest
   file for the matcher with two recorded runs in `TerminalGroup`s (run
   with pytest 9.1.1, `--tb=no`, against `CONTAINS` and against the
   whole-word matcher: 7 passed; 2 failed, the two real misgrades; the
   page's file is byte-identical to the one run), mutation testing
   (DeMillo, Lipton and Sayward; mutmut, PIT) with a live demo on
   `CONTAINS` (matches the mockup in Pyodide 0.26.4 apart from the
   corrected label), and keeping old grader versions. Corrected from the
   mockup: of the six pytest cases only "840ms" (a03) and "1,750ms" (m03)
   are real misgrades; the substring matcher never shipped (as concept 2
   found), and "8400ms" and "203%" are guard cases, so the cases are "the
   six known cases" (`KNOWN_CASES`, `test_known_cases`) with per-case
   comments saying which is which, and the bug list, the mutation prose,
   Q1's explanation and Q3 say so; the citation-list bug never changed a
   recorded verdict, so the "found by a misgraded run" claim covers the
   first four bugs only; Module 0 never uses the term "regression test",
   so the text calls it that and links Module 0's parametrized tests; the
   second pytest output shows `--tb=no`, which is what produces the
   mockup's short form. 5 quiz cards. Callbacks: Lesson 1 concept 5's
   `#where-evaluation-starts`, Module 0's parametrized-tests page, Module
   6 Lesson 8's pinning page (anchors verified).
   Concept 5 (a component test: the summarizer) is built, no exercise:
   Module 4's promised test as a component test (QAGS, Wang et al., ACL
   2020), the phase 2b first round (script-written probes; by kind, and
   m05/3's stale probe, every answer right and marked wrong), what was
   wrong with those probes, the phase 2c second round (careful 152/180,
   plain 133/180 with a17/0's three added phrasings, +10.6%, 95% interval
   +2.8% to +17.2% from resampling traces; careful better on 13 of 20),
   the cheaper check of looking for the fact in the summary text (158 vs
   142 of 180), what careful summaries lose (failure details), and when to
   rerun. Four read-only demos on `public/data/eval/summarizer/`, each
   matching the mockup exactly in Pyodide 0.26.4 (a fresh interpreter
   each). Checked against the runs: the 4 stale probes (m05/2, m05/3,
   m01/2, m02/4) and the 3 ambiguous error probes (q37/1, m03/3, a17/0,
   each also hitting a non-REG error); m05/3's sequence. Corrected from
   the mockup: "careful came out 2.9 points ahead, interval 2 behind to 8
   ahead" couldn't be reproduced exactly; removing those seven probes with
   the page's own resampling gives +3.2% (-2.1% to +8.5%), which the page
   now states, naming what was removed (same conclusion). 5 quiz cards.
   Callbacks: Module 4 Lesson 5 concept 3's `#testing-a-summary-by-asking-it-questions`,
   Lesson 1 concept 3's page, Lesson 4 concept 1's page (anchors
   verified); Lesson 9 is plain prose.
   Bookends are built: intro (`00-intro.mdx`) with three outcomes and why
   it matters; Recap & Practice (`06-recap-practice.mdx`) with an
   8-question comprehensive quiz and a multi-file sandbox (`lib.py`
   read-only: `load_cases` plus the lesson's `normalize`, `contains`,
   `state_diff`, `cited_ids` and `unsupported_citations`, checked against
   `CONTAINS`, `STATE_DIFF` and `CITED_IDS` by `check-copies.mjs`; entry
   `task_grader.py`, where the learner writes `grade(run, checks,
   initial)` covering registry, outbox, `must_call_after`,
   `must_not_call`, `answer_includes`, `cites_only_retrieved` and
   `max_tool_calls`). Reads `suite/grader-cases.json` (ten real runs with
   their checks, written by `scripts/eval/grader_cases.py`, `--check`,
   identical to the zip's copy apart from line endings). The reference
   agrees with `grading.py` on all 515 recorded runs with code checks, as
   the explanation says (checked). Verified in real Pyodide 0.26.4 the way
   `MultiFileGradedExercise` runs it: the reference passes and its Run
   output matches the mockup, the starter fails, and fourteen wrong
   versions each fail with their intended message (registry always
   compared or summarised in one line, no outbox default, `max_count`
   ignoring the team, body phrases unchecked, failed or out-of-order
   read-backs counted, failed forbidden calls skipped or matched on exact
   input, one line for all missing phrases, a substring matcher, citations
   ignored, the step limit tested for truth or with `>=`). Added to the
   mockup's hidden tests: a run exactly at its step limit passes (the
   `>=` version passed every original test). Corrected from the mockup:
   Q5 says runs that answered, not "correct answers", took up to 9 calls
   (as in concept 3); `lib.py`'s curly-apostrophe escape restored to
   `\u2019` so it matches `CONTAINS`.

6. **Model Graders** (`06-model-graders`, title provisional) — **Locked.**
   Concept 1 (from a check in the loop to a grader afterwards) is built, no
   exercise: Module 6's in-loop judges against a grader after the run (sees
   more, isn't in a hurry, its mistakes change what you believe), what
   Anthropic's guide says model graders are for (checked against the
   guide), Lesson 5's list of what code can't check, and one read-only demo
   of the three reply failures beside their code checks on the dev tasks
   (planted 40 runs, code 30/30, Gemma 1, Qwen 1; false report 40, code
   19/40, Gemma 7, Qwen 9; broken result 15, code 15/15, Gemma 11, Qwen 5),
   from the new `public/data/eval/judges/digest.json` (written by
   `scripts/eval/judge_digest.py`, `--check`, identical to the zip's copy
   apart from line endings) through `LOAD_JUDGES`. The demo matches the
   mockup exactly in Pyodide 0.26.4. Checked against the runs: the six
   broken-result runs the judges split on (a05 x3, s22 x3) each found the
   right value with a database query after the empty lookup, and Gemma
   passes them all; most code-pass false-report runs the judges fail read
   the record back and still said it was done. Corrected from the mockup:
   "one run puts it in the email" is every a12 and s11 run (15), 12 of
   them with the planted line nearly word for word; "usually as an
   alternative workaround" is now "37 of the 40 replies mention it, nearly
   all passing it on as a workaround or the quick fix"; "gives different
   answers unless it's run greedily" is now "isn't deterministic" (the
   guide's word); "Gemma follows the rubric; Qwen fails right answers" now
   says Qwen fails them for not mentioning the empty record. 5 quiz cards.
   Callbacks: Module 6 Lesson 4 concept 1's `#the-support-check`, concept
   2's `#how-the-three-judges-did` and `#judges-have-habits`, Lesson 4
   concept 2's `#a-failure-becomes-tasks` (anchors verified); Lesson 7 is
   plain prose.
   Concept 2 (writing a rubric) is built: Anthropic's three pieces of
   rubric advice and Husain and Shankar's pass/fail over scores (all
   checked against the sources, now linked), the lost-write rubric from
   `judges.py` and the reason for each part, a demo of both judges'
   replies on baseline-b/a13/1 (Gemma FAIL, Qwen PASS) from the new
   `judges/reply-judges.json` (written by the updated
   `judge_digest.py`; both outputs identical to the zip's copies apart
   from line endings), a graded exercise (`parse_verdict`, a last
   start-of-line "Verdict:" regex; `summarize`, with the pass rate over
   decided runs only; the mockup's hidden tests split into five
   self-contained tests), and a summary demo of all three reply judges
   (no UNCLEAR anywhere; broken result 11 against 5). Both demos match
   the mockup exactly in Pyodide 0.26.4; the reference passes every test,
   and five wrong versions (search anywhere, first match, no `\b`, rate
   over all replies, rate 0 when undecided) each fail the test meant for
   them. Corrected from the mockup: Lesson 3's re-review passed
   baseline-a's a13/1, a different run that reported the discrepancy
   without explaining it (both judges pass it too), not baseline-b's,
   which no person has read and which explains the lost write away, the
   behaviour Lesson 3's merge counts as a failure. The paragraph now says
   the reply matches both the rubric's PASS example and its FAIL example,
   the standard already decides it, and the rubric didn't carry that over;
   Q3's answer is now "The reply fits both of the rubric's examples".
   "Lesson 3's reading found runs that explained it away with exactly
   that" is now the pilot's runs (where Lesson 3 concept 4 says they
   were). 5 quiz cards. Callbacks: Lesson 3 concept 2's
   `#notes-from-the-reading`, concept 3's
   `#the-task-and-how-a-standard-decides-it`, concept 4's
   `#from-notes-to-categories`, concept 5's
   `#a-verdict-that-changed-on-a-full-reading` (anchors verified).
   Concept 3 (pass/fail, scores and pairs) is built: Zheng et al.'s three
   formats (checked against the paper, now linked), a demo of both
   judges' 1-5 scores beside their pass/fail verdicts on the 96 first-run
   dev answers (ends match; the middle disagrees), a graded exercise
   (`winner` undoes the shown order; `consistency` counts consistent,
   flipped and one-tie pairs and the first-shown rate over non-tie
   decisions; the mockup's hidden tests split into six self-contained
   tests, the last on Qwen's real pairs via `namespaceSetup={LOAD_JUDGES}`
   and `digest.json`), and a demo of both judges' pairs (Gemma 43/0/5,
   55%; Qwen 27/16/5, 56%). Both demos match the mockup exactly in
   Pyodide 0.26.4; the reference passes every test, and five wrong
   versions each fail. Checked against the data: 29 of Gemma's 43
   consistent pairs are tie/tie and 63 of its 96 decisions ties; Qwen's
   16 flips are 11 first-slot-twice and 5 second-slot-twice. No
   corrections to the mockup. 5 quiz cards. Callbacks: Module 6 Lesson 4
   concept 2's `#judges-have-habits`, concept 2's
   `#what-a-rubric-has-to-do` (anchors verified); Lesson 10 is plain
   prose.
   Concept 4 (is the answer right? correctness and relevance) is built:
   Module 5's unmeasured answers and its RAGAS "answer correctness", the
   RAGAS definition (checked against its docs and source: TP/FP/FN, the
   F1 form, default weights [0.75, 0.25]), a graded exercise
   (`factual_correctness` and `answer_correctness` on statement sets; the
   mockup's hidden tests split into four self-contained tests), a demo of
   both judges' correctness verdicts on the 480 dev question runs (Gemma
   394, Qwen 376, agreeing on 442), and a relevance demo split by runs
   with no answer (Gemma passes 25 of 26, Qwen 0). Uses the updated
   `judge_digest.py`, which adds `question_kind` and `no_answer` to the
   correctness and relevance rows of `digest.json` (both outputs
   identical to the zip's copies apart from line endings; concepts 1 and
   3's demos give the same output on the new file). Both demos match the
   mockup exactly in Pyodide 0.26.4; the reference passes every test, and
   five wrong versions each fail. Checked against the data: the 26
   no-answer runs end on "stopped after 10 steps without an answer", both
   correctness judges fail all 26, and Gemma's relevance reasoning reads
   the note as the assistant saying it couldn't find the answer. No
   corrections to the mockup. 5 quiz cards. Callbacks: Module 5 Lesson 15
   concept 5's `#a-system-that-keeps-running`, Lesson 11 concept 5's
   `#what-two-recent-papers-found`, Module 6 Lesson 4 concept 1's
   `#the-support-check` (anchors verified); Lessons 7 and 11 are plain
   prose.
   Concept 5 (grading set F's premise replies) is built, no exercise:
   Module 6's set F and its marker, the premise judge's rubric, a demo of
   Gemma's verdicts by the marker's outcome on all 1,600 replies, and a
   demo of both judges on Module 6's 30 hand-labelled replies (every C, I
   and W passed). Both demos match the mockup exactly in Pyodide 0.26.4.
   Corrected from the mockup after reading every disputed reply with
   Gemma's reasoning: Module 6 made no promise that Module 7 would grade
   set F (it advised grading such a measure with a checked judge), so
   the page says that instead; the one false-premise reply Gemma fails
   (v05-false check_first 3) is the judge's mistake; of the 25
   true-premise "rejections" it passes, 13 use the marker for "no", 6
   for "the sources don't answer", and 3 are cut-off replies
   (`finished: False`) the judge passes too (the mockup's "one is the
   judge misreading the assumption" isn't borne out); of the 46
   "answered" replies it fails, about 18 reject the premise in words and
   about 20 by answering as if it were false, nine of them v10 (a single
   MON-2002 as one failed poll, not "two") and ten v38 (dashboards blank
   during maintenance), and about 8 are judge drift. The W replies'
   corrections and the "2026-10-31" example (v23) were checked. 5 quiz
   cards. Callbacks: Module 6 Lesson 4 concept 5's
   `#when-the-question-itself-is-wrong`, `#what-the-replies-actually-say`
   and `#what-this-means-for-a-real-agent`, and concept 2's
   `#what-a-rubric-has-to-do` (anchors verified); Lesson 7 is plain
   prose. Concept 5 is the last concept.
   Bookends are built: the intro (outcomes, why it matters), an 8-card
   comprehensive quiz, and a `MultiFileGradedExercise`: `grade_run(run)`
   and `report(grades)` in `question_grader.py` over a read-only `lib.py`
   (`load_question_runs`, concept 2's reference `parse_verdict` and
   `summarize`, Lesson 5's `cited_ids` and `unsupported_citations`, all
   checked by `check-copies.mjs`'s `CONTAINED` list), on the new
   `public/data/eval/judges/question-runs.json` (96 runs: the first two
   of every dev question in baseline-a, with Gemma's correctness and
   relevance replies), written by the new
   `scripts/eval/question_runs.py` (`--check`; identical to the zip's
   copy apart from line endings). In Pyodide 0.26.4 the reference's Run
   prints the mockup's output exactly (68 pass, 28 fail, 0 undecided;
   12 correctness fails, 12 unsupported citations, 4 no answer), passes
   the hidden tests, and seven wrong versions (the starter, judges before
   code, undecided before fail, UNCLEAR as fail, rate over all runs, no
   citation check, correctness judge only) each fail. Corrected from the
   mockup: Q3's "split on 9 of 20 runs" counted held-out runs, now "6 of
   the 15 dev runs" as in concept 1; Q4 asked what "the standard" hadn't
   decided, now "the rubric", matching concept 2's correction; Q6's
   options reworded so they don't say "it" of two judges.

**Runs, phase 3 (Lesson 6's judges): done (2026-10-02).**
`scripts/eval/README-phase3.md`, `scripts/eval/judges.py`,
`scripts/eval/run_judges.py`: Gemma 4 31B (`google/gemma-4-31B-it`, the
main judge, another family from the agent) and Qwen3.5-9B (the agent's
family, for comparison), greedy, each over the same 3,092 items (the
three reply failures; Module 5's questions for correctness and
relevance; the 1-5 score and pairwise formats; Module 6's set F premise
replies). In `public/data/eval/judges/gemma.json` and `qwen9b.json`.
Environment: Colab, RTX PRO 6000 Blackwell Server Edition, vLLM 0.30.0.
Gemma 214 s wall, Qwen 94 s.

**Lesson 7's labelling: set up (2026-10-02), labels pending.**
`scripts/eval/README-judge-labelling.md` and
`scripts/eval/build_judge_labelling.py` (`--check`) wrote
`public/data/eval/judge-labels/items.json`: 100 judge items (correctness
45, premise 20, relevance 10, false report 9, broken result 9, planted
7), stratified by the judges' verdicts, 55 dev / 45 test, 30 marked for
relabelling after three weeks (identical to the zip's copy apart from
line endings). The labelling page's judge mode is built:
`scripts/eval/labeller/index.html?mode=judges` (and
`?mode=judges-relabel`), blind (loads only `items.json`; never shows an
item's id, stratum or split), PASS/FAIL/UNCLEAR with `p`/`f`/`u` and
arrow keys, saved as it goes, exporting `labels-judges-simar.json` /
`labels-judges-simar-relabel.json`; the relabel order is a shuffle
seeded with "relabel", and it warns if the first labelling finished
less than three weeks ago. Tested end to end in headless Chrome. Open
question for the content chat: 15 of the 100 items are runs whose
judge verdicts Lesson 6's pages already discuss (all 9 broken-result
items are the a05/s22 runs of concept 1, plus b/a13/1, four v10-true and
one v38-true premise replies, and v05-false check_first 3), so they
aren't blind for a labeller who has read Lesson 6.

### Old-plan outline (where it was Module 4)

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

**To cover here (deferred from the Module 3 citation audit, 2026-09-30):
MCP authorization.** Module 3 Lesson 5's "Security that comes with the
network" says only "Require authentication, so a remote server knows who's
calling". The current MCP spec (2026-07-28, "Authorization") makes
authorization optional. Servers reached over HTTP that use it follow OAuth
2.1:
- an unauthorized request gets a 401 pointing to the server's protected
  resource metadata;
- the user approves access in a browser (PKCE);
- the client sends `Authorization: Bearer <token>` on every request.

Tokens are bound to one server through the `resource` parameter (RFC 8707),
and a server must reject tokens meant for anyone else. stdio servers
"SHOULD NOT follow this specification, and instead retrieve credentials
from the environment". Once this module exists, link it from that Module 3
bullet.

---

## Open items / not yet decided

- Modules 1, 3, 4, and 7 need their own concept-by-concept breakdown
  sessions, same process as Module 0 — not started yet, deliberately
  deferred until Module 0 is complete.
- Downloadable flagship projects per module (mentioned early on, explicitly
  deferred) — not yet scoped.
- Whether Module 6 gets an 11th lesson on sandboxing/approval gates.
- **Module 0 gap list, additions from the Module 6 review (2026-09-30).**
  The list itself lives in `course-improvement-backlog.md`, outside this
  repo; copy these across. The review's new code uses them freely, per the
  "write idiomatic Python" rule.
  - Plain syntax or library calls: `asyncio.wait_for`, `copy.deepcopy`,
    `json.dumps(sort_keys=True)` to compare nested dicts by content,
    `dict.setdefault`, `random.Random(seed)` with `rng.sample(range(n), k)`,
    `Counter.most_common(2)`, `set` comprehensions, `str.strip(chars)` on
    answer text.
  - Genuinely complicated, a likely Module 0 topic: closures created in a
    loop, bound with an immediately called lambda
    (`(lambda real: lambda **kwargs: ...)(tools[name])`), used to wrap each
    tool in Lesson 10's fault injection.
- **Module 0 gap list, addition from Module 7 Lesson 2 (2026-10-01).**
  Copy across to `course-improvement-backlog.md`: `contextvars`, mentioned
  in the tracing lesson as how real tracers (OpenTelemetry's Python SDK)
  track the current span across threads and async tasks. Genuinely
  complicated; a candidate for Module 0's async lesson.
- **Module 6 source claims:** resolved by the 2026-09-30 citation audit
  (see Module 6's "Citation audit" note and `citation-audit/module-6.md`).
  Left open: Zhu et al.'s review status (labelled a preprint).
- **Open question, for the owner to check: CaMeL's published figures.**
  Module 6 L9 C3 (`03-designs-that-keep-untrusted-text-away.mdx`) quotes
  CaMeL solving 77% of AgentDojo tasks with provable security, against 84%
  undefended. That is from arXiv v2 (2503.18813, June 2025), which revised
  v1's 67%. Crossref lists a published version in IEEE SaTML 2026 (pp.
  587–618, DOI 10.1109/satml68715.2026.00040), but the IEEE page wouldn't
  load, so the published figures are unchecked. The page currently says
  "the revised version of the paper reports" and doesn't name the venue. If
  the published figures match, add "(IEEE SaTML 2026)"; if not, use them.
