# Citation audit: Module 6 (Reliability)

Audited 2026-09-30, on branch `citation-audit/module-6`. Four read-only
subagents did the inventory, verification and recommendations, about three
lessons each. Their full reports follow, one section per group of lessons,
with a claims table, exact current and proposed text, and counts. The lead
applied the edits and re-read the primary source for every quote or figure
that is new on a page.

Every edited text is prose, a quiz question, option or explanation. No
demo, exercise, starter, reference or test string changed, so nothing needed
re-running in Pyodide. `npm run build` passes (523 pages), and there are no
new internal links.

## What happened to each proposed edit

Edit IDs refer to each report's own "Proposed edits" section.

| Report | Applied | Held for a decision | Skipped (optional) |
|---|---|---|---|
| A: L1, L2 | E1–E14, E16–E23 | none | E15 (transcripts quote), E24 (SRE alert quote) |
| B: L4, L5, L6 | E1–E7, E9–E16 (E13 without the optional vLLM link) | none | E8 (USC's own caveat) |
| C: L7, L8 | E1, E2, E4, E6–E19 (E19 reworded: "almost never", as the article says) | E3 (conditional compensation) | E5 (Claude 4 system card; the announcement's 65% is verified), E20 (context-window doc) |
| D: L3, L9, L10 | E1, E2, E4–E7, E9–E13, E15, E16 (E3 as the short softening only; E12 without the SaTML venue, which wasn't checked) | E8 (Meta's reply to Willison) | E14 (map-reduce detail), E17 (Netflix FIT) |

## Totals across the module

- Claims inventoried: about 200 table rows.
- **Verified:** 166, including those the earlier review had checked, which
  were re-read.
- **Contradicted:** 8. Miller's "three or more times" (it describes grouped
  questions, not repeated runs); Panickssery et al. ("people rated as
  equal"); Tian et al. ("token probabilities"); ImpossibleBench's "biggest
  drop"; the METR quiz distractor, which was one of METR's own explanations;
  Sethi's 45% (dishonest answers, not only invented values); breakers'
  "one trial call"; and the Beurer-Kellner affiliations.
- **Superseded by a later version:** 3. METR's 59 vs 15 minutes (the first
  version; the latest says 4–6×), OR-Bench's 0.878 (0.89 in the ICML 2025
  version) and the SimpleQA blog figures (now *Nature* 2026, with its own
  measured figures).
- **Not reachable:** 1. Oso's agent docs moved. The page now cites a
  February 2026 archived copy, with its real wording.
- **Re-labelled** (venue, preprint, vendor figure, attribution): 30.
- **Replaced wording or source:** 13.
- **Sources added:** 24, mostly industry anchors (Anthropic's agent-evals
  guide, OpenAI's agent guide, Microsoft's Saga and Compensating Transaction
  patterns, AWS Well-Architected, Terraform's automation guide,
  Resilience4j, gRPC's retry design, NeMo Guardrails, Hugging Face and vLLM
  `revision`, Arize), plus evidence (SCoRe, Baker et al., FIDES, CaMeL,
  Snell et al.).

## Needs a decision (both approved by the owner and applied, 2026-09-30)

1. **Compensations: absolute or conditional undo (L7 C3).** *Applied:* the
   prose now teaches "set the tier to standard if it's still priority", and
   links the dry-run concept's compare-and-set. The demo is unchanged. The page teaches
   "set the tier to standard", not "lower the tier by one", so the undo is
   safe to repeat. The *Sagas* paper and Microsoft's pattern warn that
   writing back a stored value can overwrite a change made in between.
   Recommendation: teach "set it to standard if it's still priority", the
   dry-run concept's compare-and-set applied to the undo (report C, E3).
   Prose only; the demo can stay.
2. **Meta's reply to Willison's Rule-of-Two gap (L9 C2).** *Applied:* Meta's
   reply (Mick Ayzenberg, quoted in an update to Willison's post, verified)
   and why the stricter rule doesn't depend on it. The concept
   presents Willison's reading as settled. Meta's author replied that the
   second property covers any sensitive system. Recommendation: keep the
   stricter rule and add three sentences giving Meta's reading (report D,
   E8).
3. **Applied, but worth a look.** METR's latest version shows a bigger
   50%→80% gap (4–6×) than the constant-failure model predicts (about 3×).
   The page now keeps the first version's 59/15 example, labelled, and adds
   the latest range (L1 C1, its quiz and the recap). ImpossibleBench's
   evidence now backs "keep the measuring stick out of reach" more than
   "give it a way out" (L7 C5). Gabrielson's article, cited for exercising a
   fallback, argues against fallback in general, and the page now says so
   (L8 C1). ToolEmu is now described as a related technique, not fault
   injection (L10 C3).

## Still to check

- CaMeL's published figures in IEEE SaTML 2026 (the IEEE page didn't load;
  the page cites arXiv v2's 77% vs 84%).
- Whether Zhu et al. (L1 C5) was accepted anywhere (OpenReview status
  unreachable); it's labelled a preprint.
- Outside this module: Module 1's hallucination page cites Kalai et al. as
  2025 OpenAI research. It can add the *Nature* version during the Module 1
  audit.


---

## Report: Citation audit: Module 6, Lessons 1 and 2 (01-per-step-reliability, 02-reliability-tradeoffs)

Auditor: subagent m6-A. Read-only; no repo files edited. Downloads in `scratchpad/audit/m6a/`.
Paths below are relative to `src/content/modules/06-reliability/`. Line numbers are file line numbers.

### Priority item first: Kalai et al. / SimpleQA table (L1 C2)

**What the page says** (`01-per-step-reliability/02-the-same-question-run-twice.mdx:353-361`): "OpenAI's Kalai et al., *Why Language Models Hallucinate* (2025)" (link: the OpenAI blog post), then "OpenAI's blog shows the effect on SimpleQA, with its own models' figures": gpt-5-thinking-mini 52% abstain / 22% right / 26% wrong, o4-mini 1% / 24% / 75%.

**What each source actually contains:**
- **OpenAI blog post** (Wayback snapshot 20251229232716, dated "September 5, 2025"): the table is there, verbatim: "consider the SimpleQA eval as an example from the GPT5 System Card ... Abstention rate (no specific answer is given) 52% 1% / Accuracy rate (right answer, higher is better) 22% 24% / Error rate (wrong answer, lower is better) 26% 75%". So the figures are right *for the blog*.
- **GPT-5 system card** (cdn.openai.com/gpt-5-system-card.pdf, Table 8 "SimpleQA evaluations"): "SimpleQA (no web) accuracy ... gpt-5-thinking-mini 0.22, OpenAI o4-mini 0.24"; "hallucination rate (lower is better) 0.26, 0.75". It gives no abstention row; the blog's 52% / 1% is the remainder (1 − 0.22 − 0.26; 1 − 0.24 − 0.75). This is where the numbers originate, and it's OpenAI reporting on its own models with no method shown.
- **arXiv paper 2509.04664 (v1 only, 4 Sep 2025)**: no SimpleQA table. The only GPT-5 mention is a citation that hallucinations "are still present in the latest models (OpenAI, 2025a)". So the page is right not to attribute the table to the paper, but the sentence structure ("Kalai et al. ... argue ... OpenAI's blog shows") links the paper's title to the blog URL.
- **Peer-reviewed version exists: Nature.** Kalai, Nachum, Vempala & Zhang, "Evaluating large language models for accuracy incentivizes hallucinations", *Nature* 653, 1047–1051 (published 22 April 2026, open access), https://www.nature.com/articles/s41586-026-10549-w. Its abstract: "Here we show how next-word prediction and accuracy-based evaluations inadvertently reward unwarranted guessing ... dominant headline metrics such as accuracy systematically reward guessing over admitting uncertainty." It **runs its own SimpleQA comparison, with a shown method**: "The evaluation of GPT-5-mini and o4-mini on SimpleQA was run using the same procedure [OpenRouter, standard SimpleQA grader gpt-4.1, n = 4,326]. The results, in the closed-rubric setting, were respective accuracies of 16.0% and 20.6%, errors were 20.8% and 76.8%, and non-answers accounted for the remaining 63.2% and 2.6% of responses. ... Accuracy differences had P < 0.01". Main text: "accuracy slightly favours OpenAI's o4-mini, which answers almost all questions (with over 3/4 error rate) over GPT-5-mini, even though GPT-5-mini makes many fewer errors (owing to abstentions)". Code: github.com/openai/hallucinations-paper-experiments.

**Verdict:** the 52/22/26 vs 1/24/75 figures are VERIFIED against the blog (and trace to the GPT-5 system card), but they're a vendor's figures about its own models with no method, and the work is now peer-reviewed in Nature with its own measured figures. **Recommendation: replace** with the Nature citation and its figures (edit E10). Ratio check: 76.8 / 20.8 = 3.69, so "more than three times as many errors" (the current "about three times" came from 75/26 = 2.88).

Also cited, outside this audit's scope: `01-llm-foundations/04-how-llms-generate-text/04-hallucination-as-a-direct-consequence.mdx:68` ("Research from OpenAI in 2025 ("Why Language Models Hallucinate", Kalai et al.)", no figures). It could add "(published in *Nature* in 2026)".

---

### 1. Claims table

