# Course Website — Architecture Decisions

> **Status:** Living document. This defines the *current* setup for a
> personal-project course site: mostly-static/zero-cost, with real sandboxed
> execution (E2B + a Cloudflare Worker, §4.2) now added alongside Pyodide
> specifically where in-browser Python genuinely isn't enough (first needed
> for Lesson 0.8, Docker). Expect this doc to keep changing as later modules
> (agent frameworks, real tool execution) push further on what a lesson
> needs to actually run.
>
> **For Claude Code:** treat this as the source of truth for how the site is
> structured and built. When a course section requires something this doc
> doesn't cover yet (e.g. real sandboxed execution, persistence, auth), stop
> and flag it — don't silently improvise new infrastructure. Update this file
> alongside any architectural change so it stays accurate.

---

## 1. Goals & constraints

- **Cost: effectively $0 by default, small and usage-bounded where not.**
  No paid hosting, no server-side LLM calls billed to the site owner. The
  one exception is real-Docker exercises (§4): each spins up a genuinely
  billable E2B sandbox on the free/hobby tier, brokered through a
  Cloudflare Worker — bounded by a shared-secret header plus CORS locked
  to the site's own origin (soft deterrents against abuse, not real
  security — see the comment in `worker/src/index.ts`), with a real
  Cloudflare rate-limit rule still worth adding on top.
- **Content authoring must be easy for a non-developer (or future collaborators)
  to manage.** Adding/editing a lesson should mean adding/editing content
  files (a lesson folder of `.mdx` pages), not touching app code.
- **Local preview.** The site owner should be able to run the site on their
  own machine, see changes live, before pushing.
- **In-browser code execution for simple exercises**, wired per-lesson via
  config, not hardcoded per page.
