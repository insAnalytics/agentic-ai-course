# Citation audit: Module 4 (Context & Memory)

Audited 2026-09-30, on branch `citation-audit/module-4`. Four read-only
subagents did the inventory, verification and recommendations. Their full
reports follow. The lead applied the edits and re-read the primary source
for every new quote, figure or vendor behaviour before it went on a page.

Every edited text is prose, a quiz question, option or explanation. No
demo, exercise, starter, reference or test string changed, so nothing needed
re-running in Pyodide. `npm run build` passes (523 pages). The three new
internal links were checked against the built HTML:
`#what-the-evidence-says-about-summarizing`,
`#you-don-t-always-build-this-yourself`, and the just-in-time lesson's
recap page, which holds the "26 times smaller" and "about 21%" figures.

## What happened to each proposed edit

| Report | Applied | Held for a decision | Skipped (optional) |
|---|---|---|---|
| A: L1–L4 | E1–E18, plus E4's quiz option, E6, E8 and E15 by hand (E17 says "Haiku models through Claude Haiku 4.5" and "Claude's newest models", as the docs do) | E19 and its extra bullet (re-anchoring and preserved thinking) | the optional link in E10, the line-327 quiz wording (changed in the consistency pass below instead), and the optional intro change in E13 |
| B: L5–L7 | E1–E22 (E11 leads with on-demand compaction; see below) | none | the optional additions listed at the end of the report |
| C: L8–L11 | E1–E4, E6–E8, E10–E17 (E7's first part), E20 | none | E5, E9, E18, E19, E7's optional OWASP line, E4's optional line |
| D: L12 | E1–E10 | none | E11–E14 |

**Consistency pass.** Once Lesson 2 said look-alike content "makes it
worse", not "hurts most" (Chroma calls the decline "non-uniform", not
gradual), three other pages that said models "handle it worst" or that it
"hurts most" were softened to match (L2 C2 quiz, L2 C4, L8 C1).

## Totals across the module

- **Verified:** 119.
- **Contradicted:** 5, plus 1 claim not in its source and 1 link to the
  wrong page.
  - Token counting is "exact" (Anthropic calls its count an estimate).
  - The cache minimum is "around a thousand tokens" (now 512 to 4,096,
    depending on provider and model).
  - Summarizing agents ran 13–15% longer (true for two of the five models).
  - Provider compaction always keeps thinking valid (not Claude's threshold
    mode).
  - The Lesson 12 break-even point moved from about 20 checks (actually
    about 25 to about 35).
  - Chroma found accuracy "falls gradually" (it says non-uniform and
    surprising).
  - Lesson 12's "26 times" linked to a page without the figure.
- **Not reachable:** 0 (a Letta link had moved; replaced).
- **Re-labelled:** 11 (Chroma as a vendor's technical report, preprints,
  venues including Xiong et al. at ACL 2026 and CoALA at TMLR 2024, the
  memory tool's status, Manus's reported experience).
- **Replaced or updated:** 8 (API facts that had changed, moved links).
- **Sources added:** about 35.
  - Vendor and framework docs: Anthropic's compaction, caching,
    token-counting, preserved-thinking, memory-tool and tool-search docs;
    OpenAI's compaction, tool search and `truncation: "auto"`; Ollama;
    Gemini thought signatures; LangGraph and LangMem; Letta; Claude Code's
    memory limits; Google ADK; OpenTelemetry's GenAI conventions.
  - Practitioner and industry writing: Factory's compression evaluation;
    Cursor's dynamic context discovery; Manus; OWASP's agentic Top 10; the
    Claude and ChatGPT memory help pages; GDPR Art. 17.
  - Papers: Zep and MemGPT.

## Needs a decision (approved by the owner and applied, 2026-09-30)

*Applied:* report A's E19 and its extra bullet (L4 C4); L3 C3 now says
"on a plain prefix cache it's the best available one", with a pointer to
L4 C4; L3 C2's "where it breaks nothing" is now "where it doesn't break the
cache"; L2 C4 notes Claude's turn-scoped system message (a beta). No code
changed. The lead re-checked both docs: the preserved-thinking table lists
"Add a text block to an earlier user turn, or remove one you added last
time" as Invalid, and turn-scoped system messages need the
`mid-conversation-system-clear-at-2026-08-21` beta header.