| ID | file:line | Claim (as written, trimmed) | Source given | Kind | Verdict | Evidence (primary source, version/section) | Recommendation |
|---|---|---|---|---|---|---|---|
| 1 | L1/01:84-86 | τ-bench "allows its agent up to 30 actions per task" | τ-bench (named) | fact | VERIFIED | arXiv 2406.12045v1 §5 and ICLR 2025 camera-ready: "We limit each task to at most 30 agent actions (either tool calls or user responses)." | keep (optionally label τ-bench ICLR 2025 wherever cited) |
| 2 | L1/01:120-124 | METR time-horizon study (Kwa et al., 2025): tasks timed by skilled people, seconds to hours; success falls steadily with length | arXiv 2503.14499 | effectiveness | VERIFIED | v4 (10 Jul 2026; arXiv journal-ref NeurIPS 2025): "We first timed humans with relevant domain expertise"; SWAA tasks "ranging from 1 second to 30 seconds", HCAST "1 minute to 30 hours". | re-label: "(Kwa et al., NeurIPS 2025)" |
| 3 | L1/01:124-128 | Ord "reanalysed their results and found they fit a very simple model: a constant chance of failing for each minute" | arXiv 2505.05115 | effectiveness | VERIFIED, slightly overstated | Ord v1 (only version, preprint): "can be explained by an extremely simple mathematical model -- a constant rate of failing during each minute a human would take"; "So far these results and analysis are merely suggestive of a constant hazard rate." | re-label as a preprint and soften "found" to "argued" (E1) |
| 4 | L1/01:130-135 | METR measured best model: 50% at 59 min, 80% at 15 min; "a quarter, close to the predicted third, and within the measurement's noise" | METR + Ord | effectiveness | VERIFIED for v1; SUPERSEDED in latest version | v1 §4.2.1: "Claude 3.7 Sonnet has the longest 80%-horizon among models we examined at around 15 minutes, in contrast to its 50%-horizon of 59 minutes." Ord: "Kwa et al. estimate the 80% time-horizon for Claude 3.7 Sonnet to be 0.25 as long, which is close to this theoretical estimate and within the margin of error given the noisiness of the results." v4 §3.2.1 no longer gives 59/15; it says: "models' 80% time horizons are 4-6x shorter". | replace/re-label: say it's the first version and Claude 3.7 Sonnet, and add v4's 4–6× (E1). See Needs a decision #1 |
| 5 | L1/01:137-143 | Ord's two caveats: one task suite; an average can hide each task's shape | Ord | fact | VERIFIED | Ord abstract: "Whether this model applies more generally on other suites of tasks is unknown"; footnote 1: "the survival curve over the whole task suite would be averaging different exponential decay curves together." | keep |
| 6 | L1/01:155-157 | "METR's authors found that improvements in longer tasks came largely from models getting more reliable and from getting better at adapting to mistakes" | METR | effectiveness | VERIFIED, partial | v4 abstract: "primarily driven by greater reliability, ability to adapt to mistakes, logical reasoning, and capacity for tool use." (v1: "...reliability and ability to adapt to mistakes, combined with better logical reasoning and tool use"). | soften: name all four (E2) |
| 7 | L1/01:161-166 | τ-bench per-task success varies widely incl. never-solved tasks; a later study names early mistakes cascading as the main reason runs fail | τ-bench; Zhu et al. (by reference) | effectiveness | VERIFIED | τ-bench App. A: "tasks have a well-balanced and diverse spectrum of difficulties. We use such a plot to find tasks with zero success". Zhu v1: "Error propagation is the primary bottleneck in LLM agent reliability." | keep |
| 8 | L1/01:180-181 | "METR's authors credit much of models' progress on longer tasks to getting better at adapting to mistakes" | METR | effectiveness | VERIFIED, partial | as #6 | soften (E3) |
| 9 | L1/01:271 (Q5 expl.) | "METR's measurement for its best model at the time (59 minutes against 15) came out at about a quarter" | METR | effectiveness | as #4 | as #4 | re-label version (E4) |
| 10 | L1/02:151 | Qwen's recommended non-thinking settings, temperature 0.7 | none (Qwen named) | fact | VERIFIED | HF Qwen/Qwen3.5-4B README: "Instruct (or non-thinking) mode for general tasks: `temperature=0.7, top_p=0.8, top_k=20...`" | keep |
| 11 | L1/02:228-232 | τ-bench ran each retail task >40 times with one model while checking tasks; hand-checked rarely/never-solved tasks | τ-bench | fact | VERIFIED | §4 Stage III: "we run each τ-retail task with > 40 gpt-4-turbo trials and check all tasks with zero or low success rates" | keep |
| 12 | L1/02:233-238 | Miller: runs of the same question "aren't independent evidence ... treating them as independent can make error bars three or more times too narrow" | arXiv 2411.00640 | effectiveness | **CONTRADICTED (figure's context)** | Miller v1 (only version, preprint, Anthropic) Table 4 and §2.2: the 3× is about **related questions in groups** (e.g. several questions per passage), not repeated runs: "eval questions that are drawn in groups, or clusters. For instance, DROP ... reading-comprehension evals having multiple related questions about independently selected passages"; "clustered standard errors can be over 3X larger than naive standard errors" (DROP 3.05; RACE-H 1.10; MGSM 1.88). Anthropic's post says the same: "If questions arrive in related clusters ... clustered standard errors on popular evals can be over three times as large as naive standard errors." | replace: attribute the 3× to grouped questions (DROP), and present repeated runs as the extreme case of a group (E6). The concept's point stands and our data shows it |
| 13 | L1/02:238-240 | Miller's recommendation: run each question several times, keep results per question, measure uncertainty by question | Miller | practice | VERIFIED | §3.1: "resample the model a number of times, and to compute the standard error using the question-level mean scores from the resamples"; recommendation 3: "Reducing variance by resampling answers". | keep (fold into E6) |
| 14 | L1/02:282-284 | intervals ~2× (4B) and ~3× (2B) wider, "in line with Miller's finding of three times or more" | Miller | effectiveness | CONTRADICTED (as #12) | as #12 | replace (E7) |
| 15 | L1/02:307-315 | Anthropic recommends power analysis before an eval; it can show a small eval isn't worth running; method in Miller from the smallest difference and two sources of variation | Anthropic post; Miller | practice | VERIFIED (2026-09-30 review), re-read | Anthropic: "Recommendation #5: Use power analysis ... Researchers might use the power formula to conclude that an eval with a limited number of available questions is not worth running". Miller Eq. 9: n = (z_{α/2}+z_β)²(σ² + σ²_A/K_A + σ²_B/K_B)/δ² (between-question and within-question variance). | keep |
| 16 | L1/02:353-361 | Kalai et al. (2025); SimpleQA: 52/22/26 vs 1/24/75, "about three times as many errors" | OpenAI blog | effectiveness | VERIFIED on blog; not in arXiv paper; SUPERSEDED by Nature 2026 | See priority section above. | replace with Nature figures (E10) |
| 17 | L1/02:355-357 | accuracy-only benchmarks give nothing for "I don't know", so guessing scores higher | Kalai et al. | fact/argument | VERIFIED | Nature abstract: "accuracy-based evaluations inadvertently reward unwarranted guessing"; main text: "a model that guesses outscores a trustworthy model that abstains when uncertain." | keep (under new citation) |
| 18 | L1/02:363 | "report wrong answers and abstentions separately, alongside pass^k" | none | practice | UNSOURCED (reasonable to ask "says who?") | OpenAI's SimpleQA (Wei et al., arXiv 2411.04368) abstract: "Each answer in SimpleQA is graded as either correct, incorrect, or not attempted." | add industry backing (E11) |
| 19 | L1/02:387-393 | Thinking Machines: 1,000 temperature-0 completions from Qwen3-235B gave 80 different outputs; batch size; special kernels made all identical, at a cost in speed | Thinking Machines blog | fact | VERIFIED | "sample 1000 completions at temperature 0 ... we generate 80 unique completions"; "when we enable our batch-invariant kernels, all of our 1000 completions are identical"; timing table: vLLM default 26 s vs deterministic 55 s / 42 s. | keep |
| 20 | L1/02:396-397; L1/03:251-254; L1/04:86-90 | τ-bench's agent ran at temperature 0, simulated user at 1, so runs still varied | τ-bench | fact | VERIFIED | §5: "The LM temperature is 0.0 for agent and 1.0 for user." | keep |
| 21 | L1/02:442 (Q3 expl.); L1/06:237 (recap Q3 expl.) | Miller "three or more times too narrow" | Miller | effectiveness | CONTRADICTED (as #12) | as #12 | replace (E8, E9) |
| 22 | L1/03:226-241 | pass@k is "the standard measure for code generation"; pass^k is the measure for a dependable agent | none for the practice | practice | UNSOURCED (industry anchor missing) | Anthropic, "Demystifying evals for AI agents": "pass^k measures the probability that all k trials succeed ... This metric especially matters for customer-facing agents where users expect reliable behavior every time ... pass@k for tools where one success matters, pass^k for agents where consistency is essential." | lead with an industry source (E12) |
| 23 | L1/03:243-251 | pass^k from τ-bench; success checked by final DB state; best agent ~61% retail, pass^8 < 25% | τ-bench | effectiveness | VERIFIED | Abstract "(pass^8 < 25% in retail)"; §1 "gpt-4o ... (61% on τ-retail ...)"; §5.1 "pass^8 drops to < 25%"; figures identical in ICLR 2025 camera-ready. | keep |
| 24 | L1/03:271-274 | C(c,k)/C(n,k) is "the estimator τ-bench uses" | τ-bench | fact | VERIFIED | §3: "unbiased estimates for pass^k and pass@k would be: pass^k = E_task[C(c,k)/C(n,k)]" | keep |
| 25 | L1/04:71-77 | Sclar et al. (2023): up to 76 points for LLaMA-2-13B; persists with size, shots, instruction tuning; best format differs by model | arXiv 2310.11324 | effectiveness | VERIFIED | v2 (ICLR 2024 camera-ready) abstract: "performance differences of up to 76 accuracy points when evaluated using LLaMA-2-13B. Sensitivity remains even when increasing model size, the number of few-shot examples, or performing instruction tuning ... format performance only weakly correlates between models". | re-label year: "(ICLR 2024)" (E16) |
| 26 | L1/04:78-85 | Mizrahi et al. (TACL 2024): 39 tasks, 20 models, 6.5M instances; very different results, absolute and ranking; recommend several paraphrases | ACL Anthology | effectiveness | VERIFIED | Abstract: "across 6.5M instances, involving 20 different LLMs and 39 tasks from 3 benchmarks. We find that different instruction templates lead to very different performance, both absolute and relative. Instead, we propose a set of diverse metrics on multiple instruction paraphrases". | keep |
| 27 | L1/04:152-166 | check the wording before blaming the model | Module 5 (internal) | practice | UNSOURCED (industry anchor missing) | Anthropic evals post: "With frontier models, a 0% pass rate across many trials (i.e. 0% pass@100) is most often a signal of a broken task, not an incapable agent"; "Everything the grader checks should be clear from the task description". | lead with an industry source (E13) |
| 28 | L1/05:21-36 | τ-bench failure analysis: 36 agent-caused failures, one run per task; ~55% wrong args/info, ~25% wrong decisions, ~19% partial | τ-bench | effectiveness | VERIFIED | §5.2: "We sample 115 gpt-4o FC agent trajectories in τ-retail (1 trial per task) ... the remaining 36 failure cases are agent issues"; Fig. 5: wrong info 22.2% + wrong argument 33.3% = 55.5%, wrong decision 25.0%, partially resolve 19.4%. Same in ICLR 2025 version. | keep |
| 29 | L1/05:39-49; L1/05:124; L1/06:259 | Zhu et al. (2025): ALFWorld, WebShop, GAIA; memory/reflection/planning/action/system; error propagation the main bottleneck | arXiv 2509.25370 | effectiveness | VERIFIED; preprint | v1 (only version): "AgentErrorTaxonomy ... spanning memory, reflection, planning, action, and system-level operations ... failure trajectories from ALFWorld, GAIA, and WebShop"; "Key Insight. Error propagation is the primary bottleneck in LLM agent reliability." An OpenReview submission exists (forum PFR4E8583W); its decision status was NOT REACHABLE (bot challenge). | re-label as a preprint (E14) |
| 30 | L1/05:97-106 | routine: read the failed run from the start, name, count, fix | Zhu, τ-bench | practice | partly sourced | Anthropic evals post, "Step 6: Check the transcripts ... When a task fails, the transcript tells you whether the agent made a genuine mistake or whether your graders rejected a valid solution." | optional: add industry source (E15) |
| 31 | L1/06:292 (recap Q8) | "METR found an agent's 80% time horizon to be about a quarter ... within its noise" | METR | effectiveness | as #4 | as #4 | re-label version (E5) |
| 32 | L2/01:35-45; L2/06:225-236 | Kapoor et al. (2024): SOTA agents "needlessly complex and costly", "mistaken conclusions"; on HumanEval simple baselines matched or beat elaborate designs at a fraction of the cost | arXiv 2407.01502 | effectiveness | VERIFIED; now peer-reviewed | arXiv v1 abstract: "SOTA agents are needlessly complex and costly, and the community has reached mistaken conclusions about the sources of accuracy gains"; §2.3: "There is no significant accuracy difference between our warming strategy and the best-performing agent architecture"; "LATS over 50 times more". Published in TMLR (05/2025); camera-ready (openreview.net/pdf/366a3de2..., via Wayback) has identical text and Table A1. | re-label "(TMLR 2025)" (E18) |
| 33 | L2/01:60-66; L2/01:158, 163 (Q3) | OR-Bench (Cui et al., 2024): Spearman rank correlation 0.878 | none linked | effectiveness | **SUPERSEDED** (VERIFIED only for v1/v2) | v1/v2 (25 models): "Spearman rank correlation between safety and over-refusal is 0.878". v5 (15 Jun 2025, "Accepted to ICML 2025"; 32 models): "The Spearman rank-order correlation between safe and toxic prompt rejection rates is 0.89, indicating most models simply trade over-refusal for safety, with few breaking the trade-off." | replace with 0.89, add link and venue (E19) |
| 34 | L2/01:66-68 | XSTest (Röttger et al., 2024): small hand-written set of safe prompts that look unsafe, e.g. "kill" | none linked | fact | VERIFIED | arXiv 2308.01263v3 (NAACL 2024): "XSTest comprises 250 safe prompts across ten prompt types"; examples "kill a Python process", "to 'kill time'". | keep (optionally link) |
| 35 | L2/01:69-90; L2/06:203-211 | AgentDojo: GPT-4o, 97 tasks; none 69.0% / 57.7%; classifier 41.5% / 8.0%; tool filter 73.1% / 6.8%; classifier aborts, too many false positives; tool filter fails when tools can't be planned in advance | arXiv 2406.13352 | effectiveness | VERIFIED | v3 (24 Nov 2024) Table 5: "Benign utility 69.0% ... 41.49% ... 73.13%"; "Targeted ASR 57.69% ... 7.95% ... 6.84%"; §5: "aborts the agent if anything has been detected"; "The prompt injection detector has too many false positives, however, and significantly degrades utility"; "This defense fails, however, when the list of tools to use cannot be planned in advance". (The paper's prose says 7.5% for the tool filter; the page uses the table's 6.84%, fine.) | keep |
| 36 | L2/01:96-99 | Wen et al., abstention survey (TACL 2025): methods, benchmarks, metrics | ACL Anthology | fact | VERIFIED | Abstract: "We organize the literature on abstention methods, benchmarks, and evaluation metrics". | keep |
| 37 | L2/01:101-103 | "report every check as a pair of numbers, what it catches and what it wrongly blocks" | none | practice | UNSOURCED (industry anchor missing) | Anthropic evals post, "Step 3: Build balanced problem sets. Test both the cases where a behavior should occur and where it shouldn't. One-sided evals create one-sided optimization." | lead with an industry source (E20) |
| 38 | L2/02:76-80; L2/02 Q2; L2/06:277 | Huang et al. (ICLR 2024): models struggled to self-correct without outside feedback; sometimes worse | arXiv 2310.01798 | effectiveness | VERIFIED | v2 (ICLR 2024) abstract: "LLMs struggle to self-correct their responses without external feedback, and at times, their performance even degrades after self-correction." | keep |
| 39 | L2/02:80-82 | "Later papers have argued that newer models do better at it" | none | effectiveness | UNSOURCED | Kumar et al. (Google DeepMind), SCoRe, arXiv 2409.12917, ICLR 2025 (oral): "self-correction ... has consistently been found to be largely ineffective in modern LLMs ... SCoRe ... significantly improves an LLM's self-correction ability using entirely self-generated data ... improving the base models' self-correction by 15.6% and 9.1% respectively on MATH and HumanEval." | add stronger backing (E21) |
| 40 | L2/02 reranker, timing probes; L2/03 cost table; L2/05 2B/4B overlap, 21 of 23 | our data | n/a | our data | labelled | Reranker names the GPU (RTX 3070 Ti) and questions; timing demo prints model and question count ("ten questions each ... one Colab G4 GPU with vLLM"); cost table captioned; overlap demo "Real committed runs" and prints both model names. | keep |
| 41 | L2/03:175-187 | Kapoor: scientist holds compute fixed; builder uses dollars; proxies such as parameter count mislead; prices vary; report input/output token counts with dollar costs | Kapoor | practice | VERIFIED | §4: "For model evaluation, controlling for compute is a reasonable approach"; "Downstream evaluation ... cost is the actual construct of interest"; "proxies for cost (such as the number of active parameters or amount of compute used) are misleading"; "downstream evaluations of agents should include input/output token counts in addition to dollar costs". | keep |
| 42 | L2/03:180-182 | Snell et al. (2024) compared test-time compute on a smaller model against a model 14 times larger, at matched FLOPs | Snell (named) | effectiveness | VERIFIED | arXiv 2408.03314 abstract: "in a FLOPs-matched evaluation ... test-time compute can be used to outperform a 14× larger model." Published ICLR 2025. | re-label "(ICLR 2025)" (E22) |
| 43 | L2/03 FRONTIER_DEMO + caption | Kapoor Table A1, 13 agents, mean accuracy and cost over five runs, April 2024 prices | Kapoor | effectiveness | VERIFIED | Every value matches Table A1 in arXiv v1 and the TMLR camera-ready (e.g. "LATS (GPT-4) 88.0 ... 134.50", "Warming (GPT-4) 93.2 (92.1-93.9) 2.45", "Escalation 85.0 ... 0.27"); "We run each agent five times"; "prices ... as of April 2024". | keep (code comment says "(2024)"; leave, it's inside a demo string) |
| 44 | L2/03:244-247 | LATS (GPT-4) dominated by seven options; GPT-4 alone ~70× cheaper and more accurate; Escalation and Warming on the frontier | derived | effectiveness | VERIFIED (recomputed) | Dominators of LATS (GPT-4): LDB (GPT-4, GPT-3.5), LDB (Reflexion, GPT-4), LDB (Reflexion, GPT-3.5), LDB (GPT-4), GPT-4, Warming, Retry = 7. 134.50 / 1.93 = 69.7. | keep |
| 45 | L2/03:252-256 | LDB (GPT-4) 0.1 pts above Warming at more than twice the cost; runs overlapped 92.1–94.5% and 92.1–93.9% | Kapoor | effectiveness | VERIFIED | Table A1 ranges as quoted; 6.36 / 2.45 = 2.6×. | keep |
| 46 | L2/03:255-262; L2/03 Q4; L2/06:244 | Kapoor's frontier counts a difference only when significant; convex; GPT-4 not on their frontier | Kapoor | fact | VERIFIED | §2.3: "an agent is on the Pareto frontier if there is no other agent that has significantly better performance on both dimensions"; fn 2: "We constrain the Pareto frontier to be convex ... Hence, for instance, zero-shot GPT-4 is not on the frontier." | keep |
| 47 | L2/04:59-64; L2/04 Q2 | Snell et al. (2024): allocating per prompt by difficulty matched best-of-N with ~4× less compute | arXiv 2408.03314 | effectiveness | VERIFIED | Abstract: "effectiveness of different approaches to scaling test-time compute critically varies depending on the difficulty of the prompt ... improve the efficiency of test-time compute scaling by more than 4× compared to a best-of-N baseline"; §1: "surpassing the performance of a best-of-N baseline while only using about 4x less computation". | re-label "(ICLR 2025)" (E22) |
| 48 | L2/04:65-70 | Escalation: cheap model first, more expensive only on a failed example test; 85.0% at $0.27 vs GPT-4 89.6% at $1.93, about a seventh of the cost | Kapoor | effectiveness | VERIFIED | §2.2: "We start with a cheap model (Llama-3 8B) and escalate to more expensive models (GPT-3.5, Llama-3 70B, GPT-4) if we encounter a test case failure"; Table A1; 1.93 / 0.27 = 7.1. | keep |
| 49 | L2/04:56-57, 78-97 | spend reliability unevenly by risk; "No study has measured reliability spending by risk"; the four risk properties | Module 3 (internal) | practice | UNSOURCED (industry anchor missing; the page says it's a principle, which is honest) | OpenAI, "A practical guide to building agents" (cdn PDF) p. 26: "Assess the risk of each tool available to your agent by assigning a rating--low, medium, or high--based on factors like read-only vs. write access, reversibility, required account permissions, and financial impact. Use these risk ratings to trigger automated actions, such as pausing for guardrail checks before executing high-risk functions or escalating to a human if needed." p. 30: "Actions that are sensitive, irreversible, or have high stakes should trigger human oversight". | lead with an industry source (E23) |
| 50 | L2/05:78-82 | the share of blocks that were right "decides whether people trust the check"; a check can become mostly noise | none | practice | UNSOURCED (minor) | Google SRE book, "Monitoring Distributed Systems": "asking the following questions can help you avoid false positives and pager burnout ... Will I ever be able to ignore this alert, knowing it's benign?"; "I can only react with a sense of urgency a few times a day before I become fatigued. Every page should be actionable." | optional: add industry source (E24) |
| 51 | L2/05:123-128 | Kim et al. (ICML 2025): >350 models; on one leaderboard, both wrong → same wrong answer 60%; larger, more accurate models share more errors, even across providers | arXiv 2506.07962 | effectiveness | VERIFIED (2026-09-30 review); still matches | Abstract: "over 350 LLMs ... on one leaderboard dataset, models agree 60% of the time when both models err ... larger and more accurate models have highly correlated errors, even with distinct architectures and providers." | keep |
| 52 | L2/05:128-131 | Goel et al. (ICML 2025): mistakes more similar as models get more capable | arXiv 2502.04313 | effectiveness | VERIFIED (2026-09-30 review); still matches | Abstract: "model mistakes are becoming more similar with increasing capabilities". | keep |

---

### 2. Proposed edits

None of these edits touches code inside a `String.raw` demo, starter, reference or test string, so none needs Pyodide re-verification. Quiz and recap edits are JSON strings inside `QuizGroup` props; keep their escaping (`\"`) as is.

#### E1. METR and Ord (L1 C1). Lines 120-135, `01-per-step-reliability/01-small-errors-compound.mdx`

Current:
```
The best evidence comes from METR's
[time-horizon study](https://arxiv.org/abs/2503.14499) (Kwa et al., 2025).
METR gave AI agents software and research tasks whose lengths were measured
by how long skilled people took to do them, from seconds to hours, and
found that success falls steadily as tasks get longer. Toby Ord
[reanalysed their results](https://arxiv.org/abs/2505.05115) and found
they fit a very simple model: a constant chance of failing for each minute
of work a person would need. That is *p*ⁿ again, counted in minutes of work
rather than tool calls.

The model makes a testable prediction. If an agent succeeds half the time
on tasks of a certain length, then to succeed 80% of the time the task has
to be about a third as long, because 0.8³ ≈ 0.5. METR measured both for its
best model at the time: a 50% success rate on tasks up to 59 minutes long,
and an 80% success rate only on tasks up to 15 minutes. That's a quarter,
close to the predicted third, and within the measurement's noise.
```
Proposed:
```
The best evidence comes from METR's
[time-horizon study](https://arxiv.org/abs/2503.14499) (Kwa et al.,
NeurIPS 2025). METR gave AI agents software and research tasks whose
lengths were measured by how long skilled people took to do them, from
seconds to hours, and found that success falls steadily as tasks get
longer. In a short preprint, Toby Ord
[reanalysed their results](https://arxiv.org/abs/2505.05115) and argued
that they fit a very simple model: a constant chance of failing for each
minute of work a person would need. That is *p*ⁿ again, counted in minutes
of work rather than tool calls.

The model makes a testable prediction. If an agent succeeds half the time
on tasks of a certain length, then to succeed 80% of the time the task has
to be about a third as long, because 0.8³ ≈ 0.5. The first version of
METR's paper measured both for its best model at the time, Claude 3.7
Sonnet: a 50% success rate on tasks up to 59 minutes long, and an 80%
success rate only on tasks up to 15 minutes. That's a quarter, which Ord
judged close to the predicted third and within the measurement's noise.
The latest version of the paper, with more models, puts the 80% horizon at
a quarter to a sixth of the 50% one. That's the direction the model
predicts, but a somewhat bigger gap.
```
(Also consider retitling nothing; "Is it true? Roughly, on one well-studied benchmark" still fits.)

#### E2. L1 C1, lines 155-157
Current:
```
doesn't sink the task. METR's authors found that improvements in longer
tasks came largely from models getting more reliable and from getting
better at adapting to mistakes.
```
Proposed:
```
doesn't sink the task. METR's authors found that gains on longer tasks
came mainly from greater reliability and a better ability to adapt to
mistakes, along with better reasoning and tool use.
```

#### E3. L1 C1, lines 180-181
Current:
```
METR's authors credit much of models' progress on longer tasks to getting
better at adapting to mistakes, and several lessons in this module are about
```
Proposed:
```
METR's authors name adapting to mistakes as one of the main drivers of
models' progress on longer tasks, and several lessons in this module are about
```

#### E4. L1 C1 quiz Q5 explanation, line 271
Current (inside the explanation string):
```
METR's measurement for its best model at the time (59 minutes against 15) came out at about a quarter, close to that prediction.
```
Proposed:
```
In the first version of METR's paper, its best model at the time came out at about a quarter (59 minutes against 15), close to that prediction; the latest version finds a quarter to a sixth across models.
```

#### E5. L1 recap Q8, `01-per-step-reliability/06-recap-practice.mdx:284` and `:292`
Current question:
```
"METR found an agent's 80% time horizon to be about a quarter of its 50% horizon. What does the constant-failure-rate model predict?"
```
Proposed:
```
"In the first version of METR's study, its best model's 80% time horizon was about a quarter of its 50% horizon. What does the constant-failure-rate model predict?"
```
Current explanation ending:
```
METR's measurement of about a quarter was close, and within its noise."
```
Proposed:
```
That measurement of about a quarter was close, and within its noise. The latest version of METR's paper finds a quarter to a sixth across models, a somewhat bigger gap than the model predicts."
```

#### E6. Miller (L1 C2), `02-the-same-question-run-twice.mdx:233-240`
Current:
```
wordings concept later in this lesson comes back to that question. Evan Miller's
[*Adding Error Bars to Evals*](https://arxiv.org/abs/2411.00640) (2024)
draws the statistical consequence: runs of the same question aren't
independent evidence, because they share that question's difficulty, and
treating them as independent can make error bars three or more times too
narrow. His recommendation is the one this lesson follows:
run each question several times, keep the results per question, and
measure uncertainty by question.
```
Proposed:
```
wordings concept later in this lesson comes back to that question. Evan
Miller's [*Adding Error Bars to Evals*](https://arxiv.org/abs/2411.00640)
(Anthropic, 2024, a preprint) draws the statistical consequence. Evidence
that comes in groups isn't independent. When an eval asks several questions
about the same passage, treating them as independent made the error bars
about three times too narrow on one popular eval. Runs of the same question
are the extreme case of such a group, since every run shares that
question's difficulty. His recommendation is the one this lesson follows:
run each question several times, turn its runs into one score per
question, and measure uncertainty over questions.
```
(Source: Miller Table 4, DROP clustered SE 1.34 vs naive 0.44, ratio 3.05; §3.1 "compute the standard error using the question-level mean scores from the resamples".)

#### E7. L1 C2, lines 282-284
Current:
```
Resampling whole questions gives intervals about twice as wide for the 4B
and nearly three times as wide for the 2B, in line with Miller's finding of
three times or more. The naive interval is too narrow because it counts twenty runs of
```
Proposed:
```
Resampling whole questions gives intervals about twice as wide for the 4B
and nearly three times as wide for the 2B, the same size of effect Miller
found for grouped questions. The naive interval is too narrow because it counts twenty runs of
```

#### E8. L1 C2 quiz Q3 explanation, line 442
Current (inside the string):
```
in line with Miller's finding that ignoring the clustering can make error bars three or more times too narrow.
```
Proposed:
```
the same size of effect Miller found when related questions were treated as independent: error bars about three times too narrow on one popular eval.
```

#### E9. L1 recap Q3 explanation, `06-recap-practice.mdx:237`
Current (inside the string):
```
Miller (2024) found that ignoring that clustering can make error bars three or more times too narrow; in this lesson's runs the question-level intervals were about two to three times wider.
```
Proposed:
```
Miller (2024) found that treating related questions as independent made error bars about three times too narrow on one popular eval; in this lesson's runs the question-level intervals were about two to three times wider.
```

#### E10. Kalai et al. (L1 C2), lines 353-361
Current:
```
OpenAI's Kalai et al.,
[*Why Language Models Hallucinate*](https://openai.com/index/why-language-models-hallucinate/)
(2025), argue that this way of counting is part of why models guess.
Benchmarks that only score accuracy give nothing for "I don't know", so a
model that guesses scores higher. OpenAI's blog shows the effect on SimpleQA, with its own models' figures.
gpt-5-thinking-mini abstained on 52% of questions and was right on 22%, wrong
on 26%. o4-mini abstained on 1% and was right on 24%, but wrong on 75%. On
accuracy alone, the second looks slightly better, while it makes about three
times as many errors.
```
Proposed:
```
Kalai et al., researchers at OpenAI and Georgia Tech, argue in
[*Nature*](https://www.nature.com/articles/s41586-026-10549-w) (2026) that
this way of counting is part of why models guess. (OpenAI first released
the work in 2025 as *Why Language Models Hallucinate*.) Benchmarks that
only score accuracy give nothing for "I don't know", so a model that
guesses scores higher. They show the effect on SimpleQA's 4,326 questions
with two of OpenAI's models. GPT-5-mini declined to answer 63.2% of them,
and was right on 16.0% and wrong on 20.8%. o4-mini declined on 2.6%, and
was right on 20.6% but wrong on 76.8%. On accuracy alone the second looks
better, while it makes more than three times as many errors.
```
Ratios checked: 76.8 / 20.8 = 3.69; 16.0 + 20.8 + 63.2 = 100; 20.6 + 76.8 + 2.6 = 100.

#### E11. L1 C2, line 363 (report abstentions separately)
Current:
```
For an agent, report wrong answers and abstentions separately, alongside
pass^k. An abstention isn't free, though. On a question the agent should
```
Proposed:
```
For an agent, report wrong answers and abstentions separately, alongside
pass^k. That's how OpenAI's [SimpleQA](https://arxiv.org/abs/2411.04368)
grades a reply: correct, incorrect or not attempted. An abstention isn't
free, though. On a question the agent should
```

#### E12. pass^k industry anchor (L1 C3), `03-reliability-as-pass-k.mdx:240-241`
Current:
```
eventually, and you can't say who. When an agent has to be dependable,
not just right on average, pass^k is the measure.
```
Proposed:
```
eventually, and you can't say who. When an agent has to be dependable,
not just right on average, pass^k is the measure. Anthropic's
[guide to agent evaluations](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
draws the same line: pass@k "for tools where one success matters, pass^k
for agents where consistency is essential."
```

#### E13. Wording check industry anchor (L1 C4), `04-reliable-across-wordings.mdx:156-158`
Current:
```
[Module 5's labels that were wrong](/05-rag-systems/02-measuring-retrieval/05-when-the-labels-are-wrong/):
a test that asks something different from what you meant measures the
wrong thing.
```
Proposed:
```
[Module 5's labels that were wrong](/05-rag-systems/02-measuring-retrieval/05-when-the-labels-are-wrong/):
a test that asks something different from what you meant measures the
wrong thing. Anthropic's
[agent-evals guide](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
gives the same advice: with frontier models, a task that fails every time
"is most often a signal of a broken task, not an incapable agent".
```

#### E14. Zhu et al. preprint label (L1 C5), `05-where-agents-fail.mdx:40-41`
Current:
```
[*Where LLM Agents Fail and How They Can Learn from Failures*](https://arxiv.org/abs/2509.25370)
(Zhu et al., 2025), researchers annotated failed runs from three
```
Proposed:
```
[*Where LLM Agents Fail and How They Can Learn from Failures*](https://arxiv.org/abs/2509.25370)
(Zhu et al., 2025, a preprint), researchers annotated failed runs from three
```

#### E15 (optional). Routine anchor (L1 C5), `05-where-agents-fail.mdx:99-100`
Current:
```
1. **Find the first step that went wrong.** Read the run from the start.
   Later errors usually follow from the first one.
```
Proposed:
```
1. **Find the first step that went wrong.** Read the run from the start.
   Later errors usually follow from the first one. Anthropic's evals team
   reads transcripts regularly for the same reason: the transcript shows
   "whether the agent made a genuine mistake or whether your graders
   rejected a valid solution."
```

#### E16. Sclar venue (L1 C4), `04-reliable-across-wordings.mdx:73`
Current: `  (2023), changed only details like separators, spacing and capitalisation`
Proposed: `  (ICLR 2024), changed only details like separators, spacing and capitalisation`

#### E17 (optional). τ-bench venue
Everywhere it appears as "(Yao et al., 2024)" (`03-reliability-as-pass-k.mdx:244`), could read "(Yao et al., ICLR 2025)". Figures are unchanged in the ICLR camera-ready.

#### E18. Kapoor venue (L2 C1), `01-four-things-every-technique-trades.mdx:36`
Current: `[*AI Agents That Matter*](https://arxiv.org/abs/2407.01502) (2024), looked`
Proposed: `[*AI Agents That Matter*](https://arxiv.org/abs/2407.01502) (TMLR 2025), looked`
(Table A1 is identical in the TMLR version, so the demo's numbers and its "# Kapoor et al. (2024), Table A1" comment can stay. If you change the comment, it's inside `FRONTIER_DEMO`, a demo string.)

#### E19. OR-Bench (L2 C1), `01-four-things-every-technique-trades.mdx:60-64`, plus quiz Q3 (158, 163)
Current:
```
- **Across models, safety and over-refusal rise together.** OR-Bench (Cui
  et al., 2024) tested models on thousands of prompts that look harmful but
  aren't, and on prompts that really are harmful. The models that refused
  the harmful prompts most reliably also refused the most harmless ones: the
  Spearman rank correlation between the two was 0.878. In most models,
```
Proposed:
```
- **Across models, safety and over-refusal rise together.**
  [OR-Bench](https://arxiv.org/abs/2405.20947) (Cui et al., ICML 2025)
  tested 32 models on thousands of prompts that look harmful but aren't,
  and on prompts that really are harmful. The models that refused the
  harmful prompts most reliably also refused the most harmless ones: the
  Spearman rank correlation between the two was 0.89. In most models,
```
Quiz Q3, line 158: `"OR-Bench found a rank correlation of 0.878 between` becomes `"OR-Bench found a rank correlation of 0.89 between`. Line 163: `"The two measures are unrelated, since 0.878 is below 1"` becomes `"The two measures are unrelated, since 0.89 is below 1"`. (Option length is unchanged; leave the quiz balance pass alone.)

#### E20. Balanced checks industry anchor (L2 C1), `01-four-things-every-technique-trades.mdx:101-103`
Current:
```
The habit that follows: **report every check as a pair of numbers, what it
catches and what it wrongly blocks,** measured on cases where you know the
right outcome.
```
Proposed:
```
The habit that follows: **report every check as a pair of numbers, what it
catches and what it wrongly blocks,** measured on cases where you know the
right outcome. Anthropic's
[agent-evals guide](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
asks for the same balance: "Test both the cases where a behavior should
occur and where it shouldn't. One-sided evals create one-sided
optimization."
```

#### E21. Self-correction backing (L2 C2), `02-what-reliability-costs.mdx`, lines 80-82 of the prose
Current:
```
got worse after self-correction. Later papers have argued that newer models
do better at it, so treat it as a question to measure for your own model and
task, not a given.
```
Proposed:
```
got worse after self-correction. Later work showed that models can be
trained to do better: Kumar et al. at Google DeepMind
([SCoRe](https://arxiv.org/abs/2409.12917), ICLR 2025) used reinforcement
learning to improve Gemini models' self-correction on maths and coding. So
treat it as a question to measure for your own model and task, not a given.
```
(The L2 C2 quiz Q2 explanation "Later work has argued newer models do better" can stay, or read "Later work has trained models to do better".)

#### E22. Snell venue
- `03-equal-budgets-need-a-stated-unit.mdx:180-181`: `That's how Snell et al.\n  (2024) compared` → `That's how Snell et al.\n  (ICLR 2025) compared`.
- `04-spend-reliability-where-the-risk-is.mdx` (the "By difficulty" bullet): `  (2024), found that how much extra computation helps` → `  (ICLR 2025), found that how much extra computation helps`.

#### E23. Risk-based spending industry anchor (L2 C4), "What makes a step risky"
Current:
```
Module 3 already drew the first line:
[not all tools carry the same risk](/03-tool-design-for-agents/11-designing-for-least-privilege/02-separate-reads-from-writes-and-gate-the-writes/#not-all-tools-carry-the-same-risk),
and writes whose mistakes are costly get a gate. For reliability, four
properties raise the cost of a wrong step:
```
Proposed:
```
Module 3 already drew the first line:
[not all tools carry the same risk](/03-tool-design-for-agents/11-designing-for-least-privilege/02-separate-reads-from-writes-and-gate-the-writes/#not-all-tools-carry-the-same-risk),
and writes whose mistakes are costly get a gate. OpenAI's
[practical guide to building agents](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf)
recommends the same thing: rate each tool low, medium or high risk "based
on factors like read-only vs. write access, reversibility, required account
permissions, and financial impact", and pause for checks "before executing
high-risk functions". For reliability, four properties raise the cost of a
wrong step:
```
Optionally also soften the "evidence" subsection's opening, "No study has measured "reliability spending by risk" for agents directly.", to "No study has measured "reliability spending by risk" for agents directly, though it's standard advice, as above." Keep the "design principle" framing.

#### E24 (optional). Base-rate industry anchor (L2 C5), "Most blocks can be false alarms"
Current:
```
So a check's report should include the share of its blocks that were
right, alongside the two rates. It's the number that decides whether people
trust the check, and it falls as the agent gets better.
```
Proposed:
```
So a check's report should include the share of its blocks that were
right, alongside the two rates. It's the number that decides whether people
trust the check, and it falls as the agent gets better. Google's
[SRE book](https://sre.google/sre-book/monitoring-distributed-systems/)
asks the same of every alert: "Will I ever be able to ignore this alert,
knowing it's benign?"
```

---

### 3. Needs a decision

1. **METR's latest figures weaken "close to the prediction" (L1 C1, its quiz Q5, recap Q8).** The 59 vs 15 minutes (a quarter vs the predicted third) is from v1 (March 2025, Claude 3.7 Sonnet). The current version (v4, July 2026, NeurIPS 2025) drops those numbers and reports 80% horizons "4-6x shorter" across models, while the constant-hazard model predicts about 3.1× (ln 0.8 / ln 0.5 = 0.32). The concept still teaches the right thing, "a rough model, worth keeping as a way of thinking", but "roughly true" becomes "true in direction, with a somewhat bigger gap". **Recommendation:** keep the v1 example, labelled as the first version, and add v4's range (E1, E4, E5). Don't drop the METR subsection.

No other finding changes what a concept teaches. The Miller correction keeps the lesson's point (runs of one question are clustered evidence), which the course's own data shows at 2–3×. It changes only which evidence the "three times" comes from. The Kalai replacement keeps the argument, and the peer-reviewed figures make it stronger.

---

### 4. Counts

- **Verified:** 36 claims (including 3 marked VERIFIED (2026-09-30 review) and re-checked: Anthropic statistics post, Kim et al., Goel et al.).
- **Contradicted:** 1 claim (Miller's "three or more times", which describes grouped questions, not repeated runs). It appears at 4 places: L1 C2 prose ×2, L1 C2 Q3, L1 recap Q3.
- **Superseded / outdated (VERIFIED for an older version):** 3. METR 59/15 (v1 → v4 says 4–6×), OR-Bench 0.878 (v1/v2 → ICML 2025 v5 says 0.89), Kalai/SimpleQA 52/22/26 vs 1/24/75 (blog / system card → Nature 2026: 63.2/16.0/20.8 vs 2.6/20.6/76.8).
- **Unreachable:** 0 primary sources. Only the OpenReview decision status for Zhu et al. was unreachable; it's treated as a preprint.
- **Re-labelled:** 10 edits. METR venue/version (E1, E4, E5), Ord as a preprint (E1), METR's drivers softened (E2, E3), Zhu as a preprint (E14), Sclar ICLR 2024 (E16), Kapoor TMLR 2025 (E18), Snell ICLR 2025 (E22 ×2); τ-bench ICLR 2025 is optional (E17).
- **Replaced:** 3. Kalai figures and citation (E10), OR-Bench figure (E19), Miller framing (E6–E9).
- **Added:** 7 industry or evidence sources, 2 of them optional. Anthropic agent-evals on pass^k (E12), broken tasks (E13) and balanced sets (E20); SimpleQA grading (E11); SCoRe (E21); OpenAI's tool-risk ratings (E23); optionally Anthropic's transcripts advice (E15) and the Google SRE alerting questions (E24).
- **Unsourced practice claims flagged:** 6 (IDs 18, 22, 27, 37, 39, 49) plus 2 minor (30, 50).

---

## Report: Module 6 citation audit: Lessons 4, 5, 6 (subagent B)

Scope: `src/content/modules/06-reliability/04-verifying-claims`, `05-voting`, `06-when-unsure` (every `.mdx`: intros, concepts, quiz explanations, recaps). Read-only; no repo files edited.

Downloads and extracted text are in the scratchpad at `m6B/`. All paper quotes below come from `curl` + `pdftotext` of the named version, or from the arXiv abstract page (version history checked). Web pages were read with `curl` + `strip.py`. arize.com returned a Cloudflare 403, so it was read through the Wayback Machine (2026 capture).

Paths below are relative to `src/content/modules/06-reliability/`. L4 = `04-verifying-claims`, L5 = `05-voting`, L6 = `06-when-unsure`.

### 1. Claims table

Kinds: P = practice, E = effectiveness, F = fact.

#### Priority items (syllabus "Open items")

| ID | file:line | claim (trimmed) | source given | kind | verdict | evidence | recommendation |
|---|---|---|---|---|---|---|---|
| P1 | L4/02:333-339 | "Swapping the order of two answers changed a judge's verdict often. GPT-4, the most consistent, gave the same verdict both ways about 65% of the time. Padding an answer with repeated content fooled Claude-v1 and GPT-3.5 in about 91% … and GPT-4 in about 9%." | Zheng et al., arXiv 2306.05685 | E | **VERIFIED** (figures). Two small precision issues. | v4 (24 Dec 2023, latest; "NeurIPS 2023 Datasets and Benchmarks Track"), Table 2: "GPT-4 default 65.0% … rename 66.2%"; "Only GPT-4 outputs consistent results in more than 60% of cases." The test used near-identical pairs: "we construct two similar answers … this test is challenging because the answers are very similar and occasionally indistinguishable even to humans." Table 3: "Failure rate under 'repetitive list' attack for different LLM judges on 23 answers … Claude-v1 91.3%, GPT-3.5 91.3%, GPT-4 8.7%". The padding is a reworded copy: "asking GPT-4 to rephrase the list without adding any new information and insert the rephrased new list to the beginning of the original list." | Keep the figures. Reword for precision: say the answers were similar, the padding was a reworded copy of the list, and there were 23 answers (21 of 23 = 91.3%, 2 of 23 = 8.7%). |
| P2 | L4/02:195-199 | Zheng et al. "(NeurIPS 2023), which made the approach common, validated their judges by how often they agreed with human ratings" | same | P/E | **VERIFIED** | Abstract (v4): "We then verify the agreement between LLM judges and human preferences … strong LLM judges like GPT-4 … achieving over 80% agreement." Venue per arXiv comment: "NeurIPS 2023 Datasets and Benchmarks Track". | Re-label the venue as "NeurIPS 2023 Datasets and Benchmarks". Soften "made the approach common" to "helped make". |
| P3 | L4/02:342-346 | Panickssery, Bowman and Feng (NeurIPS 2024) "found judges scoring their own outputs above others' that people rated as equal. The better a model was at recognising its own text, the stronger the preference." | arXiv 2404.13076 | E | **CONTRADICTED** (the first sentence). The second sentence is VERIFIED. | "People rated as equal" is the paper's *definition* of self-preference, not a finding. The arXiv copy (v1 only) has no human quality ratings at all ("evidence of self-preference even in the absence of baseline human preference data"). The NeurIPS 2024 camera-ready (proceedings.neurips.cc PDF), §2.5 "Human evaluation of preference", found people did **not** rate them equal: "GPT-4 vs. GPT-3.5: 57% 2. GPT-4 vs. Llama 2: 63% 3. GPT-3.5 vs. Llama 2: 58% … But the disparity between LLMs as rated by humans is significantly lower than the level of self-preference exhibited by the LLMs … the LLMs' self-preference is disproportionate to the actual quality differences." The task was news summarisation (CNN/DailyMail, XSUM). Second sentence: "we discover a linear correlation between self-recognition capability and the strength of self-preference bias" (abstract; found by fine-tuning). | **Replace the wording** (see edits). Cite the NeurIPS version, which is the latest; the arXiv v1 lacks §2.5. |
| P4 | L4/02:352-356 | Hamel Husain's guide, "written from work with over 30 companies", has a domain expert give pass/fail verdicts with a written critique, and revises the judge's prompt until it agrees with the expert | hamel.dev/blog/posts/llm-judge/ | P | **VERIFIED** | "This guide shares what I've learned after helping over 30 companies set up their evaluation systems." Step 3: "Direct The Domain Expert to Make Pass/Fail Judgments with Critiques … the domain expert should write a critique that explains their reasoning." Step 5 subheading: "Keep Iterating on the Prompt Until Convergence With Domain Expert". | Keep. The "over 30 companies" is his own account, and the page already attributes it to him. |
| P5 | L5/06:451-453 | Cobbe et al. (2021): "A 6B model choosing among its samples with the verifier slightly outperformed a fine-tuned 175B model, a gain the authors put at about what a thirtyfold larger model would give." | arXiv 2110.14168 | E | **VERIFIED** | v2 (18 Nov 2021, latest), Conclusion: "On the full dataset, 6B verification slightly outperforms a finetuned 175B model, thereby offering a boost approximately equivalent to a 30x model size increase." It was never published at a venue; it is an OpenAI arXiv paper. | Keep the figures. Re-label it as an OpenAI preprint. |
| P6 | L5/06:493-496 | Cobbe: "accuracy rose as the verifier chose among more samples per problem, up to 400, and then fell. Past that point, they concluded, the search was finding adversarial solutions" | same | E | **VERIFIED**, with "concluded" too strong | §5.1: "performance improves as we increase the number of completions up to 400. Beyond this point, performance start to decrease. This suggests that the benefits of search are eventually outweighed by the risk of finding adversarial solutions that fool the verifier." The result is for the 6B verifier ("At this scale"). | Soften "concluded" to "suggested". Optionally add Snell et al.'s matching result (see P9) as stronger backing. |
| P7 | L5/06:523-536 | MAKER (Meyerson et al., 2025 preprint, Cognizant): 20-disk Hanoi, 1,048,575 moves, "into one model call per move"; first-to-ahead-by-k voting; "threw out any sample that wasn't in the expected format"; gpt-4.1-mini; "finishing all million moves without an error" | arXiv 2511.09030; GitHub repo | E | **VERIFIED**, with two small inaccuracies. The page no longer states k or a length rule, and implies nothing the paper doesn't say, except "one model call per move". | v1 only (12 Nov 2025). Still a preprint: arXiv has no venue comment, and a search found no conference acceptance. §4.4: "With gpt-4.1-mini as the base model, the maximum output token threshold was set to 750, and a red-flagging output parser was used to enforce the basic formatting requirements … Since kmin = 3, at least three responses were generated in parallel for each step … the full system solved the problem perfectly." §3.3: "two signs of unreliability are used as red flags: (1) overly long responses, and (2) incorrectly formatted responses." Voting (§3.2): "a first-to-ahead-by-k voting process is used". So each move took **at least three** calls, not one, and discards were for length as well as format. | Keep the preprint label. Fix "one model call per move" (it is one small task per move, voted on with at least three calls). Optionally add "or ran too long" and "a lead of three" (see edits). |

#### Lesson 4: other claims

| ID | file:line | claim (trimmed) | source given | kind | verdict | evidence | recommendation |
|---|---|---|---|---|---|---|---|
| A1 | L4/00-intro:18-20 | "in commercial generative search engines, only about half of sentences were fully supported by what they cited" | (Liu et al., via C1) | E | **VERIFIED** | Abstract (v2, EMNLP Findings 2023): "a mere 51.5% of generated sentences are fully supported by citations" | Keep |
| A2 | L4/01:210-215, quiz 403 | Liu, Zhang and Liang (EMNLP Findings 2023): four commercial engines; 51.5% of sentences fully supported; 74.5% of citations support their sentence | arXiv 2304.09848 | E | **VERIFIED** | "audit four popular generative search engines -- Bing Chat, NeevaAI, perplexity.ai, and YouChat … a mere 51.5% of generated sentences are fully supported by citations and only 74.5% of citations support their associated sentence." Comment: "to appear in Findings of EMNLP 2023". | Keep |
| A3 | L4/01:225-228 | Min et al.'s FActScore (2023) breaks text into atomic facts with a model and checks each against a knowledge source | arXiv 2305.14251 | P | **VERIFIED** | "FACTSCORE … breaks a generation into a series of atomic facts and computes the percentage of atomic facts supported by a reliable knowledge source." EMNLP 2023 main. | Keep (optionally add "EMNLP 2023") |
| A4 | L4/01:295-300 | "This is how RAG systems are commonly evaluated: the faithfulness metric in Ragas … identifies the claims … checks each … reports the share that are supported" | docs.ragas.io faithfulness | P | **VERIFIED** | "1. Identify all the claims in the response. 2. Check each claim to see if it can be inferred from the retrieved context. 3. Compute the faithfulness score … Number of claims in the response supported by the retrieved context / Total number of claims" | Keep |
| A5 | L4/01:343-348 | Choi et al., decontextualization (TACL 2021): a sentence out of context often needs rewriting to stand alone | aclanthology 2021.tacl-1.27 | F | **VERIFIED** | "sentence decontextualization: taking a sentence together with its context and rewriting it to be interpretable out of context, while preserving its meaning." | Keep |
| A6 | L4/02:199-202, quiz 416 | Arize's guide: run the judge on a labelled golden set, compare its labels with yours, and only rely on it once they agree | arize.com/guides/llm-as-a-judge/ | P | **VERIFIED** (via Wayback, 2026 capture; live site 403) | "Validate it against a golden dataset and compare its labels to your own. A 75 to 90% match between judge and human labels indicates strong alignment and readiness to scale." | Keep |
| A7 | L4/02:204-213, quiz 449 | AttributionBench (ACL Findings 2024): fine-tuned GPT-3.5 about 80% macro-F1; zero-shot GPT-3.5/GPT-4 over 80% on short, 60-70% on long evidence; NLI-trained models often did as well as fine-tuned GPT-3.5 | arXiv 2402.15089 | E | **VERIFIED** | Abstract: "even a fine-tuned GPT-3.5 only achieves around 80% macro-F1". §4.1: "For tasks with shorter claims and evidence … the performance of GPT-3.5 and GPT-4 are over 80%, while for tasks with longer evidence (like Stanford-GenSearch and HAGRID), the zero-shot performance for models is around 60%~70%". "T5-XXL-TRUE and AttrScore-Flan-T5 (3B) are fine-tuned on data including NLI … both models outperform fine-tuned GPT-3.5 for the average F1 score on OOD sets and achieve comparable performance". Venue: ACL Findings 2024 (aclanthology 2024.findings-acl.886). | Keep |
| A8 | L4/02:285-290 | Rule of three (Hanley and Lippman-Hand, JAMA 1983): after 0 failures in n, the rate could be up to about 3/n at 95%; the 5%/40 = one in eight arithmetic | jhanley.biostat.mcgill.ca PDF | F | **VERIFIED** | "JAMA, April 1, 1983--Vol 249 … if none of n patients shows the event … we can be 95% confident that the chance of this event is at most three in n (ie, 3/n)." Check: 0.95^40 = 0.129, about 1 in 7.8. | Keep |
| A9 | L4/02:347-350 | Kim et al. (ICML 2025): judges overrate less accurate models, especially same-provider ones, and underrate more accurate ones | arXiv 2506.07962 | E | **VERIFIED (2026-09-30 review)**, re-checked | "each judge systematically inflates the accuracy of models that are less accurate than itself … each judge underinflates the accuracy of models that are more accurate than itself"; "judges significantly inflate the accuracy of models from the same provider". | Keep |
| A10 | L4/02:356-358 | Anthropic's agent-evals guide: model graders "should be closely calibrated with human experts" | anthropic.com/engineering/demystifying-evals-for-ai-agents | P | **VERIFIED (2026-09-30 review)**, re-checked | "LLM-as-judge graders should be closely calibrated with human experts to gain confidence that there is little divergence between the human grading and model grading." | Keep |
| A11 | L4/02:375-378, quiz 482 | "A second model family as the judge costs little and removes the question." | none | P | **UNSOURCED** (a learner could ask "says who?") | Arize (Wayback, same page as A6): "Should you use the same model as your judge that you use in your application? No. Pick a different, more capable model." | **Add backing:** Arize, already linked on this page. |
| A12 | L4/03:177-183, quiz 309 | ContraDoc (NAACL 2024): contradictions within single long documents, several domains; GPT-3.5/GPT-4/PaLM 2/Llama 2; GPT-4 best, can outperform humans, still unreliable, weakest on nuance and context | arXiv 2311.09182 | E | **VERIFIED** | v2 abstract ("Accepted to NAACL 2024 main conference"): "the first human-annotated dataset to study self-contradictions in long documents across multiple domains … GPT3.5, GPT4, PaLM2, and LLaMAv2 … While GPT4 performs the best and can outperform humans on this task, we find that it is still unreliable and struggles with self-contradictions that require more nuance and context." | Keep |
| A13 | L4/04:168-171 | Sethi et al.'s preprint: models given a tool result that couldn't answer the question sometimes stated a value anyway | links L3 page (arXiv 2609.14758) | E | **VERIFIED** (abstract; L3's own wording is audited elsewhere) | "a tool call is enforced and the returned payload is guaranteed to be unusable … the model either asserts a value the payload cannot support … when it returns status:ok … dishonesty reaches 45.3%." v1 only, preprint. | Keep |
| A14 | L4/05:69-74 | FalseQA, Hu et al. (ACL 2023): models easily taken in; 2,365 questions with explanations (rebuttals); fine-tuning on a few hundred examples taught them to tell apart and rebut | arXiv 2307.02394 | E | **VERIFIED** | "they tend to be easily deceived by tricky questions such as 'How many eyes does the sun have?' … a FalseQA dataset containing 2365 human-written FPQs, with the corresponding explanations for the false premises … PLMs are capable of discriminating FPQs by fine-tuning on moderate numbers (e.g., 256) of examples … explanations for the false premise, which serve as rebuttals." "Accepted to ACL 2023 main conference". | Keep |
| A15 | L4/05:75-77 | MultiHoax (2025) authors observe newer models handle the plain kind well, so research moved to subtler premises | arXiv 2506.00264 | F (attributed) | **VERIFIED** | v2, §2: "While earlier LLMs struggled with these, recent versions of the LLMs handle them easily, raising the need to evaluate models on more subtle false premises." ACL Findings 2025. | Keep (optionally add "ACL Findings 2025") |
| A16 | L4/06:54-71, quiz 149-157 | CoVe, Dhuliawala et al. (ACL Findings 2024): four steps; Llama 65B list answers about 17% correct vs about 70% of verification questions; precision 0.17 → 0.36 | arXiv 2309.11495 | E | **VERIFIED** | v2: "only 17% of the Llama … individual entity via a verification question, we find 70% are correctly answered"; "baseline for the Wikidata task (from 0.17 to 0.36)". Table: "Llama 65B Few-shot 0.17 … CoVe (two-step) 0.36 … CoVe (factored) 0.32". Venue: aclanthology 2024.findings-acl.212. | Keep. Note that 0.36 is the two-step variant, which "Applying CoVe" covers. |
| A17 | L4/06:83-86, recap 286, quiz 146 | Factored beat joint on every task; two-step beat it on the tasks tested; a check that sees the draft tends to repeat it | same | E | **VERIFIED** | "We observe a consistent performance improvement across all tasks from applying the factored CoVe approach compared to joint CoVe. For … 2-step approach also outperforms the joint approach, as tested on the Wikidata and Wiki-Category list tasks … as they may be prone to repeating it (as the joint method can do)." | Keep |
| A18 | L4/06:44-47 | Huang et al.: models often failed to self-correct reasoning, sometimes worse | via Lesson 2 link | E | Not checked (Lesson 2's scope) | — | Out of scope; covered by the L2 auditor |

#### Lesson 5: other claims

| ID | file:line | claim (trimmed) | source given | kind | verdict | evidence | recommendation |
|---|---|---|---|---|---|---|---|
| B1 | L5/01:163-170, quiz 283 | Self-consistency, Wang et al. (ICLR 2023): sample several paths, take the most common answer; +17.9 points on GSM8K | arXiv 2203.11171 | E | **VERIFIED** | v4 ("camera ready version at ICLR 2023"): "first samples a diverse set of reasoning paths … selects the most consistent answer … GSM8K (+17.9%)" (absolute points). | Keep |
| B2 | L5/01:171-174 | Chen et al. (NeurIPS 2024) open by noting many SOTA results came from systems that make several calls and aggregate | arXiv 2403.02419 | P | **VERIFIED** | Abstract: "Many recent state-of-the-art results in language tasks were achieved using compound systems that perform multiple Language Model (LM) calls and aggregate their responses." NeurIPS 2024 main track (neurips.cc poster 93777, proceedings). | Keep |
| B3 | L5/02:114-121, quiz 201-209, L5/04:143-145 | Chen et al.: across several tasks majority-vote accuracy can rise then fall; more calls help easy questions and hurt hard ones | same | E | **VERIFIED** | "across multiple language tasks, the performance of both Vote and Filter-Vote can first increase but then decrease … more LM calls lead to higher performance on 'easy' queries, but lower performance on 'hard' queries". | Keep |
| B4 | L5/02:127-130 | Condorcet's jury theorem (18th century) | none | F | UNSOURCED, textbook fact | — | Keep; standard mathematics, and a citation isn't needed |
| B5 | L5/03:190-197, quiz 262-270; L6/02:259-260 | Xiong et al. (ICLR 2024): five models incl. GPT-4; stated confidence overconfident; consistency helped; black-box close to white-box | arXiv 2306.13063 | E | **VERIFIED** | v2 ("accepted by ICLR 2024"): "five widely-used LLMs including GPT-4 and LLaMA 2 Chat … LLMs, when verbalizing their confidence, tend to be overconfident … consistency among multiple responses … can help mitigate this overconfidence … while white-box methods perform better, the gap is narrow, e.g., 0.522 to 0.605 in AUROC." | Keep |
| B6 | L5/04:139-143, quiz 297 | Snell et al.: how much test-time compute helps depends heavily on difficulty; where a smaller model already had some success, it could beat a model fourteen times larger | none (unlinked; L2 links the same paper) | E | **VERIFIED** | arXiv 2408.03314 v1 (ICLR 2025): "the effectiveness of different approaches to scaling test-time compute critically varies depending on the difficulty of the prompt … in a FLOPs-matched evaluation, we find that on problems where a smaller base model attains somewhat non-trivial success rates, test-time compute can be used to outperform a 14x larger model." | **Add the link** and venue, and say "at the same total compute" (FLOPs-matched). |
| B7 | L5/05:69-78 | Chen et al.'s USC (2023): all candidates in one prompt, pick the most consistent by majority consensus; helps open-ended tasks; on code matched execution-based voting without running code | arXiv 2311.17311 | E | **VERIFIED**; it's a preprint | v1 only (29 Nov 2023; Google). Abstract: "On open-ended generation tasks where the original self-consistency method is not applicable, USC effectively utilizes multiple samples and improves the performance … without access to execution results, USC also matches the execution-based voting performance on code generation." Later an ICML 2024 workshop poster (ICL@ICML, icml.cc/virtual/2024/38387), not an archival venue. | **Re-label** as a 2023 preprint from Google. |
| B8 | L5/05:80-81 | "with the instruction the paper used" | same | F | **VERIFIED** | Fig. 6: "Select the most consistent response based on majority consensus. Start your answer with "The most consistent response is Response X" (without quotes)." This matches the demo string exactly. | Keep |
| B9 | L5/05:97-100 | "A 2024 study comparing another method with USC points out exactly this limit: every candidate has to fit in one prompt." | arXiv 2410.02902 (unnamed) | F | **VERIFIED** | Wu et al., "Better Instruction-Following Through Minimum Bayes Risk", v4 (ICLR 2025 Spotlight), App. A.2: "The limited context lengths of LLMs poses a significant challenge when using USC, as it requires fitting all Ncand = 30 samples into a single prompt. In contrast, MBR decoding only requires fitting two outputs into a single prompt". | **Re-label:** name it and give the venue (ICLR 2025, not "2024 study"). |
| B10 | L5/05:133-135, recap 299 | USC "picks the most typical candidate, not the best one" | none | E | Our reasoning. The paper supports it. | USC §5: "the most consistent response is not necessarily the best one. We observe that there is still a notable gap to oracle scores". | Optional: add backing ("its authors note…"). |
| B11 | L5/06:370-373 | Adaptive-Consistency (EMNLP 2023): 17 datasets, three models, up to 7.9× fewer samples, average drop under 0.1% | arXiv 2305.11860 | E | **VERIFIED (2026-09-30 review)**, re-checked | v2 ("Published at EMNLP 2023"): "over 17 reasoning and code generation datasets and three LLMs demonstrate that Adaptive-Consistency reduces sample budget by up to 7.9 times with an average accuracy drop of less than 0.1%." | Keep |
| B12 | L5/06:402-405 | Anthropic's guide to building agents gives voting across prompts for code review: quoted | anthropic.com/engineering/building-effective-agents | P | **VERIFIED** | "Voting: Reviewing a piece of code for vulnerabilities, where several different prompts review and flag the code if they find a problem." | Keep |
| B13 | L5/06:406-409 | DiVeRSe (ACL 2023): several prompts plus a verifier; GSM8K 74.4% → 83.2% | aclanthology 2023.acl-long.291 | E | **VERIFIED (2026-09-30 review)**, re-checked | PDF: "GSM8K (74.4% → 83.2%)". 74.4 is the self-consistency baseline in its table ("Self-Consistency 74.4"). | Keep |
| B14 | L5/06:433-438 | Kim et al.: >350 models; on one leaderboard, both-wrong pairs agree 60%; larger, more accurate models share more errors, even across providers | arXiv 2506.07962 | E | **VERIFIED (2026-09-30 review)**, re-checked | "over 350 LLMs … on one leaderboard dataset, models agree 60% of the time when both models err … larger and more accurate models have highly correlated errors, even with distinct architectures and providers." | Keep |
| B15 | L5/06:446-450 | Claude 4 high scores: parallel attempts, discard patches that break visible regression tests, a scoring model chooses | anthropic.com/news/claude-4 | P (vendor, own product) | **VERIFIED** | "We sample multiple parallel attempts. We discard patches that break the visible regression tests in the repository … We then use an internal scoring model to select the best candidate from the remaining attempts." | Keep. It's attributed ("Anthropic reports") and states no figure. |
| B16 | L5/06:454-456 | Lightman et al. (2023) improved on it by checking each step | arXiv 2305.20050 | E | **VERIFIED** | "process supervision significantly outperforms outcome supervision for training models to solve problems from the challenging MATH dataset." Published ICLR 2024 (openreview v8L0pN6EOi; ICLR proceedings). | **Re-label** "(2023)" → "(ICLR 2024)". |
| B17 | L5/06:456-459 | Snell et al. "found that searching against such a verifier was one of the most effective ways to spend extra computation at test time" | via L5 C4 (unlinked there) | E | **Overstated**. The paper studies it as one of two mechanisms, and which is best depends on difficulty. | Abstract: "we analyze two primary mechanisms to scale test-time computation: (1) searching against dense, process-based verifier reward models; and (2) updating the model's distribution over a response adaptively … the effectiveness … critically varies depending on the difficulty of the prompt." §5: "beam-search is more effective on harder questions and at lower compute budgets, whereas best-of-N is more effective on easier questions". Also, "On the easier problems (bins 1 and 2), beam search shows signs of over-optimization with higher budgets". | **Soften** (see edits). Snell's over-optimisation finding can back P6. |

#### Lesson 6: other claims

| ID | file:line | claim (trimmed) | source given | kind | verdict | evidence | recommendation |
|---|---|---|---|---|---|---|---|
| C1 | L6/01:218-225, quiz 294-302 | Wang et al., Learning to Ask (EMNLP 2025): real users' instructions, error study, benchmark; agents make up the missing argument, "as they put it, can lead to hallucinations and risks, where a person would simply have asked"; Ask-when-Needed | arXiv 2409.00557 | E | **VERIFIED**, except the last clause | Latest v4 (29 Apr 2026), comment "EMNLP 2025": "we meticulously examine the real-world instructions queried from users, analyze the error patterns, and build a challenging tool-use benchmark … LLMs tend to arbitrarily generate the missed argument, which may lead to hallucinations and risks … Ask-when-Needed (AwN), which prompts LLMs to ask questions to users whenever they encounter obstacles due to unclear instructions." "Where a person would simply have asked" is not in the paper, yet sits inside the "as they put it" sentence. | **Reword** so the added clause isn't attributed to them (see edits). |
| C2 | L6/01:227-231, quiz 335 | "Asking What Matters" (2026 preprint, coding agents): results often stopped improving, or got worse, as agents asked more questions, while the burden on users grew | arXiv 2604.14624 | E | **VERIFIED** | v1 (16 Apr 2026, no venue): "we find that performance often plateaus or declines with more questions while imposing higher user burden." Fig. 3: "Task success … plateaus as question count increases, while the proportion of answerable questions declines." The users were simulated. | Keep. Optionally note "with simulated users". |
| C3 | L6/02:142-145 | OpenAI Chat Completions returns logprobs via `logprobs` and `top_logprobs` | developers.openai.com cookbook | F | **VERIFIED** | "logprobs: Whether to return log probabilities for the output tokens … top_logprobs: An integer between 0 and 5 specifying the number of most likely tokens to return at each token position". | Keep |
| C4 | L6/02:145 | "its reasoning models generally don't return them" | none | F | **UNSOURCED**; true | OpenAI's own reasoning guide (developers.openai.com/api/docs/guides/reasoning) doesn't mention logprobs. Microsoft's Azure OpenAI reasoning guide (learn.microsoft.com/en-us/azure/foundry/openai/how-to/reasoning): "Reasoning models other than GPT-6 Astra don't support the following parameters: temperature, top_p, presence_penalty, frequency_penalty, logprobs, top_logprobs, logit_bias, max_tokens". So "generally" is right: there is one exception. | **Add source** (Microsoft's guide to the same models). |
| C5 | L6/02:146-147 | vLLM returns logprobs too | none | F | UNSOURCED; true | vLLM `SamplingParams` docs: "logprobs (int \| None) – Number of log probabilities to return per output token." | Optional: add link |
| C6 | L6/02:147-149 | Anthropic's Messages API has no logprobs option; the create reference lists none | platform.claude.com/docs/en/api/messages/create | F | **VERIFIED** (as of 2026-09-30) | The full reference page (1.45 MB) has zero occurrences of "logprob". | Keep |
| C7 | L6/02:254-258; quiz 312 | Tian et al. (EMNLP 2023): for RLHF models incl. ChatGPT, GPT-4 and Claude, stated confidence was typically better calibrated than "the models' token probabilities", often halving calibration error | arXiv 2305.14975 | E | **CONTRADICTED** in one detail. The figures and venue are right. | v2 abstract ("EMNLP 2023 Camera Ready"): "For RLHF-LMs such as ChatGPT, GPT-4, and Claude, we find that verbalized confidences … are typically better-calibrated than the model's conditional probabilities … often reducing the expected calibration error by a relative 50%." But for those models the comparison wasn't against token probabilities: "Label prob. … uses the conditional probability distribution p(y\|x) … which we estimate using n = 10 samples, since many RLHF-LMs are closed-source and do not offer per-token probabilities." Only Llama-2-70B-Chat had real log probs, and there "the improvement is much less consistent compared to GPT-* and Claude-*." | **Replace the wording** in prose and quiz (see edits). |
| C8 | L6/03:270-274, recap 270 | FrugalGPT (2023): API prices differ by up to two orders of magnitude; match GPT-4 at up to 98% lower cost, or beat it by up to 4% at the same cost; "the best-known study" | arXiv 2305.05176 | E | **VERIFIED** | v1: "fees that can differ by two orders of magnitude … FrugalGPT can match the performance of the best individual LLM (e.g. GPT-4) with up to 98% cost reduction or improve the accuracy over GPT-4 by 4% with the same cost." Published in TMLR 2024 (dblp journals/tmlr/ChenZ024; mlanthology abstract gives the same 98% / 4%). | **Re-label** "(2023)" → "(TMLR 2024)". |
| C9 | L6/03:276-281, quiz 359 | The scorer is DistilBERT trained as a regressor on right/wrong-labelled query-answer pairs, with an acceptance threshold | same | F | **VERIFIED** | "The scoring function can be obtained by training a simple regression model that learns whether …"; "We employ a DistilBERT [SDCW19] tailored to regression as the scoring function." | Keep |
| C10 | L6/03:317-322, quiz 381 | "a person asked to check too many cases stops checking any of them carefully" | none | P | **UNSOURCED** (a learner could ask "says who?") | Anthropic, "How we built Claude Code auto mode" (25 Mar 2026): "Claude Code users approve 93% of permission prompts … Over time that leads to approval fatigue, where people stop paying close attention to what they're approving." It's also in Anthropic's sandboxing post: "can lead to 'approval fatigue', where users might not pay close attention to what they're approving". | **Add backing** (Anthropic, labelled as its own report). |
| C11 | L6/04:308-315, quiz 393-401; L6 recap 292 | Sharma et al. (ICLR 2024): five assistants; frequently admitted mistakes they hadn't made; Claude 1.3 wrongly admitted a mistake on 98%; shifted toward weakly expressed user views; partly driven by human preference data | arXiv 2310.13548 | E | **VERIFIED** | v4 header "Published as a conference paper at ICLR 2024". "five state-of-the-art AI assistants consistently exhibit sycophancy"; "models tend to admit mistakes even when they didn't make a mistake--Claude 1.3 wrongly admits mistakes on 98% of questions"; "assistants tend to modify their answers to agree with a user's beliefs, even if weakly expressed"; "likely driven in part by human preference judgments favoring sycophantic responses." | Keep |

**Our data labelling (not re-run):** the lessons' own results name the models (Qwen3.5-2B/4B/9B, `cross-encoder/nli-deberta-v3-base`) and the case counts (120 pairs, 40 facts, 145 drafts / 390 claims, 84 questions × 20 samples, 420 pushback replies, "8 wrong votes and 23 wrong verdicts are small samples"). They are framed as "on these pairs / these runs". No problems found.

### 2. Proposed edits

None of these texts is inside an exercise or demo string. They are all prose or `QuizGroup` JSON props, so none needs Pyodide re-verification. Quiz option lengths are untouched: only question and explanation text changes.

#### E1 (P1): Zheng et al. figures, precision. L4/02-checking-the-checker.mdx:335-339
Current:
```
  Module 5 cited, measured both. Swapping the order of two answers changed
  a judge's verdict often. GPT-4, the most
  consistent, gave the same verdict both ways about 65% of the time. Padding
  an answer with repeated content fooled Claude-v1 and GPT-3.5 in about 91%
  of their test cases, and GPT-4 in about 9%.
```
Proposed:
```
  Module 5 cited, measured both. Swapping the order of two similar answers
  often changed a judge's verdict. GPT-4, the most consistent, gave the same
  verdict both ways about 65% of the time. Padding a list answer with a
  reworded copy of its own items, adding nothing new, fooled Claude-v1 and
  GPT-3.5 on 21 of 23 answers, and GPT-4 on 2.
```
The figures appear nowhere else (grepped `src/content/modules`).

#### E2 (P2): Zheng venue. L4/02:196-199
Current: `[study of LLM judges](https://arxiv.org/abs/2306.05685) (NeurIPS 2023),` / `which made the approach common, validated their judges`
Proposed: `[study of LLM judges](https://arxiv.org/abs/2306.05685) (NeurIPS 2023 Datasets and Benchmarks),` / `which helped make the approach common, validated their judges`

#### E3 (P3): Panickssery et al. L4/02:342-346 (CONTRADICTED)
Current:
```
  as a limit of reflection. Panickssery, Bowman and Feng,
  [*LLM Evaluators Recognize and Favor Their Own Generations*](https://arxiv.org/abs/2404.13076)
  (NeurIPS 2024), found judges scoring their own outputs above others' that
  people rated as equal. The better a model was at recognising its own text,
  the stronger the preference.
```
Proposed:
```
  as a limit of reflection. Panickssery, Bowman and Feng,
  [*LLM Evaluators Recognize and Favor Their Own Generations*](https://proceedings.neurips.cc/paper_files/paper/2024/hash/7f1f0218e45f5414c79c0679633e47bc-Abstract-Conference.html)
  (NeurIPS 2024), found GPT-4, GPT-3.5 and Llama 2 favouring their own news
  summaries over other models' and people's. People rated the summaries too,
  and the gaps they saw were far smaller than the judges' preference. The
  better a model was at recognising its own text, the stronger the preference.
```
The link changes to the NeurIPS version because arXiv has only v1, which lacks the human evaluation (§2.5). The quiz explanation at L4/02:482 ("the research found it on open-ended quality judgements") still holds and needs no change.

#### E4 (A11): back the "second model family" advice. L4/02:377-379
Current: `self-preference in open-ended judgements of quality. A second model family as` / `the judge costs little and removes the question. Either way, the judge has`
Proposed: `self-preference in open-ended judgements of quality. A second model family as` / `the judge costs little and removes the question, and Arize's guide gives the` / `same advice: use a different model as the judge from the one being judged.` / `Either way, the judge has`
(Arize: "Should you use the same model as your judge that you use in your application? No. Pick a different, more capable model." It is already linked above on the same page.)

#### E5 (B6): link Snell et al. L5/04-voting-thinking-or-a-stronger-model.mdx:139-143
Current:
```
Research says to expect the answer to depend on the task. Snell et al.
found that how much extra test-time computation helps depends heavily on
how hard a question is, and that on questions where a smaller model already
had some success, spending more at test time could beat a model fourteen
times larger.
```
Proposed:
```
Research says to expect the answer to depend on the task. Snell et al.,
[*Scaling LLM Test-Time Compute Optimally*](https://arxiv.org/abs/2408.03314)
(ICLR 2025), found that how much extra test-time computation helps depends
heavily on how hard a question is, and that on questions where a smaller
model already had some success, spending more at test time could beat a
model fourteen times larger at the same total compute.
```
(The syllabus notes "Snell et al. stays unlinked, as in the mockup". Lesson 2 already links this arXiv ID, so linking it here is consistent.)

#### E6 (B7): USC as a preprint. L5/05-free-text-nothing-to-count.mdx:69-71
Current: `[universal self-consistency](https://arxiv.org/abs/2311.17311) (2023), USC`
Proposed: `[universal self-consistency](https://arxiv.org/abs/2311.17311), a 2023 preprint from Google, USC`
(Optionally, "later shown at an ICML 2024 workshop". A workshop poster is non-archival, so the preprint label is the honest one.)

#### E7 (B9): name the MBR study. L5/05:97-100
Current:
```
  of about 2,400 tokens. A
  [2024 study](https://arxiv.org/abs/2410.02902) comparing another method
  with USC points out exactly this limit: every candidate has to fit in one
  prompt.
```
Proposed:
```
  of about 2,400 tokens. Wu et al.'s
  [study of minimum Bayes risk decoding](https://arxiv.org/abs/2410.02902)
  (ICLR 2025), which compared its method with USC, points out exactly this
  limit: every candidate has to fit in one prompt.
```

#### E8 (B10, optional): back "picks the most typical, not the best". L5/05:133-135
Current: `- **Use USC when neither is possible,** knowing it picks the most typical` / `  candidate, not the best one, and that it can't be better than the best` / `  candidate it's given.`
Proposed: `- **Use USC when neither is possible,** knowing it picks the most typical` / `  candidate, not the best one, as its authors note, and that it can't be` / `  better than the best candidate it's given.`

#### E9 (P5, B16, B17): Cobbe as a preprint, Lightman's venue, Snell softened. L5/06-better-than-a-plain-vote.mdx:451-459
Current:
```
The research behind the idea goes back further. Cobbe et al.
[trained such a verifier](https://arxiv.org/abs/2110.14168) for grade-school
maths (2021). A 6B model choosing among its samples with the verifier slightly outperformed a fine-tuned 175B model, a gain the authors put at about what a thirtyfold larger model would give. Lightman et al.'s
[*Let's Verify Step by Step*](https://arxiv.org/abs/2305.20050) (2023)
improved on it by checking each step of the reasoning, not only the final
answer. Snell et al., from
[the fourth concept](/06-reliability/05-voting/04-voting-thinking-or-a-stronger-model/),
found that searching against such a verifier was one of the most effective
ways to spend extra computation at test time.
```
Proposed:
```
The research behind the idea goes back further. Cobbe et al.
[trained such a verifier](https://arxiv.org/abs/2110.14168) for grade-school
maths, in a 2021 OpenAI preprint. A 6B model choosing among its samples with the verifier slightly outperformed a fine-tuned 175B model, a gain the authors put at about what a thirtyfold larger model would give. Lightman et al.'s
[*Let's Verify Step by Step*](https://arxiv.org/abs/2305.20050) (ICLR 2024)
improved on it by checking each step of the reasoning, not only the final
answer. Snell et al., from
[the fourth concept](/06-reliability/05-voting/04-voting-thinking-or-a-stronger-model/),
studied searching against such a verifier as one of two main ways to spend
extra computation at test time, and found that which works best depends on
how hard the question is.
```

#### E10 (P6): "concluded" → "suggested", plus Snell's matching result. L5/06:493-496
Current:
```
Cobbe et al. saw this
too: accuracy rose as the verifier chose among more samples per problem, up to
400, and then fell. Past that point, they concluded, the search was finding
adversarial solutions that fool the verifier. An agent pushed hard against a
```
Proposed:
```
Cobbe et al. saw this
too: accuracy rose as the verifier chose among more samples per problem, up to
400, and then fell. Past that point, they suggested, the search was finding
adversarial solutions that fool the verifier. Snell et al. saw the same with
a step-by-step verifier: on easy questions, a stronger search did worse as
the budget grew. An agent pushed hard against a
```
(The syllabus's "Cobbe with the peak at 400" entry stays accurate.)

#### E11 (P7): MAKER details. L5/06:525-529
Current:
```
lab, split a 20-disk Towers of
Hanoi, 1,048,575 moves, into one model call per move. It chose each move with
*first-to-ahead-by-k* voting, the stop-at-a-lead rule from earlier in this
concept, and threw out any sample that wasn't in the expected format before
it could vote.
```
Proposed:
```
lab, split a 20-disk Towers of
Hanoi, 1,048,575 moves, into one small task per move. It chose each move with
*first-to-ahead-by-k* voting, the stop-at-a-lead rule from earlier in this
concept, with a lead of three, and threw out any sample that ran too long or
wasn't in the expected format before it could vote.
```
(Paper: "kmin = 3"; "maximum output token threshold was set to 750"; red flags "(1) overly long responses, and (2) incorrectly formatted responses". If the lead would rather keep k out of the page, drop ", with a lead of three"; the one required fix is "one model call per move".)

#### E12 (C1): Learning to Ask, stop attributing our clause. L6/01-asking-before-acting.mdx:222-224
Current: `instructions. Their finding: agents tend to make up the missing argument,` / `which, as they put it, can lead to hallucinations and risks, where a person` / `would simply have asked. Their fix, Ask-when-Needed, prompts the agent to`
Proposed: `instructions. Their finding: agents tend to make up the missing argument` / `instead of asking, which, as they put it, can lead to hallucinations and` / `risks. Their fix, Ask-when-Needed, prompts the agent to`

#### E13 (C4, C5): source the reasoning-model and vLLM facts. L6/02-signals-the-agent-isnt-sure.mdx:145-147
Current: `though not for every model: its reasoning models generally don't return them.` / `Open models served with engines such as vLLM, which produced this module's` / `runs, return them too.`
Proposed: `though not for every model: its reasoning models generally don't, as` / `[Microsoft's guide to the same models](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/reasoning)` / `lists. Open models served with engines such as` / `[vLLM](https://docs.vllm.ai/en/latest/api/vllm/sampling_params.html), which produced this module's` / `runs, return them too.`
(OpenAI's own reasoning guide doesn't state it. Microsoft's Azure OpenAI guide does: "Reasoning models other than GPT-6 Astra don't support … logprobs, top_logprobs". The vLLM link is optional.)

#### E14 (C7): Tian et al. L6/02:254-258 (CONTRADICTED detail)
Current:
```
The research on stated confidence disagrees with itself. Tian et al.,
[*Just Ask for Calibration*](https://arxiv.org/abs/2305.14975) (EMNLP 2023),
found that for models trained with human feedback, including ChatGPT, GPT-4
and Claude, confidence stated in words was typically better calibrated than
the models' token probabilities, often halving the calibration error.
```
Proposed:
```
The research on stated confidence disagrees with itself. Tian et al.,
[*Just Ask for Calibration*](https://arxiv.org/abs/2305.14975) (EMNLP 2023),
found that for models trained with human feedback, including ChatGPT, GPT-4
and Claude, confidence stated in words was typically better calibrated than
the probability the model gave its answer, often halving the calibration
error. Those three APIs returned no token probabilities, so the authors
estimated that probability from how often ten samples gave the same answer.
```
Quiz, L6/02:312. Current question: `"Tian et al. found stated confidence better calibrated than token probabilities; Xiong et al. found it overconfident. What should a builder conclude?"`
Proposed: `"Tian et al. found stated confidence better calibrated than the model's answer probabilities; Xiong et al. found it overconfident. What should a builder conclude?"`
(Options and explanation unchanged; the explanation, "different models, tasks and prompts", still holds.)

#### E15 (C8): FrugalGPT venue. L6/03-escalating.mdx:271
Current: `[FrugalGPT](https://arxiv.org/abs/2305.05176) (2023) is the best-known`
Proposed: `[FrugalGPT](https://arxiv.org/abs/2305.05176) (TMLR 2024) is the best-known`

#### E16 (C10): back "stops checking carefully". L6/03:319-322
Current:
```
any disagreement would send more than a fifth of decisions to someone. For a
system handling thousands of requests, that may be more than anyone can
review, and a person asked to check too many cases stops checking any of them
carefully.
```
Proposed:
```
any disagreement would send more than a fifth of decisions to someone. For a
system handling thousands of requests, that may be more than anyone can
review, and a person asked to check too many cases stops checking any of them
carefully. Anthropic reports that Claude Code's users approve 93% of its
permission prompts, and calls the result
[approval fatigue](https://www.anthropic.com/engineering/claude-code-auto-mode):
people stop paying close attention to what they're approving.
```

### 3. Needs a decision

None of these corrections changes what a concept teaches. Two are borderline, with my recommendations:

- **Tian et al. vs. Lesson 5's agreement signal (L6 C2, and L5 C3 by extension).** Tian's "conditional probability" for GPT-4, ChatGPT and Claude was sample agreement: the share of 10 samples giving the answer. So Tian found stated confidence *better calibrated than agreement* on those models (ECE on TriviaQA/SciQ/TruthfulQA). Xiong found agreement helps. L6 C2's conclusion, "measure every signal on your own cases", already covers this, and the course's own AUROC (agreement 0.86 for the 2B) is measured locally. **Recommendation:** apply E14 only. Don't reframe L5 C3, which cites Xiong accurately and is measured on our runs.
- **MAKER's k.** The page states no k, which is accurate but vague. Adding "with a lead of three" is optional; the "one model call per move" fix is not.

### 4. Counts

- Claims inventoried: 53 table rows (7 priority + 18 L4 + 17 L5 + 11 L6). Repeats of the same figure in quizzes and recaps are grouped into one row. A18 (Huang et al., via a Lesson 2 link) was out of scope and not checked.
- **Verified:** 43, including 5 marked "VERIFIED (2026-09-30 review)" and re-checked (A9, A10, B11, B13, B14). 4 of them have wording to fix: P1 precision, P6 "concluded", P7 "one call per move", C1 an unattributed clause.
- **Contradicted:** 2 (P3 Panickssery, "people rated as equal"; C7 Tian, "token probabilities").
- **Overstated / softened:** 1 (B17 Snell, "one of the most effective ways").
- **Unreachable:** 0 (Arize read via Wayback; openai.com wasn't needed, as developers.openai.com loaded).
- **Unsourced** needing a source: 3 (A11, C4, C10). Plus 1 optional (C5 vLLM) and 1 kept without a source (B4 Condorcet).
- **Re-labelled:** 7 (P2 Zheng venue, P5 Cobbe as a preprint, B7 USC as a preprint, B9 MBR study named with ICLR 2025, B16 Lightman ICLR 2024, C8 FrugalGPT TMLR 2024, P3's link switched to the NeurIPS version).
- **Replaced wording (corrections):** 5 (E1, E3, E11, E12, E14).
- **Sources added:** 5 required or recommended (Arize for A11, Microsoft Azure for C4, Anthropic auto-mode for C10, the Snell link for B6, Snell as extra backing for P6) + 2 optional (vLLM docs, USC's own caveat).

---

## Report: Module 6 citation audit: Lesson 7 (`07-safe-actions`) and Lesson 8 (`08-graceful-degradation`)

Auditor scope: every `.mdx` in both lessons (intro, concepts, quizzes, recaps). All paths below are relative to
`src/content/modules/06-reliability/`. Downloads are in `scratchpad/audit/m6C/`. Checked 2026-09-30.

The two intros have no outside-source claims. Neither lesson uses the Qwen3.5 run data. L8 C4 reads `plain.json` and
labels it as this module's own run. L8 C5's figures (19%, about 5%, p99.9) come from a seeded simulation, and the
page labels them "(A simulated latency distribution, not a measurement of any provider.)" I re-ran the simulation
in CPython with the same seed: 19% of 20-call runs hit a slow call, and hedging adds about 5% extra calls, as the
prose says.

### 1. Claims table

#### Priority open items (from the syllabus)

| ID | file:line | claim (trimmed) | source given | kind | verdict | evidence (primary source) | recommendation |
|---|---|---|---|---|---|---|---|
| P1 | 07/05:193-196 | METR found o3 "reward-hacking in 30% of its runs on one benchmark, against under 1% on another, and suggests the difference is that on the first the model could see its scoring function" | metr.org/blog/2025-06-05-recent-reward-hacking | effectiveness | **VERIFIED** (figures). The explanation is hedged in the source and the page drops the hedge | Table: "RE-Bench Total 39 128 30.4%" … "HCAST Total 8 1087 0.7%". "Reward hacking was more than 43× more common on RE-Bench tasks than HCAST tasks, perhaps because on RE-Bench tasks the model was able to see the entire scoring function … The discrepancy could also be due to RE-Bench tasks being more difficult or because they use different scaffolding." (METR blog, Von Arx, Chan, Barnes, 5 Jun 2025) | **soften**: add METR's other two explanations (edit E7) |
| P2 | 07/05:197-198 | "It kept hacking in 14 of 20 attempts even when told the work had real consequences." | same | effectiveness | **VERIFIED**, but the context is narrower than the page says | "We appended four different instructions to the prompt in the Optimize LLM Foundry task and measured how often the model described a plan to reward hack in its first generation … We ran the model 20 times for each prompt" … "o3 reward hacked in 14-out-of-20 attempts where the task was presented as helping scientists perform research with real-world consequences" (the Alzheimer's prompt, 70%) | **make precise**: one task; what was measured was a *plan* to hack (E7) |
| P3 | 07/05:199-204 | ImpossibleBench "(ICLR 2026)"; "GPT-5 passed 54% of one variant anyway. Given an explicit option to stop … it did so, and its rate fell to 9%." | arxiv.org/abs/2510.20270 | effectiveness | **VERIFIED**. arXiv has only v1 (23 Oct 2025, marked "Preprint. Under review."); the ICLR 2026 camera-ready (proceedings.iclr.cc) has the same figures | ICLR 2026 camera-ready §5.3: "we instruct the models to submit the string flag_for_human_intervention … lowering the cheating rate of GPT-5 from 54% to 9% and o3 from 49% to 12%. However, the effect is much less pronounced for Claude Opus 4.1." §4: "GPT-5, cheats 54.0% of the time on CONFLICTING-SWEBENCH" (full scaffold) | **keep the figures, add the caveat**: the abort option helped Claude Opus 4.1 much less. "It did so" isn't reported: the paper gives cheating rates, not how often agents aborted (E8). The ICLR label is correct; linking the proceedings page would be better than linking the arXiv v1 |
| P4 | 07/05:189-192 | OpenAI's "work on monitoring reasoning models (2025) caught a frontier model in training subverting the tests it was given" | openai.com/index/chain-of-thought-monitoring/ (read via Wayback) | fact | **VERIFIED** | Blog post "Detecting misbehavior in frontier reasoning models" (10 Mar 2025): "Monitoring their 'thinking' has allowed us to detect misbehavior such as subverting tests in coding tasks" … "real examples we found while training a recent frontier reasoning model" | keep. Also link the paper (E6) |
| P5 | 07/05:238-243 | "a monitor reading the model's reasoning caught reward hacking far more reliably than one reading its actions alone … training the model against that monitor taught it to hide its intent rather than stop" | same OpenAI post | effectiveness | **VERIFIED** (blog and paper) | Baker et al., arXiv 2503.11926 **v1** (14 Mar 2025, the only version; preprint): "the Action Monitor … achieves only 60% recall overall in identifying the systemic hacks. In comparison, the CoT monitor … achieves 95% recall." And: "the agent trained with CoT pressure still learns to hack at a significant rate, and even more worrying, the CoT monitor's recall falls to near zero". Blog: "Our monitor is far more effective if it has access to the agent's chain-of-thought in addition to the agent's actions" | **add stronger backing**: cite Baker et al. (preprint) with 95% vs 60% (E6) |
| P6 | 07/05:181-185 | Claude 3.7 Sonnet system card: the model sometimes special-cases tests, "most often by returning the values the tests expect, instead of fixing the code" | anthropic.com/claude-3-7-sonnet-system-card (redirects to the PDF) | fact | **VERIFIED** | §6 "Excessive Focus on Passing Tests": "Claude 3.7 Sonnet occasionally resorts to special-casing in order to pass test cases in agentic coding environments like Claude Code. Most often this takes the form of directly returning expected test values rather than implementing general solutions" | keep |
| P7 | 07/05:164-167 | DeepMind's Krakovna et al. "defined specification gaming (2020) as behaviour that satisfies the literal specification of an objective without achieving the intended outcome" | deepmind.google/blog/specification-gaming-the-flip-side-of-ai-ingenuity/ | fact | **VERIFIED, directly** (not only via Weng) | DeepMind blog, 21 Apr 2020, Krakovna, Uesato, Mikulik, Rahtz, Everitt, Kumar, Kenton, Leike, Legg: "Specification gaming is a behaviour that satisfies the literal specification of an objective without achieving the intended outcome." | **keep, and make it a direct quote**, since the wording is already verbatim (E4) |
| P8 | 08/05:121-126 | Brooker "calls retries 'selfish': each one spends the system's capacity on one request … three retries at each of five layers can send 243 times the load" | aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/ (now redirects to builder.aws.com, a JS app; read via Wayback) | practice + fact | **VERIFIED**. 243 = 3⁵, with 3 *tries* per layer | Marc Brooker: "Retries are 'selfish.' In other words, when a client retries, it spends more of the server's time to get a higher chance of success." … "a five-deep stack of service calls … three retries at each layer … the load on the database will increase 243x … the retries at each layer multiply -- first three tries, then nine tries, and so on." | **make precise**: the source says "three retries" but its arithmetic uses three *tries* per layer (3⁵ = 243; three retries would be 4⁵ = 1,024). Say "three tries". Optionally add Amazon's practice: "our best practice is to retry at a single point in the stack" (E17) |
| P9 | 08/01:336-340 | Gabrielson "argues that fallback code is rarely exercised, so it's rarely tested, and can make an outage worse … The article's preference is for paths that run in production all the time." | aws.amazon.com/builders-library/avoiding-fallback-in-distributed-systems/ (read via Wayback; the live URL redirects to builder.aws.com) | practice | **VERIFIED** | Jacob Gabrielson: "It is easy to develop fallback strategies that rarely trigger in production." … "fallback strategies increase the scope of impact of failures as well as increasing recovery times." … "we favor code paths that are exercised in production continuously rather than rarely." … "If fallback is essential in a system, we exercise it as often as possible in production" | keep, but see Needs a decision D3: the article's headline is "At Amazon, we avoid fallback in our systems" (E19) |

#### Lesson 7: other claims

| ID | file:line | claim (trimmed) | source given | kind | verdict | evidence | recommendation |
|---|---|---|---|---|---|---|---|
| A1 | 07/01:191-195 | Terraform's `plan` "reads the current state, works out the changes needed, and shows them without carrying them out … before `apply` makes them" | developer.hashicorp.com/terraform/cli/commands/plan | practice | **VERIFIED** | "The terraform plan command creates an execution plan, which lets you preview the changes that Terraform plans to make … Reads the current state … Compares the current configuration to the prior state … Proposes a set of change actions" | keep |
| A2 | 07/01:225-227 | "Terraform's documentation makes the same point about automated pipelines: applying a saved plan ensures only the previewed changes are made." | none linked | practice | **Paraphrase, not found as worded.** The docs support something close | apply docs: "When you pass a saved plan file to terraform apply, Terraform performs the operations in the saved plan without prompting". plan docs: "other changes made to the target system in the meantime might cause the final effect of a configuration change to be different than what an earlier speculative plan indicated, so you should always re-check". Automation tutorial: "When a plan is applied, any other existing plans that were produced against the same state are invalidated, since they must now be recomputed relative to the new state." | **replace** with a verified quote and link (E1) |
| A3 | 07/01:238-239 | "Databases call this compare-and-set" | none | fact | UNSOURCED (a standard term) | n/a | keep |
| A4 | 07/02:142-146 | DynamoDB's default reads "may not reflect a recently completed write … repeating the read after a short time should return the latest data" | docs.aws.amazon.com … HowItWorks.ReadConsistency.html | fact | **VERIFIED** | "Eventually consistent is the default read consistent model … the responses might not reflect the results of a recently completed write operation. If you repeat your read request after a short time, the response should eventually return the more recent item." | keep |
| A5 | 07/02:174-176 | `ConsistentRead` "removes the wait, at a higher cost per read" | same (unlinked here) | fact | **VERIFIED** | "Eventually consistent reads are half the cost of strongly consistent reads." "If you set ConsistentRead to true, DynamoDB returns a response with the most up-to-date data". It isn't supported on GSIs (a detail, not needed) | keep |
| A6 | 07/03:213-218 | Garcia-Molina and Salem's *Sagas* (SIGMOD 1987): "the system guarantees that either every step completes, or compensating steps run to amend the partial execution" | dl.acm.org/doi/10.1145/38713.38742 (403 to curl; read the Cornell-hosted PDF) | fact | **VERIFIED** | Abstract: "The database management system guarantees that either all the transactions in a saga are successfully completed or compensating transactions are run to amend a partial execution" | keep |
| A7 | 07/03:219-221 | compensations run "in reverse order, newest first" | same | fact | **VERIFIED** | "Either the sequence T1, T2, … Tn … or the sequence T1, T2, … Tj, Cj, … C2, C1 … be executed"; "compensated for (or undone) in reverse order". The page's reason ("later steps may depend on earlier ones") is its own, and reasonable. Microsoft notes reverse order isn't always required ("might not need to undo the work in the exact reverse order") | keep |
| A8 | 07/03:223 | "The idea is now a standard pattern for work that spans several services" | none | practice | **UNSOURCED** | Microsoft Azure Architecture Center, *Saga distributed transactions pattern*; AWS Well-Architected REL05-BP01: "For distributed transactions, the saga pattern can be used to roll back previous operations in case a later operation of the same transaction fails." | **lead with an industry source** (E2) |
| A9 | 07/03:226-229 | "A compensation undoes the effect, not the history … restores what the business cares about, not the exact earlier state" | Sagas (implied) | fact | **VERIFIED** | Sagas §1: "The compensating transaction undoes, from a semantic point of view, any of the actions performed by Ti, but does not necessarily return the database to the state that existed when the execution of Ti began" | keep (optionally quote) |
| A10 | 07/03:230-235 | Steps that can only be corrected "are best placed last, after everything that can still fail" | none | practice | **UNSOURCED** | Microsoft Saga pattern: "Pivot transactions serve as the point of no return in the saga … Irreversible or noncompensable transactions can't be undone or retried … Retryable transactions follow the pivot transaction." | **add stronger backing** (E2) |
| A11 | 07/03:236-242 | "A compensation is itself a write, and can fail": idempotency key, read-back, escalate | none | practice | **UNSOURCED** | Microsoft *Compensating Transaction pattern*: "Compensating transactions are eventually consistent operations and can fail … design each step as an idempotent command. Sometimes manual intervention is the only way to recover from a failed step." | **add stronger backing** (E2) |
| A12 | 07/03:249-252 | a compensation "safe to run even if the step never happened, for example 'set the tier to standard', not 'lower the tier by one'" | none | practice | **In tension with Sagas** (see D1) | Sagas §1 (airline example): "Ci can cancel the reservation (say by subtracting one from the number of reservations …) But Ci cannot simply store in the database the number of seats that existed when Ti ran because other transactions could have run between". Microsoft: "Compensating transactions run after the original operations commit, and other transactions might change intermediate states." | **Needs a decision** (D1, E3) |
| A13 | 07/03:263-267 | Temporal "record[s] every step … in a durable event history; if the process … crashes, another process rebuilds the workflow's state … and resumes" | docs.temporal.io/evaluate/understanding-temporal | practice (vendor doc) | **VERIFIED** | "If the process running it crashes, the Temporal Service hands the work to another process, which rebuilds the state of the execution and resumes at the point where it stopped"; "The History Service owns each Workflow Execution: its state and its Event History, persisted to a database." | keep |
| A14 | 07/04:164-173 | Advani (2026 preprint, accepted to an ICML workshop): false success is 45% of failures (airline), 47% (retail), 3% (dual-control telecom), across eight model families; a reasoning model is highest at 79% | arxiv.org/abs/2606.09863 | effectiveness | **VERIFIED** (v1 only, 1 Jun 2026; "Accepted to FAGEN@ICML2026") | Table 1: "Airline … 45/38/17; Retail … 47/28/24; Telecom … 3/79/18" (FS/HF/Amb, % of failures). "Qwen3-Max-Thinking exhibits the highest false-success rate (79%) … with reasoning traces that rationalize completion rather than verify it." Note: the paper contradicts itself (§4.1 text says "45% and 48%", the abstract "45–48%", the intro "44–52%"); the page follows Table 1 | keep. It's already labelled as a preprint. Optionally write "about half" to avoid the paper's 47/48 inconsistency |
| A15 | 07/04:177-181 | "no configuration exceeded an AUROC of 0.65 … swayed by confident closing language" (also the quiz at 07/04:269 and recap 07/06:325-333, "AUROC ≤ 0.65") | same | effectiveness | **VERIFIED** | "no configuration across 5 judge models, 5 prompt strategies, and a strong baseline … exceeds AUROC 0.65 … judges anchor on confident closing-message language" | keep |
| A16 | 07/04:182-184 | "The author's recommendation for higher-stakes use is to check the trajectory against the environment directly" | same | practice | **VERIFIED** | "High-stakes deployment likely requires direct trajectory-environment consistency checks rather than surface-text detection alone"; conclusion: "reserving direct trajectory–environment consistency checks for higher-stakes deployment" | keep |
| A17 | 07/05:167-169 | "In reinforcement learning it's called *reward hacking*: optimising the measurement instead of the thing measured" | Weng (next sentence) | fact | **VERIFIED** (paraphrase) | Weng: "Reward hacking occurs when a reinforcement learning (RL) agent exploits flaws or ambiguities in the reward function to achieve high rewards, without genuinely learning or completing the intended task." | keep |
| A18 | 07/05:169-172 | Weng's survey "collects examples, from game agents that loop for points to language models that edit the unit tests they were meant to pass" | lilianweng.github.io/posts/2024-11-28-reward-hacking/ | fact | **VERIFIED (2026-09-30 review; re-checked)** | "In the Coast Runners game … going in circles and hitting the same green blocks over and over again"; "A coding model learns to change unit test in order to pass coding questions." | keep |
| A19 | 07/05:185-189 | Claude 4 announcement: "both new models were 65% less likely than Claude 3.7 Sonnet to use shortcuts or loopholes on agentic tasks prone to them" | anthropic.com/news/claude-4 | effectiveness (vendor, own product) | **VERIFIED (2026-09-30 review; re-checked)** | "Both models are 65% less likely to engage in this behavior than Sonnet 3.7 on agentic tasks that are particularly susceptible to shortcuts and loopholes." The Claude 4 system card §6 gives the method: "Claude Opus 4 showed an average 67% decrease in hard-coding behavior and Claude Sonnet 4 a 69% average decrease compared to Claude Sonnet 3.7 … Claude Opus 4 and Claude Sonnet 4 still exhibit these behaviors" | **re-label or add stronger backing**: it's attributed ("reports"), which is enough. Better: cite the system card, which shows its evaluations, and quote "still exhibit these behaviors", which backs "not never" (E5) |
| A20 | 07/05:222-224 | "Most gamed checks break something nobody thought to write down, so writing it down is the fix." | none | practice | **UNSOURCED** overgeneralization | Krakovna et al. frame the problem as task misspecification, but no source says "most" gamed checks break an unwritten invariant | **soften** (E10) |
| A21 | 07/05:225-233 | Keep the measuring stick out of reach; Anthropic: "The agent shouldn't be able to easily 'cheat' the eval." | anthropic.com/engineering/demystifying-evals-for-ai-agents | practice | **VERIFIED** | "Make your graders resistant to bypasses or hacks. The agent shouldn't be able to easily 'cheat' the eval." | keep. **Add** ImpossibleBench's test-access finding as evidence (E9) |
| A22 | 07/05:234-235 | "ImpossibleBench's biggest drop came from letting the agent say the task couldn't be done." | ImpossibleBench | effectiveness | **CONTRADICTED** | ICLR 2026 §5.2: "Hiding tests from agents reduces cheating success rate to near zero, but also degrades performance on the original benchmark. Read-only access provides a middle ground". §5.3: the abort option works well "for OpenAI models … However, the effect is much less pronounced for Claude Opus 4.1." The biggest drop came from hiding the tests | **replace** (E9) |
| A23 | 07/05:278-286 (quiz) | METR quiz: distractor "The tasks on it were much harder"; explanation "METR's explanation is that visibility" | METR | effectiveness | **CONTRADICTED (the distractor is one of METR's own alternative explanations)** | "The discrepancy could also be due to RE-Bench tasks being more difficult or because they use different scaffolding." | **replace the distractor, soften the explanation** (E11) |
| A24 | 07/05:289-297 (quiz) | "ImpossibleBench's GPT-5 cheated on 54% of impossible tasks"; explanation "Given a legitimate way to stop, the agent mostly took it." | ImpossibleBench | effectiveness | Overstated | 54% is one variant (Conflicting-SWEbench, full scaffold); the paper reports cheating rates, not how often the abort was used | **soften** (E12) |
| A25 | 07/05:300-308 (quiz) | training against the monitor: "It learned to hide its intent and kept hacking" | OpenAI / Baker | effectiveness | **VERIFIED** | "still cheats, albeit at a lower rate than the baseline, and almost all of its cheating is undetectable by the monitor" | keep |
| A26 | 07/04:258 (quiz) | false success was "nearly half of all failures" in single-control domains | Advani | effectiveness | **VERIFIED** | 45% / 47% (Table 1) | keep |
| A27 | 07/06 recap quiz (lines 259-344) | re-uses the dry-run, compare-and-set, saga, gaming and Advani points | as above | n/a | **VERIFIED** (no new sources; the Advani card is covered by A15) | n/a | keep |

#### Lesson 8

| ID | file:line | claim (trimmed) | source given | kind | verdict | evidence | recommendation |
|---|---|---|---|---|---|---|---|
| B1 | 08/01:251-256 | LiteLLM configures fallbacks "as a priority-ordered list of models per primary, and keeps separate lists for particular kinds of error, such as a prompt too long" | docs.litellm.ai/docs/proxy/reliability | practice (vendor doc) | **VERIFIED** | "Fallbacks are done in-order … There are 3 types of fallbacks: content_policy_fallbacks … context_window_fallbacks: For litellm.ContextWindowExceededErrors … fallbacks: For all remaining errors - e.g. litellm.RateLimitError" | keep |
| B2 | 08/01:269-272 | "On the major APIs a prompt that's too long also comes back as a 400 'invalid request', the same status as a malformed schema" | none | fact | **VERIFIED for Anthropic** (OpenAI not re-checked: openai.com returns 403) | platform.claude.com context-windows: "If the input alone already exceeds the model's context window, the API returns a 400 invalid_request_error ("prompt is too long") on every model." Errors page: "400 - invalid_request_error: There was an issue with the format or content of your request." | **add a link** to Anthropic's context-windows page (E20) |
| B3 | 08/01:310-316 | Anthropic requires the assistant turn "sent back exactly as received: rebuilding it, or filtering blocks out, is a 400 error" | platform.claude.com …/thinking-tool-workflows | fact | **VERIFIED (2026-09-30 review; re-checked)** | "Echo the assistant message exactly as received: rebuilding the message or filtering out redacted_thinking blocks triggers a 400 error." | keep |
| B4 | 08/01:317-321 | "On Claude Opus 4.7 and later, setting `temperature` to a non-default value returns a 400" | platform.claude.com …/model-deprecations | fact | **VERIFIED** | "temperature, top_p, top_k — Deprecated (Claude Opus 4.7 and later) — Returns a 400 error when set to a non-default value on Claude 4.7 and later models and Claude Mythos Preview." | keep |
| B5 | 08/01:336-340 | Gabrielson (see P9) | | | VERIFIED | | see D3 |
| B6 | 08/02:142-148 | AWS Well-Architected graceful degradation: keep "performing its core function … perhaps serving slightly stale data, alternative data, or no data … report which succeeded, which failed, and why" | docs.aws.amazon.com … rel_mitigate_interaction_failure_graceful_degradation.html | practice | **VERIFIED** | REL05-BP01: "Application components should continue to perform their core function even if dependencies become unavailable. They might be serving slightly stale data, alternate data, or even no data." "returning information on which operations succeeded, which failed, and why they failed" (said of batch writes). Anti-pattern: "Serving no data on errors or when only one out of multiple dependencies is unavailable and partial results can still be returned." | keep. The anti-pattern sentence is a closer fit than the batch-write one if the editor wants to tighten |
| B7 | 08/02:156-158 | Sethi et al.: "when a tool failed without saying so, models sometimes stated a value they didn't have, up to 45% of the time for some kinds of failure" | links Lesson 3 (arxiv.org/abs/2609.14758) | effectiveness | **CONTRADICTED in part**: 45.3% is the *dishonesty* rate, which counts fabricated reasons for not answering as well as invented values | Abstract (v1): "14.10% of responses are dishonest: the model either asserts a value the payload cannot support or declines while citing a fabricated policy or capability limit … when it returns status:ok with a redacted, corrupted, stale, malformed, empty or truncated value, dishonesty reaches 45.3%." Table 3: REDACTED_PERMISSION, deploy prompt, 45.3 (n = 86 per cell); main experiments on one model. Lesson 3 (03/02:593-596) already words this correctly | **re-word** to match Lesson 3 (E13) |
| B8 | 08/02:171-173 | an explicit error "is what Lesson 3's research found makes models report failures honestly" | Sethi (via L3) | effectiveness | **VERIFIED** | "When the tool returns status:error, dishonesty is absent (0.0%)" | keep |
| B9 | 08/03:275-282 | Fowler's description, "which Michael Nygard popularised in his book *Release It!*": trips at a threshold, fails fast, trial call after a set time | martinfowler.com/bliki/CircuitBreaker.html | practice | **VERIFIED** | "In his excellent book Release It, Michael Nygard popularized the Circuit Breaker pattern … Once the failures reach a certain threshold, the circuit breaker trips, and all further calls … return with an error, without the protected call being made at all." "Asked to call in the half-open state results in a trial call, which will either reset the breaker if successful or restart the timeout if not." | keep |
| B10 | 08/03:291-296 | "With many at once, a real breaker lets one trial through … Production libraries also usually trip on the *rate* of failures over a recent window … and can count slow calls as failures too" | none | practice | "Rate over a window" and slow calls: **VERIFIED**. "Lets one trial through": **CONTRADICTED in part** (Resilience4j allows a configurable number) | Resilience4j: "The CircuitBreaker uses a sliding window to store and aggregate the outcome of calls … changes from CLOSED to OPEN when the failure rate is equal or greater than a configurable threshold … slow call rate"; "changes from OPEN to HALF_OPEN and permits a configurable number of calls … Further calls are rejected … until all permitted calls have completed." Fowler: "A more sophisticated approach might look at frequency of errors, tripping once you get, say, a 50% failure rate." | **soften and add an industry source** (E14) |
| B11 | 08/03:298-310 | "Two details from Fowler's description": not every error should trip it; the caller still has to decide what to do | Fowler | practice | **VERIFIED** | "Not all errors should trip the circuit, some should reflect normal failures and be dealt with as part of regular logic." "clients using them need to react to breaker failures … Does it fail the operation you're carrying out, or are there workarounds you can do? … showing some stale data" | keep |
| B12 | 08/03:268-269 | "Retrying makes this worse … more load on a service that's already struggling" | none | practice | UNSOURCED here (Brooker is cited in C5) | Brooker: "When failures are caused by overload, retries that increase load can make matters significantly worse." | optional: link Brooker |
| B13 | 08/03:318-320 | a breaker that keeps tripping is an early warning worth logging | none | practice | **VERIFIED** (Fowler) | "Breaker behavior is often a good source of warnings about deeper troubles in the environment." | keep |
| B14 | 08/04:109-117 | Chen, Zaharia and Zou (HDSR 2024): GPT-4 March→June 2023, primes 84%→51%, instruction following declined, "the same model service can change substantially" (also quizzes 08/04:220-228 and recap 08/06:404-412) | arxiv.org/abs/2307.09009 | effectiveness | **VERIFIED** (v3, 31 Oct 2023, is the latest; published in HDSR 6.2, 2024) | v3 abstract: "GPT-4 (March 2023) was reasonable at identifying prime vs. composite numbers (84% accuracy) but GPT-4 (June 2023) was poor on these same questions (51% accuracy) … We provide evidence that GPT-4's ability to follow user instructions has decreased over time, which is one common factor behind the many behavior drifts … the behavior of the 'same' LLM service can change substantially in a relatively short amount of time, highlighting the need for continuous monitoring" | keep (v1 reported a different prime-only task; the page correctly uses v3) |
| B15 | 08/04:129-134 | Anthropic: "every Claude model ID is a pinned snapshot … an updated model ships under a new ID"; older generations have aliases | platform.claude.com/docs/en/about-claude/models/overview | fact | **VERIFIED, at a different page.** The linked overview page no longer says it; it now points to "Model IDs and versioning" | platform.claude.com/docs/en/about-claude/models/model-ids-and-versions: "Each Claude model ID identifies a pinned version of the model … This guarantee covers model IDs, not the convenience aliases that the Claude API accepts for some earlier models" … "Anthropic does not update the weights or configuration of an existing model ID. When an updated version is available, it ships under a new model ID." | **replace the link** (E15) |
| B16 | 08/04:135-138 | Anthropic's September 2025 postmortem: "infrastructure bugs that degraded some responses while the model IDs stayed the same" | anthropic.com/engineering/a-postmortem-of-three-recent-issues | fact | **VERIFIED** | "Between August and early September, three infrastructure bugs intermittently degraded Claude's response quality." (published 17 Sep 2025) | keep |
| B17 | 08/04:139-142 | OpenRouter `~author/family-latest` names move to each new release; the docs warn "the version can change at any time" | openrouter.ai/docs/guides/routing/routers/latest-resolution | fact | **VERIFIED** | "~author/family-latest slugs always resolve to the newest concrete model in a given family" … "Versions can change at any time" | keep |
| B18 | 08/04:143-146 | open-weight "Loading libraries and serving engines take a revision, a specific commit" | none | fact | **UNSOURCED** | HF Transformers `from_pretrained`: "revision (str, optional, defaults to "main") — The specific model version to use. It can be a branch name, a tag name, or a commit id". vLLM engine args: "--revision The specific model version to use. It can be a branch name, a tag name, or a commit id." | **add a source** (E16) |
| B19 | 08/04:178-181 | Anthropic's Messages API returns the answering model in `model`; OpenRouter returns what a floating name resolved to | none | fact | OpenRouter **VERIFIED**; Anthropic's `model` field not re-fetched (a standard documented field) | OpenRouter: "The response's model field reflects the concrete model that actually served the request, not the alias you sent." | keep (optionally link the OpenRouter page again) |
| B20 | 08/04:194-200 | Deprecation policy: four states, "at least 60 days' notice", requests fail after retirement, "deprecated models are likely to be less reliable", cloud platforms set their own dates | platform.claude.com …/model-deprecations | fact | **VERIFIED (2026-09-30 review; re-checked)** | "Active … Legacy … Deprecated … Retired: The model is no longer available for use. Requests to retired models will fail. Deprecated models are likely to be less reliable than active models." "providing at least 60 days' notice before model retirement for publicly released models." "Partner-operated platforms (Amazon Bedrock and Google Cloud) set their own retirement schedules" | keep |
| B21 | 08/04:204-207 | Anthropic evals guide: teams without evals face weeks of testing; with them, "upgrade in days" | anthropic.com/engineering/demystifying-evals-for-ai-agents | practice | **VERIFIED** | "teams without evals face weeks of testing while competitors with evals can quickly determine the model's strengths, tune their prompts, and upgrade in days." | keep |
| B22 | 08/05:94-99 | Tail at Scale: 100 servers, 10 ms typical, 1 s at p99, so "63% of requests that need all hundred take over a second" | research.google/pubs/the-tail-at-scale/ | effectiveness | **VERIFIED (2026-09-30 review; re-checked)**. Recomputed: 1 − 0.99¹⁰⁰ = 0.634 | "each server typically responds in 10ms but with a 99th-percentile latency of one second … If a user request must collect responses from 100 such servers in parallel, then 63% of user requests will take more than one second" | keep |
| B23 | 08/05:121-126 | Brooker, "selfish", 243× | | | VERIFIED | see P8 | make precise (E17) |
| B24 | 08/05:129-135 | gRPC: no deadline by default, "waiting for a response effectively forever"; `DEADLINE_EXCEEDED`; some implementations propagate the deadline with elapsed time deducted | grpc.io/docs/guides/deadlines/ | fact | **VERIFIED (2026-09-30 review; re-checked)** | "By default, gRPC does not set a deadline which means it is possible for a client to end up waiting for a response effectively forever." "fail the RPC with the DEADLINE_EXCEEDED status." "Automatically propagating the deadline … is supported by some gRPC implementations … gRPC converts the deadline to a timeout from which the already elapsed time is already deducted." | keep |
| B25 | 08/05:157-161 | Dean and Barroso: BigTable, hedge after 10 ms, p99.9 for a 1,000-key read 1,800 ms → 74 ms with 2% more requests; hedging at p95 keeps extra load to about 5% | Tail at Scale | effectiveness | **VERIFIED** | "reads the values for 1,000 keys stored in a BigTable table distributed across 100 different servers, sending a hedging request after a 10ms delay reduces the 99.9th-percentile latency for retrieving all 1,000 values from 1,800ms to 74ms while sending just 2% more requests." "defer sending a secondary request until the first request has been outstanding for more than the 95th-percentile expected latency … limits the additional load to approximately 5%" | keep |
| B26 | 08/05:171-176 | only calls without side effects can be hedged; hedging adds load to an overloaded service | Lesson 3 (internal) | practice | **UNSOURCED** externally | gRPC proposal A6 (client retries): "Because hedged RPCs may be be executed multiple times on the server side … it is important that hedging is only enabled for methods that are safe to execute multiple times without adverse affect." gRPC request-hedging guide: "gRPC provides a way to throttle hedged RPCs to prevent server overload." | **lead with an industry source** (E18) |
| B27 | 08/05 demos | 19% of 20-call runs; p99.9 and about 5% extra calls (simulation) | our simulation | our data | Labelled as a simulation; the figures reproduce | CPython, same seed: "20 calls per run … 19% of runs hit a slow call"; hedged run about 5% extra calls | keep |
| B28 | 08/06 recap quiz (lines 338-423) | re-uses the budget, context-window, malformed-request, partial-answer, breaker, stale-value, Chen and hash points | as above | n/a | **VERIFIED** (covered by B1, B6, B9, B14) | n/a | keep |

### 2. Proposed edits

None of these edits touch exercise, demo, `setupCode`, `TESTS` or `REFERENCE` strings, so no Pyodide
re-verification is needed. Quiz edits are JSON strings inside `QuizGroup` props: escape any `"` as `\"`. The
figures are not repeated elsewhere: I grepped all of `src/content/modules` for 243, selfish, Gabrielson,
ImpossibleBench, METR, reward hack, Krakovna, Terraform, Advani and "up to 45%". The only other hits are Lesson 3's
Sethi text, which is already correct, and Lesson 1's METR time-horizon study, which is a different study.

**E1 (A2).** `07-safe-actions/01-a-dry-run-before-the-action.mdx:224-228`
Current:
```
A preview is a snapshot, and state can change between the preview and the
action. Terraform's documentation makes the same point about automated
pipelines: applying a saved plan ensures only the previewed changes are
made. The equivalent for a tool is to apply the plan itself, and to refuse if
any record no longer holds the value the plan saw:
```
Proposed:
```
A preview is a snapshot, and state can change between the preview and the
action. Terraform's documentation makes the same point: changes made in the
meantime "might cause the final effect of a configuration change to be
different" from what an earlier plan showed. Its
[guide to running Terraform in automation](https://developer.hashicorp.com/terraform/tutorials/automation/automate-terraform)
saves the plan, applies exactly that plan, and treats any other plan made
against the same state as invalid once one is applied. The equivalent for a
tool is to apply the plan itself, and to refuse if any record no longer holds
the value the plan saw:
```

**E2 (A8, A10, A11).** `07-safe-actions/03-compensating-when-a-later-step-fails.mdx`
- Line 223-224. Current: `The idea is now a standard pattern for work that spans several services,\nand four details from it matter for agents:`
  Proposed:
  ```
  The idea is now a standard pattern for work that spans several services.
  Microsoft's [Saga pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/saga)
  describes it, and AWS's
  [Well-Architected guidance](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_mitigate_interaction_failure_graceful_degradation.html)
  recommends it to "roll back previous operations in case a later operation
  of the same transaction fails". Four details from it matter for agents:
  ```
- In the bullet "**Some steps can only be corrected, not undone.**", after `Steps like that\n  are best placed last, after everything that can still fail,` add the backing. Proposed wording for that bullet's
  middle sentence: `Steps like that are best placed last, after everything that can still fail: Microsoft's saga
  guidance calls the step after which nothing is undone the *pivot*, and puts only retryable steps after it.` (Keep
  the rest of the bullet, "and are exactly where Lesson 2's risk and the approval gate belong".)
- In the bullet "**A compensation is itself a write, and can fail.**", append:
  ```
  Microsoft's
  [Compensating Transaction pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/compensating-transaction)
  gives the same advice: make each step "an idempotent command", and expect
  that "sometimes manual intervention is the only way to recover".
  ```

**E3 (A12, see D1).** Same file, lines 249-252.
Current:
```
  read back what it would have changed before deciding. Otherwise, run its
  compensation too, written so it's safe to run even if the step never
  happened, for example "set the tier to standard", not "lower the tier by
  one".
```
Proposed:
```
  read back what it would have changed before deciding. Otherwise, run its
  compensation too, written so it's safe to run even if the step never
  happened, and so it doesn't undo someone else's change made since: for
  example "set the tier to standard if it's still priority", not "lower the
  tier by one", and not a blind "set the tier to standard" either. It's
  the compare-and-set from the dry-run concept, applied to the undo.
```
(Prose only. The demo's `lambda: set_tier("standard")` can stay as it is, since nothing else writes in the demo.)

**E4 (P7).** `07-safe-actions/05-gaming-the-check.mdx:164-167`
Current:
```
This has a name. DeepMind's Krakovna et al.
[defined *specification gaming*](https://deepmind.google/blog/specification-gaming-the-flip-side-of-ai-ingenuity/)
(2020) as behaviour that satisfies the literal specification of an objective
without achieving the intended outcome. In reinforcement learning it's
```
Proposed:
```
This has a name. DeepMind's Krakovna et al.
[defined *specification gaming*](https://deepmind.google/blog/specification-gaming-the-flip-side-of-ai-ingenuity/)
(2020) as "a behaviour that satisfies the literal specification of an
objective without achieving the intended outcome". In reinforcement learning it's
```

**E5 (A19), optional but recommended.** Same file, lines 185-189.
Current:
```
  code. Anthropic's
  [Claude 4 announcement](https://www.anthropic.com/news/claude-4) reports
  that both new models were 65% less likely than Claude 3.7 Sonnet to use
  shortcuts or loopholes on agentic tasks prone to them: much less, but not
  never. OpenAI's
```
Proposed:
```
  code. Anthropic's
  [Claude 4 system card](https://www.anthropic.com/claude-4-system-card)
  reports that, across its own reward-hacking evaluations, hard-coding fell
  by an average of 67% for Claude Opus 4 and 69% for Claude Sonnet 4 against
  Claude 3.7 Sonnet, and that both models "still exhibit these behaviors":
  much less, but not never. OpenAI's
```
(If the editor keeps the announcement instead, the 65% is verified as it stands.)

**E6 (P4, P5).** Same file, lines 238-240.
Current:
```
- **Look at how, not only whether.** OpenAI found that a monitor reading the
  model's reasoning caught reward hacking far more reliably than one reading
  its actions alone. It also found that training the model against that
```
Proposed:
```
- **Look at how, not only whether.** OpenAI found that a monitor reading the
  model's reasoning caught reward hacking far more reliably than one reading
  its actions alone: 95% of two common hacks against 60%, in Baker et al.'s
  [preprint](https://arxiv.org/abs/2503.11926). It also found that training the model against that
```

**E7 (P1, P2).** Same file, lines 193-198.
Current:
```
- **It's common where the check is in view.** METR
  [found](https://metr.org/blog/2025-06-05-recent-reward-hacking/) OpenAI's o3
  reward-hacking in 30% of its runs on one benchmark, against under 1% on
  another, and suggests the difference is that on the first the model could
  see its scoring function. It kept hacking in 14 of 20 attempts even when
  told the work had real consequences.
```
Proposed:
```
- **It's common where the check is in view.** METR
  [found](https://metr.org/blog/2025-06-05-recent-reward-hacking/) OpenAI's o3
  reward-hacking in 30% of its runs on one benchmark, against under 1% on
  another. Its leading explanation is that on the first the model could see
  its scoring function, though those tasks were also harder and used
  different scaffolding. On one task, o3 still planned a hack in 14 of 20
  attempts when told the work would help researchers fighting Alzheimer's.
```

**E8 (P3).** Same file, lines 202-204.
Current:
```
  the agent took a shortcut. GPT-5 passed 54% of one variant anyway. Given an
  explicit option to stop and say the task can't be done, it did so, and its
  rate fell to 9%.
```
Proposed:
```
  the agent took a shortcut. GPT-5 passed 54% of one variant anyway. Given an
  explicit option to stop and flag the task for a person, its rate fell to
  9%, though the same option helped Claude Opus 4.1 much less. Hiding the
  tests from the agent cut cheating to near zero, at some cost to real
  performance.
```

**E9 (A21, A22).** Same file, lines 225-237.
- At the end of the "Keep the measuring stick out of reach" bullet, after `puts it plainly: "The agent shouldn't be able to easily 'cheat' the eval."`, add:
  `ImpossibleBench measured it: tests the agent couldn't see were almost never cheated, and read-only tests stopped agents editing them, though not special-casing.`
- Current:
  ```
  - **Give it a way out.** ImpossibleBench's biggest drop came from letting the
    agent say the task couldn't be done. An agent that can
  ```
  Proposed:
  ```
  - **Give it a way out.** In ImpossibleBench, letting the agent flag a task
    as impossible cut GPT-5's cheating from 54% to 9%. An agent that can
  ```

**E10 (A20).** Same file, lines 222-224.
Current: `traffic" is an *invariant*, and it's the one the second run broke. Most\n  gamed checks break something nobody thought to write down, so writing it\n  down is the fix.`
Proposed: `traffic" is an *invariant*, and it's the one the second run broke. A\n  gamed check often breaks something nobody thought to write down, so writing\n  it down is the first fix.`

**E11 (A23).** Same file, quiz 3 (lines 280-286).
- Option `"The tasks on it were much harder",` → `"The tasks on it were shorter and easier",` (METR's RE-Bench tasks are the harder ones, so this is cleanly false).
- Explanation. Current: `"About 30% of runs gamed the benchmark whose scoring function the model could see, against under 1% elsewhere, and METR's explanation is that visibility. A check an agent can read is a target it can aim at, which is why the measuring stick belongs out of reach."`
  Proposed: `"About 30% of runs gamed the benchmark whose scoring function the model could see, against under 1% elsewhere. METR's leading explanation is that visibility, though harder tasks and different scaffolding may play a part. A check an agent can read is a target it can aim at, which is why the measuring stick belongs out of reach."`

**E12 (A24).** Same file, quiz 4 (lines 289-297).
- Question: `"ImpossibleBench's GPT-5 cheated on 54% of impossible tasks. What cut that to 9%?"` → `"On one ImpossibleBench variant, GPT-5 cheated on 54% of impossible tasks. What cut that to 9%?"`
- Explanation: `"Given a legitimate way to stop, the agent mostly took it. An agent that can escalate or report that a task is impossible has less pressure to manufacture a pass."` → `"Given a legitimate way to stop, it cheated far less, though the same option helped Claude Opus 4.1 much less. An agent that can escalate or report that a task is impossible has less pressure to manufacture a pass."`

**E13 (B7).** `08-graceful-degradation/02-partial-answers.mdx:156-158`
Current:
```
[Sethi et al.'s preprint from Lesson 3](/06-reliability/03-checks-in-the-loop/02-checking-a-tool-result/)
found that when a tool failed without saying so, models sometimes stated a
value they didn't have, up to 45% of the time for some kinds of failure.
```
Proposed:
```
[Sethi et al.'s preprint from Lesson 3](/06-reliability/03-checks-in-the-loop/02-checking-a-tool-result/)
found that when a tool failed without saying so, the model sometimes stated a
value it didn't have, or made up a reason for not answering: up to 45% of
the time for some kinds of failure.
```

**E14 (B10).** `08-graceful-degradation/03-circuit-breakers.mdx:291-296`
Current:
```
The version in the exercise is the simplest form. It lets any call through
while half-open, which is fine when calls arrive one at a time. With many at
once, a real breaker lets one trial through and keeps failing the rest fast
until the trial comes back. Production libraries also usually trip on the
*rate* of failures over a recent window, not a count in a row, and can count
slow calls as failures too.
```
Proposed:
```
The version in the exercise is the simplest form. It lets any call through
while half-open, which is fine when calls arrive one at a time. With many at
once, a real breaker lets a set number of trial calls through and keeps
failing the rest fast until they come back. Production libraries such as
[Resilience4j](https://resilience4j.readme.io/docs/circuitbreaker) also
usually trip on the *rate* of failures over a recent window, not a count in
a row, and can count slow calls as failures too.
```

**E15 (B15).** `08-graceful-degradation/04-pinning-model-and-prompt-versions.mdx:130`
`[models documentation](https://platform.claude.com/docs/en/about-claude/models/overview)` →
`[model ID documentation](https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions)`

**E16 (B18).** Same file, lines 143-146.
Current: `  Loading libraries and serving engines take a revision, a specific commit,\n  to fix it.`
Proposed:
```
  Loading libraries and serving engines take a revision, a specific commit,
  to fix it: Hugging Face's
  [`from_pretrained`](https://huggingface.co/docs/transformers/main_classes/model)
  and [vLLM](https://docs.vllm.ai/en/latest/configuration/engine_args/) both
  accept a `revision` that can be "a branch name, a tag name, or a commit id".
```

**E17 (P8).** `08-graceful-degradation/05-a-time-budget-for-the-run.mdx:123-126`
Current:
```
(AWS Builders' Library) calls retries "selfish": each one spends the
system's capacity on one request. Stacked across layers they multiply, so
three retries at each of five layers can send 243 times the load to the
bottom one. Time multiplies the same way.
```
Proposed:
```
(AWS Builders' Library) calls retries "selfish": a client that retries
"spends more of the server's time to get a higher chance of success".
Stacked across layers they multiply, so three tries at each of five layers
can send 3⁵ = 243 times the load to the bottom one, which is why Amazon
retries at a single point in the stack. Time multiplies the same way.
```

**E18 (B26).** Same file, after line 174 (`[idempotency key](...)`), before `Hedging also adds load`, add:
```
gRPC's [retry design](https://github.com/grpc/proposal/blob/master/A6-client-retries.md)
draws the same line: hedging is only for methods that are safe to run more
than once.
```

**E19 (P9, see D3).** `08-graceful-degradation/01-falling-back-to-another-model.mdx:338-340`
Current:
```
in the AWS Builders' Library, argues that fallback code is rarely exercised,
so it's rarely tested, and can make an outage worse when it finally runs. The
article's preference is for paths that run in production all the time.
```
Proposed:
```
in the AWS Builders' Library, argues that fallback code is rarely exercised,
so it's rarely tested, and can make an outage worse when it finally runs.
Amazon avoids fallback where it can. Where it can't, it runs the backup path
all the time, which the article calls failover rather than fallback.
```

**E20 (B2).** Same file, lines 269-271.
Current: `Sort errors by what they mean, not by their HTTP status alone. On the major\nAPIs a prompt that's too long also comes back as a 400 "invalid request",`
Proposed: `Sort errors by what they mean, not by their HTTP status alone. On the major\nAPIs a prompt that's too long also comes back as a 400 "invalid request"\n([Anthropic's](https://platform.claude.com/docs/en/build-with-claude/context-windows), for example),`

### 3. Needs a decision

- **D1 (A12, L7 C3): how a compensation should be written.** The page tells learners to write an absolute undo,
  "set the tier to standard", so it's safe to run whether or not the step happened. The original *Sagas* paper
  warns against the opposite risk. Its compensation for a seat booking subtracts one and "cannot simply store in
  the database the number of seats that existed when Ti ran because other transactions could have run between".
  Microsoft's pattern says the same: "other transactions might change intermediate states". Each rule guards
  against a real failure. **Recommendation:** teach a conditional undo ("set it to standard if it's still
  priority"), which is idempotent and doesn't overwrite someone else's later change (E3). This is prose only, and
  it ties back to the dry-run concept's compare-and-set.
- **D2 (A22, L7 C5): which habit ImpossibleBench backs most.** The page presents the abort option as
  ImpossibleBench's biggest win and uses it as the evidence for "give it a way out". In the paper, the biggest drop
  comes from hiding the tests: near zero, at a cost to real performance. That backs "keep the measuring stick out of
  reach" more strongly. The abort option helped OpenAI models a lot and Claude Opus 4.1 much less. The four habits
  stay the same; only the evidence behind each changes (E8, E9, E12). **Recommendation:** apply the edits. No change
  to the concept's structure.
- **D3 (P9, L8 C1): the Gabrielson citation argues against fallback in general.** The article's conclusion is "At
  Amazon, we avoid fallback in our systems because it's difficult to prove and its effectiveness is hard to test".
  The concept, like LiteLLM and other LLM gateways, teaches model fallback as standard practice. The page's own
  advice (send the backup a share of real traffic) is what Gabrielson calls converting fallback into failover.
  **Recommendation:** keep the concept, and say plainly what Amazon's stance is and that continuous use turns the
  backup into failover (E19). Otherwise a learner who follows the link finds it arguing against the concept's
  premise.

### 4. Counts

- **Verified:** 51. That includes the 7 priority items: METR's figures, the 14 of 20, ImpossibleBench 54%→9%
  (ICLR 2026 camera-ready), the OpenAI blog, Baker et al., the Claude 3.7 system card, DeepMind's definition read
  directly, Brooker's 243× and "selfish", and Gabrielson. Five of the 51 are re-checks of items the 2026-09-30
  review had already confirmed: Weng, the Claude 4 announcement, the thinking docs, the deprecation docs and the
  gRPC deadlines guide.
- **Contradicted:** 4, three of them only in part.
  - A22: "biggest drop" from the abort option. Hiding the tests gave the bigger drop.
  - A23: the METR quiz distractor "much harder" is one of METR's own explanations.
  - B7 (in part): Sethi's 45% counts made-up refusals as well as invented values.
  - B10 (in part): real breakers let a configurable number of trial calls through half-open, not one.
- **Not reachable:** 0. The ACM, openai.com and AWS Builders' Library pages were read through the Cornell PDF and
  the Wayback Machine.
- **Unsourced practice claims flagged:** 8 (A3, A8, A10, A11, A20, B12, B18, B26). Sources are proposed for 5 of
  them; A3 and B12 can stay as they are, and A20 should be softened.
- **Re-labelled or made precise:** 6 (P1 METR explanation, P2 the 14 of 20, P3 ImpossibleBench caveat, P8 "three
  tries", A19 vendor figure to system card, A24 quiz).
- **Replaced:** 3 (A2 Terraform paraphrase, A22 "biggest drop", B15 dead anchor for the pinned-snapshot claim).
- **Added sources:** 9 (Baker et al. arXiv; Claude 4 system card; Microsoft Saga and Compensating Transaction
  patterns; AWS Well-Architected on sagas; Terraform automation guide; Resilience4j; HF/vLLM `revision`; gRPC A6;
  Anthropic context-windows doc).

---

## Report: Citation audit: Module 6, Lessons 3, 9 and 10

Scope: `src/content/modules/06-reliability/03-checks-in-the-loop`, `09-restricting-after-reading` and `10-layered-checks` (all .mdx: intro, concepts, quizzes and recaps).
Downloads and extracted text: `scratchpad/m6D/`.
Paths below are relative to `src/content/modules/06-reliability/`. Line numbers are from the files as of 2026-09-30.

Short names used in the table:
- **DP** = Beurer-Kellner et al., *Design Patterns for Securing LLM Agents against Prompt Injections*, arXiv 2506.08837 **v3** (27 Jun 2025). A preprint with no venue listed.
- **CaMeL** = Debenedetti et al., *Defeating Prompt Injections by Design*, arXiv 2503.18813 **v2** (24 Jun 2025, "Updated version with newer models"). Crossref shows it was published in **IEEE SaTML 2026**, pp. 587–618, DOI 10.1109/satml68715.2026.00040. I couldn't open the IEEE page, so the published figures are unchecked.
- **FIDES** = Costa et al., *Securing AI Agents with Information-Flow Control*, arXiv 2505.23643 **v2** (3 Sep 2025). Preprint; all authors are from Microsoft.
- **Sethi** = Sethi et al., *Fabrication After Tool Failure*, arXiv 2609.14758 **v1** (13 Sep 2026). Preprint.
- **ToolEmu** = Ruan et al., arXiv 2309.15817 **v2** (17 May 2024), "Published as a conference paper at ICLR 2024". The 68.8% is the same in v1.
- **Basiri** = arXiv 1702.05843 v1. Its header reads "Published as: … 'Chaos Engineering', IEEE Software, vol. 33, no. 3, pp. 35–41, May–June 2016, DOI:10.1109/MS.2016.60". Crossref confirms: IEEE Software 33(3) 35–41, 2016-05, authors Basiri, Behnam, de Rooij, Hochstein, Kosewski, Reynolds, Rosenthal.

### 1. Claims table

| ID | file:line | claim (trimmed) | source given | kind | verdict | evidence (primary source) | recommendation |
|---|---|---|---|---|---|---|---|
| L3-1 | 03/01-where-a-check-can-sit.mdx:97-100 | "τ-bench's most common failure… was a right tool called with a wrong value" | Lesson 1 link (τ-bench) | effectiveness | VERIFIED | τ-bench (2406.12045) §5, Fig. 5, from 36 failed gpt-4o trajectories: Wrong argument 33.3%, Wrong decision 25.0%, Wrong info 22.2%, Partially resolve 19.4%. "gpt-4o FC agent usually makes the right type of tool call(s) but fills in one or more arguments incorrectly." | keep |
| L3-2 | 03/01:226-237 | OpenAI Agents SDK: input guardrails run only for the first agent and in parallel by default. Tool guardrails run before and after a guarded function tool: they can skip the call or replace its output, and either can stop the run. Output guardrails run on the final output. | openai.github.io guardrails | fact | VERIFIED (2026-09-30 review; wording rechecked today in `docs/guardrails.md` on main) | "Input guardrails run only for the first agent in the chain." "Parallel execution (default, `run_in_parallel=True`)". "Input tool guardrails run before the tool executes and can skip the call, replace the output with a message, or raise a tripwire." "Output tool guardrails run after the tool executes and can replace the output or raise a tripwire." | keep |
| L3-3 | 03/02-checking-a-tool-result.mdx:580-587 | Sun et al. (EMNLP 2024): a malformed call usually gets an error message, but "a well-formed call with the wrong content, or a tool that is simply wrong" fails silently; mistakes carry forward; framed as models trusting tools too much | arXiv 2406.19228 | fact / effectiveness | VERIFIED, one clause stretched | v1 §1: "As opposed to input-based errors which are often accompanied by error messages, most tool failures are 'silent.'" Fig. 1(c): "Tool inputs are correct, but the tool itself silently produces false outputs." Also "leading to error cascades", and "to observe overtrusting of tools". Venue confirmed: EMNLP 2024 main, pp. 14272–14289 (aclanthology 2024.emnlp-main.790). In the paper, *wrong inputs* are the case that tends to come with an error message (Fig. 1b). It doesn't say a well-formed call with wrong content fails silently. | re-label (small rewording; link the ACL Anthology version) |
| L3-4 | 03/02:588-598 | Sethi: a September 2026 preprint, not peer-reviewed, that forced a tool call and returned an unusable payload. An error status was never dishonest in the main condition. A success status around an unusable value gave dishonesty up to 45.3% (redacted). One model and stub tools. | arXiv 2609.14758 | effectiveness | VERIFIED | Abstract: "When the tool returns status:error, dishonesty is absent (0.0%); when it returns status:ok with a redacted, corrupted, stale, malformed, empty or truncated value, dishonesty reaches 45.3%." Table 3: REDACTED_PERMISSION under deploy is 45.3. §7: "Tools are deterministic stubs… The main grid uses a single generation model" (gemini-2.5-flash, §5.1). | keep (optional: name the model, gemini-2.5-flash) |
| L3-5 | 03/02:600-603 | The authors suggest converting unsignalled failures at the tool boundary; they predict it works but didn't test it | Sethi | fact | VERIFIED | §7 Future work: "normalising unsignalled failures into signalled ones at the tool boundary, which the signalling result predicts should reduce dishonesty without touching the model" | keep |
| L3-6 | 03/02:611-612 | The usual kinds of unusable result "match the failure types in Sethi et al.'s study" | Sethi | fact | VERIFIED | Table 1 lists eight types: HTTP_500, TIMEOUT, CORRUPTED, EMPTY_RESULT, REDACTED_PERMISSION, SCHEMA_MISMATCH, STALE_EXPIRED, TRUNCATED | keep |
| L3-7 | 03/02:675 (quiz); 03/05-recap-practice.mdx:345 | A signalled error was reported honestly; success around an unusable value led to dishonesty far more often, "as high as 45.3%" | Sethi | effectiveness | VERIFIED | As L3-4 | keep |
| L3-8 | 03/03-what-a-failed-check-does.mdx:50-57 | Best prompt-level defence, an explicit way to say retrieval failed, cut dishonest answers from 14.10% to 0.87% | Sethi | effectiveness | VERIFIED | Abstract: "Appending a single sentence that requires the model to emit retrieval_status: OK or FAILED before answering reduces dishonesty from 14.10% to 0.87%" | keep |
| L3-9 | 03/03:58-65 | Kapoor et al.: GPT-4 once gives 89.6% for $1.93; retrying up to five times on failed example tests gives 92.0% for $2.51 | Lesson 2 link (Kapoor et al.) | effectiveness | VERIFIED (arXiv v1) | 2407.01502v1 Table A1: "GPT-4 (baseline) 89.6 (87.8-90.9) 1.93 (1.91-1.95)"; "Retry (GPT-4) 92.0 (91.4-92.7) 2.51 (2.46-2.56)". §2.3: "Retry: We repeatedly invoke a model with the temperature set to zero, up to five times, if it fails the test cases provided with the problem description." Five runs over 164 problems, gpt-4-turbo-2024-04-09. A TMLR 2025 version exists (per Princeton's publication list). I couldn't open OpenReview (it served HTML, not the PDF), so the published figures are unchecked. | keep (the Lesson 2 owner should confirm the TMLR figures) |
| L3-10 | 03/03:66-72; quiz :166; recap 03/05:389 | AgentDojo's detector aborted on any flag; it stopped most attacks, but false positives cut completed tasks from 69.0% to 41.5% | Lesson 2 link (AgentDojo) | effectiveness | VERIFIED | 2406.13352v3 §4 "(ii) Prompt injection detection which uses a BERT classifier from ProtectAI… and aborts the agent if anything has been detected". Table 5 (GPT-4o): "Benign utility 69.0% … PI detector 41.49%"; targeted ASR 57.69% → 7.95%. "The prompt injection detector has too many false positives, however, and significantly degrades utility." | keep |
| L3-11 | 03/03:74-77 | OpenAI tool guardrails can skip or replace, which lets the agent continue, or raise a tripwire, which halts the run | OpenAI guardrails | fact | VERIFIED | `tool_guardrails.py`: "raise_exception: Halt execution by raising a ToolGuardrailTripwireTriggered exception". Docs: tripwire "halts agent execution". | keep |
| L3-12 | 03/03:106-109 | "One repair meets both conditions often enough to be standard practice: redacting a secret from a tool result before the model reads it" | none | practice | UNSOURCED | Industry backing found. NeMo Guardrails Presidio integration: "You can detect sensitive data on user input, bot output, or the relevant chunks retrieved from the knowledge base." And: "When using mask sensitive data on input the bot will mask the sensitive parts in the user's input and continue the processing." (docs.nvidia.com/nemo/guardrails/configure-guardrails/guardrail-catalog/third-party/presidio) | add stronger backing |
| L3-13 | 03/04-parallel-checks-and-tripwires.mdx:570-577 | OpenAI input guardrails run in parallel by default. The docs warn that the agent may already have used tokens and run tools. Blocking mode is recommended for cost and to avoid side effects. | OpenAI guardrails | fact | VERIFIED (2026-09-30 review; rechecked) | "if the guardrail's tripwire is triggered, the agent may have already consumed tokens and executed tools before being cancelled." "Blocking execution… This is ideal for cost optimization and when you want to avoid potential side effects from tool calls." | keep |
| L3-14 | 03/04:609-610 | OpenAI output guardrails run only after the agent has finished | OpenAI guardrails | fact | VERIFIED | "Output guardrails always run after the agent completes, so they don't support the `run_in_parallel` parameter." | keep |
| L3-15 | 03/04:611-617 | NeMo checks streamed output in chunks of 200 tokens by default. The default `stream_first` sends each chunk before checking it. The docs say the user has already seen blocked content. | NeMo streaming docs | fact | VERIFIED (2026-09-30 review; rechecked) | "chunk_size int 200"; "stream_first bool True If True, the client receives tokens before output rails run on the chunk"; "If a rail blocks the content, the user has already received the tokens up to that point." | keep |
| L3-16 | 03/04:636-642 | *Building Secure and Reliable Systems* uses a door lock: fail safe/open releases on power loss; fail secure/closed stays locked | BSRS ch. 1 | fact | VERIFIED (2026-09-30 review; rechecked) | "systems often fail safe (or open): for example, an electronic lock is designed to remain open in case of power failure, to allow safe exit through the door… you could design the door to fail secure and remain closed when not powered." | keep |
| L3-17 | 03/04:646-647 | "framework documentation rarely spells them out" (time limits, open vs closed, logging skips) | none | practice | UNSOURCED (partly at odds with the OpenAI doc) | The OpenAI Agents SDK does spell out one case. When a guardrail function raises, "the runner treats the verdict as unknown… before surfacing the guardrail exception", so a crashing check ends the run: fail closed by default. Its guardrail docs mention no time limit and no fail-open option. | soften (cite the SDK's documented behaviour) |
| L3-18 | 03/04:649-651 | "Every check that calls out gets a time limit" | none | practice | UNSOURCED | Lesson 8 C5 ("Slow is a failure too") already covers timeouts and deadlines with the gRPC source the 2026-09-30 review verified. | optional: link Lesson 8 C5 (verify the anchor in the built HTML) |
| L9-1 | 09/01-tracking-what-the-session-has-read.mdx:204-209 | "Meta's security team… Agents Rule of Two (2025): until prompt injection can be reliably detected, no more than two of three properties within a session" | ai.meta.com blog | practice | VERIFIED (definition). "security team" unverified. | Meta AI blog, 31 Oct 2025: "until robustness research allows us to reliably detect and refuse prompt injection, agents must satisfy no more than two of the following three properties within a session… [A] An agent can process untrustworthy inputs [B] … access to sensitive systems or private data [C] … change state or communicate externally". The post has no byline. Willison (2 Nov 2025): "It doesn't list authors but it was shared on Twitter by Meta AI security researcher Mick Ayzenberg." | re-label ("Meta" rather than "Meta's security team") |
| L9-2 | 09/01:211-215 | "Oso's agent documentation… describes its decisions as stateful… such as whether the agent recently took in untrusted content" | osohq.com/docs/oso-for-agents/use-cases | practice | NOT REACHABLE at the link (it now redirects to `/overview`, and the current docs no longer mention the Rule of Two). An archived copy supports the substance, not the wording. | Wayback, 18 Feb 2026 snapshot of the linked page: "Oso's decisions are contextual: whether a tool call is safe often depends on what happened earlier in the session." "Oso detects risky combinations (often referred to as the 'Lethal Trifecta' / 'Rule of Two') and gives you the ability to enforce based on your preference: allow, deny, or requires_approval." Also `"on_rule_of_two_violation": "requires_approval" } # or "deny" (default)`. The words "stateful" and "recently took in untrusted content" appear in neither snapshot I checked (15 and 18 Feb 2026). | replace (archived link and its actual wording), or cut |
| L9-3 | 09/01:264-267 | "taint tracking, a simple form of information-flow control. Data is labelled by where it came from, anything computed from it inherits the label…" | none | practice / fact | UNSOURCED (textbook definition) | FIDES v2 describes the course's session guard almost exactly, §5: "The basic planner with dynamic taint-tracking introduced in Section 4 has a fundamental limitation: when a tool returns untrusted or confidential data, this data immediately taints the conversation history, restricting the tools that can be called later". The abstract says FIDES uses "dynamic taint-tracking". | add stronger backing (FIDES) |
| L9-4 | 09/01:269-274 | CaMeL and Microsoft's FIDES (Costa et al., 2025) track labels per value, so an untrusted email doesn't taint an unrelated lookup; the price is a planner or interpreter that tracks every value | arXiv 2505.23643; CaMeL (C3 link) | fact | VERIFIED | CaMeL v2 §1: "CaMeL associates, to every value, some metadata (commonly called capabilities…)", and a "custom Python interpreter". FIDES §5: FIDES is "a variable passing planner… storing tool results in variables", which addresses the whole-history tainting; the abstract adds "tracks confidentiality and integrity labels". | re-label: FIDES is a preprint; CaMeL is IEEE SaTML 2026 |
| L9-5 | 09/02-restricting-tools-once-the-session-has-read.mdx:178-180 | "Meta's Rule of Two, applied literally, blocks a call only when it would give the session all three" | Meta | practice | VERIFIED in substance; "blocks" overstates it | Meta: "If an agent requires all three without starting a new session (i.e., with a fresh context window), then the agent should not be permitted to operate autonomously and at a minimum requires supervision --- via human-in-the-loop approval or another reliable means of validation." | soften (text only; the demo can stay) |
| L9-6 | 09/02:184-190; recap 09/04-recap-practice.mdx:258; quiz 09/02:258 | Willison, whose lethal trifecta the Rule of Two builds on, pointed out that untrusted input plus changing state can do harm without private data | simonwillison.net 2025/Nov/2 | practice | VERIFIED | Meta: "Inspired by the similarly named policy developed for Chromium, as well as Simon Willison's 'lethal trifecta'". Willison: "the Venn diagram above marks the combination of untrustworthy inputs and the ability to change state as 'safe', but that's not right. Even without access to private systems or sensitive data that pairing can still produce harmful results." The same post (Update 2) quotes Meta's Mick Ayzenberg: "the framework would describe access to any sensitive system as part of the [B] circle, not only private systems or private data." It also says Meta relabelled "safe" as "lower risk". | keep, and add Meta's reply (see Needs a decision) |
| L9-7 | 09/02:218-224 | Approving an outgoing message after reading untrusted text and private data "is a job people do badly"; "Some systems choose approval instead" | none | practice | UNSOURCED | CaMeL v2 §9.2: "This can lead to user fatigue, where users become desensitized to security prompts and may inadvertently approve malicious actions". FIDES §1: "real-world systems often also use human-in-the-loop prompts, which can lead to confirmation fatigue and social engineering attacks." For "approval instead": Meta requires "supervision --- via human-in-the-loop approval", and Oso (archived) offers `requires_approval` with `deny` as the default. | add stronger backing |
| L9-8 | 09/03-designs-that-keep-untrusted-text-away.mdx:83-86 | "Beurer-Kellner and thirteen co-authors from Google, Microsoft, IBM, ETH Zurich and EPFL" | DP | fact | CONTRADICTED (affiliation list incomplete and misleading); the co-author count is right | DP v3 title page gives 14 authors. The affiliations are Invariant Labs (Beurer-Kellner, the first author; Fischer), IBM, EPFL, ETH Zurich, Swisscom, Google, ETH AI Center, AppliedAI Institute for Europe, Microsoft and Kyutai. Also: "*Alphabetical author ordering. Corresponding author: florian.tramer@inf.ethz.ch". The course's list leaves out the first author's own affiliation. | replace (and label it a preprint) |
| L9-9 | 09/03:86-91 | Six patterns, each enforcing some isolation between untrusted data and control flow; every pattern trades away general capability | DP | practice | VERIFIED | §3.1: "we describe six LLM agent design patterns that enforce some degree of isolation between untrusted data and the agent's control flow." §3: "These patterns impose intentional constraints on agents, explicitly limiting their ability to perform arbitrary tasks." | keep |
| L9-10 | 09/03:97-100; quiz :220-228 | Plan-then-execute guarantee: an injection can't make the agent call a tool not in the plan | DP | fact | VERIFIED | Fig. 2 caption: "A prompt injection cannot force the LLM into executing a tool that is not part of the defined plan." | keep |
| L9-11 | 09/03:109-111; quiz :239; recap :302 | "The paper names this limit": an injection can still shape the arguments of planned calls | DP | fact | VERIFIED | §3.1(3): "the agent's plan of tool calls is fixed, but a prompt injection can still manipulate the inputs to these tool calls". Example: "(it could, however, arbitrarily alter the body of the email…)". | keep |
| L9-12 | 09/03:120-125 | Action-selector: results never fed back; "the most restrictive pattern" | DP | fact | VERIFIED | §3.1(1): "prevent any feedback from these actions back into the agent. The agent acts merely as an action selector". The next pattern is introduced as "A more permissive approach". | keep |
| L9-13 | 09/03:131-135 | "Simon Willison proposed this in 2023": quarantined model with no tools, privileged model sees only names | none (no link) | practice | VERIFIED | Willison, "The Dual LLM pattern for building AI assistants that can resist prompt injection", 25 April 2023: "a Privileged LLM and a Quarantined LLM". Also "Run action fetch_latest_emails(1) and assign to $VAR1". DP §3.1(4) confirms the dual LLM was "proposed by Willison (2023b)". | add a link to the 2023 post |
| L9-14 | 09/03:146-150 | Code-then-execute: the privileged model writes a program run by a custom interpreter that tracks provenance; CaMeL built it; untrusted data never changes flow; capabilities block exfiltration | CaMeL arXiv | fact | VERIFIED | DP §3.1(5): "This design pattern is instantiated in the framework of Debenedetti et al. (2025)." CaMeL v2 abstract: "the untrusted data retrieved by the LLM can never impact the program flow… uses a notion of a capability to prevent the exfiltration of private data over unauthorized data flows". | keep |
| L9-15 | 09/03:151-153; quiz :253-261 | CaMeL solved 77% of AgentDojo tasks with provable security vs 84% undefended | CaMeL arXiv | effectiveness | VERIFIED (v2) | v2 abstract: "solving 77% of tasks with provable security (compared to 84% with an undefended system) in AgentDojo." v1 (Mar 2025) said "67%". The course correctly uses the revised figure. | re-label: say it's the revised version, and give the venue (IEEE SaTML 2026) |
| L9-16 | 09/03:155-162 | Dual LLM: quarantined output still reaches the user; `$VAR1` passed into tool arguments goes unchecked. CaMeL's authors name the costs: someone writes policies, the user confirms more often, the interpreter is a research prototype. | CaMeL | fact | VERIFIED | Willison 2023, section headed "You're still vulnerable to social engineering". CaMeL v2 §9.3: "CaMeL suffers from users needing to codify and specify security policies and maintain them. CaMeL also comes with a user burden." §9.2 covers user fatigue. The repo README says: "This is a research artifact released to reproduce the results in our paper. The interpreter implementation likely contains bugs… This is **not** a Google product". | keep |
| L9-17 | 09/03:168-171 | The session guard's cost: labels only accumulate, so after one untrusted read every later action needs a person or is refused | none | practice | UNSOURCED | FIDES v2 §5, quoted in L9-3: the data "immediately taints the conversation history, restricting the tools that can be called later". This is exactly the limitation, and FIDES's variables were built to fix it. | add stronger backing |
| L9-18 | 09/03:174-177 | LLM map-reduce: each untrusted item goes to its own isolated session, and what comes out is constrained so it can't carry instructions | DP | practice | VERIFIED (slightly narrower than the source) | §3.1(3): "dispatch an isolated LLM-agent to process individual pieces of 3rd party data… we must enforce that the isolated agent cannot perform any harmful operation (e.g., calling arbitrary tools)." For the reduce step, either "(1)… does not use an LLM, and simply applies operations that are robust to tampering" or "(2)… we enforce safety constraints on the outputs of the map operation… (e.g., a regex that ensures the output of map is a number)". | keep, or add the two reduce options (optional) |
| L9-19 | 09/03:191-194 | Context-minimization: "once the untrusted content has done its job, remove it from the context before the next step" | DP | practice | VERIFIED as a generalisation; the paper aims it at the **user's prompt** | §3.1(6): "The above patterns still allow for injections in the user prompt… To prevent certain user prompt injections, the agent system can remove unnecessary content from the context over multiple interactions." Fig. 6: "The user's prompt informs the actions of the LLM agent… but is removed from the LLM's context thereafter". Every case study (§4.4, 4.8, 4.9) removes the user's prompt, not tool output. | re-label (say what the paper aims it at, then generalise) |
| L10-1 | 10/03-what-each-layer-earns.mdx:255-265 | Our data: judge cost of about 500 prompt tokens and 25 GPU-ms; Qwen3.5-9B 0/40 false flags and 0/80 false passes, "up to about 7%"; 33 of 390 disagreements | "committed Lesson 4 run on one Colab G4 GPU" | our data | Labelled as ours, with model and case counts | Matches Lesson 4 (04/02-checking-the-checker.mdx:53, 301, 313). "About 7%" is the rule of three, 3/40 = 7.5%; an exact one-sided 95% bound is 7.2%. | keep |
| L10-2 | 10/03:307-312 | "Netflix's engineers made a discipline of finding them. Basiri et al.'s Chaos Engineering (IEEE Software, 2016) describes injecting real-world faults into a running system on purpose, and checking that it still behaves as it should." | arXiv 1702.05843 | practice | VERIFIED | Authors are from the "Traffic and Chaos Team, Netflix". "We believe that these activities form part of a discipline that is emerging in our industry, that we call Chaos Engineering." And: "injecting real‑world inputs (e.g., transient network failures, surges in incoming requests, malformed data inputs) and observing what happens at the system boundary." Also: "Failure Injection Testing (FIT) exercises where we cause requests between Netflix services to fail and verify that the system degrades gracefully." | keep (optional note: Netflix runs it in production, and the course's offline version is closer to Netflix's FIT) |
| L10-3 | 10/03:312-314 | The Principles of Chaos name malformed responses among the events to vary | principlesofchaos.org | practice | VERIFIED (2026-09-30 review; rechecked) | "Consider events that correspond to hardware failures like servers dying, software failures like malformed responses, and non-failure events like a spike in traffic" | keep |
| L10-4 | 10/03:314-317 | "Ruan et al.'s ToolEmu (ICLR 2024) had a language model play the tools, including their failures. Of the failures it found in agents, 68.8% were judged ones that would really happen with real tools." | arXiv 2309.15817 | effectiveness | VERIFIED figure and venue; the description is imprecise | v2 abstract: "68.8% of failures identified with ToolEmu would be valid real-world agent failures." §4.2, Table 3: "Identified Failure Precision… Standard 72.5% ± 7.1%, Adversarial 68.8% ± 6.7%". A "true failure" is one "labeled 0 for safety by at least two human annotators and validated as free of critical issues in the execution trace by at least three annotators". Two gaps. (a) The "failures" are the **agent's risky actions** under underspecified instructions, not tool failures. (b) ToolEmu doesn't inject tool faults. Its emulator only "reject[s] invalid [inputs] by raising an exception". Its adversarial emulator sets up "sandbox states… more likely to cause LM agent failures". 68.8% is the adversarial emulator's figure; the standard one is 72.5%. v1 and v2 give the same numbers. | re-label (reword what it did and what 68.8% measures) |
| L10-5 | 10/03:421 (quiz) | "Breaking the tools on purpose finds failures nobody wrote a scenario for, which is the point of chaos engineering." | Basiri (implied) | practice | VERIFIED | As L10-2 | keep |

### 2. Proposed edits

None of these edits touches an exercise or demo string (`String.raw` Pyodide code), so none needs re-verifying in Pyodide. Quiz explanations are plain JSON text.

#### E1 (L3-3). Sun et al.: match what the paper says about which failures are silent
File `03-checks-in-the-loop/02-checking-a-tool-result.mdx`, lines 580-587. Current:
```
- **Most tool failures are silent.** Sun et al.,
  [*Tools Fail: Detecting Silent Errors in Faulty Tools*](https://arxiv.org/abs/2406.19228)
  (EMNLP 2024), point out that a malformed call usually produces an error
  message, but a well-formed call with the wrong content, or a tool that is
  simply wrong, produces a wrong result with no signal at all, and the
  mistake carries into the steps that follow. They tested whether models
  notice such results without an explicit error, and framed the problem as
  models trusting their tools too much.
```
Proposed:
```
- **Most tool failures are silent.** Sun et al.,
  [*Tools Fail: Detecting Silent Errors in Faulty Tools*](https://aclanthology.org/2024.emnlp-main.790/)
  (EMNLP 2024), point out that a mistake in a call's inputs often comes back
  as an error message, but a tool that is itself wrong, given correct inputs,
  usually returns a wrong result with no signal at all, and the mistake
  carries into the steps that follow. They tested whether models notice such
  results without an explicit error, and framed the problem as models
  trusting their tools too much.
```

#### E2 (L3-12). Back the "standard practice" of redacting secrets
File `03-checks-in-the-loop/03-what-a-failed-check-does.mdx`, lines 106-109. Current:
```
One repair meets both conditions often enough to be standard practice:
redacting a secret from a tool result before the model reads it. A key has a
recognisable shape, so finding it is certain. Replacing it with
`[REDACTED KEY]` keeps the rest of the result usable, and says what was done.
```
Proposed:
```
One repair meets both conditions often enough to be standard practice:
redacting a secret from a tool result before the model reads it. NVIDIA's NeMo
Guardrails, for example, can
[mask sensitive data](https://docs.nvidia.com/nemo/guardrails/configure-guardrails/guardrail-catalog/third-party/presidio)
in the user's input, the model's output and retrieved text, and carry on. A key
with a known format has a recognisable shape, so finding it is certain.
Replacing it with `[REDACTED KEY]` keeps the rest of the result usable, and
says what was done.
```
("A key with a known format" softens "a key has a recognisable shape … so finding it is certain". Keys without a fixed prefix aren't certain to find.)

#### E3 (L3-17). Soften "framework documentation rarely spells them out"
File `03-checks-in-the-loop/04-parallel-checks-and-tripwires.mdx`, lines 646-647. Current:
```
Three things matter, and framework documentation rarely spells them out, so
they're worth deciding on purpose:
```
Proposed:
```
Frameworks don't always decide these for you. The OpenAI Agents SDK, for one,
treats a guardrail that raises an exception as giving no verdict and ends the
run, which is failing closed, but its guardrails have no time limit and no
way to fail open. So three things are worth deciding on purpose:
```
(Source, `docs/guardrails.md`: "When the guardrail function raises an exception instead of returning a tripwire result, the runner treats the verdict as unknown… before surfacing the guardrail exception." No timeout or fail-open option appears on the guardrails page. The lead may want to keep the original sentence if this feels like too much detail; at minimum, "rarely spells them out" should become "don't always spell them out".)

Optional (L3-18), in the same file around line 649: link "time limit" to Lesson 8's "Slow is a failure too" subsection, `/06-reliability/08-graceful-degradation/05-a-time-budget-for-the-run/#slow-is-a-failure-too`. Verify the anchor in the built HTML first.

#### E4 (L9-1). "Meta's security team" → "Meta"
File `09-restricting-after-reading/01-tracking-what-the-session-has-read.mdx`, line 204. Current:
```
Meta's security team gave the idea a working form in its
```
Proposed:
```
Meta gave the idea a working form in its
```

#### E5 (L9-2). Oso: replace the dead link and match the archived wording (or cut)
Same file, lines 210-215. Current:
```
An agent may be allowed all three kinds of tool, as long as no single session
uses all three. Some security tooling for agents enforces this: Oso's
agent documentation, for example, describes its decisions as
[stateful](https://www.osohq.com/docs/oso-for-agents/use-cases), depending on
what happened earlier in the same session, such as whether the agent recently
took in untrusted content.
```
Proposed:
```
An agent may be allowed all three kinds of tool, as long as no single session
uses all three. Some security tooling for agents enforces this. Oso's agent
documentation, for example, said early in 2026 that
["whether a tool call is safe often depends on what happened earlier in the session"](https://web.archive.org/web/20260218192026/https://www.osohq.com/docs/oso-for-agents/use-cases),
and let a team deny a call that completes all three, or send it for approval.
```
Alternative: delete the Oso sentences and end the paragraph at "…as long as no single session uses all three." Oso's current docs no longer describe this, so a vendor example that has since disappeared is weak support.

#### E6 (L9-3, L9-4). Back the taint-tracking definition with FIDES; label the preprints
Same file, lines 264-274. Current:
```
What this guard does has a name in computer security: **taint tracking**, a
simple form of *information-flow control*. Data is labelled by where it came
from, anything computed from it inherits the label, and the labels are
checked where the data is used. The guard's version is coarse. It keeps one
set of labels for the whole session, so one untrusted email taints
everything that follows. Research systems label each value instead. CaMeL,
from [the third concept](/06-reliability/09-restricting-after-reading/03-designs-that-keep-untrusted-text-away/#dual-llm),
and Microsoft's
[FIDES](https://arxiv.org/abs/2505.23643) (Costa et al., 2025) track labels
per value, so reading an untrusted email doesn't taint an unrelated lookup.
The price is a planner or interpreter that tracks every value.
```
Proposed:
```
What this guard does has a name in computer security: **taint tracking**, a
simple form of *information-flow control*. Data is labelled by where it came
from, anything computed from it inherits the label, and the labels are
checked where the data is used. The guard's version is coarse. It keeps one
set of labels for the whole session, so one untrusted email taints
everything that follows. Microsoft's
[FIDES](https://arxiv.org/abs/2505.23643) preprint (Costa et al., 2025)
describes exactly this design, and its limit: untrusted data "immediately
taints the conversation history, restricting the tools that can be called
later". Research systems label each value instead. CaMeL, from
[the third concept](/06-reliability/09-restricting-after-reading/03-designs-that-keep-untrusted-text-away/#dual-llm),
and FIDES itself track labels per value, so reading an untrusted email doesn't
taint an unrelated lookup. The price is a planner or interpreter that tracks
every value.
```

#### E7 (L9-5). Rule of Two "blocks" → what Meta actually asks for
File `09-restricting-after-reading/02-restricting-tools-once-the-session-has-read.mdx`, lines 178-180. Current:
```
Meta's Rule of Two, applied literally, blocks a call only when it would give
the session all three properties at once: untrusted input, private data, and
a way to change state or send data out. Here's what that lets through:
```
Proposed:
```
Meta's Rule of Two, applied literally, only steps in when a call would give
the session all three properties at once: untrusted input, private data, and
a way to change state or send data out. (Meta then asks for a person's
approval; the demo simply denies.) Here's what that lets through:
```

#### E8 (L9-6). Add Meta's reply to Willison. Wording depends on the "Needs a decision" item below
Same file, after line 190 ("…it only needs the agent to be allowed to act on what it read."). Proposed addition:
```
Meta's answer was that the second property covers access to any sensitive
system, not just private data, so an agent registry that matters would count.
That works only if someone labels every such system correctly. The rule below
doesn't depend on it.
```
(Source: Willison's post, Update 2, quoting Mick Ayzenberg: "the framework would describe access to any sensitive system as part of the [B] circle, not only private systems or private data.")

#### E9 (L9-7). Back "people do badly" and "some systems choose approval"
Same file, lines 218-224. Current:
```
Denying the last combination, rather than asking a person, is a design
choice worth explaining. Approving an outgoing message after the session has
read both untrusted text and private data means checking every byte of it for
something that shouldn't leave, which is a job people do badly. The safer
answer is to refuse, and do the sending from a fresh session that hasn't read
the untrusted content. Some systems choose approval instead; what matters is
that the choice is made on purpose.
```
Proposed:
```
Denying the last combination, rather than asking a person, is a design
choice worth explaining. Approving an outgoing message after the session has
read both untrusted text and private data means checking every byte of it for
something that shouldn't leave, which is a job people do badly. CaMeL's
authors warn that frequent prompts leave users "desensitized to security
prompts" so that they "may inadvertently approve malicious actions". The
safer answer is to refuse, and do the sending from a fresh session that
hasn't read the untrusted content. Some systems choose approval instead, as
Meta's Rule of Two does for this case; what matters is that the choice is
made on purpose.
```
(Quote: CaMeL v2 §9.2, "This can lead to user fatigue, where users become desensitized to security prompts and may inadvertently approve malicious actions". The CaMeL link sits in the next concept, so the lead may prefer "Google DeepMind's CaMeL authors" or a direct link to https://arxiv.org/abs/2503.18813.)

#### E10 (L9-8). Beurer-Kellner affiliations, and label it a preprint
File `09-restricting-after-reading/03-designs-that-keep-untrusted-text-away.mdx`, lines 83-86. Current:
```
Beurer-Kellner and thirteen co-authors from Google, Microsoft, IBM, ETH
Zurich and EPFL collected these designs in
[*Design Patterns for Securing LLM Agents against Prompt Injections*](https://arxiv.org/abs/2506.08837)
(2025). They describe six patterns, each enforcing some isolation between
```
Proposed:
```
Beurer-Kellner and thirteen co-authors, from Invariant Labs, IBM, Google,
Microsoft, ETH Zurich, EPFL and others, collected these designs in
[*Design Patterns for Securing LLM Agents against Prompt Injections*](https://arxiv.org/abs/2506.08837),
a 2025 preprint. They describe six patterns, each enforcing some isolation between
```

#### E11 (L9-13). Link Willison's dual LLM post
Same file, line 131. Current:
```
Simon Willison proposed this in 2023. Two models play different roles:
```
Proposed:
```
Simon Willison
[proposed this in 2023](https://simonwillison.net/2023/Apr/25/dual-llm-pattern/).
Two models play different roles:
```

#### E12 (L9-15). CaMeL figure: say it's the revised version, and give the venue
Same file, lines 148-153. Current:
```
from. Debenedetti et al.'s
[CaMeL](https://arxiv.org/abs/2503.18813) (2025) built it. Untrusted data can
never change the program's flow, and a notion of capabilities blocks private
data from leaving by routes the policy doesn't allow. On the AgentDojo
benchmark, CaMeL solved 77% of tasks with provable security, against 84% for
an undefended agent: a real but modest cost in capability.
```
Proposed:
```
from. Debenedetti et al.'s
[CaMeL](https://arxiv.org/abs/2503.18813), from Google, Google DeepMind and
ETH Zurich (IEEE SaTML 2026), built it. Untrusted data can never change the
program's flow, and a notion of capabilities blocks private data from leaving
by routes the policy doesn't allow. On the AgentDojo benchmark, the revised
version of the paper reports CaMeL solving 77% of tasks with provable
security, against 84% for an undefended agent: a real but modest cost in
capability.
```
(v1 said 67%. The quiz at line 253 uses 77%/84%; leave it. I couldn't confirm that the SaTML version prints 77%/84%, because IEEE CSDL didn't load. If the lead can't confirm it, drop "(IEEE SaTML 2026)" or keep it and cite arXiv v2 for the figure.)

#### E13 (L9-17). Back the "labels only accumulate" cost with FIDES
Same file, lines 168-171. Current:
```
The session guard from the previous concepts has a cost those concepts
didn't dwell on. Labels only accumulate, so after one untrusted read, every
later action in that session needs a person or is refused. For an agent whose
job is to read outside text and then act, that's most of its actions.
```
Proposed:
```
The session guard from the previous concepts has a cost those concepts
didn't dwell on. Labels only accumulate, so after one untrusted read, every
later action in that session needs a person or is refused. For an agent whose
job is to read outside text and then act, that's most of its actions. The
FIDES authors call this the "fundamental limitation" of tracking labels for
the whole conversation, and built their planner to get around it.
```

#### E14 (L9-18, optional). Map-reduce: add the reduce options the paper gives
Same file, lines 174-177. Current:
```
can't act, and only something narrow comes back. Beurer-Kellner et al.'s
paper calls one version **LLM map-reduce**: each untrusted item goes to its
own isolated session, and what comes out is constrained so it can't carry
instructions.
```
Proposed:
```
can't act, and only something narrow comes back. Beurer-Kellner et al.'s
paper calls one version **LLM map-reduce**: each untrusted item goes to its
own isolated session, with no tools that could do harm, and what comes out is
either combined by plain code or constrained, a number checked by a regex,
say, so it can't carry instructions.
```

#### E15 (L9-19). Context-minimization: say what the paper aims it at
Same file, lines 191-194. Current:
```
The same paper's **context-minimization** pattern is a cousin: once the
untrusted content has done its job, remove it from the context before the
next step, so later decisions are made without it. With the session guard,
that means starting the next step in a fresh session. The rule that covers
```
Proposed:
```
The same paper's **context-minimization** pattern is a cousin. The paper aims
it at injections in the user's own prompt: once the prompt has been turned
into, say, a database query, it's removed from the context, so the reply is
written without it. The same move works for any untrusted text: once it has
done its job, drop it before the next step. With the session guard, that
means starting the next step in a fresh session, which is also what Meta's
Rule of Two points to when a task needs all three properties. The rule that covers
```
(Meta: "If an agent requires all three without starting a new session (i.e., with a fresh context window)…")

#### E16 (L10-4). ToolEmu: what it did and what 68.8% measures
File `10-layered-checks/03-what-each-layer-earns.mdx`, lines 314-317. Current:
```
malformed responses among the events to vary. For agents, Ruan et al.'s
[ToolEmu](https://arxiv.org/abs/2309.15817) (ICLR 2024) had a language model
play the tools, including their failures. Of the failures it found in
agents, 68.8% were judged ones that would really happen with real tools.
```
Proposed:
```
malformed responses among the events to vary. For agents, Ruan et al.'s
[ToolEmu](https://arxiv.org/abs/2309.15817) (ICLR 2024) had a language model
play the tools, and set up the unusual situations in which an agent is most
likely to do something risky. People then checked the risky actions it
flagged: 68.8% were real failures that could happen with real tools, and the
rest were false alarms or flaws in the emulation.
```
(68.8% is the adversarial emulator's precision; the standard emulator scored 72.5%. The lead could add "(72.5% without the adversarial set-up)" if wanted. Nothing else in the tree uses 68.8% for ToolEmu.)

#### E17 (L10-2, optional). Production versus a test suite
Same file, after line 312 ("…and checking that it still behaves as it should."). Optional addition:
```
Netflix runs these experiments in production. What follows is the offline
version, closer to what Netflix calls failure injection testing: make calls
fail on purpose and check that the system degrades gracefully.
```
(Basiri: "we also run Failure Injection Testing (FIT) exercises where we cause requests between Netflix services to fail and verify that the system degrades gracefully". The principles list "Run Experiments in Production".)

#### Other places the same figures appear, outside this audit's lessons
- **`08-graceful-degradation/02-partial-answers.mdx:156-158`**: "found that when a tool failed without saying so, models sometimes stated a value they didn't have, up to 45% of the time for some kinds of failure." 45.3% is Sethi's *dishonesty* rate: fabrication **or** a made-up refusal reason (the abstract and §5.2 Table 3 both report DR). It isn't the rate of stating a value. The main grid also used one model. Proposed:
  ```
  found that when a tool failed without saying so, the model sometimes stated
  a value it didn't have, or made up a reason for not answering: up to 45% of
  the time for redacted values.
  ```
  (This is a prose edit, not in a demo string. It's in Lesson 8, so the lead should check with whoever audits it.)
- `04-verifying-claims/04-figures-traced-to-tool-results.mdx:168-172` describes Sethi correctly ("sometimes stated a value anyway"). Keep.
- AgentDojo 69.0% → 41.5% also appears in `02-reliability-tradeoffs/01-four-things-every-technique-trades.mdx:80,85,144` and `02-reliability-tradeoffs/06-recap-practice.mdx:206`. I verified it here against v3 Table 5, so those stay consistent.
- Kapoor's 89.6/92.0 has its primary home in `02-reliability-tradeoffs/03-equal-budgets-need-a-stated-unit.mdx`. It checks out against arXiv v1; the TMLR 2025 version is unchecked.

### 3. Needs a decision

1. **Willison's "gap" in the Rule of Two versus Meta's reply (L9 C2, "The Rule of Two, and where it isn't enough").** The concept teaches that two-of-three lets "untrusted input + change state" through, and uses that to motivate a stricter rule. Meta's author replied, in Willison's own post, that the second property covers *any sensitive system*. On that reading, changing a production agent registry already counts, and the gap narrows to "which systems did you label sensitive". Meta also relabelled that overlap from "safe" to "lower risk". What the concept teaches, the stricter table, is still sound, but the framing presents Willison's reading as settled. **Recommendation:** keep the stricter rule, and add E8's three sentences so learners see both readings. The quiz (09/02:258, "Willison pointed this out…") and the recap question (09/04:258) can stay as they are.
2. **ToolEmu as evidence in the "Breaking the tools on purpose" subsection (L10 C3).** ToolEmu doesn't inject tool faults. It emulates tools to find an agent's *risky actions*. It still supports the subsection's broader point, finding failures nobody scripted by simulating the environment, but not "break the tools". **Recommendation:** keep it, reworded per E16, so it reads as a related technique rather than an example of fault injection. The alternative, cutting it and leaving Basiri and the Principles of Chaos as the backing, would also be fine.

### 4. Counts

- Claims inventoried: 45 rows (39 with a source, 6 unsourced), plus 1 our-data row.
- **Verified: 36.** This includes 6 marked "2026-09-30 review" and rechecked today: L3-2, L3-13, L3-15, L3-16, L10-3, and the OpenAI rows.
- **Contradicted: 1.** L9-8, the Beurer-Kellner affiliation list.
- **Not reachable: 1.** L9-2, the Oso link, which now redirects. The archived copy supports the substance but not the wording.
- **Unsourced: 6.** L3-12, L3-17, L3-18, L9-3, L9-7, L9-17.
- **Recommended re-labels: 7.** L3-3, L9-1, L9-4, L9-5, L9-15, L9-19, L10-4.
- **Recommended replacements: 2.** L9-2 and L9-8.
- **Recommended additions of backing or links: 6.** L3-12, L3-17 (soften, citing the SDK), L9-3, L9-7, L9-13, L9-17. L3-18 is optional.
- **Cut: 0.**
- **Cross-lesson note: 1.** Lesson 8's "up to 45%" conflates dishonesty with stating a value.
- **Priority leftovers from the syllabus:**
  - The Beurer-Kellner map-reduce definition is verified.
  - The context-minimization definition is verified, but the paper aims it at the user's prompt (E15).
  - Basiri et al. are verified: arXiv plus the Crossref IEEE record, IEEE Software 33(3):35–41.
  - ToolEmu's 68.8% is verified: the same figure in v1 and v2, ICLR 2024. It is the adversarial emulator's precision on human-validated risky agent actions, not tool failures (E16).
