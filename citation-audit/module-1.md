# Citation audit: Module 1 (LLM Foundations)

## Concept coverage

A second pass, added 2026-09-30 at the owner's request, kept light as the
owner asked for Modules 1–3. It checks each concept page and lesson intro
as a whole, and anchors a concept only where a learner would reasonably ask
"says who?" or "does anyone actually do this?". Most of this module teaches
how a mechanism works, which counts as backed when the fact is right and
any named source is verified. Recaps are skipped. Two read-only subagents
did the check; the lead applied the edits.

**Counts (64 pages):** backed 58, our data only 3, unbacked
3. Fixed: six prose edits anchor every page that wasn't backed:
- Petrov et al. (NeurIPS 2023) on token counts across languages;
- OpenAI's API reference on frequency and presence penalties;
- OpenAI's logprobs cookbook on flagging uncertain outputs;
- OpenAI's reasoning guide and Anthropic's effort docs on when a reasoning
  model is worth it;
- Anthropic's structured-outputs docs on why plain JSON prompting fails;
- Manus on agent cost growing with steps.

Four optional additions were skipped. No demo, exercise or test string
changed, and no internal links were added. `npm run build` passes. Needs a
decision: none.

The Status column is the status before the fix. The Action column names
the edit in each lesson group's report: `cc1-A` for L1–L6 and `cc1-B` for
L7–L11.

| Concept | Central claim | What backs it | Status (before fix) | Action taken |
|---|---|---|---|---|
| L1 intro | Tokens are the basic unit; a subword vocabulary means nothing is unrepresentable | Textbook; Sennrich et al. and GPT-2 paper (per-claim audit) | BACKED | none |
| L1 C1 The vocabulary problem | Text must become numbers; a fixed word vocabulary can't cover everything (`<UNK>`) | Textbook fact | BACKED | none |
| L1 C2 Subword tokenization (BPE) | BPE builds a subword vocabulary by merging frequent pairs; byte-level fallback | Sennrich et al. ACL 2016, GPT-2 paper, RFC 3629 (per-claim audit, linked) | BACKED | none |
| L1 C3 Tokens in practice and cost | Tokens are the unit of cost; the same meaning costs more tokens in some languages because tokenizer training skews to English | OpenAI tokens guide for the rule of thumb (per-claim audit); the language claim rests on our tokenizer runs only (Khmer 15 vs English 5) | OUR DATA ONLY | E1: add Petrov et al. (NeurIPS 2023) |
| L1 C4 Non-text inputs as tokens | Images become patch tokens and count against the same window and price | Anthropic vision docs (per-claim audit, linked) | BACKED | none |
| L2 intro | Embeddings capture meaning geometrically; token vs text embeddings; cosine similarity | Textbook | BACKED | none |
| L2 C1 What an embedding is | Distance in vector space stands for similarity in meaning | Textbook; demo uses real GloVe vectors | BACKED | none |
| L2 C2 Token embeddings | A learned lookup table is the model's input layer, internal to the model | Textbook; GPT-2 vocab size (per-claim audit) | BACKED | none |
| L2 C3 Text embeddings | A separate model returns one vector per text, used to compare meaning | Textbook fact; demo is a real model (all-MiniLM-L6-v2) | BACKED | none |
| L2 C4 Cosine similarity | Cosine measures angle, not length; related pairs score higher than unrelated ones | Textbook; baseline wording fixed against our own tool (per-claim audit) | BACKED | none |
| L3 intro | Attention, position, stacked blocks and MoE are how an LLM computes | Textbook; Vaswani et al. (per-claim audit) | BACKED | none |
| L3 C1 Why a token needs context | A fixed embedding can't tell "river bank" from "money bank" | Textbook | BACKED | none |
| L3 C2 The attention mechanism | Query/Key/Value weighted combination; causal mask in GPT-style models | Textbook; Vaswani et al. (per-claim audit) | BACKED | none |
| L3 C3 Positional encoding | Attention is order-blind; added position vectors, now mostly RoPE | Vaswani et al., GPT-1/2 papers, RoFormer, DeepSeek-V3, gpt-oss (per-claim audit, linked) | BACKED | none |
| L3 C4 Stacking layers | Multi-head attention + feedforward = a block; residual stacking refines representations | Textbook; Vaswani et al. §3.1 (per-claim audit). The "early layers grammar, later meaning" aside cites "various interpretability studies" unnamed; per-claim E14 (Tenney et al., ACL 2019) was skipped as optional and remains available | BACKED | none (optional: apply per-claim E14) |
| L3 C5 Mixture of experts | A router sends each token to a few experts, so total size and per-token compute come apart | Mixtral, DeepSeek-V3, gpt-oss (per-claim audit, linked) | BACKED | none |
| L4 intro | Generation is a repeated mechanical prediction loop; hallucination and cutoff follow from it | Textbook; Kalai et al. (per-claim audit) | BACKED | none |
| L4 C1 Logits and probabilities | One logit per vocabulary entry; softmax makes a distribution | Textbook; GPT-2 demo (real model) | BACKED | none |
| L4 C2 Autoregressive generation | One token per pass, fed back in; cost scales with output length | Textbook | BACKED | none |
| L4 C3 Predicts, doesn't know | No fact-checking step; the same mechanism produces true and fabricated answers | Follows from the mechanism; our demo illustrates | BACKED | none |
| L4 C4 Hallucination | Hallucination is the mechanism landing on a plausible falsehood; training rewards guessing; allow "I don't know" | Kalai et al. (*Nature* 2026), Anthropic "Reduce hallucinations" (per-claim audit, linked) | BACKED | none |
| L4 C5 Knowledge cutoff | Parameters freeze at training; later events need the prompt (or tools) | Textbook fact. The "not a sharp line" nuance has no source; Anthropic publishes two cutoff dates per model, which backs it directly | BACKED | none (optional E4 anchors the nuance) |
| L5 intro | Decoding controls are real API parameters, grounded in logits/softmax | OpenAI, Gemini, Anthropic API refs (per-claim audit) | BACKED | none |
| L5 C1 Greedy vs sampling | Greedy is deterministic and tends to loop; sampling draws from the distribution | Holtzman et al. ICLR 2020 (per-claim audit, linked) | BACKED | none |
| L5 C2 Temperature | Divide logits by T before softmax; T→0 is greedy | Textbook | BACKED | none |
| L5 C3 Top-p and top-k | Top-k keeps k tokens; top-p keeps the smallest set reaching p and adapts to confidence | Holtzman et al. (per-claim audit, linked) | BACKED | none |
| L5 C4 Frequency vs presence penalty | Frequency grows with count, presence is flat; use frequency against loops, presence to push toward new topics | Mechanism verified in OpenAI and Gemini refs (per-claim audit), but no link on the page (E24 skipped); the "when each fits" advice has no source | UNBACKED | E2: add OpenAI API reference |
| L5 C5 Logprobs | A logprob shows how confident the model was; useful for flagging outputs to double-check | Which APIs return logprobs verified (per-claim audit); the "useful for flagging" practice has no source | UNBACKED | E3: add OpenAI cookbook "Using logprobs" |
| L5 C6 Stop sequences and nondeterminism | Stop sequences end generation; temperature 0 isn't byte-identical because of batching | OpenAI ref, Anthropic API ref, Thinking Machines (per-claim audit, linked) | BACKED | none |
| L6 intro | Window limits, shared budget, KV cache, cache-friendly structure, lost in the middle | Covered by the concept pages' sources | BACKED | none |
| L6 C1 What a context window is | Hard limit from compute, KV memory and training length; overflow handling varies, incl. compaction | Vaswani Table 1, Kwon et al., FlashAttention, Claude Code docs (per-claim audit, linked) | BACKED | none |
| L6 C2 Max output vs context window | Input and output share one budget; `max_tokens` is only a ceiling | Anthropic context-windows docs (per-claim audit, linked) | BACKED | none |
| L6 C3 KV cache | Keys and Values of earlier tokens are computed once and reused | Textbook; Kwon et al. (per-claim audit) | BACKED | none |
| L6 C4 Prompt structure and cache hits | Stable content first, variable last, for cache hits that cut cost and latency | OpenAI and Anthropic prompt-caching docs (per-claim audit, linked) | BACKED | none |
| L6 C5 Uneven use of long contexts | Lost in the middle; more context tends to mean worse use; put key content at the edges | Liu et al. TACL 2024, Chroma "Context Rot", Hsieh et al. ACL Findings 2024 (per-claim audit, linked) | BACKED | none |
| L7 intro | Outcomes: training stages explain model behavior; choose prompting vs retrieval vs fine-tuning | The concepts' anchors (InstructGPT, LIMA, DeepSeek-R1, OpenAI accuracy guide) | BACKED | none |
| L7 C1 Pretraining | Pretraining is next-token prediction on raw text; a base model doesn't "answer then stop" | Textbook fact; our GPT-2 run illustrates (labelled) | BACKED | none |
| L7 C2 SFT | SFT teaches behavior, not primarily new facts | LIMA, NeurIPS 2023 (per-claim audit) | BACKED | none |
| L7 C3 Preference training and roles | RLHF/RLAIF/DPO; roles and tool calls are learned token formats; sycophancy; root of prompt injection | InstructGPT, Constitutional AI, DPO, Anthropic "Define tools" doc, Sharma et al. + OpenAI GPT-4o rollback, Wallace et al. (all per-claim audit) | BACKED | none |
| L7 C4 RL for reasoning | RL on checkable rewards produces reasoning models; labs also run RL on agentic tasks; agent benchmarks are how models are compared | OpenAI o1 post, DeepSeek-R1, OpenAI Codex post (per-claim audit); the benchmark sentence had no anchor | BACKED | E1 (optional): add Anthropic Opus 4.5 launch on τ2-bench |
| L7 C5 Fine-tuning as a builder's option | Prompt first; RAG for missing/changing knowledge; fine-tune for consistent behavior; LoRA makes it cheap | OpenAI accuracy guide, LoRA (per-claim audit) | BACKED | none |
| L8 intro | Outcomes: scaling laws, emergence debate, ICL, test-time compute tradeoff | The concepts' anchors | BACKED | none (the routing advice is anchored by E2) |
| L8 C1 Scaling laws | Loss falls predictably as a power law; labs extrapolate from small runs; train past compute-optimal | Kaplan, Chinchilla, Llama 3 (per-claim audit) | BACKED | none |
| L8 C2 Emergent behavior | Emergence is contested; metric choice can create apparent jumps | Wei et al., Schaeffer et al., Du et al. (per-claim audit) | BACKED | none |
| L8 C3 In-context learning | Frozen weights learn from prompt examples; ability scales | GPT-3 paper (per-claim audit); Pythia demo is labelled our runs | BACKED | none |
| L8 C4 Test-time compute | More thinking improves answers; route by difficulty: reasoning for hard multi-step tasks, not simple ones | o1 post, self-consistency, reasoning-token billing docs (per-claim audit); the when-to-use advice had no outside source, only our cost demo | UNBACKED (the routing advice) | E2: add OpenAI reasoning best-practices guide + Anthropic effort docs |
| L9 intro | Outcomes: read/write real request and response fields | The concepts' verified API facts | BACKED | none |
| L9 C1 Request shape | Endpoint, auth header, JSON body; provider differences; some models drop `temperature` | Anthropic Messages API reference (per-claim audit) | BACKED | none |
| L9 C2 Response shape | Content, usage and stop_reason; OpenAI field names | Anthropic API ref, stop-reasons doc, OpenAI Responses docs (per-claim audit) | BACKED | none |
| L9 C3 Multi-turn | API is stateless; client resends history; cost compounds, caching discounts it | OpenAI conversation-state guide, Anthropic prompt caching (per-claim audit) | BACKED | none |
| L9 C4 Non-text inputs | Typed content blocks; base64 image data | Anthropic vision doc (per-claim audit) | BACKED | none |
| L9 C5 Streaming | SSE deltas expose token-by-token generation | Anthropic streaming doc (per-claim audit) | BACKED | none |
| L9 C6 Reasoning output | Thinking blocks are separate, billed, never raw on Claude; send them back unchanged | Anthropic extended-thinking doc (per-claim audit) | BACKED | none |
| L10 intro | Outcomes: prompting for JSON is a request; constrained decoding guarantees shape | The concepts' anchors | BACKED | none |
| L10 C1 The naive approach | Asking for JSON in the prompt can fail (extra text, wrong types) | Only the page's own illustrative strings | OUR DATA ONLY | E3: add Anthropic structured-outputs docs |
| L10 C2 Constrained decoding | Masking invalid tokens guarantees shape; put reasoning before the answer | OpenAI structured-outputs post and guide, Anthropic structured-outputs doc (per-claim audit) | BACKED | E4 (optional): note OpenAI's own chain-of-thought example orders `steps` before `final_answer` |
| L10 C3 Pydantic to schema | `model_json_schema()` feeds the API's schema field; guarantee holds only for a finished response | Anthropic structured-outputs doc, OpenAI guide (per-claim audit) | BACKED | none |
| L10 C4 Tool calling | A tool call is structured output; your code decides whether to run it | Anthropic tool-use overview ("returns a structured call that your application executes"), `strict: true` (per-claim audit) | BACKED | none |
| L10 C5 Full round trip | Tool result goes back as a message, paired by id | Anthropic tool-use docs (per-claim audit) | BACKED | none |
| L11 intro | Outcomes: quantization, model selection, cost, rate limits | The concepts' anchors | BACKED | none |
| L11 C1 Quantization | Fewer bits cut memory with some quality risk; matters to whoever hosts the model | Kurtic et al. ACL 2025, OpenRouter docs, DeepSeek-V3 (per-claim audit) | BACKED | none |
| L11 C2 Model landscape | Open vs closed tradeoff; smallest tier that works; MoE memory vs compute | Anthropic "Choosing a model", Mistral Mixtral post, Hugging Face MoE explainer (per-claim audit); open-vs-closed is uncontroversial | BACKED | none |
| L11 C3 Token pricing | Cost drivers compound; agent input cost grows about with steps squared; caching helps a lot | Anthropic pricing, caching and batch docs for the facts (per-claim audit); the agent-cost claim rested on our demo alone | OUR DATA ONLY (the agent-cost claim) | E5: add the Manus context-engineering post |
| L11 C4 Provider rate limits | 429s; exponential backoff with jitter; honor Retry-After | AWS Builders' Library, Anthropic rate-limits doc (per-claim audit) | BACKED | none |


Audited 2026-09-30, on branch `citation-audit/module-1`, as a light pass:
verify what's named, and anchor the practice a learner would question. Two
read-only subagents did the inventory and verification. Their full reports
follow. The lead re-read the primary text for every new figure before
applying it.

The module had two external links before this pass. Every edited text is
prose, a quiz option or an explanation, except for two comments inside
LiveDemo code (E9 and E12 of report A). All three demos on those two pages
were re-run from the page text in Pyodide 0.26.4, and each runs cleanly with
unchanged output. `npm run build` passes (523 pages), and no internal links
were added.

## What happened to each proposed edit

| Report | Applied | Held for a decision | Skipped (optional) |
|---|---|---|---|
| A: L1–L6 | E1–E4, E6–E13, E15–E33, with changes to E20 and E29 (see below) | E34–E36 (why lost-in-the-middle happens) | E5, E14, E24 |
| B: L7–L11 | E1–E38 | none | none |

- **E20 (Kalai et al.):** report A proposed labelling it a preprint. The
  lead changed this to cite the *Nature* 2026 version, as Module 6 now does.
- **E29 (max output):** gained one sentence, the report's decision 3: each
  model also has its own maximum output (up to 128k tokens on Anthropic's
  1M-window models), so the real ceiling is the smallest of three numbers.
  The demo is unchanged.

## Totals across the module

- **Verified:** 84, plus 9 partly verified or out of date. The data-backed
  components match their sources:
  - `lost-in-the-middle.json` matches Liu et al. v3 (TACL 2024), all 28
    values.
  - The Kaplan fits match the paper.
  - The emergence chart is labelled as an illustration and now credits
    Schaeffer et al.'s toy model.
  - The ICL demo is labelled as our own runs.