- **Explicitly out of scope for now:** server-side LLM proxying, user
  accounts, payments. (Real containerized sandboxes *were* out of scope —
  see §4, now implemented via E2B for exercises Pyodide genuinely can't do.)

---

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Astro** + **MDX** | Content-first static site generator. Ships zero JS by default; interactive bits (like the sandbox) are opt-in "islands," so most of the site stays fast and free to host. Better fit than Next.js for a content-heavy course site. |
| Content model | **Astro Content Collections** | Lessons are files with typed frontmatter (title, module, order, sandbox config). Astro validates structure at build time, so a malformed lesson file fails the build loudly instead of breaking silently. |
| In-browser execution | **Pyodide** (Python compiled to WASM) | Runs entirely client-side. Zero server cost, scales to any number of learners for free. Good enough for concept-level exercises (agent loop logic, tool-call parsing, state handling written in plain Python). |
| Real-Docker execution (where Pyodide can't) | **E2B** ephemeral sandboxes (real Ubuntu + Docker CE, via a custom `course-docker-sandbox` template) + a **Cloudflare Worker** (`/worker`) as the broker holding the E2B API key server-side | For exercises that genuinely need real containers/subprocess/networking — Pyodide has no such capability at all. See §4 for the full architecture. |
| Code editing | **CodeMirror 6** (`@uiw/react-codemirror` + `@codemirror/lang-python` + `@uiw/codemirror-theme-vscode`) | Real syntax highlighting (VS Code's own dark theme) and Python-aware completion for every editable code box — a plain `<textarea>` can only render flat, single-color text. Lighter than Monaco, a real editor rather than a highlight-only overlay trick. |
| LLM calls (when a lesson needs one) | **Learner's own API key**, stored in browser `localStorage` only, sent directly from the browser to the provider's API | Keeps cost and liability at $0 regardless of traffic. Never touches any server we control. |
| Real tokenization (Module 1) | **`gpt-tokenizer`** (pure JS/TS port of OpenAI's `tiktoken`, no WASM) | Client-side, real BPE splits against an actual production vocabulary (`o200k_base` by default) rather than a fabricated illustration — first needed for `TokenizerVisualizer.tsx` in Lesson 1.1. **Finding (Lesson 1.1, Concept 3):** the older `cl100k_base` (GPT-4) encoding badly under-tokenizes many non-English scripts (measured Hindi at 17 tokens vs. 5 for an equivalent English sentence), but `o200k_base` narrowed this dramatically for some languages — Hindi measured identical to English (5 vs. 5) on `o200k_base`. The disparity is still real and large for others (Thai 8, Burmese 9, Khmer 12, Amharic 19, all vs. 5) — verify current numbers directly with `encode()` before citing a specific language/count in lesson content rather than assuming an older tokenizer's well-known examples still hold. |
| Real word embeddings (Module 1) | Real **GloVe** vectors (`glove-wiki-gigaword-100`, via `gensim`), generated **offline only** (`scripts/generate-embedding-words.py`, needs Python <= 3.12 — `gensim`'s C extensions don't build on 3.13+) and PCA-projected to 2D (`scikit-learn`) into a static `src/data/embedding-words.json` lookup table (~250 words, ~7KB) | Genuine embedding positions for `EmbeddingSpace.tsx` (Lesson 1.2) rather than hand-placed coordinates, without shipping any ML runtime or model weights to the browser — only the small resulting JSON ships. Re-run the script (adding words to its `WORDS` list) to extend the vocabulary; a word missing from GloVe is silently skipped and printed to stderr. **Finding (Lesson 1.2, Concept 1):** real embedding distance doesn't always match a learner's intuitive/taxonomic expectation — GloVe places "dog" almost exactly on "cat" (cosine similarity 0.88) but "kitten" measurably farther from "cat" (0.56) than "dog" is, despite "kitten" being the definitionally closer word (baby cat). The broad story the demo relies on (two well-separated clusters — animals vs. vehicles) holds up clearly and robustly; don't assume a specific fine-grained ordering within a cluster without checking real cosine similarities first. Real embedding coordinates can also land close enough that naive fixed-position labels overlap into unreadable text (`cat`/`dog` did, initially) — a shared collision-avoidance pass in `src/lib/labelPlacement.ts` (try 8 candidate label positions per point, take the first that doesn't overlap an already-placed label) fixes this for both `EmbeddingSpace.tsx` and `SentenceEmbeddingSpace.tsx` below, rather than assuming labels never collide. |
| Real sentence embeddings (Module 1) | Real **sentence-transformers** vectors (`all-MiniLM-L6-v2`, 384-dim), generated **offline only** (`scripts/generate-embedding-sentences.py`, needs `sentence-transformers` — pulls in `torch`, a much heavier offline-only install than `gensim`) into a static `src/data/embedding-sentences.json` (a small **curated bank**, not a lookup table — 19 sentences: 16 from Concept 3, plus 3 appended, never inserted, for the lesson's Recap & Practice closing synthesis, so every earlier concept's hardcoded index references stay valid) — each entry carries both a 2D PCA projection (`x`/`y`, for the plot) and the full unit-normalized 384-dim `vector` (for an exact, live-computed pairwise cosine similarity — the 2D projection alone can't be used for that; PCA preserves overall variance, not pairwise angle) | A sentence box can't reuse the word-embedding approach's "fixed vocabulary, precompute every entry" trick — sentences are open-ended, so nothing can be precomputed for arbitrary learner-typed text. Asked the user rather than assuming: real embeddings computed live in-browser (a heavier client-side ML runtime) vs. a curated precomputed bank vs. a free client-side approximation (mean-pooling the existing GloVe word vectors — real math, but a known-weak technique for exactly the "different wording, same meaning" property this demo needs to reliably show). Went with the curated bank — `SentenceEmbeddingSpace.tsx` (Lesson 1.2, Concept 3, extended with an optional `showSimilarityTable` prop in Concept 4 and an optional `defaultChecked` prop for the Recap & Practice page) lets a learner toggle which of the bank's sentences appear on the plot rather than typing their own, and Concept 4 adds a live pairwise cosine-similarity table (`src/lib/cosineSimilarity.ts`) underneath so the visual clustering and the actual driving number sit side by side. Verified real paraphrase pairs land close together and unrelated sentences land far apart (cosine similarity 0.56-0.89 within a pair vs. -0.06-0.07 across unrelated ones, including the 3 sentences appended for Recap & Practice) before shipping. **Finding (Lesson 1.2, Concept 4):** the mockup's own toy 2D cosine-similarity example (hand-computed, not run) cited `cosine_similarity(cat, car) = 0.0173`; the real computed value for those exact same coordinates (already shipped in Concept 2's toy embedding table) is `-0.1078` — small and still "close to zero" in spirit, but a different sign and magnitude than claimed. Fixed by citing the real, live-demo-verified number in the lesson prose instead of re-deriving by hand. |
| Real attention weights (Module 1) | Real self-attention weights extracted from the same `all-MiniLM-L6-v2` model's underlying BERT-style encoder (`transformers`, `output_attentions=True`), averaged across every layer and head, generated **offline only** (`scripts/generate-attention-weights.py`) into a static `src/data/attention-sentences.json` — a **small, hand-verified curated bank** (6 sentences, 3 contrasting word-sense pairs), not a "type any sentence" tool | Asked the user again (third time this pattern has come up): real attention from this small model is genuine but inconsistent — of ~25 candidate word-sense-ambiguous sentences tested, only some showed a clean, strongly dominant attention pattern toward the actual disambiguating word; many showed weak/diffuse attention with no clear winner (a documented real phenomenon in small/distilled models, not a bug — see Jain & Wallace 2019, "Attention is not Explanation"). Also found and worked around a real attention-sink effect: `[CLS]` alone absorbed ~60% of raw attention mass regardless of content, which would have swamped the actual signal — excluded `[CLS]`/`[SEP]` from both display and normalization (standard practice, e.g. BertViz) rather than showing raw un-adjusted weights. Went with curating only the hand-verified clean examples (`AttentionExplorer.tsx`, Lesson 1.3 Concept 2) rather than shipping a broader "any sentence" tool that would sometimes fail to show anything meaningful, or a misleadingly cherry-picked one framed as general-purpose. **Finding (Lesson 1.3, Concept 2):** the mockup's own toy weighted-combination example (hand-computed, not run) cited `contextualized_representation(...) = [0.775, 0.115]` for its 6-token toy attention/value example; the real computed value is `[0.772, 0.103]` — close but not exact, another hand-calculation error caught by running it. |
| Real next-token predictions (Module 1) | Real logits from **GPT-2** (124M, `gpt2` via `transformers.AutoModelForCausalLM`) — a genuine causal/autoregressive language model, unlike the BERT-style encoder (`all-MiniLM-L6-v2`) used for embeddings and attention, since only an actual language-modeling head produces a real next-token distribution — softmaxed and top-8'd, generated **offline only** (`scripts/generate-next-token-distributions.py`) into a static `src/data/next-token-distributions.json`, a **small curated bank** (10 prompts: 6 from Concept 1, plus 4 appended, never inserted, for the lesson's Recap & Practice closing synthesis — `NextTokenDistribution.tsx`'s `promptIndices` prop picks a subset, defaulting to a pinned `[0..5]` constant rather than "all of them," so the bank growing later can't silently change Concept 1's own page), same reasoning as the sentence-embedding/attention-weight demos: a "type any sentence" box can't be precomputed | Unlike the attention-weight case, GPT-2's next-token predictions didn't need heavy filtering — next-token prediction is literally its training objective, not an emergent, sometimes-noisy property, so candidate prompts were spot-checked for a sensible, well-distributed top-8 rather than individually hand-verified one by one. **Finding (Lesson 1.4, Concept 1):** the mockup's own toy softmax example (hand-computed, not run) cited `mat: 0.618, floor: 0.207, chair: 0.153, moon: 0.008, xylophone: 0.002`; the real computed values for those exact logits are `mat: 0.631, floor: 0.210, chair: 0.156, moon: 0.002, xylophone: 0.000` — another hand-calculation error (this is now the fourth mockup-cited number this project has caught by actually running the code — see the cosine-similarity and attention-weight findings above, plus Lesson 1.1's BPE token count). **Finding (Lesson 1.4, Concept 2):** this one wasn't just a wrong cited number — the mockup's toy autoregressive-loop demo had a real logic bug. Its `toy_rules` dict was keyed by tuples of increasing length (3, 4, then 5 tokens), but the lookup did `toy_rules.get(tuple(sequence[-3:]), ".")` — always slicing to exactly the last 3 tokens, which only ever matches the first key. Run as written, the loop prints `['The', 'cat', 'sat', 'on']`, then `[..., '.']`, then `[..., '.', '.']` — never reaching `"the"` or `"mat"` at all, contradicting the surrounding prose. Fixed by keying the lookup on the full `tuple(sequence)` instead of a fixed-width slice, which reproduces the mockup's intended output exactly; verified live before shipping. **Finding (Lesson 1.4, Concept 3):** a fifth hand-calculation error — the mockup's fact-vs-fabrication softmax example cited `Paris: 0.936, Lyon: 0.032, Marseille: 0.032` and `Aldric Thorne: 0.394, Marcus Reed: 0.323, Elena Vasquez: 0.283`; the real values for those exact logits are `Paris: 0.999, Lyon: 0.0005, Marseille: 0.0003` and `Aldric Thorne: 0.441, Marcus Reed: 0.361, Elena Vasquez: 0.198`. The real numbers make the lesson's own point *more* strongly than the claimed ones did — the well-established fact dominates even more totally (99.9%, not 93.6%), while the fabricated scenario's top candidate stays well short of that (44%, in a real three-way contest) — so this was a pure citation fix, no narrative change needed. **Finding (Lesson 1.4, Concept 4):** a sixth hand-calculation error, same shape as the fifth — the mockup's Einstein-misconception softmax example cited `relativity: 0.421, the photoelectric effect: 0.312, general relativity: 0.267`; the real values for those exact logits are `relativity: 0.466, the photoelectric effect: 0.345, general relativity: 0.189`. Again a pure citation fix — the real numbers still support the lesson's point (the misconception edges out the correct answer, arguably by a clearer margin than claimed). **Finding (Lesson 1.4, Recap & Practice):** the closing synthesis mockup assumed a genuinely unknowable future-event prompt ("who will win next year's Nobel Prize") would produce a falsely *confident* wrong guess, same shape as a fabricated-entity hallucination. Real testing (8+ phrasings) consistently showed the opposite: GPT-2 produces an honestly *flat*, uncertain spread across many similar-probability names for this kind of prompt — false confidence specifically needs a misleading pattern strong enough in training data to dominate (a popular misconception, a name memorized against a role), which a genuinely open, arbitrary unknown doesn't reliably supply. Asked the user rather than forcing a misleading example or quietly picking a fix; kept the scenario and rewrote its "reasoning to check against" to describe the real, more nuanced finding instead. The knowledge-cutoff scenario in the same synthesis (`"The current CEO of Twitter is Jack ___"`) is the cleanest result in this project so far — `"Dorsey"` at 99.5%, since Jack Dorsey really was Twitter's CEO throughout GPT-2's training window. **Finding (Lesson 1.5, Concept 1):** a seventh hand-calculation error, a new shape this time — a genuinely unpredictable one. The mockup's `random.choices(..., weights=..., k=1)` demo (seeded with `random.seed(42)`) claimed the 5-draw output `mat, floor, mat, mat, chair`; the real output for that exact seed, verified identically on both CPython 3.12 and 3.14 and in the actual shipped Pyodide `LiveDemo`, is `floor, mat, mat, mat, floor` — `"chair"` never appears in this particular seeded run at all. Unlike a hand-computable softmax, there was never a way for the mockup author to get this right without literally running it — a seeded PRNG sequence isn't something anyone can mentally derive. Fixed by rewriting the surrounding prose to describe the real 5-draw sequence, while still making the general point (unseeded runs would show `"chair"` and rarer candidates too, proportional to their real probability). `DecodingPlayground.tsx` (Lesson 1.5) reuses this lesson's own real GPT-2 bank (the same pinned six prompts as `NextTokenDistribution.tsx`'s default) to let a learner toggle live between greedy (deterministic argmax) and sampling (a genuine weighted draw performed client-side over the real, renormalized top-8 probabilities) and re-draw repeatedly to watch the chosen token actually move. **Finding (Lesson 1.5, Concept 2):** the mockup's toy temperature-scaled softmax numbers were the first genuinely accurate hand-computed ones this project has found (off by only 0.001 in a single value — `floor` at `T=0.5` rounds to `9.5%`, not the mockup's `9.4%`) — worth noting since it's the exception after seven straight misses, not a sign the verification step can be skipped going forward. Separately, extending `DecodingPlayground.tsx` with a temperature slider surfaced two real bugs caught only by testing live in a browser, neither a wrong number: (1) a genuine SSR/client hydration mismatch — `width: `${pct}%`` interpolated a raw, many-digit float directly into a style prop, and Node's SSR and the browser's V8 formatted the identical float to a different number of digits, which React flags as a real DOM mismatch; fixed with `.toFixed(2)` in both this component and `NextTokenDistribution.tsx` (which had the identical latent pattern, not yet triggered). (2) A design bug caught only by watching the actual numbers move: renormalizing the shown top-8 to sum to 100% only when temperature ≠ 1 (keeping the raw, un-renormalized real probabilities at the T=1 baseline) produced a visible discontinuity right at the boundary — the top candidate's displayed percentage jumping *up* when temperature increased toward 1.9, which reads backwards against the very concept being taught. Fixed by renormalizing at every temperature, including 1 — a deliberate, disclosed departure from `NextTokenDistribution.tsx`'s raw-percentage convention (captioned in the UI), traded for internal consistency within the one component a learner is actually dragging a slider on. `DecodingPlayground.tsx` was extended again in Concept 3 with top-k/top-p sliders (`applyTopKTopP`, walking the temperature-reshaped, rank-sorted candidates and marking survival until either the top-k count or the top-p cumulative threshold is hit, whichever comes first — mirrors "top-k truncates first, top-p then further truncates within that"); discarded candidates render dimmed, struck through, and labeled `out` rather than being removed from the list, so a learner can watch them actually drop out. All four of Concept 3's own LiveDemos (top-k, top-p, and the top-p-vs-top-k adaptiveness contrast) were independently verified against real Python execution and matched the mockup's numbers exactly (`{'mat': 0.749, 'floor': 0.251}` for top-k=2; `{'mat': 0.632, 'floor': 0.212, 'chair': 0.156}`, cumulative 82.5%→97.8%, for top-p=0.9; the flat-distribution case unchanged at all five tokens) — the first concept in this lesson with zero hand-calculation errors to fix. **Finding (Lesson 1.5, Concept 3):** a self-caught design-consistency bug, not a wrong number — `DecodingPlayground.tsx` had no prop-based feature gating, so adding the temperature slider (Concept 2) and then the top-k/top-p sliders (Concept 3) to the one shared component silently made those controls appear on Concept 1's already-shipped page too, even though Concept 1 only ever discusses greedy vs. sampling and hasn't introduced temperature or top-k/top-p yet. Fixed the same way `SentenceEmbeddingSpace.tsx` (`showSimilarityTable`) and `NextTokenDistribution.tsx` (`promptIndices`, pinned) already handle this elsewhere in the project: added `showTemperature`/`showTopKTopP` props, both defaulting to `false`, gating both the slider row and the wording of the caption underneath it; Concept 1's embed now passes neither prop (unchanged), Concept 2's passes `showTemperature`, Concept 3's passes both. Re-verified via Playwright across all three pages after the fix: correct controls visible on each, sampling/top-k discarding still functions, no console or hydration errors. **Finding (Lesson 1.5, Concept 5):** an eighth mockup-cited-number error, a new shape — the logprobs demo claimed to use "the exact confident-fact and fabricated-scenario distributions from Lesson 4" but hardcoded the *old, incorrect* probabilities Lesson 4's own conversion had already replaced (`Paris: 0.936`, `Aldric Thorne: 0.394`, ...), so its cited logprobs (`-0.066`, `-0.931`) matched nothing the learner had actually seen. Fixed by running the real Lesson 4 logits through `softmax` inside the demo; real values are `Paris -0.001`, `Lyon -7.701`, `Marseille -8.101`, `Aldric Thorne -0.819`, `Marcus Reed -1.019`, `Elena Vasquez -1.619` (verified in local Python and the shipped Pyodide demo), and the prose was updated to match. Lesson: a mockup written after a conversion corrected its numbers can still carry the pre-correction ones forward. **Finding (Lesson 1.6, Concept 4):** a ninth mockup-cited-number error, in a plain counting demo rather than a softmax — the shared-prefix demo claimed `9` shared tokens for the stable-content-first case; the real output (local Python and the shipped Pyodide demo) is `10`, because the two prompts also happen to share `"Question : What is"` before the two questions diverge (the mockup's own second value, `2`, was correct). Fixed by citing `10` and explaining exactly which tokens are shared. The mockup also had a garbled callback ("reversing this order was Concept 3's cost demonstrated concretely" — Concept 3 never demonstrated any reversal); reworded to say reversing the order throws away the reuse the KV cache makes possible. |
| Real long-context position accuracy (Module 1) | **Published measurements**, not a model we ran: Liu et al. (2023), "Lost in the Middle: How Language Models Use Long Contexts" (arXiv 2307.03172), Appendix G.2 Table 6 (multi-document QA over 20 retrieved documents, accuracy by the answer-containing document's position — indexes 0/4/9/14/19) plus closed-book/oracle baselines from Table 1, for four models (GPT-3.5-Turbo, Claude-1.3, MPT-30B-Instruct, LongChat-13B 16K). Extracted programmatically from the paper's PDF text into a static `src/data/lost-in-the-middle.json` (no hand transcription; cross-checked against the printed table) | The mockup's "accuracy by position" interactive asked for a chart of how reliably a model retrieves a fact as its position changes. Nothing in this project can run that experiment (it needs real long-context LLM API calls at scale), and inventing a U-shaped curve would break the project's real-data-over-fabrication rule — so the chart plots the study that named the effect, cited on the component itself, with the paper's own 2023-era-models caveat. **Finding (Lesson 1.6, Concept 5):** the mockup described the shape as "consistently U-shaped"; the real data is only cleanly U-shaped for GPT-3.5-Turbo (75.8% at doc 1, 53.8% at doc 10, 63.2% at doc 20 — the middle result is even *below* its 56.1% closed-book accuracy). Claude-1.3 (59.9/55.9/56.8/57.2/60.1) and MPT-30B-Instruct show much shallower dips, and LongChat-13B is mostly a start advantage with little end recovery (68.6/57.4/55.3/52.5/55.0). What holds across all four is that the best accuracy sits at an edge and the middle is used less reliably; the lesson prose was written to say exactly that rather than overclaim uniformity. |
| Hosting | **GitHub Pages** (site) + **Cloudflare Workers** free tier (the E2B broker) | Static output from Astro deploys directly from a git push (`insanalytics.github.io/agentic-ai-course/`). The Worker is the one piece of server-side infrastructure this project runs — see §4. |
| Styling | **Tailwind CSS v4** (`@tailwindcss/vite`) | Clean-docs look (white background, Inter). Palette and component identity colors documented in §7. |

---

## 3. Content architecture

Course content lives as files, not database entries. One lesson = one
**folder**, one page (intro / concept / recap) = one `.mdx` file inside it —
split this way specifically so a lesson reads as several focused pages with
sidebar navigation, not one very long scroll.

```
/src
  /content
    /modules
      00-python-essentials/
        _module.yaml                    # module title, description, order
        01-python-basics/
          _lesson.yaml                  # lesson title, module, order, projectDownload
          00-intro.mdx                  # LearningOutcomes + WhyItMatters (+ any asides)
          01-set-up-python.mdx          # one concept per file
          ...
          04-recap-practice.mdx         # comprehensive quiz + comprehensive sandbox
      01-llm-foundations/
        _module.yaml
        01-tokenization/
          _lesson.yaml
          01-the-vocabulary-problem.mdx
          ...
  /components
    Sidebar.astro               # left nav — accordion per lesson, listing its pages
    PageNav.astro                # Prev/Next footer between sibling pages in a lesson
    ProjectDownload.astro       # link/zip for heavier local projects (one GitHub repo per project)
    /lesson                     # components implementing lesson-structure.md
      LearningOutcomes.astro
      WhyItMatters.astro
      ConceptSection.astro
      Subsection.astro            # sub-heading + content, alternating background per instance
      CodeEditor.tsx               # shared CodeMirror 6 editor (VS Code dark theme, Python highlighting)
      LiveDemo.tsx               # editable, ungraded code demo (Pyodide, manual run)
      QuizGroup.tsx                # cycles one multiple-choice question at a time
      GradedExercise.tsx          # editable code, graded against hidden tests
      MultiFileEditor.tsx          # shared file-tab strip + CodeEditor, used by both multi-file components below
      MultiFileLiveDemo.tsx        # multi-file LiveDemo — real cross-file imports, editable or readOnly per file
      MultiFileGradedExercise.tsx  # multi-file GradedExercise — real imports, graded via a real Pyodide FS + sys.modules
      Terminal.tsx / TerminalGroup.tsx  # scripted terminal playback (click Run, steps reveal progressively) — no real backend, for demos where full fidelity isn't needed
      DockerBuildDemo.tsx          # read-only Dockerfile + Build button, generates a build log from the actual Dockerfile text (cacheHit prop controls timing)
      DockerGradedExercise.tsx     # real-Docker graded exercise (Dockerfile + .dockerignore textareas) — see §4
      DockerLiveTerminal.tsx       # real interactive terminal over a persistent E2B sandbox — see §4
      FastAPIGradedExercise.tsx    # real FastAPI app, graded in-browser via Pyodide + httpx.ASGITransport — see §4.1
      MultiFileFastAPIGradedExercise.tsx  # multi-file version — real cross-file imports, e.g. main.py importing an APIRouter from agents.py — see §4.1
      PytestGradedExercise.tsx     # grades a learner-written @pytest.mark.parametrize test (not app code) — see §4.1
      MockPatchGradedExercise.tsx  # grades a learner-written unittest.mock.patch test against a real, fixed main.py — see §4.1
      TestSuiteGradedExercise.tsx  # grades a learner-written multi-file pytest suite (conftest.py + tests) against a real, fixed app — see §4.1
      TokenizerVisualizer.tsx     # editable text box, tokenized live via gpt-tokenizer, each token highlighted via the --color-token-1..6 cycle (see global.css) — first used in Lesson 1.1
      TokenLanguageComparison.tsx # multiple editable label/sentence rows, each tokenized live and shown side by side — same real tokenizer; initialRows/title/labelPlaceholder/addButtonLabel all overridable so it doubles as the generic "compare several inputs" tool (cross-language in Concept 3, common/technical/foreign/nonsense in the Recap & Practice closing synthesis) — Lesson 1.1
      TokenPieces.tsx              # shared colored-token-span renderer used by both components above, so the --color-token-1..6 coloring logic lives in one place
      EmbeddingSpace.tsx           # 2D scatter of real GloVe-derived word positions (src/data/embedding-words.json) plus a type-a-word-to-add box — Lesson 1.2
      SentenceEmbeddingSpace.tsx   # 2D scatter of a real sentence-transformer's output (src/data/embedding-sentences.json) over a curated sentence bank, toggled via checkboxes rather than typed; optional showSimilarityTable prop adds a live pairwise cosine-similarity table below, optional defaultChecked overrides which sentences start checked — Lesson 1.2
      AttentionExplorer.tsx        # click any token in one of a small curated bank of sentences (src/data/attention-sentences.json), see every other token shaded by real attention weight from an actual small transformer — Lesson 1.3
      TransformerStack.tsx         # step-through diagram of tokens flowing up through 6 stacked transformer blocks — purely structural/architectural, no per-layer content claims (the lesson prose itself is explicit that what any one layer "does" is unsettled research) — Lesson 1.3
      KVCacheDiagram.tsx           # step-through diagram of a KV cache over a toy 3-prompt-token + 3-generated-token sequence — computed tokens highlighted vs. cached ones dimmed/"reused", with a running Key/Value-computation total with vs. without a cache (3/4/5/6 vs. 3/7/12/18, plain arithmetic on the toy sequence). Purely structural, no model data or accuracy claims — Lesson 1.6
      PositionAccuracyChart.tsx    # line chart of real published accuracy-by-answer-position data (Liu et al. 2023, 20-document multi-document QA) with a model picker, a dashed closed-book baseline, hover/focus readout, and a values table — Lesson 1.6
      NextTokenDistribution.tsx    # prompt picker + bar chart of a small curated bank's real GPT-2 next-token probabilities (src/data/next-token-distributions.json); optional promptIndices prop selects a subset (defaults to Concept 1's original six) — Lesson 1.4
      DecodingPlayground.tsx       # same real GPT-2 bank as NextTokenDistribution.tsx, plus a greedy/sampling toggle and a live temperature slider -- greedy highlights the argmax (temperature-invariant), sampling draws a genuine client-side weighted-random token from the real, temperature-reshaped probabilities (renormalized across the top 8 at every temperature) on every "Sample again" click — Lesson 1.5
      CheckpointZone.astro        # full-bleed colored band behind a quiz/exercise card
  /lib
    pyodide.ts                  # shared Pyodide loader + single-file and multi-file grading harnesses
    fastapiPyodide.ts             # installs a pinned FastAPI/Starlette/httpx stack into Pyodide, grades against a per-exercise Python script — see §4.1
    dockerWorker.ts              # fetch wrapper for the Cloudflare Worker's /docker-exercise and /docker-terminal routes — see §4
    tokenize.ts                  # tokenizePieces(text) — shared gpt-tokenizer wrapper (encode, then decode one id at a time) used by both Token* components above
    labelPlacement.ts             # placeLabels(points, ...) — shared collision-avoidance label positioning used by both Embedding*Space components
    cosineSimilarity.ts           # cosineSimilarity(a, b) — plain dot product (embedding-sentences.json's vectors are pre-normalized) used by SentenceEmbeddingSpace's similarity table
  /data
    embedding-words.json         # word -> [x, y]; real GloVe embeddings, PCA-projected offline — see the "Real word embeddings" tech-stack row above and scripts/generate-embedding-words.py
    embedding-sentences.json     # [{text, x, y, vector}]; real sentence-transformer embeddings, PCA-projected offline (x/y) plus the full 384-dim vector for live cosine similarity — see the "Real sentence embeddings" tech-stack row above and scripts/generate-embedding-sentences.py
    attention-sentences.json     # [{sentence, tokens, matrix}]; real, hand-verified attention-weight matrices for a small curated sentence bank — see the "Real attention weights" tech-stack row above and scripts/generate-attention-weights.py
    next-token-distributions.json # [{prompt, candidates}]; real GPT-2 next-token probabilities for a small curated prompt bank — see the "Real next-token predictions" tech-stack row above and scripts/generate-next-token-distributions.py
  /layouts
    BaseLayout.astro            # shell: sidebar + main slot, fonts, global.css
    LessonLayout.astro          # page chrome (breadcrumb + hero + PageNav), wraps BaseLayout
  /styles
    global.css                  # Tailwind import + color/font tokens
  /pages
    [module]/[lesson]/[page].astro   # renders one page; getStaticPaths from the `pages` collection
/worker                          # separate Cloudflare Worker project — the E2B broker, see §4
  src/index.ts                   # all routes: /docker-exercise/grade, /docker-terminal/{start,exec,grade,end}
  wrangler.jsonc
  .dev.vars                      # gitignored — E2B_API_KEY + SITE_TOKEN for local `wrangler dev`
```

**Content collections** (`src/content.config.ts`): `modules` (unchanged),
`lessons` (loads each `_lesson.yaml`, schema `title`/`module`/`order`/
`projectDownload`), and `pages` (loads every `.mdx` under a lesson folder,
schema `title`/`lesson`/`order` — `lesson` holds the parent lesson's slug,
same pattern as `lessons.module`). A page's `order` also drives its
`PageNav` Prev/Next; `0` is reserved for the intro, the highest number is
always Recap & Practice.

A page's MDX body follows the shape in
[lesson-structure.md](lesson-structure.md) — spread across pages instead of
one page per lesson: the intro page carries learning outcomes/why-it-matters,
each concept page carries its own live demos and quiz questions plus a
per-concept graded exercise at natural checkpoints, and the Recap & Practice
page carries the comprehensive quiz + comprehensive sandbox. Each piece is
one of the `/components/lesson` components above, imported and given content
inline as props — content itself is authored in chat, not generated from a
spec.

**`ConceptSection` usage rule:** a page's own hero title (rendered by
`LessonLayout`) already names what the page is about, so `ConceptSection`'s
colored banner would be pure redundancy on any page — no page uses it
anymore, including Recap & Practice (its comprehensive quiz and
comprehensive sandbox now sit directly under the page, told apart by their
own `CheckpointZone` header-bar color rather than a repeated sub-heading).
Concept pages put `Subsection`s directly under the page.

All quiz questions for one spot in a lesson (a concept page, or the
Recap & Practice page's comprehensive quiz) go into a single
`<QuizGroup questions={[...]} />` call, which shows one question at a time
with a progress indicator rather than stacking every question's card on the
page — keeps long quiz sets from dominating the page.
Every `<QuizGroup>` and `<GradedExercise>` is wrapped in `<CheckpointZone>`,
a full-bleed band in the shared `--color-checkpoint-bg` color that sits
behind the card (not the card's own background) — the signal to the learner
is "the reading ends here, you're being tested now." The card itself keeps
its own header-bar color (violet for quiz, navy for exercise) to tell the
two apart; the zone color is what marks both as "not reading content."
Within a concept page, each `###`-level sub-topic is wrapped in
`<Subsection title="..." variant="a"|"b">`, alternating the variant by hand
between consecutive subsections (no automatic counter — Astro components mix
with other div-based content at the same nesting level, so CSS
`nth-of-type` alternation isn't reliable) to give each one a distinct
background band.
**Linking to another concept:** every `<Subsection title="...">` gets a
deterministic `id` (the title lowercased, non-alphanumerics collapsed to
`-`) so any concept is deep-linkable as `/module/lesson/page/#slug` — no
manual anchor bookkeeping. When a mockup calls back to something taught
elsewhere ("as covered in the dicts section," "you saw this pattern
earlier"), write it as a real Markdown link to that subsection's anchor
(same-page callbacks can just use `#slug`) — this works both in a page's
MDX prose (rendered natively as `<a>` by MDX) and inside a `hint`,
`explanation`, `task`, or similar plain-string prop passed to
`QuizGroup`/`GradedExercise`/`MultiFileGradedExercise`, via
`<LinkedText text={...} />` (`src/components/lesson/LinkedText.tsx`) — a
small parser those components use internally that finds `[text](url)` in an
otherwise-plain string and renders it as a real anchor, leaving everything
else as text. It is intentionally not a general Markdown renderer (no bold,
code spans, etc. — only link syntax) so it stays predictable inside a prop
that's mostly plain sentences. Skip the link rather than force one onto a
vague callback ("earlier in the module") that has no single precise target
— an honest miss is better than a link that lands somewhere only loosely
related. **Style note:** don't spell out "Lesson N"/"Concept N" in the link
text or surrounding sentence unless it already reads naturally that way —
the link itself is the navigation, a lesson number next to it is usually
redundant.
`LiveDemo`, `QuizGroup`, and `GradedExercise` are React and **must** carry
`client:load` in the MDX, or they render as static, non-interactive markup.
Adding a lesson = adding a lesson folder with a `_lesson.yaml` and its page
`.mdx` files in the right module folder. No app code changes required for
ordinary content.

---

## 4. Sandbox architecture — three tiers

Three distinct execution tiers exist now, in increasing order of what they
can actually do — pick the *lightest* tier that genuinely covers what a
concept needs, not the heaviest available:

1. **Pyodide** (§4.1) — in-browser, zero cost, zero setup, instant. Default
   choice for anything that's really just Python logic (loops, data
   structures, mock tool functions) — and, less obviously, for a real
   FastAPI app too (`async def` routes, graded via `httpx`'s
   `ASGITransport`, no real thread or E2B needed — see §4.1's FastAPI
   note before assuming a web-framework exercise needs tier 2). Still no
   real subprocess/Docker/real-networking.
2. **E2B + Cloudflare Worker** (§4.2) — a real, disposable Linux sandbox
   with a real Docker daemon, one call away from the browser. For a single
   in-browser exercise that genuinely needs something Pyodide can't do
   (build a real image, run a real container, bind a real port) but is
   still small/bounded enough to grade in one shot or one short
   interactive session.
3. **Downloadable project** (§4.3) — a separate GitHub repo the learner
   clones and runs on their own machine. For anything that needs more than
   one real service running together (an app *and* a database, say),
   or is meant as a lesson's capstone rather than a single exercise.

### 4.1 Pyodide (in-browser)

Per [lesson-structure.md](lesson-structure.md), a lesson uses Pyodide in two
distinct roles, both built on the shared loader in `src/lib/pyodide.ts`.
Both roles edit code through the shared `<CodeEditor />` (CodeMirror 6 +
`@uiw/codemirror-theme-vscode`'s dark theme + `@codemirror/lang-python`) —
real syntax highlighting and Python-aware completions, not a plain
`<textarea>`, which can only render flat single-color text:

- **`<LiveDemo />`** — editable, ungraded code shown inside a concept
  section (a scratchpad the learner can tinker with, e.g. add another
  `print`). Never runs on page load — only on an explicit "Run" click.
  Deliberate crashes are shown as a teaching device when the learner runs
  the starter code as-is. Optional `setupCode` prop: hidden code run
  silently (output discarded) immediately before the visible code, on every
  Run click — for seeding a fixture the demo assumes already exists (e.g.
  writing a file into Pyodide's virtual FS before a file-reading demo),
  without cluttering the shown code with unrelated setup or depending on
  some other demo having run first. First used in Lesson 0.6's file I/O
  concept.
- **`<GradedExercise />`** — editable starter code, submitted and run against
  hidden test snippets inside the same Pyodide instance. Only pass/fail
  counts are surfaced to the learner; test source is never sent to the
  client-visible DOM in a way a learner would casually read, but note this is
  still client-side execution — a determined learner can inspect the MDX
  source. Treat hidden tests as sequencing psychology, not real security.
  Optional `setupCode` prop, same idea as `LiveDemo`'s: hidden code run
  silently on Pyodide's real filesystem before grading, every submit — for
  a hidden test whose function reads a real file by path (real file I/O
  touches Pyodide's actual FS regardless of the in-memory namespace
  `hiddenTests` otherwise runs in). First used in Lesson 0.6's CSV concept.
- **`asyncio.run()` shim**: `pyodide.runPythonAsync` already executes inside
  its own live event loop, so real `asyncio.run(...)` — the standard entry
  point every learner would actually write — raises "cannot be called from a
  running event loop" if run as-is (confirmed by testing against the pinned
  Pyodide version). Both execution paths rewrite a top-level
  `asyncio.run(coro())` to `await (coro())` immediately before running it —
  equivalent for a single top-level call, and purely an execution shim:
  lesson content keeps writing and showing real `asyncio.run(...)`, never a
  browser-only substitute. Introduced in Lesson 0.7's `async`/`await`
  concept.
  - `LiveDemo` (`runCapturingOutput`): applies the text rewrite, then runs
    the whole thing through `runPythonAsync`, which supports top-level
    `await` natively.
  - `GradedExercise` (`TEST_HARNESS`, both the learner's own code and each
    hidden test): a plain `exec(compile(src, ..., "exec"))` can't contain a
    top-level `await` at all (`SyntaxError`), so the harness instead
    compiles with `ast.PyCF_ALLOW_TOP_LEVEL_AWAIT` and runs the result via
    `eval()` — the same mechanism CPython's own async REPL uses. If the
    (shimmed) source contains a top-level await, `eval()` returns a
    coroutine, which the harness itself `await`s (valid there since
    `TEST_HARNESS` runs via `runPythonAsync` too); otherwise `eval()` just
    runs the code normally and returns `None`, so every pre-existing
    synchronous hidden test elsewhere in the course is unaffected — verified
    directly, including a deliberate-failure case, before shipping.
  exercises are hand-rolled Python (not a framework like LangChain) — this is
  deliberate: for teaching, seeing the raw loop matters more than hiding it
  behind a library, and it also sidesteps Pyodide's lack of support for
  native/C-extension packages.
- "Tools" in these exercises are plain Python functions (calculator, mock
  APIs, virtual file read/write) — no real network or shell access is
  possible or expected at this tier.

**Multi-file sandboxes** (`<MultiFileLiveDemo />` / `<MultiFileGradedExercise />`,
first used by Lesson 0.3's modules-and-imports concept): several files shown
as tabs in one sandbox instance, with real `import` statements working
between them — needed to teach genuine module/`__name__` semantics, which a
single exec'd string can't demonstrate. Unlike single-file mode (which execs
learner code into an in-memory `dict` namespace — no real filesystem or
module system involved at all), multi-file mode writes every file to
Pyodide's real virtual filesystem and lets Python's own import machinery
resolve them:
- Each sandbox **instance** gets its own directory under the shared Pyodide
  FS (`/sandboxes/<instanceId>`), pushed onto `sys.path` only for the
  duration of that instance's run and popped afterward — this course reuses
  filenames (`main.py`, `tools.py`) across multiple independent sandbox
  instances on the same page, so per-instance isolation is what keeps them
  from colliding.
- Before every run, every file's module name (filename minus `.py`) is
  popped from `sys.modules` — otherwise Python's import cache would keep
  serving a stale version after the learner edits a non-entry file and
  re-runs.
- Grading runs the entry file first (its own output/errors surfaced to the
  learner, but never gating what follows — a hidden test may import and
  check a *different* file directly, independent of whether the entry file
  itself is wired up correctly), then runs the hidden-test script as one
  block in a fresh namespace, with its own imports resolving against the
  same already-invalidated module cache.
- All Pyodide calls (single-file and multi-file alike) are serialized
  through one queue in `pyodide.ts`, since the interpreter is one shared
  global instance across every sandbox on a page — without it, two
  components' runs could interleave mid-`await` and corrupt each other's
  `sys.path`/`sys.modules` edits.
- `MultiFileEditor`'s CodeMirror instance is keyed by the active filename so
  React remounts it on every tab switch; without that key, `@uiw/react-codemirror`
  does not reliably re-sync its displayed content to a new `value` prop when
  reused across two different controlled values, even though the underlying
  file state is correct (verified: grading a stale-looking tab still used
  the right code — it was a display bug, not a data bug).

**Known ceiling of Pyodide** (why the tiers below exist):
- No real subprocess/shell execution.
- No native/compiled Python packages, and no real OS threads — the latter
  turns out to be narrower than it sounds (see below): it rules out
  anything that specifically *needs* a background thread, not everything
  that merely does I/O or runs async code.
- No genuine multi-agent, long-running, or stateful-across-sessions execution.

**Real FastAPI apps, graded in-browser via Pyodide** (`src/lib/fastapiPyodide.ts`,
`<FastAPIGradedExercise />`, first used in Lesson 0.9): grading a submitted
FastAPI app for real — real routing, real Pydantic validation, real status
codes — turned out to *not* need E2B, contrary to an initial assessment.
`httpx.AsyncClient(transport=httpx.ASGITransport(app=app))` talks to the ASGI
app directly, entirely on the event loop `runPythonAsync` already provides,
with no real thread involved anywhere. Starlette's own `TestClient` (the
"normal" way to test a FastAPI app) instead spins up a background thread to
offer a synchronous, requests-like API — confirmed directly to fail in
Pyodide (`RuntimeError: can't start new thread`), which is what first looked
like a hard blocker until `ASGITransport` was tried as a thread-free
alternative. **The one constraint this imposes on exercise code: route
handlers *and* `Depends()` functions must be `async def`, not plain
`def`** — both a sync route and a sync dependency are dispatched to a real
worker thread by FastAPI/Starlette itself (`solve_dependencies` and route
dispatch both go through `run_in_threadpool` → `anyio.to_thread.run_sync`,
so a slow sync call can't block the event loop), which fails the same way;
an `async def` version of either is awaited directly, no thread involved.
Confirmed both cases directly (Lesson 0.9's auth exercise hit the
dependency case specifically — a plain `def verify_api_key(...)` failed
identically to a sync route). Package versions are pinned
(`fastapi==0.110.0`/`starlette==0.36.3`/`anyio==4.3.0`/`httpx==0.27.0`/
`httpcore==1.0.5`/`h11==0.14.0`) because this Pyodide build's bundled
`pydantic-core` (2.18.1) is older than what current releases require —
confirmed by actually installing and running them together, not guessed.
**Revises the tier-choice framing above**: a real ASGI app with `async def`
routes belongs at tier 1 (Pyodide), not tier 2 (E2B) — E2B is for
Docker/subprocess/real-networking specifically, not merely "a real Python
web framework."

**Two more non-obvious gotchas found building Lesson 0.9's comprehensive
sandbox** (a multi-file app using `lifespan` and `BackgroundTasks`), both
in `src/lib/fastapiPyodide.ts`:
- **`httpx.ASGITransport` never triggers FastAPI's `lifespan` startup/shutdown
  at all** — confirmed directly: state set inside a `lifespan` function
  (`app.state.registry = {}`, say) simply never gets set if you only ever
  call the app through `ASGITransport`. Fixed at the harness level, not
  per-exercise: both the single-file and multi-file grading harness wrap
  grading-script execution in `async with app.router.lifespan_context(app):`
  whenever `app` is available — a no-op for an app with no custom
  `lifespan` (FastAPI always provides a default one), so it's safe
  unconditionally.
- **A plain (sync) function scheduled via `BackgroundTasks.add_task(...)`
  hits the same threading wall as a sync route/dependency** — FastAPI
  dispatches it through the same `run_in_threadpool` path. Confirmed
  directly; the fix is the same one already established: declare it
  `async def` too.
- **Multi-file FastAPI exercises** (`<MultiFileFastAPIGradedExercise />`,
  `gradeFastAPIMultiFileExercise` in `fastapiPyodide.ts`) reuse
  `pyodide.ts`'s existing multi-file sandbox machinery
  (`prepareMultiFileRun`/`teardownMultiFileRun`, exported for this) rather
  than duplicating it — files go on a real per-instance directory on
  `sys.path`, and the entry file (e.g. `main.py`) is `importlib.import_module`'d
  as a genuine module so its own `from agents import ...` resolves for real;
  `<entry module>.app` is what actually gets graded.
- **Grading a learner-*written test*, not learner-written app code** (Lesson
  0.10's parametrize exercise, `<PytestGradedExercise />`,
  `gradePytestParametrizeExercise` in `fastapiPyodide.ts`) needed its own
  investigation: `pytest` is a genuine Pyodide-native package (a real wasm
  wheel, not just pip-installable), confirmed directly — but actually
  *running* it (`pytest.main([...])`) **crashes Pyodide fatally**
  (`EPERM: operation not permitted, fsync`, flagged by Pyodide itself as
  `pyodide_fatal_error: true`), confirmed directly. Since every exercise on
  a page shares one global Pyodide instance, that's not an acceptable risk —
  one learner's submission could take down every other exercise on the
  page. The fix: don't run pytest's own collection/runner at all. Read the
  real `@pytest.mark.parametrize` decorator's attached data directly off the
  function object (`fn.pytestmark` — confirmed to work exactly as pytest
  itself produces it) and call the *real* decorated function directly, once
  per required case, catching the real `AssertionError` — the learner's test
  is genuine pytest code with real assertions, actually executed; only
  pytest's own runner is replaced, not their code.
  - **A genuinely synchronous client** (no `await` in the learner's test,
    matching real `TestClient`'s actual interface) was ruled out after
    *three* separate attempts, each confirmed to fail for a different
    reason, not assumed: a real OS thread (unavailable, same root cause as
    routes/dependencies); and a fresh `asyncio.new_event_loop()` pumped via
    `run_until_complete` (Pyodide's own event loop implementation doesn't
    support real blocking there either — it returns a `PyodideTask` object
    instead of the actual result, since a single-threaded JS environment has
    no primitive for "block and wait for a promise" without real
    multi-threading, i.e. `SharedArrayBuffer` + `Atomics.wait` + a
    cross-origin-isolated, pthread-enabled Pyodide build — a much bigger
    infrastructure change than fits here). So the learner's test function
    must be `async def`, using `await client.post(...)` — the same category
    of environment-driven accommodation as `async def` routes, explained to
    the learner as exactly that rather than silently deviating from what
    Concepts 1–3 taught.
  - **Matching a required scenario against the learner's own parametrize
    data** only compares the *input* prefix of each tuple (e.g.
    `[payload, includeApiKey]`) — never the expected value. Once matched,
    the *learner's own* full tuple (their own expected value included) is
    what actually gets executed. This distinction matters: a wrong expected
    value must fail via a real `AssertionError` when run, not via a failed
    lookup that just looks like a missing case — those read as different
    kinds of mistakes to a learner, and only real execution tells them apart
    correctly.
- **Grading a learner-written `unittest.mock.patch` test against a real,
  fixed app** (Lesson 0.10's mocking exercise, `<MockPatchGradedExercise />`,
  `gradeMockPatchExercise` in `fastapiPyodide.ts`). `@patch("main.foo", ...)`
  resolves that string via a real `importlib.import_module("main")`, so this
  reuses the same real-files-on-`sys.path` multi-file machinery as the
  multi-file FastAPI exercise, rather than the single-namespace `exec()`
  approach the earlier single-file exercises use — the learner writes only
  `test_main.py`; a fixed, correct `main.py` (never editable) is what their
  test actually runs against, so a required test only passes if the
  learner's own mock and assertions are genuinely correct. `unittest.mock`
  (`AsyncMock`, async-aware `patch`, Python 3.8+) is pure standard library —
  no micropip install needed here at all, unlike `pytest`.
  - **A real, confirmed footgun**: `@patch` as a decorator appends its own
    mock as an argument *after* whatever positional args the caller
    supplies (`func(*args, mock)`), not before (`func(mock, *args)`) —
    confirmed directly by decorating a plain function and printing what each
    parameter actually received. Calling a `(mock_call_llm_api, client)`-
    shaped test function positionally as `fn(client)` silently swaps them:
    `client` inside the test body is actually the mock, and
    `mock_call_llm_api` is actually the real client — no error, just
    silently wrong values, since both are ordinary objects as far as Python
    is concerned. Real pytest never hits this because it injects *all* of
    its own fixtures as keyword arguments, matched by parameter name, not
    positionally. The fix here is the same: call the learner's test function
    as `_fn(client=_client)`, never positionally — confirmed directly that
    this resolves `mock_call_llm_api`/`client` correctly regardless of which
    parameter is declared first.
  - A related, easy-to-miss trap while building this exercise's own fixed
    `main.py`: a bare `async def generate(prompt: str)` (matching this
    lesson's own conceptual prose example, which is illustrative and never
    executed) is *not* a request-body field to FastAPI — an untyped-as-model
    `str` parameter not matching a path segment is inferred as a **query**
    parameter, so `client.post("/generate", json={"prompt": "hello"})`
    actually 422s. Confirmed directly, not assumed. The real, executable
    version of this route (used only in the graded exercise, not the prose)
    needs an actual `BaseModel` request body (`class GenerateRequest(BaseModel): prompt: str`)
    for the mocked scenario to reach `call_llm_api` at all.
- **Grading a learner-written multi-file pytest *suite*** (`conftest.py` +
  a test file, Lesson 0.10's comprehensive sandbox,
  `<TestSuiteGradedExercise />`, `gradeTestSuiteExercise` in
  `fastapiPyodide.ts`) — combines the mock-patch exercise's real-files
  approach with the parametrize exercise's case-matching, but generalized
  to a *mix* of plain and parametrized required tests in one suite, graded
  against a fixed, correct, real `main.py`/`agents.py` (reused verbatim
  from Lesson 0.9's own comprehensive sandbox).
  - **Another real, confirmed footgun**: a function decorated with
    `@pytest.fixture` refuses to be called directly —
    `pytest.fail("Fixture ... called directly. Fixtures are not meant to
    be called directly...")` — even though `type(fixture_fn)` reports as
    a plain `function`. Confirmed directly, not assumed. The *undecorated*
    function is still reachable via `fixture_fn.__wrapped__` — confirmed
    to work identically to calling the original function — so the harness
    calls `getattr(raw_fixture, "__wrapped__", raw_fixture)` to get a
    genuinely callable version, falling back to the raw function if it
    isn't `@pytest.fixture`-decorated at all.
  - The harness calls the (unwrapped) fixture **fresh before every single
    graded test or parametrize case**, never once for the whole file —
    matching a real function-scoped fixture's actual per-test semantics.
    This matters concretely here: this exercise's own `client` fixture
    resets `app.state.registry`/`next_id` on every call, so test isolation
    only actually holds if the fixture genuinely reruns for every case,
    not just once.
  - Since real pytest also injects fixture values as keyword arguments
    matched by name (not just the `@patch`-specific case from the mocking
    exercise), a plain required test is still called as `fn(client=client)`
    here, for the same reason.
- **Grading a real WebSocket route** (Lesson 0.11 Concept 5's
  disconnect/auth exercise, still using `<FastAPIGradedExercise />` — no
  new component needed) — `httpx.ASGITransport` (the mechanism every
  other FastAPI exercise's `gradingScript` uses) is HTTP-only; it never
  performs the WebSocket upgrade at all. The "normal" way to test a
  WebSocket route, Starlette's `TestClient.websocket_connect()`, hits the
  exact same thread wall as plain `TestClient` (§4.1's opening finding) —
  confirmed directly, not assumed, before writing this exercise. The
  fix: drive the ASGI app's `websocket` scope directly, by hand, the same
  no-thread philosophy as `ASGITransport` itself — build the `scope` dict
  (`"type": "websocket"`, plus `path`/`query_string`/`headers`/etc.), and
  supply `receive`/`send` as plain `async def` closures backed by two
  `asyncio.Queue`s (`to_app` fed by the grading script, `from_app` read
  from it), then `asyncio.ensure_future(app(scope, receive, send))` and
  drive the conversation by `put`-ing ASGI websocket events
  (`websocket.connect`, `websocket.receive` with a `text` key,
  `websocket.disconnect`) and awaiting whatever the app `put`s back
  (`websocket.accept`, `websocket.send`, `websocket.close` with a `code`).
  Confirmed end-to-end in a real Pyodide instance (pinned versions,
  §4.1's opener) before shipping: a correct submission accepts a valid
  token, echoes a message, and resolves cleanly on a simulated disconnect
  event; three separate wrong submissions (no token check at all; token
  check present but no `except WebSocketDisconnect` around the loop) fail
  exactly the checks they should and no others — the disconnect case in
  particular surfaces a real, unhandled `WebSocketDisconnect` propagating
  out of the driving `asyncio.Task`, not a silent pass. No FastAPI/anyio
  internals needed patching for this — the ASGI websocket protocol is
  simple enough to drive directly, and doing so needs nothing beyond
  `asyncio`, already available with no extra `micropip.install`.
- **gRPC's own real transport is unrunnable in Pyodide at all** (Lesson
  0.11 Concept 7's server-streaming exercise, plain `<GradedExercise />`
  — no FastAPI stack, no new harness code needed). Confirmed directly
  before writing this exercise: `micropip.install("grpcio")` fails
  outright — `ValueError: Can't find a pure Python 3 wheel for
  'grpcio'` — because the real `grpc` package's transport is a compiled
  C extension with no pure-Python build at all, unlike every other
  native-looking dependency this course has hit so far (`pydantic-core`,
  `h11`, etc., all of which do ship a wasm/pyodide wheel). `protobuf`
  itself installs fine (a real wasm wheel exists), but that's beside the
  point once `grpc.server`/`grpc.insecure_channel` themselves are
  unavailable — there's no real socket, no real server, nothing to
  connect a real stub to. The fix: skip real gRPC transport entirely and
  grade the learner's `TaskServiceServicer`/`collect_statuses` directly,
  through a few-line fake stub whose `StreamTaskStatus(request)` just
  calls the learner's own servicer method in-process
  (`self._servicer.StreamTaskStatus(request, None)`) — the same
  no-real-transport philosophy as `ASGITransport` and the hand-driven
  ASGI websocket scope above, just one level further out (no ASGI
  protocol to speak at all here, since there's no ASGI-equivalent
  interface for gRPC to drive). The exercise's `TaskRequest`/`TaskStatus`
  "message" classes are plain Python classes with a matching
  constructor/attributes, not real protobuf-generated ones — genuinely
  irrelevant here, since nothing in this exercise depends on real
  wire encoding, only on the servicer being a real generator and the
  client function really iterating it. Confirmed directly, not assumed:
  a correct submission passes; a submission that returns `None` instead
  of being a generator fails with a real `TypeError` (not iterable); a
  submission that yields only two of the three expected events fails via
  a real, ordinary `assert` mismatch — no special-casing needed for
  either failure mode.
- **Grading REST and a WebSocket broadcast together, against the same
  running app** (Lesson 0.11's comprehensive sandbox,
  `<MultiFileFastAPIGradedExercise />` — no new component or harness
  code needed, since its `gradingScript` is arbitrary Python with `app`
  already bound). The exercise needs a REST `POST` (via
  `httpx.ASGITransport`, exactly as every other REST exercise already
  does) to trigger a server-side `manager.broadcast(...)` that pushes a
  message out over an already-open WebSocket connection (via the
  hand-driven ASGI `websocket` scope from §4.1's WebSocket-testing
  entry) — two previously-separate no-real-transport techniques, now
  used together against one shared `app` instance in one grading
  script. Confirmed directly this composes cleanly: connect a watcher
  first (its `receive`/`send` closures backed by `asyncio.Queue`s, same
  as before), *then* issue the real REST call through a second,
  independent `httpx.AsyncClient`, then read the broadcasted message
  off the watcher's own `from_app` queue — all on the one Pyodide event
  loop, no locking or explicit hand-off needed since it's cooperative
  `asyncio` throughout. Each of the exercise's four checks
  (watcher-accepted, REST-succeeded, watcher-received-the-broadcast,
  bad-token-rejected) is wrapped in its own `try`/`except` rather than
  one outer one, specifically so a submission that's only wrong in one
  respect (e.g. forgot the `broadcast(...)` call entirely) still gets
  credit for the parts it got right, instead of one failure cascading
  into every later check reading as failed too. Verified directly: a
  correct submission passes all four; a submission that never calls
  `broadcast(...)` fails only that one check; a submission that accepts
  the connection *before* checking the token fails only the
  bad-token-rejected check (its first observed event is
  `websocket.accept`, not the expected `websocket.close`) — confirming
  the checks are actually independent, not coincidentally all-or-nothing.

### 4.2 E2B + Cloudflare Worker (real Docker, one call from the browser)

First built for Lesson 0.8 (Docker), once Pyodide's ceiling above stopped
being theoretical — a Docker lesson genuinely cannot be taught with no
real Docker daemon anywhere. Two pieces:

- **E2B** (`e2b` npm package) — a managed ephemeral-sandbox provider,
  hobby/free tier. A custom template, `course-docker-sandbox` (Ubuntu
  24.04 + Docker CE, confirmed via `docker run hello-world` at build time),
  gives every sandbox a real, working Docker daemon from the moment it
  starts — no per-session install/startup cost.
- **A Cloudflare Worker** (`/worker`, deployed as `agentic-ai-course-sandbox`
  at `agentic-ai-course-sandbox.agentic-ai-course.workers.dev`) — holds the
  E2B API key server-side (never shipped to the browser) and exposes a
  small REST API the static site calls directly. Confirmed, by direct
  testing rather than trusting docs: E2B's SDK genuinely works inside the
  Workers runtime (`@connectrpc/connect-web`'s fetch-based transport),
  despite older E2B documentation claiming Workers-incompatibility.

**Two usage shapes, both live in `worker/src/index.ts`:**

- **One-shot graded exercise** (`/docker-exercise/grade`, backing
  `<DockerGradedExercise />`) — spins up a fresh sandbox, writes the
  learner's submitted Dockerfile/.dockerignore alongside fixture files
  (including a fake `.env`/`.git` to check get excluded), builds twice
  (to check layer caching survives an unrelated change), inspects the
  built image, kills the sandbox, returns pass/fail + the real build log.
  One request, no session state.
- **Persistent interactive terminal** (`/docker-terminal/{start,exec,grade,end}`,
  backing `<DockerLiveTerminal />`) — for exercises that are a *sequence*
  of commands (build → run detached → inspect → clean up), not a single
  submission. The worker itself stays stateless: `start` creates a
  sandbox and returns its `sandboxId`; every later call
  (`exec`/`grade`/`end`) reconnects via `Sandbox.connect(sandboxId)` — the
  sandbox ID **is** the session token, no Durable Object or session store
  needed. Every `exec`'d command is appended to a transcript file written
  inside the sandbox's own filesystem (not held in worker memory), because
  grading needs to see commands whose effects a *later* command
  deliberately undoes (the exercise's own last step is `docker rm`, which
  destroys the very container earlier checks needed running) — `grade`
  replays that transcript rather than only checking current live state.
  `DockerLiveTerminal` only starts the sandbox on an explicit "Start
  sandbox" click (it's billable), not on page load/mount.

**Two real bugs worth remembering if this pattern gets extended:**
- `sbx.commands.run()` **throws** `CommandExitError` on any non-zero exit
  code — it does not just return a result with `exitCode` set. Every call
  site goes through a small `run()` wrapper in `worker/src/index.ts` that
  catches `CommandExitError` and reconstructs a normal
  `{stdout, stderr, exitCode}` result, otherwise a learner's *own* failing
  command (a typo'd flag, a broken Dockerfile) surfaces as an opaque
  `"exit status 1"` 500 instead of real, gradeable output.
- The sandbox's Docker socket is root-only, but lesson content teaches
  plain `docker ...` commands — `execInTerminalSession` transparently
  prepends `sudo` to any `docker` command rather than requiring learners
  to know a sandbox-specific permissions detail unrelated to what's being
  taught.

**Auth model** (`authorized()` in `worker/src/index.ts`): CORS locked to
`https://insanalytics.github.io`, plus a shared-secret `X-Site-Token`
header the client sends (`src/lib/dockerWorker.ts`). Explicitly **not**
real security — the token necessarily ships in the site's public JS
bundle, readable by anyone who opens devtools. Both together are a soft
speed bump against casual/automated abuse (each call is billable), not a
guarantee. A real Cloudflare rate-limit rule is the actual cost ceiling
and is still worth adding on top.

**Local dev gotcha:** `wrangler dev` on Windows can leave multiple stale
`workerd.exe`/`node.exe` processes running across restarts, silently
serving stale env bindings or hanging entirely on every request (even
trivial ones) once enough pile up. If a locally-correct code change
doesn't seem to take effect, or requests hang for no obvious reason,
`taskkill //F //IM workerd.exe` + `taskkill //F //IM node.exe` then a
single fresh `wrangler dev` is the fix — check `tasklist` before assuming
the code itself is wrong.

### 4.3 Downloadable project (local, learner's own machine)

For anything needing more than E2B's single-exercise shape can
reasonably provide (multiple real services running together, meant as a
lesson capstone rather than one graded step) — via `projectDownload` in
`_lesson.yaml` and the `<ProjectDownload />` component
(`src/components/ProjectDownload.astro`). Keeps cost at $0 by pushing
real compute to the learner's own machine entirely.

**Implemented as: one separate public GitHub repo per project**, under
the `insAnalytics` org, `main` as the default branch, named
`agentic-ai-course-<project-name>` — not a folder inside this repo, not a
shared "projects" mono-repo. The component links to the repo itself plus
GitHub's own auto-generated `/archive/refs/heads/main.zip` (works with no
extra build/release step). Locally, each project also gets cloned into
`../Agentic_AI_Projects/<project-name>` (a sibling folder to this repo,
outside version control here) rather than left in a scratch/temp
directory. First one: `agentic-ai-course-agent-registry` (Lesson 0.8) —
a Flask + Postgres app shipped with intentional bugs (naive Dockerfile
layer ordering, a `docker-compose.yml` missing its volume, root user) for
the README's walkthrough to fix. Verified end-to-end in a real E2B
sandbox before publishing, including confirming the specific claim the
walkthrough makes (a volume surviving container recreation) is actually
true and not just plausible-sounding — `docker compose restart` alone
does *not* prove this, since restart never destroys the container in the
first place; `docker compose up -d --force-recreate` does.

---

## 5. Local editing/preview workflow

1. Clone the repo.
2. `npm install`
3. `npm run dev` — local server with live reload, editing any `.mdx` file in
   `/src/content/modules/` updates the page instantly.
4. Commit + push to `main` → a GitHub Actions workflow builds and deploys to
   GitHub Pages automatically.

No build step is required to *write* a lesson — only to preview/deploy it.

For the Worker (`/worker`, only needed when touching real-Docker exercises):
`cd worker && npm install`, then `npx wrangler dev --port 8787` for local
testing (reads `worker/.dev.vars`, gitignored — needs `E2B_API_KEY` and
`SITE_TOKEN`) and `npx wrangler deploy` to push to production. See §4.

---

## 6. Deployment

- **Site:** static build (`astro build`) → **GitHub Pages**, via a GitHub
  Actions workflow on push to `main`. Live at
  `https://insanalytics.github.io/agentic-ai-course/`. Free tier covers this
  at personal-project scale. No environment secrets needed for the site
  itself (LLM keys are client-side only).
- **Worker** (`agentic-ai-course-sandbox`, the E2B broker): deployed
  separately via `npx wrangler deploy` from `/worker` — not part of the
  site's own build/deploy pipeline. Its two secrets (`E2B_API_KEY`,
  `SITE_TOKEN`) are set with `wrangler secret put`, never committed.

---

## 7. Open questions / revisit list

- [x] Styling approach — **Tailwind CSS v4** (via `@tailwindcss/vite`). Visual
      direction is a clean-docs look (white background, one typeface —
      Inter), colored with a palette pulled from the InsAnalytics brand plus
      component-identity colors layered on top, all as tokens in
      `src/styles/global.css`:
      - `--color-accent` (navy) — primary actions and `GradedExercise`'s identity.
      - `--color-green` — `LiveDemo`'s identity (ungraded, editable).
      - `--color-quiz` (violet) — `QuizGroup`'s identity.
      - `--color-checkpoint-bg` (teal) — the shared full-bleed band behind
        every quiz/exercise card, signaling "you're being tested now,"
        distinct from each card's own header-bar color.
      - `--color-link` (indigo, `#4338ca`) — inline prose/hint/explanation
        links (see §3's "Linking to another concept"). Deliberately **not**
        navy/green/violet, since those are already claimed as component
        identities; also deliberately not `--color-accent-dark` (the
        original choice), which was nearly indistinguishable from
        `--color-ink`'s near-black at a glance — a real bug caught only once
        actual prose links existed to look at.
      - Inline code is red-on-light-gray.
      A persistent left sidebar (`src/components/Sidebar.astro`) lists all
      modules/lessons and highlights the active one; both `index.astro` and
      `LessonLayout.astro` render through `src/layouts/BaseLayout.astro`.
- [x] Real sandbox provider evaluation — **E2B**, chosen and implemented
      (§4.2) once Lesson 0.8 (Docker) made Pyodide's ceiling concrete rather
      than theoretical. Added alongside, not replacing, Pyodide.
- [ ] The tier-choice rule of thumb in §4's opening (Pyodide → E2B →
      downloadable, lightest tier that covers the need) is the guidance in
      use so far, across exactly one lesson (0.8) that needed tiers 2 and 3.
      Revisit once a second lesson forces a real judgment call between them.
- [x] Navigation/sidebar structure across modules — resolved: each lesson is
      a folder of pages (intro/concepts/recap), and the sidebar shows each
      lesson as an accordion (`<details>`/`<summary>`, no JS) expanding to
      that lesson's pages, auto-open for whichever lesson the current page
      belongs to. See §3.
