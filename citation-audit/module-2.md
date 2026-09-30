# Citation audit: Module 2 (The Agent Loop)

## Concept coverage

A second pass, added 2026-09-30 at the owner's request, kept light as the
owner asked for Modules 1–3. It checks each concept page and lesson intro
as a whole, and anchors a concept only where a learner would reasonably ask
"says who?" or "does anyone actually do this?". Recaps are skipped. Two
read-only subagents did the check; the lead applied the edits.

**Counts (53 pages):** backed 47, our data only 0, unbacked
6. Fixed: six prose edits anchor every page that wasn't backed:
- OpenAI's prompt engineering guide, on testing prompts as you iterate;
- Anthropic's and OpenAI's tool docs, on where tool guidance goes;
- LangChain's unit-testing guide, on a fake LLM client;
- Anthropic's "Building effective agents", on ground truth each step;
- Anthropic's tool-call docs, on errors as observations;
- LangChain's plan-and-execute post, on goal decomposition.

The goal-state edit also says plainly that doing that check in code is the
course's own framing. Two optional additions were skipped. No demo,
exercise or test string changed, and no internal links were added. `npm run
build` passes. Needs a decision: none.

The Status column is the status before the fix. The Action column names
the edit in each lesson group's report: `cc2-A` for L1–L6 and `cc2-B` for
L7–L11.

| Concept | Central claim | What backs it | Status (before fix) | Action taken |
|---|---|---|---|---|
| L1 intro | An agent is the tool round trip in a model-controlled loop. Reach for one only when control flow needs it | L1 C1 to C3 anchors (Anthropic "Building effective agents", per-claim audit) | BACKED | none |
| L1 C1 Perceive-reason-act-observe | The agent is a loop whose length isn't fixed in advance | Anthropic BEA: "LLMs using tools based on environmental feedback in a loop" (per-claim audit C1); the four-word label is a teaching name | BACKED | none |
| L1 C2 Agent vs workflow vs chatbot | Who controls the sequence separates them. Start with the simplest structure | Anthropic BEA, linked and quoted (per-claim audit) | BACKED | none |
| L1 C3 Honest case against an agent | Agents cost more, are less predictable and harder to debug. Use a fixed workflow when control flow is known | Anthropic BEA, linked (per-claim audit) | BACKED | none |
| L2 intro | Prompting techniques are the tools for writing an agent's instructions | L2 C1 to C5 | BACKED | none |
| L2 C1 Specificity | Say what, how and the constraints. Vagueness in an agent's instructions causes behavioural failures | Fundamental. Anthropic prompting best practices, "Be clear and direct": "Being specific about your desired output can help enhance results" (checked here in `m2A/cpbp.html`; the same guide is linked from L2 C2 to C4) | BACKED | none |
| L2 C2 Examples in the prompt | Few-shot, 3–5 diverse examples; more can stop helping | Anthropic best practices; Agarwal et al. (per-claim audit) | BACKED | none |
| L2 C3 Output format and delimiters | Delimit sections (XML tags). Prompted format is a request, not a guarantee | Anthropic best practices; Module 1's constrained-decoding facts (per-claim audit) | BACKED | none |
| L2 C4 Chain of thought | Ask for reasoning before the answer. Reasoning models don't need scripted steps | Wei et al., Kojima et al., OpenAI and Anthropic reasoning guidance (per-claim audit) | BACKED | none |
| L2 C5 Iterating systematically | Judge a prompt change against a small representative set, not one output | Nothing on the page. The course's own illustrative test set | UNBACKED | E1: add OpenAI prompt engineering guide |
| L3 intro | The system prompt shapes the whole run; apply Lesson 2's techniques to it | L3 C1 to C4 | BACKED | none |
| L3 C1 What the system prompt is | System-role priority is a trained tendency, not a guarantee | Wallace et al., Instruction Hierarchy (per-claim audit); Module 1 | BACKED | none |
| L3 C2 Role and constraints | Give the agent a role and explicit always/never rules. They nudge, not guarantee | Fundamental. Anthropic best practices, "Give Claude a role": "Setting a role in the system prompt focuses Claude's behavior and tone for your use case" (checked here in `m2A/cpbp.html`) | BACKED | none |
| L3 C3 Tool guidance | The schema covers shape. When to call a tool, and what to do with its result, belongs in the description and/or system prompt | Nothing on the page (the strict-mode fact is verified, per-claim audit C15) | UNBACKED | E2: add Anthropic define-tools and OpenAI function-calling best practices |
| L3 C4 Phase-aware prompting | Code tracks the phase and sends phase-specific instructions at the end, keeping the prefix stable | Placement: Manus "Keep your prompt prefix stable", Anthropic mid-conversation system messages (per-claim audit). Code-owned phase is argued in the text as engineering judgement | BACKED | none (optional E6: Manus's state machine as a production example of code-owned state) |
| L4 intro | The hand-written loop is the base for every later lesson | L4 C1 to C3 | BACKED | none |
| L4 C1 Fake LLM client | Script a fake client's responses to run and grade loop code deterministically | The course's own harness only. A learner may ask "does anyone test agents this way?" | UNBACKED | E3: add LangChain unit-testing guide (`GenericFakeChatModel`) |
| L4 C2 From round trip to loop | Call, check for `tool_use`, execute or stop | Plain mechanics of the API (Module 1); BEA's "in a loop" | BACKED | none |
| L4 C3 Handling multiple tools | Dispatch through a name-to-function registry; `tool_result` content must be text or blocks | Anthropic "Handle tool calls" (per-claim audit C18); a dispatch table is textbook | BACKED | none |
| L5 intro | Reasoning before acting improves tool choice; native tool calling replaced text parsing | L5 C1 to C3 | BACKED | none |
| L5 C1 The ReAct pattern | Reason before each action; handle every block and answer every tool call in one message | ReAct paper, linked in L5 C2 and C3 (per-claim audit); the one-message rule is Anthropic's (per-claim audit C20) | BACKED | none |
| L5 C2 Why reasoning improves tool choice | Reasoning first helps when the tool choice is ambiguous | Wei et al.; Yao et al. ReAct vs Act figures (per-claim audit) | BACKED | none |
| L5 C3 Text-parsed vs native tool calling | Text formats need fragile parsing; native tool calling replaced them | LangChain MRKL prompt, OpenAI June 2023 launch, ReAct (per-claim audit) | BACKED | none |
| L6 intro | Each guard answers a distinct failure mode | L6 C1 to C6 | BACKED | none |
| L6 C1 A loop that never stops | Nothing in the bare loop stops a stuck model, and every call is billed | Plain fact (Module 1 billing); BEA on agent cost (L1 C3) | BACKED | none |
| L6 C2 Max steps | A hard iteration cap is the first guard | Anthropic BEA, linked (per-claim audit) | BACKED | none |
| L6 C3 Repeated-action detection | Stop on repeated identical calls; real systems allow a few repeats | Gemini CLI `loopDetectionService.ts` (per-claim audit) | BACKED | none |
| L6 C4 Goal-state termination | Code checks real state after each step and stops once the goal is met | Nothing on the page. The course's demo shows the saved calls | UNBACKED | E4: add Anthropic BEA "ground truth" line |
| L6 C5 Tool errors as observations | Catch a tool's exception and return it to the model as a `tool_result` | `is_error` is verified (per-claim audit C28), but the page names no source for the technique | UNBACKED (on the page) | E5: link Anthropic "Handle tool calls" |
| L6 C6 Timeouts, retry, give-up | Timeout every call, retry transient failures with backoff and jitter, then give up cleanly | AWS Builders' Library, linked (per-claim audit) | BACKED | none |
| L7 intro | The scratchpad is the agent's whole state. Checkpointing lets long tasks survive interruption | L7 C1 to C3 anchors (LangChain `agent_scratchpad`; LangGraph checkpointers and idempotency, per-claim audit) | BACKED | none |
| L7 C1 The scratchpad | The accumulating `messages` list is the agent's state, because the model is stateless | Plain fact (Module 1 statelessness). Term: LangChain classic `agent_scratchpad` (per-claim audit) | BACKED | none |
| L7 C2 Serializing state | Block objects must be converted to dicts before JSON. Real SDK blocks are Pydantic models, and thinking signatures must round-trip | anthropic-sdk-python `_models.py` and `thinking_block.py` (per-claim audit) | BACKED | none |
| L7 C3 Checkpoint and resume | Save after every step. Make side-effecting tools safe to run twice | LangGraph checkpointers and Functional API §Idempotency (per-claim audit) | BACKED | none |
| L8 intro | Upfront planning is a real alternative to a reactive loop. Choose between them deliberately | LangChain plan-and-execute blog, Tree of Thoughts (per-claim audit) | BACKED | none |
| L8 C1 Goal decomposition | Decompose a goal into sub-tasks before acting. Step-at-a-time loops can be inefficient and lose the bigger picture | The planning anchor sits two concepts later (L8 C4). Nothing backs it where decomposition is introduced | UNBACKED (here) | E1: add LangChain "Plan-and-Execute Agents" motivation |
| L8 C2 Plan representations | Linear, tree and dependency-graph plans. A DAG exposes independent work that can run concurrently | Textbook data structures and topological order | BACKED | none (optional E2: add LLMCompiler as a real DAG planner) |
| L8 C3 Tree of Thought | Search over candidate steps with evaluation and backtracking. Worth it only where CoT struggles | Yao et al., NeurIPS 2023 (per-claim audit: 4% vs 74%, 5–100x tokens) | BACKED | none |
| L8 C4 Plan-and-execute vs reactive | Plan-and-execute trades adaptiveness for predictability. Executors need the goal and prior results | LangChain plan-and-execute blog; Anthropic multi-agent research post (per-claim audit) | BACKED | none |
| L8 C5 Replanning | On a failed step, call the planner again with what was done and why it failed. Cap the replans | LangChain blog re-planning prompt (per-claim audit). The cap reuses Lesson 6's `max_steps` | BACKED | none |
| L9 intro | Evaluator-optimizer for success conditions code can't check. Reflection has a shared-blind-spot limit | L9 C1 to C3 anchors | BACKED | none |
| L9 C1 Evaluator-optimizer | Generate, evaluate against explicit criteria, revise, and repeat under a cap | Anthropic "Building effective agents" ×2 (per-claim audit) | BACKED | none |
| L9 C2 When a second pass helps | Checking is often easier than generating, mainly where checking is easy | Self-Refine, NeurIPS 2023; Kamoi et al., TACL 2024 (per-claim audit) | BACKED | none |
| L9 C3 Shared blind spots | Same-model review shares the generator's gaps. External feedback (tests, tools) is the strongest check | Goel et al., ICML 2025; Panickssery et al., NeurIPS 2024; Huang et al., ICLR 2024 (per-claim audit) | BACKED | none |
| L10 intro | A fixed chain, a router or parallel dispatch is often a better fit than a full agent | Anthropic "Building effective agents" (per-claim audit); Lesson 1 | BACKED | none |
| L10 C1 Chaining and routing | Fixed sequence with a gate between steps; classify, then dispatch to fixed paths | Anthropic "Building effective agents" (per-claim audit) | BACKED | none |
| L10 C2 Parallelization | Run independent calls concurrently (sectioning). Majority of repeated samples is more reliable (voting) | Anthropic guide (per-claim audit). Voting's evidence is Wang et al. self-consistency, ICLR 2023, linked from the Module 1 and Module 6 pages this concept links to | BACKED | none |
| L10 C3 Orchestrator-workers | An LLM decomposes at runtime, workers run the sub-tasks, and results are synthesized | Anthropic "Building effective agents" (per-claim audit) | BACKED | none |
| L11 intro | A framework is the same loop, state and guards, packaged at the cost of visibility | L11 C1 and C3 anchors | BACKED | none |
| L11 C1 What a framework provides | Frameworks package the loop, state, tracing and a deployment path. A tracing hook is an `on_event` callback | OpenAI Agents SDK docs (per-claim audit). The deployment path is a forward pointer; LangChain's docs have a LangSmith deployment section (`agents.md` l.720) | BACKED | none |
| L11 C2 Rebuilding in LangChain | `create_agent`, `@tool`, `recursion_limit`, `ModelCallLimitMiddleware` map onto the hand-built pieces | LangChain/LangGraph docs and source (per-claim audit) | BACKED | none |
| L11 C3 Control given up | Framework defaults hide or change behaviour. Understand the mechanics before adopting | Anthropic "Building effective agents" (per-claim audit); LangGraph `GraphRecursionError` source | BACKED | none |
| L11 C4 A minimal agent class | Wrapping the module's loop in a class shows what a framework packages | The course's own code, illustrating L11 C1's anchored claim. It makes no effectiveness claim | BACKED | none |


Audited 2026-09-30, on branch `citation-audit/module-2`, as a light pass:
verify what's named, and add a source only where a learner would ask "says
who?". Two read-only subagents did the inventory and verification. Their full
reports follow. The lead re-read the primary text for every new quote and
figure before applying it.

The module had no external links before this pass. Every edited text is
prose, a quiz option or an explanation. No demo, exercise or test string
changed, so nothing needed re-running in Pyodide. `npm run build` passes (523
pages), and no internal links were added.

## What happened to each proposed edit

All 39 proposed edits were applied: report A's E1–E16 (including E5's quiz
options and its four optional edits) and report B's E1–E20.