- **Contradicted:** 8.
  - UTF-8 uses 1 to 4 bytes per character, not 2 to 3.
  - `12346` splits the same way as `12345` on o200k.
  - Unrelated pairs in the page's own embedding tool are often negative
    (57 of 171).
  - GPT-2 learns its positional encodings in training.
  - Chroma doesn't say multi-part tasks degrade more.
  - Kaplan et al. weren't the first to find the power laws; they cite
    Hestness et al. 2017.
  - API users can choose quantization on open-weight hosts.
  - Image tokens run to well over "several hundred".
- **Not reachable:** 0.
- **Re-labelled:** 7 (Chroma as a vendor's technical report, as in
  Module 4; Kalai et al. in *Nature*; an OpenAI rule of thumb; and others).
- **Corrected wording:** 15. This includes "tens or hundreds of thousands"
  of vocabulary entries, RoPE for open-weight models, sycophancy's
  strength per Sharma et al. (with OpenAI's April 2025 GPT-4o rollback),
  and INT4's quality cost per Kurtic et al.
- **Sources added:** 18 links to papers already named, and about 32 new
  anchors (vendor docs, RFC 3629, DeepSeek-R1, InstructGPT, DPO,
  Chinchilla, LoRA and others).

## Needs a decision (approved by the owner and applied, 2026-09-30)

*Applied:* E34–E36. The lead re-read both sources: Hsieh et al. (ACL
Findings 2024) say tokens at the start and end "receive higher attention,
regardless of their relevance", and Liu et al. found the U-shape in
MPT-30B both before and after instruction tuning, "indicating that the
instruction fine-tuning process is not necessarily responsible".

1. **Why lost-in-the-middle happens (L6 C5, its quiz and the recap).** The
   page names "introductions and conclusions in training documents" as a
   cause, with no source. Report A recommends replacing it with a measured
   cause, a U-shaped attention bias (Hsieh et al., ACL Findings 2024), plus
   Liu et al.'s own finding that instruction tuning is "not necessarily
   responsible". That changes one of the two causes the concept teaches,
   and two quiz explanations. Recommendation: apply E34–E36.

**Applied, but worth a look.**
- **RL for reasoning (L7 C4):** it no longer says the RL "rewards
  generating extended reasoning". DeepSeek-R1 rewards correct answers, and
  the longer reasoning emerged.
- **Quantization:** the claim that API users never see it is narrowed to
  closed-model APIs (L11 C1, its quiz and the recap). The correct answers
  don't change.
- **INT4 (L11 C1):** "a real quality cost" is aligned with the recap and
  Kurtic et al. (99.36% recovery at 4-bit).
- **Cosine baseline (L2 C4):** it now matches the page's own tool.

---

## Report: Citation audit: Module 1, Lessons 1-6 (light touch)

Scope: every `.mdx` in `src/content/modules/01-llm-foundations/01-tokenization` through
`06-context-windows-and-kv-cache`, plus the data-backed components they cite
(`PositionAccuracyChart.tsx` + `src/data/lost-in-the-middle.json`, the `gpt-tokenizer`
`o200k_base` demos, `src/data/embedding-sentences.json`).

These six lessons had **no external links at all** before this audit. Downloads are in
`scratchpad/audit/m1A/`. arXiv versions were checked on each abs page (listed below).

### Sources read (primary)

| Source | Version checked | Venue |
|---|---|---|
| Liu et al., "Lost in the Middle", arXiv 2307.03172 | v3 (20 Nov 2023), latest | TACL vol. 12 (2024), https://aclanthology.org/2024.tacl-1.9/ |
| Kalai, Nachum, Vempala, Zhang, "Why Language Models Hallucinate", arXiv 2509.04664 | v1 (4 Sep 2025), only version | preprint (OpenAI + Georgia Tech) |
| Hong, Troynikov, Huber, "Context Rot", Chroma | July 2025 | vendor technical report |
| Hsieh et al., "Found in the Middle", arXiv 2406.16008 | v2 | ACL Findings 2024, https://aclanthology.org/2024.findings-acl.890/ |
| Sennrich, Haddow, Birch, arXiv 1508.07909 | v5 | ACL 2016, https://aclanthology.org/P16-1162/ |
| Radford et al., GPT-2 paper (cdn.openai.com PDF) | 2019 | OpenAI report |
| Radford et al., GPT-1 paper (cdn.openai.com PDF) | 2018 | OpenAI report |
| Vaswani et al., arXiv 1706.03762 | v7 | NeurIPS 2017 |
| Su et al., RoFormer, arXiv 2104.09864 | v5 | (Neurocomputing 2024) |
| Tenney, Das, Pavlick, arXiv 1905.05950 | v2 | ACL 2019, https://aclanthology.org/P19-1452/ |
| Jiang et al., Mixtral of Experts, arXiv 2401.04088 | v1 | preprint |
| DeepSeek-V3 Technical Report, arXiv 2412.19437 | v2 | tech report |
| gpt-oss-120b & gpt-oss-20b Model Card, arXiv 2508.10925 | v1 | OpenAI model card |
| Dao et al., FlashAttention, arXiv 2205.14135 | v2 | NeurIPS 2022 |
| Holtzman et al., arXiv 1904.09751 | v2 | ICLR 2020 |
| Kwon et al., vLLM/PagedAttention, arXiv 2309.06180 | v1 | SOSP 2023 |
| Petrov et al., arXiv 2305.15425 | v2 | NeurIPS 2023 |
| RFC 3629 (UTF-8) | - | IETF |
| Anthropic docs (platform.claude.com, fetched 2026-09-30): Create a Message, Prompt caching, Context windows, Vision, Reduce hallucinations; Claude Code docs "costs" | current | vendor docs |
| OpenAI docs via Wayback (Dec 2025): Prompt caching guide, Chat Completions reference, help article "What are tokens" | Dec 2025 snapshots | vendor docs |
| Gemini API reference `generate-content` (ai.google.dev, fetched 2026-09-30) | current | vendor docs |
| Thinking Machines, "Defeating Nondeterminism in LLM Inference" (Horace He et al., 10 Sep 2025) | - | lab engineering post |
| nobelprize.org, Physics 1921 summary | - | primary |

### 1. Claims table

Paths are relative to `src/content/modules/01-llm-foundations/`.

| ID | file:line | claim (trimmed) | source given | kind | verdict | evidence | recommendation |
|---|---|---|---|---|---|---|---|
| C1 | 01-tokenization/02-subword-tokenization-bpe.mdx:23 | "Byte-Pair Encoding (BPE) is the most common way this vocabulary of pieces actually gets built." | none (BPE named) | fact | VERIFIED (origin) | Sennrich et al. v5 §3.2: "Byte Pair Encoding (BPE) (Gage, 1994) is a simple data compression technique that iteratively replaces the most frequent pair of bytes in a sequence" | add link (E1) |
| C2 | 01-tokenization/02-subword-tokenization-bpe.mdx:60-62 | byte-level BPE "starts from the 256 possible bytes" | none | fact | VERIFIED | GPT-2 paper §2.2: "a byte-level version of BPE only requires a base vocabulary of size 256" | add link (E2) |
| C3 | 01-tokenization/02-subword-tokenization-bpe.mdx:63-65 | in UTF-8 "a character outside basic Latin letters takes 2 to 3 bytes" | none | fact | CONTRADICTED | RFC 3629 §3: characters "are encoded using sequences of 1 to 4 octets"; U+10000–U+10FFFF (emoji, rarer CJK) take 4 bytes | fix to "2 to 4" (E2) |
| C4 | 01-tokenization/02-subword-tokenization-bpe.mdx:113-115 | "`12345` might become `"123"` + `"45"`, while `12346` splits differently" | none | fact | CONTRADICTED (by the course's own tokenizer) | `gpt-tokenizer` o200k_base, re-run: `12345` → `"123","45"`; `12346` → `"123","46"` (same pattern); `1234567` → `"123","456","7"`. tiktoken's o200k/cl100k regex chunks digits with `\p{N}{1,3}` | rewrite around left-to-right 3-digit chunks (E3) |
| C5 | 01-tokenization/02-subword-tokenization-bpe.mdx:103-106 | `" cat"` and `"cat"` are different tokens | our data | fact | VERIFIED | o200k_base: `" cat"` = 9059, `"cat"` = 8837 | keep |
| C6 | 01-tokenization/02-subword-tokenization-bpe.mdx:108-110 | "strawberry" is a few multi-letter tokens | our data | fact | VERIFIED | o200k_base: `"st","raw","berry"` | keep |
| C7 | 01-tokenization/03-tokens-in-practice-and-cost.mdx:23-26 | "about 4 characters, or roughly 0.75 words, per token" | none | fact (rule of thumb) | VERIFIED, unattributed | OpenAI help article (Wayback 2025-12-28): "Helpful rules of thumb for English: 1 token ≈ 4 characters 1 token ≈ ¾ of a word 100 tokens ≈ 75 words" | re-label: attribute to OpenAI (E4) |
| C8 | 01-tokenization/03-tokens-in-practice-and-cost.mdx:32-38 | 7 tokens / 12 tokens, with the listed pieces | "measured directly against this lesson's real tokenizer" | our data | VERIFIED | re-run: 7 `["The"," cat",…,"."]`; 12 `["The"," agent","ic",…," P","yd","antic",…]` exactly | keep |
| C9 | 01-tokenization/03-tokens-in-practice-and-cost.mdx:59-61 | Hindi now tokenizes about as efficiently as English on this tokenizer | our data | our data | VERIFIED | `"आज आप कैसे हैं?"` = 5 tokens vs `"How are you today?"` = 5 | keep |
| C10 | 01-tokenization/03-tokens-in-practice-and-cost.mdx:64-69 | English 5 tokens, Khmer 15 tokens | our data | our data | VERIFIED | re-run: 5 and 15 | keep |
| C11 | 01-tokenization/03-tokens-in-practice-and-cost.mdx:53-58, 78-82 | tokenizers skew toward English; same conversation costs more in some languages | none | effectiveness | UNSOURCED | Petrov et al. (NeurIPS 2023) abstract: "The same text translated into different languages can have drastically different tokenization lengths, with differences up to 15 times in some cases." | optional: add stronger backing (E5) |
| C12 | 01-tokenization/04-non-text-inputs-as-tokens.mdx:25-27 | an image is divided into a grid of patches, each its own token-like unit | none | fact | VERIFIED | Anthropic Vision docs: "Each patch is a 28×28-pixel block of the image, referred to as a visual token." | keep (linked via E6) |
| C13 | 01-tokenization/04-non-text-inputs-as-tokens.mdx:46-50, 88, 94 | "A single image can easily cost several hundred to over a thousand tokens" | none | fact | OUTDATED / understated | Anthropic Vision docs table: 200×200 px = 64 tokens; 1000×1000 = 1296; Claude 4.7+ high-res tier max "4784" visual tokens | replace with "hundreds to thousands" + vendor anchor (E6-E8) |
| C14 | 02-embeddings/02-token-embeddings-internal-input-layer.mdx:24-25 | demo comment: one row per vocabulary entry "(tens of thousands)" | none | fact | OUTDATED | GPT-2 paper: "The vocabulary is expanded to 50,257"; the course's own o200k_base decodes ids up to ~200,000 | replace (E9) |
| C15 | 02-embeddings/04-cosine-similarity.mdx:87-91 | real models: unrelated pairs "rarely score near 0 … around 0.1–0.3 … negative scores are rare" | none | fact | CONTRADICTED (by the page's own tool) | `src/data/embedding-sentences.json` (all-MiniLM-L6-v2, 19 sentences): cat/stock-market 0.075, password/weather −0.061; 57 of 171 pairs are negative, median 0.037. The tool rendered right below this sentence shows near-0 and negative scores | rewrite (E10); see Needs a decision |
| C16 | 03-attention-and-transformer-architecture/03-positional-encoding.mdx:36-41 | original transformer and GPT-2 add a position vector once at the input | none (named) | fact | VERIFIED | Vaswani v7 §3.5: "we use sine and cosine functions of different frequencies"; GPT-1 paper: "We used learned position embeddings instead of the sinusoidal version proposed in the original work." | add link (E11) |
| C17 | 03-attention-and-transformer-architecture/03-positional-encoding.mdx:46-48 | demo comment: "real positional encodings are computed with a formula, not hand-set" | none | fact | CONTRADICTED for GPT-2 | GPT-1/GPT-2 use learned position embeddings (quote above), not a formula | fix comment (E12) |
| C18 | 03-attention-and-transformer-architecture/03-positional-encoding.mdx:73-74 | "Most current LLMs, open and closed, use … RoPE" | none | fact | PARTLY VERIFIED (open only) | DeepSeek-V3 §2.1.1: "the decoupled key that carries Rotary Positional Embedding (RoPE) (Su et al., 2024)"; gpt-oss model card: "apply rotary position embeddings". Closed models don't publish architectures, so "and closed" can't be checked | soften "closed"; link RoFormer (E13) |
| C19 | 03-attention-and-transformer-architecture/03-positional-encoding.mdx:80-85 | RoPE makes the Query·Key score depend on relative position | none | fact | VERIFIED | RoFormer v5 abstract: "RoPE encodes the absolute position with a rotation matrix and meanwhile incorporates the explicit relative position dependency in self-attention formulation" | keep (linked via E13) |
| C20 | 03-attention-and-transformer-architecture/04-stacking-layers-into-a-transformer.mdx:41-44 | each block adds its output to its input (residual connection) | none | fact | VERIFIED | Vaswani §3.1: "We employ a residual connection [11] around each of the two sub-layers" | keep |
| C21 | 03-attention-and-transformer-architecture/04-stacking-layers-into-a-transformer.mdx:56-59 | broad trend "observed across various interpretability studies" (early grammar → later meaning) | "various interpretability studies" (unnamed) | effectiveness | UNSOURCED | Tenney et al. (ACL 2019) abstract: "the regions responsible for each step appear in the expected sequence: POS tagging, parsing, NER, semantic roles, then coreference", and the model "can and often does adjust this pipeline dynamically" (supports both the trend and the caution) | optional: add backing (E14) |
| C22 | 03-attention-and-transformer-architecture/05-mixture-of-experts.mdx:19 | "Mixtral-style models use 2 out of 8 experts per token" | none (named) | fact | VERIFIED | Mixtral v1 abstract: "each layer is composed of 8 feedforward blocks (i.e. experts). For every token, at each layer, a router network selects two experts" | add link (E15) |
| C23 | 03-attention-and-transformer-architecture/05-mixture-of-experts.mdx:19-20, 72 | "many newer MoE models use around 8 out of 100 or more smaller ones"; quiz: "commonly 2 of 8 or similar" | none | fact | VERIFIED (loosely) | DeepSeek-V3 §4.2: "1 shared expert and 256 routed experts … 8 experts will be activated for each token"; gpt-oss card: "128 for gpt-oss-120b … we select the top-4 experts for each token" | replace vague figure with named examples (E15, E16) |
| C24 | 04-how-llms-generate-text/01-logits-and-the-probability-distribution.mdx:17-18, 97; 06-recap-practice.mdx:26 | one logit per vocabulary entry, "tens of thousands of numbers" | none | fact | PARTLY (true for GPT-2 only) | GPT-2: 50,257; o200k_base ~200,000 | replace (E17-E19) |
| C25 | 04-how-llms-generate-text/01-logits-and-the-probability-distribution.mdx:62 | GPT-2, "a small model from 2019" | none | fact | VERIFIED | GPT-2 paper, OpenAI 2019 | keep |
| C26 | 04-how-llms-generate-text/04-hallucination-as-a-direct-consequence.mdx:49-50 | Einstein's Nobel was for the photoelectric effect | none | fact | VERIFIED | nobelprize.org 1921: "for his services to Theoretical Physics, and especially for his discovery of the law of the photoelectric effect" | keep |
| C27 | 04-how-llms-generate-text/04-hallucination-as-a-direct-consequence.mdx:68-74 | "Research from OpenAI in 2025 (… Kalai et al.)": exam analogy; "guessing always scores better"; "Most benchmarks … grade the same way" | named, unlinked | effectiveness | VERIFIED, with two nuances | arXiv 2509.04664v1 (only version): "guessing when unsure maximizes the expected score under a binary 0-1 scheme that awards 1 point for a correct answer and none for blanks or IDKs" (so "always" → in expectation); §4: "the vast majority of popular evaluations have binary grading"; "Optimizing models for these benchmarks may therefore foster hallucinations." It's a preprint; one of four authors is at Georgia Tech | re-label (preprint, "argue") + link (E20) |
| C28 | 04-how-llms-generate-text/04-hallucination-as-a-direct-consequence.mdx:77-78 | a system prompt that explicitly allows "I don't know" helps | none | practice | UNSOURCED | Anthropic "Reduce hallucinations": "Allow Claude to say "I don't know": Explicitly give Claude permission to admit uncertainty." | lead with industry source (E21) |
| C29 | 05-decoding-strategies-and-generation-controls/01-greedy-decoding-vs-sampling.mdx:43-49 | greedy decoding tends toward repetitive, bland, looping text | none | effectiveness | UNSOURCED | Holtzman et al. (ICLR 2020) abstract: "maximization-based decoding methods such as beam search lead to degeneration -- output text that is bland, incoherent, or gets stuck in repetitive loops." | add backing (E22) |
| C30 | 05-decoding-strategies-and-generation-controls/03-top-p-and-top-k.mdx:48-52 | top-p = nucleus sampling = smallest set reaching cumulative p | none (named in heading) | fact | VERIFIED | Holtzman §3.1: "we define its top-p vocabulary V(p) ⊂ V as the smallest set such that…" | add link (E23) |
| C31 | 05-decoding-strategies-and-generation-controls/04-frequency-and-presence-penalty.mdx:19-22 | penalties are OpenAI-style params some providers also offer; Anthropic's API doesn't have them | none | fact | VERIFIED | OpenAI Chat reference: "frequency_penalty … Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far"; Gemini reference lists `presencePenalty`/`frequencyPenalty`; Anthropic "Create a Message" parameter list (fetched 2026-09-30) has no penalty parameter | keep (optional links, E24) |
| C32 | 05-decoding-strategies-and-generation-controls/04-frequency-and-presence-penalty.mdx:28-48 | frequency grows with count; presence is flat once triggered | none | fact | VERIFIED | Gemini reference: presence penalty "is binary on/off and not dependant on the number of times the token is used (after the first). Use frequencyPenalty for a penalty that increases with each use." | keep (E24 links it) |
| C33 | 05-decoding-strategies-and-generation-controls/05-logprobs.mdx:17-21 | OpenAI and Gemini can return logprobs; Anthropic doesn't | none | fact | VERIFIED | OpenAI: "logprobs … Whether to return log probabilities of the output tokens"; Gemini: "responseLogprobs … If true, export the logprobs results in response"; no logprobs field in Anthropic's Create a Message | keep |
| C34 | 05-decoding-strategies-and-generation-controls/06-stop-sequences-and-nondeterminism.mdx:35-36 | real APIs typically leave the stop sequence out | none | fact | VERIFIED | OpenAI Chat reference: "The returned text will not contain the stop sequence." | keep |
| C35 | 05-decoding-strategies-and-generation-controls/06-stop-sequences-and-nondeterminism.mdx:59-74 | temperature 0 isn't byte-identical; batching changes floating-point order | none | fact | VERIFIED, small nuance | Anthropic Create a Message: "Note that even with `temperature` of `0.0`, the results will not be fully deterministic."; Thinking Machines: "our request's output does depend on the parallel user requests … because our forward pass lacks "batch invariance", causing our request's output to depend on the batch size of our forward pass." (batch *size*, not *which* requests) | add backing + one-word fix (E25, E26) |
| C36 | 05-decoding-strategies-and-generation-controls/00-intro.mdx:21-23 | some newest models have started dropping sampling params | none | fact | VERIFIED | Anthropic Create a Message: temperature "Deprecated. Models released after Claude Opus 4.6 do not support setting temperature"; same for `top_k` and `top_p` | keep |
| C37 | 06-context-windows-and-kv-cache/01-what-a-context-window-is.mdx:29-44 | attention compute grows with the square of length | none | fact | VERIFIED | Vaswani Table 1: "Self-Attention O(n²·d)" | keep |
| C38 | 06-context-windows-and-kv-cache/01-what-a-context-window-is.mdx:50-52 | KV cache "can take many gigabytes … for a single request" | none | fact | VERIFIED | Kwon et al. (SOSP 2023) §3: for OPT-13B "the KV cache of a single token demands 800 KB … the KV cache of one request can be as much as 1.6 GB" (at only 2,048 tokens) | keep |
| C39 | 06-context-windows-and-kv-cache/01-what-a-context-window-is.mdx:52-55 | FlashAttention cuts attention's own memory but not the quadratic compute | none (named) | fact | VERIFIED | Dao et al. v2 §1: "uses less memory--linear in sequence length--than standard attention"; Theorem 1: "O(N²d) FLOPs" | add link (E27) |
| C40 | 06-context-windows-and-kv-cache/01-what-a-context-window-is.mdx:81-83 | Claude Code summarizes earlier conversation near the limit | none (named) | fact | VERIFIED | Claude Code docs, costs page: "auto-compaction, which summarizes conversation history when approaching context limits" | add link (E28) |
| C41 | 06-context-windows-and-kv-cache/02-max-output-length-vs-context-window.mdx:45-48 | providers differ: some clamp, others reject | none | fact | VERIFIED | Anthropic "Context windows": "On Claude 4.5 models and newer, if input tokens plus `max_tokens` exceeds the context window size, the API accepts the request. If generation then reaches the context window limit, it stops … On earlier models, the API returns a validation error instead." | add concrete example (E29) |
| C42 | 06-context-windows-and-kv-cache/04-prompt-structure-and-cache-hits.mdx:26-32 | cache reuse needs an exact token-for-token prefix | none | fact | VERIFIED | OpenAI Prompt caching guide: "Cache hits are only possible for exact prefix matches within a prompt." | keep (cited in E30) |
| C43 | 06-context-windows-and-kv-cache/04-prompt-structure-and-cache-hits.mdx:68-77 | stable content first; providers discount cache hits and cut latency | none | practice | UNSOURCED | OpenAI guide: "place static content like instructions and examples at the beginning of your prompt, and put variable content, such as user-specific information, at the end"; "Caching is enabled automatically for prompts that are 1024 tokens or longer." Anthropic: "Place static content (tool definitions, system instructions, context, examples) at the beginning of your prompt."; "Cache read tokens are 0.1 times the base input tokens price (see the table footnote for per-model exceptions)"; minimum cacheable length 512 to 4,096 tokens by model | lead with industry source (E30) |
| C44 | 06-context-windows-and-kv-cache/05-uneven-use-of-long-contexts.mdx:34-53 + `src/data/lost-in-the-middle.json` | Liu et al. 2023: 20 docs; GPT-3.5-Turbo 75.8 / 53.8 / 63.2, closed-book 56.1; Claude-1.3 and MPT shallower; LongChat start-heavy; best accuracy always at an edge | named, unlinked in prose; component cites arXiv id + table | effectiveness | VERIFIED (every number) | arXiv v3 Appendix G.2 Table 6 (20 docs): GPT-3.5-Turbo "75.8% 57.2% 53.8% 55.4% 63.2%"; Claude-1.3 "59.9% 55.9% 56.8% 57.2% 60.1%"; MPT-30B-Instruct "53.7% 51.8% 52.2% 52.7% 56.3%"; LongChat-13B (16K) "68.6% 57.4% 55.3% 52.5% 55.0%". Table 1 closed-book: 56.1 / 48.3 / 31.5 / 35.0; oracle 88.3 / 76.1 / 81.9 / 83.4. JSON matches all 28 values. §2.3: "performance in 20- and 30-document settings is lower than performance without any input documents (i.e., closed-book performance; 56.1%)" | add link + venue/version (E31); component caption could say "TACL 2024; arXiv v3" |
| C45 | 06-context-windows-and-kv-cache/05-uneven-use-of-long-contexts.mdx:59-64 | current models score close to perfectly on needle-in-a-haystack "wherever the needle sits" | none | fact | PARTLY VERIFIED | Chroma: "these models achieve near-perfect scores on widely adopted benchmarks like Needle in a Haystack (NIAH)" (says nothing about "wherever the needle sits") | attribute to the report (E32) |
| C46 | 06-context-windows-and-kv-cache/05-uneven-use-of-long-contexts.mdx:67-73 | "A 2025 study by Chroma, "Context Rot", tested 18 current models … simple tasks … only the input length changed … fell further with distractors" | named, unlinked | effectiveness | VERIFIED, needs vendor label | Chroma: "we evaluate 18 LLMs, including the state-of-the-art GPT-4.1, Claude 4, Gemini 2.5, and Qwen3 models"; "our experiments hold task complexity constant while varying only the input length"; "Even a single distractor reduces performance relative to the baseline (needle only), and adding four distractors compounds this degradation further." Module 4 already labels it "Chroma, a company that makes a vector database, published a technical report" | re-label (vendor technical report) + link (E33) |
| C47 | 06-context-windows-and-kv-cache/05-uneven-use-of-long-contexts.mdx:73-74 | "Tasks that need the model to connect several pieces, rather than find one, degrade more." | attached to Chroma | effectiveness | CONTRADICTED (not in source) | Chroma never measures multi-piece vs single-piece tasks. Closest line: "Real-world applications typically involve much greater complexity, implying that the influence of input length may be even more pronounced in practice." | replace with the report's own claim (E33) |
| C48 | 06-context-windows-and-kv-cache/05-uneven-use-of-long-contexts.mdx:87-95; quiz 147; 06-recap-practice.mdx:121 | causes: attention/positional-encoding interaction, and training documents putting key content in introductions and conclusions | "researchers point to" (unnamed) | effectiveness | attention part VERIFIED; training-documents part UNSOURCED, and the original study's own training-data test cuts against it | Hsieh et al. (ACL Findings 2024): "LLMs exhibit an U-shaped attention bias where the tokens at the beginning and at the end of its input receive higher attention, regardless of their relevance." Liu et al. §4.3 tested instruction-tuning data (task placed at the start) and found both MPT-30B and MPT-30B-Instruct "have a U-shaped performance curve … indicating that the instruction fine-tuning process itself is not necessarily responsible" | replace (E34-E36); see Needs a decision |
| C49 | 06-context-windows-and-kv-cache/05-uneven-use-of-long-contexts.mdx:110-112 | placing important content near the start or end is a reasonable response | follows from Liu | practice | VERIFIED (inferential) | Liu et al. abstract: "performance is often highest when relevant information occurs at the beginning or end of the input context" | keep |

Our own data (GPT-2 next-token demos in Lessons 4-5, AttentionExplorer, EmbeddingSpace, SentenceEmbeddingSpace, TokenizerVisualizer): each is labelled on the page as a real model's output, with the model named (GPT-2, all-MiniLM-L6-v2, GloVe, o200k_base via the component). No re-runs needed beyond C4-C10 and C15, which I re-ran because the prose makes a specific claim about them.

### 2. Proposed edits

Paths are relative to `src/content/modules/01-llm-foundations/`. Priority: **fix** = wrong or out of date; **link** = named source, add link/label; **add** = new source for an unsourced claim (optional ones marked).

**E1. `01-tokenization/02-subword-tokenization-bpe.mdx`** (link, C1)
Current:
```
**Byte-Pair Encoding (BPE)** is the most common way this vocabulary of
pieces actually gets built.
```
Proposed:
```
**Byte-Pair Encoding (BPE)** is the most common way this vocabulary of
pieces actually gets built. It started as a data-compression trick and
was adapted for language by
[Sennrich, Haddow and Birch (ACL 2016)](https://aclanthology.org/P16-1162/).
```

**E2. `01-tokenization/02-subword-tokenization-bpe.mdx`** (fix C3 + link C2)
Current:
```
Modern tokenizers go one level lower than characters: **byte-level
BPE** starts from the 256 possible bytes that text is stored as, so the
guaranteed fallback is single bytes rather than single characters. That's
also why some scripts cost so many tokens: in the standard UTF-8
encoding, a character outside basic Latin letters takes 2 to 3 bytes,
so a rarely-seen character can cost several tokens on its own.
```
Proposed:
```
Modern tokenizers go one level lower than characters: **byte-level
BPE**, used since
[GPT-2](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf),
starts from the 256 possible bytes that text is stored as, so the
guaranteed fallback is single bytes rather than single characters. That's
also why some scripts cost so many tokens: in the standard
[UTF-8](https://www.rfc-editor.org/rfc/rfc3629) encoding, a character
outside basic Latin letters takes 2 to 4 bytes (3 for most non-Latin
scripts, 4 for emoji), so a rarely-seen character can cost several
tokens on its own.
```

**E3. `01-tokenization/02-subword-tokenization-bpe.mdx`** (fix C4)
Current:
```
- **Numbers split irregularly.** Depending on the tokenizer, `12345`
  might become `"123"` + `"45"`, while `12346` splits differently, so
  digit-by-digit arithmetic doesn't line up the way it does on paper.
  Models have become much better at arithmetic, but exact calculation
  over long numbers is still not their strength.
```
Proposed:
```
- **Numbers split into chunks that ignore place value.** The tokenizer
  above cuts digits into groups of up to three, counted from the left:
  `12345` becomes `"123"` + `"45"`, and `1234567` becomes `"123"` +
  `"456"` + `"7"`. Those groups don't match ones, tens and hundreds, so
  digit-by-digit arithmetic doesn't line up the way it does on paper.
  Other tokenizers split numbers differently again. Models have become
  much better at arithmetic, but exact calculation over long numbers is
  still not their strength.
```
(Verified with `gpt-tokenizer` o200k_base, the same encoding the box above uses. Not inside a demo string.)

**E4. `01-tokenization/03-tokens-in-practice-and-cost.mdx`** (re-label C7)
Current:
```
A rough rule of thumb for English text: about 4 characters, or roughly
0.75 words, per token — a useful approximation, not an exact rule, since
the real count always depends on the specific tokenizer and the
specific text.
```
Proposed:
```
A rough rule of thumb for English text, from
[OpenAI's guide to tokens](https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them):
about 4 characters, or roughly 0.75 words, per token. It's a useful
approximation, not an exact rule, since the real count always depends
on the specific tokenizer and the specific text.
```

**E5. `01-tokenization/03-tokens-in-practice-and-cost.mdx`** (add, optional, C11)
Current:
```
single clean token. This isn't a minor detail: it means, very
concretely, that the same conversation costs more, and eats into a
fixed context window faster, depending on what language it's conducted
in — a cost dimension worth carrying forward explicitly when this
module reaches pricing directly.
```
Proposed:
```
single clean token. This isn't a minor detail: it means, very
concretely, that the same conversation costs more, and eats into a
fixed context window faster, depending on what language it's conducted
in. A study of this effect,
[Petrov et al. (NeurIPS 2023)](https://arxiv.org/abs/2305.15425), found
the same text varying "up to 15 times" in token count across languages.
It's a cost dimension worth carrying forward explicitly when this
module reaches pricing directly.
```

**E6. `01-tokenization/04-non-text-inputs-as-tokens.mdx`** (fix C13)
Current:
```
Whatever tokens an image or document turns into count against the same
context window and the same per-token pricing as any text token would
— there's no separate, free allowance for non-text input. A single
image can easily cost several hundred to over a thousand tokens
depending on its resolution and the specific model — often far more
than a learner's first intuition would expect, given that "one image"
feels like it should be one small thing, not a few hundred tokens'
worth of context space and cost.
```
Proposed:
```
Whatever tokens an image or document turns into count against the same
context window and the same per-token pricing as any text token would
— there's no separate, free allowance for non-text input. A single
image can easily cost hundreds to thousands of tokens, depending on its
resolution and the specific model. Anthropic's
[vision docs](https://platform.claude.com/docs/en/build-with-claude/vision),
for example, count one token per 28×28-pixel patch: a 1000×1000 image
costs 1,296 tokens, and a large image on its newest models up to 4,784.
That's often far more than a learner's first intuition would expect,
given that "one image" feels like it should be one small thing, not
thousands of tokens' worth of context space and cost.
```

**E7. `01-tokenization/04-non-text-inputs-as-tokens.mdx`** (fix C13, quiz option; option-length pass may want to re-check)
Current:
```
        'A single image can cost several hundred to over a thousand tokens, which is often far more than "one image" intuitively feels like it should cost',
```
Proposed:
```
        'A single image can cost hundreds to thousands of tokens, which is often far more than "one image" intuitively feels like it should cost',
```

**E8. `01-tokenization/04-non-text-inputs-as-tokens.mdx`** (fix C13, quiz explanation)
Current:
```
        "\"One image\" feels like a single small thing, but it can actually decompose into several hundred to over a thousand tokens depending on resolution and model — a much bigger context/cost footprint than intuition suggests.",
```
Proposed:
```
        "\"One image\" feels like a single small thing, but it can actually decompose into hundreds to thousands of tokens depending on resolution and model — a much bigger context/cost footprint than intuition suggests.",
```

**E9. `02-embeddings/02-token-embeddings-internal-input-layer.mdx`** (fix C14; **inside a LiveDemo code string**, comment only, output unchanged)
Current:
```
# entry (tens of thousands) and hundreds of numbers per row, not 2
```
Proposed:
```
# entry (tens or hundreds of thousands) and hundreds of numbers per row, not 2
```

**E10. `02-embeddings/04-cosine-similarity.mdx`** (fix C15)
Current:
```
meaning. One thing to expect with real embedding models: "unrelated"
pairs rarely score near 0. They often land somewhere around 0.1–0.3 (the
exact baseline varies by model), and negative scores are rare. What
matters is the comparison: related pairs score clearly higher than
unrelated ones.
```
Proposed:
```
meaning. One thing to expect with real embedding models: where
"unrelated" lands depends on the model. The model in the tool below puts
unrelated sentences near 0, some slightly below it, but other models put
unrelated pairs noticeably higher. So don't read a score against 0. What
matters is the comparison: related pairs score clearly higher than
unrelated ones.
```
(Our data: `src/data/embedding-sentences.json`, all-MiniLM-L6-v2, 19 sentences: 57 of 171 pairs score below 0; median 0.037.)

**E11. `03-attention-and-transformer-architecture/03-positional-encoding.mdx`** (link, C16)
Current:
```
The original transformer, and early GPT models including GPT-2, solved
this with **positional encoding**: each *position* in the sequence —
```
Proposed:
```
[The original transformer](https://arxiv.org/abs/1706.03762) (Vaswani
et al., NeurIPS 2017), and early GPT models including GPT-2, solved
this with **positional encoding**: each *position* in the sequence —
```

**E12. `03-attention-and-transformer-architecture/03-positional-encoding.mdx`** (fix C17; **inside a LiveDemo code string**, comment only, output unchanged)
Current:
```
# a simplified stand-in for real positional encoding -- one distinct
# vector per position (real positional encodings are computed with a
# formula, not hand-set like this, but the shape of the idea is the same)
```
Proposed:
```
# a simplified stand-in for real positional encoding -- one distinct
# vector per position (the original transformer computes these with a
# formula and GPT-2 learns them in training; neither hand-sets them like
# this, but the shape of the idea is the same)
```

**E13. `03-attention-and-transformer-architecture/03-positional-encoding.mdx`** (fix C18 + link RoFormer)
Current:
```
Most current LLMs, open and closed, use a different design called
**rotary position embeddings**, or **RoPE**. Instead of adding a vector
to the input once, RoPE works *inside attention*, at every layer. Right
```
Proposed:
```
Most current open-weight LLMs, such as DeepSeek-V3 and OpenAI's gpt-oss,
use a different design called **rotary position embeddings**, or
**RoPE**, introduced in [RoFormer](https://arxiv.org/abs/2104.09864)
(Su et al.). Closed models don't publish their architecture, so from
outside no one can say for sure. Instead of adding a vector
to the input once, RoPE works *inside attention*, at every layer. Right
```
Other places: "most current models" / "most current LLMs" also at lines 130, 174 and in `06-recap-practice.mdx` lines 64, 67, 145. I'd leave those: "most current models" still reads as true of the published architectures, and quiz wording is a separate pass.

**E14. `03-attention-and-transformer-architecture/04-stacking-layers-into-a-transformer.mdx`** (add, optional, C21)
Current:
```
It's genuinely tempting to say something clean like "early layers
capture grammar, later layers capture meaning" — there's a real, broad
trend in that direction, observed across various interpretability
studies, but it's worth being honest that exactly what any given layer
```
Proposed:
```
It's genuinely tempting to say something clean like "early layers
capture grammar, later layers capture meaning" — there's a real, broad
trend in that direction, observed across various interpretability
studies (one well-known probe of BERT, an encoder model, found
[the steps of a classic language-processing pipeline appearing in order through its layers](https://aclanthology.org/P19-1452/)),
but it's worth being honest that exactly what any given layer
```

**E15. `03-attention-and-transformer-architecture/05-mixture-of-experts.mdx`** (link C22 + fix C23)
Current:
```
experts actually gets used — a small fraction, not all of them. For
example, Mixtral-style models use 2 out of 8 experts per token, and many
newer MoE models use around 8 out of 100 or more smaller ones.
```
Proposed:
```
experts actually gets used — a small fraction, not all of them. For
example, [Mixtral](https://arxiv.org/abs/2401.04088) uses 2 out of 8
experts per token, and many newer MoE models use more, smaller experts:
[DeepSeek-V3](https://arxiv.org/abs/2412.19437) activates 8 of its 256
per token, and OpenAI's [gpt-oss](https://arxiv.org/abs/2508.10925)
4 of 128.
```

**E16. `03-attention-and-transformer-architecture/05-mixture-of-experts.mdx`** (fix C23, quiz explanation)
Current:
```
        "The router makes a per-token decision, selecting a small subset of experts (commonly 2 of 8 or similar) to actually process that specific token.",
```
Proposed:
```
        "The router makes a per-token decision, selecting a small subset of experts (2 of 8 in Mixtral, 8 of 256 in DeepSeek-V3) to actually process that specific token.",
```

**E17. `04-how-llms-generate-text/01-logits-and-the-probability-distribution.mdx`** (fix C24)
Current:
```
**logit**, for *every single token in the entire vocabulary* — tens of
thousands of numbers, one per possible next token, each representing
```
Proposed:
```
**logit**, for *every single token in the entire vocabulary* — tens or
hundreds of thousands of numbers (about 50,000 for GPT-2, the model in
the demo below; about 200,000 for the tokenizer from the tokenization
lesson), one per possible next token, each representing
```

**E18. `04-how-llms-generate-text/01-logits-and-the-probability-distribution.mdx`** (fix C24, quiz explanation)
Current:
```
        "The final layer produces one raw logit per vocabulary entry — tens of thousands of numbers, not a single answer or a pre-trimmed shortlist.",
```
Proposed:
```
        "The final layer produces one raw logit per vocabulary entry — tens or hundreds of thousands of numbers, not a single answer or a pre-trimmed shortlist.",
```

**E19. `04-how-llms-generate-text/06-recap-practice.mdx`** (fix C24, same string as E18 in another file)
Current:
```
        "The final layer produces one raw logit per vocabulary entry — tens of thousands of numbers, not a single answer or a pre-trimmed shortlist.",
```
Proposed:
```
        "The final layer produces one raw logit per vocabulary entry — tens or hundreds of thousands of numbers, not a single answer or a pre-trimmed shortlist.",
```

**E20. `04-how-llms-generate-text/04-hallucination-as-a-direct-consequence.mdx`** (re-label + link, C27)
Current:
```
Research from OpenAI in 2025 ("Why Language Models Hallucinate", Kalai
et al.) makes the point with an exam analogy: on a multiple-choice test
that gives no credit for leaving a question blank, guessing always
scores better than admitting uncertainty. Most benchmarks used to train
and compare models grade the same way, right or wrong, with nothing for
"I'm not sure". So training that pushes those scores up also teaches
the model that a confident guess beats an honest "I don't know".
```
Proposed:
```
A 2025 paper by OpenAI researchers,
[*Why Language Models Hallucinate*](https://arxiv.org/abs/2509.04664)
(Kalai et al., a preprint), makes the point with an exam analogy: on a
multiple-choice test that gives no credit for leaving a question blank,
a guess can only help, so guessing beats admitting uncertainty on
average. The authors reviewed popular benchmarks and found that the vast
majority grade the same way, right or wrong, with nothing for "I'm not
sure". They argue that training that pushes those scores up also
teaches the model that a confident guess beats an honest "I don't know".
```
(Module 6 links the OpenAI blog version at `06-reliability/01-per-step-reliability/02-the-same-question-run-twice.mdx:353`; either link is fine, the arXiv one shows the method.)

**E21. `04-how-llms-generate-text/04-hallucination-as-a-direct-consequence.mdx`** (add industry anchor, C28)
Current:
```
hands. A system prompt that explicitly allows "I don't know" and says
when to use it, tools that let the model check a fact instead of
```
Proposed:
```
hands. A system prompt that explicitly allows "I don't know" and says
when to use it (the first technique in
[Anthropic's guide to reducing hallucinations](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations)),
tools that let the model check a fact instead of
```

**E22. `05-decoding-strategies-and-generation-controls/01-greedy-decoding-vs-sampling.mdx`** (add backing, C29)
Current:
```
"safest" option at every step tends to produce text that's noticeably
repetitive, bland, and predictable, sometimes even getting stuck
looping on the same phrase — never taking a genuinely
less-likely-but-still-reasonable path, because greedy decoding
structurally can't.
```
Proposed:
```
"safest" option at every step tends to produce text that's noticeably
repetitive, bland, and predictable, sometimes even getting stuck
looping on the same phrase. (The paper that introduced top-p sampling,
[Holtzman et al., ICLR 2020](https://arxiv.org/abs/1904.09751), found
that decoding which always maximizes probability gives text that is
"bland, incoherent, or gets stuck in repetitive loops".) Greedy decoding
never takes a genuinely less-likely-but-still-reasonable path, because
it structurally can't.
```

**E23. `05-decoding-strategies-and-generation-controls/03-top-p-and-top-k.mdx`** (link, C30)
Current:
```
Top-p works differently: instead of a fixed *count*, it keeps the
smallest set of tokens whose cumulative probability reaches at least
`p`:
```
Proposed:
```
Top-p, also called nucleus sampling after
[the paper that introduced it](https://arxiv.org/abs/1904.09751)
(Holtzman et al., ICLR 2020), works differently: instead of a fixed
*count*, it keeps the smallest set of tokens whose cumulative
probability reaches at least `p`:
```

**E24. `05-decoding-strategies-and-generation-controls/04-frequency-and-presence-penalty.mdx`** (optional links, C31-C32)
Current:
```
has already used. They're OpenAI-style request parameters
(`frequency_penalty`, `presence_penalty`) that some other providers also
offer; Anthropic's API doesn't have them. The mechanism is still worth
knowing, since it's how these controls work wherever they appear.
```
Proposed:
```
has already used. They're OpenAI-style request parameters
([`frequency_penalty`, `presence_penalty`](https://platform.openai.com/docs/api-reference/chat/create))
that some other providers also offer (Gemini's API has
[both](https://ai.google.dev/api/generate-content)); Anthropic's API
doesn't have them. The mechanism is still worth knowing, since it's how
these controls work wherever they appear.
```

**E25. `05-decoding-strategies-and-generation-controls/06-stop-sequences-and-nondeterminism.mdx`** (precision fix, C35)
Current:
```
together on the same hardware for efficiency. Exactly which other
requests happen to be batched alongside yours, at any given moment,
subtly changes the order floating-point operations actually execute
in — the same underlying phenomenon the toy example above illustrates,
```
Proposed:
```
together on the same hardware for efficiency. How many other requests
happen to be batched alongside yours, at any given moment, can change
the order floating-point operations actually execute in — the same
underlying phenomenon the toy example above illustrates,
```

**E26. `05-decoding-strategies-and-generation-controls/06-stop-sequences-and-nondeterminism.mdx`** (add backing, C35)
Current:
```
This is worth being direct about, since it's a genuinely common,
reasonable-sounding assumption that turns out to be wrong in practice:
```
Proposed:
```
Providers say so themselves. Anthropic's
[API reference](https://platform.claude.com/docs/en/api/messages/create)
notes that "even with `temperature` of `0.0`, the results will not be
fully deterministic." And a
[2025 investigation by Thinking Machines](https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference/)
traced the main cause to exactly this: a request's output can depend on
the size of the batch it runs in.

This is worth being direct about, since it's a genuinely common,
reasonable-sounding assumption that turns out to be wrong in practice:
```

**E27. `06-context-windows-and-kv-cache/01-what-a-context-window-is.mdx`** (link, C39)
Current:
```
memory, for a single request. Efficient attention implementations such
as FlashAttention cut attention's *own* working memory substantially,
but they don't change the quadratic compute above, and the KV cache
still grows with every token.
```
Proposed:
```
memory, for a single request. Efficient attention implementations such
as [FlashAttention](https://arxiv.org/abs/2205.14135) (Dao et al.,
NeurIPS 2022) cut attention's *own* working memory to linear in the
sequence length, but they don't change the quadratic compute above, and
the KV cache still grows with every token.
```

**E28. `06-context-windows-and-kv-cache/01-what-a-context-window-is.mdx`** (link, C40)
Current:
```
window. AI coding assistants such as Claude Code do exactly this — as a
long session approaches its context limit, the earlier conversation is
condensed into a summary and the work continues from that. It
```
Proposed:
```
window. AI coding assistants such as Claude Code do exactly this:
[its docs](https://code.claude.com/docs/en/costs) describe
"auto-compaction, which summarizes conversation history when approaching
context limits", and the work continues from that summary. It
```

**E29. `06-context-windows-and-kv-cache/02-max-output-length-vs-context-window.mdx`** (concrete example, C41)
Current:
```
(Providers differ on the edge case: some clamp the output like this
demo does, while others reject a request outright if input plus the
requested `max_tokens` can't fit — the same "exactly what happens past
the limit varies" caveat from the previous concept.)
```
Proposed:
```
(Providers differ on the edge case, and so can one provider's models.
[Anthropic's API](https://platform.claude.com/docs/en/build-with-claude/context-windows)
accepts such a request on its newer models and stops generation when
the window fills, but returns a validation error on older ones — the
same "exactly what happens past the limit varies" caveat from the
previous concept.)
```

**E30. `06-context-windows-and-kv-cache/04-prompt-structure-and-cache-hits.mdx`** (lead with industry source, C42-C43)
Current:
```
makes possible. Providers commonly offer meaningfully discounted pricing
on cache-hit tokens compared to freshly-computed ones, and reduced
latency alongside it — so prompt structure isn't a cosmetic preference,
```
Proposed:
```
makes possible. Providers give the same advice in their own docs.
[OpenAI's prompt caching guide](https://platform.openai.com/docs/guides/prompt-caching)
says to "place static content like instructions and examples at the
beginning of your prompt, and put variable content, such as
user-specific information, at the end", and
[Anthropic's](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
says the same. Both discount cache-hit tokens (Anthropic bills cache
reads at a tenth of the normal input price or less) and cut latency
alongside it, once the shared prefix passes a minimum length (1,024
tokens on OpenAI; 512 to 4,096 on Anthropic, depending on the model).
So prompt structure isn't a cosmetic preference,
```

**E31. `06-context-windows-and-kv-cache/05-uneven-use-of-long-contexts.mdx`** (link + venue/version, C44)
Current:
```
Below is real published data on exactly this, from the study that named
the effect (Liu et al., 2023). Each model was asked the same kind of
```
Proposed:
```
Below is real published data on exactly this, from the study that named
the effect: Liu et al.,
["Lost in the Middle"](https://aclanthology.org/2024.tacl-1.9/)
(TACL 2024; first posted in 2023, figures from its final arXiv
version). Each model was asked the same kind of
```
Component (optional): the caption in `src/components/lesson/PositionAccuracyChart.tsx` (~line 165 of the file, "Real published measurements, not an illustration: Liu et al. (2023)…") could add "TACL 2024; arXiv v3". All 28 values in `src/data/lost-in-the-middle.json` match v3 exactly; no data change needed.

**E32. `06-context-windows-and-kv-cache/05-uneven-use-of-long-contexts.mdx`** (attribute, C45)
Current:
```
in a haystack" test), and many score close to perfectly on it wherever
the needle sits. So the sharp U above overstates the problem for a plain
```
Proposed:
```
in a haystack" test); the Chroma report below calls their scores on it
"near-perfect". So the sharp U above overstates the problem for a plain
```

**E33. `06-context-windows-and-kv-cache/05-uneven-use-of-long-contexts.mdx`** (re-label C46 + fix C47)
Current:
```
What hasn't gone away is the broader effect: **more context tends to
mean worse use of it.** A 2025 study by Chroma, "Context Rot", tested 18
current models, including frontier models from several labs, on tasks
kept deliberately simple while only the input length changed.
Performance still fell as inputs grew, unevenly and in model-specific
ways, and fell further when the input held *distractors*: passages that
look relevant but aren't, like an old tool result about a similar agent,
or a superseded instruction. Tasks that need the model to connect
several pieces, rather than find one, degrade more.
```
Proposed:
```
What hasn't gone away is the broader effect: **more context tends to
mean worse use of it.** In July 2025, Chroma, a company that makes a
vector database, published a technical report,
["Context Rot"](https://research.trychroma.com/context-rot), that tested
18 current models, including frontier models from several labs, on tasks
kept deliberately simple while only the input length changed.
Performance still fell as inputs grew, unevenly and in model-specific
ways, and fell further when the input held *distractors*: passages that
look relevant but aren't, like an old tool result about a similar agent,
or a superseded instruction. Real tasks are harder than these, and the
authors expect the effect of length to be "even more pronounced in
practice".
```
Other places: Module 4 already describes this report with the same vendor label (`04-context-and-memory/02-context-that-fits-but-still-hurts/01-agents-get-worse-before-the-window-is-full.mdx:66-68`); the quiz explanation at line 183 of this file ("studies of current models still find performance falling as inputs grow, and distractors make it worse") stays accurate.

**E34. `06-context-windows-and-kv-cache/05-uneven-use-of-long-contexts.mdx`** (replace, C48; see Needs a decision)
Current:
```
It's worth being direct that there isn't one single, fully agreed-upon
mechanistic explanation for exactly why this pattern occurs — plausible
contributing factors researchers point to include how attention and
positional encoding interact over very long sequences, and the fact that
real training documents often genuinely do concentrate their most
important content near their own beginnings and endings (introductions
and conclusions), which the model may have picked up as a general
pattern. The empirical pattern itself is well-documented and consistent
across many studies; the precise causal story behind *why* it happens
```
Proposed:
```
It's worth being direct that there isn't one single, fully agreed-upon
mechanistic explanation for exactly why this pattern occurs. One
follow-up study,
[Found in the Middle](https://aclanthology.org/2024.findings-acl.890/)
(Hsieh et al., ACL Findings 2024), traced it to attention itself: models
give "higher attention" to tokens at the beginning and end of their
input "regardless of their relevance". Where that bias comes from is
less clear. The original study tested one training explanation, that
instruction-tuning data puts the task at the start, and found the model
showed the same U before instruction tuning too. The empirical pattern
itself is well-documented and consistent
across many studies; the precise causal story behind *why* it happens
```

**E35. `06-context-windows-and-kv-cache/05-uneven-use-of-long-contexts.mdx`** (follows E34, quiz explanation)
Current:
```
        "The measurements are solid; the why (attention/positional-encoding interactions, training-data structure) is still being worked out.",
```
Proposed:
```
        "The measurements are solid. One study traces the effect to attention favoring the start and end of the input, but where that bias comes from is still being worked out.",
```

**E36. `06-context-windows-and-kv-cache/06-recap-practice.mdx`** (follows E34, same string in another file)
Current:
```
        "The measurements are solid; the why (attention/positional-encoding interactions, training-data structure) is still being worked out.",
```
Proposed:
```
        "The measurements are solid. One study traces the effect to attention favoring the start and end of the input, but where that bias comes from is still being worked out.",
```

None of E1-E36 changes a demo's printed output. E9 and E12 touch comments inside LiveDemo `code` strings only; a quick load of each page to confirm the demo still runs is enough.

### 3. Needs a decision

1. **Unrelated-pair baseline for cosine similarity (E10, C15).** The page says negative scores are rare and unrelated pairs sit around 0.1–0.3, then embeds a tool where a third of the pairs are negative. The recommendation is to rewrite it (E10), which changes what learners are told to expect. I recommend doing it, since the page currently contradicts its own tool.
2. **Why lost-in-the-middle happens (E34-E36, C48).** Replace the unsourced "introductions and conclusions in training documents" hypothesis with the measured U-shaped attention bias (Hsieh et al.) plus Liu et al.'s own negative result on the instruction-tuning explanation. This changes one of the two stated causes and the two quiz explanations that name "training-data structure". I recommend doing it.
3. **Max output cap (not in the audit's edit list, C41 context).** The "Max output length vs. context window" concept teaches one shared budget, which is correct. But it never mentions that each model also has its own maximum output length, a separate cap below the window. Anthropic's docs: models with a 1M-token window "can generate up to 128k output tokens (`max_tokens`)". The demo's `min(remaining_budget, requested_max_output)` leaves this out. I recommend adding one prose sentence, e.g. "Models also have their own maximum output length, often far smaller than the window (up to 128k tokens on Anthropic's 1M-window models), so the real ceiling is the smallest of three numbers." Leave the demo as is. Changing it would need re-verifying in Pyodide.
4. **RoPE "open and closed" (E13, C18).** This one is only about sourcing, not a teaching change. It's listed here because the related quiz wording ("most current LLMs") is left alone.

### 4. Counts

- Claims inventoried: 49 (C1-C49), including 6 flagged UNSOURCED (C11, C21, C28, C29, C43, and the training-data half of C48).
- VERIFIED (fully, or verified with a nuance noted): 33 (C1, C2, C5-C10, C12, C16, C19, C20, C22, C23, C25-C27, C30-C42, C44, C46, C49); C48 is split (attention half verified, training-data half unsourced).
- PARTLY verified / out of date: 5 (C13, C14, C18, C24, C45).
- CONTRADICTED: 5. C3 (UTF-8 bytes), C4 (12346 split), C15 (embedding baseline, by our own data), C17 (GPT-2 positions "computed with a formula"), C47 (Chroma "connect several pieces", not in source).
- NOT REACHABLE: 0. openai.com was read via Wayback snapshots from Dec 2025.
- Re-labelled: 3 (C7 OpenAI rule of thumb, C27 Kalai preprint, C46 Chroma vendor technical report).
- Replaced / fixed text: 11 (C3, C4, C13, C14, C15, C17, C18, C23, C24, C47, C48).
- Links added for named sources: 11 (Sennrich, GPT-2, Vaswani, RoFormer, Mixtral, Holtzman ×2 uses, FlashAttention, Claude Code docs, Liu et al., Chroma).
- New sources added: 9. Required: Anthropic hallucination guide, OpenAI + Anthropic caching docs, Anthropic context-window doc, Anthropic + Thinking Machines on nondeterminism, Hsieh et al., DeepSeek-V3/gpt-oss. Optional: Petrov et al., Tenney et al., Gemini/OpenAI parameter references.

---

## Report: Module 1, Lessons 7-11: citation audit (light touch)

Scope: `src/content/modules/01-llm-foundations/07-the-training-pipeline` through `11-quantization-cost-and-operational-concerns` (every `.mdx`), plus the data-backed components `ScalingCurveChart`, `EmergenceMetricChart`, `InContextLearningDemo` (and `TrainingExampleCard`'s dataset labels). Primary sources downloaded to `audit/m1B/` (arXiv PDFs as `<id>.txt`, vendor docs as `.md`/`.html`). Docs checked as of 2026-09-30.

Paths below are relative to `src/content/modules/01-llm-foundations/`. No edit touches a `LiveDemo` code string, so none needs Pyodide re-verification.

### 1. Claims table

| ID | file:line | claim (trimmed) | source given | kind | verdict | evidence (primary source) | recommendation |
|---|---|---|---|---|---|---|---|
| C1 | 07/01-pretraining:70-97 | Real GPT-2 greedy continuation of "What is the capital of France?" repeats forever | our run | our data | OUR DATA, labelled (model, greedy, 40 tokens) | n/a | keep |
| C2 | 07/02-sft:61-70 | Real Qwen2.5-0.5B base answers and stops | our run | our data | OUR DATA, labelled | n/a | keep |
| C3 | 07/02-sft:76-84 | SFT teaches behavior, not primarily new facts | none | effectiveness | UNSOURCED -> VERIFIED anchor | LIMA (arXiv 2305.11206v1; NeurIPS 2023), abstract: "almost all knowledge in large language models is learned during pretraining, and only limited instruction tuning data is necessary to teach models to produce high quality output." 65B LLaMa, "only 1,000 carefully curated prompts and responses" | add stronger backing (E1) |
| C4 | 07/03:27-37 | RLHF = reward model then RL; RLAIF = AI judge; DPO skips the reward model | none (named techniques) | practice | UNSOURCED -> VERIFIED | InstructGPT (2203.02155v1) abstract: "collect a dataset of rankings of model outputs, which we use to further fine-tune this supervised model using reinforcement learning from human feedback"; Fig. 2 "Step 2: Collect comparison data, and train a reward model". Constitutional AI (2212.08073): "we use 'RL from AI Feedback' (RLAIF)". DPO (2305.18290v3, NeurIPS 2023): "without explicit reward modeling or reinforcement learning" | add links (E2) |
| C5 | 07/03:69-75 | Qwen2.5-0.5B-Instruct template uses im_start / im_end special tokens | our check | our data | OUR DATA (not re-run) | n/a | keep |
| C6 | 07/03:88-97 | Provider renders tool definitions into the token sequence near the system prompt | none | fact | UNSOURCED -> VERIFIED | Anthropic "Define tools" doc: "When you call the Claude API with the `tools` parameter, the API constructs a special system prompt from the tool definitions, tool configuration, and any user-specified system prompt." | add backing (E3) |
| C7 | 07/03:125-134 | People "on average" rate agreeable answers higher "even when the pushback is actually more accurate"; sycophancy a "well-documented side effect" (Sharma et al., 2023) | Sharma et al. 2023 (unlinked) | effectiveness | VERIFIED, slightly overstated | 2310.13548v4 (10 May 2025; ICLR 2024) abstract: "We find when a response matches a user's views, it is more likely to be preferred. Moreover, both humans and preference models (PMs) prefer convincingly-written sycophantic responses over correct ones a non-negligible fraction of the time ... likely driven in part by human preference judgments". Industry: OpenAI, "Sycophancy in GPT-4o" (29 Apr 2025): "we focused too much on short-term feedback ... GPT-4o skewed towards responses that were overly supportive but disingenuous." | re-label/soften + link + add industry case (E4) |
| C8 | 07/03:138-146 | Roles are learned, not a boundary; this is the root of prompt injection | none | practice | UNSOURCED -> VERIFIED | Wallace et al., "The Instruction Hierarchy" (OpenAI, 2404.13208v1, preprint): "one of the primary vulnerabilities underlying these attacks is that LLMs often consider system prompts (e.g., text from an application developer) to be the same priority as text from untrusted users and third parties." | add backing, labelled preprint (E5) |
| C9 | 07/04:12-22 | RL for reasoning trains extended reasoning, rewarded on correctness | none | practice | UNSOURCED -> VERIFIED | OpenAI "Learning to reason with LLMs" (12 Sep 2024, via Wayback): "Our large-scale reinforcement learning algorithm teaches the model how to think productively using its chain of thought" | lead with industry source (E6) |
| C10 | 07/04:34-44 | Math/code rewards can be checked automatically | none | practice | UNSOURCED -> VERIFIED | DeepSeek-R1 (2501.12948v2, 4 Jan 2026) §2: "Accuracy rewards evaluate whether the response is correct ... math problems with deterministic results ... enabling reliable rule-based verification"; code judged "against a suite of predefined test cases" | add backing (E7) |
| C11 | 07/04:54-70 | Reasoning behavior comes from "a specific, deliberate training stage, not an emergent accident"; stage "rewards generating extended reasoning" | none | practice | PARTLY: stage VERIFIED; length is not directly rewarded | DeepSeek-R1 abstract: RL "facilitates the emergent development of advanced reasoning patterns"; §2: "DeepSeek-R1-Zero exhibits a steady increase in thinking time throughout training, driven solely by intrinsic adaptation" (reward = accuracy + format only) | soften wording (E8); see Needs a decision D1 |
| C12 | 07/04:76-91 | Labs run RL on multi-step agentic tasks; agent benchmarks standard | none | practice | UNSOURCED -> VERIFIED (first half) | OpenAI "Introducing Codex" (16 May 2025): codex-1 "was trained using reinforcement learning on real-world coding tasks in a variety of environments" | add industry source (E9); benchmark sentence keep |
| C13 | 07/05:23-47 | Prompting first; RAG for missing/changing knowledge; fine-tuning for consistent behavior/style | none | practice | UNSOURCED -> VERIFIED | OpenAI "Optimizing LLM accuracy" guide: context optimization when "its knowledge is out of date, or ... requires knowledge of proprietary information"; LLM optimization when "the model is producing inconsistent results with incorrect formatting, 2) the tone or style of speech is not correct"; "The typical LLM task will start ... with prompt engineering" | lead with industry source (E10) |
| C14 | 07/05:57-80 | LoRA trains a small add-on; GPT-2 rank-8 adapter = 294,912 of 124,439,808 (~0.24%) | none for LoRA; our run for GPT-2 | fact / our data | VERIFIED; our figure recomputed | LoRA (2106.09685v2): "freezes the pre-trained model weights and injects trainable rank decomposition matrices ... can reduce the number of trainable parameters by 10,000 times". Recompute: 8 x (768+2304) x 12 layers = 294,912; 294,912/124,439,808 = 0.237% | add link (E11); keep figures |
| C15 | 08/01:13-20 | Loss falls as a power law "observed across many different model families and training runs" | none | effectiveness | VERIFIED power law; "many model families" overstated for Kaplan | Kaplan (2001.08361v1) abstract: "The loss scales as a power-law with model size, dataset size, and the amount of compute ... some trends spanning more than seven orders of magnitude. Other architectural details such as network width or depth have minimal effects". One Transformer family (plus LSTM comparison) | soften (E12) |
| C16 | 08/01:26-33 | Labs fit small runs and extrapolate to size a big run | none | practice | UNSOURCED -> VERIFIED | Llama 3 Herd (2407.21783) §3.2.1: "We develop scaling laws (Hoffmann et al., 2022; Kaplan et al., 2020) to determine the optimal model size for our flagship model given our pre-training compute budget." | add industry source (E13) |
| C17 | 08/01:35-38 | Kaplan et al. 2020 is "the paper that first laid this out" | Kaplan 2020 (unlinked) | fact | CONTRADICTED ("first") | Kaplan §7: "More recent work [HNA+17, HAD19] also investigated scaling between model size and data size; their work is perhaps the closest to ours" (HNA+17 = Hestness et al., "Deep learning scaling is predictable, empirically", 2017) | replace wording + link (E14) |
| C18 | ScalingCurveChart / scaling-laws.json | L(N)=(8.8e13/N)^0.076, L(D)=(5.4e13/D)^0.095, L(Cmin)=(3.1e8/Cmin)^0.050; 768 to 1.5B params; 22M to 23B tokens; ~8 orders of compute; "test loss" | Kaplan 2020 | fact | VERIFIED | Kaplan eqs 1.1-1.3 (lines 192-201) and Table 4; §2: "Model size (ranging in size from 768 to 1.5 billion non-embedding parameters)", "Dataset size (ranging from 22 million to 23 billion tokens)"; "These relations hold across eight orders of magnitude in Cmin" | keep |
| C19 | 08/01:42-46 | Chinchilla: more data than Kaplan implied, ~20 tokens/param, many models undertrained | Hoffmann et al. 2022 (unlinked) | effectiveness | VERIFIED | 2203.15556v1 abstract: "current large language models are significantly undertrained ... for every doubling of model size the number of training tokens should also be doubled"; Chinchilla "70B parameters" on "1.4 trillion tokens" (=20/param); Table 3: 1B -> 20.2B tokens | add link + show the 70B/1.4T basis (E15) |
| C20 | 08/01:46-49 | Labs now train small models well past compute-optimal to save serving cost | none | practice | UNSOURCED -> VERIFIED | Llama 3: "we also train our smaller models for much longer than is compute-optimal. The resulting models perform better than compute-optimal models at the same inference budget." | add industry source (E15) |
| C21 | 08/01:53-65 (+ quizzes) | Scaling laws describe "training loss", not every task | none | fact | VERIFIED in substance; Kaplan measures test loss (chart says "test loss") | Kaplan: "The test loss of a Transformer trained to autoregressively model language can be predicted using a power-law"; Llama 3: "Existing scaling laws typically predict only next-token prediction loss rather than specific benchmark performance." | re-label with one parenthetical + add backing (E16); quizzes can stay |
| C22 | 08/02:17-21 | Wei et al. 2022: near-chance then sharp jump, phase transition | Wei et al. 2022 (unlinked) | fact | VERIFIED | 2206.07682v2 (TMLR 08/2022): "performance is near-random until a certain critical threshold of scale is reached, after which performance increases to substantially above random. This qualitative change is also known as a phase transition" | add link (E17) |
| C23 | 08/02:27-43 | Schaeffer et al. 2023: suddenness from the metric; continuous metrics show smooth change | Schaeffer et al. 2023 (unlinked) | effectiveness | VERIFIED | 2304.15004v2 (NeurIPS 2023): "nonlinear or discontinuous metrics produce apparent emergent abilities, whereas linear or continuous metrics produce smooth, continuous, predictable changes in model performance" | add link + venue (E18) |
| C24 | EmergenceMetricChart + 08/02:45-56 | Toy model: exact match = per-digit accuracy^k; labelled illustration | our illustration | our data | VERIFIED as labelled; matches the paper's own toy model | Schaeffer §2: "Accuracy(N) ≈ p_N(single token correct)^num. of tokens" for "L-digit integer addition" | re-label to credit the model's origin (E19) |
| C25 | 08/02:64-68 | "Some researchers maintain there are real, qualitative capability jumps" | none | fact | UNSOURCED -> VERIFIED | Du et al., "Understanding Emergent Abilities of Language Models from the Loss Perspective" (2403.15796, NeurIPS 2024): "a model exhibits emergent abilities on certain tasks -- regardless of the continuity of metrics -- when its pre-training loss falls below a specific threshold" | add backing (E20) |
| C26 | 08/03:49-57 | In-context learning improves with scale | none | effectiveness | UNSOURCED -> VERIFIED | GPT-3 (2005.14165v4) Fig. 1.2: "Larger models make increasingly efficient use of in-context information." | add backing (E21) |
| C27 | InContextLearningDemo + 08/03:59-71 | Pythia 70M/160M/410M/1B: 0/40, 7/40, 40/40, 40/40 | our run | our data | OUR DATA, labelled ("Real runs for this course", family, fp32, greedy, 40 names, "not to measure it precisely") | icl-demo.json exact_match 0.0/0.175/1.0/1.0 | keep |
| C28 | 08/04:11-19 | Test-time compute improves answers | none | effectiveness | UNSOURCED -> VERIFIED | OpenAI o1 post: "the performance of o1 consistently improves with more reinforcement learning (train-time compute) and with more time spent thinking (test-time compute)" | add industry source (E22) |
| C29 | 08/04:52-56 | Reasoning tokens billed like output tokens; ~14x demo | none / our demo | fact | VERIFIED; 2150/150 = 14.33 | OpenAI reasoning guide: reasoning tokens "still occupy space in the model's context window and are billed as output tokens"; Anthropic thinking doc: "billed as output tokens, even when the thinking text isn't returned to you" | keep |
| C30 | 08/04:74-77 | Reasoning tokens count against max_tokens and the context window | none | fact | VERIFIED | Anthropic: thinking tokens "count toward `max_tokens` alongside the response text"; OpenAI: `max_output_tokens` limits "the total number of tokens the model generates, including reasoning tokens" | keep |
| C31 | 08/04:87-91 | Hybrid models: thinking budget or effort (low/medium/high) per request | none | fact | VERIFIED | Anthropic effort levels `low`...`max` (effort doc/skill); Haiku 4.5 still `budget_tokens`; OpenAI `reasoning.effort` | keep |
| C32 | 08/04:93-98 | Sampling several answers ("self-consistency", "best-of-N") often beats one | named, unlinked | effectiveness | VERIFIED | Wang et al. (2203.11171v4, ICLR 2023): "samples a diverse set of reasoning paths ... selects the most consistent answer", GSM8K +17.9% | add link (E23) |
| C33 | 09/01:88-120 | Anthropic: top-level `system`, `stop_sequences`, `max_tokens` required, `anthropic-version: 2023-06-01`; `claude-haiku-4-5` | none | fact | VERIFIED | API reference (`api/messages.md`) and current model table (`claude-haiku-4-5`, $1/$5) | keep |
| C34 | 09/01:122-128 | Some newest models removed `temperature`/`top_p`; sending them errors | none | fact | VERIFIED | API ref: "Models released after Claude Opus 4.6 do not support setting temperature. A value of 1.0 will be accepted for backwards compatibility, all other values will be rejected with a 400 error." | keep |
| C35 | 09/02:57-61 | OpenAI-style: `choices[0].message.content`, `prompt_tokens`/`completion_tokens` | none | fact | VERIFIED for Chat Completions only | OpenAI Responses API usage example: `"usage": {"input_tokens": 75, ... "output_tokens": 1186 ...}` | clarify (E24) |
| C36 | 09/02:79-86 | stop_reason covers natural end, stop sequence, max_tokens, tool call, refusal | none | fact | VERIFIED | stop-reasons doc table: `end_turn`, `max_tokens`, `stop_sequence`, `tool_use`, `pause_turn`, `refusal`, `model_context_window_exceeded` | keep |
| C37 | 09/03:13-22 | API stateless; Responses API `previous_response_id` still resends history | none | fact | VERIFIED | OpenAI conversation-state guide: "Even when using previous_response_id, all previous input tokens for responses in the chain are billed as input tokens in the API." | add backing (E25) |
| C38 | 09/03:65-69 | Resent history is cached at a discount | none | fact | VERIFIED | Anthropic prompt caching: automatic caching; "Cache read tokens are 0.1 times the base input tokens price" | keep |
| C39 | 09/04 | Typed content blocks; base64 image block shape; `iVBORw0KGgo`; 4/3 size; URL option | none | fact | VERIFIED | Anthropic vision doc: base64 and "A URL reference to an image hosted online" | keep |
| C40 | 09/05 | SSE; `content_block_delta`/`text_delta`; start event and final event with stop_reason + counts | none | fact | VERIFIED | Streaming doc: "`message_start`", "`content_block_delta`", "One or more `message_delta` events", "token counts ... in the `message_delta` event are *cumulative*" | keep |
| C41 | 09/06:63-78 | Claude never returns raw reasoning; summary or empty text; billed either way | none | fact | VERIFIED | Thinking doc: "what you see is never the raw chain of thought"; "`\"omitted\"` ... returns thinking blocks with an empty `thinking` field. Either way the block is billed the same"; "You're charged for the full thinking tokens" | keep |
| C42 | 09/06:82-105 | `signature` verifies the block; must go back unchanged with tool calls; edits can invalidate; retention varies by model | none | fact | VERIFIED | Thinking doc: "The API uses the signature to verify that thinking blocks were generated by Claude"; "Required: within a tool-use turn, pass thinking blocks back"; "you can't rearrange, edit, or partially drop them"; preserved-thinking 400s on edited history (new accounts from 2026-08-31) | keep |
| C43 | 10/02:11-20 | Constrained decoding masks invalid tokens to -inf / probability 0 | none | practice/fact | UNSOURCED -> VERIFIED | OpenAI "Introducing Structured Outputs in the API" (6 Aug 2024): "We then use this list of tokens to mask the next sampling step, which effectively lowers the probability of invalid tokens to 0." Anthropic structured-outputs doc: "Structured outputs guarantee schema-compliant responses through constrained decoding" | lead with industry source (E26) |
| C44 | 10/02:73-82 | Put the reasoning field first; order is generation order | none | practice | UNSOURCED -> VERIFIED, with an Anthropic caveat | OpenAI structured-outputs guide: "outputs will be produced in the same order as the ordering of keys in the schema." Anthropic: "properties in objects maintain their defined ordering from your schema, with one important caveat: required properties appear first, followed by optional properties" | add backing + caveat (E27) |
| C45 | 10/03:76-85 | `output_config.format`; OpenAI `response_format`; `additionalProperties: false` required; SDKs take Pydantic | none | fact | VERIFIED | Anthropic doc: "`required` and `additionalProperties` (must be set to `false` for objects)"; `client.messages.parse()` accepts a Pydantic model; OpenAI guide shows `response_format` | keep |
| C46 | 10/03:96-101 | Guarantee holds only for a response that finishes (`max_tokens`) | none | fact | VERIFIED, incomplete | Anthropic "Invalid outputs": max_tokens "may be incomplete and not match your schema"; also refusals: "The output may not match your schema because the refusal message takes precedence" (and enum casing) | add the refusal case (E28) |
| C47 | 10/04:60-69 | Anthropic `tool_use` block (`id`, `name`, `input` dict); OpenAI args as JSON string; `strict: true` opt-in | none | fact | VERIFIED | Tool-use overview: "Add `strict: true` to your custom tool definitions to ensure Claude's tool calls always match your schema exactly"; OpenAI fine-tuning example shows `"arguments":"{\"location\": ...}"` (string) | keep |
| C48 | 10/05:57-61 | `tool_use_id` pairs result to call; OpenAI `tool` role + `tool_call_id` | none | fact | VERIFIED (Anthropic); OpenAI part not re-fetched | Anthropic tool-use examples: `{type: "tool_result", tool_use_id: ...}` | keep |
| C49 | 11/01:20-32 | Models trained in BF16, FP32 kept for parts, FP8 increasingly; BF16 8/7 vs FP16 5/10 bits | none | fact | VERIFIED (training precision) | DeepSeek-V3 (2412.19437): "we introduce an FP8 mixed precision training framework"; "we store the master weights, weight gradients, and optimizer states in higher precision"; Llama 3 BF16 MFU. Bit layout is standard, not re-sourced | keep (optional link to DeepSeek-V3) |
| C50 | 11/01:43-62 | Quantization demo: 0.7255 (256 levels), 0.7333 (16 levels) | our demo | our data | VERIFIED by recompute | 1.7234891/(2/255)=219.7 -> 220 -> 0.7254902; 1.7234891/(2/15)=12.93 -> 13 -> 0.7333333 | keep |
| C51 | 11/01:66-76 | INT4 over INT8 "generally means a real quality cost" | none | effectiveness | OVERSTATED | Kurtic et al., "Give Me BF16 or Give Me Death" (2411.02355v4, 26 May 2026; ACL 2025): "INT4 weight-only (W4A16-INT) is more competitive than expected, rivaling 8-bit quantization"; "On average, 8-bit quantization achieves 99.75% recovery, while W4A16-INT reaches a competitive 99.36%"; "smaller models exhibit higher variance" | soften + add evidence (E29); D3 |
| C52 | 11/01:79-89 (+ quiz 01:138/144, recap 05:31/37) | "An API user ... never sees or chooses this directly" | none | fact | CONTRADICTED for open-weight hosts | OpenRouter provider-routing docs: "`quantizations` string[] - List of quantization levels to filter by (e.g. [\"int4\", \"int8\"])"; "Quantized models may exhibit degraded performance for certain prompts" | soften (E30-E34); D2 |
| C53 | 11/02:34-43 | Use the smallest tier that reliably handles the task | none | practice | UNSOURCED -> VERIFIED (one of two documented approaches) | Anthropic "Choosing the right model": "Option 1: Start efficiency-first ... Upgrade only if necessary for specific capability gaps"; also "Option 2: Start capability-first" | add industry source (E35) |
| C54 | 11/02:65-80 | MoE: per-token compute tracks active params; memory tracks total | none | fact | UNSOURCED -> VERIFIED | Mistral, "Mixtral of experts": "Mixtral has 46.7B total parameters but only uses 12.9B parameters per token. It, therefore, processes input and generates output at the same speed and for the same cost as a 12.9B model." Hugging Face "Mixture of Experts Explained": "all parameters need to be loaded in RAM, so memory requirements are high" | add industry source (E36) |
| C55 | 11/03:16-22 | Output priced higher than input; because input is parallel, output sequential | none | fact / explanation | VERIFIED (price); reason is the course's explanation | Anthropic pricing: Haiku 4.5 $1 in / $5 out | keep |
| C56 | 11/03:59-68, 116-121 | Demo multiples: ~10x (reasoning), 40 steps ~30x 5 steps | our demo | our data | VERIFIED by recompute | 0.03339/0.00339 = 9.85; 1.851/0.06075 = 30.47 | keep |
| C57 | 11/03:76-80 | An image adds "often several hundred" tokens | none | fact | CONTRADICTED (understated for current models) | Anthropic vision doc: 1000x1000 px = 1,296 tokens; 1920x1080 = 1,560 (standard) / 2,691 (high-res); 200x200 = 64. (Lesson 1.1 already says "several hundred to over a thousand".) | replace figure (E37) |
| C58 | 11/03:127-137 | Cache writes cost a premium, reads much less; conditional (breakpoint, minimum length, expires in minutes) | none | fact | VERIFIED | Anthropic: "5-minute cache write tokens are 1.25 times the base input tokens price"; "Cache read tokens are 0.1 times"; "By default, the cache has a 5-minute lifetime"; minimum cacheable prefix model-dependent | keep |
| C59 | 11/03:142-144 | Batch API: within hours, about half price | none | fact | VERIFIED | Anthropic batch doc: "most batches finishing in less than 1 hour while reducing costs by 50%"; expire after 24 hours | keep |
| C60 | 11/03:216-225 (quiz) | 10 -> 20 steps: input cost "grows by roughly four times" | none | our reasoning | APPROXIMATE | Demo's own numbers: input 3.32x at 10 -> 20 steps (tends to 4x as steps grow) | keep (optional: "more than triples"); quiz text, low priority |
| C61 | 11/04:11-31 | Provider limits in RPM/TPM; `429` | none | fact | VERIFIED | Anthropic rate limits: "measured in requests per minute (RPM), input tokens per minute (ITPM), and output tokens per minute (OTPM) ... you will get a 429 error" | keep |
| C62 | 11/04:35-44 | Exponential backoff is "the actual standard pattern" | none | practice | UNSOURCED -> VERIFIED | AWS Builders' Library, "Timeouts, retries, and backoff with jitter": "The preferred solution that we use in Amazon is a backoff ... The most common pattern is an exponential backoff" | add industry source (E38) |
| C63 | 11/04:66-70 | Add jitter; honor Retry-After | none | practice/fact | UNSOURCED -> VERIFIED | AWS: "Jitter adds some amount of randomness to the backoff to spread the retries around in time"; Anthropic: 429 "along with a `retry-after` header indicating how long to wait" | add backing (E38) |
| C64 | 11/05:139-144 | 4-bit is the norm locally; modest hit on large models, bigger on small; INT8 safer for small | none | practice | CONSISTENT with Kurtic (not linked) | See C51 | keep |
| C65 | TrainingExampleCard (07/01-04) | Real records: C4 row 0, dolly-15k row 1, HH-RLHF row 304, GSM8K row 0, with license | our selection | our data | OUR DATA, labelled (dataset/row/license on card) | architecture.md row "Real training examples" | keep |

Minor notes, no edit proposed:
- 11/04 quiz explanation "The limit covers a time window, so an instant retry lands in the same one": Anthropic uses a token bucket ("capacity is continuously replenished ... rather than being reset at fixed intervals"). Still true that an instant retry finds no capacity. Also, a spend-cap `429` has "no `retry-after` header" and retries fail until the next month, so not every 429 is transient. Worth a sentence if the lesson is revised later.
- 09/06: all thinking-block claims match current docs; nothing to change.

### 2. Proposed edits

**E1. `07-the-training-pipeline/02-sft.mdx`**
Current:
```
small and curated specifically for demonstrating that behavior, not for
teaching content.
```
Proposed:
```
small and curated specifically for demonstrating that behavior, not for
teaching content.

The best-known evidence is the LIMA study
([Zhou et al., NeurIPS 2023](https://arxiv.org/abs/2305.11206)). It
fine-tuned a 65-billion-parameter base model on just 1,000 carefully
chosen examples and got a capable assistant. The authors conclude that
"almost all knowledge in large language models is learned during
pretraining, and only limited instruction tuning data is necessary to
teach models to produce high quality output."
```

**E2. `07-the-training-pipeline/03-preference-training-and-message-roles.mdx`**
Current:
```
is genuinely better. **RLHF** uses this preference data to train a
separate reward model that learns to predict which responses would be
preferred, then further trains the main model — via reinforcement
learning — to produce responses that score well against it. **DPO**
(Direct Preference Optimization) is a more modern, more direct way of
using the same kind of preference data, without needing that separate
reward-model step — a simplification of the same underlying idea, not a
fundamentally different one.
```
Proposed:
```
is genuinely better. **RLHF** uses this preference data to train a
separate reward model that learns to predict which responses would be
preferred, then further trains the main model — via reinforcement
learning — to produce responses that score well against it. That's the
recipe OpenAI published for
[InstructGPT](https://arxiv.org/abs/2203.02155) (Ouyang et al., 2022),
and Anthropic's
[Constitutional AI](https://arxiv.org/abs/2212.08073) paper (Bai et al.,
2022) is where the AI-judge version got the name RLAIF. **DPO**
([Direct Preference Optimization](https://arxiv.org/abs/2305.18290),
Rafailov et al., NeurIPS 2023) is a more modern, more direct way of
using the same kind of preference data, without needing that separate
reward-model step — a simplification of the same underlying idea, not a
fundamentally different one.
```

**E3. `07-the-training-pipeline/03-preference-training-and-message-roles.mdx`**
Current:
```
those markers and hands them back to you as a structured tool-call
block, and the result you send back goes into the sequence under its
own role marker. (The exact format differs between models, and
providers don't always publish it.)
```
Proposed:
```
those markers and hands them back to you as a structured tool-call
block, and the result you send back goes into the sequence under its
own role marker. (The exact format differs between models, and
providers don't always publish it. Anthropic's docs do state the first
step: when a request includes `tools`, the API "constructs a special
system prompt from the tool definitions.")
```

**E4. `07-the-training-pipeline/03-preference-training-and-message-roles.mdx`**
Current:
```
One genuine consequence of training on human preference judgments:
people, on average, tend to rate agreeable, validating responses more
favorably than responses that push back or say something they don't
want to hear — even when the pushback is actually more accurate.
Training on this kind of preference data can inadvertently teach a
model to lean toward telling users what they want to hear, rather than
what's correct — not a deliberate design goal, but a real, well-documented
side effect of exactly how preference training data gets generated
(see, for example, Sharma et al., 2023, "Towards Understanding
Sycophancy in Language Models").
```
Proposed:
```
One genuine consequence of training on human preference judgments:
people tend to rate responses that agree with them more favorably, even
when pushback would be more accurate. Training on this kind of
preference data can inadvertently teach a model to lean toward telling
users what they want to hear, rather than what's correct — not a
deliberate design goal, but a documented side effect. Sharma et al.,
[*Towards Understanding Sycophancy in Language Models*](https://arxiv.org/abs/2310.13548)
(ICLR 2024), found that a response matching the user's views was more
likely to be preferred, and that people and preference models sometimes
preferred a convincing sycophantic answer over a correct one. They
conclude sycophancy is "likely driven in part by human preference
judgments." It shows up in real products too: in April 2025 OpenAI
[rolled back a GPT-4o update](https://openai.com/index/sycophancy-in-gpt-4o/)
that, in its words, "focused too much on short-term feedback" from
thumbs-up and thumbs-down ratings and "skewed towards responses that
were overly supportive but disingenuous."
```

**E5. `07-the-training-pipeline/03-preference-training-and-message-roles.mdx`**
Current:
```
model can't always reliably tell a genuinely trusted instruction apart
from untrusted text that merely *resembles* one — this is the actual
mechanistic root of prompt injection. Defenses come later:
```
Proposed:
```
model can't always reliably tell a genuinely trusted instruction apart
from untrusted text that merely *resembles* one — this is the actual
mechanistic root of prompt injection. OpenAI researchers name the same
cause in their
[instruction hierarchy](https://arxiv.org/abs/2404.13208) preprint
(Wallace et al., 2024): models "often consider system prompts (e.g.,
text from an application developer) to be the same priority as text
from untrusted users and third parties." Defenses come later:
```

**E6. `07-the-training-pipeline/04-rl-for-reasoning.mdx`**
Current:
```
before producing a final answer — with the reward signal here often
being something more objective than human preference: whether the
*final answer* is actually correct.
```
Proposed:
```
before producing a final answer — with the reward signal here often
being something more objective than human preference: whether the
*final answer* is actually correct. OpenAI introduced this publicly
with its o1 models in 2024:
["Our large-scale reinforcement learning algorithm teaches the model how to think productively using its chain of thought"](https://openai.com/index/learning-to-reason-with-llms/).
```

**E7. `07-the-training-pipeline/04-rl-for-reasoning.mdx`**
Current:
```
answers. This is a genuinely more scalable, automatable training signal
than human preference judgments, at least for the specific domains where
"correct" is unambiguous and checkable. Here is what one such training
```
Proposed:
```
answers. This is a genuinely more scalable, automatable training signal
than human preference judgments, at least for the specific domains where
"correct" is unambiguous and checkable. DeepSeek's
[R1 paper](https://arxiv.org/abs/2501.12948) spells out its version:
"Accuracy rewards evaluate whether the response is correct," checked by
rule for math answers and, for code, against "a suite of predefined test
cases." Here is what one such training
```

**E8. `07-the-training-pipeline/04-rl-for-reasoning.mdx`**
Current:
```
under **test-time compute** — this concept's job is only
establishing where that behavior actually comes from: a specific,
deliberate training stage, not an emergent accident.
```
Proposed:
```
under **test-time compute** — this concept's job is only
establishing where that behavior actually comes from: a specific,
deliberate training stage, not an accident. One nuance: the reward is
usually for a correct final answer, not for length. Longer reasoning
grows because it reaches correct answers more often; DeepSeek reports
its R1-Zero model showing "a steady increase in thinking time throughout
training."
```

**E9. `07-the-training-pipeline/04-rl-for-reasoning.mdx`**
Current:
```
the booking in a simulated system get made correctly? Labs increasingly
run reinforcement learning on exactly this kind of **multi-step agentic
task**. The model works inside an environment with real tools, calling
them over many turns, and is rewarded when the task is completed
correctly.
```
Proposed:
```
the booking in a simulated system get made correctly? Labs increasingly
run reinforcement learning on exactly this kind of **multi-step agentic
task**. The model works inside an environment with real tools, calling
them over many turns, and is rewarded when the task is completed
correctly. OpenAI, for example, says its codex-1 coding model
["was trained using reinforcement learning on real-world coding tasks in a variety of environments"](https://openai.com/index/introducing-codex/).
```

**E10. `07-the-training-pipeline/05-fine-tuning-as-a-builders-option.mdx`**
Current:
```
**Fine-tuning** fits a different case than either of the above:
consistently reproducing a specific style or format across a large
volume of uses, or reliably performing a narrow, specialized task
extremely well — cases where prompting alone tends to be inconsistent
or unreliable at scale, and where the actual issue isn't missing
knowledge (which RAG would fix) but insufficiently reliable *behavior*.
```
Proposed:
```
**Fine-tuning** fits a different case than either of the above:
consistently reproducing a specific style or format across a large
volume of uses, or reliably performing a narrow, specialized task
extremely well — cases where prompting alone tends to be inconsistent
or unreliable at scale, and where the actual issue isn't missing
knowledge (which RAG would fix) but insufficiently reliable *behavior*.

This is how OpenAI's
[accuracy guide](https://developers.openai.com/api/docs/guides/optimizing-llm-accuracy)
splits it too. It starts every task with prompt engineering, then adds
context (retrieval) when the model's knowledge is missing, "out of
date," or proprietary, and optimizes the model itself (fine-tuning) when
it is "producing inconsistent results with incorrect formatting" or "the
tone or style of speech is not correct."
```

**E11. `07-the-training-pipeline/05-fine-tuning-as-a-builders-option.mdx`**
Current:
```
**LoRA** (Low-Rank Adaptation) makes fine-tuning practical by training
only a small set of *additional* parameters — an add-on — while leaving
the vast majority of the original model's parameters completely
unchanged:
```
Proposed:
```
**LoRA** ([Low-Rank Adaptation](https://arxiv.org/abs/2106.09685), Hu
et al., 2021) makes fine-tuning practical by training
only a small set of *additional* parameters — an add-on — while leaving
the vast majority of the original model's parameters completely
unchanged. On GPT-3, the paper reports it cut the number of trainable
parameters "by 10,000 times." For a sense of the scale:
```

**E12. `08-scaling-laws-and-emergent-behavior/01-scaling-laws.mdx`**
Current:
```
— tends to decrease in a smooth, remarkably predictable way. Not
randomly, not chaotically: a fairly consistent, power-law-shaped
pattern, observed across many different model families and training
runs.
```
Proposed:
```
— tends to decrease in a smooth, remarkably predictable way. Not
randomly, not chaotically: a fairly consistent, power-law-shaped
pattern, first mapped across many training runs at one lab and since
found again by others.
```

**E13. `08-scaling-laws-and-emergent-behavior/01-scaling-laws.mdx`**
Current:
```
as a result. Labs actually use this — running smaller, cheaper training
runs at various scales, plotting the resulting relationship, and
extrapolating it to decide how large and how long to train a genuinely
expensive full-scale model, rather than guessing.
```
Proposed:
```
as a result. Labs actually use this — running smaller, cheaper training
runs at various scales, plotting the resulting relationship, and
extrapolating it to decide how large and how long to train a genuinely
expensive full-scale model, rather than guessing. Meta, for instance,
built scaling laws for Llama 3 "to determine the optimal model size for
our flagship model given our pre-training compute budget."
```

**E14. `08-scaling-laws-and-emergent-behavior/01-scaling-laws.mdx`**
Current:
```
Here are the published curves themselves, from the paper that first laid
this out (Kaplan et al., 2020, "Scaling Laws for Neural Language
Models"), on log-log axes — where a power law shows up as a straight
line, the visual signature of the smoothness this concept describes:
```
Proposed:
```
Here are the published curves themselves, from the paper that made them
famous ([Kaplan et al., 2020, "Scaling Laws for Neural Language
Models"](https://arxiv.org/abs/2001.08361), which builds on earlier
power-law findings it cites), on log-log axes — where a power law shows
up as a straight line, the visual signature of the smoothness this
concept describes:
```

**E15. `08-scaling-laws-and-emergent-behavior/01-scaling-laws.mdx`**
Current:
```
Those 2020 curves weren't the last word on how to *spend* a training
budget. Hoffmann et al. (2022, the "Chinchilla" paper) found that, for a
fixed amount of compute, models should be trained on far more data than
Kaplan's results implied — roughly 20 training tokens per parameter — and
that many large models of the time were undertrained. Current practice
goes further still: labs deliberately train smaller models on many more
tokens than that, well past the compute-optimal point, because a smaller
model is cheaper to serve on every request it answers afterward.
```
Proposed:
```
Those 2020 curves weren't the last word on how to *spend* a training
budget. Hoffmann et al.
([2022, the "Chinchilla" paper](https://arxiv.org/abs/2203.15556))
found that, for a fixed amount of compute, models should be trained on
far more data than Kaplan's results implied — roughly 20 training tokens
per parameter (Chinchilla itself: 70 billion parameters, 1.4 trillion
tokens) — and that many large models of the time were undertrained.
Current practice goes further still: labs deliberately train smaller
models on many more tokens than that, well past the compute-optimal
point, because a smaller model is cheaper to serve on every request it
answers afterward. Meta's
[Llama 3 paper](https://arxiv.org/abs/2407.21783) says so directly: "we
also train our smaller models for much longer than is compute-optimal.
The resulting models perform better than compute-optimal models at the
same inference budget."
```

**E16. `08-scaling-laws-and-emergent-behavior/01-scaling-laws.mdx`**
Current:
```
scaling laws, as covered here, primarily describe
**training loss** — a raw measure of how well the model predicts the next
token,
[directly tied to pretraining's exact objective](/01-llm-foundations/07-the-training-pipeline/01-pretraining/#what-actually-produces-the-parameters-behind-every-logit)
— not necessarily every specific downstream task's performance directly.
Loss improvements do generally correlate with better performance on real
tasks, but the smooth, predictable curve itself is about this one
underlying training metric, not a guarantee that every capability
improves in lockstep with it.
```
Proposed:
```
scaling laws, as covered here, primarily describe
**training loss** — a raw measure of how well the model predicts the next
token,
[directly tied to pretraining's exact objective](/01-llm-foundations/07-the-training-pipeline/01-pretraining/#what-actually-produces-the-parameters-behind-every-logit)
(Kaplan et al. measure it on held-out text, which is why the chart above
says "test loss") — not necessarily every specific downstream task's
performance directly. Loss improvements do generally correlate with
better performance on real tasks, but the smooth, predictable curve
itself is about this one underlying training metric, not a guarantee
that every capability improves in lockstep with it. Meta's Llama 3 team
makes the same point: "Existing scaling laws typically predict only
next-token prediction loss rather than specific benchmark performance."
```

**E17. `08-scaling-laws-and-emergent-behavior/02-emergent-behavior.mdx`**
Current:
```
something different happen? Some research (notably Wei et al., 2022,
"Emergent Abilities of Large Language Models") has reported **emergent
```
Proposed:
```
something different happen? Some research (notably Wei et al., 2022,
["Emergent Abilities of Large Language Models"](https://arxiv.org/abs/2206.07682),
TMLR) has reported **emergent
```

**E18. `08-scaling-laws-and-emergent-behavior/02-emergent-behavior.mdx`**
Current:
```
A well-known, credible counterargument (Schaeffer et al., 2023, "Are
Emergent Abilities of Large Language Models a Mirage?") holds that much
```
Proposed:
```
A well-known, credible counterargument (Schaeffer et al.,
["Are Emergent Abilities of Large Language Models a Mirage?"](https://arxiv.org/abs/2304.15004),
NeurIPS 2023) holds that much
```

**E19. `08-scaling-laws-and-emergent-behavior/02-emergent-behavior.mdx`**
Current:
```
the sharper the jump. (This chart is an illustration of the *mechanism*,
not measured data; the real measurements behind the argument are in the
Schaeffer et al. paper.)
```
Proposed:
```
the sharper the jump. (This chart is an illustration of the *mechanism*,
not measured data. It uses the same simple model Schaeffer et al. use to
state their argument: exact match equals per-token accuracy raised to
the answer's length. Their real measurements are in the paper.)
```

**E20. `08-scaling-laws-and-emergent-behavior/02-emergent-behavior.mdx`**
Current:
```
not a settled fact in either direction. Some researchers maintain there
are real, qualitative capability jumps that measurement artifacts don't
fully explain away; others argue the measurement-artifact explanation
accounts for most or all of the apparent suddenness observed so far.
```
Proposed:
```
not a settled fact in either direction. Some researchers maintain there
are real, qualitative capability jumps that measurement artifacts don't
fully explain away: Du et al.
([NeurIPS 2024](https://arxiv.org/abs/2403.15796)) report abilities that
appear once pretraining loss falls below a threshold "regardless of the
continuity of metrics." Others argue the measurement-artifact explanation
accounts for most or all of the apparent suddenness observed so far.
```

**E21. `08-scaling-laws-and-emergent-behavior/03-in-context-learning.mdx`**
Current:
```
This ability itself grows meaningfully with scale: larger models tend to
be substantially better at picking up a new task from just a few
in-context examples than smaller models are, given the exact same
examples and the exact same new input to apply the pattern to. This is
```
Proposed:
```
This ability itself grows meaningfully with scale: larger models tend to
be substantially better at picking up a new task from just a few
in-context examples than smaller models are, given the exact same
examples and the exact same new input to apply the pattern to. The
GPT-3 paper ([Brown et al., 2020](https://arxiv.org/abs/2005.14165))
put it in one line: "Larger models make increasingly efficient use of
in-context information." This is
```

**E22. `08-scaling-laws-and-emergent-behavior/04-test-time-compute.mdx`**
Current:
```
all, but by letting a model spend *more compute at the moment of
actually answering a specific question* — generating more tokens of
reasoning before producing its final answer.
```
Proposed:
```
all, but by letting a model spend *more compute at the moment of
actually answering a specific question* — generating more tokens of
reasoning before producing its final answer. OpenAI reported exactly
this with its o1 models: performance
["consistently improves with more reinforcement learning (train-time compute) and with more time spent thinking (test-time compute)"](https://openai.com/index/learning-to-reason-with-llms/).
```

**E23. `08-scaling-laws-and-emergent-behavior/04-test-time-compute.mdx`**
Current:
```
and often beats a single attempt; it's the idea behind "self-consistency"
and "best-of-N". And **an agent loop is test-time compute too**: every
```
Proposed:
```
and often beats a single attempt; it's the idea behind "self-consistency"
([Wang et al., ICLR 2023](https://arxiv.org/abs/2203.11171)) and
"best-of-N". And **an agent loop is test-time compute too**: every
```

**E24. `09-calling-llm-apis-and-processing-responses/02-the-response-shape.mdx`**
Current:
```
Field names differ a little between providers — for instance,
OpenAI-style responses put the text under `choices[0].message.content`
and report `usage.prompt_tokens` / `usage.completion_tokens` — but the
same three things are always there: the generated content, a token
count, and a reason generation stopped.
```
Proposed:
```
Field names differ a little between providers — for instance, OpenAI's
Chat Completions API puts the text under `choices[0].message.content`
and reports `usage.prompt_tokens` / `usage.completion_tokens` (its newer
Responses API reports `input_tokens` / `output_tokens`, like Anthropic's)
— but the same three things are always there: the generated content, a
token count, and a reason generation stopped.
```

**E25. `09-calling-llm-apis-and-processing-responses/03-multi-turn-conversations.mdx`**
Current:
```
whatever's newly being said. (That's true of the Messages and Chat
Completions-style APIs this course uses. Some APIs, such as OpenAI's
Responses API with a previous-response ID, can keep the conversation on
the server for you, but the model itself is still stateless: the
provider is just resending the history on your behalf.)
```
Proposed:
```
whatever's newly being said. (That's true of the Messages and Chat
Completions-style APIs this course uses. Some APIs, such as OpenAI's
Responses API with a previous-response ID, can keep the conversation on
the server for you, but the model itself is still stateless: the
provider is just resending the history on your behalf. OpenAI's docs
say so: "Even when using `previous_response_id`, all previous input
tokens for responses in the chain are billed as input tokens.")
```

**E26. `10-structured-output-and-tool-calling/02-constrained-decoding.mdx`**
Current:
```
not by asking nicely in the prompt. At every single generation step,
before softmax runs, any token that would violate the required schema —
producing invalid JSON syntax, or a value of the wrong type for the
current field — gets its logit set to effectively negative infinity.
```
Proposed:
```
not by asking nicely in the prompt. At every single generation step,
before softmax runs, any token that would violate the required schema —
producing invalid JSON syntax, or a value of the wrong type for the
current field — gets its logit set to effectively negative infinity.
This is how the major APIs do it. OpenAI describes using the schema to
"mask the next sampling step, which effectively lowers the probability
of invalid tokens to 0," and Anthropic's docs say its structured outputs
"guarantee schema-compliant responses through constrained decoding."
```

**E27. `10-structured-output-and-tool-calling/02-constrained-decoding.mdx`**
Current:
```
can only justify a choice already made. Two common fixes: put a
reasoning field *first* (`{"reason": ..., "verdict": ...}`), so the
answer is generated after the thinking that should lead to it, or let
a reasoning model think before its structured output, where its
thinking isn't constrained at all.
```
Proposed:
```
can only justify a choice already made. Two common fixes: put a
reasoning field *first* (`{"reason": ..., "verdict": ...}`), so the
answer is generated after the thinking that should lead to it, or let
a reasoning model think before its structured output, where its
thinking isn't constrained at all. OpenAI's docs confirm the order
holds: outputs "will be produced in the same order as the ordering of
keys in the schema." One catch on Anthropic's API: required fields are
generated before optional ones, so make the reasoning field required
too, or it can land after the verdict.
```

**E28. `10-structured-output-and-tool-calling/03-from-a-pydantic-model-to-a-schema.mdx`**
Current:
```
the JSON can end mid-object and fail to parse, so a careful client still
checks `stop_reason` before trusting the result.
```
Proposed:
```
the JSON can end mid-object and fail to parse, so a careful client still
checks `stop_reason` before trusting the result. Anthropic's docs list
one more exception: a safety refusal (`stop_reason: "refusal"`), whose
text "may not match your schema."
```

**E29. `11-quantization-cost-and-operational-concerns/01-quantization.mdx`**
Current:
```
Moving from FP16 → INT8 → INT4 progressively shrinks a model's memory
footprint and can meaningfully speed up inference — genuinely useful for
running a model on limited hardware. It also progressively increases the
risk of degraded output quality, since the model's actually-learned
weights are being approximated with less and less precision than what
they were trained with. This is a real tradeoff, not a free efficiency
gain: more aggressive quantization (INT4 over INT8) generally means a
real quality cost, in exchange for a real efficiency gain.
```
Proposed:
```
Moving from FP16 → INT8 → INT4 progressively shrinks a model's memory
footprint and can meaningfully speed up inference — genuinely useful for
running a model on limited hardware. It also progressively increases the
risk of degraded output quality, since the model's actually-learned
weights are being approximated with less and less precision than what
they were trained with. How much quality you lose depends on the method
and the model. A large study across the Llama 3.1 family
([Kurtic et al., ACL 2025](https://arxiv.org/abs/2411.02355)) found that,
on its academic benchmarks, 8-bit versions kept 99.75% of full-precision
accuracy on average and well-tuned 4-bit weights kept 99.36%, with more
variation on smaller models and harder tasks. So it's a real tradeoff,
not a free efficiency gain, but a good 4-bit model is often close to the
original. Measure it on your own task before relying on it.
```

**E30. `11-quantization-cost-and-operational-concerns/01-quantization.mdx`**
Current:
```
Worth stating plainly: quantization is a decision made by whoever is
actually *running* a model — self-hosting it on their own or rented
hardware, choosing how to trade off memory and speed against quality. An
API user calling a provider's endpoint never sees or chooses this
directly — the provider has already made that decision on their end,
whatever it is, before the API is ever exposed. This distinction matters
for knowing which parts of this concept apply to you: if you're only ever
calling an API, quantization isn't a setting you'll ever touch; if you're
deploying a model yourself, it's a genuinely central decision.
```
Proposed:
```
Worth stating plainly: quantization is a decision made by whoever is
actually *running* a model — self-hosting it on their own or rented
hardware, choosing how to trade off memory and speed against quality. A
closed model's API never shows it: the provider has already made that
decision before the API is exposed. Open-weight models are the
exception worth knowing. The same model can be served by several hosts
at different precisions, and some routers expose it: OpenRouter, for
instance, lets a request filter providers by quantization level (such as
`int4` or `int8`). So if you're calling a closed model's API,
quantization isn't a setting you'll touch; if you're deploying a model
yourself, or picking a host for an open-weight one, it's a real
decision.
```

**E31. `11-quantization-cost-and-operational-concerns/01-quantization.mdx`**
Current:
```
        "Whoever is actually running/self-hosting a model makes this decision; an API user calling a provider's endpoint never sees or chooses it directly",
```
Proposed:
```
        "Whoever is actually running/self-hosting a model makes this decision; a closed model's API caller never sees or chooses it",
```

**E32. `11-quantization-cost-and-operational-concerns/01-quantization.mdx`**
Current:
```
        "It's a deployment-side choice. A provider has already made it before exposing an endpoint, so an API caller has no setting to change.",
```
Proposed:
```
        "It's a deployment-side choice. A closed model's provider has already made it before exposing an endpoint, so the caller has no setting to change. Hosts of open-weight models sometimes list it.",
```

**E33. `11-quantization-cost-and-operational-concerns/05-recap-practice.mdx`**
Current:
```
        "Whoever is running/self-hosting a model; an API user calling a provider's endpoint never sees or chooses it directly",
```
Proposed:
```
        "Whoever is running/self-hosting a model; a closed model's API caller never sees or chooses it",
```

**E34. `11-quantization-cost-and-operational-concerns/05-recap-practice.mdx`**
Current:
```
        "It's a deployment-side choice. A provider has already made it before exposing an endpoint.",
```
Proposed:
```
        "It's a deployment-side choice. A closed model's provider has already made it before exposing an endpoint; hosts of open-weight models sometimes list it.",
```

**E35. `11-quantization-cost-and-operational-concerns/02-the-model-landscape-and-selection.mdx`**
Current:
```
Most providers offer several sizes of the same model family — smaller,
faster, cheaper versus larger, slower, more capable. The practical
selection principle: use the smallest, cheapest tier that reliably
handles a given task, reserving larger, more expensive tiers for
genuinely harder cases —
[the same reasoning from Lesson 8's model-routing decision](/01-llm-foundations/08-scaling-laws-and-emergent-behavior/04-test-time-compute/#the-practical-tradeoffs-as-a-real-design-decision),
```
Proposed:
```
Most providers offer several sizes of the same model family — smaller,
faster, cheaper versus larger, slower, more capable. The practical
selection principle: use the smallest, cheapest tier that reliably
handles a given task, reserving larger, more expensive tiers for
genuinely harder cases. Anthropic's model guide calls this starting
"efficiency-first": begin with a small model, test it, and "upgrade only
if necessary for specific capability gaps." (It also describes the
reverse: start with the most capable model and move down once the task
works.) It's
[the same reasoning from Lesson 8's model-routing decision](/01-llm-foundations/08-scaling-laws-and-emergent-behavior/04-test-time-compute/#the-practical-tradeoffs-as-a-real-design-decision),
```

**E36. `11-quantization-cost-and-operational-concerns/02-the-model-landscape-and-selection.mdx`**
Current:
```
That saving is in compute per token, not in memory: every expert still
has to be loaded, so the hardware needed to serve an MoE model scales
with its *total* parameter count. For deployment choices that matters most: an
MoE model computes like a small model but needs the memory of a large one.
```
Proposed:
```
That saving is in compute per token, not in memory: every expert still
has to be loaded, so the hardware needed to serve an MoE model scales
with its *total* parameter count. Mistral's Mixtral 8x7B is the standard
example: it "has 46.7B total parameters but only uses 12.9B parameters
per token," so it runs "at the same speed and for the same cost as a
12.9B model," yet, as Hugging Face's
[MoE explainer](https://huggingface.co/blog/moe) notes, "all parameters
need to be loaded in RAM." For deployment choices that matters most: an
MoE model computes like a small model but needs the memory of a large one.
```

**E37. `11-quantization-cost-and-operational-concerns/03-token-based-pricing.mdx`**
Current:
```
— an image attached to that support request adds real tokens to
`input_tokens`, often several hundred, before a single word of the actual
question is even considered.
```
Proposed:
```
— an image attached to that support request adds real tokens to
`input_tokens`, often a thousand or more (on Anthropic's API a
1000×1000-pixel image costs about 1,300), before a single word of the
actual question is even considered.
```

**E38. `11-quantization-cost-and-operational-concerns/04-provider-side-rate-limits.mdx`**
Current:
```
Two refinements real implementations commonly add on top of this bare
shape: a small random **jitter** on each wait (so many clients that were
rate-limited at the same moment don't all retry at the same instant), and
honoring the `Retry-After` header when the provider sends one, since it
states directly how long to wait.
```
Proposed:
```
Two refinements real implementations commonly add on top of this bare
shape: a small random **jitter** on each wait (so many clients that were
rate-limited at the same moment don't all retry at the same instant), and
honoring the `Retry-After` header when the provider sends one, since it
states directly how long to wait. Both are standard guidance. AWS's
[Builders' Library](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/)
calls backoff "the preferred solution that we use in Amazon" and adds
jitter "to spread the retries around in time," and Anthropic's API
answers a rate-limited request with a `429` "along with a `retry-after`
header indicating how long to wait."
```

Other places the same figures appear (grepped `src/content/modules`): "several hundred" image tokens also appears in `01-tokenization/04-non-text-inputs-as-tokens.mdx` lines 46, 88, 94 as "several hundred to over a thousand", which is already accurate, so no change there. The quantization "never sees or chooses" wording appears only in the four places covered by E30-E34. Kaplan, Chinchilla, Wei and Schaeffer are named only in `08/01` and `08/02`. Sharma et al. is also cited in Module 6 (`06-reliability/06-when-unsure/04-when-the-user-pushes-back.mdx`), with the same arXiv link and "(ICLR 2024)" that E4 uses, so the two stay consistent.

External-link note: `openai.com` returns 403 to scripts but is the canonical URL; its three posts (o1, Codex, GPT-4o sycophancy) were read via the Wayback Machine. The other URLs were fetched directly.

### 3. Needs a decision

**D1. Where reasoning-model behavior "comes from" (`07/04-rl-for-reasoning.mdx`, and quiz answers in `07/04`, `08/04`, `08/05`).** The lesson says RL for reasoning "rewards generating extended reasoning" and ends with "a specific, deliberate training stage, not an emergent accident." The best public account, DeepSeek-R1, rewards only a correct answer (plus format), and describes the long reasoning as emerging: "the emergent development of advanced reasoning patterns" and "a steady increase in thinking time throughout training, driven solely by intrinsic adaptation." So the stage is deliberate, but the length isn't what it rewards directly. Also, "emergent" is a loaded word here, because the next lesson uses it as a technical term. **Recommendation:** keep the concept. Apply E8, which drops "emergent" and adds the nuance. Leave the quiz answers as they are ("rewards generating extended reasoning leading to correct final answers" is still a fair summary). An optional small fix would change "rewards generating extended reasoning" to "rewards reasoning that reaches correct final answers" in those quiz answers.

**D2. "An API user never sees or chooses quantization" (`11/01-quantization.mdx` prose + quiz, `11/05-recap-practice.mdx` quiz).** This is contradicted for open-weight models. Hosts serve the same model at different precisions, and OpenRouter exposes a `quantizations` filter (e.g. `["int4", "int8"]`). The claim holds for closed-model APIs. **Recommendation:** narrow the claim to closed models and mention the open-weight exception (E30-E34). This changes a quiz answer's wording, not which option is correct.

**D3. How much INT4 costs in quality (`11/01-quantization.mdx` "The real tradeoff").** The lesson says INT4 over INT8 "generally means a real quality cost." The largest recent study (Kurtic et al., ACL 2025, Llama 3.1 family) found well-tuned 4-bit weight-only quantization "rivaling 8-bit" (99.36% vs 99.75% average recovery on academic benchmarks), with more variance on small models. The course's own recap (`11/05`, lines 141-144) already says "4-bit ... with a modest quality hit on large models and a bigger one on small models." **Recommendation:** apply E29 so the concept agrees with the recap and the evidence. The tradeoff stays; it's just smaller for good 4-bit methods than the concept currently says. The quiz answer ("at the cost of some genuine risk to output quality") can stay.

### 4. Counts

- Claims inventoried: 65 (including 5 "our data" items and 2 recomputed demo figures).
- **Verified:** 51, of which 22 had no source and now have a verified anchor. Also 5 our-data items were checked for labelling, and all are labelled.
- **Partly verified / overstated:** 4 (C7 sycophancy strength, C11 "not an emergent accident", C15 "many model families", C51 INT4 quality cost).
- **Contradicted:** 3 (C17 Kaplan "first laid this out", C52 API users never see quantization, C57 image tokens "often several hundred").
- **Not reachable:** 0 (the openai.com pages were read via Wayback).
- **Re-labelled:** 4 (C7, C15, C21 held-out vs training loss, C24 toy model credited to Schaeffer et al.).
- **Replaced/corrected wording:** 4 (C17, C51, C52, C57).
- **Links added to already-named papers:** 7 (Sharma, LoRA, Kaplan, Chinchilla, Wei, Schaeffer, self-consistency).
- **New sources added:** 26 citations across E1-E38. Industry: OpenAI x8 (o1, Codex, sycophancy post, accuracy guide, structured-outputs blog, structured-outputs guide, conversation-state guide, instruction-hierarchy preprint), Anthropic docs x5, Meta Llama 3 x3, Mistral, Hugging Face, AWS Builders' Library, OpenRouter. Research: LIMA, InstructGPT, Constitutional AI, DPO, DeepSeek-R1, GPT-3, Du et al., Kurtic et al.
- **Proposed edits:** 38 (E1-E38). None touches a LiveDemo/Pyodide string.