1. **Re-anchoring and preserved thinking (L2 C4, L3, L4 C4; the pattern
   recurs in L5–L9, L12 and Module 6 L1 C5).** The course adds the plan (and,
   in L3's recap, the time) to the sent copy of the last user message and
   leaves it off the next request, and L3 calls this "nearly free, the best
   available one". Anthropic's preserved-thinking docs list exactly this
   pattern as an edit that invalidates later thinking blocks. On Claude
   Fable 5.1, Opus 5.5 and Sonnet 5.5, accounts created on or after
   2026-08-31 get a 400 by default. Anthropic's replacement is a
   turn-scoped system message (`clear_at: "next_user_message"`, a beta).
   Recommendation: keep the technique (Manus backs it, and Anthropic ships
   its own form). Qualify "best available" to a plain prefix cache, and
   list re-anchoring among the edits that break kept reasoning in L4 C4,
   pointing to the provider's own form (report A, E19). No code changes.

**Applied, but worth a look.** L5 C4's "Letting the provider compact" now
opens with Claude's on-demand compaction, which its docs now recommend
"wherever it is available", and OpenAI's `compact_threshold`, before the
threshold-mode details it already had. All the existing detail is kept.

## Checked and left as is

- Report B asked whether Lesson 12's "fold the summaries" contradicts
  Lesson 5's advice to append rather than fold. The lead checked: Lesson 12
  folds only when the summaries pass a set share of the budget
  (`fold_share`), which is the "deliberate step of its own" Lesson 5
  allows. No change.

## Still to check

- Nothing from this module's sources. All were reached.

---

## Report: Module 4, Lessons 1–4: citation audit (subagent A)

Scope: `src/content/modules/04-context-and-memory/` `01-the-context-budget`, `02-context-that-fits-but-still-hurts`, `03-prompt-caching`, `04-when-the-window-fills` (every .mdx: intros, concepts, quiz explanations, recaps). Checked 2026-09-30. Paths below are relative to that folder. Line numbers are the file's own.

These lessons have **no external links at all**. Every named source is prose only. Most recommendations below are "add the link", plus a handful of wording fixes and one teaching issue (preserved thinking vs. re-anchoring) that needs a decision.

Downloads are in `scratchpad/audit/m4A/`. Anthropic docs came from the `.md` versions (`https://platform.claude.com/docs/en/<path>.md`), OpenAI docs from `https://developers.openai.com/api/docs/guides/<page>.md`, Gemini docs from `https://ai.google.dev/gemini-api/docs/<page>.md.txt`, Ollama's behaviour from its docs plus source code (`server/prompt.go`, `server/routes.go` on `main`), and blog posts through curl + `strip.py`.

### 1. Claim table

| ID | file:line | claim (trimmed) | source given | kind | verdict | evidence (primary source) | recommendation |
|---|---|---|---|---|---|---|---|
| A1 | 01/00-intro.mdx:25-27 | "it's called **context engineering**: deciding what reaches the model's window…" | none | practice | UNSOURCED | Anthropic, "Effective context engineering for AI agents" (Sep 29, 2025): "After a few years of prompt engineering being the focus of attention in applied AI, a new term has come to prominence: context engineering." | add stronger backing (link Anthropic's post) |
| A2 | 01/01-what-fills-the-window.mdx:90-95 | "about four characters per token" estimate | Module 3 (internal) | fact | VERIFIED | Gemini docs, *Understand and count tokens*: "For Gemini models, a token is equivalent to about 4 characters." | keep (link optional) |
| A3 | 01/01…:142-144 | "a token-counting call that returns the **exact** input count for a request, using the model's own tokenizer" | none | fact | CONTRADICTED (partly) | Anthropic *Token counting*: "The token count is an **estimate**. In some cases, the actual number of input tokens used when creating a message might differ by a small amount." OpenAI *Counting tokens* says its endpoint "returns the exact count". | cut or soften ("returns the input count… close to what you'll be billed") |
| A4 | 01/01…:145-152 | usage reports cached tokens; "some count them inside the input total, others list them separately" | none | fact | VERIFIED | Anthropic *Prompt caching*: "`input_tokens`: Number of input tokens which were not read from or used to create a cache"; "total_input_tokens = cache_read_input_tokens + cache_creation_input_tokens + input_tokens". OpenAI *Prompt caching*: "Track `usage.input_tokens_details.cached_tokens`… dividing total cached tokens by total input tokens" (cached is a subset of input). | keep |
| A5 | 01/01…:156-157 | "a new model can bring a new tokenizer that counts the same text differently" | none | fact | VERIFIED | Anthropic *Token counting*: "Claude 4.7 and later models and Claude Mythos Preview use a newer tokenizer. The same input text produces approximately 30 percent more tokens than on earlier models." | add stronger backing (the vendor-reported ~30%, labelled as Anthropic's) |
| A6 | 01/01…:157-159 | provider rewrites tool definitions, "often with some instructions around them" | none | fact | VERIFIED | Anthropic *Tool use overview*: "When you use `tools`, the API also automatically includes a special system prompt for the model that enables tool use" (e.g. 286 tokens on Claude Opus 5.5). | keep |
| A7 | 01/01…:174-176 | windows range "from a few thousand tokens on small local models to a million or more on large hosted ones" | none | fact | VERIFIED | Anthropic *Context windows*: Fable 5.1, Opus 5.5, Sonnet 5.5 and others "have a 1M-token context window". Ollama *Context length*: "< 24 GiB VRAM: 4k context". | keep |
| A8 | 01/01…:183-186 | reasoning "usually comes out of the same `max_tokens`" | none | fact | VERIFIED | Anthropic *Context windows*: "Thinking tokens are a subset of your `max_tokens` parameter". OpenAI *Reasoning*: "limit the total number of tokens the model generates, including reasoning tokens… by using the `max_output_tokens` parameter." | keep |
| A9 | 01/01…:187-189 | "Most hosted APIs reject it with an error, while some servers and settings silently cut the oldest input" | none | fact | VERIFIED | Anthropic: "If the input alone already exceeds the model's context window, the API returns a 400 `invalid_request_error`". OpenAI Responses API reference, `truncation`: "`disabled` (default): … the request will fail with a 400 error"; "`auto`: … dropping items from the beginning of the conversation." Ollama `server/prompt.go`: "chatPrompt truncates any messages that exceed the context window". | keep |
| A10 | 01/02-measuring…:189-192 | "An agent connected to several tool servers can start every request with tens of thousands of tokens of definitions." | none | fact | UNSOURCED | Anthropic, "Introducing advanced tool use" (Nov 24, 2025): "That's 58 tools consuming approximately 55K tokens before the conversation even starts… At Anthropic, we've seen tool definitions consume 134K tokens before optimization." | add stronger backing (labelled as Anthropic's figure) |
| A11 | 02/01-agents-get-worse…:66-72 | Chroma "Context Rot", July 2025, 18 models incl. GPT-4.1, Claude 4, Gemini 2.5, Qwen3; simple tasks (one fact, repeated words); "Every model got less reliable as the input grew" | named, unlinked | effectiveness | VERIFIED | Chroma Technical Report, July 14, 2025 (Hong, Troynikov, Huber): "we evaluate 18 LLMs, including the state-of-the-art GPT-4.1, Claude 4, Gemini 2.5, and Qwen3 models. Our results reveal that models do not use their context uniformly; instead, their performance grows increasingly unreliable as input length grows." Repeated-words task: "As context length increases, performance consistently degrades across all models." | re-label (a "technical report" from Chroma, a vector-database company, not a peer-reviewed study) + add link |
| A12 | 02/01…:73-74 (+ :170, 05-recap:256) | "The degradation isn't a cliff. Accuracy falls gradually as input grows" | Chroma | effectiveness | NOT IN SOURCE | Chroma never says "gradual". It stresses the opposite of smooth: "model performance degrades as input length increases, often in surprising and non-uniform ways"; "we see increasing non-uniformity in performance as input length grows." The "well inside the window" part is supported. | cut or soften |
| A13 | 02/01…:75-78 (+ :176, 02-what-goes-stale:182, :327) | "Similar-but-irrelevant content hurts **most**" | Chroma | effectiveness | VERIFIED, overstated | Chroma: "Even a single distractor reduces performance relative to the baseline (needle only), and adding four distractors compounds this degradation further"; "the impact of distractors and their non-uniformity amplifies as input length grows across models". Chroma doesn't rank distractors against other factors. | cut or soften ("hurts more") |
| A14 | 02/01…:80-85 | Anthropic's post calls it context rot, it appears "across all models, some degrading more gently", a "finite resource with diminishing returns", an "attention budget" | named, unlinked | effectiveness (attributed) | VERIFIED | "While some models exhibit more gentle degradation than others, this characteristic emerges across all models. Context, therefore, must be treated as a finite resource with diminishing marginal returns. … LLMs have an 'attention budget'…" | keep; add link |
| A15 | 02/01…:122-140 | Drew Breunig's 2025 essay "How Long Contexts Fail": poisoning, distraction ("repeating earlier actions"), confusion (tool definitions), clash | named, unlinked | practice | VERIFIED | dbreunig.com, Jun 22, 2025: "Context Poisoning: When a hallucination makes it into the context / Context Distraction: When the context overwhelms the training / Context Confusion: When superfluous context influences the response / Context Clash: When parts of the context disagree"; distraction example: "a tendency toward favoring repeating actions from its vast history". | keep; add link |
| A16 | 02/02-what-goes-stale…:191-196 (+ recap:267) | APIs reject a history where a `tool_use` lost its result, or a result lost its `tool_use` | none | fact | VERIFIED | Anthropic *Handle tool calls*: "Tool result blocks must immediately follow their corresponding tool use blocks in the message history." API error text (quoted in anthropics/claude-code#3886, docker/docker-agent#1644): "Each `tool_use` block must have a corresponding `tool_result` block in the next message." / "Each `tool_result` block must have a corresponding `tool_use` block in the previous message." | keep; optional link |
| A17 | 02/02…:262-268 (+ :349, recap:278) | Manus, July 2025: keep failed actions and their errors in context | named, unlinked | practice | VERIFIED | Yichao 'Peak' Ji, "Context Engineering for AI Agents: Lessons from Building Manus", 2025/7/18: "In our experience, one of the most effective ways to improve agent behavior is deceptively simple: leave the wrong turns in the context." | keep; add link |
| A18 | 02/02…:293-306 | Manus: getting "few-shotted" by your own context; remedy is structured variety | named | practice | VERIFIED | "Don't Get Few-Shotted… If your context is full of similar past action-observation pairs, the model will tend to follow that pattern"; "Manus introduces small amounts of structured variation in actions and observations". | keep |
| A19 | 02/04-re-anchoring…:175-181 (+ :296-304) | Manus recitation via `todo.md`; tasks average about fifty tool calls; "they found that without this, agents drift off-topic or lose track of earlier goals" | named | practice/effectiveness | VERIFIED, overstated | "A typical task in Manus requires around 50 tool calls on average. That's a long loop… it's vulnerable to drifting off-topic or forgetting earlier goals… By constantly rewriting the todo list, Manus is reciting its objectives into the end of the context." Manus describes a risk it designs against. It reports no with/without comparison. | cut or soften |
| A20 | 02/04…:237-241 (+ quiz :315, recap :311) | Anthropic's tool-use docs: `tool_result` blocks first, text after, or the request is rejected (quiz: "400 error") | named, unlinked | fact | VERIFIED | Anthropic *Handle tool calls*: "In the user message containing tool results, the tool_result blocks must come FIRST in the content array. Any text must come AFTER all tool results." … "For example, this will cause a 400 error". | keep; add link |
| A21 | 02/04…:252-261; 03/03-where…:297-311 (+ quiz :422-441, 03 recap :344-352) | Re-anchoring (anchor added to the last user message on the sent copy, gone next turn) costs one message of cache per turn, "the best available one" | none | practice | VERIFIED for caching; **incomplete** on the newest Claude models | Anthropic *Preserved thinking*, "What counts as an edit": "Add a text block to an earlier user turn, or remove one you added last time → Invalid". "Who needs to change anything": "Adds a reminder to a user turn and removes or rewrites it later". The replacement it names: "send each nudge as a mid-conversation system message with `clear_at: "next_user_message"`". | **Needs a decision** (see §3) |
| A22 | 03/00-intro.mdx:23-25 | For long agent runs a prefix cache is "routinely the difference between a practical cost and an impractical one" | none | practice | UNSOURCED | Manus post: "If I had to choose just one metric, I'd argue that the KV-cache hit rate is the single most important metric for a production-stage AI agent. It directly affects both latency and cost." And: "with Claude Sonnet… cached input tokens cost 0.30 USD/MTok, while uncached ones cost 3 USD/MTok—a 10x difference." | lead with an industry source (Manus) |
| A23 | 03/01-what-a-prefix-cache…:106-117 | Prefix caching appears across the ecosystem; some cache automatically, some need a marker; vLLM reuses shared prefixes | none | practice/fact | VERIFIED | OpenAI: "Prompt caching is enabled by default for supported OpenAI models." Anthropic: "Add a single `cache_control` field at the top level" (automatic) or explicit breakpoints. Gemini: "Implicit caching is enabled by default for all Gemini 2.5 and newer models." vLLM *Automatic Prefix Caching*: "a new query can directly reuse the KV cache if it shares the same prefix with one of the existing queries". | keep; optional links |
| A24 | 03/01…:159-161 | "using one provider's published multipliers… reads at a tenth of the full price and writes at a quarter more" | "one provider" | fact | VERIFIED; worth re-labelling | Anthropic *Prompt caching*: "5-minute cache write tokens are 1.25 times the base input tokens price… Cache read tokens are 0.1 times the base input tokens price (see the table footnote for per-model exceptions)". Footnotes: "Cache hits… on Claude Fable 5.1 and Claude Mythos 5.1 are priced at 0.025x"; "on Claude Opus 5.5 … 0.05x". OpenAI (GPT-5.6+): "cache writes cost 1.25×… Subsequent reads cost 0.1×". | re-label (name it as Anthropic's standard rate; the demo numbers don't change) |
| A25 | 03/01…:176-179 | real caches have minimum sizes; entries expire "(five by default on Anthropic's API, with longer lifetimes at a higher write price)"; limits on how far back a match is searched | Anthropic (unlinked) | fact | VERIFIED | "By default, the cache has a 5-minute lifetime. The cache is refreshed for no additional cost each time the cached content is used"; "1-hour cache write tokens are 2 times the base input tokens price"; "The lookback window is 20 blocks." | keep; add link |
| A26 | 03/01…:198-200 | "Below a minimum length, **often around a thousand tokens**, nothing is cached at all." | none | fact | CONTRADICTED (out of date) | Anthropic: "512 tokens for Claude Fable 5.1, … Claude Opus 5.5, … Claude Sonnet 5.5"; 1,024 for Sonnet 4.6/Opus 4.8; "4,096 tokens for Claude Opus 4.6 and Claude Opus 4.5"; "4,096 tokens for Claude Haiku 4.5". OpenAI: "1,024 tokens for GPT-5.6 and later". Gemini implicit: 4,096 (Gemini 3.x), 2,048 (2.5). | replace (a range) |
| A27 | 03/01…:201-205 | entries live "typically minutes, renewed each time it's used"; some providers sell a longer lifetime at a higher write price | none | fact | VERIFIED | Anthropic, as in A25. OpenAI: "reusing the prefix refreshes its lifetime without another cache-write charge"; GPT-5.6+ TTL "`30m`, is also the default". | keep |
| A28 | 03/01…:206-208 | "The cache belongs to one model." | none | fact | VERIFIED | Anthropic *Cache diagnostics*, `model_changed`: "The `model` differs from the previous request (for example, a router, A/B test, or fallback selected a different model). The cache is per-model." | keep |
| A29 | 03/01…:209-213 | every response reports how many input tokens were read from the cache | none | fact | VERIFIED | Anthropic `cache_read_input_tokens`; OpenAI `usage.input_tokens_details.cached_tokens`; Gemini `usage.total_cached_tokens`. | keep |
| A30 | 03/02-what-makes…:178-186 (+ recap :319) | Claude lays a request out as tools, system prompt, messages; non-text settings (tool use, reasoning) are part of the match on some providers | "Claude's API" | fact | VERIFIED | Anthropic: "Cache prefixes are created in the following order: `tools`, `system`, then `messages`." Invalidation table: "Changes to `tool_choice` parameter only affect message blocks"; thinking parameters "always invalidates message blocks". OpenAI lists `parallel_tool_calls`, `reasoning.effort` as settings that affect the cached prefix. | keep |
| A31 | 03/02…:230-236 | a time in the system prompt is "the classic mistake"; put it at the end | none | practice | UNSOURCED | Manus: "A common mistake is including a timestamp—especially one precise to the second—at the beginning of the system prompt… it also kills your cache hit rate." Anthropic *Cache diagnostics*, `system_changed`: "Typically a timestamp, request ID, or other per-request value was interpolated into the system prompt." | lead with an industry source |
| A32 | 03/02…:258-266 | reordered JSON keys break the cache; "a language whose JSON library doesn't keep key order" | none | fact/practice | VERIFIED | Anthropic *Prompt caching*: "Verify that the keys in your `tool_use` content blocks have stable ordering as some languages (for example, Swift, Go) randomize key order during JSON conversion, breaking caches". Manus: "Ensure your serialization is deterministic. Many programming languages and libraries don't guarantee stable key ordering…" | add stronger backing (link) |
| A33 | 03/02…:365 (exercise explanation) | "cache-diagnostics tools some providers now offer, which report where two requests diverged" | none | fact | VERIFIED | Anthropic *Cache diagnostics* (GA): "the API compares the two requests and tells you where they diverged (the model, the system prompt, the tools, or the message history)". OpenAI: "use the Prompt Cache Diagnostics tool to diagnose cache misses". | keep (could name both) |
| A34 | 03/03-where…:403-407 | "Some providers now support … letting a tool definition be added partway through a conversation" | none | fact | VERIFIED | Anthropic *Mid-conversation system messages*: "`tool_addition` and `tool_removal` are content blocks in the `content` array of a `role: "system"` message" (beta `inline-tools-2026-09-15`). OpenAI *Prompt caching*: "Use a developer-role `additional_tools` input item to add tools during a thread"; tool search: "Discovered tools are appended at the end of context". | keep |
| A35 | 04/00-intro.mdx:12-14 (+ 04/01…:187) | on overflow an agent "either stops with an error, or, on some local servers, carries on after quietly losing its task" | none | fact | VERIFIED, incomplete | Same as A9. Silent front-trimming is also an **opt-in on a hosted API**: OpenAI `truncation: "auto"` drops "items from the beginning of the conversation". | add stronger backing (mention the hosted opt-in in concept 1) |
| A36 | 04/01-hitting-the-wall.mdx:149-150 | "current hosted models offer hundreds of thousands of tokens, up to a million" | none | fact | VERIFIED | As in A7 (Claude: 1M or 200k). | keep |
| A37 | 04/01…:175-177 | Claude: input over the window → 400 `invalid_request_error` ("prompt is too long") on every model | "Claude's API" | fact | VERIFIED | Anthropic *Context windows*: "If the input alone already exceeds the model's context window, the API returns a 400 `invalid_request_error` ("prompt is too long") on every model." | keep; add link |
| A38 | 04/01…:178-186 (+ quiz :271, recap :335-343) | Claude 4.5+: input fits but input + `max_tokens` doesn't → accepted, may stop with `stop_reason: "model_context_window_exceeded"` | "Claude 4.5" | fact | VERIFIED | "On Claude 4.5 models and newer, if input tokens plus `max_tokens` exceeds the context window size, the API accepts the request. If generation then reaches the context window limit, it stops with `stop_reason: "model_context_window_exceeded"`." | keep |
| A39 | 04/01…:187-193 (+ quiz :304) | Ollama's chat endpoint drops the oldest whole messages by default, keeping system messages and the latest one; default window 4k under 24 GiB, "per its docs" | "per its docs" | fact | VERIFIED | Ollama `server/prompt.go`: "chatPrompt truncates any messages that exceed the context window of the model, making sure to always include 1) the latest message and 2) system messages". `routes.go`: `truncate := req.Truncate == nil \|\| *req.Truncate` (on by default). docs.ollama.com/context-length: "< 24 GiB VRAM: 4k context". | keep; add links (the trimming rule is from source code, not the docs) |
| A40 | 04/02-cutting…:242-247 | Claude's error strings: "tool_use ids were found without tool_result blocks immediately after" / "unexpected tool_use_id found in tool_result blocks" | none | fact | VERIFIED | API responses quoted verbatim in anthropics/claude-code#3886 (2025-07-18): "`tool_use` ids were found without `tool_result` blocks immediately after: toolu_…" and docker/docker-agent#1644: "unexpected `tool_use_id` found in `tool_result` blocks". | keep |
| A41 | 04/02…:249-251 | OpenAI's chat format enforces the same rule | none | fact | VERIFIED | OpenAI API error quoted in pydantic/pydantic-ai#562 (gpt-4o-mini): "An assistant message with 'tool_calls' must be followed by tool messages responding to each 'tool_call_id'." | keep |
| A42 | 04/02…:314-315 | "Real agent tools have shipped this bug, with sessions that could no longer send any request at all." | none | fact | UNSOURCED (the symptom is verified, the cause isn't shown) | anthropics/claude-code#3886: "Anything I do is getting blocked with this error… After auto upgrade to 1.0.55 anything i do results in this error." The issue shows a stuck session with an unpaired `tool_use`. It doesn't show that trimming caused it. | add stronger backing + soften cause |
| A43 | 04/03-clear-before-you-cut…:311-318 | clearing old tool results (keep the call, placeholder the content) as a technique | none (industry version appears one concept later) | practice | UNSOURCED | Anthropic, "Effective context engineering": "One of the safest lightest touch forms of compaction is tool result clearing, most recently launched as a feature on the Claude Developer Platform." | lead with an industry source |
| A44 | 04/04-reasoning-travels…:237-238 (+ quiz :410) | Claude requires the complete, unmodified thinking block sent back with the tool results | "Claude's API" | fact | VERIFIED | Anthropic *Context windows*: "When you post tool results, you must include the entire unmodified thinking block that accompanies that tool request, including its signature." | keep |
| A45 | 04/04…:239-241 (+ quiz :410) | Gemini 3: "every function call in the current turn must come back with its signature, or the request fails with a 400" | "Gemini 3" | fact | VERIFIED, imprecise | Gemini *Thought signatures* (generateContent): "The **first** `functionCall` part in **each step** of the current turn **must** include its `thought_signature`. If you omit a `thought_signature` for the first `functionCall` part in any step of the current turn, the request will fail with a 400 error." | re-word |
| A46 | 04/04…:290-295 | "On earlier Claude models, the API drops thinking from previous turns"; "On Claude Opus 4.5 and later Opus models, and Claude Sonnet 4.6 and later Sonnet models" it's kept | "Claude" | fact | VERIFIED, incomplete | Anthropic *Context windows*: kept "On Claude Opus 4.5 and later Opus models, Claude Sonnet 4.6 and later Sonnet models, Claude Fable 5.1, Claude Mythos 5.1, Claude Fable 5, Claude Mythos 5, and Claude Mythos Preview"; stripped "On earlier Opus and Sonnet models and all Haiku models". | replace (small update) |
| A47 | 04/04…:343-350 | "On Claude's newest models (Claude Fable 5.1 and Claude Opus 5.5, as of September 2026)" thinking is bound to its prefix; accounts created on or after August 31, 2026 get a 400 by default; you can opt to drop | "Claude" | fact | VERIFIED, **out of date** | Anthropic *Preserved thinking*: "On Claude Fable 5.1, Claude Opus 5.5, and Claude Sonnet 5.5, a thinking block stays valid only while everything you sent before it is unchanged"; "The API enforces the prefix check by default for accounts created on or after August 31, 2026, 00:00 UTC"; "`"drop_block"`: the API drops each failing block…"; "Both the field and the `input_transformations` array require the `thinking-binding-controls-2026-08-01` beta header"; "Claude Mythos 5.1 and models before Claude Fable 5.1 don't run the prefix check." | replace (add Sonnet 5.5; say the opt-out is a beta) |
| A48 | 04/04…:352-357 | "every *client-side* edit in this module" invalidates reasoning: pruning, batching, clearing, trimming | none | fact | VERIFIED, **incomplete** | Same page, "What counts as an edit": "Add a text block to an earlier user turn, or remove one you added last time → Invalid". Lesson 2's re-anchoring and Lesson 3's `add_to_end` time stamp do exactly this. | Needs a decision (A21) |
| A49 | 04/04…:366-369 | removing thinking from the start, the end, or all of it is allowed; from the middle isn't | none | fact | VERIFIED | "You can remove thinking blocks from the start of the history (oldest first), from the end, or all of them. What fails is a gap". | keep |
| A50 | 04/04…:370-372 (+ quiz :443, recap :420) | server-side trimming doesn't count as an edit, because the check compares what you sent | none | fact | VERIFIED | "Server-side compaction or context editing removes or replaces content → Valid (the check compares what you sent, not the server's edited copy)". | keep |
| A51 | 04/04…:378-386 (+ quiz :446-454) | Claude context editing: beta header `context-management-2025-06-27`, `clear_tool_uses_20250919` clears the oldest results with placeholders and keeps calls, excludes tools, has `clear_at_least`; a companion strategy clears thinking | "Claude's API" | fact | VERIFIED | *Context editing*: "use the beta header `context-management-2025-06-27`"; "the API automatically clears the oldest tool results in chronological order. The API replaces each cleared result with placeholder text… By default, only tool results are cleared"; `exclude_tools`; "Use the `clear_at_least` parameter to ensure a minimum number of tokens is cleared each time"; `clear_thinking_20251015`. | keep; add link |
| A52 | 04/04…:388-390 | the same docs point to server-side compaction as the main strategy | "the same documentation" | fact | VERIFIED | *Context editing*: "For most use cases, server-side compaction is the primary strategy for managing context in long-running conversations." | keep |

Our own data: none in these four lessons. Every number in them (58%/74%, +72%/+6%, 3,800 vs 5,100, 17/17/3 breaks, 31%/72%, 16%) comes from the lessons' own scripted demos. They're printed by LiveDemo code, labelled as demo output, and "(Cost uses the same example multipliers… measures what's sent, not how well a model would do)" is already said at 04/03:459-460. No action needed.

One aside, not a finding against these lessons: Chroma's report also says "Testing across 11 needle positions, we find no notable variation in performance for this specific NIAH task." The "position matters" point at 02/01:87-92 cites Module 1's lost-in-the-middle lesson, not Chroma, so nothing is wrong here. Whoever audits Module 1 may want the caveat.

### 2. Proposed edits

None of these edits touch exercise or demo code strings (no Pyodide re-verification needed). Quiz `explanation`/`options` strings are JSON inside the MDX, so keep inner quotes escaped as `\"`.

**E1 (A1): 01-the-context-budget/00-intro.mdx:25-28**
Current:
```
  This module is about managing that, and it's called **context
  engineering**: deciding what reaches the model's window, when, in what
  form, and what gets stored somewhere else instead. It's different from the
```
Proposed:
```
  This module is about managing that, and it's called
  [**context engineering**](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents):
  deciding what reaches the model's window, when, in what
  form, and what gets stored somewhere else instead. It's different from the
```

**E2 (A3, A5): 01-the-context-budget/01-what-fills-the-window.mdx:142-144 and 156-157**
Current:
```
- **Before sending,** most providers offer a token-counting call that
  returns the exact input count for a request, using the model's own
  tokenizer.
```
Proposed:
```
- **Before sending,** most providers offer a token-counting call that
  returns the input count for a request, using the model's own tokenizer.
  Some call it exact; Anthropic calls
  [its count](https://platform.claude.com/docs/en/build-with-claude/token-counting)
  an estimate that can differ from the final count by a small amount.
```
Current (line 155-157):
```
numbers and non-English text all split into tokens differently from plain
English prose, and a new model can bring a new tokenizer that counts the
same text differently. The provider also adds text of its own: tool
```
Proposed:
```
numbers and non-English text all split into tokens differently from plain
English prose, and a new model can bring a new tokenizer that counts the
same text differently. Anthropic, for example, says its tokenizer from
Claude Opus 4.7 onward produces about 30% more tokens for the same text.
The provider also adds text of its own: tool
```

**E3 (A10): 01-the-context-budget/02-measuring-one-request-part-by-part.mdx:190-192**
Current:
```
  is nothing against 200,000 of window. (This agent is deliberately small.
  An agent connected to several tool servers can start every request with
  tens of thousands of tokens of definitions.) The scratchpad is 15 tokens now, and
```
Proposed:
```
  is nothing against 200,000 of window. (This agent is deliberately small.
  An agent connected to several tool servers can start every request with
  tens of thousands of tokens of definitions: Anthropic
  [reports](https://www.anthropic.com/engineering/advanced-tool-use) five
  common MCP servers adding up to 58 tools and about 55,000 tokens.) The scratchpad is 15 tokens now, and
```

**E4 (A11, A12, A13, A14, A15): 02-context-that-fits-but-still-hurts/01-agents-get-worse-before-the-window-is-full.mdx**
Current (66-78):
```
**It happens to every model tested.** In July 2025, Chroma published a study
called "Context Rot" that tested 18 models, including GPT-4.1, Claude 4,
```
Proposed:
```
**It happens to every model tested.** In July 2025, Chroma, a company that
makes a vector database, published a technical report called
["Context Rot"](https://research.trychroma.com/context-rot) that tested 18 models, including GPT-4.1, Claude 4,
```
Current:
```
- **The degradation isn't a cliff.** Accuracy falls gradually as input
  grows, well inside the window, not suddenly at the limit.
- **Similar-but-irrelevant content hurts most.** Performance dropped further
```
Proposed:
```
- **The decline doesn't wait for the limit.** Reliability drops as input
  grows, well inside the window, and not always smoothly: the report
  describes the drop as uneven and sometimes surprising.
- **Similar-but-irrelevant content makes it worse.** Performance dropped further
```
Current (80-81):
```
**Model builders say the same.** Anthropic's engineering post "Effective
context engineering for AI agents" describes the same effect, which it also
```
Proposed:
```
**Model builders say the same.** Anthropic's engineering post
["Effective context engineering for AI agents"](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
describes the same effect, which it also
```
Current (122-123):
```
Length is only one way context hurts. Drew Breunig's 2025 essay "How Long
Contexts Fail" names four failures that are useful to tell apart, because
```
Proposed:
```
Length is only one way context hurts. Drew Breunig's 2025 essay
["How Long Contexts Fail"](https://www.dbreunig.com/2025/06/22/how-contexts-fail-and-how-to-fix-them.html)
names four failures that are useful to tell apart, because
```
Quiz, line 170, current:
```
    "explanation": "The degradation is gradual and appears well before the limit, which is why context has to be managed for quality, not just capacity."
```
Proposed:
```
    "explanation": "The decline starts well before the limit and grows with the input, which is why context has to be managed for quality, not just capacity."
```
Quiz option, line 176, current: `"There are many similar-looking results with few that matter, and look-alike content hurt most in the study",`
Proposed: `"There are many similar-looking results with few that matter, and look-alike content made things worse in the study",`
(This is the correct option. Its length changes slightly. Leave the length balance to the separate quiz pass.)

**E5 (A13): 02-context-that-fits-but-still-hurts/02-what-goes-stale-in-a-scratchpad.mdx:182-183 and :327**
Current:
```
That's the similar-but-misleading content the context-rot study found most
damaging. Its content should go. The one thing it still told the model, that
```
Proposed:
```
That's the similar-but-misleading kind of content the context-rot study
found harmful. Its content should go. The one thing it still told the model, that
```
Line 327, current: `…they actively contradict the current truth, which is the misleading kind of content that hurts most."`
Proposed: `…they actively contradict the current truth, which is the misleading kind of content that does the most harm."` (Or keep: here "hurts most" is the course's own judgement, not attributed to Chroma. This is optional.)

**E6 (A12): 02-context-that-fits-but-still-hurts/05-recap-practice.mdx:256**
Current: `"explanation": "The decline is gradual and starts well inside the window, which is why context is managed for quality, not just capacity."`
Proposed: `"explanation": "The decline starts well inside the window and grows with the input, which is why context is managed for quality, not just capacity."`
Also check the options of that recap question (lines 249-255) for any "gradual" wording. The grep found none.

**E7 (A17, A19): Manus link and softening**
02/02-what-goes-stale-in-a-scratchpad.mdx:262-263, current:
```
The team behind the Manus agent wrote about this in their July 2025 post on
context engineering, and their advice is to *keep failed actions and their
```
Proposed:
```
The team behind the Manus agent wrote about this in their
[July 2025 post on context engineering](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus),
and their advice is to *keep failed actions and their
```
02/04-re-anchoring-the-goal.mdx:175-181, current:
```
The team behind the Manus agent described their answer in their July
2025 post on context engineering, and called it *recitation*. Their
agent keeps a `todo.md` file and rewrites it as it works, ticking items
off, so that the objective and the remaining steps are restated at the
end of the context on every turn. Their tasks average around fifty tool
calls, and they found that without this, agents drift off-topic or lose
track of earlier goals.
```
Proposed:
```
The team behind the Manus agent described their answer in their
[July 2025 post on context engineering](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus),
and called it *recitation*. Their
agent keeps a `todo.md` file and rewrites it as it works, ticking items
off, so that the objective and the remaining steps are restated at the
end of the context on every turn. Their tasks average around fifty tool
calls, and they say a loop that long is prone to drifting off-topic or
forgetting earlier goals. Recitation is how they counter it.
```

**E8 (A20): 02/04-re-anchoring-the-goal.mdx:237** (add link)
Current: `*where* in that message, stated in Anthropic's tool-use documentation: in`
Proposed: `*where* in that message, stated in [Anthropic's tool-use documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls): in`

**E9 (A22): 03-prompt-caching/00-intro.mdx:23-25**
Current:
```
  or compute and latency on a model you run yourself. For long agent runs,
  it's routinely the difference between a practical cost and an impractical
  one.
```
Proposed:
```
  or compute and latency on a model you run yourself. For long agent runs,
  it's routinely the difference between a practical cost and an impractical
  one. The team behind the Manus agent
  [calls](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus)
  the cache hit rate the single most important number for an agent in
  production.
```

**E10 (A24, A25): 03-prompt-caching/01-what-a-prefix-cache-is-worth-to-an-agent.mdx:159-161 and :178**
Current:
```
Applied to Lesson 1's log-reading run, using one provider's published
multipliers as the example, reads at a tenth of the full price and
writes at a quarter more:
```
Proposed:
```
Applied to Lesson 1's log-reading run, using
[Anthropic's standard multipliers](https://platform.claude.com/docs/en/build-with-claude/prompt-caching#pricing)
as the example, reads at a tenth of the full price and
writes at a quarter more (OpenAI's newest models use the same pair, and
some of Anthropic's newest models read even cheaper):
```
Line 178, current: `few minutes (five by default on Anthropic's API, with longer lifetimes at a`
Proposed: `few minutes (five by default on [Anthropic's API](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), with longer lifetimes at a` (optional link only)

**E11 (A26): 03-prompt-caching/01-what-a-prefix-cache-is-worth-to-an-agent.mdx:198-200**
Current:
```
- **How long must the prefix be?** Below a minimum length, often around a
  thousand tokens, nothing is cached at all. The small requests in this
  lesson's demos are illustrations, well under that line.
```
Proposed:
```
- **How long must the prefix be?** Below a minimum length, from a few
  hundred to a few thousand tokens depending on the provider and model,
  nothing is cached at all. The small requests in this lesson's demos are
  illustrations, well under that line.
```

**E12 (A31, A32): 03-prompt-caching/02-what-makes-an-agent-cache-friendly-and-what-breaks-it.mdx:230-236 and 262-263**
Current:
```
- **The time in the system prompt:** this is the classic mistake, and
  it's easy to make, since "tell the agent what time it is" sounds
```
Proposed:
```
- **The time in the system prompt:** this is the classic mistake (the
  Manus team calls a timestamp at the start of the system prompt
  [a common one](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus)),
  and it's easy to make, since "tell the agent what time it is" sounds
```
Current (262-263):
```
converting between formats, or a language whose JSON library doesn't
keep key order, can quietly break the cache this way. The fix is to keep
```
Proposed:
```
converting between formats, or a language whose JSON library doesn't
keep key order (Anthropic's
[caching docs](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
name Swift and Go), can quietly break the cache this way. The fix is to keep
```

**E13 (A35, A39): 04-when-the-window-fills/01-hitting-the-wall.mdx:187-193**
Current:
```
- **Silently trimmed.** Some local servers drop content until the request
  fits and answer as if nothing happened. Ollama's chat endpoint does this
  by default: it removes the oldest whole messages until the prompt fits,
  always keeping system messages and the latest message, and returns an
  ordinary response. Its default window is also small (4k tokens on
  machines with less than 24 GiB of GPU memory, per its docs), so an agent
  can hit this far sooner than the model's advertised window suggests.
```
Proposed:
```
- **Silently trimmed.** Some local servers drop content until the request
  fits and answer as if nothing happened. Ollama's chat endpoint does this
  by default: its
  [code](https://github.com/ollama/ollama/blob/main/server/prompt.go)
  removes the oldest whole messages until the prompt fits,
  always keeping system messages and the latest message, and returns an
  ordinary response. Its default window is also small (4k tokens on
  machines with less than 24 GiB of GPU memory,
  [per its docs](https://docs.ollama.com/context-length)), so an agent
  can hit this far sooner than the model's advertised window suggests.
  Some hosted APIs offer the same trimming as an option: OpenAI's
  Responses API drops the oldest items if you set `truncation: "auto"`,
  and rejects the request otherwise.
```
(Also optional: the intro `04/00-intro.mdx:13-14` "or, on some local servers, carries on after quietly losing its task" could become "or, on some local servers and settings, carries on after quietly losing its task".)

**E14 (A42): 04-when-the-window-fills/02-cutting-whole-rounds-not-messages.mdx:311-315**
Current:
```
Both produce exactly the errors the API returns, and there's a nasty
property here: the broken history is *kept*. If the trimming happens
inside a session's stored state, every later request carries the same
defect and fails the same way. Real agent tools have shipped this bug,
with sessions that could no longer send any request at all.
```
Proposed:
```
Both produce exactly the errors the API returns, and there's a nasty
property here: the broken history is *kept*. If the trimming happens
inside a session's stored state, every later request carries the same
defect and fails the same way. Real agent tools have shipped bugs that
left a call without its result, and users
[reported](https://github.com/anthropics/claude-code/issues/3886)
sessions where every request failed with this error.
```

**E15 (A43): 04-when-the-window-fills/03-clear-before-you-cut-and-cut-in-batches.mdx:318** (append after "…clearing replaces a result that's simply old.")
Add:
```
Anthropic's
[context-engineering post](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
calls tool result clearing one of the safest, lightest-touch ways to
shrink a context, and its API can do it for you, as the last concept in
this lesson shows.
```

**E16 (A45): 04-when-the-window-fills/04-reasoning-travels-with-its-tool-call.mdx:239-241 and quiz :410**
Current:
```
- **Gemini 3** does the same with its encrypted "thought signatures":
  every function call in the current turn must come back with its
  signature, or the request fails with a 400.
```
Proposed:
```
- **Gemini 3** does the same with its encrypted "thought signatures":
  the function calls in the current turn must come back with the
  signatures they were returned with (the first call of each step carries
  one), or the
  [request fails with a 400](https://ai.google.dev/gemini-api/docs/generate-content/thought-signatures).
```
Quiz :410 ("Gemini 3 rejects a current-turn call without its thought signature") is accurate enough. Keep it.

**E17 (A46): 04/04-reasoning-travels-with-its-tool-call.mdx:290-295**
Current:
```
- Some strip it themselves. On earlier Claude models, the API drops
  thinking from previous turns automatically, even if you send it.
- Others keep it by default, because it helps the model stay consistent.
  On Claude Opus 4.5 and later Opus models, and Claude Sonnet 4.6 and
  later Sonnet models, previous thinking stays in the context and counts
  toward the window like any other input.
```
Proposed:
```
- Some strip it themselves. On earlier Claude Opus and Sonnet models, and
  on every Haiku model, the API drops thinking from previous turns
  automatically, even if you send it.
- Others keep it by default, because it helps the model stay consistent.
  On Claude Opus 4.5 and later Opus models, Claude Sonnet 4.6 and later
  Sonnet models, and the Claude Fable models,
  [previous thinking stays in the context](https://platform.claude.com/docs/en/build-with-claude/context-windows#the-context-window-with-thinking)
  and counts toward the window like any other input.
```

**E18 (A47): 04/04-reasoning-travels-with-its-tool-call.mdx:343-350**
Current:
```
On Claude's newest models (Claude Fable 5.1 and Claude Opus 5.5, as of
September 2026), a thinking block stays valid only while everything sent
before it is unchanged: the system prompt, the tool list, and every
earlier message. Edit anything before a thinking block, and that block and
every later one are invalid. For accounts created on or after August 31,
2026, the API rejects such a request with a 400 by default. You can opt to
have the invalid blocks dropped instead. The model then works without that
reasoning.
```
Proposed:
```
On Claude's newest models (Claude Fable 5.1, Claude Opus 5.5 and Claude
Sonnet 5.5, as of September 2026), a thinking block
[stays valid only while everything sent before it is unchanged](https://platform.claude.com/docs/en/build-with-claude/preserved-thinking):
the system prompt, the tool list, and every
earlier message. Edit anything before a thinking block, and that block and
every later one are invalid. For accounts created on or after August 31,
2026, the API rejects such a request with a 400 by default. With a beta
setting, you can have the invalid blocks dropped instead. The model then
works without that reasoning.
```
(If the lesson prefers not to name models that change monthly, "Claude's newest models (as of September 2026)" plus the link is safer.)

**E19 (A48): 04/04…:352-357.** This depends on the decision in §3. If the recommendation is taken:
Current:
```
That makes every *client-side* edit in this module an edit that
invalidates reasoning:
[Lesson 2's pruning](/04-context-and-memory/02-context-that-fits-but-still-hurts/02-what-goes-stale-in-a-scratchpad/),
[Lesson 3's batching](/04-context-and-memory/03-prompt-caching/03-where-lesson-2s-techniques-stand-and-the-fights-ahead/),
and this lesson's clearing and trimming. The techniques are still right;
```
Proposed:
```
That makes every *client-side* edit in this module an edit that
invalidates reasoning:
[Lesson 2's pruning](/04-context-and-memory/02-context-that-fits-but-still-hurts/02-what-goes-stale-in-a-scratchpad/),
[Lesson 3's batching](/04-context-and-memory/03-prompt-caching/03-where-lesson-2s-techniques-stand-and-the-fights-ahead/),
this lesson's clearing and trimming, and even
[Lesson 2's re-anchoring](/04-context-and-memory/02-context-that-fits-but-still-hurts/04-re-anchoring-the-goal/),
since an anchor added to one request and gone from the next is an edit
too. The techniques are still right;
```
And add a bullet after "Or let the provider do the trimming.":
```
- **Use the provider's own form of an edit where there is one.** For the
  re-anchor, Claude's API offers a system message placed after the latest
  results that clears itself once the next turn starts (a beta), so the
  plan is restated without editing anything already sent.
```

### 3. Needs a decision

**D1. Re-anchoring (and the per-turn time stamp) conflicts with preserved thinking on the newest Claude models (A21, A48).**
- **What the lessons teach:** Lesson 2's `assemble_context` adds the plan and rules anchor as a text block on the sent copy of the last user message and never saves it. Lesson 3 calls this "nearly free… the best available one". Lesson 3's recap sandbox adds `<current_time>` the same way (`add_to_end`), and 03/02:235-236 says the time placed in the latest message "breaks nothing". The pattern carries on through later Module 4 lessons: `assemble_context` or "re-anchor" appears in Lessons 5, 6, 7, 8, 9 and 12, and in Module 6 `01-per-step-reliability/05-where-agents-fail.mdx`.
- **What the source says:** Anthropic's *Preserved thinking* page lists "Add a text block to an earlier user turn, or remove one you added last time" as **Invalid**. On Claude Fable 5.1, Opus 5.5 and Sonnet 5.5 that invalidates every later thinking block, and accounts created on or after 2026-08-31 get a 400 by default. The page names this exact pattern ("Adds a reminder to a user turn and removes or rewrites it later"). Its replacement is a mid-conversation `role: "system"` message with `clear_at: "next_user_message"` (beta header `mid-conversation-system-clear-at-2026-08-21`). For caching alone, the lessons' claim still holds.
- **Recommendation:** keep the technique, since recitation is well-backed practice (Manus) and Anthropic itself ships a native form of it. Don't claim it's free everywhere:
  1. In 03/03 "Re-anchoring: nearly free" (lines 303-311), soften "it's the best available one" to "on a plain prefix cache, it's the best available one", and add one sentence forward-pointing to Lesson 4's preserved-thinking section.
  2. Apply E19 in Lesson 4, concept 4.
  3. Optionally, in 02/04 "Where the anchor goes", add one line saying some providers now offer a built-in place for per-turn reminders (Claude's turn-scoped system messages, a beta), linked to the mid-conversation system messages doc.
- **What it doesn't need:** no exercise or demo code changes. Everything runs on the fake client, and the cache arithmetic is unchanged.

### 4. Counts

- Claims inventoried: 52 (A1–A52).
- **Verified:** 43. Of those, 38 are clean (A2, A4–A9, A11, A14–A18, A20, A23–A25, A27–A30, A32–A34, A36–A41, A44, A49–A52). Five are verified but overstated or imprecise, so wording changes: A13, A19, A45, A46, A47.
- **Contradicted:** 2. A3 ("exact" count vs Anthropic's "estimate", partly) and A26 (minimum "around a thousand tokens" is out of date: 512–4,096 now).
- **Not in source:** 1. A12 ("falls gradually"; Chroma says "non-uniform", "surprising").
- **Verified but incomplete in a way that changes teaching:** 2 (A21, A48), both in D1.
- **Unsourced:** 6 (A1, A10, A22, A31, A42, A43).
- **Unreachable:** 0.
- **Re-labelled:** 3 (A11 as a Chroma technical report, A24 as Anthropic's standard rate, A10 as Anthropic's figure).
- **Replaced/updated:** 5 (A26, A46, A47, A45, A3).
- **Sources added (new backing or links):** 9 new backings (A1, A5, A10, A22, A31, A32, A35, A42, A43), plus plain links for already-named sources (Chroma, Anthropic CE post, Breunig, Manus ×2, Anthropic tool-use docs, caching docs, Ollama, Gemini, context-windows, preserved-thinking).

---

## Report: Citation audit: Module 4, Lessons 5-7 (compaction, offloading, just-in-time context)

Scope: `src/content/modules/04-context-and-memory/` `05-compaction-and-summarization/*.mdx`, `06-offloading-context-to-storage/*.mdx` and `07-just-in-time-context-and-dynamic-tool-exposure/*.mdx`. That covers every intro, concept, quiz explanation, recap and sandbox task string. Sources were checked on 2026-09-30. Downloads are in `scratchpad/audit/m4B/`.

Paths in the table are relative to `04-context-and-memory/`, and line numbers are the file's own. None of the proposed edits touch a Pyodide exercise or demo string. They are all in prose or in QuizGroup JSX props, so none of them needs a Pyodide re-run.

Primary sources read:
- arXiv 2508.21433 v3 (PDF, pdftotext).
- arXiv 2607.08032 v1 (PDF).
- Anthropic engineering posts, fetched raw: effective-context-engineering, effective-harnesses-for-long-running-agents, equipping-agents…agent-skills, advanced-tool-use.
- Manus blog (raw HTML).
- Claude docs as `.md`: compaction overview, compaction-threshold, compaction-on-demand, compaction-thinking-blocks, tool-search-tool, tool-reference, prompt-caching, context-editing, memory-tool, strict-tool-use, pricing, models overview.
- OpenAI developer docs (raw HTML): function-calling, tools-tool-search, compaction.
- agentskills.io, agents.md, Cursor "Dynamic context discovery", Factory "Evaluating Context Compression".

### 1. Claims table

| ID | file:line | claim (as written, trimmed) | source given | kind | verdict | evidence (primary source) | recommendation |
|---|---|---|---|---|---|---|---|
| L5-1 | 05/01:250-253 | JetBrains Research compared clearing and summarizing on coding agents "across five model configurations", in "The Complexity Trap" (a NeurIPS 2025 workshop paper) | arXiv 2508.21433 | fact | VERIFIED | Abstract (v3, 27 Oct 2025): "within SWE-agent on SWE-bench Verified across five diverse model configurations". Comments: "v3: DL4C camera-ready version to be presented at the 4th DL4C workshop co-located with NeurIPS '25; … added hybrid context management strategy" | keep. The hybrid figures only exist from v3 onward, so optionally say "(v3)". |
| L5-2 | 05/01:257-259 | Clearing "roughly halved the cost of an unmanaged agent, and matched the summarizing agent's success rate, sometimes slightly exceeding it" | same | effectiveness | VERIFIED | Abstract: "a simple environment observation masking strategy halves cost relative to the raw agent while matching, and sometimes slightly exceeding, the solve rate of LLM summarization" | keep |
| L5-3 | 05/01:260-261 | Summarization calls "came to as much as about 7% of a run's cost" | same | effectiveness | VERIFIED | §5.2: "the direct API cost of generating summaries accounts for up to 7.2% of the total instance cost" (Table 2: Qwen3-Coder 480B 7.20%, Gemini 2.5 Flash 6.71%, …, Qwen3-32B thinking 0.65%) | keep |
| L5-4 | 05/01:261-262 (also 05/01:352 quiz, 05/05:594 recap) | "Agents that were summarizing also ran 13–15% more turns" | same | effectiveness | CONTRADICTED (overgeneralized) | §4.4: "LLM-Summary leads to longer mean trajectory lengths for both Qwen3-Coder 480B and Gemini 2.5 Flash. For Gemini 2.5 Flash … 52 turns, which is a 15% increase over … Observation Masking (44 turns) and 4% over … the Raw Agent … for Qwen3-Coder 480B … 15% compared to the Raw Agent and 13% compared to the Observation Masking strategy." The paper also reports the opposite for Qwen3-32B: "the Observation Masking strategy, rather than the LLM-Summary strategy led to a 13% increase in mean trajectory length compared to the Raw Agent." | soften: the figure holds for two of the five models, and the reverse happened for one |
| L5-5 | 05/01:262-265 | The authors suggest the summaries hid failure signals that would have made the agent stop sooner | same | effectiveness (hypothesis) | VERIFIED | Fig. 4 caption: "LLM-Summary consistently leads to longer trajectories, suggesting they mask failure signals that would otherwise prompt earlier termination." | keep |
| L5-6 | 05/01:266-268 | The hybrid "cost 7% less than clearing alone and 11% less than summarizing alone" | same | effectiveness | VERIFIED (scope missing) | §5.3: "we experiment with … Qwen3-Coder 480B with SWE-agent on SWE-bench Verified-50 … Compared to Observation Masking and LLM-Summary, this approach reduces costs by 7% and 11%, respectively." | re-label: one model, on a 50-task subset |
| L5-7 | 05/01:270-272 | The study covers coding agents with long, noisy outputs; the authors say the result may not hold where outputs are short | same | fact | VERIFIED | §6: "This domain is characterized by long, verbose tool outputs, a condition that naturally favors the efficiency of Observation Masking. Consequently, our findings … may not generalize to domains where agent-environment interactions are more succinct." | keep |
| L5-8 | 05/01:274-277 | Anthropic calls clearing old tool results one of the safest, lightest forms of compaction | Anthropic context-engineering post | practice | VERIFIED | "One of the safest lightest touch forms of compaction is tool result clearing" | keep |
| L5-9 | 05/01:277-279 | Summarizing too aggressively can lose details whose importance only shows later | same | practice | VERIFIED | "overly aggressive compaction can result in the loss of subtle but critical context whose importance only becomes apparent later" | keep |
| L5-10 | 05/02:262-265 | Anthropic recommends tuning for recall first, then trimming | same | practice | VERIFIED | "Start by maximizing recall to ensure your compaction prompt captures every relevant piece of information from the trace, then iterate to improve precision" | keep |
| L5-11 | 05/02:251-252 | Summarizing everything after the task "is also a legitimate form, and some providers recommend it" | none | practice | UNSOURCED (true, but no provider named) | Claude compaction overview: "Use on-demand compaction wherever it is available." The on-demand page says: "The API summarizes every message in the request once." OpenAI compaction docs describe a standalone `/responses/compact` call. | lead with an industry source: name Claude's on-demand compaction |
| L5-12 | 05/02:289-291 | Adding "don't call any tools; reply with text only" to the instructions helps | none | practice | VERIFIED (unlinked) | Claude compaction-threshold docs: "When your request includes `tools`, the model occasionally calls a tool during the internal summarization step instead of writing a summary … set `instructions` to a prompt that explicitly tells the model not to call tools" | keep. The same claim is already cited in 05/04:461-463. |
| L5-13 | 05/02:291-292 | Many APIs let you turn tool use off for a single request | none | fact | VERIFIED | OpenAI function-calling: "You can also set tool_choice to "none" to imitate the behavior of passing no functions." | keep |
| L5-14 | 05/02:293-295 | On some providers, the tool-choice setting is part of what the cache matches | none | fact | VERIFIED | Claude prompt-caching docs: "Changes to `tool_choice` or the presence/absence of images anywhere in the prompt will invalidate the cache". The invalidation table says: "Changes to `tool_choice` parameter only affect message blocks". | re-label: name Claude (optional) |
| L5-15 | 05/02:380-385 | On providers that bind reasoning, "strip them from the kept rounds when you compact on the client, or let the provider compact on its side" | none (links L4) | fact | CONTRADICTED (in part) | Claude compaction overview, row "Kept turns keep their thinking": on-demand gives "Yes, under the conditions in Compaction and preserved thinking"; threshold gives "No: on Claude Fable 5.1, Claude Opus 5.5, and Claude Sonnet 5.5, remove or drop the thinking in turns you re-insert". Only one of the provider's two compaction modes keeps kept-turn thinking valid. The course's own 05/04:457-460 already says the threshold mode has this caveat. | replace (edit E5) |
| L5-16 | 05/02:309-320 region | The summary request goes out with the agent's own system prompt and tools, so it reuses the cache | none (our design) | practice | UNSOURCED (backing exists) | Claude on-demand compaction: "Send the same `system` prompt and `tools` that you use for the rest of the conversation." Complexity Trap §5.2: "these summarization calls are particularly expensive because each requires processing a unique sequence of turns, limiting cache reuse to the LLM-Summary system prompt" | add stronger backing (edit E8, in 05/04) |
| L5-17 | 05/03:495-526 | Test a summary by asking it questions that have fixed-form answers | none | practice | UNSOURCED | Factory, "Evaluating Context Compression for AI Agents" (16 Dec 2025): "We designed a probe-based evaluation that directly measures functional quality. The idea is simple: after compression, ask the agent questions that require remembering specific details from the truncated history." They use four probe types (recall, artifact, continuation, decision) and grade with an LLM judge. | lead with an industry source (Factory) |
| L5-18 | 05/03:552-556 | "a 2026 paper on memory compaction, 'What to Keep, What to Forget', describes compounding loss under repeated summarization as the least-measured failure in this area" | arXiv 2607.08032 | fact | VERIFIED; needs a preprint label | v1 only (9 Jul 2026), no venue. §on agent memory: "under repeated irreversible summarization, end-task error should grow super-linearly … It is also the layer's least-measured failure." The abstract adds: "the repeated compaction that agents actually perform is almost never measured". | re-label: "a 2026 preprint". Optional: its small experiment, on Qwen2.5-1.5B, measured recall near 0.95 with a reversible archive against 0.33-0.56 with repeated summarization. |
| L5-19 | 05/03:530-543 | Folding rewrites every summary on each compaction, so each fold is another chance to drop a fact; append instead | none (+ L5-18) | practice | UNSOURCED (vendor evidence exists) | Factory: "Anthropic regenerates the full summary on each compression, while Factory's anchored approach incrementally merges new information into a persistent summary … by merging new summaries into a persistent state rather than regenerating from scratch, key details are less likely to drift or disappear across multiple compression cycles." This is a vendor's evaluation of its own method, scored by an LLM judge. | optional: add backing, labelled as a vendor evaluation |
| L5-20 | 05/04:315-318 | Claude's server-side compaction defaults to 150,000 input tokens, far below its newest models' 1M windows, "and its documentation gives degrading response quality as the reason" | none | fact | VERIFIED (reason slightly overstated) | Threshold docs table: `trigger` default `{"type": "input_tokens", "value": 150000}`. Models overview: Fable 5.1 / Opus 5.5 / Sonnet 5.5 have "1M tokens". The docs give quality as a reason for compaction itself, not for the default value: "It also keeps the active context small: as a conversation grows, response quality degrades, so compaction replaces older content with a concise summary." | soften wording (edit E9) |
| L5-21 | 05/04:424-426 | "On Claude Opus 5.5 … output tokens cost five times as much as input" | none | fact | VERIFIED | Pricing: Opus 5.5 "$4 / MTok" base input, "$20 / MTok" output (20/4 = 5) | keep |
| L5-22 | 05/04:426-429 | Compacting first stays cheaper only while summaries are under about 650 tokens; "Real summaries … are often longer: Claude's own compaction documentation shows one example compaction producing 3,500 output tokens" | none | effectiveness | VERIFIED as an illustration only | The 3,500 figure is an illustrative JSON in "Understanding usage": `"type": "compaction", "input_tokens": 180000, "output_tokens": 3500`. It is not a measurement. Better evidence, from Factory: Anthropic's SDK compaction "produces detailed, structured summaries (typically 7-12k characters)". The 650 figure is our demo's output and was not re-run. | re-label and add stronger backing (edit E10) |
| L5-23 | 05/04:411-416 | Asking for the summary as a separate call cost about 45% more (our demo) | our demo | our data | our data (fake client, labelled) | Supporting source, Complexity Trap §5.2 (quoted under L5-16) | add stronger backing (edit E8) |
| L5-24 | 05/04:445-463 | Claude threshold compaction: beta, `compact_20260112`, header `compact-2026-01-12`; default 150,000, minimum 50,000; `compaction` block, and the API ignores what came before it; `instructions` replaces the default prompt; `pause_after_compaction`; the model occasionally calls a tool instead of summarizing | none | fact | VERIFIED (all points) | Threshold docs: `betaHeader: compact-2026-01-12`. "`value` must be at least 50,000 tokens". "The API automatically drops all content blocks prior to the `compaction` block". `instructions`: "Completely replaces the default prompt when provided". `pause_after_compaction`: "Whether to pause after generating the compaction summary". The tool-call failure is quoted under L5-12. | keep, but see "Needs a decision" D1: the docs now recommend on-demand compaction (`compact-2026-09-04`) over this mode |
| L5-25 | 05/04:445 (also 05/05:646 distractor) | "Several providers can now compact on their side" | none | practice | VERIFIED (unlinked) | OpenAI compaction docs: "You can enable server-side compaction … by setting context_management with compact_threshold … the server runs server-side compaction." The item it returns "is opaque and not intended to be human-interpretable". | add the OpenAI link and note that its summary is opaque (edit E11) |
| L5-26 | 05/04:473-477 | Sub-agents work in their own context and return only a condensed result | none (Module 8 forward reference) | practice | UNSOURCED (backing exists) | Anthropic context-engineering: "Each subagent might explore extensively, using tens of thousands of tokens or more, but returns only a condensed, distilled summary of its work (often 1,000-2,000 tokens)." | optional: add source |
| L6-1 | 06/01:254-260 (also 06/01:429 quiz, 06/02:416-419) | Manus: an agent can't know which observation will matter ten steps later; make compression restorable, like keeping a page's URL | Manus blog | practice | VERIFIED | "you can't reliably predict which observation might become critical ten steps later. From a logical standpoint, any irreversible compression carries risk … Our compression strategies are always designed to be restorable. For instance, the content of a web page can be dropped from the context as long as the URL is preserved" | keep |
| L6-2 | 06/01:228-252 | Offloading a large result (store, preview, handle, readers) beats truncating it | Manus (principle only) | practice | UNSOURCED as a technique (backing exists) | Cursor, "Dynamic context discovery" (6 Jan 2026): "The common approach coding agents take is to truncate long shell commands or MCP results. This can lead to data loss … In Cursor, we instead write the output to a file and give the agent the ability to read it. The agent calls tail to check the end, and then read more if it needs to. This has resulted in fewer unnecessary summarizations when reaching context limits." | lead with an industry source (edit E12) |
| L6-3 | 06/02:423-468 | Store a record of the rounds before compacting, and have the summary say where it is | none | practice | UNSOURCED (backing exists) | Cursor: "we use the chat history as files to improve the quality of summarization … we give the agent a reference to the history file. If the agent knows that it needs more details that are missing from the summary, it can search through the history to recover them." Supporting, and a preprint: the 2607.08032 reference experiment found a reversible archive near 0.95 recall against 0.33-0.56 for repeated summarization. | lead with an industry source (edit E13) |
| L6-4 | 06/02:521-527 (also 06/04:874-879 quiz, 07/03:292-295) | The model's argument must never become a file path; a "handle" like `../../config/secrets` could read outside the store | Module 3 (least privilege) | practice | UNSOURCED (backing exists) | Claude memory-tool docs, "Path traversal protection": "A malicious path such as `/memories/../../secrets.env` can reach files outside the `/memories` directory. Your implementation must validate every path in every command to prevent directory traversal attacks." | add stronger backing (edit E14) |
| L6-5 | 06/02:476-480 | One store per task; a shared store can leak between users | none | practice | UNSOURCED (low priority) | Memory-tool docs: "The `/memories` path is a prefix that your handler maps onto real storage, such as a per-user directory or keys in a database." | keep (optional source) |
| L6-6 | 06/03:230-236 | Anthropic's long-running harness: compaction "doesn't always pass perfectly clear instructions to the next context"; a progress file plus git history let agents quickly understand the state of the work | Anthropic harness post | practice | VERIFIED | "This happens even with compaction, which doesn't always pass perfectly clear instructions to the next agent." And: "The key insight here was finding a way for agents to quickly understand the state of work when starting with a fresh context window, which is accomplished with the claude-progress.txt file alongside the git history." | keep |
| L6-7 | 06/03:268-272 (also 06/03:407 quiz, 06/04:890 recap) | "they switched from Markdown to JSON, because the model was less likely to inappropriately change or overwrite JSON. They also told agents to change only each feature's pass/fail status" | same | practice | VERIFIED ("switched" is slightly loose) | "We prompt coding agents to edit this file only by changing the status of a passes field … After some experimentation, we landed on using JSON for this, as the model is less likely to inappropriately change or overwrite JSON files compared to Markdown files." | minor re-word: "chose JSON over Markdown" (edit E15) |
| L6-8 | 06/03:249-253 | The plan is "the Manus team's todo-list recitation" | Manus (by name) | practice | VERIFIED | "it tends to create a todo.md file—and update it step-by-step … By constantly rewriting the todo list, Manus is reciting its objectives into the end of the context." | keep |
| L6-9 | 06/03:238-240, 266-279 | Notes the agent keeps outside the conversation | Anthropic harness | practice | VERIFIED (a more direct source exists) | Anthropic context-engineering, "Structured note-taking": "a technique where the agent regularly writes notes persisted to memory outside of the context window. These notes get pulled back into the context window at later times … Like Claude Code creating a to-do list, or your custom agent maintaining a NOTES.md file" | optional: add as the lead practice source |
| L7-1 | 07/01:327-331 (also 07/01:439,443 quiz) | Manus: when earlier actions refer to tools no longer defined, the model gets confused and makes invalid calls | Manus blog | practice | VERIFIED | "When previous actions and observations still refer to tools that are no longer defined in the current context, the model gets confused. Without constrained decoding, this often leads to schema violations or hallucinated actions." | keep |
| L7-2 | 07/01:355-360 (also 07/01:454, 07/05:461) | Claude's tool search keeps deferred tools out of the prefix; a found tool's definition goes inline in the conversation, which keeps the cache | Claude tool-reference docs | fact | VERIFIED | Tool reference: "Tools with `defer_loading: true` are stripped from the rendered tools section before the cache key is computed … the tool's full definition is expanded inline at that point in the conversation body, not in the prefix. This means `defer_loading: true` preserves your prompt cache." | keep |
| L7-3 | 07/01:407-412 (also 07/01:472, 07/05:472) | OpenAI `allowed_tools` names a subset of the tools passed in; the docs give protecting the prompt cache as the reason | OpenAI function-calling docs | fact | VERIFIED | "You might want to configure an allowed_tools list in case you want to make only a subset of tools available across model requests, but not modify the list of tools you pass in, so you can maximize savings from prompt caching." | keep |
| L7-4 | 07/01:412-414 | "With a self-hosted model and constrained decoding, the Manus team masks the tokens that would start a disallowed tool's name" | Manus (by name) | practice | VERIFIED in part | "Rather than removing tools, it masks the token logits during decoding … most model providers and inference frameworks support some form of response prefill … Specified … prefilling up to the beginning of the function name … all browser-related tools start with browser_ … This allows us to easily enforce that the agent only chooses from a certain group of tools". Manus never says "self-hosted". | re-word (edit E16) |
| L7-5 | 07/02:380-390 | Claude tool search: `defer_loading`; the model searches "with a regular expression or with keywords, depending on the variant"; found definitions go into the conversation and are called directly; "The docs report that tool search typically cuts definition tokens by over 85%"; you can return your own search results | Claude tool-search docs | fact / vendor figure | VERIFIED ("keywords" is loose) | Docs: "Tool search typically reduces this by over 85 percent, loading only the 3–5 tools Claude needs." "Regex … Claude constructs regex patterns … BM25 … Claude uses natural language queries". "you can also implement your own client-side tool search". Internally: "the API appends a `tool_reference` block inline in the conversation … The prefix is untouched, so prompt caching is preserved." | keep. The vendor figure is already attributed. Minor: "keywords" should be "a plain-language query" (edit E17). Optional vendor accuracy figure: Anthropic reports MCP-eval accuracy "Opus 4 improved from 49% to 74%, and Opus 4.5 improved from 79.5% to 88.1% with Tool Search Tool enabled" (internal testing). |
| L7-6 | 07/02:392-394 | "OpenAI's API has a tool search feature as well"; same design (fixed prefix, search, definitions loaded into the conversation) | none | fact | VERIFIED (unlinked) | OpenAI tools-tool-search: "tool search is designed to preserve the model's cache. When new tools are discovered by the model, they are injected at the end of the context window. In the Responses API, only gpt-5.4 and later models support tool_search." | add link (edit E18) |
| L7-7 | 07/02:276-278 | Many providers can enforce a tool's schema on the model's output | none | fact | VERIFIED (unlinked) | Claude strict tool use: "Setting `strict: true` on a tool definition guarantees Claude's tool inputs match your JSON Schema". OpenAI: "strict — Whether to enforce strict mode for the function call". | keep (optional links) |
| L7-8 | 07/02:259-264 | Keyword search is "crude, and for a catalog of well-named tools … it works well" | none | effectiveness | UNSOURCED | Nothing in the sources measures it. Nearest industry anchor: Claude offers a BM25 variant, and OpenAI recommends namespaces "Our models have primarily been trained to search those surfaces". Claude's docs advise: "Use consistent namespacing in tool names: prefix by service or resource … so one search matches the whole group." | soften (edit E19) |
| L7-9 | 07/02 (whole concept) | Tools on demand behind a fixed prefix | Claude docs | practice | VERIFIED; one more industry anchor available | Cursor: "The agent now only receives a small bit of static context, including names of the tools, prompting it to look up tools when the task calls for it. In an A/B test, we found that in runs that called an MCP tool, this strategy reduced total agent tokens by 46.9%" (vendor A/B test) | optional: add (vendor figure) |
| L7-10 | 07/03:195-206 (also quizzes 07/03:320-328, 07/05:508-516) | Agent Skills use progressive disclosure, "the core design principle that makes them flexible and scalable"; three levels | Anthropic Agent Skills post | practice | VERIFIED | "Progressive disclosure is the core design principle that makes Agent Skills flexible and scalable." "At startup, the agent pre-loads the name and description of every installed skill into its system prompt. This metadata is the first level … The actual body of this file is the second level … If Claude thinks the skill is relevant … it will load the skill by reading its full SKILL.md". The post goes on to describe additional bundled files, read only as needed. | keep |
| L7-11 | 07/03:289-291 | Anthropic: install skills only from trusted sources, and audit anything less trusted | same | practice | VERIFIED | "We recommend installing skills only from trusted sources. When installing a skill from a less-trusted source, thoroughly audit it before use." | keep |
| L7-12 | 07/03:305-310 | Agent Skills are an open standard, and Claude's apps, Claude Code and its API support them | agentskills.io | fact | VERIFIED | The post's 18 Dec 2025 update: "We've published Agent Skills as an open standard for cross-platform portability." Also: "Agent Skills are supported today across Claude.ai, Claude Code, the Claude Agent SDK, and the Claude Developer Platform." agentskills.io: "originally developed by Anthropic, released as an open standard, and has been adopted by a growing number of agent products." Cursor's post lists "Supporting the Agent Skills open standard". | keep. Optional: say other products have adopted it. |
| L7-13 | 07/03:275-277 | "like the tool exclusions some providers' clearing supports" | none | fact | VERIFIED (unlinked) | Claude context-editing: `exclude_tools`: "List of tool names whose tool uses and results should never be cleared. Useful for preserving important context." | keep (optional: name Claude's `exclude_tools`) |
| L7-14 | 07/04:265-271 | Anthropic's guide "describes the alternative many agents have moved to": lightweight references (paths, queries, links), loaded with tools while working; coding agents list, grep and read | Anthropic context-engineering post | practice | VERIFIED ("moved to" overstates) | "we increasingly see teams augmenting these retrieval systems with "just in time" context strategies. Rather than pre-processing all relevant data up front, agents built with the "just in time" approach maintain lightweight identifiers (file paths, stored queries, web links, etc.) and use these references to dynamically load data into context at runtime using tools." | soften (edit E20) |
| L7-15 | 07/04:271-273 | Manus: the file system is context "unlimited in size", read and written on demand | Manus (by name) | practice | VERIFIED | "we treat the file system as the ultimate context in Manus: unlimited in size, persistent by nature, and directly operable by the agent itself. The model learns to write to and read from files on demand" | keep |
| L7-16 | 07/04:338-344 | "That hybrid is how most agents that explore are set up"; Claude Code loads `CLAUDE.md` at the start and explores the code with search and read tools | none | practice | CLAUDE.md part VERIFIED; "most" UNSOURCED | Anthropic context-engineering: "the most effective agents might employ a hybrid strategy, retrieving some data up front for speed … Claude Code is an agent that employs this hybrid model: CLAUDE.md files are naively dropped into context up front, while primitives like glob and grep allow it to navigate its environment and retrieve files just-in-time". agents.md: "A simple, open format for guiding coding agents, used by over 60k open-source projects." | soften "most" and cite (edit E21) |
| L7-17 | 07/01:261-264 | (callback to Module 3) Tens of thousands of tokens of definitions from a few servers; worse tool choices beyond a few dozen tools | Module 3 | effectiveness | VERIFIED (vendor figure) | Claude tool-search docs: "A typical multiserver setup (GitHub, Slack, Sentry, Grafana, and Splunk) can consume ~55k tokens in definitions … Claude's ability to pick the right tool degrades once you exceed 30–50 available tools." | keep (Module 3's audit owns the source) |

Other checks:
- The demo figures are the course's own simulations on the fake client. They include 710 vs 100 tokens a round, 19→5 messages, 45% more, 650 tokens, 7,326/490, 23,276/…, 6,406 vs 18,930, 3,074→106, and "over ten times". Each is already framed as a scripted demo ("the fake client isn't a model", "the calls are scripted", "Costs are in Lesson 3's token-units"). I did not re-run them.
- MemGPT, LangChain/LangGraph memory, RAG-MCP and Claude Code's auto-compact are not named anywhere in these three lessons.

### 2. Proposed edits

All of these are prose or quiz JSX props. None is inside an exercise or demo string, so none needs a Pyodide re-run.

**E1 (L5-4). File `05-compaction-and-summarization/01-what-clearing-cant-do.mdx`, lines 260-265.**

Current:
```
- **Summaries cost twice.** The summarization calls themselves came to as
  much as about 7% of a run's cost. Agents that were summarizing also ran
  13–15% more turns. The authors suggest the summaries hid failure signals
```
Proposed:
```
- **Summaries cost twice.** The summarization calls themselves came to as
  much as about 7% of a run's cost. With two of the five models, agents
  that were summarizing also ran 13–15% more turns than clearing ones
  (with a third, the clearing agent ran longer). The authors suggest the summaries hid failure signals
```

**E2 (L5-4, quiz). Same file, line 352.**

Current:
```
"explanation": "The summary calls came to as much as about 7% of a run's cost, and trajectories were 13–15% longer. The authors' explanation
```
Proposed:
```
"explanation": "The summary calls came to as much as about 7% of a run's cost, and with two of the five models, summarizing agents ran 13–15% more turns. The authors' explanation
```

**E3 (L5-4, recap). File `05-compaction-and-summarization/05-recap-practice.mdx`, line 594.**

Current:
```
"explanation": "Summaries cost extra calls, and summarizing agents ran 13–15% longer. The study covers
```
Proposed:
```
"explanation": "Summaries cost extra calls, and with two of the five models, summarizing agents ran 13–15% more turns. The study covers
```

Related wording to check: `05/04:436-437` says "in the JetBrains study, summarizing agents also [ran longer]", and the `05/04:526` quiz option says "summarizing agents ran longer in the JetBrains study". Both are acceptable with E1 in place. For extra precision, `05/04:436` could read "summarizing agents often [ran longer]".

**E4 (L5-6). File `05-compaction-and-summarization/01-what-clearing-cant-do.mdx`, lines 266-268.**

Current:
```
- **The best result combined them.** Clearing first, with summarization
  held back as a last resort, cost 7% less than clearing alone and 11%
  less than summarizing alone.
```
Proposed:
```
- **The best result combined them.** In a smaller follow-up with one
  model, on 50 of the tasks, clearing first, with summarization held back
  as a last resort, cost 7% less than clearing alone and 11% less than
  summarizing alone.
```
The `05/05:590` recap option ("the best result cleared first and summarized only as a last resort") is fine as it stands.

**E5 (L5-15, contradicted in part). File `05-compaction-and-summarization/02-compacting-a-summary-in-rounds-out.mdx`, lines 384-385.**

Current:
```
strip them from the kept rounds when you compact on the client, or let the
provider compact on its side.
```
Proposed:
```
strip them from the kept rounds when you compact on the client. Provider
compaction doesn't always avoid this: Claude's
[on-demand compaction](https://platform.claude.com/docs/en/build-with-claude/compaction)
keeps the kept rounds' thinking valid under conditions its docs list, but
its threshold compaction doesn't.
```

**E6 (L5-11). Same file, lines 251-252.**

Current:
```
Keeping no rounds at all, and summarizing everything after the task, is
also a legitimate form, and some providers recommend it. But it's only
```
Proposed:
```
Keeping no rounds at all, and summarizing everything after the task, is
also a legitimate form. It's what Claude's
[on-demand compaction](https://platform.claude.com/docs/en/build-with-claude/compaction-on-demand)
does by default, and its docs recommend that mode. But it's only
```

**E7 (L5-17). File `05-compaction-and-summarization/03-when-a-summary-loses-something.mdx`, lines 497-499.**

Current:
```
To check what a summary *says*, ask it. Write down the questions the agent
must still be able to answer after compaction, give a model the summary and
nothing else, and see whether it answers them correctly.
```
Proposed:
```
To check what a summary *says*, ask it. Factory, which builds coding
agents,
[evaluates its compaction this way](https://factory.ai/news/evaluating-compression):
after compressing, it asks questions that need specific details from the
removed history (the original error, which files changed, what was
decided, what's next). Write down the questions the agent must still be
able to answer after compaction, give a model the summary and nothing
else, and see whether it answers them correctly.
```

**E8 (L5-16 / L5-23). File `05-compaction-and-summarization/04-when-to-compact-and-what-it-costs.mdx`, lines 415-416.**

Current:
```
  the agent's own prefix with instructions added at the end. The separate
  call can't reuse anything the agent's requests cached.
```
Proposed:
```
  the agent's own prefix with instructions added at the end. The separate
  call can't reuse anything the agent's requests cached. The JetBrains
  study saw the same cost: each summary call there reused only its own
  system prompt from the cache. Claude's on-demand compaction asks you to
  send the conversation's own system prompt and tools with the summary
  request.
```

**E9 (L5-20). Same file, lines 315-318.**

Current:
```
  Claude's server-side compaction, for example, defaults to triggering at
  150,000 input tokens, far below its newest models' 1M-token windows, and
  its documentation gives degrading response quality as the reason. Where
```
Proposed:
```
  Claude's threshold compaction, for example, defaults to triggering at
  150,000 input tokens, far below its newest models' 1M-token windows. Its
  documentation says compaction keeps the active context small because
  response quality degrades as a conversation grows. Where
```

**E10 (L5-22). Same file, lines 426-429.**

Current:
```
  about 650 tokens. Real summaries of long agent runs are often longer:
  Claude's own compaction documentation shows one example compaction
  producing 3,500 output tokens.
```
Proposed:
```
  about 650 tokens. Real summaries of long agent runs are often longer.
  Factory
  [reports](https://factory.ai/news/evaluating-compression) that the
  summaries Claude's SDK writes typically run to 7,000–12,000 characters,
  and an illustrative example in Claude's compaction docs shows 3,500
  output tokens.
```

**E11 (L5-25). Same file, lines 445-447.**

Current:
```
Several providers can now compact on their side. Claude's API, for
example, has **compaction at a token threshold** (a beta, the
`compact_20260112` strategy with the `compact-2026-01-12` header):
```
Proposed. This depends on decision D1; this version keeps the threshold detail:
```
Several providers can now compact on their side.
[OpenAI's Responses API](https://developers.openai.com/api/docs/guides/compaction)
compacts once a `compact_threshold` is crossed, into an item that isn't
meant to be read. Claude's API has two modes. Its docs recommend
[compaction on demand](https://platform.claude.com/docs/en/build-with-claude/compaction-on-demand),
where you ask for a readable summary when you choose. The other is
**compaction at a token threshold** (a beta, the `compact_20260112`
strategy with the `compact-2026-01-12` header):
```

**E12 (L6-2). File `06-offloading-context-to-storage/01-keep-the-reference-not-the-result.mdx`, lines 259-260.**

Current:
```
from the context as long as its URL is kept. Offloading is that rule
applied to tool results.
```
Proposed:
```
from the context as long as its URL is kept. Offloading is that rule
applied to tool results. It's what
[Cursor's agent does](https://cursor.com/blog/dynamic-context-discovery)
with long shell and MCP output: rather than truncate it, it writes the
output to a file and lets the agent read it. The team reports fewer
unnecessary summarizations as a result.
```

**E13 (L6-3). File `06-offloading-context-to-storage/02-clearing-and-compaction-that-can-be-undone.mdx`, lines 428-429.**

Current:
```
rounds it replaces is still gone. It doesn't have to be. Before compacting,
store a plain record of those rounds, and have the summary say where it is:
```
Proposed:
```
rounds it replaces is still gone. It doesn't have to be.
[Cursor](https://cursor.com/blog/dynamic-context-discovery), for example,
keeps the chat history as a file and points the agent at it after a
summary, so a missing detail can be searched for. Before compacting,
store a plain record of those rounds, and have the summary say where it is:
```

**E14 (L6-4). Same file, lines 524-527.**

Current:
```
  "handle" like `../../config/secrets` would otherwise read files outside
  the store. That's the least-privilege rule from
  [Module 3](/03-tool-design-for-agents/11-designing-for-least-privilege/00-intro/)
  applied to one argument.
```
Proposed:
```
  "handle" like `../../config/secrets` would otherwise read files outside
  the store. Claude's
  [memory tool docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)
  warn about exactly this path trick. That's the least-privilege rule from
  [Module 3](/03-tool-design-for-agents/11-designing-for-least-privilege/00-intro/)
  applied to one argument.
```

**E15 (L6-7). File `06-offloading-context-to-storage/03-notes-the-agent-keeps.mdx`, lines 269-270.**

Current:
```
their list of features to build, they switched from Markdown to JSON,
because the model was less likely to inappropriately change or overwrite
```
Proposed:
```
their list of features to build, they chose JSON over Markdown,
because the model was less likely to inappropriately change or overwrite
```

**E16 (L7-4). File `07-just-in-time-context-and-dynamic-tool-exposure/01-what-you-load-and-where-it-goes.mdx`, lines 412-414.**

Current:
```
protecting the prompt cache as the reason. With a self-hosted model and
constrained decoding, the Manus team masks the tokens that would start a
disallowed tool's name, which has the same effect.
```
Proposed:
```
protecting the prompt cache as the reason. Where it controls decoding, the
Manus team masks the tokens that would start a disallowed tool's name, and
gives related tools a shared prefix (`browser_`, `shell_`) so one mask
covers a group. That has the same effect.
```

**E17 (L7-5). File `07-just-in-time-context-and-dynamic-tool-exposure/02-tools-on-demand.mdx`, lines 382-383.**

Current:
```
- **The model searches** with a regular expression or with keywords,
  depending on the variant.
```
Proposed:
```
- **The model searches** with a regular expression or with a plain-language
  query, depending on the variant.
```

**E18 (L7-6). Same file, lines 392-394.**

Current:
```
OpenAI's API has a tool search feature as well. The design underneath is
```
Proposed:
```
[OpenAI's API has a tool search feature](https://developers.openai.com/api/docs/guides/tools-tool-search)
as well, and its docs say it adds found tools at the end of the context to
keep the cache. The design underneath is
```

**E19 (L7-8). Same file, lines 259-264.**

Current:
```
Search here is keyword matching: a tool scores one point for each word of
the query that appears in its name or description. It's crude, and for a
catalog of well-named tools with
[descriptions written as prompts](/03-tool-design-for-agents/01-designing-tools-a-model-can-use-well/01-names-and-descriptions-as-prompts/)
it works well. Searching by meaning instead of by words is Module 5's
subject.
```
Proposed:
```
Search here is keyword matching: a tool scores one point for each word of
the query that appears in its name or description. It's crude, and it
depends on a catalog of well-named tools with
[descriptions written as prompts](/03-tool-design-for-agents/01-designing-tools-a-model-can-use-well/01-names-and-descriptions-as-prompts/).
Claude's tool search docs give the same advice: prefix tool names by
service, so one search finds the whole group. Searching by meaning instead
of by words is Module 5's subject.
```

**E20 (L7-14). File `07-just-in-time-context-and-dynamic-tool-exposure/04-data-on-demand.mdx`, lines 266-267.**

Current:
```
[guide to context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
describes the alternative many agents have moved to. The agent keeps
```
Proposed:
```
[guide to context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
describes an alternative more and more teams are adding. The agent keeps
```

**E21 (L7-16). Same file, lines 339-344.**

Current:
```
workspace holds, in one line: logs in one folder, configs in another. That
**hybrid** is how most agents that explore are set up. A little is loaded
up front: what exists, how it's laid out, and the conventions that always
apply. Everything else is found when needed. Claude Code works this way:
a project's `CLAUDE.md` file is loaded at the start of every session, and
the code itself is explored with search and read tools.
```
Proposed:
```
workspace holds, in one line: logs in one folder, configs in another.
Anthropic's guide calls this a **hybrid**, and it's a common set-up. A
little is loaded up front: what exists, how it's laid out, and the
conventions that always apply. Everything else is found when needed.
Claude Code works this way: a project's `CLAUDE.md` file is loaded at the
start of every session, and the code itself is explored with search and
read tools. [`AGENTS.md`](https://agents.md/) is the same idea as an open
format that many coding agents read.
```

**E22 (L5-18). File `05-compaction-and-summarization/03-when-a-summary-loses-something.mdx`, lines 552-553.**

Current:
```
How much this happens with real models isn't well measured yet: a 2026
paper on memory compaction,
```
Proposed:
```
How much this happens with real models isn't well measured yet: a 2026
preprint on memory compaction,
```

Optional additions (all verified above): L5-19 Factory's merge-vs-regenerate finding, labelled as a vendor evaluation; L5-26 Anthropic's subagent quote; L6-9 Anthropic's "structured note-taking"; L7-5 Anthropic's tool-search accuracy figures (vendor, internal testing); L7-9 Cursor's 46.9% (vendor A/B); L7-13 naming Claude's `exclude_tools`.

### 3. Needs a decision

- **D1. Should Lesson 5's "Letting the provider compact" teach Claude's on-demand compaction, not only the threshold mode?** Claude's compaction overview now says "Use on-demand compaction wherever it is available". Its header is `compact-2026-09-04`: you request a readable summary when you choose, send the same system prompt and tools, and can keep recent turns, with their thinking valid under conditions. `05/04:443-467` and its quiz (`05/04:531-540`) describe only the threshold mode (`compact-2026-01-12`). Everything the page says about that mode is still accurate. On-demand compaction also matches this lesson's own design better: the client decides when to compact, keeps recent turns, and reuses the agent's prefix. Recommendation: keep the threshold bullets, lead with a short on-demand bullet (E11 wording), and leave the quiz as it is.
- **D2 (outside my scope, flagged for consistency).** Lesson 12 (`12-assembling-the-context-step/04-what-to-leave-out.mdx:962`) says "on long enough runs, [fold the summaries]". Lesson 5 (`05/03:530-561`) teaches appending over folding and treats rewriting as a deliberate, occasional step. The two may be consistent, since Lesson 5 allows a deliberate rewrite, but a reader could see a contradiction. Factory's vendor evaluation favours not regenerating the whole summary each time. Recommendation: the Lesson 12 auditor should check that the wording matches Lesson 5's "deliberate step" framing.
- Softening L5-4 (13–15% in two of five models) does not change what the concept teaches: clear first, summarize as a last resort. That rests on cost, solve-rate parity and lossiness, which all still hold. No decision is needed.

### 4. Counts

- Claims inventoried: 44 rows (L5-1…26, L6-1…9, L7-1…17). The same figures were also found in 6 quiz or recap places.
- VERIFIED: 34 (fully, or with a small wording fix). This includes 9 unlinked facts that turned out true: L5-12, L5-13, L5-14, L5-24, L5-25, L7-6, L7-7, L7-13 and L7-17.
- CONTRADICTED: 2, both in part. L5-4: "13–15% more turns" holds for 2 of 5 models, and one model shows the reverse. L5-15: "let the provider compact on its side" is wrong for Claude's threshold mode.
- NOT REACHABLE: 0.
- UNSOURCED: 8. Six can take an industry source: L5-11, L5-16, L5-17, L6-2, L6-3 and L6-4. Two should be softened: L7-8 ("works well") and the "most agents" part of L7-16. Plus 3 low-priority rows (L5-19, L5-26, L6-5) where a source is optional.
- Re-labelled (proposed): 5. L5-6 (one model, 50 tasks), L5-18 (preprint), L5-20 (reason wording), L5-22 (illustrative example) and L7-4 (Manus, not "self-hosted").
- Replaced (proposed): 1. L5-22's main support moves from the illustrative docs example to Factory's reported summary length, which is a vendor figure.
- Added sources (proposed): 10.
  - Claude on-demand compaction docs (E5, E6, E8, E11)
  - OpenAI compaction docs (E11)
  - OpenAI tool-search docs (E18)
  - Factory's compression evaluation (E7, E10)
  - Cursor's dynamic context discovery post (E12, E13)
  - Claude memory-tool docs on path traversal (E14)
  - Complexity Trap §5.2 on cache reuse (E8)
  - Claude tool-search naming advice (E19)
  - agents.md (E21)
  - Anthropic context-engineering on the hybrid (E21)

---

## Report: Citation audit: Module 4, Lessons 8 to 11 (long-term memory)

Scope: every `.mdx` in `src/content/modules/04-context-and-memory/` `08-long-term-memory`, `09-building-a-memory-store`, `10-deciding-what-to-remember` and `11-forgetting-aging-and-retrieval-quality`, including intros, quiz explanations and recaps. Read-only; no repo files were edited. Downloads are in `scratchpad/audit/m4C/`.

Paths below are relative to `src/content/modules/04-context-and-memory/`. L8 = `08-long-term-memory`, L9 = `09-building-a-memory-store`, L10 = `10-deciding-what-to-remember`, L11 = `11-forgetting-aging-and-retrieval-quality`.

Overall: the lessons cite sources sparingly, and every linked source says what it's cited for. Nothing is contradicted. The problems are:

- one link is dead in effect (the Letta core-memory URL now redirects to a generic page)
- a few small overstatements ("generally available", "fitted to", "closely imitate" without its condition)
- the Xiong et al. paper is now published at ACL 2026, so the link should move off arXiv
- most practice claims (namespaces, hot path vs background writes, what not to store, user controls, deletion, consolidation) have no industry source, and good ones exist: LangGraph/LangMem docs, Claude's and ChatGPT's memory help pages, Anthropic's memory-tool docs, and OWASP's Top 10 for Agentic Applications (ASI06, Memory & Context Poisoning)

Nothing uses our Qwen3.5 reliability data. All figures in these lessons (35×, 39% / 24% / 8% / 13%, "about ten weeks", recall@k results) come from the lessons' own scripted, fake-client demos. Each is labelled as made up or scripted where it appears ("the memories and calls are made up", "(the candidates ... are scripted)"). I recomputed 0.99^69 = 0.50 ("about ten weeks" is 9.9 weeks), which is correct.

### 1. Claims table

| ID | file:line | claim (trimmed) | source given | kind | verdict | evidence (primary source) | recommendation |
|---|---|---|---|---|---|---|---|
| 1 | L8/01:112-115 | LangGraph has a *checkpointer* (one thread's state, to resume) and a separate *store* (memories across threads, under namespaces such as a user id) | none (named) | fact | VERIFIED | LangGraph persistence docs: "Checkpointers persist a thread's graph state as checkpoints. Use them for short-term, thread-scoped memory… Stores persist application-defined data outside the graph state. Use them for long-term, cross-thread memory, including user preferences, facts, and shared knowledge." LangChain memory overview: "Namespaces often include user or org IDs". | add link (docs.langchain.com/oss/python/langgraph/persistence) |
| 2 | L8/01:115-117 | Letta (the successor to the MemGPT research project) splits memory into *core* (always in the prompt) and *recall* and *archival* (searched when needed) | none (named) | fact | VERIFIED, but describes Letta's older model | Letta README: "Letta (f.k.a. MemGPT)"; Letta blog 23 Sep 2024 "MemGPT Is Now Part of Letta". MemGPT paper (arXiv 2310.08560v2) names "Recall Storage" and "Archival Storage". Letta v1-SDK docs (now labelled "V1 SDK (legacy)"): memory blocks "are always visible - no retrieval needed"; archival memory "cannot be pinned to the context window, and must be queried on-demand via tools". Letta's **current** Agent SDK docs: "Files under system/ are in the system prompt every turn. Everything else stays out of context — the agent sees the file tree and reads what it needs." The name "recall memory" doesn't appear in the current docs. | re-word slightly and link (see E1). The split the course draws still holds. |
| 3 | L8/01:137-145 | Whole transcript = 35× the three-memory version; conflicting look-alike context is what "Lesson 2's evidence found models handle worst" | our demo; link to L2 | our data + effectiveness (cross-ref) | OK (our data). Cross-ref is consistent with Chroma | Chroma "Context Rot": "Even a single distractor reduces performance relative to the baseline… adding four distractors compounds this degradation further." Chroma's own LongMemEval test, on this exact case (a full chat history vs only the relevant parts): "observe consistent performance degradation with the full inputs. This performance drop suggests that adding irrelevant context… significantly impacts a model's ability to maintain reliable performance." | add stronger backing: cite Chroma's LongMemEval result directly here, since it is the whole-transcript case (E2). The L2 wording itself belongs to the L2 auditor. |
| 4 | L8/01:149-156 | "Several assistants do this for past conversations": old transcripts kept out of context and searched with a tool | none | practice | UNSOURCED (true) | Claude help ("Use Claude's chat search and memory…"): "You can prompt Claude to search through your previous conversations… These searches use Retrieval-Augmented Generation (RAG) and will appear as tool calls during your conversations." ChatGPT FAQ (Wayback 2026-09-24) has "Reference chat history", which isn't described as a tool. | lead with an industry source: name Claude's past-chat search (E3) |
| 5 | L8/01:185-195 | Products that remember well tell the user when something is saved; let them see, correct and delete it; let them switch it off; keep sensitive details only on purpose | none | practice | UNSOURCED (true) | Claude help: "See exactly what Claude remembers about you in Settings > Memory… use the edit icon to change it or select 'Delete'"; "Pause memory… Reset memory: Permanently deletes all memories"; incognito chats; "By default, Claude does not store topics related to personal or sensitive subject matter, like your health…"; "Each time Claude saves something on one of these topics, a notice appears". LangChain memory overview (hot path): "It also enables transparency, as users can be notified when memories are created and stored." ChatGPT memory FAQ: controls "Memory, Reference saved memories, Reference chat history… Manage", temporary chat. | lead with an industry source (E4) |
| 6 | L8/02:226-231 | The write path "is the hardest of the four to get right" | none | practice/opinion | UNSOURCED | LangMem conceptual guide: "The system must reconcile new information with previous beliefs, either deleting / invalidating or updating / consolidating existing memories. If the system over-extracts, this could lead to reduced precision… If it under-extracts, this could lead to low recall." | keep as framing. Optionally soften to "and it's where most of the difficulty is" (E5). Low priority. |
| 7 | L8/02:255-261 | Retrieval "when" has three common answers: session start, each turn, on demand | none | practice | UNSOURCED (acceptable) | Supported by Anthropic's memory-tool docs (on demand) and LangGraph docs. Not critical. | keep |
| 8 | L8/03:273-278 | "The standard way to divide an agent's memory comes from" CoALA (Sumers, Yao, Narasimhan and Griffiths), which adapted a long-standing split from cognitive science; working memory + episodic/semantic/procedural | arXiv 2309.02427 | practice + fact | VERIFIED | CoALA v3 (TMLR camera-ready, "Published in Transactions on Machine Learning Research (02/2024)"), authors Theodore R. Sumers, Shunyu Yao, Karthik Narasimhan, Thomas L. Griffiths. §4.1: "These include short-term working memory and several long-term memories: episodic, semantic, and procedural." §2: "Building on psychological theories, Soar uses several types of memory… Long term memory is divided into three distinct types." Industry uptake: LangChain memory overview: "Some research (e.g., the CoALA paper) have even mapped these human memory types to those used in AI agents", followed by a Semantic/Episodic/Procedural table. | lead with an industry source (E6). "Standard" is justified by LangChain's and LangMem's adoption, so show that. Also note it is peer-reviewed (TMLR). |
| 9 | L8/03:285-287 | In the paper, procedural memory is knowledge in the model's weights and the agent's code | CoALA | fact | VERIFIED | §4.1: "Language agents contain two forms of procedural memory: implicit knowledge stored in the LLM weights, and explicit knowledge written in the agent's code." | keep |
| 10 | L8/03:287-288 | LangMem also stores learned procedures as instructions in the agent's prompt | none (named) | fact | VERIFIED | LangMem guide, "Procedural Memory: System Instructions": "It starts with system prompts that define core behavior, then evolves through feedback and experience. As the agent interacts with users, it refines these instructions". LangChain overview: "procedural memory is a combination of model weights, agent code, and agent's prompt… it is more common for agents to modify their own prompts." | add link (E6) |
| 11 | L8/03:305-306 | LangMem files a user's preferences as semantic facts | none (named) | fact | VERIFIED | LangMem guide, Types of Memory table: "Semantic \| Facts & Knowledge \| User preferences; knowledge triplets". | add link (same as E6) |
| 12 | L8/03:362-364; quiz L8/03:433; recap L8/04:321 | The paper: writing to procedural memory is much riskier than the other kinds, because it can introduce bugs or let an agent subvert its designers' intentions | CoALA | fact | VERIFIED | §4.1: "while learning new actions by writing to procedural memory is possible (Section 4.5), it is significantly riskier than writing to episodic or semantic memory, as it can easily introduce bugs or allow an agent to subvert its designers' intentions." | keep |
| 13 | L9/01:473-475 | "The usual way to hold several scopes is a namespace on every memory, such as (organization, scope, owner)" | none | practice | UNSOURCED (true) | LangChain memory overview: "Each memory is organized under a custom namespace (similar to a folder)… Namespaces often include user or org IDs". LangMem: "Multi-Level Namespaces: Group memories by organization, user, application… namespace = ("acme_corp", "{user_id}", "code_assistant")". | lead with an industry source (E7) |
| 14 | L9/01:481-492 | Who the session is comes from the login, never the model; shared scopes need stricter writes, enforced by access control, not the prompt | none | practice | UNSOURCED (true) | LangMem: "Namespaces can include template variables (such as "{user_id}") to be populated at runtime from configurable fields in the RunnableConfig." OWASP Top 10 for Agentic Applications 2026 (Dec 2025), ASI06 mitigations: "Memory segmentation: Isolate user sessions and domain contexts…"; "Where you operate shared vector or memory stores, use per-tenant namespaces"; attack scenario 5 "Cross-tenant vector bleed… exploits loose namespace filters". | add stronger backing (E7, same edit) |
| 15 | L9/02:525-529 | Letta (formerly MemGPT) "core memory" blocks are pinned to the context window, have length limits, and are edited with tools like `memory_replace` | docs.letta.com/guides/ade/core-memory | fact | VERIFIED in the archived page (Wayback 2026-01-16); **live link now redirects to a generic page** | The live URL 302s to `docs.letta.com/v1-sdk/ade` (an ADE overview that doesn't support the claim). Wayback copy: "Core memory is comprised of memory blocks - text segments that are: Pinned to the context window… memory_replace: Replace content in a memory block". Current equivalent, `docs.letta.com/v1-sdk/memory/memory-blocks/`: "Memory blocks (core memory)… They are always visible - no retrieval needed. Under the hood, memory blocks are simply prepended to the agent's prompt"; "A limit, which is the size limit (in characters) of the block". `docs.letta.com/v1-sdk/memory/context-hierarchy/`: "Memory Blocks… Tools: memory_rethink memory_replace memory_insert". | replace link (E8) |
| 16 | L9/02:529 | Claude's memory tool has similar edit commands, working on files | none | fact | VERIFIED | Memory tool docs: commands "view create str_replace insert delete rename"; str_replace "Replaces text in a file". | keep |
| 17 | L9/02:592-594 | "Real systems often combine them" (block + tools + pipeline) | none | practice | UNSOURCED | LangChain memory overview: writing "In the hot path" ("allows for real-time updates… users can be notified") vs "In the background" ("eliminates latency… Determining the frequency of memory writing becomes crucial"). LangMem: "Conscious Formation" / "Subconscious Formation". Letta Agent SDK: in-context `system/` memory plus "Dreaming uses background subagents to review recent conversations, consolidate lessons, and update memory". | lead with an industry source (E9) |
| 18 | L9/03:568-569; recap L9/04:435 | Keeping the block in the system prompt, rebuilt on each edit, "is the design Letta uses" | none | fact | VERIFIED | Letta v1 docs: "memory blocks are simply prepended to the agent's prompt"; API has an agent "Recompile" call. Letta Agent SDK: "Files under system/ are in the system prompt every turn." | keep. Optionally link the memory-blocks page. |
| 19 | L9/03:537-561 | Placement costs +39% / +24% / +8% / +13% | our demo | our data | OK | Labelled: "Costs are in Lesson 3's token-units with its example multipliers, and the memories and calls are made up." Fake client, no model, so no model or case count applies. | keep |
| 20 | L9/03:616-617 | Claude's memory tool "is generally available, with no beta header" | platform.claude.com memory-tool | fact | PARTLY VERIFIED (re-label) | Docs: "the memory tool itself doesn't require a beta header". Release notes, 17 Feb 2026: "The code execution tool, web fetch tool, tool search tool, tool use examples, and memory tool no longer require a beta header." Neither page says "generally available". The SDK helpers still live in "each SDK's beta namespace". | re-label: say "no longer needs a beta header" (E10) |
| 21 | L9/03:620-631; quiz :685-693; recap L9/04:438-446 | Works on files under `/memories`; runs client-side; the handler maps `/memories` onto e.g. a per-user directory and rejects paths outside it; model checks its memory directory before starting a task; reads arrive as tool results | memory-tool docs | fact | VERIFIED | "When the memory tool is enabled, Claude automatically checks its memory directory before starting a task." "The memory tool operates client-side: Claude requests file operations, and your application executes them." "The /memories path is a prefix that your handler maps onto real storage, such as a per-user directory or keys in a database." "Your handler must reject paths outside /memories". The API "automatically adds this instruction to the system prompt… ALWAYS VIEW YOUR MEMORY DIRECTORY BEFORE DOING ANYTHING ELSE." | keep |
| 22 | L10/01:299-302 | Mem0 runs an extraction phase that pulls salient facts out of each exchange before deciding what to do with them | arXiv 2504.19413 | practice | VERIFIED | Mem0 (v1, 28 Apr 2025; published ECAI 2025, IOS Press doi 10.3233/FAIA251160; authors are Mem0 staff): "the complete pipeline architecture consists of two phases: extraction and update… The function φ(P) then extracts a set of salient memories… specifically from the new exchange". | keep. Optionally note it's Mem0's own paper. It's cited for mechanism only, so no vendor-figure label is needed. |
| 23 | L10/01:329-333 | Ask the model for the exact words each memory rests on, and have code check them | none | practice | UNSOURCED (the pattern has an industry anchor) | Anthropic, "Reduce hallucinations": "Verify with citations: Make Claude's response auditable by having it cite quotes and sources for each of its claims. You can also have Claude verify each claim by finding a supporting quote after it generates a response. If it can't find a quote, it must retract the claim." | lead with an industry source (E11) |
| 24 | L10/02:443-446 | Mem0's update phase: for each new fact it retrieves similar stored memories, and a model picks ADD, UPDATE, DELETE (remove a contradicted memory) or NOOP | arXiv 2504.19413 | practice | VERIFIED | "For each fact, the system first retrieves the top s semantically similar memories… The LLM itself determines which of four distinct operations to execute: ADD… UPDATE… DELETE for removal of memories contradicted by new information; and NOOP". | keep |
| 25 | L10/02:459; quiz L10/02:590 | "Where Mem0 deletes a contradicted memory, this store keeps it and marks it" | Mem0 | practice | VERIFIED for base Mem0; **incomplete** | Mem0's own graph variant does what this store does: "An LLM-based update resolver determines if certain relationships should be obsolete, marking them as invalid rather than physically removing them to enable temporal reasoning." Zep/Graphiti (arXiv 2501.13956v1, Zep AI authors): "it invalidates the affected edges by setting their tinvalid… tcreated and texpired… monitor when facts are created or invalidated". | add stronger backing: mention that Mem0's graph version and Zep invalidate rather than delete (E12). The quiz stem "as Mem0 does" is still true of base Mem0. Leave it. |
| 26 | L10/03:344-350 | In 2024 Johann Rehberger showed ChatGPT's memory could be written through prompt injection (instructions hidden in a website, document or image); they persisted and quietly sent every later conversation to an attacker; he named it SpAIware; OpenAI fixed the leak it relied on | arXiv 2412.06090 | fact | VERIFIED | Rehberger, "Trust No AI" (arXiv 2412.06090v1, single author, not peer reviewed): "the memory tool can be invoked via prompt injection by websites, documents and images and it allowed the creation of spyware. It was possible to persist malicious instructions in memory to continuously, and quietly, exfiltrate all chat conversations". Primary write-up (embracethered.com, Sep 2024): "OpenAI released a fix for the macOS app"; "Is Hacking Memories via Prompt Injection Fixed? No… The vulnerability that was mitigated is the exfiltration vector"; timeline "September, 2024: OpenAI fixes the vulnerability in ChatGPT version 1.2024.247". | keep the claim. Add the primary blog link and say it was the macOS app (E13). "Fixed the leak" is accurate; the memory write itself wasn't fixed, and that strengthens the lesson. |
| 27 | L10/03 (whole concept) | Memory poisoning as a threat class; the source rule | none beyond Rehberger | practice | UNSOURCED (strong industry anchor exists) | OWASP Top 10 for Agentic Applications 2026 (Dec 2025), ASI06 Memory & Context Poisoning: "adversaries corrupt or seed this context with malicious or misleading data, causing future reasoning, planning, or tool use to become biased, unsafe, or aid exfiltration." Scenario 6: "An attacker implants a user assistants' memory via Indirect Prompt Injection, compromising that user's current and future sessions." Mitigations: "Content validation: Scan all new memory writes… for malicious or sensitive content before commit"; "Provenance and anomalies: Require source attribution"; "Prevent automatic re-ingestion of an agent's own generated outputs into trusted memory"; "use snapshots/rollback and version control". | lead with an industry source (E14). It backs L9's per-user scoping, L10's source rule and "agent inference can't become an instruction", and L10/L11's rollback. |
| 28 | L10/03:476-503 | Secrets and sensitive personal details don't belong in memory; enforce in code; pattern checks are a floor | none | practice | UNSOURCED (true) | Claude help: "Some information is never saved to memory, even if you ask. This includes government ID numbers, criminal history, financial account numbers, and immigration status." Anthropic memory-tool docs: "Claude usually refuses to write sensitive information to memory files. For stronger guarantees, add validation that strips sensitive data before your handler writes the file." OWASP ASI06 (above): scan memory writes "for malicious or sensitive content before commit". | lead with an industry source (E15) |
| 29 | L11/01:165-169; quiz :237-245 | Look-alike clutter is the hardest kind: Lesson 2's evidence found models degrade most with context that resembles what matters | link to L2 | effectiveness (cross-ref) | consistent with source | Chroma (above): even one distractor reduces performance, and four compound it. The "most" wording is L2's; its auditor owns it. | keep (depends on L2 audit) |
| 30 | L11/01:170-176; quiz :248-256; recap L11/04:516-524 | Xiong et al., "How Memory Management Impacts LLM Agents": agents closely imitate the past experiences they retrieve (*experience-following*); a wrong memory keeps producing the same wrong behavior (*error propagation*) | arXiv 2505.16067 | effectiveness | VERIFIED, with a missing condition | Now **published: ACL 2026 (Long Papers), pp. 623–645**, text unchanged from arXiv v2 (10 Oct 2025). Abstract: "LLM agents display an experience-following property: high similarity between a task input and the input in a retrieved memory record often results in highly similar agent outputs… error propagation, where inaccuracies in past experiences compound and degrade future performance". §3.3: "LLM agents tend to imitate retrieved experience more closely when their current queries are similar to past examples." The paper studies memories of past task runs used as examples. | replace link with the ACL version; add the "similar task" condition (E16) |
| 31 | L11/01:177-181; quiz :259-267 | Storing every experience left the agent worse than with an error-free memory, and the gap widened; strict addition + deleting by track record did better | Xiong et al. | effectiveness | VERIFIED, needs a caveat | §3.4: "For both agents, we observe an immediate gap in performance compared to their error-free variant. Moreover, as the execution continues, both add-all and coarse selective addition exacerbate such a performance gap." §4: "when a strict evaluator is employed, history-based deletion leads to notable performance improvements with the non-synthetic agent"; but "History-based deletion and combined deletion show more variable results depending on the reliability of the utility evaluator… when using GPT-4o-mini as the history-based evaluator, the deletion strategy yields a clear performance gain on EhrAgent but leads to degraded performance on AgentDriver." | soften: add "when the judge of what went well was reliable" (E16) |
| 32 | L11/02:340-353; quiz :531-539 | Generative Agents (Park et al.): recency decays exponentially since last retrieved, factor 0.995 per hour of simulated time; importance an integer from mundane to core; relevance by embedding similarity; each scaled 0-1; combined with weights | arXiv 2304.03442 | practice/fact | VERIFIED | v2 (UIST '23): "we treat recency as an exponential decay function over the number of sandbox game hours since the memory was last retrieved. Our decay factor is 0.995." "Importance distinguishes mundane from core memories… directly asking the language model to output an integer score"; prompt "On the scale of 1 to 10". "we calculate relevance as the cosine similarity between the memory's embedding vector and the query memory's embedding vector." "we normalize the recency, relevance, and importance scores to the range of [0, 1] using min-max scaling… all αs are set to 1." | keep. Optionally note it's peer-reviewed (UIST 2023). |
| 33 | L11/02:427-428 | Park et al.'s 0.995 per simulated hour "was fitted to a simulated town" | Park | fact | OVERSTATED | The paper only says "Our decay factor is 0.995." It doesn't describe fitting or tuning. | soften: "was chosen for a simulated town" (E17) |
| 34 | L11/02:465-468 | Tracking whether tasks that used a memory went well is what Xiong et al.'s history-based deletion does | Xiong | fact | VERIFIED | "we propose a simple history-based deletion strategy guided by the utility of stored memory records over time"; abstract: "future task evaluations can serve as free quality labels for stored memory." | replace link with the ACL version (E16) |
| 35 | L11/02:479-483 | recall@k and precision@k are standard measures | none | fact | UNSOURCED (acceptable) | Standard IR terms; the course links Module 5's metrics page. | keep |
| 36 | L11/03:436-445 | Archive rather than delete; in a real system the archive is a separate, cheaper place | none | practice | UNSOURCED (low priority) | Partial backing: OWASP ASI06 "use snapshots/rollback and version control… supporting rollback/quarantine". Anthropic memory-tool docs, "Memory expiration: Periodically delete memory files that haven't been accessed in a long time". That supports "something has to leave", not archiving specifically. | keep. Optionally cite Anthropic's expiration advice (E18). |
| 37 | L11/03:569-577 | Consolidation: from time to time a model reads a cluster of similar memories and writes one that sums them up, recording its sources | none | practice | UNSOURCED (industry examples exist) | Letta Agent SDK memory docs: "Dreaming uses background subagents to review recent conversations, consolidate lessons, and update memory without interrupting active work." LangMem: "Memory Managers: Extract new memories, update or remove outdated memories, and consolidate and generalize from existing memories". | lead with an industry source (E19) |
| 38 | L11/03:578-581 | Generative Agents calls a related step *reflection*: agents periodically write higher-level conclusions from recent memories, stored and recalled like any other | Park | fact | VERIFIED | "Reflections are higher-level, more abstract thoughts generated by the agent. Because they are a type of memory, they are included alongside other observations when retrieval occurs. Reflections are generated periodically"; "We query the large language model with the 100 most recent records"; stored "including pointers to the memory objects that were cited." | keep |
| 39 | L11/03:596-604 | Real deletion means every copy (reworded versions, summaries, indexes, logs, backups); retention is often set by law or policy | none | practice + fact | UNSOURCED (true) | ChatGPT memory FAQ (Wayback 2026-09-24): "To remove information saved as a memory, delete the saved memory and the chat where you first shared it. Also remove the information from any other sources where it appears… Deleting a chat alone does not necessarily delete a separate saved memory created from that chat… OpenAI may retain logs of deleted saved memories for up to 30 days". Claude help: "When a conversation expires or is deleted, related memory entries generated from it won't be removed, but you can delete individual memories at any time." GDPR Art. 17 ("Right to erasure ('right to be forgotten')"), Art. 5(1)(e) ("storage limitation"). | lead with an industry source (E20). Legal detail stays in Module 10. |

Unlinked named research the brief asked about, and whether it appears: MemGPT/Letta (rows 2, 15, 18), Generative Agents (32, 33, 38), Mem0 (22, 24, 25), CoALA (8–12), LangMem (10, 11), ChatGPT memory (26), Claude memory tool (16, 20, 21). **Not mentioned anywhere in L8–L11:** Zep/Graphiti, LongMemEval, LoCoMo, Ebbinghaus decay, OWASP, GDPR. No "research shows"-style unattributed effectiveness claims were found.

### 2. Proposed edits

None of the edits below touch exercise, demo or hidden-test strings. All are prose or quiz-explanation text, so no Pyodide re-verification is needed. External URLs were all fetched and checked; openai.com help pages return 403 to scripts but load in a browser, and I read them through the Wayback Machine.

#### E1: Letta's memory model (L8/01, row 2), re-word and link

Current (L8/01:112-119):
```
Agent frameworks draw the same line, under their own names. LangGraph, for
example, has a *checkpointer*, which saves one conversation thread's state so
it can resume, and a separate *store*, which holds memories across threads,
filed under namespaces such as a user's id. Letta (the successor to the
MemGPT research project) splits memory into *core* memory, always in the
prompt, and *recall* and *archival* memory, searched when needed. The names
differ, but each maps onto the split this lesson makes: what keeps one task
going, and what outlasts it.
```
Proposed:
```
Agent frameworks draw the same line, under their own names. LangGraph, for
example, has a
[*checkpointer*](https://docs.langchain.com/oss/python/langgraph/persistence),
which saves one conversation thread's state so it can resume, and a separate
*store*, which holds memories across threads, filed under namespaces such as
a user's id. [Letta](https://docs.letta.com/agent-sdk/memory/) (the successor
to the [MemGPT](https://arxiv.org/abs/2310.08560) research project) keeps a
little memory in the prompt on every turn, and the rest outside it, read or
searched when needed. The names differ, but each maps onto the split this
lesson makes: what keeps one task going, and what outlasts it.
```

#### E2: whole-transcript evidence (L8/01, row 3), add stronger backing

Current (L8/01:141-144):
```
claude-sonnet. The model has to work out which is current. That's the kind
of conflicting, look-alike context
[Lesson 2's evidence](/04-context-and-memory/02-context-that-fits-but-still-hurts/01-agents-get-worse-before-the-window-is-full/)
found models handle worst. And every session would add another transcript,
```
Proposed:
```
claude-sonnet. The model has to work out which is current. That's the kind
of conflicting, look-alike context
[Lesson 2's evidence](/04-context-and-memory/02-context-that-fits-but-still-hurts/01-agents-get-worse-before-the-window-is-full/)
found models handle worst. Chroma's
[Context Rot study](https://research.trychroma.com/context-rot) tested this
case directly: given a whole chat history instead of just its relevant parts,
every model it tried answered questions about that history less reliably.
And every session would add another transcript,
```
(Verified: "We verify that the models are highly capable of succeeding on the focused inputs, then observe consistent performance degradation with the full inputs.")

#### E3: searching past conversations (L8/01, row 4)

Current (L8/01:149-151):
```
There's a middle way worth knowing about: keep the old transcripts, but out
of the context, and give the agent a tool to search them when a task calls
for it. Several assistants do this for past conversations. It keeps the
```
Proposed:
```
There's a middle way worth knowing about: keep the old transcripts, but out
of the context, and give the agent a tool to search them when a task calls
for it. Claude's apps, for example,
[search past chats](https://support.claude.com/en/articles/11817273-use-claude-s-chat-search-and-memory-to-build-on-previous-context)
this way, and the search shows up in the conversation as a tool call. It keeps the
```

#### E4: the user's side (L8/01, row 5)

Current (L8/01:185-186):
```
Memory is something an agent keeps *about a person*, and that person has a
stake in it. Products that remember well give the user a view into it:
```
Proposed:
```
Memory is something an agent keeps *about a person*, and that person has a
stake in it. Products that remember well give the user a view into it.
[Claude's memory](https://support.claude.com/en/articles/11817273-use-claude-s-chat-search-and-memory-to-build-on-previous-context)
and [ChatGPT's](https://help.openai.com/en/articles/8590148-memory-faq), for
example, both list what's kept, let the user edit or delete it, and can be
switched off:
```
Optionally, append to the "Keep sensitive details only on purpose" bullet (L8/01:194-195): `Claude, for example, leaves out health and similar topics unless the user turns them on.`

#### E5: "hardest of the four" (L8/02, row 6), optional

Current (L8/02:231): `build that write path, and it's the hardest of the four to get right.`
Proposed: `build that write path. It's where most memory systems go wrong: store too much and the right memories get buried, too little and they're missing.`
(Paraphrases the LangMem over-/under-extraction point. Or keep as is, since it's framing.)

#### E6: CoALA as the standard, plus LangMem (L8/03, rows 8, 10, 11)

Current (L8/03:273-275):
```
The standard way to divide an agent's memory comes from
[Cognitive Architectures for Language Agents](https://arxiv.org/abs/2309.02427)
(Sumers, Yao, Narasimhan and Griffiths), which adapted a long-standing split
```
Proposed:
```
The standard way to divide an agent's memory comes from
[Cognitive Architectures for Language Agents](https://arxiv.org/abs/2309.02427)
(Sumers, Yao, Narasimhan and Griffiths, TMLR 2024), and frameworks use it:
[LangChain's memory guide](https://docs.langchain.com/oss/python/concepts/memory)
sorts memory the same way and cites the paper. The paper adapted a long-standing split
```
Current (L8/03:286-288):
```
  into the model's weights and written into the agent's code. Frameworks such
  as LangChain's LangMem also store learned procedures as instructions in the
  agent's prompt. For an agent working for one user, it includes that user's
```
Proposed:
```
  into the model's weights and written into the agent's code. Frameworks such
  as LangChain's [LangMem](https://langchain-ai.github.io/langmem/concepts/conceptual_guide/)
  also store learned procedures as instructions in the agent's prompt. For an
  agent working for one user, it includes that user's
```

#### E7: namespaces and binding (L9/01, rows 13, 14)

Current (L9/01:473-475):
```
The usual way to hold several scopes is a **namespace** on every memory,
such as `(organization, scope, owner)`, with a rule for which namespaces a
session may read and which it may write:
```
Proposed:
```
The usual way to hold several scopes is a **namespace** on every memory,
such as `(organization, scope, owner)`, with a rule for which namespaces a
session may read and which it may write.
[LangMem](https://langchain-ai.github.io/langmem/concepts/conceptual_guide/),
for example, files memories under namespaces like
`("acme_corp", "{user_id}", "code_assistant")`, and fills in the user's id
from the session's configuration when it runs:
```
Optionally, after "Shared scopes need stricter writes" (L9/01:487-492), add:
```
  OWASP's
  [Top 10 for Agentic Applications](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/)
  lists weak namespace separation as one way memory leaks between users.
```

#### E8: Letta core memory link (L9/02, row 15), replace a redirected link

Current (L9/02:525-528):
```
user is, how they like to work. It comes from Letta (formerly MemGPT), whose
"core memory" blocks are
[pinned to the context window](https://docs.letta.com/guides/ade/core-memory),
have length limits, and are edited with tools like `memory_replace`. Claude's
```
Proposed:
```
user is, how they like to work. It comes from Letta (formerly MemGPT), whose
"core memory" blocks are
[always in the context window](https://docs.letta.com/v1-sdk/memory/memory-blocks/),
have character limits, and are edited with tools like `memory_replace`. Claude's
```

#### E9: combining the three ways (L9/02, row 17)

Current (L9/02:592-594):
```
Real systems often combine them: a block for the few things always needed,
tools for what the model notices along the way, and a pipeline to catch what
it missed.
```
Proposed:
```
[LangChain's memory guide](https://docs.langchain.com/oss/python/concepts/memory)
weighs the same choice: writing memories "in the hot path", as the agent
works, or "in the background", afterwards. Real systems often combine them:
a block for the few things always needed, tools for what the model notices
along the way, and a pipeline to catch what it missed. Letta, for example,
keeps a few memory files in every prompt, and runs background agents that
review recent conversations and update memory.
```

#### E10: memory tool status (L9/03, row 20), re-label

Current (L9/03:616-617):
```
[Claude's memory tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)
is generally available, with no beta header. Checked against its docs, it maps
```
Proposed:
```
[Claude's memory tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)
no longer needs a beta header (since February 2026). Checked against its docs, it maps
```

#### E11: quotes as evidence (L10/01, row 23)

Current (L10/01:331-334):
```
The fix is to ask for something code can check. For each memory, the model
must give the **exact words** it rests on, and the number of the **entry** they
come from. Code then checks that those words really are in that entry, and
takes the source from the entry itself, never from the model.
```
Proposed:
```
The fix is to ask for something code can check. For each memory, the model
must give the **exact words** it rests on, and the number of the **entry** they
come from. Code then checks that those words really are in that entry, and
takes the source from the entry itself, never from the model. Asking for
supporting quotes is a known technique:
[Anthropic's guide to reducing hallucinations](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations)
suggests having the model find a quote for each claim, and drop any claim it
can't back. Here, code does the checking.
```

#### E12: supersede vs delete (L10/02, row 25)

Current (L10/02:459): `Where Mem0 deletes a contradicted memory, this store keeps it and marks it:`
Proposed:
```
Mem0's basic pipeline deletes a contradicted memory. Its graph version
doesn't: it marks the old fact invalid and keeps it, and so does
[Zep](https://arxiv.org/abs/2501.13956), which records when each fact stopped
being true. This store does the same, with a flag:
```
(The quiz stem at L10/02:590, "as Mem0 does", is still accurate for base Mem0. Leave it.)

#### E13: SpAIware (L10/03, row 26)

Current (L10/03:344-350):
```
In 2024, security researcher Johann Rehberger showed that ChatGPT's memory
could be written through prompt injection:
[instructions hidden in a website, a document or an image](https://arxiv.org/abs/2412.06090)
could get the assistant to store them. Once stored, they persisted in its
long-term memory, and quietly sent every later conversation to an attacker. He
named it SpAIware. OpenAI fixed the leak it relied on, but the lesson for
anyone building memory is broader.
```
Proposed:
```
In 2024, security researcher Johann Rehberger showed that ChatGPT's memory
could be written through prompt injection:
[instructions hidden in a website, a document or an image](https://arxiv.org/abs/2412.06090)
could get the assistant to store them. Once stored, they persisted in its
long-term memory, and in the macOS app they quietly sent every later
conversation to an attacker. He named it
[SpAIware](https://embracethered.com/blog/posts/2024/chatgpt-macos-app-persistent-data-exfiltration/).
OpenAI fixed the leak it relied on. Rehberger noted that a web page could
still write memories, and the lesson for anyone building memory is broader.
```

#### E14: OWASP anchor for poisoning and the source rule (L10/03, row 27)

Insert at the end of "An injection that doesn't go away" (after L10/03:356, "…long after the page that carried it is gone."):
```
OWASP's
[Top 10 for Agentic Applications](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/)
lists this as its own risk, memory and context poisoning. Its advice matches
this lesson: check what's written to memory, keep each user's memory
separate, record where each memory came from, and don't let the agent's own
output flow back into memory it trusts.
```

#### E15: what shouldn't be stored (L10/03, row 28)

Current (L10/03:486-488):
```
Asking the extraction model to skip them helps, but like every other rule in
this lesson, the one that matters is enforced in code. That's why `admit`
checks `looks_secret` first, before anything about the source. It looks for
```
Proposed:
```
Products draw the same line.
[Claude's memory](https://support.claude.com/en/articles/11817273-use-claude-s-chat-search-and-memory-to-build-on-previous-context)
never saves government ID numbers or financial account numbers, even when
asked, and by default leaves out health and similar topics. Asking the
extraction model to skip them helps, but like every other rule in this
lesson, the one that matters is enforced in code.
[Anthropic's memory tool docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)
say the same: for stronger guarantees, strip sensitive data before a memory
is written. That's why `admit` checks `looks_secret` first, before anything
about the source. It looks for
```

#### E16: Xiong et al. (L11/01 and L11/02, rows 30, 31, 34)

Current (L11/01:170-181):
```
- **Agents follow what they recall.** An empirical study of memory
  management (Xiong et al.,
  ["How Memory Management Impacts LLM Agents"](https://arxiv.org/abs/2505.16067))
  found that agents closely imitate the past experiences they retrieve, which
  the authors call *experience-following*. A wrong or low-quality memory then
  keeps producing the same wrong behavior on similar tasks: *error
  propagation*.
- **Adding everything fell further behind over time.** In the same study,
  storing every experience left the agent performing worse than it would
  with an error-free memory, and the gap widened as the runs went on. Being
  strict about what's added, combined with deleting entries based on their
  track record, did better.
```
Proposed:
```
- **Agents follow what they recall.** An empirical study of memory
  management (Xiong et al.,
  ["How Memory Management Impacts LLM Agents"](https://aclanthology.org/2026.acl-long.27/),
  ACL 2026) found that when a task closely resembles a past one they
  retrieve, agents closely imitate what they did then. The authors call it
  *experience-following*. A wrong or low-quality memory then keeps producing
  the same wrong behavior on similar tasks: *error propagation*.
- **Adding everything fell further behind over time.** In the same study,
  storing every experience left the agent performing worse than it would
  with an error-free memory, and the gap widened as the runs went on. Being
  strict about what's added, combined with deleting entries based on their
  track record, did better, when whatever judged the track record was
  reliable.
```
Also L11/02:467-468: change `[Xiong et al.'s study](https://arxiv.org/abs/2505.16067)` to `[Xiong et al.'s study](https://aclanthology.org/2026.acl-long.27/)`.
Quiz explanations at L11/01:256 and L11/04:524, and the recap option at L11/04:520 ("Agents closely imitate what they retrieve…"), are acceptable as they are. Quiz option text is left for the separate length pass.

#### E17: Park decay "fitted" (L11/02, row 33)

Current (L11/02:427-428):
```
has recalled for about ten weeks counts for half as much as a fresh one. Park
et al.'s 0.995 per simulated hour was fitted to a simulated town. The right
```
Proposed:
```
has recalled for about ten weeks counts for half as much as a fresh one. Park
et al.'s 0.995 per simulated hour was chosen for a simulated town. The right
```

#### E18: archiving (L11/03, row 36), optional

After L11/03:434 ("Something has to leave."), add:
```
Anthropic's
[memory tool docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)
give the same advice: periodically remove memories that haven't been used
in a long time.
```

#### E19: consolidation (L11/03, row 37)

Current (L11/03:572-576):
```
uneventful all year. **Consolidation** keeps that. From time to time, a
model reads a cluster of similar memories and writes one memory that sums
them up, such as "support_agent's weekly reviews were routine from January
to December; nothing unusual was found". The new memory records which ones
it came from, and those are archived.
```
Proposed:
```
uneventful all year. **Consolidation** keeps that. From time to time, a
model reads a cluster of similar memories and writes one memory that sums
them up, such as "support_agent's weekly reviews were routine from January
to December; nothing unusual was found". The new memory records which ones
it came from, and those are archived. Memory frameworks build this in:
[LangMem's](https://langchain-ai.github.io/langmem/concepts/conceptual_guide/)
memory managers consolidate existing memories, and
[Letta](https://docs.letta.com/agent-sdk/memory/) runs background agents
that review recent conversations and consolidate what they learned.
```

#### E20: real deletion and retention (L11/03, row 39)

Current (L11/03:601-604):
```
  a user who asks to be forgotten usually means all of their memories, not
  one. Deleting for real means knowing every place a memory is copied to.
- **How long memories may be kept at all** is often set by law or policy,
  not by recall quality.
```
Proposed:
```
  a user who asks to be forgotten usually means all of their memories, not
  one. Deleting for real means knowing every place a memory is copied to.
  Products spell this out.
  [ChatGPT's memory FAQ](https://help.openai.com/en/articles/8590148-memory-faq)
  tells users that deleting a chat doesn't necessarily delete a memory made
  from it, and that removing something means deleting the memory, the chat
  and any other place it appears.
- **How long memories may be kept at all** is often set by law or policy,
  not by recall quality. The EU's GDPR, for example, gives people a
  [right to erasure](https://gdpr-info.eu/art-17-gdpr/).
```
(If the course prefers official sources for law, use EUR-Lex: https://eur-lex.europa.eu/eli/reg/2016/679/oj.)

### 3. Needs a decision

No finding contradicts what any concept teaches, and nothing here needs a change of teaching. Two borderline notes for the lead:

1. **Xiong et al.'s scope (L11 concept 1).** The paper studies agents that store past *task runs* (input and output) and retrieve them as examples. The lesson applies "experience-following" to a store of user memories and routine notes. The mechanism carries over reasonably, and E16's added condition ("when a task closely resembles a past one") keeps it honest. Recommendation: keep the concept as it is, with E16's wording. Optionally add "in agents that reuse their past task runs as examples".
2. **Letta's current product (L8 concept 1, L9 concepts 2 and 3).** Letta's docs now mark the memory-block/core-memory API as "V1 SDK (legacy)". The current Agent SDK keeps memory as files in a git repo, with `system/` files in the prompt every turn and the rest read on demand. What the course teaches (always-in-context block vs on-demand memory; the block lives in the system prompt) is still true of both. Only the wording and links need refreshing (E1, E8). No change to the concepts.

### 4. Counts

- Claims inventoried: 39 (26 with a named or linked source, 13 unsourced practice or fact claims)
- **Verified:** 21 (19 fully, 2 partly). These are rows 1, 2, 9, 10, 11, 12, 15 (archived copy), 16, 18, 21, 22, 24, 25 (base Mem0), 26, 30, 31, 32, 34, 38, plus 8 and 20 partially. The our-data rows (3, 19) and the L2 cross-ref row (29) are consistent and not counted here.
- **Contradicted:** 0
- **Not reachable:** 0. The Letta link redirects, so it's verified via Wayback and a replacement is proposed. openai.com was read via Wayback.
- **Re-labelled:** 3 (memory tool "generally available" → "no beta header needed"; Park "fitted" → "chosen"; Xiong → ACL 2026, published)
- **Replaced links:** 2 (Letta core-memory URL → v1-sdk memory-blocks page; Xiong arXiv → ACL Anthology)
- **Softened:** 2 (Xiong "closely imitate" needs its similarity condition; "did better" needs "reliable evaluator"), plus 1 optional (E5)
- **Added (industry or stronger backing):** 14 edits (E1, E2, E3, E4, E6, E7, E9, E11, E12, E13, E14, E15, E19, E20; E18 optional). Sources: LangGraph persistence and memory docs, LangMem conceptual guide, Letta docs, MemGPT paper, Claude memory help, ChatGPT memory FAQ, Anthropic memory-tool and hallucination docs, OWASP ASI06, Zep paper, Chroma Context Rot, Rehberger's primary write-up, GDPR Art. 17

---

## Report: Citation audit: Module 4, Lesson 12 (Assembling the Context Step)

Scope: `src/content/modules/04-context-and-memory/12-assembling-the-context-step/`. That covers `00-intro`, `01-one-context-step-in-order`, `02-measuring-the-before-and-after`, `03-seeing-inside-each-request`, `04-what-to-leave-out` and `05-recap-practice`, including the quizzes, the exercise text and the recap.
Downloads and scripts: `scratchpad/audit/m4D/`. Paths below are relative to the lesson folder. Line numbers are from the files as of 2026-09-30.

**Overall.** This lesson is a synthesis page. Almost every outside claim is a restatement from an earlier lesson, with a link back to it. It has only one direct external link (Anthropic, *Building effective agents*). The lesson's own numbers all come from scripted demos. The pages label them as scripted and give the cost model ("Lesson 3's token-units with its example multipliers"), so there's no Qwen data to label here.

**How I checked the lesson's own numbers.** I pulled each demo's exact `String.raw` strings (and the `fakeClient.ts` exports) out of the `.mdx` with a small extractor (`m4D/extract.py`, `run.py`). I ran them in CPython 3.14 with pydantic 2.12, one fresh interpreter per demo, as a lone Run click would. Every figure printed in the prose matched, except one quiz explanation (L12-13). The recap sandbox reference passes all its hidden tests.

Short names used in the table:
- **BEA**: Anthropic, *Building effective agents* (Schluntz & Zhang, Dec 2024), anthropic.com/news/building-effective-agents.
- **ECE**: Anthropic, *Effective context engineering for AI agents*, published Sep 29, 2025.
- **Manus**: Yichao "Peak" Ji, *Context Engineering for AI Agents: Lessons from Building Manus*, 2025-07-18. A practitioner post with no method shown.
- **JB**: Lindenbauer et al. (JetBrains Research and TUM), *The Complexity Trap*, arXiv 2508.21433 **v3** (27 Oct 2025): "DL4C camera-ready version to be presented at the 4th DL4C workshop co-located with NeurIPS '25; added OpenHands generality probe, added hybrid context management strategy".
- **CW / PC / TS**: the Claude docs pages *Context windows*, *Prompt caching* and *Tool search tool* (platform.claude.com, fetched as `.md` today).
- **OAC**: OpenAI docs, *Prompt caching* (developers.openai.com, fetched as `.md` today).
- **ADK**: Google Developers Blog, *Architecting efficient context-aware multi-agent framework for production* (Hangfei Lin, Dec 4, 2025), plus the ADK docs, *Context compression* (adk.dev/context/compaction).
- **OTel**: OpenTelemetry, *Semantic conventions for generative client AI spans*. The spec now lives in `open-telemetry/semantic-conventions-genai` (the old opentelemetry.io page says "Moved"). Status: **Development**.

### 1. Claims table

| ID | file:line | claim (trimmed) | source given | kind | verdict | evidence (primary source) | recommendation |
|---|---|---|---|---|---|---|---|
| L12-1 | 01:935-938 | "The summary is asked for inside the conversation, with the agent's own tools and system prompt, so it reuses whatever part of the request is still cached" | link to the compaction lesson, when-to-compact concept | our data (restated) | VERIFIED (restated own measurement) | The compaction lesson, concept 4, lines 410-416: "Sending the summary request as a separate call, with its own system prompt and no tools, cost about 45% more… The separate call can't reuse anything the agent's requests cached." Scripted demo, cost model labelled. | keep |
| L12-2 | 01:933-934 | "Cheap before expensive, and nothing lost: strip old reasoning, then clear to the store, then compact with an archive, then trim." | none (the only integration rule without a link) | practice | UNSOURCED here (backed in the compaction lesson) | ECE: "One of the safest lightest touch forms of compaction is tool result clearing, most recently launched as a feature on the Claude Developer Platform." JB v3 abstract: "we introduce a novel hybrid approach that further reduces costs by 7% and 11% compared to just observation masking or LLM summarization, respectively." The compaction lesson's C1 anchor `#what-the-evidence-says-about-summarizing` exists in the built HTML. | add stronger backing (link) |
| L12-3 | 01:1185 (quiz); 05:1325 (recap quiz) | "Everything in the prefix is fixed for the session, so the cache is never broken." / "Fixing the prefix for the session is what keeps the cache intact." | none | fact | OVERSTATED | PC: "By default, the cache has a 5-minute lifetime. The cache is refreshed for no additional cost each time the cached content is used." Also: "Shorter prompts cannot be cached, even if marked with `cache_control`." OAC: `in_memory` entries "typically remain active for around 5 to 10 minutes of inactivity, up to one hour." A fixed prefix means the context step never breaks the cache. The cache can still expire, or be too short to cache at all. Lesson 2's C2 already makes this caveat. | soften |
| L12-4 | 01:1151-1160 | Session demo: nine turns sent as they were, then a compaction, then clearing later; prefix unchanged; pairing intact; 13 items stored | demo (scripted) | our data | VERIFIED (re-run) | Output: turns 1-9 `send`, 10 `compact`, 14 `clear`; "prefix unchanged all session: True"; "pairing intact every turn: True"; "results stored away: 13". Labelled "(the agent's calls and the summary are scripted)". | keep |
| L12-5 | 02:973-974; 02:1080-1081 | The client refuses a request that won't fit "as a real provider would"; "the provider refuses it" | none | fact | VERIFIED | CW: "If the input alone already exceeds the model's context window, the API returns a 400 `invalid_request_error` ("prompt is too long") on every model." `WindowedClient` checks only the input (system + tools + messages > window), and its message is "prompt is too long: …". It matches. Nuance, not needed on this page: "On Claude 4.5 models and newer, if input tokens plus `max_tokens` exceeds the context window size, the API accepts the request." | keep |
| L12-6 | 02:980-985; quiz 02:1159; recap quiz 05:1391 | What a real model does better with a smaller, cleaner context "is the evidence from Lesson 2 and Lesson 11". The quizzes say "the research covers…" and "the research's claim, cited, not demoed". | lesson-intro links (body); none (quizzes) | pointer | OK in the body; vague in the quizzes | The body links the two lessons that carry the evidence. The two quiz explanations just say "the research". | optional re-word (name where the evidence is) |
| L12-7 | 02:1080-1090 | Naive fails on turn 13. Managed completes. Its largest request is "about half the size of the naive loop's largest". Prefix breaks 0. Managed 13,103 vs 8,766 token-units. | demo (scripted, costs labelled) | our data | VERIFIED (re-run) | "failed on turn 13: prompt is too long: 3,517 tokens > 3,500 maximum". Managed "largest request 2,260 tokens, prefix breaks 0", "cost 13,103". Naive unlimited: "largest request 4,315 tokens… cost 8,766". "About half" holds against the unlimited run (2,260 / 4,315 = 0.52). Against the refused run it's 0.64, so the sentence is ambiguous. | keep (optional: name the numbers) |
| L12-8 | 02:1114-1119; 04:871-872; quiz 04:1033; recap 05:1369 | More costly "by half at 7 checks" / "half as much again" / "1.5 times". Break-even between 20 and 40 checks. "About a third" at 160. Naive last request "over 60,000 tokens". | demo | our data | VERIFIED (re-run) | Table: 7 → 8,676 vs 13,006, ratio **1.50**. 20 → 1.19. 40 → 0.94. 160 → 576,810 vs 208,186, ratio **0.36**. Naive last request at 160 checks: **60,251** tokens. | keep |
| L12-9 | 02:1123-1125 | "Each summary is also output, which usually costs several times as much as input" | none | fact | VERIFIED | PC pricing table: Opus 5.5 "$4 / MTok" input, "$20 / MTok" output. Sonnet 5.5 $2 / $10. Haiku 4.5 $1 / $5. Every listed Claude model's output costs 5x its input. The compaction lesson, C4 line 426, already says "On Claude Opus 5.5, for example, output tokens cost five times as much as input." | keep |
| L12-10 | 02:1125-1127 | "Real caches have a minimum size and expire when unused" | none | fact | VERIFIED | PC: minimums of "512 tokens for… Claude Opus 5.5…" up to "4,096 tokens for Claude Haiku 4.5", and "By default, the cache has a 5-minute lifetime." OAC: "The minimum cacheable prompt length is 1,024 tokens for GPT-5.6 and later"; "A cached prefix remains eligible for reuse for 30 minutes after its most recent write or reuse". | keep |
| L12-11 | 02:1127-1128 | "And providers price caching differently." | none | fact | VERIFIED | PC: "5-minute cache write tokens are 1.25 times the base input tokens price… Cache read tokens are 0.1 times" (0.05x on Opus 5.5; 0.025x on Fable/Mythos 5.1). OAC: "For GPT-5.6 and later, cache writes cost 1.25× the standard, uncached input-token rate"; the comparison table gives earlier models "No additional cache-write charge". | keep |
| L12-12 | 02:1133-1136; quiz 02:1187 | Without folding: summaries of "about 1,600 tokens", rounds dropped "on over a hundred turns" | demo | our data | VERIFIED (re-run) | "folding at 30%… 151 tokens… 0 turns"; "never folding… 1,584 tokens… rounds dropped without a trace on 106 turns". | keep |
| L12-13 | 02:1203 (quiz explanation) | "Counting summaries moved the break-even point, from about 20 checks to between 20 and 40." | none (implied demo) | our data | CONTRADICTED (the "about 20" half) | I re-ran `cost_at` in fresh interpreters. The agent's requests alone (`cost_of_run(sent, …)`): 20 checks → 26,197 vs 24,034, ratio 1.09; **25 → 31,629 vs 31,638, ratio 1.00**. With every call counted (`llm.log`): 30 → 1.04; **35 → 49,524 vs 49,670, ratio 1.00**. So counting summaries moves the break-even from about 25 checks to about 35. The page's own table shows only 20 and 40, which is where "between 20 and 40" comes from. | replace |
| L12-14 | 03:1046-1052; recap-quiz context | Manifest table: tools larger than the system prompt; compaction on turn 10 to a 94-token summary, waiting on one extra call; turn 14 clears four results | demo | our data | VERIFIED (re-run) | Tools 268, system 54. Turn 10: `compact`, summary 94, extra calls 1. Turn 14: `clear`, cleared 4. "model calls: 18 for 17 turns; turns that waited on an extra call first: [10]". | keep |
| L12-15 | 03:1073-1080, 03:1100-1101; quizzes 03:1141, 03:1155; recap 05:1347 | Without folding: over the limit from turn 38, "most of the run", rounds dropped on 26 turns. With folding: nothing dropped, the limit still trips on "a dozen turns", folding at 30% is "a little above" 500, one turn waited on two calls. | demo | our data | VERIFIED (re-run) | "never folding: largest summary 1,584… turns over a section limit: 53 of 90 (first: turn 38, summary: 541 over 500); turns that dropped whole rounds: 26". "folding: largest summary 616… 12 of 90… dropped 0… at most 2 in one turn". | keep |
| L12-16 | 03:1011-1013 | "In a production agent, the manifest goes to the same logs and traces as everything else about the request." | none | practice | UNSOURCED | OTel GenAI spans (Status: Development) define per-call attributes. `gen_ai.usage.input_tokens`: "The number of tokens used in the GenAI input (prompt)." `gen_ai.usage.cache_read.input_tokens`: "The number of input tokens served from a provider-managed cache." `gen_ai.conversation.compacted`: "Indicates whether the effective conversation context used for this operation is a compacted view of a prior conversation." Also the opt-in `gen_ai.system_instructions`, `gen_ai.tool.definitions` and `gen_ai.input.messages`. | add stronger backing (OTel; say it's a draft) |
| L12-17 | 03:1058-1067 | Per-section limits catch a section growing out of proportion before the overall budget trips | none | practice | UNSOURCED | Industry example, Claude Code memory docs: "The first 200 lines of `MEMORY.md`, or the first 25KB, whichever comes first, are loaded at the start of every conversation." And: "If the file is near a limit, Claude Code reminds Claude to shorten it". Also "target under 200 lines per CLAUDE.md file. Longer files consume more context and reduce adherence." Claude Code commands docs: "`/context [all]` \| Visualize current context usage as a colored grid. Shows optimization suggestions for context-heavy tools, memory bloat, and capacity warnings." | lead with an industry source |
| L12-18 | 03:1109-1111; quiz 03:1163 | An assistant "may want compaction run between turns rather than in the middle of one"; "That's why some agents compact between turns, or in the background" | none | practice | UNSOURCED | ADK blog: "When a configurable threshold (such as the number of invocations) is reached, ADK triggers an asynchronous process. It uses an LLM to summarize older events over a sliding window". ADK docs: "Event 3 completes: All 3 events are compressed into a summary". | add stronger backing (ADK) |
| L12-19 | 03:1102 | Each extra call is "a full model call, often seconds long" | none | fact | not checked (common knowledge; no figure) | n/a | keep |
| L12-20 | 04:884-887; quiz 04:1055 | Anthropic's advice: "find the simplest solution possible, and only increase complexity when needed", and add complexity only when it demonstrably improves outcomes | BEA link | practice | VERIFIED (close paraphrase; not in quote marks) | BEA: "When building applications with LLMs, we recommend finding the simplest solution possible, and only increasing complexity when needed." And: "To repeat: you should consider adding complexity only when it demonstrably improves outcomes." Optional context-specific second source, ECE: "\"do the simplest thing that works\" will likely remain our best advice for teams building agents on top of Claude." | keep (optional: add ECE) |
| L12-21 | 04:914-921; recap quiz 05:1397 | Ablation: without the anchor, cheaper, but the rule is missing "from turn 11 on, right after the compaction"; without clearing, two compactions and higher cost | demo | our data | VERIFIED (re-run) | "everything on… compactions 1 cost 13,103"; "no anchor… compactions 1 cost 9,862 missing: {'rule': [1, 11, 12, 13, 14, 15, 16, 17]…}"; "no clearing… compactions 2 cost 14,424". | keep |
| L12-22 | 04:933-936; quiz 04:1044; recap 05:1413 | A stable prefix "costs nothing but care, and pays on every request" | Lesson 3 intro link | practice / fact | VERIFIED practice; "every request" OVERSTATED | Manus: "I'd argue that the KV-cache hit rate is the single most important metric for a production-stage AI agent. It directly affects both latency and cost." And: "Keep your prompt prefix stable." The cache pays only while it's warm and above the minimum size (see L12-10). | soften, and lead with Manus (optional) |
| L12-23 | 04:937-942 | Keeping failed attempts visible and restating goal and rules at the end: "it's what keeps a long run on track" | Lesson 2 intro link | effectiveness | VERIFIED as a practitioner report; no method shown | Manus: "leave the wrong turns in the context." Also: "By constantly rewriting the todo list, Manus is reciting its objectives into the end of the context. This pushes the global plan into the model's recent attention span, avoiding 'lost-in-the-middle' issues and reducing goal misalignment." The course's own ablation (L12-21) shows only that the rule is *present*, not that behaviour improves. | re-label (attribute the effect to Manus) |
| L12-24 | 04:949-950 | Fitting in batches broke the prefix "3 times in 30 turns instead of 17" | window-fills lesson, C3 link | our data (restated) | VERIFIED (re-ran that lesson's `BATCH_DEMO`) | "fit every turn… turns that broke the prefix: 17"; "fit in batches… turns that broke the prefix: 3". | keep |
| L12-25 | 04:953-955 | Offloading one large log sent "about a tenth of the tokens, at the price of two extra round trips" | offloading lesson, C1 link | our data (restated) | VERIFIED against the linked page | Offloading C1 line 359-360: "The offloaded run took two extra requests… It still sent about a tenth of the tokens." | keep |
| L12-26 | 04:958-959 | "Clearing alone matched summarization in the JetBrains study" | compaction lesson, C1 page link | effectiveness (restated) | VERIFIED (v3) | JB v3 abstract: "a simple environment observation masking strategy halves cost relative to the raw agent while matching, and sometimes slightly exceeding, the solve rate of LLM summarization." Scope: "SWE-agent on SWE-bench Verified across five diverse model configurations". A NeurIPS 2025 DL4C workshop paper. | keep (optional: "of coding agents", and deep-link the evidence subsection) |
| L12-27 | 04:970-972; quiz 04:1069 | "The prefix shrank 26 times, but cost fell only about 21% on that task" | link to the just-in-time lesson's **intro** | our data (restated) | LINK WRONG; figure matches the source text (not re-run) | The just-in-time intro doesn't contain the figure (no "26" or "21" in `00-intro.mdx`). It comes from that lesson's recap sandbox, `05-recap-practice.mdx:541`: "the on-demand run's prefix comes out about 26 times smaller, yet it costs only about 21% less." "Shrank 26 times" also reads as "shrank on 26 occasions". | replace (link target and wording) |
| L12-28 | 04:972-974 | "If a provider offers built-in tool search, prefer it, since it keeps each tool's schema enforced." | none here (the just-in-time lesson's C2 links Claude's docs) | fact | VERIFIED | TS: "When Claude discovers a deferred tool through tool search, the API appends a `tool_reference` block inline in the conversation, then expands it into the full tool definition before passing it to Claude." And: "The grammar for strict mode… builds from the full toolset, so `defer_loading` and strict mode compose without grammar recompilation." OpenAI also has one (tool search doc): "In the Responses API, only `gpt-5.4` and later models support `tool_search`." | add a link (the just-in-time lesson's `#you-don-t-always-build-this-yourself`, anchor present in `dist/`) |
| L12-29 | 04:981-983 | Exploring "sent over ten times fewer tokens than pasting the files in" | just-in-time lesson, C4 link | our data (restated) | VERIFIED against the linked page | Just-in-time C4 line 323: "over ten times fewer tokens sent in total". That page also cites ECE for the map-plus-explore hybrid. | keep |
| L12-30 | 04:941 | The anchor "costs one message of cache reuse per turn" | caching lesson, C3 link | our data (restated) | consistent with the syllabus record of that demo (`messages[2]`, 63 reusable tokens); not re-run | n/a | keep |
| L12-31 | 04:992-993; quiz 04:1066; recap 05:1424 | Without the source rule, "one planted instruction replays in every future session" | memory-poisoning lesson `#the-source-rule` | practice (restated) | Source exists (verified at the abstract level) | The memory-poisoning lesson cites Rehberger, arXiv 2412.06090 v1 (8 Dec 2024), *Trust No AI: Prompt Injection Along The CIA Security Triad*, "compiles real-world exploits". That lesson's auditor should check the details of the SpAIware claim. | keep |
| L12-32 | recap quiz 05:1380; exercise explanation 05:1451 | A 40-check session's transcript comes to "about three times" the window. The history "grew to more than three times the window". | sandbox | our data | VERIFIED (re-ran the recap reference and hidden tests) | All hidden tests pass. The session history is 16,053 tokens (4.6x the 3,500 window, so "more than three times" holds). `numbered_transcript(history)` = 9,388 tokens (2.7x). The syllabus records the one-shot extraction request as 9,960 tokens (2.85x). "About three times" is fair. | keep |
| L12-33 | 01:939-944 | The prefix is fixed for the session; the tool list never changes | memory-store C3 and just-in-time C1 links | practice (restated) | Source exists | The just-in-time C1 page cites Manus. Manus: "Keep your prompt prefix stable… even a single-token difference can invalidate the cache from that token onward." | keep |

### 2. Proposed edits

None of these edits is inside an exercise or demo string. All are prose or quiz `explanation`/`question` props, so none needs re-verification in Pyodide. I grepped the whole `src/content/modules` tree for each phrase; other places are listed where they exist.

**E1 (L12-2): add backing to the unsourced integration rule.** File `01-one-context-step-in-order.mdx:933-934`.
Current:
```
- **Cheap before expensive, and nothing lost:** strip old reasoning, then
  clear to the store, then compact with an archive, then trim.
```
Proposed:
```
- **Cheap before expensive, and nothing lost:** strip old reasoning, then
  clear to the store, then compact with an archive, then trim. Anthropic
  calls clearing old tool results
  ["one of the safest lightest touch forms of compaction"](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents),
  and clearing first, with summaries held back, was the cheapest mix in
  [the JetBrains study](/04-context-and-memory/05-compaction-and-summarization/01-what-clearing-cant-do/#what-the-evidence-says-about-summarizing).
```

**E2 (L12-3): the cache can still expire.** File `01-one-context-step-in-order.mdx:1185`, quiz explanation.
Current: `"explanation": "Everything in the prefix is fixed for the session, so the cache is never broken. Anything newer goes at the end of each request."`
Proposed: `"explanation": "Everything in the prefix is fixed for the session, so the context step never breaks the cache itself. Anything newer goes at the end of each request."`
Same idea in `05-recap-practice.mdx:1325`.
Current: `"explanation": "Fixing the prefix for the session is what keeps the cache intact. Anything newer goes at the end of each request."`
Proposed: `"explanation": "Fixing the prefix for the session means the context step never breaks the cache itself. Anything newer goes at the end of each request."`

**E3 (L12-13): the break-even figure in the quiz.** File `02-measuring-the-before-and-after.mdx:1203`.
Current: `"explanation": "A measurement that leaves out one side's costs flatters it. Counting summaries moved the break-even point, from about 20 checks to between 20 and 40."`
Proposed: `"explanation": "A measurement that leaves out one side's costs flatters it. Counting summaries moved the break-even point later, from about 25 checks to about 35."`
Figures are from `m4D/extra2.py`, run in a fresh interpreter per point: agent requests only, 25 checks, 31,629 vs 31,638; every call, 35 checks, 49,524 vs 49,670. The page's table stays as is: it shows only 20 and 40, and the body's "between 20 and 40" (02:1116, 02:1178, 05:1369) is still correct.

**E4 (L12-16): name the tracing convention.** File `03-seeing-inside-each-request.mdx:1011-1013`.
Current:
```
In a production agent, the manifest goes to the same logs and traces as
everything else about the request. Module 7 builds that tracing. The
manifest is the context step's part of it.
```
Proposed:
```
In a production agent, the manifest goes to the same logs and traces as
everything else about the request. OpenTelemetry's
[draft conventions for model calls](https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/gen-ai-spans.md)
already record some of it on each call: the input tokens, the tokens read
from the cache, and whether the context was compacted. Module 7 builds that
tracing. The manifest is the context step's part of it.
```

**E5 (L12-17): lead the per-section limits with an industry example.** File `03-seeing-inside-each-request.mdx:1066-1067`.
Current:
```
Limits per section catch that early. The limits here are examples: 400
tokens for the system prompt, 500 for the summary, 250 for the anchor. Here
```
Proposed:
```
Limits per section catch that early. Claude Code, for example, loads only
[the first 200 lines or 25KB](https://code.claude.com/docs/en/memory) of its
memory file at session start, and reminds the model to shorten the file as it
nears that limit. The limits here are examples: 400
tokens for the system prompt, 500 for the summary, 250 for the anchor. Here
```

**E6 (L12-18): back "compact between turns" with an industry example.** File `03-seeing-inside-each-request.mdx:1109-1111`.
Current:
```
afford the pauses; an assistant someone is watching may not, and may want
compaction run between turns rather than in the middle of one. Either way,
```
Proposed:
```
afford the pauses; an assistant someone is watching may not, and may want
compaction run between turns rather than in the middle of one. Google's
Agent Development Kit, for one,
[compacts in the background](https://developers.googleblog.com/architecting-efficient-context-aware-multi-agent-framework-for-production/)
once a set number of turns have finished. Either way,
```
(This covers the quiz explanation at 03:1163 too; it can stay as written.)

**E7 (L12-22): soften "pays on every request", and optionally lead with Manus.** File `04-what-to-leave-out.mdx:933-936`.
Current:
```
- **A stable prefix,** from
  [Lesson 3](/04-context-and-memory/03-prompt-caching/00-intro/). The tools
  and the system prompt are fixed, with nothing changing near the start. It
  costs nothing but care, and pays on every request.
```
Proposed:
```
- **A stable prefix,** from
  [Lesson 3](/04-context-and-memory/03-prompt-caching/00-intro/). The tools
  and the system prompt are fixed, with nothing changing near the start. It
  costs nothing but care, and pays on every request the cache can serve.
  Manus's team calls the cache hit rate
  ["the single most important metric for a production-stage AI agent"](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus).
```
(Quiz 04:1044 and recap 05:1413 say "costs nothing but care". That's fine; no change.)

**E8 (L12-23): attribute the effect.** File `04-what-to-leave-out.mdx:940-942`.
Current:
```
  The anchor
  [costs one message of cache reuse per turn](/04-context-and-memory/03-prompt-caching/03-where-lesson-2s-techniques-stand-and-the-fights-ahead/),
  and it's what keeps a long run on track.
```
Proposed:
```
  The anchor
  [costs one message of cache reuse per turn](/04-context-and-memory/03-prompt-caching/03-where-lesson-2s-techniques-stand-and-the-fights-ahead/),
  and Manus reports that
  [restating the plan at the end](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus)
  is what keeps its long runs from drifting.
```

**E9 (L12-27): fix the link target and the wording.** File `04-what-to-leave-out.mdx:970-973`.
Current:
```
  The prefix shrank
  [26 times](/04-context-and-memory/07-just-in-time-context-and-dynamic-tool-exposure/00-intro/),
  but cost fell only about 21% on that task, because searches are round
  trips.
```
Proposed:
```
  In that lesson's sandbox, the prefix came out
  [about 26 times smaller](/04-context-and-memory/07-just-in-time-context-and-dynamic-tool-exposure/05-recap-practice/),
  but cost fell only about 21%, because searches are round trips.
```
Quiz, `04-what-to-leave-out.mdx:1069`.
Current: `"question": "Loading tools on demand shrank the prefix 26 times, yet cost fell only about 21% on that task. Why?",`
Proposed: `"question": "Loading tools on demand made the prefix about 26 times smaller, yet cost fell only about 21% on that task. Why?",`
(The source, `07-.../05-recap-practice.mdx:541`, already says "about 26 times smaller". I didn't re-run that sandbox; the Lesson 7 auditor should confirm the 26x and 21%.)

**E10 (L12-28): link the tool-search claim.** File `04-what-to-leave-out.mdx:973-974`.
Current:
```
  trips. If a provider offers built-in tool search, prefer it, since it
  keeps each tool's schema enforced.
```
(After E9, the first word of this line is part of the E9 replacement. Apply E9 first, then match `If a provider offers built-in tool search, prefer it, since it\n  keeps each tool's schema enforced.`)
Proposed:
```
  If a provider offers
  [built-in tool search](/04-context-and-memory/07-just-in-time-context-and-dynamic-tool-exposure/02-tools-on-demand/#you-don-t-always-build-this-yourself),
  prefer it: a found tool is called with its own schema, which
  [Claude's strict mode still enforces](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool).
```

**E11 (L12-26, optional): scope the JetBrains result.** File `04-what-to-leave-out.mdx:958-959`.
Current:
```
  Clearing alone
  [matched summarization in the JetBrains study](/04-context-and-memory/05-compaction-and-summarization/01-what-clearing-cant-do/),
```
Proposed:
```
  Clearing alone
  [matched summarization in the JetBrains study of coding agents](/04-context-and-memory/05-compaction-and-summarization/01-what-clearing-cant-do/#what-the-evidence-says-about-summarizing),
```

**E12 (L12-6, optional): name where "the research" is.** File `02-measuring-the-before-and-after.mdx:1159`.
Current: `"explanation": "The fake client can't be better or worse at the task. What it's sent can be measured exactly, and the research covers what a real model does with it."`
Proposed: `"explanation": "The fake client can't be better or worse at the task. What it's sent can be measured exactly. What a real model does with it is the evidence cited in earlier lessons, such as the one on context that fits but still hurts."`
File `05-recap-practice.mdx:1391`.
Current: `"explanation": "What's sent can be measured exactly. What a real model does with a cleaner context is the research's claim, cited, not demoed."`
Proposed: `"explanation": "What's sent can be measured exactly. What a real model does with a cleaner context comes from the evidence cited in earlier lessons, not from this demo."`

**E13 (L12-7, optional): remove the "naive loop's largest" ambiguity.** File `02-measuring-the-before-and-after.mdx:1082-1083`.
Current:
```
- **The managed loop completes** at that window. Its largest request is
  about half the size of the naive loop's largest, and its prefix breaks
```
Proposed:
```
- **The managed loop completes** at that window. Its largest request,
  2,260 tokens, is about half the unlimited naive loop's 4,315, and its prefix breaks
```

**E14 (L12-20, optional): add the context-specific Anthropic line.** File `04-what-to-leave-out.mdx:884-887`. Append after `add complexity *only* when it demonstrably improves outcomes.`:
```
Its guide to context engineering ends the same way:
["do the simplest thing that works."](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
```

### 3. Needs a decision

None. Nothing I found changes what a concept teaches. The one contradicted item (E3) is a figure in a quiz explanation: the direction holds (counting summaries moves the break-even later) and only the start point was off. The body's "between 20 and 40" is correct.

Two notes for the lead (neither needs a decision):
- **E9 is a broken figure link.** The 26x / 21% claim links to the just-in-time lesson's intro, which doesn't contain it. The figure lives in that lesson's recap sandbox.
- **Anthropic's context-window behaviour changed on Claude 4.5+.** Input plus `max_tokens` over the window is now accepted, and generation stops with `model_context_window_exceeded`. Input alone over the window is still refused on every model. This lesson's `WindowedClient` checks input only, so it matches. Pages that say a request is refused when it leaves no room for the reply belong to the window-fills and context-budget lessons (their auditors).

### 4. Counts

- Claims inventoried: 33.
- Verified: 21. That's L12-1, 4, 5, 7, 8, 9, 10, 11, 12, 14, 15, 20, 21, 24, 25, 26, 28, 29 and 32, plus L12-22 and 23 as practitioner reports (Manus).
  - Of those, the demo and sandbox figures (L12-4, 7, 8, 12, 14, 15, 21, 24, 32) were re-run from the built strings.
  - The rest were checked against a primary source.
- Restated from earlier lessons, source present, not re-checked in depth: 3 (L12-30, 31, 33).
- Fine as they stand: 2 (L12-6 body pointer; L12-19 needs no source).
- Contradicted: 1 (L12-13).
- Overstated: 2 (L12-3, L12-22).
- Wrong link target: 1 (L12-27).
- Unsourced practice: 4 (L12-2, 16, 17, 18).
- Unreachable: 0.
- Proposed edits:
  - Re-labelled: 1 (E8).
  - Replaced: 2 (E3, E9).
  - Backing added: 5 (E1, E4, E5, E6, E10).
  - Softened: 2 (E2, E7).
  - Optional: 4 (E11-E14).