## Totals across the module

- **Verified:** 37.
- **Contradicted:** 3, plus 1 overstatement.
  - The `Thought:` / `Action:` / `Action Input:` format is LangChain's
    ReAct prompt, not the paper's.
  - Provider agent SDKs aren't all tied to one provider: the OpenAI Agents
    SDK runs other providers' models.
  - A recap quiz implied "scratchpad" is the framework's own term (it's
    `messages`).
  - Chain-of-thought prompting "works on any model": Wei et al. found gains
    only at about 100B parameters.
- **Not reachable:** 0.
- **Re-labelled:** 5.
- **Replaced:** 2.
- **Sources added:** 24, plus links for the three named papers.
  - Anthropic's "Building effective agents", credited where each pattern
    is named.
  - Anthropic's and OpenAI's prompting and reasoning guides.
  - The AWS Builders' Library on timeouts, retries and jitter.
  - Gemini CLI's loop detection.
  - LangGraph checkpoints and idempotency, and LangChain's plan-and-execute
    agents.
  - The OpenAI Agents SDK and OpenAI's function-calling launch.
  - Manus.
  - Papers: Kojima et al., Wallace et al., Tree of Thoughts, Self-Refine,
    Kamoi et al., Huang et al., Goel et al., Panickssery et al. and Agarwal
    et al.

## Applied, but worth a look

- **Chain of thought (L2 C4, 2 quiz options, 1 recap option):** it now
  "can be used with any model", with Wei et al.'s finding that gains came
  only at about 100B parameters. The distinction the concept teaches (no
  special training needed) is unchanged.
- **Few-shot (L2 C2):** "3–5" is now credited to Anthropic's guide, with a
  one-line caveat on Agarwal et al.'s many-shot results.
- **Reflection (L9 C2 and two quiz explanations):** "checking is easier
  than generating" now carries Self-Refine's evidence and Kamoi et al.'s
  boundary: it holds where checking is easy. Every example in the lesson is
  one of those.

## Outside citation scope

- **Fixed after the audit, at the owner's request:** L6 C6's
  `call_with_retry` printed "waiting 8s before retrying" after its last
  attempt, then gave up. The demo's `RETRY`, the exercise's reference answer
  and the recap's `execute_tool_safely` reference now print "no retries
  left" on the last failure. The prose lists the waits as "1s, 2s, 4s, and
  so on, with no wait after the last attempt". The hidden tests are
  unchanged: they check return values and attempt counts, and waits of
  [1, 2, 4], so the old-style answer still passes. Verified in Pyodide
  0.26.4 from the page text:
  - both demos run, and the give-up demo now ends with "no retries left";
  - the exercise reference passes all 7 hidden tests;
  - the recap reference passes its hidden tests with real imports between
    its two files;
  - a wrong recap variant, one that retries every exception, still fails.
- The illustrative model ID `claude-sonnet-5` still works, but
  `claude-sonnet-5-5` is now current.

---

## Report: Module 2 citation audit, lessons 01–06 (light touch)

Scope: `src/content/modules/02-the-agent-loop/` lessons `01-agents-workflows-and-the-loop` through `06-termination-failure-and-control`, every `.mdx` (prose, quiz text, exercise text). The lessons contain **zero external links**. There are three named sources: Anthropic's "Building effective agents", Wei et al. (2022) and Yao et al. (2022). Everything else is unsourced practice or API fact.

Downloads and extracted text are in `scratchpad/audit/m2A/`: bea.html, wei.pdf/.txt (v6), react.pdf/.txt (v3), 2205.11916.html (Kojima), manyshot/ms.txt (v3), ih.html, mrkl.py (LangChain), fc.html/so.html (OpenAI via Wayback), handle-tool-calls.html, structured-outputs.html, midsys.html, cpbp.html, orbp2.html, manus.html, awsbl.html (Wayback), loop.ts (Gemini CLI), rn.html.

### 1. Claims table

| ID | file:line | claim (trimmed) | source given | kind | verdict | evidence | recommendation |
|---|---|---|---|---|---|---|---|
| C1 | L01/01-the-perceive-reason-act-observe-cycle.mdx:25 | "This repeating structure is commonly called perceive → reason → act → observe" | none | practice (naming) | UNSOURCED (low stakes) | Anthropic's BEA post describes agents as "LLMs using tools based on environmental feedback in a loop". The four-word name itself is a common teaching label. | keep |
| C2 | L01/02-agent-vs-workflow-vs-chatbot.mdx:82-86 | Who-controls-the-sequence line and "start with the simplest structure" advice; "Anthropic's engineering post 'Building effective agents' (2024)" | named, unlinked | practice | VERIFIED | anthropic.com/engineering/building-effective-agents, "Published Dec 19, 2024": "Workflows are systems where LLMs and tools are orchestrated through predefined code paths. Agents, on the other hand, are systems where LLMs dynamically direct their own processes and tool usage" / "we recommend finding the simplest solution possible, and only increasing complexity when needed." (The page now has a banner: "Much of the tooling landscape described in this post has changed since December 2024". The definitions are unaffected.) | add link (E1) |
| C3 | L01/03-the-honest-case-for-not-using-an-agent.mdx:17-32 | Agents cost unpredictable cost/latency and are harder to test and debug | none | practice | UNSOURCED | Same post: "Agentic systems often trade latency and cost for better task performance" / "The autonomous nature of agents means higher costs, and the potential for compounding errors." | add backing, optional (E2) |
| C4 | L01/03-...:52-59 | Decision test: does control flow depend on runtime information | (implicitly the BEA post) | practice | VERIFIED (consistent) | BEA: "Agents can be used for open-ended problems where it's difficult or impossible to predict the required number of steps, and where you can't hardcode a fixed path." | keep (E1's link covers it) |
| C5 | L02/02-examples-in-the-prompt.mdx:97-104 | "2–5 well-chosen examples typically capture a pattern well"; more gives diminishing returns; too many can over-anchor | none | effectiveness/practice | UNSOURCED; the number is close to the vendor figure, but the "don't help indefinitely" framing is partly qualified by research | Anthropic prompting best practices: "Include 3–5 examples for best results." / "Diverse: Cover edge cases and vary enough that Claude doesn't pick up unintended patterns." Agarwal et al., "Many-Shot In-Context Learning" (arXiv 2404.11018v3, NeurIPS 2024 Spotlight), abstract: "Going from few-shot to many-shot, we observe significant performance gains across a wide variety of generative and discriminative tasks"; §conclusion: performance "sometimes degrades with more examples in the prompt (for example, for MATH)". | re-label and soften (E3) |
| C6 | L02/02-...:110-118 | Near-identical examples mislead the model; cover the real range of variation | none | practice | UNSOURCED | Anthropic, same page: "Diverse: Cover edge cases and vary enough that Claude doesn't pick up unintended patterns." | keep (E3's link to the same guide covers it) |
| C7 | L02/03-output-format-and-delimiters.mdx:42-43 | "XML-style tags are a common choice" | none | practice | UNSOURCED | Anthropic prompting best practices: "XML tags help Claude parse complex prompts unambiguously, especially when your prompt mixes instructions, context, examples, and variable inputs." | lead with an industry source (E4) |
| C8 | L02/03-...:50-53 | Delimiters aren't a security boundary | none | practice | UNSOURCED | Consistent with Wallace et al. 2024 (see C14). | keep |
| C9 | L02/04-chain-of-thought-prompting.mdx:68-70, 75-76 (and quiz options :119, :131; 06-recap-practice.mdx:128) | CoT prompting "is a technique that works on *any* model" | none | effectiveness | UNSOURCED; **overstated** according to the paper the course names in Lesson 5 | Wei et al. v6 §3.2: "chain-of-thought prompting is an emergent ability of model scale ... chain-of-thought prompting does not positively impact performance for small models, and only yields performance gains when used with models of ∼100B parameters. We qualitatively found that models of smaller scale produced fluent but illogical chains of thought, leading to lower performance than standard prompting." | soften (E5, E5b–d) |
| C10 | L02/04-...:40-44 | "Think step by step, then give your final answer" as the CoT fix | none | practice | UNSOURCED (attribution) | Kojima et al., "Large Language Models are Zero-Shot Reasoners" (arXiv 2205.11916v4, NeurIPS 2022): "LLMs are decent zero-shot reasoners by simply adding 'Let's think step by step' before each answer." Wei et al.'s method differs: "a few chain of thought demonstrations are provided as exemplars in prompting." | add attribution, optional (E6) |
| C11 | L02/04-...:77-79 | Prompted CoT on a standard model is "generally less reliable" than a trained reasoning model | none | effectiveness | UNSOURCED | No clean head-to-head source. Vendor launch posts compare reasoning models with non-reasoning ones, not with CoT-prompted ones. The hedge ("generally") is already there. | keep |
| C12 | L02/04-...:81-85 | "providers generally advise against scripting its reasoning" | "providers", unnamed | practice | VERIFIED | OpenAI reasoning best practices (developers.openai.com/api/docs/guides/reasoning-best-practices): "Avoid chain-of-thought prompts: Since these models perform reasoning internally, prompting them to "think step by step" or "explain your reasoning" is unnecessary." Anthropic prompting best practices: "Prefer general instructions over prescriptive steps. A prompt like "think thoroughly" often produces better reasoning than a hand-written step-by-step plan." | name the providers (E7) |
| C13 | L02/05-iterating-systematically.mdx | Check a small representative set together, not one output | none | practice | UNSOURCED | Deliberately scoped as a habit, with formal evals deferred to a later module. | keep |
| C14 | L03/01-what-the-system-prompt-is.mdx:13-22 | System-role priority is a trained tendency, not an architectural guarantee | Module 1 link | fact/mechanism | UNSOURCED externally; consistent with the literature | Wallace et al., "The Instruction Hierarchy" (arXiv 2404.13208v1, preprint, OpenAI): "LLMs often consider system prompts (e.g., text from an application developer) to be the same priority as text from untrusted users and third parties." They propose training models to prioritize them. | add backing, optional (E8) |
| C15 | L03/03-tool-guidance.mdx:22-23 (also L05/03:73-75) | With strict mode on, constrained decoding guarantees arguments match the schema | Module 1 link | API fact | VERIFIED | Anthropic structured-outputs docs: "Strict tool use (strict: true): Guarantee schema validation on tool names and inputs." / "Structured outputs guarantee schema-compliant responses through constrained decod[ing]". | keep |
| C16 | L03/04-phase-aware-prompting.mdx:81-83 | "The usual fix keeps the system prompt fixed ... sends the current phase ... at the end" | none | practice | UNSOURCED | Manus, "Context Engineering for AI Agents: Lessons from Building Manus" (Yichao 'Peak' Ji, 2025-07-18): "1. Keep your prompt prefix stable. Due to the autoregressive nature of LLMs, even a single-token difference can invalidate the cache from that token onward." | lead with an industry source (E9) |
| C17 | L03/04-...:99-101 | "Some APIs now offer a dedicated way to add an instruction partway through a conversation without touching the original system prompt" | none | API fact | VERIFIED | Anthropic docs, "Mid-conversation system messages and tool changes": "Change system instructions or tool availability partway through a conversation without invalidating the cached prefix that came before them." The page covers `role: "system"` messages appended to `messages`, on recent models. | name it and link (E10) |
| C18 | L04/03-handling-multiple-tools.mdx:96-100 | A tool_result's `content` must be text or a list of content blocks | none | API fact | VERIFIED | Anthropic "Handle tool calls": "content (optional): The result of the tool, as a string ..., a list of nested content blocks ..., or a list of document blocks". | keep |
| C19 | L05/01-the-react-pattern.mdx:60-66 | Standard model: reasoning arrives as a text block. Extended thinking: a `thinking` block. | Module 1 link | API fact | not re-checked (Module 1's claim) | — | keep |
| C20 | L05/01-...:201-204 (and L06/03:81-85) | Every tool_use needs its result in the very next message | Module 1 link | API fact | VERIFIED | Anthropic "Handle tool calls": "Tool result blocks must immediately follow their corresponding tool use blocks in the message history. You cannot include any messages between the assistant's tool use message and the user's tool result message." (L03/04's demo puts the phase text *after* tool_results, which matches "Any text must come AFTER all tool results.") | keep |
| C21 | L05/02-why-reasoning-before-acting-improves-tool-choice.mdx:69-70 | "Wei et al. (2022) ... found that prompting for intermediate reasoning steps improved accuracy on multi-step problems" | named, unlinked | effectiveness | VERIFIED (loose wording) | arXiv 2201.11903v6 (NeurIPS 2022), abstract: "generating a chain of thought -- a series of intermediate reasoning steps -- significantly improves the ability of large language models to perform complex reasoning ... chain of thought prompting improves performance on a range of arithmetic, commonsense, and symbolic reasoning tasks." The method is few-shot exemplars, in large models. | add link; tighten wording (E11) |
| C22 | L05/02-...:71-72 | "the ReAct paper itself (Yao et al., 2022) measured the gain from interleaving reasoning with actions on tasks that needed tools" | named, unlinked | effectiveness | VERIFIED | arXiv 2210.03629v3 (ICLR 2023 camera-ready), §3.3/§4: "Act prompts are constructed using the same trajectories, but without thoughts"; "On ALFWorld, the best ReAct trial achieves an average success rate of 71%, significantly outperforming the best Act (45%)". WebShop success rate is 40.0 for ReAct and 30.1 for Act (Table 4). HotpotQA EM is 27.4 for ReAct and 25.7 for Act (Table 1). Caveat, not needed in prose: on HotpotQA, ReAct alone trailed CoT (29.4). The best results came from combining the two. | add link and one figure (E11) |
| C23 | L05/03-text-parsed-format-vs-native-tool-calling.mdx:13-22 (demo :35-50; quiz :94; 04-recap-practice.mdx:76) | "The original ReAct approach ..." shown as `Thought:` / `Action: get_weather` / `Action Input: {...}` | none | fact (history) | **CONTRADICTED** (attribution of format) | The ReAct paper's own prompts use numbered lines with bracketed actions: "Thought 1 ... Action 1 Search[Colorado orogeny] ... Observation 1" (react.txt, Appendix prompts). The `Action:` / `Action Input:` format is LangChain's ReAct (MRKL) prompt: "Thought: you should always think about what to do / Action: the action to take, should be one of [{tool_names}] / Action Input: the input to the action / Observation: the result of the action" (langchain `langchain_classic/agents/mrkl/prompt.py`). The concept's point (a text format needs fragile parsing) is unaffected. | re-label (E12). Demo and quiz unchanged. |
| C24 | L05/03-...:69-73 | Native tool calling replaced text parsing "starting around 2023" because models were trained to emit tool calls | none | fact (history) | VERIFIED | OpenAI, "Function calling and other API updates", June 13, 2023 (Wayback): "These models have been fine-tuned to both detect when a function needs to be called (depending on the user's input) and to respond with JSON that adheres to the function signature." | add source, optional (E13) |
| C25 | L05/03-...:73-74 | "Strict mode came later (2024–2025)" | none | fact | VERIFIED | OpenAI "Introducing Structured Outputs in the API", August 6, 2024. Anthropic release notes: "November 14, 2025 We've launched structured outputs in public beta, providing guaranteed schema conformance". | keep |
| C26 | L06/02-max-steps.mdx:14-19 | A hard iteration cap as the first guard | none | practice | UNSOURCED | BEA: "The task often terminates upon completion, but it's also common to include stopping conditions (such as a maximum number of iterations) to maintain control." | lead with an industry source (E14) |
| C27 | L06/03-repeated-action-detection.mdx:98-101 | "Real implementations usually loosen the rule: allow a small number of repeats" | none | practice | UNSOURCED | Gemini CLI `loopDetectionService.ts` (commit acae712, 2026-07-17): `const TOOL_CALL_LOOP_THRESHOLD = 5;`. Key = `${toolCall.name}:${argsString}`. It checks "repeating patterns of cycle length k from 1 to 5". So one call has to repeat 5 times in a row, or a cycle of up to 5 calls has to repeat 5 times. | lead with an industry source (E15) |
| C28 | L06/05-tool-errors-as-observations.mdx:127-130 | Claude's API has an `is_error: true` flag on tool_result | none | API fact | VERIFIED | Anthropic "Handle tool calls": "is_error (optional): Set to true if the tool execution resulted in an error." / "you can return the error message in the content along with "is_error": true". | keep |
| C29 | L06/06-timeouts-retry-and-graceful-give-up.mdx:52-57 | Every tool call needs a timeout or one hung call blocks the loop | none | practice | UNSOURCED | AWS Builders' Library, "Timeouts, retries, and backoff with jitter" (Wayback): "A best practice in Amazon is to set a timeout on any remote call, and generally on any call across processes even on the same box." | add source (E16, together with C30) |
| C30 | L06/06-...:81-88 | Production retry logic adds jitter so clients don't retry in lockstep | none | practice | UNSOURCED | Same article: "If errors are caused by load, retries can be ineffective if all clients retry at the same time. To avoid this problem, we employ jitter." | lead with an industry source (E16) |
| C31 | L02/03-...:84-86 | "A well-built real system typically uses both" (prompted format and constrained decoding) | none | practice | UNSOURCED (low stakes) | — | keep |

Incidental, outside citation scope: in L06/06, `call_with_retry` prints "waiting 8s before retrying" after the final failed attempt and then gives up. The last message is misleading. (No sleep is ever called, and the prose already says so.)

### 2. Proposed edits

None of these edits touch an exercise or demo code string, so none needs Pyodide re-verification. E5b–E5d are quiz option text (a two-word swap, length almost unchanged). The CoT quiz explanations don't repeat "any model".

**E1. `01-agents-workflows-and-the-loop/02-agent-vs-workflow-vs-chatbot.mdx`**
Current:
```
This way of drawing the line, and the advice that comes with it (start
with the simplest structure that works, and reach for an agent only when
the steps genuinely can't be laid out in advance), is widely used in
practice; one clear source is Anthropic's engineering post "Building
effective agents" (2024), which is worth reading alongside this module.
```
Proposed:
```
This way of drawing the line, and the advice that comes with it (start
with the simplest structure that works, and reach for an agent only when
the steps genuinely can't be laid out in advance), is widely used in
practice. One clear source is Anthropic's engineering post
["Building effective agents"](https://www.anthropic.com/engineering/building-effective-agents)
(December 2024), which is worth reading alongside this module. It
defines workflows as "systems where LLMs and tools are orchestrated
through predefined code paths", and agents as systems where LLMs
"dynamically direct their own processes and tool usage".
```

**E2 (optional). `01-agents-workflows-and-the-loop/03-the-honest-case-for-not-using-an-agent.mdx`**
Current:
```
  harder problem than debugging a fixed, linear workflow, where the
  entire control flow is already fully visible directly in the code.

</Subsection>
```
Proposed:
```
  harder problem than debugging a fixed, linear workflow, where the
  entire control flow is already fully visible directly in the code.

Anthropic's
["Building effective agents"](https://www.anthropic.com/engineering/building-effective-agents)
names the same trade: agentic systems "often trade latency and cost for
better task performance", and an agent's autonomy "means higher costs,
and the potential for compounding errors".

</Subsection>
```

**E3. `02-prompting-fundamentals/02-examples-in-the-prompt.mdx`**
Current:
```
More examples aren't free, and don't help indefinitely: 2–5 well-chosen
examples typically capture a pattern well; adding many more past that
point produces diminishing returns while adding real,
[unavoidable token cost](/01-llm-foundations/11-quantization-cost-and-operational-concerns/03-token-based-pricing/)
to every single request. Past a certain point, too many examples can even
```
Proposed:
```
More examples aren't free. A handful of well-chosen examples usually
captures a pattern; Anthropic's
[prompting guide](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
suggests 3–5. Each one past that adds real,
[unavoidable token cost](/01-llm-foundations/11-quantization-cost-and-operational-concerns/03-token-based-pricing/)
to every single request. (Research on long-context models has found
gains from hundreds of examples on some tasks, and drops on others, in
[Agarwal et al., 2024](https://arxiv.org/abs/2404.11018), NeurIPS 2024.
In a prompt an agent resends on every call, that's rarely worth it.)
Past a certain point, too many examples can even
```
Related text, left as is: the quiz option at `02-examples-in-the-prompt.mdx:155` and `06-recap-practice.mdx:68` ("Returns diminish past a small number of well-chosen examples...") and the explanations at :161 and recap :74 ("The first few examples do most of the work"). They stay defensible framed as practice in a token-priced prompt. See Needs a decision #2.

**E4. `02-prompting-fundamentals/03-output-format-and-delimiters.mdx`**
Current:
```
`<feedback>...</feedback>` — XML-style tags are a common choice, though
markdown headers or another consistent marker work the same way —
```
Proposed:
```
`<feedback>...</feedback>` — XML-style tags are a common choice
([Anthropic's prompting guide](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
recommends them for prompts that mix "instructions, context, examples,
and variable inputs"), though markdown headers or another consistent
marker work the same way —
```

**E5. `02-prompting-fundamentals/04-chain-of-thought-prompting.mdx`**
Current:
```
chain-of-thought *prompting*, as covered here, is a technique that works
on *any* model, achieved purely by how the prompt is written — no special
training required. A dedicated reasoning model has been *specifically
```
Proposed:
```
chain-of-thought *prompting*, as covered here, is a technique you can use
with *any* model, achieved purely by how the prompt is written — no special
training required. Whether it helps depends on the model: the
[original study](https://arxiv.org/abs/2201.11903) (Wei et al., NeurIPS
2022) found gains only in its largest models, of around 100B parameters.
Smaller ones wrote fluent but illogical steps and did worse than without
them. A dedicated reasoning model has been *specifically
```

**E5b. `02-prompting-fundamentals/04-chain-of-thought-prompting.mdx`** (quiz option)
Current:
```
        "No — CoT prompting works on any model purely through how the prompt is written; a reasoning model has been specifically trained via RL to produce extended reasoning automatically",
```
Proposed:
```
        "No — CoT prompting can be used with any model purely through how the prompt is written; a reasoning model has been specifically trained via RL to produce extended reasoning automatically",
```

**E5c. `02-prompting-fundamentals/04-chain-of-thought-prompting.mdx`** (quiz option)
Current:
```
        "A full reasoning model isn't always available or worth its extra cost for a given task, and CoT prompting is a real, widely-applicable technique that works on any model without that added cost",
```
Proposed:
```
        "A full reasoning model isn't always available or worth its extra cost for a given task, and CoT prompting is a real, widely-applicable technique that can be used with any model without that added cost",
```

**E5d. `02-prompting-fundamentals/06-recap-practice.mdx`** (quiz option)
Current:
```
        "No — CoT prompting works on any model through prompt wording alone; a reasoning model is specifically trained via RL to reason automatically",
```
Proposed:
```
        "No — CoT prompting can be used with any model through prompt wording alone; a reasoning model is specifically trained via RL to reason automatically",
```

**E6 (optional). `02-prompting-fundamentals/04-chain-of-thought-prompting.mdx`**
Current:
```
This isn't just a formatting difference —
```
Proposed:
```
Adding a phrase like this is known as zero-shot chain-of-thought.
[Kojima et al. (2022)](https://arxiv.org/abs/2205.11916) (NeurIPS 2022)
showed that "Let's think step by step" alone helps. The original method
showed the model worked examples with their steps written out instead.

This isn't just a formatting difference —
```

**E7. `02-prompting-fundamentals/04-chain-of-thought-prompting.mdx`**
Current:
```
reasons before answering, and providers generally advise against
scripting its reasoning. Give a reasoning model the goal and the
```
Proposed:
```
reasons before answering, and providers advise against scripting its
reasoning. OpenAI's
[reasoning guide](https://developers.openai.com/api/docs/guides/reasoning-best-practices)
says prompting these models to "think step by step" "is unnecessary".
Anthropic's
[prompting guide](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
says a prompt like "think thoroughly" "often produces better reasoning
than a hand-written step-by-step plan". Give a reasoning model the goal and the
```

**E8 (optional). `03-the-system-prompt-as-agent-design/01-what-the-system-prompt-is.mdx`**
Current:
```
behavior — a real, strong, training-reinforced tendency, not an
unbreakable technical guarantee baked into the architecture itself.
```
Proposed:
```
behavior — a real, strong, training-reinforced tendency, not an
unbreakable technical guarantee baked into the architecture itself.
OpenAI's
[instruction-hierarchy paper](https://arxiv.org/abs/2404.13208) (Wallace
et al., 2024, a preprint) shows the other side: without training for
it, models "often consider system prompts ... to be the same priority as
text from untrusted users".
```

**E9. `03-the-system-prompt-as-agent-design/04-phase-aware-prompting.mdx`**
Current:
```
The usual fix keeps the system prompt fixed, describing each phase once,
and sends the *current* phase as a short instruction at the end of the
conversation, where it's new anyway:
```
Proposed:
```
The usual fix keeps the system prompt fixed, describing each phase once,
and sends the *current* phase as a short instruction at the end of the
conversation, where it's new anyway. "Keep your prompt prefix stable" is
the first rule in Manus's write-up of
[building its agent](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus),
for exactly this reason:
```

**E10. `03-the-system-prompt-as-agent-design/04-phase-aware-prompting.mdx`**
Current:
```
instruction sits has changed. Some APIs now offer a dedicated way to add
an instruction partway through a conversation without touching the
original system prompt, for the same reason. It's a pattern worth
```
Proposed:
```
instruction sits has changed. Some APIs now offer a dedicated way to add
an instruction partway through a conversation without touching the
original system prompt, for the same reason. Anthropic's API, for
example, accepts a
[`system`-role message partway through `messages`](https://platform.claude.com/docs/en/build-with-claude/mid-conversation-system-messages)
on recent models, and the cached prefix stays intact. It's a pattern worth
```

**E11. `05-react-and-reasoning-in-the-loop/02-why-reasoning-before-acting-improves-tool-choice.mdx`**
Current:
```
was measured by Wei et al. (2022), who found that prompting for
intermediate reasoning steps improved accuracy on multi-step problems,
and the ReAct paper itself (Yao et al., 2022) measured the gain from
interleaving reasoning with actions on tasks that needed tools. This
```
Proposed:
```
was measured by
[Wei et al. (2022)](https://arxiv.org/abs/2201.11903) (NeurIPS 2022).
They found that showing large models worked examples with the
intermediate steps written out improved accuracy on arithmetic,
commonsense, and symbolic reasoning problems. The ReAct paper itself,
[Yao et al. (2022)](https://arxiv.org/abs/2210.03629) (ICLR 2023),
measured the gain from interleaving reasoning with actions on tasks that
needed tools. On ALFWorld, a text-based household-task game, its best
run succeeded 71% of the time, against 45% for the same examples with
the reasoning removed. This
```

**E12. `05-react-and-reasoning-in-the-loop/03-text-parsed-format-vs-native-tool-calling.mdx`**
Current:
```
— the model produced its reasoning and its intended action as plain
text, in an expected format:
```
Proposed:
```
— the model produced its reasoning and its intended action as plain
text, in an expected format. The
[paper](https://arxiv.org/abs/2210.03629) wrote actions like
`Search[Colorado orogeny]`. A widely used version,
[LangChain's ReAct agent prompt](https://github.com/langchain-ai/langchain/blob/master/libs/langchain/langchain_classic/agents/mrkl/prompt.py),
put them on separate lines like these:
```
(The demo, quiz :94 and recap :76 all describe this `Action:` / `Action Input:` shape and can stay as they are.)

**E13 (optional). `05-react-and-reasoning-in-the-loop/03-text-parsed-format-vs-native-tool-calling.mdx`**
Current:
```
precisely why native tool calling replaced the original text-parsed
format, starting around 2023: not because reasoning-before-acting
```
Proposed:
```
precisely why native tool calling replaced the original text-parsed
format, starting around 2023. OpenAI's
[June 2023 launch](https://openai.com/index/function-calling-and-other-api-updates/)
said its models had "been fine-tuned to both detect when a function
needs to be called ... and to respond with JSON that adheres to the
function signature". It happened not because reasoning-before-acting
```
(Check the sentence still reads cleanly with the following line: "stopped mattering, but because models were *trained* ...".)

**E14. `06-termination-failure-and-control/02-max-steps.mdx`**
Current:
```
reached, the loop stops — cleanly, not via a crash — whether or not the
task was actually completed.
```
Proposed:
```
reached, the loop stops — cleanly, not via a crash — whether or not the
task was actually completed. It's the standard first guard. Anthropic's
["Building effective agents"](https://www.anthropic.com/engineering/building-effective-agents)
notes it's "common to include stopping conditions (such as a maximum
number of iterations) to maintain control".
```

**E15. `06-termination-failure-and-control/03-repeated-action-detection.mdx`**
Current:
```
implementations usually loosen the rule: allow a small number of
repeats before stopping, or only flag a repeat when its result was also
identical to last time.
```
Proposed:
```
implementations usually loosen the rule: allow a small number of
repeats before stopping, or only flag a repeat when its result was also
identical to last time. Google's Gemini CLI, for example,
[flags a tool-call loop](https://github.com/google-gemini/gemini-cli/blob/acae7124bdd849e554eaa5e090199a0cf08cd782/packages/core/src/services/loopDetectionService.ts)
only once the same call, with the same arguments, comes up five times
in a row. It also catches a short cycle of different calls repeating
five times.
```

**E16. `06-termination-failure-and-control/06-timeouts-retry-and-graceful-give-up.mdx`**
Current:
```
retrying in lockstep, hammering the recovering service with synchronized
bursts; jitter spreads those retries out instead.
```
Proposed:
```
retrying in lockstep, hammering the recovering service with synchronized
bursts; jitter spreads those retries out instead. The Amazon Builders'
Library article on
[timeouts, retries, and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/)
covers both this and the timeout above. Retries "can be ineffective if
all clients retry at the same time", so "we employ jitter", and "a best
practice in Amazon is to set a timeout on any remote call".
```

### 3. Needs a decision

1. **CoT "works on any model" (C9 / E5, E5b–d).** Wei et al., the paper the course itself cites in Lesson 5, found CoT gives no gain below roughly 100B parameters and hurt smaller models. The concept's real point (prompting technique vs. trained capability) survives. The change is only "works on" → "can be used with" plus one sentence, but it changes the correct option wording in three quiz questions. Recommendation: apply it.
2. **"More examples don't help indefinitely" (C5 / E3).** Many-shot ICL research (Agarwal et al., NeurIPS 2024) found significant gains from hundreds of examples on many tasks, with long-context models. The concept teaches that a handful is enough and more has diminishing returns. That still holds as practice for a prompt paid for on every call, and Anthropic says 3–5. Recommendation: keep the teaching, attribute the number to Anthropic and add the one-line research caveat, as in E3. Leave the quiz and recap wording alone.

No other item changes what a concept teaches. C23 (the ReAct format) is an attribution fix only.

### 4. Counts

- Verified: 12 (C2, C4, C12, C15, C17, C18, C20, C21, C22, C24, C25, C28)
- Contradicted: 1 (C23, the ReAct format attribution). One more unsourced claim is overstated according to Wei et al. (C9).
- Not reachable: 0 (OpenAI pages via Wayback, AWS via Wayback)
- Re-labelled: 3 (C5 number attributed to Anthropic, C9 softened, C23 format re-attributed)
- Replaced: 0
- Sources added: 12 new anchors for unsourced claims (C3, C5, C7, C10, C12, C14, C16, C17, C24, C26, C27, C29/C30). 4 of these are optional: E2, E6, E8, E13. Also 3 links added for already-named sources (BEA, Wei, Yao).
- Kept without change: C1, C6, C8, C11, C13, C18, C19, C20, C25, C28, C31

---

## Report: Module 2, Lessons 7–11: citation audit (light touch)

Scope: `src/content/modules/02-the-agent-loop/` lessons 07–11, every `.mdx`.
Module 2 currently has **no external links at all**. The only named research in
scope is Huang et al. (Lesson 9). Everything else is named practice that isn't
attributed: evaluator-optimizer, prompt chaining, routing, sectioning/voting,
orchestrator-workers, Tree of Thought, plan-and-execute and self-preference bias.
Reflexion, Self-Refine, Plan-and-Solve and least-to-most are **not mentioned**
anywhere in these lessons. I propose Self-Refine only as backing for one claim (E9).

Downloads and extracts are in `audit/m2B/`: `bea.html`, `mars.html`, `plan.html`,
`huang.txt`, `selfrefine.txt`, `kamoi.txt`, `tot.txt`, `factory.py`, `mcl.py`,
`types.py`, `tca.py`, `cp.md`, `mw.md`, `tools.md`, `oai.md`, `oaidocs.md`,
`casdk.md`, `models.html` and `dep.html`.

### 1. Claims table

| ID | file:line | claim (trimmed) | source given | kind | verdict | evidence | recommendation |
|---|---|---|---|---|---|---|---|
| C1 | 07/01-the-scratchpad.mdx:18 | "this accumulating list is commonly called the agent's **scratchpad**" | none | practice | UNSOURCED (term verified) | LangChain classic `create_tool_calling_agent` docstring (`tca.py` l.86-88): "The agent prompt must have an `agent_scratchpad` key that is a `MessagesPlaceholder`. Intermediate agent actions and tool output messages will be passed in here." | add source (E1, optional, low priority) |
| C2 | 07/02-serializing-state.mdx:101-105 | real SDK blocks "are actually Pydantic models under the hood… `.model_dump()`" | none | fact | VERIFIED | anthropic-sdk-python `src/anthropic/_models.py` l.108: `class BaseModel(pydantic.BaseModel):`; `types/thinking_block.py`: `class ThinkingBlock(BaseModel):` | keep |
| C3 | 07/02-serializing-state.mdx:110-117 | a thinking block carries a `signature` the API checks when sent back | internal link (Module 1) | fact | VERIFIED | `types/thinking_block.py`: "signature: str — A value used to verify that this thinking block was generated by Claude when it is passed back to the API… pass them back exactly as received, with this field intact." | keep |
| C4 | 07/03-checkpoint-and-resume.mdx:129-136 | "Checkpoint after every completed step… make side-effecting tools safe to run twice" | none | practice | UNSOURCED | LangGraph Checkpointers doc (`cp.md` l.9): "A checkpointer saves a snapshot of graph state at each super-step". LangGraph Functional API, §Idempotency: "A **task** that started but did not finish may run again on that resume, so design side effects to be idempotent. Use idempotency keys or verify existing results to avoid unintended duplication." | add industry anchor (E2) |
| C5 | 08/03-tree-of-thought.mdx:22-26 | ToT: several candidate next steps, evaluate, explore promising, backtrack | none (named technique) | practice | VERIFIED (unlinked) | Yao et al., arXiv 2305.10601 v2 (NeurIPS 2023 camera-ready), abstract: "ToT allows LMs to perform deliberate decision making by considering multiple different reasoning paths and self-evaluating choices to decide the next course of action, as well as looking ahead or backtracking when necessary" | link canonical paper (E3) |
| C6 | 08/03-tree-of-thought.mdx:94-96 | ToT on easy problems means "spending several times the cost" | none | effectiveness | VERIFIED, understated | ToT v2, App. B.3: "cost and efficiency of ToT highly depend on the prompts and search algorithms used, and could require 5-100 times more generated tokens than CoT." | re-word with the paper's range (E4) |
| C7 | 08/03-tree-of-thought.mdx:89-93 | ToT is worth it where an early misstep is hard to recover from (puzzles, interacting constraints) | none | effectiveness | VERIFIED | ToT v2, abstract: "in Game of 24, while GPT-4 with chain-of-thought prompting only solved 4% of tasks, our method achieved a success rate of 74%." App. B.3: "We recommend using ToT on tasks requiring deliberate reasoning, on which CoT struggles." | add figure + recommendation (E4) |
| C8 | 08/03-tree-of-thought.mdx:33-35 | "trained reasoning models routinely backtrack mid-chain" | none | fact | UNSOURCED | not checked (widely reported, e.g. DeepSeek-R1's "aha moment") | keep; low priority |
| C9 | 08/04-plan-and-execute-vs-reactive.mdx:18-21 | naming **plan-and-execute** as the alternative architecture | none | practice | UNSOURCED | LangChain blog "Plan-and-Execute Agents" (13 Feb 2024): "A planner, which prompts an LLM to generate a multi-step plan to complete a large task. Executor(s), which accept the user query and a step in the plan and invoke 1 or more tools to complete that task. Once execution is completed, the agent is called again with a re-planning prompt…" (based "loosely on Wang, et. al.'s paper on Plan-and-Solve Prompting, and Yohei Nakajima's BabyAGI") | add industry anchor (E5) |
| C10 | 08/04-plan-and-execute-vs-reactive.mdx:71-72 | "Sending a sub-task alone is a common way plan-and-execute agents go wrong." | none | practice | UNSOURCED | Anthropic, "How we built our multi-agent research system" (13 Jun 2025): "Each subagent needs an objective, an output format, guidance on the tools and sources to use, and clear task boundaries… We started by allowing the lead agent to give simple, short instructions… but found these instructions often were vague enough that subagents misinterpreted the task or performed the exact same searches as other agents." | add industry anchor (E6) |
| C11 | 08/04-plan-and-execute-vs-reactive.mdx:74-76 | "In real plan-and-execute systems, each sub-task usually runs as its own small agent loop" | none | practice | VERIFIED | LangChain blog (above): executors "invoke 1 or more tools to complete that task" | keep (covered by E5) |
| C12 | 08/05-replanning-when-a-step-fails.mdx:102-110 | replanning = call the planner again with what was learned | none | practice | VERIFIED | LangChain blog (above): "called again with a re-planning prompt, letting it decide whether to finish with a response or whether to generate a follow-up plan" | keep (covered by E5) |
| C13 | 09/01-the-evaluator-optimizer-pattern.mdx:29-31 | the **evaluator-optimizer pattern** | none (named pattern) | practice | UNSOURCED (term verified) | Anthropic, "Building effective agents" (19 Dec 2024): "In the evaluator-optimizer workflow, one LLM call generates a response while another provides evaluation and feedback in a loop." | attribute (E7) |
| C14 | 09/01-the-evaluator-optimizer-pattern.mdx:82-90 | writing concrete criteria is "most of the work of a useful evaluator" | none | practice | VERIFIED (in spirit) | same post: "This workflow is particularly effective when we have clear evaluation criteria, and when iterative refinement provides measurable value." | add one-line anchor (E8) |
| C15 | 09/02-when-a-second-pass-helps.mdx:17-30 | checking a candidate against criteria is often easier than generating it, so reflection can catch misses | none (hedged "plausible") | effectiveness | UNSOURCED; primary evidence **narrows** it | Self-Refine (Madaan et al., NeurIPS 2023, arXiv v2) abstract: "outputs generated with Self-Refine are preferred by humans and automatic metrics over those generated with the same LLM using conventional one-step generation, improving by ~20% absolute on average"; §3.3: math gains are "modest… (e.g., ChatGPT feedback for 94% instances is 'everything looks good')". Kamoi et al., TACL 2024 (arXiv 2406.01297 v3) §7: "the hypothesis that recognizing errors is easier than avoiding them (Saunders et al., 2022) is only true for certain tasks whose verification is exceptionally easy" | add backing and narrow (E9) — **Needs a decision** |
| C16 | 09/02-when-a-second-pass-helps.mdx:74; 09/04-recap-practice.mdx:58 | quiz explanations: "so the same model can do it more reliably" | none | effectiveness | overstated vs C15 evidence | as C15 | soften (E10, E11) |
| C17 | 09/03-the-limits-shared-blind-spots.mdx:22-25 | "The standard partial fix… use a *different* (often stronger) model as the judge, or… a fresh context" | none | practice | UNSOURCED | — | soften "standard" to "common" (part of E12); no new source |
| C18 | 09/03-the-limits-shared-blind-spots.mdx:25-26 | "models trained on similar data share many blind spots" | none | effectiveness | VERIFIED in substance; the "similar data" cause isn't what the papers show | Goel et al., ICML 2025 (arXiv 2502.04313 v2): "model mistakes are becoming more similar with increasing capabilities, pointing to risks from correlated failures." Kim et al., ICML 2025 (2506.07962): "on one leaderboard dataset, models agree 60% of the time when both models err… factors driving model correlation, including shared architectures and providers." | re-word and link (E12) |
| C19 | 09/03-the-limits-shared-blind-spots.mdx:26-27 | LLM judges "measurably favor text that resembles their own (a known *self-preference bias*)" | none | effectiveness | VERIFIED | Panickssery, Bowman & Feng, NeurIPS 2024 (arXiv 2404.13076): "self-preference, where an LLM evaluator scores its own outputs higher than others' while human annotators consider them of equal quality." Goel et al.: "LLM-as-a-judge scores favor models similar to the judge, generalizing recent self-preference results." | link (E12) |
| C20 | 09/03-the-limits-shared-blind-spots.mdx:164-168 | Huang et al. (2023), "Large Language Models Cannot Self-Correct Reasoning Yet": self-review without outside feedback "often didn't improve… sometimes made them worse" | named, unlinked | effectiveness | VERIFIED | arXiv 2310.01798 v2 (ICLR 2024), abstract: "LLMs struggle to self-correct their responses without external feedback, and at times, their performance even degrades after self-correction." Scope: GSM8K, CommonSenseQA, HotpotQA (§3.1). | link; give venue (ICLR 2024) and reasoning-benchmark scope (E13) |
| C21 | 09/03-the-limits-shared-blind-spots.mdx:168-170 | "The self-correction results that hold up tend to have an external signal behind them" | none | effectiveness | VERIFIED | Huang et al. §1: "the improvements in these studies result from using oracle labels to guide the self-correction process, and the improvements vanish when oracle labels are not available." §6: "when valid external feedback is available, it is beneficial to leverage it… Chen et al. (2023b) show that LLMs can significantly improve their code generation performance through self-debugging by including code execution results". Kamoi et al. abstract: "(2) self-correction works well in tasks that can use reliable external feedback" | keep; fold into E13 |
| C22 | 10/01-prompt-chaining-and-routing.mdx:19-22, 44-46 | prompt chaining = fixed sequence with a check between steps | none (named pattern) | practice | VERIFIED | Building effective agents: "Prompt chaining decomposes a task into a sequence of steps, where each LLM call processes the output of the previous one. You can add programmatic checks (see "gate" in the diagram below) on any intermediate steps to ensure that the process is still on track." | attribute the lesson's pattern names (E14) |
| C23 | 10/01-prompt-chaining-and-routing.mdx:79-81 | routing = a classification step choosing between fixed downstream paths | none | practice | VERIFIED | same post: "Routing classifies an input and directs it to a specialized followup task." | keep (covered by E14) |
| C24 | 10/02-parallelization.mdx:92-95 | "often called **sectioning**… often called **voting**" | none | practice | VERIFIED | same post: "Sectioning: Breaking a task into independent subtasks run in parallel. Voting: Running the same task multiple times to get diverse outputs." | attribute (E15) |
| C25 | 10/03-orchestrator-workers.mdx:66-69 | "in the usual form of this pattern, each worker is itself an LLM call, and the orchestrator synthesizes… with one more call" | none | practice | VERIFIED | same post: "a central LLM dynamically breaks down tasks, delegates them to worker LLMs, and synthesizes their results… the key difference from parallelization is its flexibility—subtasks aren't pre-defined, but determined by the orchestrator based on the specific input." | attribute (E16) |
| C26 | 10/02-parallelization.mdx:84-86 | real concurrency needs the SDK's async client, e.g. `AsyncAnthropic` | none | fact | VERIFIED | anthropic-sdk-python `__init__.py` l.6 exports `AsyncAnthropic` | keep |
| C27 | 11/01-what-a-framework-actually-provides.mdx:12-32 | a framework packages the loop, state handling, tracing hooks and a deployment path | none | practice | UNSOURCED | OpenAI Agents SDK docs index: "Build agents with instructions, tools, guardrails, handoffs, and a built-in loop that continues until the task is complete." README: "Sessions: Automatic conversation history management across agent runs", "Tracing: Built-in tracking of agent runs". LangChain overview: "LangChain's agents are built on top of LangGraph… durable execution, human-in-the-loop support, persistence". | add one anchor (E17) |
| C28 | 11/02-rebuilding-in-langchain.mdx:17-42 | `from langchain.agents import create_agent`, `from langchain.tools import tool`, `create_agent(model="anthropic:claude-sonnet-5", tools=…, system_prompt=…)`, `agent.invoke({"messages": …}, config=…)` | "real, current LangChain" | fact | VERIFIED | LangChain docs, Agents: `from langchain.agents import create_agent`, `agent = create_agent(model="anthropic:claude-sonnet-5", tools=[search])`, `agent.invoke({"messages": [...]})`; Tools: `from langchain.tools import tool`; `factory.py` l.825-833: signature has `model`, `tools`, `system_prompt`. `claude-sonnet-5` is Active (retirement "Not sooner than June 30, 2027") but is a legacy model; `claude-sonnet-5-5` is current. | keep (matches LangChain's own docs example); see note in §3 |
| C29 | 11/02-rebuilding-in-langchain.mdx:50-56 | `@tool` builds the schema from type hints and docstring | none | fact | VERIFIED | LangChain Tools doc: "By default, the function's docstring becomes the tool's description…"; "Type hints are **required** as they define the tool's input schema." | keep |
| C30 | 11/02-rebuilding-in-langchain.mdx:75-76 | LangChain agents run on LangGraph | none | fact | VERIFIED | LangChain overview: "LangChain's agents are built on top of LangGraph." | keep |
| C31 | 11/02-rebuilding-in-langchain.mdx:77-88; 11/03:23-36; 11/05:59,65 | `recursion_limit` counts graph steps (model call and tool run separate); exceeding it raises `GraphRecursionError` | none | fact | VERIFIED | LangGraph Graph API doc: "The recursion limit sets the maximum number of super-steps the graph can execute during a single execution… Once the limit is reached, LangGraph will raise `GraphRecursionError`." Checkpointers doc: "For a sequential graph like `START -> A -> B -> END`, there are separate super-steps for… node A, and node B". Note: the default is now 1000 (LangGraph ≥1.0.6), and `create_agent` binds `{"recursion_limit": 9_999}` (`factory.py` l.1897-1899). The lesson states no default, so nothing is wrong. | keep |
| C32 | 11/02-rebuilding-in-langchain.mdx:90-95 | `ModelCallLimitMiddleware` (`langchain.agents.middleware`): `run_limit` counts model calls; default `exit_behavior="end"` ends gracefully; `"error"` raises | none | fact | VERIFIED | `mcl.py` l.126-131: `run_limit: int \| None = None, exit_behavior: Literal["end", "error"] = "end"`; docstring: "'end': Jump to the end of the agent execution and inject an artificial AI message indicating that the limit was exceeded. 'error': Raise a `ModelCallLimitExceededError`". Built-in middleware doc: "run_limit: Maximum model calls per single invocation." | keep |
| C33 | 11/02-rebuilding-in-langchain.mdx:107-108 | "Some provider SDKs now include a small helper that runs the tool loop for you" | none | fact | VERIFIED | Claude Agent SDK overview: "Client SDK… You write the tool loop yourself, or let the client SDK's beta tool runner drive it." | keep |
| C34 | 11/02-rebuilding-in-langchain.mdx:109-111 | Claude Agent SDK and OpenAI Agents SDK package "the loop, built-in tools, context management and hooks, shaped around one provider's models" | none | fact | **CONTRADICTED** (in part) | OpenAI Agents SDK README: "It is provider-agnostic, supporting the OpenAI Responses and Chat Completions APIs, as well as 100+ other LLMs." Claude Agent SDK overview: "built-in tools, permissions, sessions, and hooks". | replace (E18) |
| C35 | 11/03-what-control-was-given-up.mdx:46-51 | frameworks trade visibility for less code; understanding the mechanics makes it an informed choice | none | practice | UNSOURCED | Building effective agents: "they often create extra layers of abstraction that can obscure the underlying prompts and responses, making them harder to debug… If you do use a framework, ensure you understand the underlying code. Incorrect assumptions about what's under the hood are a common source of customer error." | add anchor (E19) |
| C36 | 11/03-what-control-was-given-up.mdx:99 | stand-in error text "Recursion limit of {n} reached" | labelled stand-in | fact | VERIFIED (prefix) | `langgraph/pregel/main.py` l.3005: `f"Recursion limit of {config['recursion_limit']} reached without hitting a stop condition…"` | keep |
| C37 | 11/05-recap-practice.mdx:44-54 | Q: the `{"messages": …}` dict confirms "The scratchpad… is genuine, standard framework terminology" | none | fact | **CONTRADICTED** | LangChain v1 `AgentState` (`types.py` l.349-354) has keys `messages`, `jump_to`, `structured_response`. There's no "scratchpad" in `create_agent` (`grep scratchpad factory.py types.py` → none). The name survives only in the legacy `agent_scratchpad` (langchain_classic), which this lesson dropped when it moved to `create_agent`. The question's own explanation says "it's literally named messages". | replace the question's correct option and explanation (E20) |

### 2. Proposed edits

Paths are relative to `src/content/modules/02-the-agent-loop/`. None of these edits touch an exercise or demo string, so no Pyodide re-verification is needed. E10, E11 and E20 are quiz text (explanations and one correct option), not code.

**E1. `07-agent-state-and-the-scratchpad/01-the-scratchpad.mdx`** (optional, low priority)
Current:
```
this accumulating list is commonly called the agent's **scratchpad** —
the working record of everything that's happened in this specific loop
run.
```
Proposed:
```
this accumulating list is commonly called the agent's **scratchpad** —
the working record of everything that's happened in this specific loop
run. The name isn't this course's invention: LangChain's classic agents
handed the model its past tool calls and results in a prompt slot called
[`agent_scratchpad`](https://github.com/langchain-ai/langchain/blob/master/libs/langchain/langchain_classic/agents/tool_calling_agent/base.py).
```

**E2. `07-agent-state-and-the-scratchpad/03-checkpoint-and-resume.mdx`**
Current:
```
[turns a repeat into an ordinary tool error the model can read](/02-the-agent-loop/06-termination-failure-and-control/05-tool-errors-as-observations/#the-fix-catch-it-and-let-the-model-see-it)
instead of a duplicate.
```
Proposed:
```
[turns a repeat into an ordinary tool error the model can read](/02-the-agent-loop/06-termination-failure-and-control/05-tool-errors-as-observations/#the-fix-catch-it-and-let-the-model-see-it)
instead of a duplicate. Agent runtimes build in the same two habits.
LangGraph
[saves a checkpoint after every step of its graph](https://docs.langchain.com/oss/python/langgraph/checkpointers),
and its docs warn that a step which started but didn't finish may run
again on resume, so
[side effects should be idempotent](https://docs.langchain.com/oss/python/langgraph/functional-api#idempotency):
safe to run twice.
```

**E3. `08-planning-and-decomposition/03-tree-of-thought.mdx`**
Current:
```
to. **Tree of Thought (ToT)** is different: instead of committing to one
path, it generates *several* candidate next steps at a decision point,
```
Proposed:
```
to. **Tree of Thought (ToT)**, introduced by Yao et al. in
[*Tree of Thoughts*](https://arxiv.org/abs/2305.10601) (NeurIPS 2023),
is different: instead of committing to one
path, it generates *several* candidate next steps at a decision point,
```

**E4. `08-planning-and-decomposition/03-tree-of-thought.mdx`**
Current:
```
ToT earns its extra cost specifically on problems where an early
misstep is genuinely hard to recover from within a purely linear
chain — certain puzzles, planning with real, interacting constraints,
tasks with several simultaneous requirements pulling in different
directions. For anything plain CoT already handles fine — most
straightforward, single-path problems — ToT is real overkill, spending
several times the cost for no actual benefit over a single, linear
chain of reasoning.
```
Proposed:
```
ToT earns its extra cost specifically on problems where an early
misstep is genuinely hard to recover from within a purely linear
chain — certain puzzles, planning with real, interacting constraints,
tasks with several simultaneous requirements pulling in different
directions. The paper tested it on exactly that kind of task. On the
Game of 24 puzzle, GPT-4 with chain-of-thought solved 4% of problems
and ToT solved 74%. The authors also estimate ToT can need 5 to 100
times more generated tokens than CoT, and recommend it for tasks "on
which CoT struggles". For anything plain CoT already handles fine — most
straightforward, single-path problems — ToT is real overkill, spending
many times the cost for no actual benefit over a single, linear
chain of reasoning.
```
(Optional consistency change: `03-tree-of-thought.mdx` Q3 explanation "costs several times what following one does" and `06-recap-practice.mdx:102` "it's several times the cost for nothing" could say "many times". Both are still true as written, since 5× or more is "several".)

**E5. `08-planning-and-decomposition/04-plan-and-execute-vs-reactive.mdx`**
Current:
```
*before* any execution begins, then actually execute that predetermined
structure — **plan-and-execute**.
```
Proposed:
```
*before* any execution begins, then actually execute that predetermined
structure — **plan-and-execute**. The name comes from practice.
LangChain's
[plan-and-execute agents](https://blog.langchain.com/planning-agents/)
pair a planner, which writes a multi-step plan, with executors that each
take one step and may call several tools to finish it. Once execution is
done, the planner is called again to re-plan if needed.
```

**E6. `08-planning-and-decomposition/04-plan-and-execute-vs-reactive.mdx`**
Current:
```
  created. Sending a sub-task alone is a common way plan-and-execute
  agents go wrong.
```
Proposed:
```
  created. Sending a sub-task alone is a common way plan-and-execute
  agents go wrong. Anthropic
  [reports this from its own research agent](https://www.anthropic.com/engineering/multi-agent-research-system):
  given short task descriptions, sub-agents "misinterpreted the task or
  performed the exact same searches as other agents."
```

**E7. `09-reflection-and-self-critique/01-the-evaluator-optimizer-pattern.mdx`**
Current:
```
exactly the gap this concept closes: the **evaluator-optimizer pattern**,
where the *model itself* judges whether a candidate output satisfies
explicit criteria.
```
Proposed:
```
exactly the gap this concept closes: the **evaluator-optimizer pattern**,
where the *model itself* judges whether a candidate output satisfies
explicit criteria. The name comes from Anthropic's
[*Building effective agents*](https://www.anthropic.com/engineering/building-effective-agents),
which describes it as "one LLM call generates a response while another
provides evaluation and feedback in a loop."
```

**E8. `09-reflection-and-self-critique/01-the-evaluator-optimizer-pattern.mdx`**
Current:
```
actionable: "misses the target audience" gives the next attempt
something specific to fix.
```
Proposed:
```
actionable: "misses the target audience" gives the next attempt
something specific to fix. Anthropic's guide makes the same point: the
pattern is "particularly effective when we have clear evaluation
criteria."
```

**E9. `09-reflection-and-self-critique/02-when-a-second-pass-helps.mdx`** (see Needs a decision, D1)
Current:
```
often more tractable task than generating the single best option
directly, in one shot, with nothing to compare it against yet.
```
Proposed:
```
often more tractable task than generating the single best option
directly, in one shot, with nothing to compare it against yet.

There's evidence for this, and a clear boundary on it. In Madaan et al.'s
[*Self-Refine*](https://arxiv.org/abs/2303.17651) (NeurIPS 2023), one
model drafted an answer, critiqued its own draft, then revised it.
Across 7 tasks, the revised answers beat single drafts by about 20
points on average. One task was fitting every word from a given list
into a sentence, which is an omission check. On math problems it gained
almost nothing: the model's feedback nearly always said "everything
looks good". A later survey, Kamoi et al.'s
[*When Can LLMs Actually Correct Their Own Mistakes?*](https://arxiv.org/abs/2406.01297)
(TACL 2024), concluded that a model finds its own errors more easily
than it avoids them mainly on tasks where checking is especially easy.
That's why every example below is something easy to check.
```

**E10. `09-reflection-and-self-critique/02-when-a-second-pass-helps.mdx`** (quiz explanation)
Current:
```
        "Nothing here depends on a stronger evaluator or a guaranteed result. Judging a finished candidate against stated criteria is a narrower task than composing one from scratch, so the same model can do it more reliably.",
```
Proposed:
```
        "Nothing here depends on a stronger evaluator or a guaranteed result. Judging a finished candidate against stated criteria is a narrower task than composing one from scratch, so the same model can often do it more reliably, as long as the criteria are easy to check.",
```

**E11. `09-reflection-and-self-critique/04-recap-practice.mdx`** (quiz explanation)
Current:
```
        "Judging a finished candidate against stated criteria is a narrower task than composing one from scratch, so the same model can do it more reliably.",
```
Proposed:
```
        "Judging a finished candidate against stated criteria is a narrower task than composing one from scratch, so the same model can often do it more reliably, as long as the criteria are easy to check.",
```

**E12. `09-reflection-and-self-critique/03-the-limits-shared-blind-spots.mdx`**
(The Subsection title is unchanged. Module 6 deep-links its anchor `#reflection-doesn-t-bring-in-a-second-independent-perspective`.)
Current:
```
The standard partial fix is to make the evaluator less "same": use a
*different* (often stronger) model as the judge, or at least run the
same model in a fresh context, without the generator's reasoning to
anchor it. That genuinely helps. Its limit is that models trained on
similar data share many blind spots, and LLM judges measurably favor
text that resembles their own (a known *self-preference bias*). So a
second model narrows the problem without removing it.
```
Proposed:
```
A common partial fix is to make the evaluator less "same": use a
*different* (often stronger) model as the judge, or at least run the
same model in a fresh context, without the generator's reasoning to
anchor it. That genuinely helps. Its limit is that different models
make many of the same mistakes, and more so as they get more capable
(Goel et al.,
[*Great Models Think Alike and this Undermines AI Oversight*](https://arxiv.org/abs/2502.04313),
ICML 2025). LLM judges also measurably favor their own text, a known
*self-preference bias* (Panickssery et al.,
[*LLM Evaluators Recognize and Favor Their Own Generations*](https://arxiv.org/abs/2404.13076),
NeurIPS 2024), and Goel et al. found they favor models similar to
themselves too. So a second model narrows the problem without removing it.
```

**E13. `09-reflection-and-self-critique/03-the-limits-shared-blind-spots.mdx`**
Current:
```
Research backs up how much this matters. Huang et al. (2023), "Large
Language Models Cannot Self-Correct Reasoning Yet", found that asking a
model to review and correct its own reasoning, *without* any feedback
from outside, often didn't improve its answers and sometimes made them
worse. The self-correction results that hold up tend to have an external
signal behind them: tests, a tool's output, a checkable fact. So when an
```
Proposed:
```
Research backs up how much this matters. Huang et al.,
[*Large Language Models Cannot Self-Correct Reasoning Yet*](https://arxiv.org/abs/2310.01798)
(ICLR 2024), found that asking a model to review and correct its own
reasoning, *without* any feedback from outside, often didn't improve its
answers on reasoning tests such as grade-school math, and sometimes made
them worse. Earlier results that looked better had told the model which
answers were wrong. The self-correction results that hold up tend to
have an external signal behind them: tests, a tool's output, a checkable
fact. So when an
```
(This matches Module 6's existing wording and link in `06-reliability/02-reliability-tradeoffs/02-what-reliability-costs.mdx:132-136`.)

**E14. `10-workflow-patterns-beyond-a-single-loop/01-prompt-chaining-and-routing.mdx`**
Current:
```
never the model. `if not summary.strip():` is the check: a chain that
never inspects a step's output before trusting it with the next one is
just blind piping, not a deliberately engineered sequence.
```
Proposed:
```
never the model. `if not summary.strip():` is the check: a chain that
never inspects a step's output before trusting it with the next one is
just blind piping, not a deliberately engineered sequence. This lesson's
pattern names (prompt chaining, routing, parallelization and
orchestrator-workers) come from Anthropic's
[*Building effective agents*](https://www.anthropic.com/engineering/building-effective-agents),
which calls a check like this a "gate" and suggests one on "any
intermediate steps to ensure that the process is still on track."
```

**E15. `10-workflow-patterns-beyond-a-single-loop/02-parallelization.mdx`**
Current:
```
Everything above splits work into *different* pieces, often called
**sectioning**. Parallelization has a second standard form that runs the
*same* task several times and compares the answers, often called
**voting**. Because sampling is random, independent attempts at a hard
```
Proposed:
```
Everything above splits work into *different* pieces, which
[Anthropic's guide](https://www.anthropic.com/engineering/building-effective-agents)
calls **sectioning**. Parallelization has a second standard form that
runs the *same* task several times and compares the answers, which the
guide calls **voting**. Because sampling is random, independent attempts at a hard
```

**E16. `10-workflow-patterns-beyond-a-single-loop/03-orchestrator-workers.mdx`**
Current:
```
simplifies two things: in the usual form of this pattern, each worker is
itself an LLM call, and the orchestrator synthesizes the workers'
results with one more call rather than a plain string join.
```
Proposed:
```
simplifies two things: in the usual form of this pattern, each worker is
itself an LLM call, and the orchestrator synthesizes the workers'
results with one more call rather than a plain string join.
[Anthropic's guide](https://www.anthropic.com/engineering/building-effective-agents)
defines it that way: "a central LLM dynamically breaks down tasks,
delegates them to worker LLMs, and synthesizes their results." It also
names the difference from plain parallelization that this concept
relies on: the sub-tasks "aren't pre-defined, but determined by the
orchestrator".
```

**E17. `11-from-hand-rolled-to-a-runtime/01-what-a-framework-actually-provides.mdx`**
Current:
```
None of this is new capability the hand-rolled version couldn't do —
it's the same mechanisms, packaged and given a stable, reusable API.
```
Proposed:
```
None of this is new capability the hand-rolled version couldn't do —
it's the same mechanisms, packaged and given a stable, reusable API.
Frameworks describe themselves in the same terms. The
[OpenAI Agents SDK](https://openai.github.io/openai-agents-python/),
for example, lists "a built-in loop that continues until the task is
complete", sessions for "automatic conversation history management",
and built-in tracing.
```

**E18. `11-from-hand-rolled-to-a-runtime/02-rebuilding-in-langchain.mdx`**
Current:
```
- **Provider agent SDKs.** Packages such as the Claude Agent SDK and the
  OpenAI Agents SDK package a whole agent: the loop, built-in tools,
  context management and hooks, shaped around one provider's models.
```
Proposed:
```
- **Provider agent SDKs.** Packages from the model providers, such as
  the Claude Agent SDK and the OpenAI Agents SDK, package a whole agent:
  the loop, built-in tools, sessions and hooks. Each is built around its
  own provider's models first, though the OpenAI Agents SDK can also run
  other providers' models.
```

**E19. `11-from-hand-rolled-to-a-runtime/03-what-control-was-given-up.mdx`**
Current:
```
what's happening. Knowing this loop's real mechanics by having built it
yourself is what makes that trade a genuine choice, not a leap of
faith.
```
Proposed:
```
what's happening. Knowing this loop's real mechanics by having built it
yourself is what makes that trade a genuine choice, not a leap of
faith. Anthropic's
[*Building effective agents*](https://www.anthropic.com/engineering/building-effective-agents)
gives the same advice: "If you do use a framework, ensure you understand
the underlying code. Incorrect assumptions about what's under the hood
are a common source of customer error."
```

**E20. `11-from-hand-rolled-to-a-runtime/05-recap-practice.mdx`** (quiz; fixes C37)
Current:
```
      question: "What does the {\"messages\": [...]} dict passed to agent.invoke() confirm about this course's own terminology?",
      options: [
        "Nothing -- coincidental",
        "The scratchpad -- a growing list of everything that's happened in the run -- is genuine, standard framework terminology, not invented for this course",
        "LangChain uses an unrelated concept",
        "Scratchpads don't exist in real frameworks",
      ],
      correctIndex: 1,
      explanation:
        "A framework still has to carry the full conversation state somewhere. Here it's literally named messages, both in and out of invoke() -- the same accumulating-state idea this course named back in Lesson 7.",
```
Proposed:
```
      question: "What does the {\"messages\": [...]} dict passed to agent.invoke() correspond to in this course?",
      options: [
        "Nothing -- coincidental",
        "The scratchpad -- the growing list of everything that's happened in the run, which create_agent carries as its messages state",
        "LangChain uses an unrelated concept",
        "Scratchpads don't exist in real frameworks",
      ],
      correctIndex: 1,
      explanation:
        "A framework still has to carry the full conversation state somewhere. create_agent calls it messages, both in and out of invoke(), not \"scratchpad\", but it's the same accumulating state this course named back in Lesson 7.",
```
(Option lengths are roughly unchanged. The quiz-length pass can adjust them.)

### 3. Needs a decision

- **D1 (E9–E11): narrow "checking is easier than generating".** As written, the concept says a second pass by the *same* model helps because checking is easier. The quiz explanations go further and say the model "can do it more reliably". The primary evidence is narrower. Self-Refine does show same-model self-feedback helping on writing, code and constraint tasks (~20 points on average), but gets ~0 on math because the feedback nearly always says "everything looks good". Kamoi et al.'s TACL 2024 survey concludes that "recognizing errors is easier than avoiding them" holds only for tasks "whose verification is exceptionally easy". The concept's own examples (omissions, format, visible inconsistency) are all easy to check, so the teaching survives. It becomes "helps on easy-to-check criteria" rather than a general asymmetry. **Recommend adopting E9–E11.** They add the evidence and state the boundary. They also tie Lesson 9's second concept to its third (Huang et al.), so the lesson no longer reads as mildly contradicting itself.
- **Minor, no decision needed:** the `create_agent` example uses `"anthropic:claude-sonnet-5"`. That model is Active until at least 30 June 2027 and is exactly what LangChain's own docs use, but Anthropic now lists it as legacy (current Sonnet: `claude-sonnet-5-5`). Keep it for now. Update it if the owner prefers current model IDs in illustrative code. It's a static code block, not a demo.

### 4. Counts

- Claims inventoried: 37 (C1–C37)
- **Verified:** 25 (C2, C3, C5, C6, C7, C11, C12, C14, C18, C19, C20, C21, C22, C23, C24, C25, C26, C28, C29, C30, C31, C32, C33, C36, plus C1's term)
- **Contradicted:** 2 (C34 "shaped around one provider's models", since the OpenAI Agents SDK is provider-agnostic; C37 recap Q3's "scratchpad is standard framework terminology", when `create_agent` uses `messages`)
- **Unreachable:** 0
- **Unsourced (flagged):** 10 (C1, C4, C8, C9, C10, C13, C15, C17, C27, C35; C1, C13 and C15 are also partly verified above). C8 and C17 are left as is or only softened.
- **Re-labelled:** 2 (C20 Huang: venue ICLR 2024 plus reasoning scope; C16 quiz explanations softened)
- **Replaced:** 2 (E18, E20)
- **Added sources:** 12 distinct sources across 16 edits (LangChain classic `agent_scratchpad`; LangGraph checkpointers + idempotency docs; Yao et al. ToT; LangChain plan-and-execute blog; Anthropic multi-agent research post; Anthropic *Building effective agents* ×6 placements; Madaan et al. Self-Refine; Kamoi et al.; Goel et al.; Panickssery et al.; Huang et al. link; OpenAI Agents SDK docs)
