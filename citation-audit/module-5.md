# Citation audit: Module 5 (RAG Systems)

Audited 2026-09-30, on branch `citation-audit/module-5`. Four read-only
subagents did the inventory, verification and recommendations, three or four
lessons each. Their full reports follow, one section per group of lessons.
The lead applied the edits and re-read the primary source for every new
quote, figure or vendor behaviour before it went on a page.

Every edited text is prose, a quiz question, option or explanation. No
demo, exercise, starter, reference or test string changed, so nothing needed
re-running in Pyodide. `npm run build` passes (523 pages), and no internal
links were added.

## What happened to each proposed edit

| Report | Applied | Held for a decision | Skipped (optional) |
|---|---|---|---|
| A: L1–L4 | E1, E2, E4–E12, E14, E16–E22 (E14's OpenAI link points to the cookbook that shows the error) | none | E3 (cache pricing), E15 (Jina quote), E23 (Qdrant 1-bit caveat), the optional links in E10 and E16 |
| B: L5–L8 | E1–E24 | none | the optional HyDE ACL link |
| C: L9–L12 | A1, A3, A6–A8, B1+B4, B5, B6, B11, B16, B17, C1–C3/C4, C6, C8+C9, D1, D4, D6+D7, D9 (prose and quiz card), D11, D13, D15 | none | the optional `graph.json` wording |
| D: L13–L15 | E2–E14 (E7's MSRC sentence reworded so it still leads into the demo; E10 quotes only the bge card's version-independent advice; E13 keeps "thirty to sixty" and adds Anthropic's line) | E1 and its quiz rewording (filtering after ranking) | E15 (Elasticsearch aliases) |

## Totals across the module

- **Verified:** 138, plus 4 partly verified.
- **Contradicted:** 8, plus 1 claim its linked source doesn't support.
  - Hosted embedders mostly truncate over-long text by default; only
    OpenAI rejects it.
  - Chroma's report makes no "semantic chunking only where the complexity
    is acceptable" recommendation.
  - nDCG's log2(i+1) discount isn't Järvelin and Kekäläinen's original.
  - Sun et al.'s sliding window was for token limits, not order
    sensitivity.
  - Anthropic now caches automatically, and OpenAI has breakpoints.
  - LightRAG writes per-entity summaries, just no community summaries.
  - EchoLeak's arXiv paper isn't Aim Security's.
  - OpenFGA offers filtering before and after as alternatives, not as two
    layers.
  - GraphRAG's update behaviour was cited to a page that doesn't describe
    it (not supported).
- **Not reachable:** 0 (a few publishers block scripts; the Wayback Machine
  or Crossref covered them).
- **Re-labelled:** 26 (venues, preprints, vendor figures, our data's case
  counts and the models that wrote it).
- **Replaced:** 7.
- **Sources added:** 52, mostly industry anchors for practice the lessons
  stated without a source.
  - Vendor and framework docs: OpenAI file search, LangChain, LlamaIndex,
    Elasticsearch and Lucene, Azure AI Search, Weaviate, Qdrant, Vespa,
    pgvector, Pinecone, Cohere, Voyage.
  - Anthropic's caching, prompting and hallucination guides.
  - OWASP, Microsoft's MSRC, GPTCache and LiteLLM.
  - Papers: Greshake et al., Ma et al., Nogueira and Cho, MS MARCO, SPLADE,
    ColBERT and Leiden.

## Needs a decision

1. **Is filtering after ranking wrong, or only worse? (L13 C1, and the
   recaps.)** The lesson says filtering "has to happen before every stage
   that picks a top k". The course's own demo backs this as a quality
   point: 20 questions come back short. But OpenFGA, the main industry
   source for permission-aware RAG, calls filtering afterwards "the most
   common approach" and suggests fetching 2–3× the candidates. Both are
   equally safe, as long as filtering happens before the model sees
   anything. Recommendation: keep filtering first as the default, but name
   filtering afterwards as common and say what it costs (report D, E1, with
   two quiz rewordings). The exercise doesn't change.

**Applied, but worth a look:**
- RRF's "almost nothing to tune" now notes Bruch et al.'s finding that a
  separate k per list is sensitive, which is a form of weighting (L6 C3).
- The GraphRAG `update` quiz card now teaches only what Microsoft
  published (L12 C5).
- The prompt-caching paragraph now describes both providers' current
  behaviour (L10 C1).

## Not recorded

- Which Claude version wrote the model-written questions, chunk contexts,
  query variants and graph extraction. The owner confirmed no record was
  kept, so the pages and data files keep saying "Claude" without a version.

---

## Report: Module 5 citation audit, Lessons 1–4 (subagent A)

Scope: `src/content/modules/05-rag-systems/{01-why-retrieval,02-measuring-retrieval,03-chunking,04-search-by-meaning}/*.mdx`. Every .mdx was read in full (intros, concepts, quiz explanations, recaps, exercise task text).
Downloads and extracted text are in `scratchpad/audit/m5A/`.

Short file names below: L1C1 = `01-why-retrieval/01-what-the-model-cant-know.mdx`, L1C2 = `01-why-retrieval/02-what-pasting-everything-costs.mdx`, L1C3 = `01-why-retrieval/03-which-answers-better.mdx`, L1R = `01-why-retrieval/05-recap-practice.mdx`; L2C2 = `02-measuring-retrieval/02-what-a-labelled-query-set-is.mdx`, L2C3 = `02-measuring-retrieval/03-the-metrics.mdx`, L2C4 = `02-measuring-retrieval/04-reading-the-numbers-honestly.mdx`, L2C5 = `02-measuring-retrieval/05-when-the-labels-are-wrong.mdx`; L3C1 = `03-chunking/01-why-documents-are-split.mdx`, L3C2 = `03-chunking/02-fixed-size-splitting.mdx`, L3C3 = `03-chunking/03-structure-aware-splitting.mdx`, L3C4 = `03-chunking/04-comparing-chunkings-fairly.mdx`; L4C2 = `04-search-by-meaning/02-queries-arent-documents.mdx`, L4C4 = `04-search-by-meaning/04-what-a-vector-store-adds.mdx`.

**What checked out.** The course's own measured results are labelled as ours throughout: the 43 scored questions, 20 model-written questions, bge-small or MiniLM named, and the FAISS run named with faiss-cpu 1.15.1. Every internal statistic we recomputed matches:
- sign tests: 5–1 gives 0.219; 8–3 gives 0.227 (~0.23); 2–0 gives 0.50; 2–1 gives 1.00;
- Wilson intervals: 19/43 gives 0.304–0.589; 4/10 gives 0.168–0.687; 190/430 gives 0.396–0.489, which is 0.33 of the width;
- one question is 2.33 points;
- cost table: 232,256 / 2,015 = 115×; the cached single question is 290,316;
- storage: 1,968×384×4 B = 3.0 MB; 10M×384 = 3.84 billion multiplications; 100M×768 B = 76.8 GB; 1M×384×4 B = 1.5 GB.

### 1. Claim table

| ID | file:line | claim (trimmed) | source given | kind | verdict | evidence (primary source) | recommendation |
|---|---|---|---|---|---|---|---|
| A1 | L1C1:96-97 | "Ovadia and colleagues (2023) found retrieval beat unsupervised fine-tuning on the documents at adding new knowledge, across several models and tasks" | arXiv 2312.05934 | effectiveness | VERIFIED | arXiv v3 (30 Jan 2024), abstract: "while unsupervised fine-tuning offers some improvement, RAG consistently outperforms it, both for existing knowledge encountered during training and entirely new knowledge." Models: Llama2 7B, Mistral 7B, Orca2 7B (Table 1). Published EMNLP 2024 main, pp. 237–250 (aclanthology.org/2024.emnlp-main.15) | re-label: cite the published EMNLP 2024 version |
| A2 | L1C1:148-151 | "under 3% of the text, which is typical: the pages that matter most … are usually a small part" | none | practice | UNSOURCED | — | soften (drop "which is typical") |
| A3 | L1C2:15-16, 78-79, 107-115; L1R:246-252 | cached reads 0.1×, writes 1.25×; five-minute default; one hour for 2× | "one provider's" (Anthropic named at :110) | fact | VERIFIED | docs.claude.com prompt caching: "5-minute cache write tokens are 1.25 times the base input tokens price / 1-hour cache write tokens are 2 times … / Cache read tokens are 0.1 times the base input tokens price (see the table footnote for per-model exceptions)"; "By default, the cache has a 5-minute lifetime." Footnote: "Cache hits and refreshes on Claude Fable 5.1 and Claude Mythos 5.1 are priced at 0.025x … on Claude Opus 5.5 are priced at 0.05x" | keep; optionally add one sentence on the lower read multipliers (edit E3) |
| A4 | L1C2:142-143 | "largest current windows, which hold a million tokens or more" | none | fact | VERIFIED | Anthropic models overview: Fable 5.1, Opus 5.5 and Sonnet 5.5 have "Context window 1M tokens" | keep |
| A5 | L1C3:43-47 | Li et al.: "nine question-answering datasets with three models … 300-word chunks, … five most similar" | arXiv 2407.16833 | fact | VERIFIED, with a nuance | v2 (17 Oct 2024): "we divide long contexts into chunks of 300 words, and select the top k chunks (default k = 5)"; "across the nine datasets, using three recent LLMs". One of the nine (QMSum, "Sum") is a summarization dataset | soften: "nine long-context datasets, eight of them question answering" |
| A6 | L1C3:49-52 | averages 49.7/37.3, 48.7/32.6, 32.1/30.3 | same | effectiveness | VERIFIED | Table 1 Avg: LC 49.70 / RAG 37.33 (Gemini-1.5-Pro), 48.67 / 32.60 (GPT-4O), 32.07 / 30.33 (GPT-3.5-Turbo) | keep |
| A7 | L1C3:53-55 | two datasets averaging ~147,000 words; GPT-3.5-Turbo with 16k did better with retrieval | same | effectiveness | VERIFIED | "two longer datasets from ∞Bench (i.e., En.QA and En.MC), where RAG achieves higher performance than LC for GPT-3.5-Turbo … (147k words on average) … (16k)" | keep |
| A8 | L1C3:56-57 | 63% of predictions identical | same | effectiveness | VERIFIED | "for 63% queries, the model predictions are exactly identical" | keep |
| A9 | L1C3:58-63 | four failure kinds | same | effectiveness | VERIFIED | "(A) … multi-step reasoning … (B) The query is general … (C) … long and complex … (D) The query is implicit" (§5 and the Appendix prompt) | keep |
| A10 | L1C3:108-113, L1C3 quiz :190 | passkey 80.3% vs 65.3%; reworded 4.6% vs 69.3% | same | effectiveness | VERIFIED | "RAG achieves 80.34% accuracy, outperforming LC, which gets 65.25% … 'What is the special token hidden inside the texts', RAG accuracy sharply drops to only 4.58%, while LC keeps roughly the same (69.32%)" | keep |
| A11 | L1C3:151-155; L1R:285 | Self-Route: retrieval step answered 82%, cost cut 65%, close to LC | same | effectiveness | VERIFIED | "most queries can be solved by the first RAG-and-Route step (e.g., 82% for Gemini-1.5-Pro)"; "the cost is reduced by 65% for Gemini-1.5-Pro". Table 1: Self-Route 46.41 vs LC 49.70 | keep |
| A12 | L1C3:65-72 | LaRA: HKUST, Tongyi Lab, Penn State; 2,326 questions; novels, financial reports, papers; 32k/128k; eleven models; hybrid retrieval | arXiv 2502.09977 | fact | VERIFIED | v2 (5 Mar 2025): "1The Hong Kong University of Science and Technology 2Tongyi Lab, Alibaba Group 3Penn State University"; "2326 test cases"; "seven open-source and four proprietary LLMs"; "hybrid search strategy combining embedding similarity and BM25". The ICML 2025 (PMLR v267) text is identical on these points | keep |
| A13 | L1C3:74-80 | strongest models favour LC; LC +2.4 at 32k, RAG +3.68 at 128k; weaker models gain most | same | effectiveness | VERIFIED | "at a 32k context length, LC achieved an average accuracy 2.4% higher than RAG across all models … with a 128k context length … RAG outperforming LC by 3.68%"; "proprietary models consistently favor LC at both context lengths"; "RAG offers an effective alternative for smaller or weaker models" | keep |
| A14 | L1C3:81-83; L1R:266 | comparison trailed "by about 15 points" | same | effectiveness | VERIFIED | "The average gap reaches 15.22% at 32k and 14.30% at 128k" | keep |
| A15 | L1C3:84-87 | hallucination detection: RAG better by 10.4 (32k) and 22.4 (128k) | same | effectiveness | VERIFIED | Table 2 Avg GAP (LC−RAG), Hallucination: −10.38 (32k), −22.36 (128k) | keep |
| A16 | L1C3:88-90 | only full text showed lost in the middle | same | effectiveness | VERIFIED | §4.6: "LC LLMs exhibit a decrease in accuracy when the answer is closer to the center … we do not observe a clear correlation between RAG performance and the position" | keep |
| A17 | L1C3:92-95 | citation line: "(EMNLP 2024)"; LaRA "(2025)" with arXiv link and short title | — | citation | VERIFIED (venues) | 2407.16833 comment: "Accepted to EMNLP 2024 industry track". LaRA was published at ICML 2025 (PMLR 267:36846-36867, proceedings.mlr.press/v267/li25dv.html), full title "…Long-Context LLMs – No Silver Bullet for LC or RAG Routing"; figures unchanged between v1, v2 and ICML | re-label (edit E2) |
| B1 | L2C2:243-246 | "a common shortcut is to have a model write them: show it a chunk, ask for a question the chunk answers" | none | practice | UNSOURCED | LlamaIndex retrieval-eval docs: "We use our generate_question_context_pairs to generate a set of (question, context) pairs … This uses the LLM to auto-generate questions from each context chunk." | lead with an industry source (LlamaIndex) |
| B2 | L2C2:251-255 | Lee, Chang and Toutanova (2019): BM25 enough where the asker knew the answer; learned retrieval up to 19 points EM better for genuine seekers | none (unlinked) | effectiveness | VERIFIED | arXiv 1906.00300 v3 (ACL 2019), abstract: "On datasets where the questioner already knows the answer, a traditional IR system such as BM25 is sufficient. On datasets where a user is genuinely seeking an answer, we show that learned retrieval is crucial, outperforming BM25 by up to 19 points in exact match." | keep; add link |
| B3 | L2C2:262-264 | "adds the instruction generators use against this bias" | none | practice | UNSOURCED | No generator's docs found that use this instruction (the LlamaIndex default prompt doesn't) | soften |
| B4 | L2C2:257-266, :273-282; L2R:323 | 20 model-written questions; 18/20 vs 0/20; 61%/45%/9% | ours (`generated-questions.json`) | our data | LABELLED | Page says "Claude wrote them for the course", with 20 sections and the prompts. The data file records only "written_by": "Claude, for the course…" and no model version | keep. If the model version is known, add it to the prose and the JSON; otherwise leave as is |
| B5 | L2C3:147-152 | textbook recall counts every relevant item in the collection | none | fact | VERIFIED | Manning et al., *Introduction to IR*, §8.3: "Recall (R) is the fraction of relevant documents that are retrieved" | keep (optional link) |
| B6 | L2C3:156-158 | MRR is "the score the TREC question-answering track introduced in 1999" | none | fact | VERIFIED in substance; "introduced" not stated | Voorhees & Tice, "The TREC-8 Question Answering Track" (LREC 2000): "the score computed for a submission was the mean reciprocal rank … the reciprocal of the rank at which the first correct response was returned, or 0 if none of the five responses contained a correct answer" | soften "introduced" to "ranked systems by"; add link |
| B7 | L2C3:230-232 | "LlamaIndex's retrieval evaluator reports [hit rate] next to MRR" | none | fact | VERIFIED | LlamaIndex docs: `metrics = ["hit_rate", "mrr", "precision", "recall", "ap", "ndcg"]`; `RetrieverEvaluator.from_metric_names(metrics, …)` | keep; add link |
| B8 | L2C3:235-240 | nDCG (Järvelin and Kekäläinen, 2002): grade "divided by log2 of its position plus one: first place counts in full, second about 0.63, fifth about 0.39" | none | fact | CONTRADICTED (detail) | J&K 2002, TOIS 20(4), eq. 2: "DCG[i] = CG[i], if i < b; DCG[i−1] + G[i]/log_b i, if i ≥ b … we do not apply the discount case for ranks less than the logarithm base". With b = 2, positions 1 and 2 both count in full, and position 5 counts 1/log2 5 = 0.43. The log2(position+1) discount is the later form that most tools use (e.g. LlamaIndex's ndcg). The demo `RANK_DEMO` uses log2(position+1) and doesn't need changing | re-label: say the page uses the common form (edit E8) |
| B9 | L2C3:243-253 | RAGAS context recall (claims from the reference, share supported) and context precision (precision at each relevant position ÷ relevant retrieved) | none | fact | VERIFIED | docs.ragas.io: "the reference is broken down into claims, and each claim is analyzed to determine whether it can be attributed to the retrieved context"; "Context Precision@K = Σ(Precision@k × v_k) / Total number of relevant items in the top K results" | keep; add link |
| B10 | L2C4:152-155; L2R | sign test on 5–1 gives 22% | ours | our data | VERIFIED (recomputed) | 2·(6+1)/64 = 0.219 | keep |
| B11 | L2C4:170-172 | sign test = exact McNemar; "the standard test for two systems scored yes or no on the same items" | none | fact | UNSOURCED (correct) | Standard statistics: the exact McNemar test is a binomial test on the discordant pairs | keep (no citation needed) |
| B12 | L2C4:210-222; L2R:389 | Wilson intervals 0.30–0.59, 0.168–0.687, 0.396–0.489; "about a third of the width" | ours | our data | VERIFIED (recomputed) | 0.304–0.589; 0.168–0.687; 0.396–0.489; width ratio 0.33 | keep |
| B13 | L2C5:84-89 | pooling, "used by large evaluations such as TREC for decades" | none | practice | VERIFIED | Büttcher et al. 2007 §1: "several different retrieval systems are run … By taking the top p documents from each ranking (usually 50 ≤ p ≤ 100), a set of to-be-judged documents is built … referred to as pooling"; Zobel 1998: "With such collections it is necessary to use techniques such as pooling" | keep (the links added at B14 and B15 cover it) |
| B14 | L2C5:124-126 | TREC pools "reasonably reliable for comparing the systems that took part (Zobel, 1998)" | none (unlinked) | effectiveness | VERIFIED | Zobel, SIGIR 1998, abstract: "the measured relative performance of systems appears to be reliable, but that recall is overestimated: it is likely that many relevant documents have not been found" | keep; add link |
| B15 | L2C5:126-128 | "pooled evaluation is inherently biased against systems that didn't contribute to the pool (Büttcher and colleagues, 2007)" | none (unlinked) | effectiveness | VERIFIED | Büttcher, Clarke, Yeung, Soboroff, SIGIR 2007, abstract: "Information retrieval evaluation based on the pooling method is inherently biased against systems that did not contribute to the pool of judged documents." | keep; add link |
| B16 | L2C5:150-153; L2C5 quiz :70 | Rahmani and colleagues (2025): GPT-4 labels vs human assessors on a TREC passage-ranking collection; model more lenient | none (unlinked) | effectiveness | VERIFIED | Rahmani, Ramineni, Yilmaz, Craswell, Mitra, "Towards Understanding Bias in Synthetic Data for Evaluation", arXiv 2506.10301 v2 (CIKM 2025). Data: TREC DL 2023 passage ranking. "human annotators consistently assign a higher proportion of label 0 (irrelevant), indicating a more conservative approach … GPT-4 more frequently selects label 1 (relevant) … while GPT-4 is more lenient in identifying weak relevance, it is more hesitant to assign strong relevance scores" | keep; add link (the course's wording matches) |
| B17 | L2C5:156-159 | Zheng and colleagues (2023): judges swayed by order and prefer longer answers | none (unlinked) | effectiveness | VERIFIED | arXiv 2306.05685 v4 (NeurIPS 2023 D&B), §3.3: "Position bias is when an LLM exhibits a propensity to favor certain positions over others"; "Verbosity bias is when an LLM judge favors longer, verbose responses" | keep; add link |
| B18 | L2C5:161-162 | "signs of judges favouring answers written by their own model" | same | effectiveness | VERIFIED (hedged correctly) | "GPT-4 favors itself with a 10% higher win rate; Claude-v1 favors itself with a 25% higher win rate … our study cannot determine whether the models exhibit a self-enhancement bias" | keep |
| B19 | L2C5:169-172 | Thomas, Spielman, Craswell and Mitra (2024), at Bing: picked the prompt by agreement with careful searcher feedback, then labelled at scale | none (unlinked) | practice | VERIFIED | arXiv 2309.10621 v3 (May 2024), abstract: "It takes careful feedback from real users … and develops an large language model prompt that agrees with that data. We present ideas and observations from deploying language models for large-scale relevance labelling at Bing" | keep; add link |
| C1 | L3C1:97-99; L4C2:163-167 | bge-small reads 512 tokens; all-MiniLM-L6-v2 reads 256 word pieces | none | fact | VERIFIED | BGE model card table: "bge-small-en-v1.5 \| 384 \| 512"; `sentence_bert_config.json`: "max_seq_length": 512. MiniLM card: "By default, input text longer than 256 word pieces is truncated." | keep |
| C2 | L3C1:99-101; L3C1 quiz :171; L3R:424 | past the limit, text is "usually truncated silently" | none | fact | VERIFIED (for the open models on the page) | MiniLM card as above (sentence-transformers truncates without an error) | keep |
| C3 | L3C1:109-111 | "hosted services usually reject text that's too long, or truncate only when asked, rather than cutting it silently" | none | fact | CONTRADICTED | Voyage embeddings API: "truncation boolean Defaults to true … If true, an over-length input texts will be truncated … If false, an error will be raised". Cohere embed API: "truncate … Defaults to END … If NONE is selected … an error will be returned." Vertex AI text-embeddings API: "AUTO_TRUNCATE: If set to false, text that exceeds the token limit causes the request to fail. The default value is true." Only OpenAI rejects (cookbook: "going over that limit causes an error") | replace (edit E14) |
| C4 | L3C1:109-110 | "Many current models, hosted and open, read 8,000 tokens or more" | none | fact | VERIFIED | OpenAI embeddings guide: text-embedding-3-small/-large "Max input … 8192". bge-m3 card: "long documents of up to 8192 tokens" | keep |
| C5 | L3C1:112-114; L3C4:116-117 | one vector for a long chunk "is a blend of everything in it" / "blurs its topics together" | none | practice / effectiveness | UNSOURCED | Günther et al. (Jina AI), "Late Chunking", arXiv 2409.04701 v3 (preprint), abstract: "dense vector-based retrieval systems often perform better with shorter text segments, as the semantics are less likely to be over-compressed in the embeddings" | add backing (optional; label as a vendor preprint) |
| C6 | L3C2:52-55; L3C2 quiz :150 | fixed-size splitting is "the default in many tools" | none | practice | UNSOURCED / partly | OpenAI retrieval guide: "By default, max_chunk_size_tokens is set to 800 and chunk_overlap_tokens is set to 400, meaning every file is indexed by being split up into 800-token chunks". LangChain's docs recommend its structure-following recursive splitter instead: "start with the RecursiveCharacterTextSplitter … This default strategy works well out of the box" | lead with an industry source; soften "many" |
| C7 | L3C2:115-117 | "The usual patch is overlap" | none | practice | UNSOURCED | OpenAI default of 400-token overlap, as in C6 | lead with an industry source (optional, same link as C6) |
| C8 | L3C2:127-133; L3C2 quiz :191 | Chroma: overlap helped one setting (82.4% vs 77.1%, small model, 250-token chunks, 125 overlap) and not another (larger model, 400-token chunks); always cost efficiency | trychroma.com report | effectiveness | VERIFIED | Chroma technical report (Smith & Troynikov, 3 July 2024). all-MiniLM-L6-v2 table: "TokenText 250 125 82.4 … TokenText 250 0 77.1". text-embedding-3-large: "TokenText 400 200 88.6 … TokenText 400 0 89.2", Recursive 400/200 88.1 vs 400/0 89.5. "reducing chunk overlap improves IoU scores" | keep (vendor research, already attributed as "Chroma's study") |
| C9 | L3C3:96-100 | structure-aware chunking cuts at the author's boundaries | none | practice | UNSOURCED | LangChain text-splitter docs: "Some documents have an inherent structure, such as HTML, Markdown, or JSON files. In these cases, it's beneficial to split the document based on its structure, as it often naturally groups semantically related text." Also "The RecursiveCharacterTextSplitter attempts to keep larger units (e.g., paragraphs) intact. If a unit exceeds the chunk size, it moves to the next level (e.g., sentences)" | lead with an industry source (LangChain) |
| C10 | L3C4:159-161 | Chroma: strategy moved recall "by up to 9%" | Chroma | effectiveness | VERIFIED | "with some strategies outperforming others by up to 9% in recall" | keep |
| C11 | L3C4:161-162 | "a simple splitter at about 200 tokens with no overlap was consistently strong" | Chroma | effectiveness | VERIFIED, but the splitter is misnamed | "the heuristic RecursiveCharacterTextSplitter with chunk size 200 and no overlap performs well … it is consistently high performing across all evaluation metrtics" (typo in the source). It's LangChain's recursive splitter, which follows paragraph and line breaks, not a plain fixed-size cut | re-label: name it |
| C12 | L3C4:162-163 | "a popular default of 800-token chunks with 400 tokens of overlap did poorly" | Chroma | effectiveness | VERIFIED | "OpenAI Assistants … the default chunking strategy uses a chunk size of 800 tokens with an overlap of 400 tokens … results in slightly below-average recall and the lowest scores across all other metrics" | re-label: name OpenAI's file-search default |
| C13 | L3C4:166-172 | semantic, proposition, LLM and late chunking, as described | none | practice | UNSOURCED | Proposition: Chen et al., "Dense X Retrieval", arXiv 2312.06648 v3: "Propositions are defined as atomic expressions within text, each encapsulating a distinct factoid and presented in a concise, self-contained natural language format". Late chunking: Günther et al. 2409.04701: "first embed all tokens of the long text, with chunking applied after the transformer model and just before mean pooling" | add links (proposition and late chunking) |
| C14 | L3C4:173-176 | Chroma: "The semantic one did well, and the report recommends it only where its extra complexity is acceptable, with a simple splitter as the default" | Chroma | effectiveness | CONTRADICTED | The report (full text and conclusion) contains no such recommendation. It says: "We developed the ClusterSemanticChunker … which produced consistently strong results across the evaluation. We also present … the LLMSemanticChunker, which also achieves good performance"; "ClusterSemanticChunker … 400 tokens, achieves the second highest recall of 0.913 … The LLMSemanticChunkers achieves the highest recall of 0.919". The GitHub README doesn't have it either | replace (edit E19) |
| C15 | L3C4:177-178 | "Qu and colleagues (2024) found semantic chunking's gains … inconsistent, and not worth its cost" | arXiv 2410.13070 (v1 only) | effectiveness | VERIFIED | Abstract: "the computational costs associated with semantic chunking are not justified by consistent performance gains". Published in Findings of NAACL 2025 (aclanthology.org/2025.findings-naacl.114) | re-label: link the published version, 2025 |
| D1 | L4C2:79-88 | asymmetric models mark the side with a prefix; hosted services take an input type of "query" or "document" | none | practice | UNSOURCED | Voyage API: "input_type … Other options: query, document … Voyage automatically prepends a prompt to your inputs … For query, the prompt is 'Represent the query for retrieving supporting documents: '". Cohere: "input_type … Required for embedding models v3 and higher … 'search_document' … 'search_query'" | lead with an industry source (Voyage, Cohere) |
| D2 | L4C2:90-92 | bge-small's query instruction "Represent this sentence for searching relevant passages: "; documents get no prefix | none | fact | VERIFIED | BGE card: "`Represent this sentence for searching relevant passages: `"; "In all cases, the documents/passages do not need to add the instruction." | keep |
| D3 | L4C2:108-109 | "bge-small's authors say they improved this version's retrieval without the instruction, so it's optional" | none | fact (vendor claim, attributed) | VERIFIED | "For the bge-*-v1.5, we improve its retrieval ability when not using instruction. No instruction only has a slight degradation … So you can generate embedding without instruction in all cases" | keep |
| D4 | L4C2:141-143 | all-MiniLM-L6-v2 is symmetric, trained for general sentence similarity | none | fact | VERIFIED | Card: "maps sentences & paragraphs to a 384 dimensional dense vector space and can be used for tasks like clustering or semantic search"; contrastive training on "1B sentence pairs" | keep |
| D5 | L4C2:151-152 | "Public benchmarks favour bge-small for retrieval" | none | effectiveness | VERIFIED | MTEB paper (2210.07316 v3), Table: MiniLM-L6 Retr. 41.95 (15 datasets). BGE card (its authors' own figure): bge-small-en-v1.5 Retrieval (15) 51.68 | keep (optionally add both figures, the second labelled as BAAI's own) |
| D6 | L4C2:196-203 | MTEB launched with 8 task types, 58 datasets, 112 languages; MMTEB has 500+ tasks in 250+ languages | arXiv 2210.07316; 2502.13595 | fact | VERIFIED | MTEB v3: "MTEB spans 8 embedding tasks covering a total of 58 datasets and 112 languages". MMTEB v4 (ICLR 2025): "covering over 500 quality-controlled evaluation tasks across 250+ languages" | keep |
| D7 | L4C2:211-214; L4C2 quiz :370 | many models train on the benchmark's training splits; the leaderboard reports the overlap | none | fact | VERIFIED | MMTEB §3: "excluding tasks like MS MARCO … and Natural Questions … which are frequently used in fine-tuning". MTEB leaderboard text: "A model is considered zero-shot if it is not trained on any splits of the datasets used to derive the tasks. The percentages in the table indicate what portion of the benchmark can be considered out-of-distribution" | keep |
| D8 | L4C2:218 | "MTEB's own authors found that no single model was best at every task" | MTEB | effectiveness | VERIFIED | "We find that no particular text embedding method dominates across all tasks." | keep |
| D9 | L4C2:233-240 | OpenAI text-embedding-3 takes ~8,000 tokens; 1,536 and 3,072 dimensions by default | none | fact | VERIFIED | OpenAI embeddings guide: "By default, the length of the embedding vector is 1536 for text-embedding-3-small or 3072 for text-embedding-3-large"; "Max input … 8192" | keep |
| D10 | L4C4:259-261; L4R:602 | "The method most vector stores use by default is HNSW" | Malkov & Yashunin link | practice | PARTLY SUPPORTED | Weaviate docs: "HNSW … is the most common graph index type … This is the default index type in Weaviate." Qdrant docs: "Qdrant currently only uses HNSW as a dense vector index." pgvector has no default ANN index (HNSW and IVFFlat are both opt-in) | soften and anchor (edit E21) |
| D11 | L4C4:271-273 | starting from the top lets search time grow with log n | arXiv 1603.09320 | fact | VERIFIED | v4 (14 Aug 2018) abstract: "Starting search from the upper layer together with utilizing the scale separation boosts the performance compared to NSW and allows a logarithmic complexity scaling." | keep |
| D12 | L4C4:222-226 | with ANN, "some stores find a fixed number of nearest candidates first and filter those" | none | fact | VERIFIED (lesson gives no source) | pgvector README: "With approximate indexes, filtering is applied after the index is scanned. If a condition matches 10% of rows, with HNSW and the default hnsw.ef_search of 40, only 4 rows will match on average. For more rows, enable iterative index scans" (from 0.8.0) | add pgvector as the example (edit E22) |
| D13 | L4C4:348-357 | Matryoshka (Kusupati et al., 2022); OpenAI's text-embedding-3 accept a dimensions setting; bge-small offers only 384 | arXiv 2205.13147; none | fact | VERIFIED | MRL v4 abstract: "encodes information at different granularities and allows a single embedding to adapt". OpenAI launch post: "developers can shorten embeddings … by passing in the dimensions API parameter". BGE card: 384 dims only | keep |
| D14 | L4C4:380-385 | Qdrant rescores with original vectors; oversampling sets the shortlist size | qdrant.tech link | fact | VERIFIED | Qdrant quantization docs: "We recommend using binary quantization only with rescoring enabled … oversampling can be used to tune the tradeoff between search speed and search quality" | keep. Optional: add Qdrant's caveat that binary works well only on high-dimensional vectors (edit E23) |
| D15 | L4C4:386-388 | Hugging Face: 1-bit plus rescoring kept up to ~96% of retrieval quality (Shakir, Aarsen and Lee, 2024) | HF blog link | effectiveness | VERIFIED | HF blog (22 Mar 2024, Aamir Shakir, Tom Aarsen, SeanLee): "we are able to preserve up to ~96% of the total retrieval performance … Without the rescoring … roughly ~92.5%" | keep |
| D16 | L4C2:163-170; L4C3 throughout; L4C4 demos | tokenizer-limit table, meaning vs keywords, clustering, quantization, rescoring | ours | our data | LABELLED | Models (bge-small-en-v1.5, all-MiniLM-L6-v2) and the 43 scored questions are named; the table caption says it was measured offline with each model's own tokenizer | keep |
| D17 | L4C4:302-309 | FAISS HNSW efSearch 96/99/100% | ours | our data | LABELLED | "run locally with faiss-cpu 1.15.1 on the same vectors" | keep |

### 2. Proposed edits

No proposed edit touches a demo, exercise, hidden-test string or quiz, so none needs Pyodide re-verification.

**E1 (A1): re-label.** L1C1:96-97
Current:
```
read from the prompt; [Ovadia and colleagues (2023)](https://arxiv.org/abs/2312.05934)
found retrieval beat unsupervised fine-tuning on the documents at adding new knowledge, across several models and tasks. A changed
```
Proposed:
```
read from the prompt; [Ovadia and colleagues (EMNLP 2024)](https://aclanthology.org/2024.emnlp-main.15/)
found retrieval beat unsupervised fine-tuning on the documents at adding new knowledge, across three 7B models and several tasks. A changed
```

**E2 (A5, A17): soften and re-label.** L1C3:43-44
Current:
```
**Google DeepMind, 2024.** Zhuowan Li and colleagues compared the two approaches
on nine question-answering datasets with three models: Gemini-1.5-Pro,
```
Proposed:
```
**Google DeepMind, 2024.** Zhuowan Li and colleagues compared the two approaches
on nine long-context datasets, eight of them question answering, with three models: Gemini-1.5-Pro,
```
L1C3:92-95
Current:
```
*Sources: Li et al., "[Retrieval Augmented Generation or Long-Context LLMs?
A Comprehensive Study and Hybrid Approach](https://arxiv.org/abs/2407.16833)"
(EMNLP 2024); Li et al., "[LaRA: Benchmarking Retrieval-Augmented Generation
and Long-Context LLMs](https://arxiv.org/abs/2502.09977)" (2025).*
```
Proposed:
```
*Sources: Li et al., "[Retrieval Augmented Generation or Long-Context LLMs?
A Comprehensive Study and Hybrid Approach](https://arxiv.org/abs/2407.16833)"
(EMNLP 2024, industry track); Li et al., "[LaRA: Benchmarking Retrieval-Augmented Generation
and Long-Context LLMs – No Silver Bullet for LC or RAG Routing](https://proceedings.mlr.press/v267/li25dv.html)" (ICML 2025).*
```

**E3 (A3): optional added sentence.** L1C2:78-79
Current:
```
*(The multipliers are one provider's, as an example; the retrieval side
assumes 2,000 tokens per question rather than measuring a real search.)*
```
Proposed:
```
*(The multipliers are one provider's, as an example; the retrieval side
assumes 2,000 tokens per question rather than measuring a real search. Some
of that provider's newest models discount cached reads further, to 0.05 or
0.025 times, which narrows the gap without closing it.)*
```
(At 0.05×, the cached cost per question is about 11,600 units, still about 5.8× retrieval.)

**E4 (A2): soften.** L1C1:148-151
Current:
```
documentation. The company's own knowledge is under 3% of the text, which is
typical: the pages that matter most to a specific question are usually a
small part of what's stored.
```
Proposed:
```
documentation. The company's own knowledge is under 3% of the text. However
a knowledge base is made up, the pages that matter to a specific question
are a small part of what's stored.
```

**E5 (B1): lead with an industry source.** L2C2:243-246
Current:
```
Writing questions by hand is slow, so a common shortcut is to have a model
write them: show it a chunk, ask for a question the chunk answers, and
label the question with that chunk. It's cheap, it scales to every chunk
in the index, and the labels come for free.
```
Proposed:
```
Writing questions by hand is slow, so a common shortcut is to have a model
write them: show it a chunk, ask for a question the chunk answers, and
label the question with that chunk.
[LlamaIndex's `generate_question_context_pairs`](https://developers.llamaindex.ai/python/examples/evaluation/retrieval/retriever_eval/)
does exactly this. It's cheap, it scales to every chunk in the index, and
the labels come for free.
```

**E6 (B2): add a link.** L2C2:251-252
Current:
```
who wrote questions while looking at the answer: Lee, Chang and Toutanova
(2019) found that on question sets where the person asking already knew
```
Proposed:
```
who wrote questions while looking at the answer: [Lee, Chang and Toutanova
(2019)](https://arxiv.org/abs/1906.00300) found that on question sets where the person asking already knew
```

**E7 (B3): soften.** L2C2:262-264
Current:
```
`generated-questions.json`. A second batch, for the same 20 sections, adds
the instruction generators use against this bias: "Don't reuse the
passage's key terms." Each question is labelled with a quote from the
```
Proposed:
```
`generated-questions.json`. A second batch, for the same 20 sections, adds
an instruction aimed at this bias: "Don't reuse the
passage's key terms." Each question is labelled with a quote from the
```

**E8 (B8): re-label the discount.** L2C3:235-240
Current:
```
- **nDCG**, normalised discounted cumulative gain (Järvelin and
  Kekäläinen, 2002). Each result earns its relevance grade, say 2 for a
  passage that answers fully, 1 for a partial answer and 0 for nothing,
  divided by log2 of its position plus one: first place counts in full,
  second about 0.63, fifth about 0.39. The sum is the DCG. Dividing it by
```
Proposed:
```
- **nDCG**, normalised discounted cumulative gain
  ([Järvelin and Kekäläinen, 2002](https://doi.org/10.1145/582415.582418)).
  Each result earns its relevance grade, say 2 for a
  passage that answers fully, 1 for a partial answer and 0 for nothing,
  divided by log2 of its position plus one, the form most tools use (the
  original paper let the first two places count in full): first place counts in full,
  second about 0.63, fifth about 0.39. The sum is the DCG. Dividing it by
```

**E9 (B6): soften and add a link.** L2C3:156-158
Current:
```
  none is in the top *k*. Averaged over queries it's the **mean reciprocal
  rank (MRR)**, the score the TREC question-answering track introduced in
  1999 to rank systems that return a short list of answers.
```
Proposed:
```
  none is in the top *k*. Averaged over queries it's the **mean reciprocal
  rank (MRR)**, the score the first TREC question-answering track, in 1999,
  ranked systems by, when each returned a short list of five answers
  ([Voorhees and Tice](http://www.lrec-conf.org/proceedings/lrec2000/pdf/26.pdf)).
```

**E10 (B7, B9): add links.** L2C3:231-232 and :243
- `  least one relevant result in the top *k*. LlamaIndex's retrieval` becomes `  least one relevant result in the top *k*. [LlamaIndex's retrieval`, and on the next line `  evaluator reports it next to MRR.` becomes `  evaluator](https://developers.llamaindex.ai/python/examples/evaluation/retrieval/retriever_eval/) reports it next to MRR.`
- `- **Context recall and context precision**, in RAGAS, a RAG evaluation` becomes `- **Context recall and context precision**, in [RAGAS](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/context_precision/), a RAG evaluation`

(Optional, B5: at L2C3:148 add a link on "The textbook version": https://nlp.stanford.edu/IR-book/html/htmledition/evaluation-of-unranked-retrieval-sets-1.html)

**E11 (B14, B15): add links.** L2C5:124-128
Current:
```
none of them found is scored as if it made a mistake. Studies of TREC's
pools found them reasonably reliable for comparing the systems that took
part (Zobel, 1998), and also that pooled evaluation is inherently biased
against systems that didn't contribute to the pool (Büttcher and
colleagues, 2007).
```
Proposed:
```
none of them found is scored as if it made a mistake. Studies of TREC's
pools found them reasonably reliable for comparing the systems that took
part ([Zobel, 1998](https://doi.org/10.1145/290941.291014)), and also that pooled evaluation is inherently biased
against systems that didn't contribute to the pool ([Büttcher and
colleagues, 2007](https://doi.org/10.1145/1277741.1277755)).
```

**E12 (B16, B17, B19): add links.** L2C5
- :150 `- **Leniency.** Rahmani and colleagues (2025) compared GPT-4's relevance` becomes `- **Leniency.** [Rahmani and colleagues (2025)](https://arxiv.org/abs/2506.10301) compared GPT-4's relevance`
- :156 `- **Order and length.** Zheng and colleagues (2023), studying models that` becomes `- **Order and length.** [Zheng and colleagues (2023)](https://arxiv.org/abs/2306.05685), studying models that`
- :169 `Thomas, Spielman, Craswell and Mitra (2024), labelling search results at` becomes `[Thomas, Spielman, Craswell and Mitra (2024)](https://arxiv.org/abs/2309.10621), labelling search results at`

**E14 (C3): replace.** L3C1:109-112
Current:
```
Not every embedder is this small. Many current models, hosted and open, read
8,000 tokens or more, and hosted services usually reject text that's too
long, or truncate only when asked, rather than cutting it silently. A longer
limit moves the problem rather than removing it. One vector for a
```
Proposed:
```
Not every embedder is this small. Many current models, hosted and open, read
8,000 tokens or more. Hosted services differ on text that's too long:
[OpenAI's](https://developers.openai.com/api/docs/guides/embeddings) rejects it with an error, while
[Voyage](https://docs.voyageai.com/reference/embeddings-api), [Cohere](https://docs.cohere.com/reference/embed)
and Google's Vertex AI cut it to fit by default unless you switch that off.
Check what yours does rather than waiting for an error. A longer
limit moves the problem rather than removing it. One vector for a
```
Other places: the "usually truncated silently" sentences (L3C1:99, the L3C1 quiz at :171, L3R:424) stay true and need no change.

**E15 (C5): optional backing.** L3C1:112-114, after "…so one relevant sentence barely shifts it." add:
```
Jina AI's researchers, who build long-input embedders, say as much:
retrieval "often perform[s] better with shorter text segments, as the
semantics are less likely to be over-compressed in the embeddings"
([Günther et al., 2024](https://arxiv.org/abs/2409.04701), a preprint).
```

**E16 (C6, C7): lead with an industry source.** L3C2:52-55
Current:
```
The simplest chunker ignores the text's structure entirely: it cuts every
*N* tokens, wherever that lands. It needs no knowledge of the format, works
on any text, and makes chunks of predictable size, which is why it's the
default in many tools.
```
Proposed:
```
The simplest chunker ignores the text's structure entirely: it cuts every
*N* tokens, wherever that lands. It needs no knowledge of the format, works
on any text, and makes chunks of predictable size, which is why some tools
use it by default: [OpenAI's file search](https://developers.openai.com/api/docs/guides/retrieval)
cuts every file into 800-token chunks unless told otherwise.
```
Optional, L3C2:115-117: after "…so text near a cut appears whole in one of the two." add "OpenAI's default overlaps each 800-token chunk with the one before by 400 tokens."

**E17 (C9): lead with an industry source.** L3C3:98-100
Current:
```
block is one unit that means nothing in halves. A **structure-aware**
chunker cuts at those boundaries, and only falls back to cutting blindly
when a single unit is too big for any chunk.
```
Proposed:
```
block is one unit that means nothing in halves. A **structure-aware**
chunker cuts at those boundaries, and only falls back to cutting blindly
when a single unit is too big for any chunk. It's where
[LangChain's documentation](https://docs.langchain.com/oss/python/integrations/splitters)
suggests starting: its default splitter keeps paragraphs whole where it can,
then sentences, and it splits Markdown and HTML by their structure.
```

**E18 (C11, C12): re-label.** L3C4:160-163
Current:
```
found that chunking strategy moved recall by up to 9% between the best and
worst choices, that a simple splitter at about 200 tokens with no overlap
was consistently strong, and that a popular default of 800-token chunks
with 400 tokens of overlap did poorly. The big differences are between
```
Proposed:
```
found that chunking strategy moved recall by up to 9% between the best and
worst choices, that LangChain's recursive splitter, which breaks at
paragraphs and lines, was consistently strong at 200 tokens with no overlap,
and that OpenAI's file-search default of 800-token chunks
with 400 tokens of overlap did poorly. The big differences are between
```

**E19 (C13, C14, C15): replace and add links.** L3C4:168-178
Current:
```
self-contained statements, one fact each. **LLM chunking** asks a model where
to cut. **Late chunking** embeds the whole document with a long-input model
first, then splits its token vectors into chunks, so each chunk's vector has
seen its surroundings. Libraries offer most of these, and each costs more to
index: an embedding per sentence, or a model call per document. Chroma's
report built a semantic chunker and a model-driven one. The semantic one did
well, and the report recommends it only where its extra complexity is
acceptable, with a simple splitter as the default.
[Qu and colleagues (2024)](https://arxiv.org/abs/2410.13070) found semantic
chunking's gains over fixed-size chunks inconsistent, and not worth its cost.
```
Proposed:
```
self-contained statements, one fact each
([Chen et al., 2023](https://arxiv.org/abs/2312.06648)). **LLM chunking** asks a model where
to cut. **Late chunking** embeds the whole document with a long-input model
first, then splits its token vectors into chunks, so each chunk's vector has
seen its surroundings ([Günther et al., 2024](https://arxiv.org/abs/2409.04701),
a preprint from Jina AI). Libraries offer most of these, and each costs more to
index: an embedding per sentence, or a model call per document. Chroma's
report built a semantic chunker and a model-driven one. Both did well, the
model-driven one finding the most relevant text, but only a few points of
recall above the recursive splitter at 200 tokens.
[Qu and colleagues (2025)](https://aclanthology.org/2025.findings-naacl.114/) found semantic
chunking's gains over fixed-size chunks inconsistent, and not worth its cost.
```
(Recall: 0.919 for LLMSemanticChunker and 0.913 for ClusterSemanticChunker at 400, against 0.881 for Recursive 200/0, all with text-embedding-3-large.)

**E20 (D1): lead with an industry source.** L4C2:86-88
Current:
```
quietly weakens retrieval. Hosted embedding services often take the side as
a setting instead, an input type of "query" or "document", which is the same
idea without the prefix text.
```
Proposed:
```
quietly weakens retrieval. Hosted embedding services often take the side as
a setting instead: [Voyage](https://docs.voyageai.com/reference/embeddings-api)
takes an input type of "query" or "document", and [Cohere](https://docs.cohere.com/reference/embed)
"search_query" or "search_document". It's the same idea without writing the
prefix yourself; Voyage's documentation says it adds a prompt to the text for you.
```

**E21 (D10): soften and anchor.** L4C4:259-261
Current:
```
The method most vector stores use by default is **HNSW** (hierarchical
navigable small world graphs,
[Malkov and Yashunin, 2016](https://arxiv.org/abs/1603.09320)). Instead of
```
Proposed:
```
The most common approximate method is **HNSW** (hierarchical
navigable small world graphs,
[Malkov and Yashunin, 2016](https://arxiv.org/abs/1603.09320)), the default
index in [Weaviate](https://docs.weaviate.io/weaviate/concepts/vector-index) and the only dense
index in [Qdrant](https://qdrant.tech/documentation/concepts/indexing/). Instead of
```
(The L4C4 quiz's wrong option at :476, "HNSW, since it's the default in vector databases", still reads fine.)

**E22 (D12): add an example.** L4C4:222-226
Current:
```
Vector stores offer filters for exactly this, but check where a store
applies them. With the approximate search described below, some stores find
a fixed number of nearest candidates first and filter those, which is
filtering after, with the same short or empty lists. Stores differ, and
```
Proposed:
```
Vector stores offer filters for exactly this, but check where a store
applies them. With the approximate search described below, some stores find
a fixed number of nearest candidates first and filter those, which is
filtering after, with the same short or empty lists.
[pgvector](https://github.com/pgvector/pgvector#filtering), for example, filters
after scanning its approximate index: with its default settings, a filter that
matches 10% of rows leaves an HNSW search about 4 results, unless its
iterative scans are switched on. Stores differ, and
```

**E23 (D14): optional explanatory addition.** L4C4, after "…sets how many more candidates the shortlist holds than the results asked for." add:
```
Qdrant's documentation also warns that 1-bit vectors work well only for
high-dimensional vectors; bge-small's 384 numbers are few, which fits how
much this page's 1-bit search lost on its own.
```

### 3. Needs a decision

None. No contradicted source undercuts what a concept teaches:
- C3 (hosted truncation) is a factual reversal. The fix strengthens the concept's own point that truncation is silent unless you check.
- C14 (Chroma's recommendation) removes a sentence the report doesn't contain. The lesson's conclusion, that sensible chunkers are hard to separate, still stands on Chroma's 200-token recursive result and on Qu et al.
- B8 (nDCG discount) only changes how the formula is attributed. The demo code stays as it is.

### 4. Counts

- Verified: 51. Every figure from Li et al. 2024 and LaRA matches; the latest versions (v2 and ICML) are unchanged. Of the 51, the recomputed own-data statistics are B10 and B12.
- Contradicted: 3.
  - B8: the nDCG discount credited to Järvelin & Kekäläinen is the later log2(i+1) form.
  - C3: most hosted embedders truncate by default rather than reject.
  - C14: Chroma's report contains no "use semantic chunking only where the complexity is acceptable" recommendation.
- Unreachable: 0.
- Unsourced flagged: 11: A2, B1, B3, B11 (no citation needed), C5, C6, C7, C9, C13, D1, D10 (partly supported).
- Re-labelled: 5: A1, A17 (with A5), B8, C11/C12 (one edit), C15.
- Replaced: 2: C3, C14.
- Added industry or practice anchors and links: 15: B1, B2, B6, B7, B9, B14, B15, B16, B17, B19, C6/C7, C9, C13, D1, D10, plus pgvector for D12.
- Softened: 4: A2, A5, B3, B6.
- Optional additions: E3 (cache multipliers), E15 (Jina dilution), E23 (Qdrant binary caveat), and the B5 link.
- Own-data labelling: all labelled with models and case counts. One gap: the model-written questions name only "Claude", with no version, in both the page and `generated-questions.json` (B4).

---

## Report: Citation audit: Module 5, Lessons 5 to 8 (document parsing, hybrid search, reranking, query transformation)

Scope: every `.mdx` in `src/content/modules/05-rag-systems/{05-document-parsing,06-hybrid-search,07-reranking,08-query-transformation}` (intros, concepts, quizzes, exercise text, recaps). Paths below are relative to `src/content/modules/05-rag-systems/`. Downloads are in `scratchpad/audit/m5B/`.

Sources were read in the primary text: arXiv PDFs (latest version, `pdftotext`), the Cormack et al. SIGIR 2009 PDF, the Robertson and Zaragoza 2009 monograph PDF, vendor docs and READMEs via curl and strip. ACM DOIs return 403 to scripts, as the syllabus already notes, and resolve in a browser. Crossref confirms both (see B10, B11).

**Our own results:** every measured claim in these four lessons is labelled as the course's, with case counts (43 labelled questions, 10 PDF questions, 5 table questions, 3 image questions, 3 multi-part, 3 follow-ups). Retrieval models are named: bge-small-en-v1.5 and ms-marco-MiniLM-L6-v2 (with RTX 3070 Ti timing). Two small gaps:
- **L5 intro:** "7 answered to 9" gives no denominator (see A1).
- **Model-written variants, filters, summaries and descriptions:** these are credited to "Claude". The data files (`query-variants.json`, `query-filters.json`, `pdf/corpus.json`) record `written_by: "Claude, for the course"` with no model version, so no version can be added without the author's records.

### 1. Claims table

| ID | file:line | Claim (trimmed) | Source given | Kind | Verdict | Evidence (primary source) | Recommendation |
|---|---|---|---|---|---|---|---|
| A1 | 05-document-parsing/00-intro.mdx:21-24 | "adding image descriptions took the labelled questions from 7 answered to 9. The tenth…" | our data | effectiveness (ours) | OURS, partly labelled | Recap test 6 and explanation: "9 of the 10 labelled questions in the top five, against 7 with the text alone" (bge-small) | re-label: give "of 10" and "in the top five" |
| A2 | 05/01-what-a-pdf-actually-contains.mdx:98-101 | Plain extractor "follows the order things were drawn, not where they sit" | none (shown by demo) | fact | UNSOURCED (demonstrated) | The live demo shows it on P01 | keep |
| A3 | 05/01:115-127 | "A PDF's page content isn't paragraphs, headings or tables. It's instructions to draw… None of this is stated in this PDF" | none | fact | UNSOURCED | pypdf docs, "Missing Semantic Layer": "The PDF file format is all about producing the desired visual result for printing… PDF files don't contain a semantic layer. Specifically, there is no information what the header, footer, page numbers, tables, and paragraphs are." (pypdf.readthedocs.io, user/extract-text) | lead with an industry source (pypdf docs) |
| A4 | 05/01:129-134 | Tagged PDFs carry a structure tree, and outlines name sections | none | fact | UNSOURCED | Well-established PDF feature; not a "says who" claim | keep |
| A5 | 05/01:139-141 | Docling takes DOCX, HTML and PPTX as well as PDFs | Docling GitHub | fact | VERIFIED | Docling README: "Parsing of multiple document formats including PDF, DOCX, PPTX, XLSX, HTML, EPUB…" | keep |
| A6 | 05/01:151-152 | pdfplumber finds tables "mostly by finding the lines drawn around cells" | none | fact | VERIFIED | pdfplumber README table settings default: `"vertical_strategy": "lines", "horizontal_strategy": "lines"` | keep |
| A7 | 05/03-tables-for-retrieval.mdx:173-175 | Model-written table summary: "A common approach in multimodal RAG pipelines" | none | practice | UNSOURCED | LangChain, "Multi-Vector Retriever for RAG on tables, text, and images" (20 Oct 2023): "We generate summaries of table elements, which is better suited to natural language retrieval. If a table summary is retrieved via semantic similarity to a user question, the raw table is passed to the LLM for answer synthesis." | lead with an industry source |
| A8 | 05/03:190-211 | Table-writing measurements on five questions ("five questions is a small sample") | our data | effectiveness (ours) | OURS, labelled | bge-small named in `pdf_query_vectors` docstring; count stated | keep |
| A9 | 05/04-images-for-retrieval.mdx:85-87 | "The common fix is to have a vision-capable model look at each image and describe it, then index the description" | none | practice | UNSOURCED | Same LangChain post, Option 3: "Use a multimodal LLM… to produce text summaries from images. Embed and retrieve image summaries with a reference to the raw image… pass raw images and text chunks to a multimodal LLM for answer synthesis." (It also matches the page's own advice at 117-119 to send the image itself for answering.) | lead with an industry source |
| A10 | 05/04:153 | "ColPali (Faysse and colleagues, ICLR 2025)" | arXiv 2407.01449 | fact | VERIFIED | v6 (28 Feb 2025) header: "Published as a conference paper at ICLR 2025" | keep |
| A11 | 05/04:155-158 | Text pipelines are "lengthy, brittle"; ColPali outperformed the systems they tested on ViDoRe | arXiv 2407.01449 | effectiveness | VERIFIED | v6 abstract: "often through lengthy and brittle processes-, they struggle to exploit key visual cues efficiently… ColPali largely outperforms modern document retrieval pipelines" | keep |
| A12 | 05/04:158-160 | "They note that some of ViDoRe's queries were written by a commercial language model, which may bias it." | arXiv 2407.01449 | fact | VERIFIED in v1/v3 only; dropped from v6 (latest) | v1 and v3, §8 Limitations: "we partially rely on synthetic query generation based on a commercial large language model, which may induce some amount of bias in the generated queries." v6 (ICLR) has no Limitations section and says queries were generated "using Claude-3 Sonnet… extensively filtered for quality and relevance by human annotators" (§3.1) | re-label (earlier versions; name the model and the human filtering) |
| A13 | 05/04:162-164 | Indexing runs PaliGemma-3B, about three billion parameters | arXiv 2407.01449 | fact | VERIFIED | v6 §4.1: "we introduce ColPali, a Paligemma-3B extension" | keep |
| A14 | 05/04:168-170 | "1,030 vectors of 128 numbers per page in its paper" | arXiv 2407.01449 | fact | VERIFIED | v6 §5.2: "a vector per image patch, along with 6 extra text tokens… (D = 128)… 257.5 KB per page". 1024 patches + 6 = 1,030; 1,030 × 128 × 2 bytes = 257.5 KB. Vespa's post states it directly: "a single screenshot of a PDF page is represented by 1030 128-d vectors." | keep |
| A15 | 05/04:170-172 | Multi-vector stores: "some, such as Vespa and Qdrant, support" | none | fact | VERIFIED (unlinked) | Qdrant docs, Vectors: "To use multivectors… Currently, Qdrant supports max_sim function". Vespa blog "Scaling ColPali to billions of PDFs" | add stronger backing (links) |
| A16 | 05/04:176 | DSE, Document Screenshot Embedding (EMNLP 2024), a single-vector page embedder | ACL Anthology | fact | VERIFIED | 2024.emnlp-main.373 abstract: "DSE leverages a large vision-language model to directly encode document screenshots into dense representations for retrieval." | keep |
| A17 | 05/04:177 | voyage-multimodal-3 embeds page screenshots | Voyage blog | fact | VERIFIED (vendor) | "capturing key visual features from screenshots of PDFs, slides, tables, figures… eliminating the need for complex document parsing" (12 Nov 2024). No vendor figures quoted in the course | keep |
| A18 | 05/05-scans-and-layout-aware-parsers.mdx:68-69 | "Tesseract is a widely used free OCR engine" | none | fact | UNSOURCED (uncontroversial) | ColPali v6 cites it as the OCR engine in standard pipelines (Smith, 2007) | keep |
| A19 | 05/05:168-169 | Tesseract reports a confidence for every word | none | fact | VERIFIED | pytesseract README: `image_to_data` "Get verbose data including boxes, confidences, line and page numbers" | keep |
| A20 | 05/05:183-187 | Docling: IBM Research, MIT licence; layout, reading order, table structure, OCR; Markdown/JSON; runs locally | Docling GitHub | fact | VERIFIED | README: "Advanced PDF understanding incl. page layout, reading order, table structure…", "Extensive OCR support for scanned PDFs", "Markdown… and lossless JSON", "Local execution capabilities", "The Docling codebase is under MIT license", "started by the AI for knowledge team at IBM Research Zurich" | keep |
| A21 | 05/05:189-192 | "Marker and MinerU are other open-source converters… combining several models for layout, text, tables and formulas, with Markdown or JSON" | GitHub links | fact | PARTLY VERIFIED | Marker README: "Our code is licensed under Apache 2.0… Our model weights use a modified AI Pubs Open Rail-M license (free for research, personal use, and startups under $5M funding/revenue)." MinerU: "licensed under the MinerU Open Source License… based on Apache 2.0 with additional conditions" (commercial thresholds). Outputs (Markdown, JSON) verified | re-label (licence limits on commercial use) |
| A22 | 05/05:208-209 | Claude and Gemini both accept a whole PDF in a request | Anthropic and Google docs | fact | VERIFIED | See A23 and A24 | keep |
| A23 | 05/05:226-230 | Anthropic: each page converted into an image, text extracted alongside; 1,500–3,000 tokens a page, image billed on top | Anthropic PDF docs | fact | VERIFIED | "The system converts each page of the document into an image. The text from each page is extracted and provided alongside each page's image." "Each page typically uses 1,500–3,000 tokens per page… Because each page is converted into an image, the same image-based cost calculations are applied." | keep |
| A24 | 05/05:230-231 | Gemini processes PDFs with native vision | Google docs | fact | VERIFIED | "Gemini models can process documents in PDF format, using native vision to understand entire document contexts." | keep |
| A25 | 05/05:237-239 | olmOCR: Allen Institute, fine-tuned 7B VLM, PDF/images to Markdown, Apache 2.0 | olmOCR GitHub | fact | VERIFIED | README: "Convert PDF, PNG, and JPEG based documents into clean Markdown… Based on a 7B parameter VLM"; "olmOCR is licensed under Apache 2.0". The current model (olmOCR-2-7B-1025) is still 7B and Apache 2.0 | keep |
| A26 | 05/05:240-242 | Docling's VLM pipeline, e.g. Granite-Docling, 258M | Docling docs | fact | VERIFIED | Vision Models page: "The VlmPipeline in Docling allows you to convert documents end-to-end using a vision-language model… ibm-granite/granite-docling-258M" | keep |
| A27 | 05/05:243-249 | LlamaParse, Mistral OCR, Azure DI (layout can return Markdown), Textract (layout, tables, forms, confidence per item), paid per page | vendor pages | fact | VERIFIED | Azure: "Output response to markdown". Textract: "returns a confidence score for everything it identifies". Mistral: "Returns tables… as Markdown". LlamaIndex pricing: credit-based parse tiers "per page" | keep |
| A28 | 05/05:257-263 | olmOCR paper: image-only prompting prone to completing unfinished sentences or inventing passages; document anchoring gave significantly fewer hallucinations | arXiv 2502.18443 | effectiveness | VERIFIED (preprint v3, 2 Jul 2025; qualitative, no rate given) | §2.1: "Overall, we find that using prompts constructed using document-anchoring results in significantly fewer hallucinations. Prompting with just the page image was prone to models completing unfinished sentences, or to invent larger texts when the image data was ambiguous." | re-label (preprint; the authors' observation) |
| A29 | 05/05:251-256 | VLM errors read like correct text: invented values, completed sentences | olmOCR (A28) | practice | VERIFIED via A28 | as A28 | keep |
| B1 | 06-hybrid-search/00-intro.mdx:20-21 | "Combining them is standard practice" | none | practice | UNSOURCED | Backed once B14/B16/B18 are added in the concepts | keep (backed downstream after edits) |
| B2 | 06/01-rare-words-should-count-for-more.mdx:80-87 | Robertson and Zaragoza derive the no-relevance-information weight, "a close approximation to classical IDF": log((N − n + 0.5)/(n + 0.5)) | DOI 10.1561/1500000019 | fact | VERIFIED | §3.1: "The resulting formula is a close approximation to classical idf… w_i^IDF = log (N − n_i + 0.5)/(n_i + 0.5) (3.3)" | keep |
| B3 | 06/01:103-104 | "Many implementations add 1 inside the logarithm to keep every weight positive" | none | fact | UNSOURCED | Lucene `BM25Similarity.idf`: "Implemented as log(1 + (docCount - docFreq + 0.5)/(docFreq + 0.5))" | add stronger backing (Lucene) |
| B4 | 06/01:121-123 | "Keyword engines often reduce words to their stems" | none | practice | UNSOURCED (uncontroversial) | n/a | keep |
| B5 | 06/02-bm25.mdx:159-162 | BM25 is "one of the most successful text-retrieval algorithms" the model produced | R&Z 2009 | fact | VERIFIED | Abstract: "which led to the development of one of the most successful text-retrieval algorithms, BM25" | keep |
| B6 | 06/02:208-211 | "values such as 0.5 < b < 0.8 and 1.2 < k1 < 2 reasonably good… best values depend on the documents and the queries" | R&Z 2009 | fact | VERIFIED | §3.5: "suggest that in general values such as 0.5 < b < 0.8 and 1.2 < k1 < 2 are reasonably good in many circumstances. However, there is also evidence that optimal values do depend on other factors (such as the type of documents or queries)." | keep |
| B7 | 06/02:211 | "This lesson uses k1 = 1.2 and b = 0.75" | none | practice | UNSOURCED (industry anchor available) | Elasticsearch similarity docs: "k1… The default value is 1.2. b… The default value is 0.75." Lucene `BM25Similarity()`: "k1 = 1.2 b = 0.75" | lead with an industry source (the defaults) |
| B8 | 06/02:211-214 | Some published versions multiply by (k1 + 1), which doesn't change the ranking | R&Z (implicit) | fact | VERIFIED | §3.5.1: "A common variant is to add a (k1 + 1) component to the numerator… This is the same for all terms, and therefore does not affect the ranking produced." | keep |
| B9 | 06/02:236-238 | Elasticsearch's and OpenSearch's standard analyser splits `REG-1007` into `reg` and `1007` | none | fact | VERIFIED (unlinked) | ES standard tokenizer (UAX #29): "The 2 QUICK Brown-Foxes jumped…" → "[ The, 2, QUICK, Brown, Foxes, …]". OpenSearch uses the same Lucene tokenizer | add stronger backing (link) |
| B10 | 06/03-fusing-rankings.mdx:98-102 | Bruch and colleagues (2023): a weighted sum tuned on labelled questions can beat rank-based fusion | arXiv 2210.11934 | effectiveness | VERIFIED | v2 abstract: "CC outperforms RRF in in-domain and out-of-domain settings; and finally, that CC is sample efficient, requiring only a small set of training examples". Published in ACM TOIS (Crossref: 10.1145/3596512, 2023). Authors are at Pinecone, a vector-database vendor (research with shown method, not a product figure) | replace link with published version (TOIS) |
| B11 | 06/03:108-110 | RRF from Cormack, Clarke and Büttcher (2009) | DOI 10.1145/1571941.1572114 | fact | VERIFIED | SIGIR '09 paper; Crossref title matches | keep |
| B12 | 06/03:130-132 | Quote: the constant "mitigates the impact of high rankings by outlier systems" | Cormack 2009 | fact | VERIFIED | §1: "The constant k mitigates the impact of high rankings by outlier systems." | keep |
| B13 | 06/03:138-145 | k = 60 set in a pilot and not altered; near-optimal, not critical; MAP 0.2072/0.2134/0.2145/0.2142/0.2098 at k = 0/20/60/100/500; beat Condorcet, CombMNZ and best system by 4%–5% on average | Cormack 2009 | effectiveness | VERIFIED | "k = 60 was fixed during a pilot investigation and not altered during subsequent validation"; "indicated that k = 60 was near-optimal, but that the choice was not critical"; Table 1: .2072 (0), .2134 (20), .2145 (60), .2142 (100), .2098 (500); "RRF outperforms Condorcet, CombMNZ and the best system by 4% to 5% on average" | keep |
| B14 | 06/03:152-155 | RRF is "widely used to combine keyword and vector results" | none | practice | UNSOURCED | Elasticsearch RRF: "RRF requires no tuning… rank_constant… Defaults to 60." Azure AI Search hybrid ranking: RRF, "Experiments show the algorithm performs best when you set k to a small value, such as 60." Weaviate: rankedFusion "computed according to 1/(RANK + 60)" | lead with an industry source |
| B15 | 06/03:152-153, quiz 201 & 207 | One shared k barely matters: "almost nothing to tune", "as the paper found" | Cormack 2009 | effectiveness | VERIFIED for Cormack; later work qualifies it | Bruch et al. v2: "Contrary to existing studies, we find RRF to be sensitive to its parameters"; §5: "NDCG swings wildly as a function of RRF parameters. Crucially, performance improves off-diagonal, where the parameter takes on different values for the semantic and lexical components." | add stronger backing (the qualifier); see Needs a decision |
| B16 | 06/04-hybrid-search-measured-honestly.mdx:170-172 | "keyword search is the dependable way to match [exact identifiers]" | none | practice | UNSOURCED | Anthropic, "Introducing Contextual Retrieval": "Suppose a user queries 'Error code TS-999'… An embedding model might find content about error codes in general, but could miss the exact 'TS-999' match. BM25 looks for this specific text string" | lead with an industry source |
| B17 | 06/04:178-185 | SPLADE (learned sparse, weights related words) and ColBERT (one vector per token, best match per question word) | none (named, unlinked) | fact | VERIFIED | SPLADE (arXiv 2107.05720, SIGIR '21 short): "Sparse Lexical and Expansion Model". ColBERT (arXiv 2004.12832, SIGIR 2020): "late interaction architecture that independently encodes the query and the document… models their fine-grained similarity" | add stronger backing (links) |
| B18 | 06/04:185-189 | Production: Elasticsearch, OpenSearch, Qdrant, Weaviate "and PostgreSQL with extensions, run both searches and fuse them, with RRF or a weighted sum" | none | practice | VERIFIED except PostgreSQL (overstated) | ES RRF + linear retriever ("merge through a weighted sum"); OpenSearch hybrid with normalization processor (arithmetic_mean) and RRF; Qdrant: "Qdrant has a few ways of fusing… rrf and dbsf"; Weaviate: relativeScoreFusion and rankedFusion. pgvector README: "Use together with Postgres full-text search for hybrid search… You can use Reciprocal Rank Fusion or a cross-encoder to combine results" (linking example scripts): the extension doesn't fuse, you do | add links; soften PostgreSQL |
| B19 | 06/04:191-193 | Weighted RRF: a weight multiplies each ranking's 1/(k + rank) shares | none | practice | UNSOURCED (exact industry match exists) | Elasticsearch RRF retriever: "Each retriever can optionally include a weight… rrf_score = weight_1 × rrf_score_1 + weight_2 × rrf_score_2 + …" | lead with an industry source |
| B20 | 06/04 and 05 (tables, recap test 6) | 43-question results (hybrid 20 vs 15 at rank 1, 27 vs 28 at 5, 31 vs 34 at 20; weight 0.25 → 28) | our data | effectiveness (ours) | OURS, labelled | counts on the page; bge-small is the module's meaning search | keep |
| C1 | 07-reranking/00-intro.mdx:19-20 | "Reranking is the most direct way to improve that" | none | practice | UNSOURCED | Backed by C2 once added | keep (backed downstream after edits) |
| C2 | 07/01-two-stages.mdx:58-67 | Two-stage design: cheap first stage for candidates, reranker on those only | none | practice + effectiveness | UNSOURCED | Sentence Transformers, Retrieve & Re-Rank: "we first use a retrieval system that retrieves a large list of e.g. 100 possible hits… lexical search… or dense retrieval… in a second stage, we use a re-ranker based on a CrossEncoder". Nogueira and Cho (arXiv 1901.04085, preprint v5): "the top entry in the leaderboard of the MS MARCO passage retrieval task, outperforming the previous state of the art by 27% (relative) in MRR@10" | lead with an industry source; add evidence (labelled preprint) |
| C3 | 07/01:73-75 | ms-marco-MiniLM-L6-v2, about 23 million parameters, trained to rank passages for search questions | none | fact | VERIFIED | HF API: 22,714,113 parameters; model card: "trained on the MS Marco Passage Ranking task" | keep |
| C4 | 07/01:112-113 | "it dates from 2021" | none | fact | VERIFIED | HF commit history: "initial commit" 2021-04-15 | keep |
| C5 | 07/01:113-117 | bge-reranker-v2-m3, Qwen3 rerankers; hosted Cohere, Voyage, Jina; `CrossEncoder(name).predict(pairs)` | none | fact | VERIFIED | HF model cards (both Apache 2.0; Qwen3 reranker 0.6B/4B/8B); Voyage docs: "Voyage reranker receives as input a query and a list of candidate documents… returns the list of relevance scores"; MiniLM card shows `CrossEncoder(...).predict([...])` | keep |
| C6 | 07/02-why-reading-together-scores-better.mdx:78-79, 105-106 | Reranker learned from "a large set of real search questions paired with passages people judged relevant", "trained mostly on web search questions" | none | fact | VERIFIED (unlinked) | MS MARCO (arXiv 1611.09268): "1,010,916 anonymized questions—sampled from Bing's search query logs—each with a human generated answer… 8,841,823 passages" | add stronger backing (link MS MARCO) |
| C7 | 07/04-a-model-call-as-the-reranker.mdx:58-66 | Sun et al. (EMNLP 2023): properly instructed LLMs competitive with, sometimes better than, supervised rerankers; listwise; distilled into a smaller model | arXiv 2304.09542 | effectiveness | VERIFIED | v3 abstract: "properly instructed LLMs can deliver competitive, even superior results to state-of-the-art supervised methods on popular IR benchmarks… a distilled 440M model outperforms a 3B supervised model on the BEIR benchmark". ACL Anthology 2023.emnlp-main.923 | keep |
| C8 | 07/04:71-74 | Listwise is order-sensitive, "which is one reason Sun and colleagues passed a window of 20 passages down the list, overlapping by 10, rather than sending everything at once" | arXiv 2304.09542 | fact | **CONTRADICTED** (the reason) | §3.2: "Due to the token limitations of LLMs, we can only rank a limited number of passages using the permutation generation approach. To overcome this constraint, we propose a sliding window strategy." §5.1: "Since ChatGPT cannot manage 100 passages at a time, we use the sliding window strategy… with a window size of 20 and step size of 10." Order sensitivity is a separate finding (§6 analysis, Limitations): "the re-ranking effect of LLMs is highly sensitive to the initial order of passages". The window runs back to front ("re-rank these passages in a back-to-first order") | replace (state both facts, with the right reason) |
| C9 | 07/01:125-138, 07/03 | Timing (RTX 3070 Ti, batches of 64), reranking results on 43 questions | our data | effectiveness (ours) | OURS, labelled | on page | keep |
| D1 | 08-query-transformation/01-the-question-as-asked.mdx:55-67 | Questions and documents use different words; a rewrite turns the question into a search query | none | practice | UNSOURCED | Ma et al., "Query Rewriting for Retrieval-Augmented Large Language Models" (arXiv 2305.14283, EMNLP 2023): "there is inevitably a gap between the input text and the needed knowledge in retrieval… We first prompt an LLM to generate the query" | add stronger backing |
| D2 | 08/01:201-205 | "Keep the original too", and fuse with RRF | none | practice | UNSOURCED | RAG-Fusion README: "the original query and every rewrite are searched… the lists are merged [by RRF]" | covered by D5's edit; keep |
| D3 | 08/02-follow-up-questions.mdx:86-88, 116-119, 137-140 | "There are two common answers"; rewriting with the conversation is the better one; follow-ups are the clearest case for rewriting only when needed | none | practice | UNSOURCED | LangChain `create_history_aware_retriever`: "If there is no `chat_history`, then the `input` is just passed directly to the retriever. If there is `chat_history`, then the prompt and LLM will be used to generate a search query." LlamaIndex condense-question chat engine: "first generate a standalone question from conversation context and last message, then query the query engine with the condensed question" | lead with an industry source |
| D4 | 08/03-splitting-questions.mdx:130-133 | Splitting: one model call splits the question and each part gets its own search | none (links Module 2) | practice | UNSOURCED | LlamaIndex Sub Question Query Engine: "It first breaks down the complex query into sub questions for each relevant data source, then gather all the intermediate reponses and synthesizes a final response." | lead with an industry source |
| D5 | 08/03:178-181 | "Multi-query search, sometimes called RAG-Fusion, rewrites one question several ways and fuses the lists with RRF" | none | practice | PARTLY VERIFIED | RAG-Fusion (Raudaschl) does fuse with RRF. LangChain's `MultiQueryRetriever`: "Given a query, use an LLM to write a set of queries. Retrieve docs for each query. Return the unique union of all retrieved docs." So multi-query in general doesn't imply RRF | re-label (name both; RRF belongs to RAG-Fusion) |
| D6 | 08/04-hyde.mdx:63-71 | HyDE (Gao, Ma, Lin, Callan, ACL 2023): the passage may contain false details; clearly better than its unsupervised base retriever, comparable to fine-tuned retrievers | arXiv 2212.10496 | effectiveness | VERIFIED | Abstract (v1): "The document captures relevance patterns but is unreal and may contain false details… HyDE significantly outperforms the state-of-the-art unsupervised dense retriever Contriever and shows strong performance comparable to fine-tuned retrievers". ACL Anthology 2023.acl-long.99 | keep |
| D7 | 08/04:109-119; quizzes 08/04:217-225, 08/06:771 | Yoon et al. 2025: seven models, three fact-verification benchmarks; expansion helped on average only when the passage held sentences supported by gold evidence; usually worse otherwise; limited for niche or new knowledge | arXiv 2504.14175 | effectiveness | VERIFIED (v2, 4 Jun 2025; Findings of ACL 2025) | "Across experiments spanning three benchmarks and seven LLMs"; "Performance improvements from query expansion were consistent only when LLM-generated documents contained sentences entailed by gold evidence"; "with a few exceptions, performance on unmatched claims was lower than that of the corresponding baseline methods without query expansion"; "may be limited in real-world scenarios that require retrieving niche or novel knowledge" | re-label (add venue: Findings of ACL 2025) |
| D8 | 08/05-filters-in-the-question.mdx:368-369 | "self-querying, LangChain's name for it" | none | fact | VERIFIED | LangChain `SelfQueryRetriever`: "Retriever that uses a vector store and an LLM to generate the vector store queries." | keep (optional link) |
| D9 | 08/05:433-436 | A full self-query setup takes the filter's words out of the query | none | practice | VERIFIED | LangChain query-constructor prompt example: `"query": "teenager love"` with the artist, length and genre moved into `"filter"` | keep |
| D10 | 08/05:605-607 | "self-querying usually asks for the search query and the filters in one reply" | none | practice | VERIFIED | Same prompt: one structured request with `"query"` and `"filter"` | keep |
| D11 | 08/05:528-534 | Structured outputs guarantee shape, not values; don't hold for a truncated reply | Module 1 link | fact | covered by Module 1 (not re-audited here) | n/a | keep |
| D12 | 08/01:123-130, 08/04:150-155, 08/05:442-444 | Variants, HyDE passages and filter replies written by Claude for the course, author wrote the corpus | our data | method (ours) | OURS, labelled (model version not recorded in data) | `written_by`: "Claude, for the course; served in the lessons as scripted model replies" | keep; the author could add the model version if known |

### 2. Proposed edits

No proposed edit touches an exercise, demo or hidden-test string. All are prose outside `String.raw` blocks and quiz arrays, so none needs re-verifying in Pyodide. Anchors aren't used (external links only). Every URL below returned 200 to curl on 2026-09-30, except `doi.org/10.1145/3596512` (403 to scripts, like the course's other ACM DOIs; Crossref confirms the record).

#### E1 (A1) `05-document-parsing/00-intro.mdx:21-24` — re-label our figure
Current:
```
  PDF gives back words without structure, tables without meaning and images
  without words. On this lesson's four PDFs, writing tables as rows with their
  headers put every table question's answer first, and adding image
  descriptions took the labelled questions from 7 answered to 9. The tenth, an
  exact value in a chart, shows that some answers need the source itself.
```
Proposed:
```
  PDF gives back words without structure, tables without meaning and images
  without words. On this lesson's four PDFs, writing tables as rows with their
  headers put every table question's answer first, and adding image
  descriptions took our ten labelled questions from 7 answered in the top five
  to 9. The tenth, an exact value in a chart, shows that some answers need the
  source itself.
```
The same 7→9 figure appears in `06-recap-practice.mdx:694` ("9 of the 10… against 7"), which is already complete.

#### E2 (A3) `05-document-parsing/01-what-a-pdf-actually-contains.mdx:115-116` — lead with pypdf's docs
Current:
```
A PDF's page content isn't paragraphs, headings or tables. It's instructions to
draw: this piece of text, in this font, at this size, at this position. Here's
```
Proposed:
```
A PDF's page content isn't paragraphs, headings or tables. It's instructions to
draw: this piece of text, in this font, at this size, at this position.
[pypdf's documentation](https://pypdf.readthedocs.io/en/stable/user/extract-text.html)
puts it plainly: the format is about producing a visual result for printing,
and there's no information about what the header, footer, page numbers, tables
and paragraphs are. Here's
```
(The paragraph at 129-134 on tagged PDFs already gives the exception, so the two read well together.)

#### E3 (A7) `05-document-parsing/03-tables-for-retrieval.mdx:173-175` — industry source for table summaries
Current:
```
- **Add a model-written summary.** A common approach in multimodal RAG
  pipelines: ask a model to describe the table in
  prose, and index the description next to the table. The summaries here
```
Proposed:
```
- **Add a model-written summary.** Ask a model to describe the table in
  prose, and index the description next to the table.
  [LangChain's multi-vector retriever](https://blog.langchain.com/semi-structured-multi-modal-rag/)
  is one published version: it indexes a summary of each table and hands the
  raw table to the model when the summary matches. The summaries here
```

#### E4 (A9) `05-document-parsing/04-images-for-retrieval.mdx:85-87` — industry source for image descriptions
Current:
```
The common fix is to have a vision-capable model look at each image and
describe it, then index the description as a chunk, next to the document's
text. Sending an image to a model is the request shape from
```
Proposed:
```
The common fix is to have a vision-capable model look at each image and
describe it, then index the description as a chunk, next to the document's
text, as in
[LangChain's multi-vector retriever](https://blog.langchain.com/semi-structured-multi-modal-rag/).
Sending an image to a model is the request shape from
```

#### E5 (A12) `05-document-parsing/04-images-for-retrieval.mdx:157-160` — re-label the bias caveat (dropped from the latest version)
Current:
```
visual cues, and on their benchmark of visually rich documents, ViDoRe,
ColPali outperformed the other retrieval systems they tested. They note that
some of ViDoRe's queries were written by a commercial language model, which
may bias it.
```
Proposed:
```
visual cues, and on their benchmark of visually rich documents, ViDoRe,
ColPali outperformed the other retrieval systems they tested. Some of ViDoRe's
queries were written by Claude 3 Sonnet and then filtered by human annotators,
and the preprint's earlier versions noted that this may bias it.
```

#### E6 (A15) `05-document-parsing/04-images-for-retrieval.mdx:170-172` — link the stores
Current:
```
words to its best patch. That takes a vector store built for many vectors
per item, which some, such as Vespa and Qdrant, support, and far more
storage per page.
```
Proposed:
```
words to its best patch. That takes a vector store built for many vectors
per item, which some, such as
[Vespa](https://blog.vespa.ai/scaling-colpali-to-billions/) and
[Qdrant](https://qdrant.tech/documentation/concepts/vectors/), support, and
far more storage per page.
```

#### E7 (A21) `05-document-parsing/05-scans-and-layout-aware-parsers.mdx:189-192` — licences
Current:
```
[Marker](https://github.com/datalab-to/marker) and
[MinerU](https://github.com/opendatalab/MinerU) are other open-source
converters in the same vein, combining several models for layout, text,
tables and formulas, with Markdown or JSON as output.
```
Proposed:
```
[Marker](https://github.com/datalab-to/marker) and
[MinerU](https://github.com/opendatalab/MinerU) are other converters in the
same vein, combining several models for layout, text, tables and formulas,
with Markdown or JSON as output. Read their licences before commercial use:
Marker's code is Apache 2.0 but its model weights are licensed for research,
personal use and small companies, and MinerU adds commercial terms to
Apache 2.0.
```

#### E8 (A28) `05-document-parsing/05-scans-and-layout-aware-parsers.mdx:257-263` — label the preprint
Current:
```
[olmOCR paper](https://arxiv.org/abs/2502.18443) reports this kind of
error: models prompted with only the page image were prone to completing
unfinished sentences, or to inventing longer passages where the image was
ambiguous.
Adding the text and positions from the PDF's own text layer to the prompt,
which the authors call document anchoring, gave significantly fewer
hallucinations.
```
Proposed:
```
[olmOCR preprint (2025)](https://arxiv.org/abs/2502.18443) reports this kind
of error: models prompted with only the page image were prone to completing
unfinished sentences, or to inventing longer passages where the image was
ambiguous.
Adding the text and positions from the PDF's own text layer to the prompt,
which the authors call document anchoring, gave significantly fewer
hallucinations in their experience; they don't give a rate.
```
(The line before 257 ends "The"; keep it.)

#### E9 (B3) `06-hybrid-search/01-rare-words-should-count-for-more.mdx:103-104` — Lucene
Current:
```
reaches that point. Many implementations add 1 inside the logarithm to keep
every weight positive.
```
Proposed:
```
reaches that point. Many implementations add 1 inside the logarithm to keep
every weight positive:
[Lucene's BM25](https://lucene.apache.org/core/9_11_0/core/org/apache/lucene/search/similarities/BM25Similarity.html),
which Elasticsearch and OpenSearch are built on, uses
log(1 + (N − n + 0.5) / (n + 0.5)).
```
Same idea in quiz explanations `01:163` and `05-recap-practice.mdx:544`; they need no change.

#### E10 (B7) `06-hybrid-search/02-bm25.mdx:211` — the defaults are industry's
Current:
```
documents and the queries. This lesson uses k1 = 1.2 and b = 0.75. Some
```
Proposed:
```
documents and the queries. This lesson uses k1 = 1.2 and b = 0.75,
[Elasticsearch's defaults](https://www.elastic.co/docs/reference/elasticsearch/index-settings/similarity)
and Lucene's. Some
```

#### E11 (B9) `06-hybrid-search/02-bm25.mdx:236-238` — link the analyser
Current:
```
leaves hyphens alone. A search engine's default text analysis often doesn't:
Elasticsearch's and OpenSearch's standard analyser splits `REG-1007` into
`reg` and `1007`, and those match separately, anywhere in the corpus. For
```
Proposed:
```
leaves hyphens alone. A search engine's default text analysis often doesn't:
Elasticsearch's and OpenSearch's
[standard analyser](https://www.elastic.co/docs/reference/text-analysis/analysis-standard-tokenizer)
splits at hyphens, so `REG-1007` becomes `reg` and `1007`, and those match
separately, anywhere in the corpus. For
```

#### E12 (B10) `06-hybrid-search/03-fusing-rankings.mdx:99` — the published version
Current:
```
[Bruch and colleagues (2023)](https://arxiv.org/abs/2210.11934) found that a
```
Proposed:
```
[Bruch and colleagues (ACM TOIS, 2023)](https://doi.org/10.1145/3596512) found that a
```

#### E13 (B14) `06-hybrid-search/03-fusing-rankings.mdx:152-155` — industry leads for RRF
Current:
```
One question separates every value of k tried. RRF's appeal is exactly
this: almost nothing to tune, no scores to calibrate, and it works for any
number of rankings, which is why it's widely used to combine keyword and vector
results. Whether the combination is *better* than either search alone on
```
Proposed (also carries the B15 qualifier; see Needs a decision):
```
One question separates every value of k tried. RRF's appeal is exactly
this: almost nothing to tune, no scores to calibrate, and it works for any
number of rankings, which is why it's widely used to combine keyword and vector
results.
[Elasticsearch's RRF](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/reciprocal-rank-fusion)
defaults to k = 60 and says it needs no tuning, and
[Azure AI Search](https://learn.microsoft.com/en-us/azure/search/hybrid-search-ranking)
fuses hybrid queries the same way. That holds for one k shared by every
list. Bruch and colleagues found RRF much more sensitive when each list gets
its own k, which amounts to weighting one list against the other, the
setting this lesson's final exercise builds. Whether the combination is
*better* than either search alone on
```

#### E14 (B16) `06-hybrid-search/04-hybrid-search-measured-honestly.mdx:170-172` — Anthropic's example
Current:
```
Hybrid's reputation isn't wrong: exact identifiers, product names and error
codes are common in real questions, and keyword search is the dependable way
to match them. On a corpus where more questions were bare identifiers, the
```
Proposed:
```
Hybrid's reputation isn't wrong: exact identifiers, product names and error
codes are common in real questions, and keyword search is the dependable way
to match them.
[Anthropic's contextual retrieval post](https://www.anthropic.com/news/contextual-retrieval)
uses the same example: for "Error code TS-999", an embedding model might find
pages about error codes in general and miss the exact code, while BM25 looks
for that string. On a corpus where more questions were bare identifiers, the
```

#### E15 (B17, B18) `06-hybrid-search/04-hybrid-search-measured-honestly.mdx:178-189` — link SPLADE, ColBERT and the engines; soften PostgreSQL
Current:
```
name. **Learned sparse retrieval**, such as SPLADE, has a model write a
```
Proposed:
```
name. **Learned sparse retrieval**, such as
[SPLADE](https://arxiv.org/abs/2107.05720), has a model write a
```
Current:
```
gains some of meaning's reach. **Late interaction**, such as ColBERT, keeps
```
Proposed:
```
gains some of meaning's reach. **Late interaction**, such as
[ColBERT](https://arxiv.org/abs/2004.12832), keeps
```
Current:
```
together, at the cost of storing many vectors per chunk. In production,
hybrid search usually isn't assembled by hand as it is here: search engines
and vector databases, from Elasticsearch and OpenSearch to Qdrant, Weaviate
and PostgreSQL with extensions, run both searches and fuse them, with RRF or
a weighted sum among the options.
```
Proposed:
```
together, at the cost of storing many vectors per chunk. In production,
hybrid search usually isn't assembled by hand as it is here. Search engines
and vector databases, such as
[Elasticsearch](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/reciprocal-rank-fusion),
[OpenSearch](https://docs.opensearch.org/latest/vector-search/ai-search/hybrid-search/index/),
[Qdrant](https://qdrant.tech/documentation/concepts/hybrid-queries/) and
[Weaviate](https://docs.weaviate.io/weaviate/concepts/search/hybrid-search),
run both searches and fuse them, with RRF or a weighted sum among the
options. In PostgreSQL, [pgvector](https://github.com/pgvector/pgvector)
pairs with the built-in full-text search, and you write the fusion yourself.
```

#### E16 (B19) `06-hybrid-search/04-hybrid-search-measured-honestly.mdx:191-193` — weighted RRF in Elasticsearch
Current:
```
There's also a setting between the two. RRF can give each ranking a weight
that multiplies its 1/(k + rank) shares, so a smaller weight for BM25 makes
```
Proposed:
```
There's also a setting between the two. RRF can give each ranking a weight
that multiplies its 1/(k + rank) shares, as
[Elasticsearch's RRF retriever](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/retrievers/rrf-retriever)
allows, so a smaller weight for BM25 makes
```

#### E17 (C2) `07-reranking/01-two-stages.mdx:65-67` — industry lead and evidence for two stages
Current:
```
The first stage needs to be good at *finding*: if the answer isn't among its
candidates, the second stage can't recover it. The second stage needs to be
good at *ordering*: putting the answer at the very top.
```
Proposed:
```
The first stage needs to be good at *finding*: if the answer isn't among its
candidates, the second stage can't recover it. The second stage needs to be
good at *ordering*: putting the answer at the very top.

This is the standard shape.
[Sentence Transformers' retrieve-and-rerank guide](https://sbert.net/examples/sentence_transformer/applications/retrieve_rerank/README.html)
takes about 100 hits from keyword or embedding search, then scores them with
a cross-encoder. The approach took off with
[Nogueira and Cho's 2019 preprint](https://arxiv.org/abs/1901.04085), whose
BERT reranker topped the MS MARCO passage leaderboard, 27% better (relative,
by MRR@10) than the previous best.
```

#### E18 (C6) `07-reranking/02-why-reading-together-scores-better.mdx:78-79` — name MS MARCO
Current:
```
This module's reranker learned what a good match looks like from a large
set of real search questions paired with passages people judged relevant.
```
Proposed:
```
This module's reranker learned what a good match looks like from
[MS MARCO](https://arxiv.org/abs/1611.09268), a large set of real Bing
search questions paired with passages people judged relevant.
```

#### E19 (C8, CONTRADICTED) `07-reranking/04-a-model-call-as-the-reranker.mdx:71-76` — the window's real reason
Current:
```
closer to how a person compares them, but gives only an order. It's also
sensitive to the order the candidates arrive in, which is one reason Sun and
colleagues passed a window of 20 passages down the list, overlapping by 10,
rather than sending everything at once. This lesson sends all 30 in one
prompt, which is simpler and fits comfortably; with longer lists, the window
matters.
```
Proposed:
```
closer to how a person compares them, but gives only an order. It's also
sensitive to the order the candidates arrive in: Sun and colleagues found
results fell sharply when the first stage's order was shuffled or reversed.
And a long list may not fit in one prompt. Their model couldn't take 100
passages at once, so they passed a window of 20 up the list from the bottom,
moving 10 at a time. This lesson sends all 30 in one prompt, which is simpler
and fits comfortably; with longer lists, the window matters.
```
The quiz explanation at `04:192` names Sun and colleagues only for the listwise approach and stays correct.

#### E20 (D1) `08-query-transformation/01-the-question-as-asked.mdx:64-67` — evidence for rewriting
Current:
```
The previous lessons improved how the corpus is searched. This one improves
what is searched *for*: the query itself, before any search runs. The
simplest version is a **rewrite**: one model call that turns the question
into the kind of short, specific query a search engine handles well.
```
Proposed:
```
The previous lessons improved how the corpus is searched. This one improves
what is searched *for*: the query itself, before any search runs. The
simplest version is a **rewrite**: one model call that turns the question
into the kind of short, specific query a search engine handles well.
[Ma and colleagues (EMNLP 2023)](https://arxiv.org/abs/2305.14283) call this
rewrite-retrieve-read, starting from the same gap between the text a user
types and the knowledge the search needs.
```

#### E21 (D3) `08-query-transformation/02-follow-up-questions.mdx:116-119` — frameworks do exactly this
Current:
```
The better answer is the rewrite from the previous concept, given the
conversation as well as the question: the model resolves "they", "the
second one" and "it" from the earlier turns, and writes a query that stands
on its own.
```
Proposed:
```
The better answer is the rewrite from the previous concept, given the
conversation as well as the question: the model resolves "they", "the
second one" and "it" from the earlier turns, and writes a query that stands
on its own. Frameworks build this in. LlamaIndex's
[condense-question chat engine](https://docs.llamaindex.ai/en/stable/examples/chat_engine/chat_engine_condense_question/)
writes a standalone question from the conversation before every search, and
LangChain's
[`create_history_aware_retriever`](https://github.com/langchain-ai/langchain/blob/master/libs/langchain/langchain_classic/chains/history_aware_retriever.py)
does it only when there's a conversation, passing a first question straight
to the search.
```
(The LangChain behaviour also backs 137-140, "rewriting only when needed", and the recap router's design.)

#### E22 (D4) `08-query-transformation/03-splitting-questions.mdx:130-133` — industry version of splitting
Current:
```
The fix is to search for each part separately, which is
[goal decomposition](/02-the-agent-loop/08-planning-and-decomposition/01-goal-decomposition/#decomposing-before-executing-anything)
applied to a query: one model call splits the question, and each part gets
its own search. This function is loaded for every demo and exercise from
```
Proposed:
```
The fix is to search for each part separately, which is
[goal decomposition](/02-the-agent-loop/08-planning-and-decomposition/01-goal-decomposition/#decomposing-before-executing-anything)
applied to a query: one model call splits the question, and each part gets
its own search. LlamaIndex packages this as its
[sub-question query engine](https://docs.llamaindex.ai/en/stable/examples/query_engine/sub_question_query_engine/).
This function is loaded for every demo and exercise from
```
(The internal link is unchanged.)

#### E23 (D5) `08-query-transformation/03-splitting-questions.mdx:178-181` — multi-query and RAG-Fusion
Current:
```
Splitting is one of two techniques that search with several queries, and
they need different merges. **Multi-query** search, sometimes called
RAG-Fusion, rewrites one question several ways and fuses the lists with RRF.
Every list is after the same answer, so a chunk that several of them rank
```
Proposed:
```
Splitting is one of two techniques that search with several queries, and
they need different merges. **Multi-query** search rewrites one question
several ways and merges the lists. LangChain's
[`MultiQueryRetriever`](https://github.com/langchain-ai/langchain/blob/master/libs/langchain/langchain_classic/retrievers/multi_query.py)
takes their union;
[RAG-Fusion](https://github.com/Raudaschl/rag-fusion) fuses them with RRF,
the original question's list included. Every list is after the same answer,
so a chunk that several of them rank
```

#### E24 (D7) `08-query-transformation/04-hyde.mdx:109-110` — venue
Current:
```
A 2025 study by
[Yoon and colleagues](https://arxiv.org/abs/2504.14175) asked whether
```
Proposed:
```
A 2025 study by
[Yoon and colleagues (Findings of ACL 2025)](https://aclanthology.org/2025.findings-acl.980/) asked whether
```
Optional, same pattern: HyDE at `04:64` could link `https://aclanthology.org/2023.acl-long.99/` instead of arXiv. It is the same paper with the venue already named.

### 3. Needs a decision

1. **Does RRF's k "barely matter"? (B15, E13)** The concept teaches that RRF has "almost nothing to tune". The quiz at `06-hybrid-search/03-fusing-rankings.mdx:199-207` says "The choice of k barely matters here, as the paper found for its collections", and "k = 60 is used untuned".
   - Cormack et al. support this for one shared k, and so does the lesson's own data.
   - Bruch et al. (TOIS 2023, whose convex-combination result the page already cites) say "Contrary to existing studies, we find RRF to be sensitive to its parameters", with NDCG swinging "wildly" once each list gets its own k.
   - **Recommendation:** keep the teaching and the quizzes, and add the qualifier in E13. It frames per-list k as another form of weighting, which the lesson's final exercise already builds.
   - This refines what the concept says about tuning rather than reversing it. Flagged because it adds a counter-finding to a stated appeal of the technique.

No other finding changes what a concept teaches.
- **C8 (contradicted):** only the causal link between order sensitivity and the window is wrong. Both facts stay true, so the listwise-versus-pointwise teaching is unaffected.
- **A12:** only the caveat's version history changes.
- **D5:** makes the multi-query definition more precise without changing the splitting-versus-multi-query lesson. That lesson rests on RRF rewarding agreement, which is still true of RAG-Fusion.

### 4. Counts

- **Claims inventoried:** 70 table rows (A1–A29, B1–B20, C1–C9, D1–D12). Five of them are our own data (A1, A8, B20, C9, D12).
- **Verified:** 39 fully verified against the primary source, and 4 partly verified (A12 earlier versions only, A21, B18, D5).
- **Contradicted:** 1 (C8, the RankGPT sliding window's reason).
- **Not reachable:** 0. The ACM DOIs are 403 to scripts but confirmed via Crossref and the Cormack PDF.
- **Unsourced, needing a source:** 12 (A3, A7, A9, B3, B7, B14, B16, B19, C2, D1, D3, D4; B1 and C1 are covered downstream). The remaining unsourced facts are uncontroversial and marked keep.
- **Re-labelled:** 6 (A1 our figure's denominator, A12 earlier-version caveat, A21 licences, A28 preprint, D5 multi-query vs RAG-Fusion, D7 venue).
- **Replaced:** 2 (C8 text corrected; B10 link moved to the published TOIS version).
- **Added (new industry or evidence sources, by edit):** 16 edits add sources (E2, E3, E4, E6, E9, E10, E11, E13, E14, E15, E16, E17, E18, E20, E21, E22). They cite: pypdf docs, LangChain multi-vector, Vespa, Qdrant, Lucene, Elasticsearch (similarity, analyser, RRF, RRF retriever), Azure AI Search, Anthropic contextual retrieval, SPLADE, ColBERT, OpenSearch, Weaviate, pgvector, Sentence Transformers, Nogueira and Cho, MS MARCO, Ma et al., LlamaIndex (condense question, sub-question), LangChain (history-aware retriever, MultiQueryRetriever), RAG-Fusion.
- **Our data:** labelled with models and case counts everywhere. A1 lacks the denominator (E1). The Claude model version for variants and filters isn't recorded in the data files.

---

## Report: Citation audit: Module 5, Lessons 9 to 12

Scope: every `.mdx` in `src/content/modules/05-rag-systems/` folders `09-contextual-chunks`, `10-grounded-answers`, `11-agentic-rag` and `12-graph-rag` (intros, concepts, quiz explanations, recaps). Read-only; no repo files edited. Downloads are in `scratchpad/audit/m5C/`.

File shorthand: `09/02` = `09-contextual-chunks/02-contextual-retrieval.mdx`, and so on. Line numbers are the file's own.

Access notes: arXiv, anthropic.com, platform.claude.com (`.md` pages), microsoft.github.io, networkx, nature.com, neo4j.com, docs.cohere.com, LangChain and LlamaIndex docs all fetched directly. The Microsoft Research blog (LazyGraphRAG, DRIFT) returns a stub to scripts, so I read it through the Wayback Machine. OpenAI docs came from `platform.openai.com/docs/...md` and `developers.openai.com`. Nothing was unreachable.

---

### 1. Claims table

| ID | file:line | Claim (trimmed) | Source given | Kind | Verdict | Evidence (primary source, exact) | Recommendation |
|---|---|---|---|---|---|---|---|
| A1 | 09/02:80-86 | Anthropic's contextual retrieval (2024): a model reads the whole document and the chunk and writes a short context, which is prepended before embedding and before the BM25 index | anthropic.com/news/contextual-retrieval | practice | VERIFIED | Post, "Published Sep 19, 2024": "The resulting contextual text, usually 50-100 tokens, is prepended to the chunk before embedding it and before creating the BM25 index." | Keep. Switch the URL to the canonical `https://www.anthropic.com/engineering/contextual-retrieval`: `/news/` now redirects there, and Lesson 15 (`15-a-new-corpus/04…:28`) already uses `/engineering/`. |
| A2 | 09/02:85-97 | Their prompt, which the stored contexts followed (text block) | same | fact | VERIFIED | Post: "We used the following Claude 3 Haiku prompt… `<document> {{WHOLE_DOCUMENT}} </document> Here is the chunk we want to situate within the whole document <chunk> {{CHUNK_CONTENT}} </chunk> Please give a short succinct context…`" The wording matches; only the placeholder names differ. | Keep. |
| A3 | 09/02:99-103 | "contextual embeddings reduced the share of questions whose relevant chunk wasn't retrieved in the top 20 by 35%, … BM25 … 49%, … reranking … 67%. Those are Anthropic's reported results on their data" | same | effectiveness (vendor, own technique) | VERIFIED (figures). Metric loosely described. | "We use 1 minus recall@20 … which measures the percentage of relevant documents that fail to be retrieved within the top 20 chunks." "Contextual Embeddings reduced the top-20-chunk retrieval failure rate by 35% (5.7% → 3.7%)… 49% (5.7% → 2.9%)… Reranked… 67% (5.7% → 1.9%)." Figures are "average performance across all knowledge domains with the top-performing embedding configuration (Gemini Text 004)". The domains are "codebases, fiction, ArXiv papers, Science Papers", and the reranker was Cohere's. | Re-label. The metric counts relevant *chunks*, not questions. Give the absolute rates and say these are a vendor's figures for its own technique, from its best embedding setup. Ratios recomputed: 2.0/5.7 = 35.1%, 2.8/5.7 = 49.1%, 3.8/5.7 = 66.7%. |
| A4 | 09/02:53 (code comment), 180 | "one provider's published multipliers, as an example: cached reads at 0.1x, cache writes at 1.25x" | none (unlinked) | fact | VERIFIED | Anthropic prompt-caching docs: "5-minute cache write tokens are 1.25 times the base input tokens price… Cache read tokens are 0.1 times the base input tokens price (see the table footnote for per-model exceptions)". The exceptions are Opus 5.5 at 0.05x and Fable/Mythos 5.1 at 0.025x. | Keep. It's labelled as an example, and 0.1x is still the "standard" multiplier. |
| A5 | 09/02:190-191 | "Caches expire when unused, and some providers only cache prefixes above a minimum length" | none | fact | VERIFIED | Anthropic: "By default, the cache has a 5-minute lifetime… Shorter prompts cannot be cached, even if marked with `cache_control`." | Keep. |
| A6 | 09/01:67-71 | "stored it as metadata. Metadata isn't searched. Prepending the path to the text that gets embedded and indexed is." (also quiz 09/01:156) | none | practice | UNSOURCED | Industry backing found: LlamaIndex docs: "By default, the metadata is injected into the text for both embedding and LLM model calls." They also document `excluded_embed_metadata_keys` for leaving it out. | Lead with an industry source. Scope "isn't searched" to this pipeline, and note that LlamaIndex embeds metadata by default. |
| A7 | 09/03:211-221 | Small-to-big / parent-document retrieval, in two forms: neighbours and parents | none | practice | UNSOURCED | LangChain docs, "ParentDocumentRetriever": "During retrieval, it first fetches the small chunks but then looks up the parent ids for those chunks and returns those larger documents." LlamaIndex, "SentenceWindowNodeParser": nodes "contain the surrounding 'window' of sentences… combined with a MetadataReplacementNodePostProcessor, you can replace the sentence with it's surrounding context before sending the node to the LLM." | Lead with an industry source (both frameworks). |
| A8 | 09/00:20-22; 09/02:126, 150-152 | "from 32 to 36 questions answered in the top five, and from 22 to 26 at rank 1"; contexts "were written for the 75 chunks" | our data | ours | Labelled as this corpus, but with no case count and no writer model | `public/data/rag/chunk-contexts.json` `written_by`: "Claude, for the course, with each whole document in view…". The page never says the counts are out of 43, or that Claude wrote the contexts. | Re-label: add "of the 43 answerable questions", and name Claude as the context writer once. |
| B1 | 10/01:199-210 | Stable instructions first, per-question sources after, so a prefix cache can share them | internal link (Module 4) | practice | UNSOURCED (as industry practice) | OpenAI prompt-caching guide (current `.md`): "Keep the prefix stable. Put stable developer instructions and shared reference material first. If developer instructions or shared material contain timestamps, user-specific content, or other dynamic content, place those at the end rather than the beginning". Anthropic: "place the breakpoint at the end of the static prefix, not on the varying block." | Lead with an industry source (one sentence). |
| B2 | 10/01:212-215 | "on Anthropic's API, a prefix shorter than somewhere between 512 and 4,096 tokens, depending on the model, isn't cached at all" | none | fact | VERIFIED | Anthropic docs list minimums of "512 tokens for Claude Fable 5.1… Opus 5.5…", 1,024, 2,048 and "4,096 tokens for Claude Opus 4.6 and Claude Opus 4.5… Claude Haiku 4.5". | Keep. Add a link to `https://platform.claude.com/docs/en/build-with-claude/prompt-caching`. |
| B3 | 10/01:216-217 | Entries expire "after five minutes by default there" | none | fact | VERIFIED | "By default, the cache has a 5-minute lifetime." | Keep. |
| B4 | 10/01:217-219 | "Some providers cache automatically; Anthropic's API caches where the request marks a breakpoint, which goes at the end of the stable part." | none | fact | CONTRADICTED (out of date) | Anthropic now has "Automatic caching: Add a single `cache_control` field at the top level of your request. The system automatically applies the cache breakpoint to the last cacheable block". It also warns that automatic caching "places the breakpoint on the last cacheable block, which in this structure is the one that changes every request, so use an explicit breakpoint". OpenAI now documents breakpoints too: "Prompt caching is enabled by default… On GPT-5.6 and later… `prompt_cache_breakpoint` marks a boundary you choose… Place explicit markers at the end of stable content." | Replace. Both providers can place a breakpoint automatically *and* by hand, and both say to mark the end of the stable part when the suffix varies. The page's conclusion survives; the contrast between providers doesn't. |
| B5 | 10/01:221-233 | Put the best source first and the question last | internal links (Module 1 lost-in-the-middle, Module 4) | practice | UNSOURCED (as industry practice); the research is via internal links | Anthropic, prompting best practices: "Put longform data at the top: Place your long documents and inputs near the top of your prompt, above your query, instructions, and examples… Queries at the end can improve response quality by up to 30 percent in tests, especially with complex, multidocument inputs." | Lead with an industry source. The 30% is a vendor figure with no method shown, so attribute it ("Anthropic reports"). |
| B6 | 10/02:100-104; quiz 10/02:324-332 | ALCE: "even the best models they tested lacked complete citation support in about half of their answers on one of its datasets" | arXiv 2305.14627 | effectiveness | VERIFIED | arXiv v2 (31 Oct 2023), "Accepted by EMNLP 2023": "on the ELI5 dataset, even the best models lack complete citation support 50% of the time." | Keep. Optionally date it ("in 2023"), since the models tested are now old. |
| B7 | 10/02:183-189 | Anthropic recommends asking the model to quote relevant parts first, and making a response auditable "by having it cite quotes and sources for each of its claims" | two platform.claude.com links | practice | VERIFIED | Best practices: "Ground responses in quotes: For long document tasks, ask Claude to quote relevant parts of the documents first before carrying out its task." Reduce hallucinations: "Verify with citations: Make Claude's response auditable by having it cite quotes and sources for each of its claims." | Keep. |
| B8 | 10/02:222-231 | Citations API: `document` blocks with citations on, `citations` lists, `cited_text`, character positions / pages / block positions, document by position | Anthropic citations docs | fact | VERIFIED | "For plain text documents: Citations include the character index range (0-indexed)… For custom content documents: … content block index range… Document indices… are 0-indexed according to the list of all documents in your original request." The PDF citation type is `page_location`. | Keep. |
| B9 | 10/02:255-256 | `title` and `context` go to the model but can't be cited | same | fact | VERIFIED | "`title` and `context` are optional fields that are passed to the model but not used toward cited content." | Keep. |
| B10 | 10/02:256-261 | `search_result` blocks inside a tool result; citations name the source and title given | Anthropic search-results docs (via the same page) | fact | VERIFIED | search-results docs: "each citation carries the source and title you provided. Use them in RAG…". The example sends them as `tool_result` content. | Keep. |
| B11 | 10/02:261-263 | OpenAI file search marks answers with `file_citation` annotations naming the file | none (unlinked) | fact | VERIFIED | OpenAI file-search guide example: `"annotations": [ { "type": "file_citation", "index": 992, "file_id": "…", "filename": "deep_research_blog.pdf" }` | Keep. Add a link (`https://developers.openai.com/api/docs/guides/tools-file-search`). |
| B12 | 10/02:267-271 | Citations are "guaranteed to contain valid pointers to the provided documents"; `cited_text` is extracted by the API | Anthropic citations docs | fact | VERIFIED | "Because the API parses citations… and extracts `cited_text` directly, citations are guaranteed to contain valid pointers to the provided documents." | Keep. |
| B13 | 10/02:272-276 | `cited_text` doesn't count towards output tokens; "Anthropic also reports that, in its own evaluations," the feature cites the most relevant quotes significantly more often | same | fact + vendor effectiveness | VERIFIED; already attributed | "`cited_text` does not count toward your output tokens." "In Anthropic's evaluations, the citations feature is significantly more likely to cite the most relevant quotes from documents than purely prompt-based approaches." | Keep. |
| B14 | 10/02:283-287; quiz 10/02:378-387; recap 10/05:871 | Citations and structured outputs can't be combined; the API returns an error | same | fact | VERIFIED | "Citations cannot be used together with structured outputs. If you enable citations… and also include the `output_config.format` parameter… the API returns a 400 error. This is because citations require interleaving citation blocks with text output". | Keep. |
| B15 | 10/02:288-292 | Text blocks with no citations are normal; connecting words like " and " get their own blocks | same | fact | VERIFIED | Response example includes `{ "type": "text", "text": " and " }` between cited blocks. | Keep. |
| B16 | 10/03:137-152, 186-194 | Abstain below a threshold on the reranker's top score, chosen on labelled questions and confirmed on held-out ones | none (own design + our data) | practice | UNSOURCED | Cohere, "Reranking best practices": "To find a threshold on the scores to determine whether a document is relevant or not, we recommend going through the following process: Select a set of 30-50 representative queries… For each query provide a document that is considered borderline relevant… The average of sample_scores can then be used as a reference when deciding a threshold for filtering out irrelevant documents." | Lead with an industry source (one sentence). |
| B17 | 10/01:165 (instruction line); 10/03:202-204 | The instructions tell the model to say "the sources don't say" rather than guess | none | practice | UNSOURCED | Anthropic, reduce hallucinations: "Allow Claude to say 'I don't know': Explicitly give Claude permission to admit uncertainty. This simple technique can drastically reduce false information." | Add stronger backing. Attribute "drastically reduce" as Anthropic's claim, since no method is shown. |
| C1 | 11/03:180-182 (and echoed at 11/06:89-90) | "many systems use a pipeline by default and an agent only when a question needs one" | none | practice | UNSOURCED | Anthropic, "Building effective agents" (Dec 19, 2024): "we recommend finding the simplest solution possible, and only increasing complexity when needed… Agentic systems often trade latency and cost for better task performance… For many applications, however, optimizing single LLM calls with retrieval and in-context examples is usually enough." | Lead with an industry source at 11/03. 11/06 can stay as it is, since it builds on 11/03. |
| C2 | 11/04:265-279 | "A SQL tool for an agent usually stacks several guardrails": read-only, allowlist, row limit, timeout, budget | internal link (Module 3 least privilege) | practice | UNSOURCED (as industry practice) | LangChain SQL agent guide: "Building Q&A systems of SQL databases requires executing model-generated SQL queries. There are inherent risks in doing this. Make sure that your database connection permissions are always scoped as narrowly as possible for your agent's needs. This will mitigate, though not eliminate, the risks". | Lead with an industry source. |
| C3 | 11/05:60-72 | "Keyword search is all you need" (Subramanian et al., Amazon): Claude 3 Sonnet ReAct agent with `rga`/`pdfgrep`; 300-token chunks, top 5; RAGAS judge; 94.5% / 88% / 91.5% attainment; "generally performed slightly below"; FinanceBench 30% vs 24%; limits | arXiv 2602.23368 | effectiveness | VERIFIED. **Preprint not labelled.** | arXiv: v1 only (19 Dec 2025), no venue comment. Author affiliation "Amazon Web Services". "fixed 300 token chunking strategy with 20% overlap… of 5". "Anthropic Claude 3 Sonnet". "standard ReAct". "average attainment score of 94.52%… 88.05%… 91.48%". "the keyword search agent generally performed slightly below the RAG baseline". "mean correctness score of 30.40%… compared to 24.24%". Limitations: "performance degradation with large documents, restricted multimedia handling, and context window constraints… struggles with ambiguous queries". | Re-label as a preprint. |
| C4 | 11/05:74-80 | "Is Grep All You Need?" (Sen et al.): 116 LongMemEval questions; own harness plus three providers' CLIs; grep generally higher; scores depend strongly on harness and tool-result delivery | arXiv 2605.15184 | effectiveness | VERIFIED. **Preprint not labelled.** | arXiv: v1 only (14 May 2026), no venue. Abstract: "116-question sample from LongMemEval, using a custom agent harness (Chronos) and provider-native CLI harnesses (Claude Code, Codex, and Gemini CLI)… grep generally yields higher accuracy than vector retrieval in our comparisons in experiment 1; at the same time, overall scores still depend strongly on which harness and tool-calling style is used". | Re-label as a preprint. |
| C5 | quiz 11/05:145 | "The first paper's agent reached about 90% of its RAG baseline's scores" | same | effectiveness | VERIFIED | Abstract: "can attain over 90% of the performance metrics compared to traditional RAG systems". Mean of the three attainments = 91.35%. | Keep. |
| C6 | 11/05:102-107 | "Keyword search alone, once, answers 25 in the top five… 28… 31… 36… about 86%… 94% in the top ten" | our data | ours | Labelled as this corpus; no case count | 31/36 = 86.1% (checked). The 94% top-ten figure wasn't re-run, per the brief. | Re-label: add "of the 43 answerable questions" once. |
| C7 | 11/06:93-103 | Adaptive-RAG (Jeong et al., NAACL 2024): a small LM classifier predicts no / single / multi-step; labels from which strategy answered correctly, else from single- vs multi-hop dataset; better accuracy and efficiency than baselines, including adaptive ones | arXiv 2403.14403 | effectiveness + method | VERIFIED | arXiv comment "NAACL 2024". Abstract: "a classifier, which is a smaller LM trained to predict the complexity level… with automatically collected labels, obtained from actual predicted outcomes of models and inherent inductive biases in datasets… ours enhances the overall efficiency and accuracy of QA systems, compared to relevant baselines including the adaptive retrieval approaches." §3.2: "for those queries that remain unlabeled after the first labeling step, we assign 'B' to queries in single-hop datasets and 'C' to queries in multi-hop datasets." Classifier: "T5-Large". | Keep. |
| C8 | 11/06:128-133 | CRAG (Yan et al., 2024): a fine-tuned T5-large evaluator; its confidence triggers keep-and-filter / discard-and-web-search / both | arXiv 2401.15884 | method | VERIFIED. **Preprint not labelled.** | arXiv v3 (7 Oct 2024), comment only "Update results, add more analysis, and fix typos", no venue. (A search result reports it as a withdrawn ICLR 2025 submission; OpenReview blocked the fetch, so that's unconfirmed.) Body: "T5-large… is adopted for initializing the retrieval evaluator and fine-tuned." "If the action Correct is triggered, the retrieved documents will be refined… If the action Incorrect is triggered, the retrieved documents will be discarded. Instead, web searches are resorted to… Ambiguous which combines both of them". | Re-label as a preprint. |
| C9 | 11/06:134-139 | Self-RAG (Asai et al., 2023): reflection tokens for whether to retrieve, relevance, support and usefulness; retrieves on demand | arXiv 2310.11511 | method | VERIFIED. The venue is missing and the year could be updated. | Abstract: "trains a single arbitrary LM that adaptively retrieves passages on-demand, and generates and reflects on retrieved passages and its own generations using special tokens, called reflection tokens." Table 1: "Four types of reflection tokens": Retrieve, ISREL, ISSUP, ISUSE. Published as an ICLR 2024 oral (iclr.cc/virtual/2024/oral/19736). | Re-label: "(Asai and colleagues, ICLR 2024)". |
| D1 | 12/01:83-87; 12/04:73 | The GraphRAG paper (Edge et al., Microsoft) calls these global questions and treats them as summarisation, not retrieval | arXiv 2404.16130 | fact about paper | VERIFIED. **Preprint not labelled.** | v2 (19 Feb 2025), no venue. Abstract: "RAG fails on global questions directed at an entire text corpus… since this is inherently a query-focused summarization (QFS) task, rather than an explicit retrieval task." | Re-label as a preprint, revised 2025 (at first mention, 12/01). |
| D2 | 12/01:87-90 | The GraphRAG library's local search finds the entities a question mentions and gathers neighbours, relationships and source text | none here (linked at 12/03:246) | fact | VERIFIED | Local search docs: "identifies a set of entities from the knowledge graph that are semantically-related to the user input. These entities serve as access points… connected entities, relationships, entity covariates, and community reports. Additionally, it also extracts relevant text chunks". | Keep. |
| D3 | 12/02:116-118 | GraphRAG's extraction describes each relationship in its own words, with a strength, and summarises the descriptions later | none | fact | VERIFIED | Paper v2 Appendix E prompt: "relationship description: explanation as to why you think the source entity and the target entity are related… relationship strength: a numeric score". LazyGraphRAG post's table: GraphRAG "uses an LLM to summarize all observations of each entity and relationship". | Keep. |
| D4 | 12/02:178-181 | "At a larger scale, systems generate candidate merges automatically, by string similarity or by comparing embeddings of the names, and have a person review them" | none | practice | UNSOURCED | Neo4j blog, "LLM knowledge graph builder front-end architecture": "Users can merge similar entities… We use a combination of vector and text distance similarity to group the candidates. You can remove individual nodes before merging the selected rows of nodes." (Neo4j's `neo4j-graphrag` library instead merges automatically, with exact, fuzzy (RapidFuzz) or spaCy semantic resolvers.) | Lead with an industry source. |
| D5 | 12/03:242-249; quiz 12/03:316-325; 12/05:111-118 | Local search "embeds entity descriptions, finds the entities most related to the question, then gathers their neighbours, relationships, source text and community reports" | GraphRAG local search docs | fact | VERIFIED | Dataflow: "User Query… Entity Description Embedding → Extracted Entities → Entity-Text Unit Mapping… Entity-Report Mapping… Entity-Entity Relationships". | Keep. |
| D6 | 12/04:79-82 | Louvain "looks for the grouping that puts as many edges as possible inside groups rather than between them" | none (networkx named) | fact | VERIFIED in substance, imprecise in wording | networkx docs: "It is a heuristic algorithm based on modularity optimization." Taken literally, "as many edges as possible inside groups" is maximised by one single group. Modularity compares against what chance would give. | Soften / make precise. |
| D7 | 12/04:83-85 | The paper uses Leiden, "a refinement of Louvain that guarantees every community is connected", applied hierarchically | none (unlinked) | fact | VERIFIED | Traag et al., Sci. Rep. 2019: "We prove that the Leiden algorithm yields communities that are guaranteed to be connected." GraphRAG v2 §3.1.3: "we use Leiden community detection… in a hierarchical manner, recursively detecting sub-communities". | Keep. Add a link to Traag et al. |
| D8 | 12/04:135-138, 151-155; quiz 12/04:203 | Map step answers per summary and scores helpfulness; zero-scored answers are dropped; the paper packs summaries into batches | Edge et al. | fact | VERIFIED | v2 §3.1.6: "Community summaries are randomly shuffled and divided into chunks of pre-specified token size… The LLM is also asked to generate a score between 0-100 indicating how helpful… Answers with score 0 are filtered out." | Keep. |
| D9 | 12/05:59-63; quiz 12/05:240-250 | The GraphRAG library can update an index: "new documents are extracted on their own and merged in, and it tries to avoid recomputing communities, though sometimes it has to". Quiz: "recomputes communities only when needed… in the worst case costs as much as indexing again" | GraphRAG CLI page | fact | **Not supported by the linked page**; partly supported elsewhere | The CLI page says only: "update — Update an existing knowledge graph index." The GraphRAG 1.0 blog (Microsoft Research) says: "a new update command in the CLI that computes the deltas between an existing index and newly added content and intelligently merges the updates to minimize re-indexing… Adding brand new content can alter the community structure such that much of an index needs to be re-computed – the update command resolves this". The "tries… worst case" wording comes from a 2024 *design plan* in GitHub issue #741 ("The append command will _try_ to minimize community recomputes… the worst case degrades to the same performance as a normal indexing"), not from shipped docs. | Replace the source with the 1.0 blog and soften the community detail (see Needs a decision, item 1). |
| D10 | 12/05:83-91; quiz 12/05:252-260 | LazyGraphRAG: NLP noun-phrase concepts, no summaries in advance; "indexing costs the same as vector RAG, and 0.1% of full GraphRAG"; comparable to global search at "more than 700 times lower query cost"; own news benchmark, model judge | Microsoft Research blog | effectiveness (vendor) | VERIFIED; already attributed ("They report") | Blog, Nov 25, 2024 (via Wayback): "LazyGraphRAG data indexing costs are identical to vector RAG and 0.1% of the costs of full GraphRAG… comparable answer quality to GraphRAG Global Search for global queries, but more than 700 times lower query cost." "Uses NLP noun phrase extraction to extract concepts and their co-occurrences". "None – the 'lazy' approach defers all LLM use until query time". "Dataset: 5,590 AP news articles… 100 synthetic queries… with an LLM used to compare pairs of answers head-to-head". | Keep. |
| D11 | 12/05:94-98 | Zeng et al. (2025): two flaws (unrelated questions, evaluation biases); three GraphRAG methods' gains "much more moderate than previously reported" | arXiv 2506.06331 | effectiveness | VERIFIED. **Preprint and revision not labelled.** | v1 31 May 2025, **v2 13 Aug 2026**, no venue. The v2 abstract is unchanged from v1: "two critical flaws, i.e., unrelated questions and evaluation biases… evaluate 3 representative GraphRAG methods and find that their performance gains are much more moderate than reported previously." | Re-label: a preprint, 2025, revised 2026. |
| D12 | 12/05:119-123; quiz 12/05:263-271 | DRIFT compares the question with the most relevant community reports, drafts a broad answer with follow-ups, and answers those with local search | MSR blog (2024) | method | VERIFIED | Blog, Oct 31, 2024: "Primer: When a user submits a query, DRIFT compares it to the top K most semantically relevant community reports. This generates an initial answer along with several follow-up questions… Follow-Up: … DRIFT executes each follow-up using a local search variant." | Keep. |
| D13 | 12/05:124-128 | LightRAG (Guo et al., 2024) "finds no communities and writes no summaries"; low-level keywords go to entities, high-level to relationships, plus neighbours | arXiv 2410.05779 | method | Mechanism VERIFIED. **"writes no summaries" CONTRADICTED (minor).** Venue out of date. | Paper v3 §3.1: "we employ a LLM-empowered profiling function… to generate a text key-value pair (K, V) for each entity node… and relation edge… the corresponding value is a text paragraph summarizing relevant snippets". §3.2: "match local query keywords with candidate entities and global query keywords with relations… gathers neighboring nodes". It uses no communities (it contrasts itself with "the community-based traversal method used in GraphRAG"). Published in Findings of EMNLP 2025 (ACL Anthology 2025.findings-emnlp.568). | Replace the wording ("no *community* summaries"). Update the venue. |
| D14 | 12/05:129-136; quiz 12/05:274-282 | HippoRAG: schemaless triples per passage; the question's entities seed Personalized PageRank; passages ranked by aggregated scores. HippoRAG 2 adds passage nodes and seeds by matching the whole query to triples | arXiv 2405.14831, 2502.14802 | method | VERIFIED | HippoRAG (NeurIPS 2024): "transform a corpus into a schemaless knowledge graph… runs the Personalized PageRank (PPR) algorithm on the KG, using the query concepts as the seeds… we aggregate the output PPR node probability over the previously indexed passages and use that to rank them". HippoRAG 2 (ICML 2025): "each passage in the corpus is treated as a passage node… By default, HippoRAG 2 adopts the query-to-triple approach". | Keep. |
| D15 | 12/05:187-190 | Cypher, "on which the ISO's graph query standard, GQL, published in 2024, is largely based" | none | fact | Partly VERIFIED | ISO page: "ISO/IEC 39075:2024 - Information technology — Database languages — GQL", status Published. Neo4j Cypher manual, GQL conformance: "GQL has adopted much of Cypher®'s query construction semantics, such as adhering to the MATCH/RETURN format." (That's a vendor's own statement; "largely based" is a little stronger.) | Re-label: "adopted much of Cypher's query style", attributed to Neo4j. |
| D16 | 12/05:201-202 | "Neo4j, for one, can grant a role access to particular labels and relationship types" | none | fact | VERIFIED | Neo4j operations manual, privileges: "segment: The labels, relationship types, pattern, procedures… the privilege applies to". | Keep. |
| D17 | 12/05:45-46 | "Output tokens also usually cost several times more per token than input" | none | fact | VERIFIED | Anthropic pricing table, e.g. Claude Opus 5: $5 / MTok input and $25 / MTok output. | Keep. |

Out of scope, noted only: the syllabus's Lesson 11 entry says arXiv 2602.23368 is by "AWS". That's consistent with the PDF.

---

### 2. Proposed edits

None of these edits touch an exercise, demo or hidden-test string, so none need re-verifying in Pyodide. D9 changes a `QuizGroup` card: that's JSON in the page, not Python.

#### A1: canonical URL (09/02:81)
Current:
```
[**contextual retrieval**](https://www.anthropic.com/news/contextual-retrieval)
```
Proposed:
```
[**contextual retrieval**](https://www.anthropic.com/engineering/contextual-retrieval)
```

#### A3: Anthropic's figures, precise and labelled (09/02:99-103)
Current:
```
On their datasets, contextual embeddings reduced the share of questions whose
relevant chunk wasn't retrieved in the top 20 by 35%, adding contextual BM25
took the reduction to 49%, and adding reranking as well took it to 67%.
Those are Anthropic's reported results on their data; what follows is this
corpus.
```
Proposed:
```
Anthropic reports that, averaged over its own test sets (code, fiction and
research papers) with its best embedding model, contextual embeddings cut the
share of relevant chunks missing from the top 20 by 35%, from 5.7% to 3.7%.
Adding contextual BM25 made the cut 49%, to 2.9%, and adding a reranker as
well made it 67%, to 1.9%. Those are a vendor's figures for its own
technique, on its own data; what follows is this corpus.
```
(Ratios recomputed: 35.1%, 49.1%, 66.7%. These figures appear nowhere else in `src/content/modules`.)

#### A6: metadata in embedded text (09/01:67-71)
Current:
```
Every chunk already carries the missing words. Lesson 3 gave each one a
section path, the document title followed by every heading above it, and
stored it as metadata. Metadata isn't searched. Prepending the path to the
text that gets embedded and indexed is. This function is already loaded for
every demo and exercise in this lesson:
```
Proposed:
```
Every chunk already carries the missing words. Lesson 3 gave each one a
section path, the document title followed by every heading above it, and
stored it as metadata. In this module's pipeline, metadata isn't searched.
Prepending the path to the text that gets embedded and indexed is. Some
frameworks do this by default: LlamaIndex, for one,
[writes a chunk's metadata into the text it embeds](https://developers.llamaindex.ai/python/framework/module_guides/loading/documents_and_nodes/usage_documents/)
unless told to leave it out. This function is already loaded for every demo
and exercise in this lesson:
```
(The quiz explanation at 09/01:156, "Metadata is for filtering and citing…", reads correctly for this pipeline. No change needed.)

#### A7: small-to-big in the frameworks (09/03:211-215)
Current:
```
precise chunks, which match a question sharply, then hand the model
something bigger around each match. It goes by names like small-to-big or
parent-document retrieval, and comes in two common forms:
```
Proposed:
```
precise chunks, which match a question sharply, then hand the model
something bigger around each match. It goes by names like small-to-big or
parent-document retrieval, and the common frameworks build in both of its
forms: LlamaIndex's
[sentence windows](https://developers.llamaindex.ai/python/framework/module_guides/loading/node_parsers/modules/)
for the first, and LangChain's
[`ParentDocumentRetriever`](https://python.langchain.com/docs/how_to/parent_document_retriever/)
for the second:
```

#### A8: our data, with count and writer (09/00:20-22; 09/02:126)
Current (09/00):
```
  back was the largest single improvement to the pipeline: from 32 to 36
  questions answered in the top five, and from 22 to 26 at rank 1. It also
```
Proposed:
```
  back was the largest single improvement to the pipeline: from 32 to 36 of
  the 43 answerable questions in the top five, and from 22 to 26 at rank 1.
  It also
```
Current (09/02:126):
```
matters here: contexts were written for the 75 chunks of the company's
```
Proposed:
```
matters here: Claude wrote contexts for the 75 chunks of the company's
```
(Optional, same idea: 12/02:152 "The extraction is model-written for the course" → "The extraction was written by Claude for the course", per `graph.json`'s `written_by`.)

#### B1 + B4: where the cache point goes (10/01:206-219)
Current:
```
thousands of tokens. They go first, and the retrieved sources, which are
different for every question, go after them.

Two practical details decide whether that prefix is actually cached. A cache
has a minimum size: on Anthropic's API, a prefix shorter than somewhere
between 512 and 4,096 tokens, depending on the model, isn't cached at all, so
140 tokens of instructions only pay off as part of a larger stable prefix.
And entries expire when unused, after five minutes by default there, so
questions far apart don't share anything either. Some providers cache
automatically; Anthropic's API caches where the request marks a breakpoint,
which goes at the end of the stable part.
```
Proposed:
```
thousands of tokens. They go first, and the retrieved sources, which are
different for every question, go after them. The providers' own caching
guides say the same: OpenAI's, for one, says to put
[stable instructions and shared material first](https://platform.openai.com/docs/guides/prompt-caching)
and anything that changes at the end.

Three practical details decide whether that prefix is actually cached. A
cache has a minimum size: on
[Anthropic's API](https://platform.claude.com/docs/en/build-with-claude/prompt-caching),
a prefix shorter than somewhere between 512 and 4,096 tokens, depending on
the model, isn't cached at all, so 140 tokens of instructions only pay off as
part of a larger stable prefix. Entries expire when unused, after five
minutes by default there, so questions far apart don't share anything
either. And the cache is written where a breakpoint marks it. Both OpenAI
and Anthropic can place one for you at the end of the latest message, but in
a retrieval request that's the question, which changes every time. So both
providers' docs say to mark the end of the stable part yourself.
```

#### B5: question last, from the vendor's guide (10/01:232-233)
Current:
```
- **Put the question last,** after the sources, at the end, so it's the
  final thing the model reads before answering.
```
Proposed:
```
- **Put the question last,** after the sources, at the end, so it's the
  final thing the model reads before answering. Anthropic's
  [prompting guide](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
  gives the same order, long documents at the top and the query at the end,
  and reports that in its tests this improved answers by up to 30%.
```

#### B6 (optional): date ALCE (10/02:100-103)
Current: `citations automatically, and found that even the best models they tested`
Proposed: `citations automatically, and found in 2023 that even the best models they tested`

#### B11: link OpenAI's annotations (10/02:261-263)
Current:
```
source and title each result was given. OpenAI's file search tool, which
searches files uploaded to OpenAI, similarly marks its answers with
`file_citation` annotations naming the file drawn on.
```
Proposed:
```
source and title each result was given. OpenAI's
[file search tool](https://developers.openai.com/api/docs/guides/tools-file-search),
which searches files uploaded to OpenAI, similarly marks its answers with
`file_citation` annotations naming the file drawn on.
```

#### B16: how reranker vendors choose a threshold (10/03:151-152)
Current:
```
should decline more readily still. The labelled set is what lets you see the
trade in numbers rather than guess at it.
```
Proposed:
```
should decline more readily still. The labelled set is what lets you see the
trade in numbers rather than guess at it. Reranker vendors suggest the same
approach: Cohere's
[guide](https://docs.cohere.com/docs/reranking-best-practices), for one,
sets a relevance threshold from the scores of 30 to 50 representative
questions, each paired with a borderline document.
```

#### B17: permission to say it doesn't know (10/03:202-204)
Current:
```
score can't catch it, so the model has to: the instructions ask it to say
"the sources don't say" rather than guess, and code needs to recognise when
it has. This is already loaded for every demo and exercise from here to the
```
Proposed:
```
score can't catch it, so the model has to: the instructions ask it to say
"the sources don't say" rather than guess. That's the first item in
Anthropic's
[advice on reducing hallucinations](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations):
give the model explicit permission to say it doesn't know. Code then needs
to recognise when it has. This is already loaded for every demo and exercise from here to the
```

#### C1: pipeline by default (11/03:178-182)
Current:
```
For a question that one search answers, the agent is simply a more expensive
pipeline. Most of this module's labelled questions are like that: 3 of the
43 answerable ones are multi-hop. That's why many systems use a pipeline by
default and an agent only when a question needs one, or give the agent the
pipeline as its search tool, so each search is as good as possible.
```
Proposed:
```
For a question that one search answers, the agent is simply a more expensive
pipeline. Most of this module's labelled questions are like that: 3 of the
43 answerable ones are multi-hop. Anthropic's
[advice on building agents](https://www.anthropic.com/engineering/building-effective-agents)
makes the same point: start with the simplest thing that works, since agents
trade latency and cost for better results, and add one only when it's
needed. So many systems use a pipeline by default and an agent only when a
question needs one, or give the agent the pipeline as its search tool, so
each search is as good as possible.
```
(11/06:89-90 repeats "many systems use a pipeline by default…" right after linking back to 11/03. Leave it as it is.)

#### C2: narrowly scoped database access (11/04:265-266)
Current:
```
A SQL tool for an agent usually stacks several guardrails, each doing a
different job:
```
Proposed:
```
LangChain's
[SQL agent guide](https://docs.langchain.com/oss/python/langchain/sql-agent)
puts the first rule plainly: scope the database connection's permissions "as
narrowly as possible for your agent's needs", which reduces the risk but
doesn't remove it. In practice a SQL tool stacks several guardrails, each
doing a different job:
```

#### C3 + C4: preprints (11/05:57-61, 74-75)
Current:
```
here the comparison is against a full retrieval pipeline. Two recent papers put that to the
test, and both are worth reading closely rather than by their titles.

**["Keyword search is all you need"](https://arxiv.org/abs/2602.23368)**
(Subramanian and colleagues, at Amazon, arXiv 2602.23368) gave a ReAct agent,
```
Proposed:
```
here the comparison is against a full retrieval pipeline. Two recent
preprints, not yet peer-reviewed, put that to the test, and both are worth
reading closely rather than by their titles.

**["Keyword search is all you need"](https://arxiv.org/abs/2602.23368)**
(Subramanian and colleagues, at Amazon, a preprint on arXiv) gave a ReAct agent,
```
Current:
```
(Sen and colleagues, arXiv 2605.15184) compared grep with vector retrieval on 116
```
Proposed:
```
(Sen and colleagues, a 2026 preprint on arXiv) compared grep with vector retrieval on 116
```
(The subsection title "What two recent papers found" can stay. Quiz 11/05:145-164 says "paper", which is fine.)

#### C6: case count (11/05:102)
Current: `Keyword search alone, once, answers 25 in the top five. Searching Lesson 9's`
Proposed: `Keyword search alone, once, answers 25 of the 43 in the top five. Searching Lesson 9's`

#### C8 + C9: CRAG preprint, Self-RAG venue (11/06:128-134)
Current:
```
[CRAG](https://arxiv.org/abs/2401.15884), Corrective Retrieval Augmented
Generation (Yan and colleagues, 2024), adds a lightweight retrieval evaluator,
```
Proposed:
```
[CRAG](https://arxiv.org/abs/2401.15884), Corrective Retrieval Augmented
Generation (Yan and colleagues, a 2024 preprint), adds a lightweight retrieval evaluator,
```
Current: `[Self-RAG](https://arxiv.org/abs/2310.11511) (Asai and colleagues, 2023)`
Proposed: `[Self-RAG](https://arxiv.org/abs/2310.11511) (Asai and colleagues, ICLR 2024)`

#### D1: GraphRAG paper is a preprint (12/01:83-84)
Current:
```
[The GraphRAG paper](https://arxiv.org/abs/2404.16130), by Edge and colleagues
at Microsoft, calls these **global** questions, and treats them as a
```
Proposed:
```
[The GraphRAG paper](https://arxiv.org/abs/2404.16130), a preprint by Edge and
colleagues at Microsoft, revised in 2025, calls these **global** questions,
and treats them as a
```

#### D4: entity resolution in practice (12/02:178-181)
Current:
```
backticks, applied by `canonical`. At a larger scale, systems generate
candidate merges automatically, by string similarity or by comparing
embeddings of the names, and have a person review them. A wrong merge is
```
Proposed:
```
backticks, applied by `canonical`. At a larger scale, tools generate
candidate merges automatically. Neo4j's
[LLM Knowledge Graph Builder](https://neo4j.com/blog/developer/frontend-architecture-and-integration/),
for one, groups candidates by a mix of embedding and text-distance
similarity, and lets a person remove any before merging the rest. A wrong merge is
```

#### D6 + D7: Louvain wording, Leiden link (12/04:80-85)
Current:
```
algorithms. The Louvain method, used here from the networkx library, looks
for the grouping that puts as many edges as possible inside groups rather than
between them. It involves some randomness, so it's given a fixed seed to make
the result repeatable. The GraphRAG paper uses Leiden, a refinement of Louvain
that guarantees every community is connected, and applies it hierarchically,
```
Proposed:
```
algorithms. The Louvain method, used here from the networkx library, looks
for the grouping that puts more edges inside groups, and fewer between them,
than chance would, a score called modularity. It involves some randomness, so
it's given a fixed seed to make the result repeatable. The GraphRAG paper uses
[Leiden](https://www.nature.com/articles/s41598-019-41695-z) (Traag and
colleagues, 2019), a refinement of Louvain that guarantees every community is
connected, and applies it hierarchically,
```
(Quiz 12/04:175-181, "more edges inside the group than between groups", is fine as it is.)

#### D9: GraphRAG's update command (12/05:59-63), and its quiz card
Current:
```
  recomputing, and every summary touching them rewriting. Microsoft's GraphRAG
  library can [update an existing index](https://microsoft.github.io/graphrag/cli/)
  instead of rebuilding it: new documents are extracted on their own and
  merged in, and it tries to avoid recomputing communities, though sometimes
  it has to. Keeping indexes in
```
Proposed:
```
  recomputing, and every summary touching them rewriting. Microsoft's GraphRAG
  library has an
  [`update` command](https://www.microsoft.com/en-us/research/blog/moving-to-graphrag-1-0-streamlining-ergonomics-for-developers-and-users/)
  that works out what's new since the last index and merges it in, rather
  than indexing everything again. Microsoft notes that new content can still
  change the community structure, and then much of the index has to be
  recomputed. Keeping indexes in
```
Quiz card (12/05:240-250). Current correct option and explanation:
```
        "Extracts only the new documents, merges them in, and recomputes communities only when needed",
…
      "explanation": "Existing documents' extractions are reused, and only the new ones cost extraction calls. Communities and their summaries are recomputed only when the changes demand it, which in the worst case costs as much as indexing again."
```
Proposed:
```
        "Works out what's new, extracts only that, and merges it into the existing index",
…
      "explanation": "Existing documents' extractions are reused, and only the new ones cost extraction calls. New content can still change the community structure, and then the summaries that depend on it have to be written again."
```
(The option-length balance is for the separate pass; the new option is about the same length as the old one.)

#### D11: Zeng et al. is a preprint, revised (12/05:94)
Current: `[Zeng and colleagues (2025)](https://arxiv.org/abs/2506.06331) argued that the`
Proposed: `[Zeng and colleagues](https://arxiv.org/abs/2506.06331), in a 2025 preprint revised in 2026, argued that the`
(The claim itself is unchanged in v2.)

#### D13: LightRAG wording and venue (12/05:124-126)
Current:
```
- **LightRAG** ([Guo and colleagues, 2024](https://arxiv.org/abs/2410.05779))
  extracts a graph as GraphRAG does, but finds no communities and writes no
  summaries. The model pulls specific and broad keywords from the question;
```
Proposed:
```
- **LightRAG** ([Guo and colleagues, EMNLP Findings 2025](https://aclanthology.org/2025.findings-emnlp.568/))
  extracts a graph as GraphRAG does, with a short model-written description
  of each entity and relationship, but finds no communities and writes no
  community summaries. The model pulls specific and broad keywords from the question;
```

#### D15: GQL and Cypher (12/05:187-190)
Current:
```
Graph databases have their own query languages. The best known is
**Cypher**, from Neo4j, which other databases implement as openCypher, and
on which the ISO's graph query standard, GQL, published in 2024, is largely
based. A chain is one pattern in it: roughly, "match every agent with a path
```
Proposed:
```
Graph databases have their own query languages. The best known is
**Cypher**, from Neo4j, which other databases implement as openCypher. The
ISO's graph query standard, GQL, published in 2024,
[adopted much of Cypher's query style](https://neo4j.com/docs/cypher-manual/current/appendix/gql-conformance/),
as Neo4j puts it. A chain is one pattern in it: roughly, "match every agent with a path
```

---

### 3. Needs a decision

1. **D9, the GraphRAG `update` quiz card (12/05:240-250).** This is a sourcing fix that also changes a quiz's taught fact. The card teaches that the update "recomputes communities only when needed" and "in the worst case costs as much as indexing again". That behaviour comes from a 2024 design plan in GitHub issue #741, not from any shipped documentation. The linked CLI page only says "Update an existing knowledge graph index". The GraphRAG 1.0 blog documents delta computation and merging, and says new content "can alter the community structure such that much of an index needs to be re-computed". **Recommendation:** apply the rewording above, so the card teaches only what Microsoft has published. The concept's point, that a graph is expensive to keep current, is unaffected.
2. **B4, the provider caching contrast (10/01:217-219).** This fixes an out-of-date fact rather than changing the concept, but it does change what the paragraph says about providers. "Some providers cache automatically; Anthropic's API caches where the request marks a breakpoint" is no longer true in either direction: Anthropic has automatic caching, and OpenAI now documents breakpoints. **Recommendation:** apply the replacement. The practical lesson (mark the end of the stable part) is kept, and both vendors' current docs now support it directly.

Nothing else in these four lessons undercuts what a concept teaches.

---

### 4. Counts

- **Claims inventoried:** 51 rows (A1-A8, B1-B17, C1-C9, D1-D17). Our-data rows (A8, C6) were checked for labelling only.
- **Verified:** 37 (A1-A5, B2, B3, B6-B15, C3-C5, C7-C9, D1-D3, D5-D8, D10-D12, D14-D17). D6 and D15 have wording fixes, and C3, C4, C8, C9, D1 and D11 need labels.
- **Contradicted:** 2. B4 is out of date: Anthropic now has automatic caching, and OpenAI has breakpoints. D13, "LightRAG writes no summaries", is minor: it writes a summary per entity and per relation, just no community summaries.
- **Not supported by the linked source:** 1 (D9; partly supported by other Microsoft sources).
- **Unreachable:** 0.
- **Unsourced practice claims:** 9 (A6, A7, B1, B5, B16, B17, C1, C2, D4). For each I've named and verified an industry source to lead with.
- **Our data needing a label:** 2 (A8, C6): add the case count (43 answerable), and name Claude as the context writer.
- **Recommendations:**
  - **Re-labelled:** 10.
    - Preprint: C3, C4, C8, D1, D11 (D11 also revised in 2026).
    - Vendor figure or precision: A3.
    - Venue: C9, D13.
    - Softened attribution: D15.
    - Imprecise wording: D6.
  - **Replaced:** 2 (B4, D9), plus one URL canonicalisation (A1).
  - **Added:**
    - Industry sources: A6, A7, B1, B5, B16, B17, C1, C2, D4.
    - Links to already-correct facts: B2, B11, D7.
    - Total: 12.
  - **Our-data labels:** 2 (A8, C6).
  - **Keep as is:** the rest.

---

## Report: Citation audit: Module 5, Lessons 13 to 15

Scope: `src/content/modules/05-rag-systems/13-permissions`, `14-context-step`, `15-a-new-corpus` (every `.mdx`, including intros, quizzes, exercise text and recaps).
Downloads are in `scratchpad/audit/m5D/`. All paths below are relative to `src/content/modules/05-rag-systems/`.

What's in scope is lighter than the brief expected. There's no "lost in the middle", no Liu et al., no Greshake citation, no Elastic or Glean docs, and no token-limit API docs. Lesson 14 is almost entirely our own measurements on Module 4's matchers. Lesson 15 is a synthesis of the module's own results. The outside sources are concentrated in Lesson 13.

### 1. Claims table

| ID | file:line | Claim (trimmed) | Source given | Kind | Verdict | Evidence (primary source) | Recommendation |
|---|---|---|---|---|---|---|---|
| A1 | 13/01:141-155 (and quiz :209-217, recap 13/05 Q1, 15/01 quiz 3, 15/04:34-37) | "Filtering afterwards isn't enough … Filtering has to happen **before** every stage that picks a top k" | Lesson 4 link, our demo (20 short, 3 empty of 57) | practice | Our data is correct. As a **practice** claim it's stronger than the industry source. | OpenFGA, *RAG Authorization* (openfga.dev/docs/modeling/agents/rag-authorization): "Post-filtering: Query the vector database first, then filter results by checking permissions with OpenFGA. **This is the most common approach** and works well when the vector search returns a manageable number of candidates." Its table: post-filtering "May return fewer than K after filtering"; pre-filtering "Guarantees all results are authorized". "When using post-filtering, request more candidates than you need from the vector database (e.g., 2-3x your target count)." | **Needs a decision** (section 3). Lead with an industry source (OpenFGA). Soften "has to" to "should", and name over-fetching as the common workaround. |
| A2 | 13/01:189-196 | Two designs: one index per permission set, or "a metadata filter applied during the search". Vector stores and search engines accept one. | Lesson 4 only | practice | UNSOURCED (true) | Pinecone, *Implement multitenancy*: "Implement multitenancy in Pinecone with one namespace per tenant … Alternative: Metadata filtering … you can store all records in a single namespace and use metadata fields … At query time, you can then filter by metadata." Azure AI Search, *Security filters for trimming results*: "Azure AI Search supports creating a filter that trims search results based on a string containing a group or user identity … Query the index with the search.in filter function." | Lead with industry sources (Pinecone, Azure AI Search). |
| A3 | 13/01:159-179 | Groups come from who the reader is, never from the question or the model | Module 3 and Module 4 links | practice | Keep (internal). Optional industry backing. | OWASP LLM08:2025 *Vector and Embedding Weaknesses*, mitigation 1: "Implement fine-grained access controls and permission-aware vector and embedding stores. Ensure strict logical and access partitioning of datasets in the vector database to prevent unauthorized access between different classes of users or different groups." | Add stronger backing: OWASP LLM08:2025, once for the lesson (see edit E2). |
| A4 | 13/00:18-21, 13/01:132, 15/02 table | 20 of 57 questions leak to an all-staff reader; 20 short and 3 empty when filtered afterwards | our demo | our data | Labelled as ours (live demo, counts given) | n/a | Keep |
| B1 | 13/02:161-164 (quiz :304-310, recap 13/05 Q5) | "Morris and colleagues (EMNLP 2023) recovered 92% of 32-token inputs *exactly* from their embeddings, and concluded embeddings should be protected like the text they came from" | arXiv 2310.06816 | effectiveness | VERIFIED | v1 only (10 Oct 2023), "Accepted at EMNLP 2023". Abstract: "a multi-step method that iteratively corrects and re-embeds text is able to recover 92% of 32-token text inputs exactly." §8: embeddings "should be treated as highly sensitive private data and protected, technically and perhaps legally, in the same way as one would protect raw text." | Keep. Optional: OWASP LLM08 lists "Embedding Inversion Attacks" as a named risk. |
| B2 | 13/02:174-178 | Caches must be keyed by permission set | Lesson 1 (internal) | practice | Keep | n/a | Keep |
| B3 | 13/02:230-233 | "So a common pattern in production checks twice" (filter by the index's copy, then check live) | none; OpenFGA below | practice | UNSOURCED as "common in production" | OpenFGA and SpiceDB present pre-filtering and post-filtering as *alternatives* (see A1, B5). No source found that calls the two-layer combination common. | Soften to "a sturdier design checks twice". |
| B4 | 13/02:248-254 | Zanzibar (USENIX ATC 2019): permissions stored as relationships (member of group, group views folder, folder holds document); relationship-based access control | research.google link | fact | VERIFIED | Pang et al., USENIX ATC '19, §2.1: "In Zanzibar, ACLs are collections of object-user or object-object relations represented as relation tuples. Groups are simply ACLs with membership semantics." Table 1: "group:eng#member@11 User 11 is a member of group:eng … doc:readme#viewer@group:eng#member Members of group:eng are viewers of doc:readme … doc:readme#parent@folder:A#... doc:readme is in folder:A". | Keep |
| B5 | 13/02:254-257 | "OpenFGA and SpiceDB are open-source services built on the same design, and OpenFGA's guidance for retrieval describes both layers: listing the documents a reader may see, for a filter in the search, and checking a batch of results before they reach the model." | none (unlinked) | fact / practice | Lineage VERIFIED. "Describes both layers" **CONTRADICTED in part**. | openfga.dev: "OpenFGA takes the best ideas from Google's Zanzibar paper". SpiceDB README: "the most mature open source project inspired by Google's internal authorization system: Zanzibar". OpenFGA RAG page: "There are two main approaches to integrate OpenFGA into a RAG pipeline … Post-filtering … the most common approach … Pre-filtering … Call the ListObjects API … Pass those IDs as a metadata filter". Its "Choosing an approach" table picks one or the other. It never describes them as two layers of one design. | Replace the wording and link the page (edit E4). |
| C1 | 13/03:69-72 | "This is **indirect prompt injection**: instructions that reach a model through data it was given, not through the user." | none | fact (named concept) | UNSOURCED; the course never cites the origin | Greshake et al., arXiv 2302.12173 (v2, 5 May 2023): "We reveal new attack vectors, using Indirect Prompt Injection, that enable adversaries to remotely (without a direct interface) exploit LLM-integrated applications by strategically injecting prompts into data likely to be retrieved." | Add the source (Greshake and colleagues, 2023). No Module 5 or Module 3 page cites it (grep of the whole tree). |
| C2 | 13/03:106-112 (quiz :179-187) | PoisonedRAG (Zou et al., USENIX Security 2025): five passages per target question, knowledge base of millions, 90% attack success, evaluated defences insufficient | arXiv 2402.07867 | effectiveness | VERIFIED | v3 (13 Aug 2024); "To appear in USENIX Security Symposium 2025", and the USENIX '25 presentation page exists. Abstract: "PoisonedRAG could achieve a 90% attack success rate when injecting five malicious texts for each target question into a knowledge database with millions of texts. We also evaluate several defenses and our results show they are insufficient to defend against PoisonedRAG". | Keep. Optional: link the USENIX page as well. |
| C3 | 13/03:114-121 | The attacker never talks to the model; retrieval selects for relevance, not trustworthiness | none (follows from C1 and C2) | practice | Covered by Greshake ("remotely (without a direct interface)") | as C1 | Keep; covered once C1 is added |
| D1 | 13/04:230-231 | "Classifiers trained to spot injected instructions, such as Meta's Prompt Guard and Microsoft's Prompt Shields, catch far more phrasings than a list." | none | fact + effectiveness | Existence VERIFIED. "Far more phrasings" UNSOURCED. | Prompt Shields (learn.microsoft.com, *Prompt Shields*): "Document attacks are hidden instructions in third-party content, such as documents, emails, and web pages, that attempt to take control of the model session." Llama Prompt Guard 2 model card: "Both Llama Prompt Guard 2 models detect both prompt injection and jailbreaking attacks, trained on a large corpus of known vulnerabilities." | Link both. Soften "catch far more phrasings than a list" to "are trained on many examples, not a fixed list". |
| D2 | 13/04:232-235 (quiz :428) | *The Attacker Moves Second* (2025), Nasr, Carlini and colleagues: optimised attacks against four detectors, past three of them (Prompt Guard among them) >90% of the time | arXiv 2510.09023 | effectiveness | VERIFIED; venue out of date | arXiv v1 only. Now published: **USENIX Security 2026** (usenix.org/conference/usenixsecurity26/presentation/nasr). Published text: "we evaluated several representative detectors--Protect AI Detector …, PromptGuard …, PIGuard …, and Model Armor … Our search-based adaptive attack … achieves ASR of > 90% against Protect AI, PromptGuard, and Model Armor (with Gemini-2.5 Pro as the base model). PIGuard is somewhat more resistant but still reaches 71% ASR." | Re-label: "(USENIX Security 2026)", and link the USENIX page. |
| D3 | 13/04:236-238 | EchoLeak got past Microsoft's classifier in production by wording its instructions as if they were meant for a person | internal link to EchoLeak below | fact | VERIFIED | Aim Labs' write-up (Wayback, 11 Jun 2025): XPIA classifiers were "easily bypassed simply by phrasing the email that contained malicious instructions as if the instructions were aimed at the recipient." | Keep |
| D4 | 13/04:249-273 | Ingestion gate: record the author, trust writers per source, quarantine until reviewed, derive only from what's indexed | none | practice | UNSOURCED | OWASP LLM08:2025, mitigation 2: "Implement robust data validation pipelines for knowledge sources. Regularly audit and validate the integrity of the knowledge base for hidden codes and data poisoning. Accept data only from trusted and verified sources." | Lead with an industry source (OWASP LLM08:2025). |
| D5 | 13/04:300-321 | Lethal trifecta; cut a leg | Module 3 link (Module 3 credits Simon Willison) | practice | Keep (sourced in Module 3) | n/a | Keep |
| D6 | 13/04:332-335, 382-396 | Markdown images fetch on display; remove outside images and links, set a CSP, allowlist tool addresses | none apart from EchoLeak | practice | UNSOURCED as industry practice | Microsoft MSRC, *How Microsoft defends against indirect prompt injection attacks* (July 2025): "Impact mitigation through data governance, user consent workflows, and deterministic blocking of known data exfiltration methods … in response to a data exfiltration via markdown image injection vulnerability … we took steps to deterministically block the security impact". The EchoLeak case study (arXiv 2509.10540) recommends "strict content security policies". | Lead with an industry source (MSRC). |
| D7 | 13/04:355-368 | EchoLeak (CVE-2025-32711), an attack on M365 Copilot "that Aim Security's researchers disclosed in June 2025, after Microsoft had fixed it ([the researchers' paper](arxiv 2509.10540))" | arXiv 2509.10540 | fact | Mechanics VERIFIED. **Attribution CONTRADICTED.** | arXiv 2509.10540 is by **Pavan Reddy and Aditya Sanjay Gujral, The George Washington University** (AAAI Fall Symposium 2025, v1 6 Sep 2025), not Aim Security. It says: "In June 2025, researchers at Aim Security disclosed EchoLeak … (Aim Labs 2025)", and "Microsoft deployed a server-side fix in May 2025. On June 11, 2025, the advisory and public research were released". Mechanics from its abstract: "evading Microsoft's XPIA (Cross Prompt Injection Attempt) classifier, circumventing link redaction with reference-style Markdown, exploiting auto-fetched images, and abusing a Microsoft Teams proxy allowed by the content security policy". Aim's own write-up (Wayback 20250611, now redirecting to catonetworks.com/blog/breaking-down-echoleak/) confirms "RAG spraying" and the recipient wording. | Replace: link Aim Labs' disclosure as the primary source, and label the arXiv paper as a later case study by other authors (edit E8). |
| D8 | 13/04:230-240, 13/05 | Our planted-page demos, with scripted replies | our demos | our data | Labelled ("The reply is scripted: it shows what following the instruction looks like, not how often a real model would") | n/a | Keep |
| E1 | 14/01-05 (all) | Tool-finding 5/5 and 1/7; recall 9 to 11 of 12; duplicate pairs; weights; context step at 3,500 and 3,000 tokens | our demos on `context-step.json`, bge-small | our data | Labelled as ours with case counts ("With twelve tasks, one either way is within noise"; "With 18 pairs, those counts are rough"; "With ten tasks …"). The model is named (bge-small), and the model calls are labelled scripted. | n/a | Keep |
| E2 | 14/02:199-208 | A floor on similarity is weaker "because similarity scores from one embedding model bunch together, and it belongs to that model, so a new model means measuring it again" | none | fact | UNSOURCED (true) | BGE model card FAQ 2: "the similarity distribution of the current BGE model is about in the interval [0.6, 1]. So a similarity score greater than 0.5 does not indicate that the two sentences are similar … If you need to filter similar sentences based on a similarity threshold, please select an appropriate similarity threshold based on the similarity distribution on your data (such as 0.8, 0.85, or even 0.9)." | Add stronger backing: link the bge model card FAQ (edit E10), in 14/02 or at "Choosing a threshold" in 14/03. |
| E3 | 14/03:84-86 (quiz :150-158) | Both memories are statements, so both are embedded as documents, without bge's query instruction | none | fact | VERIFIED (consistent) | BGE model card, note [1]: "If you need to search the relevant passages to a query, we suggest to add the instruction to the query; in other cases, no instruction is needed … In all cases, no instruction needs to be added to passages." | Keep; optionally link the same card. |
| E4 | 14/04:108-113 | Module 4's three-signal recall score (recency, importance, relevance) | Module 4 link (Module 4 cites Park et al., *Generative Agents*) | practice | Keep (sourced upstream) | n/a | Keep |
| E5 | 14/05:47-66 | Stable prefix for the cache; retrieved text after it, as tool results; clearing old tool results | Module 4 links (Module 4 cites Anthropic's context editing, `clear_tool_uses_20250919`) | practice | Keep (sourced upstream) | n/a | Keep |
| F1 | 15/02:44-66 + table :112-122 | The ledger: 17/23 up to 26/36; +13 -0, sign test 0.0002; cost table | our demo; Lessons 7 and 9 | our data | Case counts given (43 questions). **Models not named anywhere in the lesson.** | Data: `embeddings/bge-small-en-v1.5`, `rerank/ms-marco-MiniLM-L6-v2`, `chunk-contexts.json` "written_by": "Claude, for the course, with each whole document in view; served as scripted model replies". The cost figures match 07/03:204 and 09/02:185-186. | Re-label: add one sentence naming the models (edit E11). |
| F2 | 15/02:66-69 | "That's the usual shape of retrieval work" | none | practice | UNSOURCED generalisation | none found | Cut or soften (edit E12). |
| F3 | 15/03 (all) | Held-out 9 of 10 (0.60 to 0.98), rank 1 5 of 10, threshold keeps 7 of 9 | our demo | our data | Labelled, with counts and intervals. Recomputed: [0.60, 0.98] does contain [0.70, 0.92]. | n/a | Keep (the edit E11 model line covers the models) |
| F4 | 15/04:17-23 | "Thirty to sixty real questions, of every type …" | Lesson 2 link | practice | UNSOURCED number | Anthropic, *Demystifying evals for AI agents* (9 Jan 2026): "We see teams delay building evals because they think they need hundreds of tasks. In reality, 20-50 simple tasks drawn from real failures is a great start." (Module 6 already links this post.) | Add stronger backing (edit E13). |
| F5 | 15/04:24-31 | Anthropic's guidance on contextual retrieval "puts the line at about 200,000 tokens, roughly 500 pages" | anthropic.com/engineering/contextual-retrieval | fact / practice | VERIFIED; dated | Published 19 Sep 2024: "If your knowledge base is smaller than 200,000 tokens (about 500 pages of material), you can just include the entire knowledge base in the prompt that you give the model, with no need for RAG or similar methods." | Re-label with the date ("2024"), since 01/02:142 says current windows are larger. |
| F6 | 15/04:84-88 | "HyDE and hybrid search both come with strong published results" | none here (Lessons 6 and 8 cite them) | effectiveness | Keep (sourced in those lessons) | n/a | Keep |
| F7 | 15/05:26-30 | Re-embed into a new index beside the old one, then switch | Lesson 4 link | practice | UNSOURCED | Elastic docs, *Aliases*: "Aliases enable you to: … Change which indices/data streams your application uses in real time; Reindex data without downtime". | Optional: lead with an industry source (Elastic). Low priority. |
| F8 | 15/05:56-60 | "One idea comes up in every deployed system, and this module hasn't built it: semantic caching … For repetitive traffic it saves a great deal" | none | practice + effectiveness | UNSOURCED; "every deployed system" overclaims | GPTCache README: "GPTCache adopt alternative strategies like semantic caching. Semantic caching identifies and stores similar or related queries … In a semantic cache, you may encounter false positives during cache hits and false negatives during cache misses." LiteLLM proxy caching docs list cache types `redis-semantic`, `valkey-semantic`, `qdrant-semantic` ("Semantic caching"). | Soften, and lead with industry sources (edit E14). |
| F9 | 15/05:60-80 | Three risks of a semantic cache (a near miss isn't the same question, staleness, permissions); a prompt cache reuses the identical start of a request | internal links | practice | First risk backed by GPTCache ("false positives during cache hits"). Permissions backed by 13/02. | as F8 | Keep once F8 is edited |

### 2. Proposed edits

None of these is inside an exercise or demo string. E1 to E3 touch quiz text (QuizGroup JSON), not Pyodide code, so no Pyodide re-verification is needed. Keep the escaped quotes as they are in the quiz JSON.

**E1. A1: filtering afterwards (see "Needs a decision"). Shown here as the recommended option.** File `13-permissions/01-permissions-at-retrieval-time.mdx:149-155`

Current:
```
Twenty questions come back short, and three come back empty, although
permitted chunks exist for all of them. The restricted chunks took places in
the top five, then were removed, and nothing took their place. Worse, they
also took places in the reranker's 30 candidates, and in each search's 100.
Filtering has to happen **before** every stage that picks a top k, so the
reader's results are the best of what they may read, not what's left of the
best overall.
```
Proposed:
```
Twenty questions come back short, and three come back empty, although
permitted chunks exist for all of them. The restricted chunks took places in
the top five, then were removed, and nothing took their place. Worse, they
also took places in the reranker's 30 candidates, and in each search's 100.

Filtering afterwards is still common. [OpenFGA's guide to retrieval](https://openfga.dev/docs/modeling/agents/rag-authorization)
calls it the most common approach, and warns that it "may return fewer than K
after filtering". The usual fix is to fetch two or three times as many
candidates. That narrows the gap without closing it: a reader who may see
little of the corpus can still come back short. Filtering **before** every
stage that picks a top k closes it, so the reader's results are the best of
what they may read, not what's left of the best overall.
```
Related quiz changes if this is adopted:
- 13/01:209: `"Why isn't removing forbidden chunks from the top five enough?"` becomes `"What goes wrong when forbidden chunks are removed from the top five?"` (the options stay as they are).
- 13/05 recap Q1, `"Why must permissions be applied before retrieval ranks anything?"`, becomes `"Why apply permissions before retrieval ranks anything?"`.
- 15/01 quiz 3 and 15/04:34-37 can stay; they describe this course's design.

**E2. A2 and A3: lead with industry sources.** File `13-permissions/01-permissions-at-retrieval-time.mdx:189-196`

Current:
```
- **One index per set of permissions.** Build the pipeline over only the
  chunks a group can read. Simple and certain: forbidden chunks aren't in the
  index at all. It suits a handful of distinct permission sets, like this
  corpus's.
- **A filter inside each search.** Vector stores and search engines accept a
  metadata filter applied during the search, as Lesson 4 described. It suits
  thousands of users with overlapping permissions, where an index each isn't
  practical.
```
Proposed:
```
- **One index per set of permissions.** Build the pipeline over only the
  chunks a group can read. Simple and certain: forbidden chunks aren't in the
  index at all. It suits a handful of distinct permission sets, like this
  corpus's. Pinecone's [multitenancy guide](https://docs.pinecone.io/guides/index-data/implement-multitenancy)
  does this with one namespace per customer.
- **A filter inside each search.** Vector stores and search engines accept a
  metadata filter applied during the search, as Lesson 4 described. Azure AI
  Search's [security filters](https://learn.microsoft.com/en-us/azure/search/search-security-trimming-for-azure-search)
  store each document's allowed groups in a field and filter on the reader's
  groups in every query. It suits thousands of users with overlapping
  permissions, where an index each isn't practical.

OWASP lists leaks like this one among its top ten risks for LLM applications,
under [vector and embedding weaknesses](https://genai.owasp.org/llmrisk/llm082025-vector-and-embedding-weaknesses/),
and its first mitigation is "permission-aware vector and embedding stores".
```

**E3. D1: link and soften.** File `13-permissions/04-defences-by-design.mdx:230-231`

Current:
```
Classifiers trained to spot injected instructions, such as Meta's Prompt
Guard and Microsoft's Prompt Shields, catch far more phrasings than a list.
```
Proposed:
```
Classifiers trained to spot injected instructions, such as Meta's
[Prompt Guard](https://huggingface.co/meta-llama/Llama-Prompt-Guard-2-86M) and
Microsoft's [Prompt Shields](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/jailbreak-detection),
learn from many examples rather than a fixed list.
```

**E4. B3 and B5: the two-layer check and OpenFGA.** File `13-permissions/02-derived-data-carries-its-sources-permissions.mdx`

At :230-233, current:
```
Between the change and the next sync, retrieval enforces the old
permissions. The gap is as long as the sync interval, and longer if a sync
fails without anyone noticing. So a common pattern in production checks
twice:
```
Proposed:
```
Between the change and the next sync, retrieval enforces the old
permissions. The gap is as long as the sync interval, and longer if a sync
fails without anyone noticing. So a sturdier design checks twice:
```
At :254-257, current:
```
**relationship-based access control**. OpenFGA and SpiceDB are open-source
services built on the same design, and OpenFGA's guidance for retrieval
describes both layers: listing the documents a reader may see, for a filter
in the search, and checking a batch of results before they reach the model.
```
Proposed:
```
**relationship-based access control**. OpenFGA and SpiceDB are open-source
services built on the same design. [OpenFGA's guide to retrieval](https://openfga.dev/docs/modeling/agents/rag-authorization)
offers the two calls this design needs, as two alternative approaches:
listing the documents a reader may see, for a filter in the search, and
checking a batch of results before they reach the model. Using both, one
before ranking and one after, is the two-layer check above.
```

**E5. C1: add Greshake.** File `13-permissions/03-retrieved-text-is-untrusted-input.mdx:69-72`

Current:
```
Its last sentence is the problem. It isn't information for a reader; it's an
instruction addressed to the model that will read it. This is **indirect prompt
injection**: instructions that reach a model through data it was given, not
through the user.
```
Proposed:
```
Its last sentence is the problem. It isn't information for a reader; it's an
instruction addressed to the model that will read it. This is **indirect prompt
injection**: instructions that reach a model through data it was given, not
through the user. [Greshake and colleagues](https://arxiv.org/abs/2302.12173)
named it in 2023, and showed it working against Bing's GPT-4 chat by planting
prompts "into data likely to be retrieved".
```

**E6. D2: re-label the venue.** File `13-permissions/04-defences-by-design.mdx:232-235`

Current:
```
[The Attacker Moves Second](https://arxiv.org/abs/2510.09023) (2025), Nasr,
Carlini and colleagues optimised attacks against four such detectors, and got
past three of them, Prompt Guard among them, more than 90% of the time.
```
Proposed:
```
[The Attacker Moves Second](https://www.usenix.org/conference/usenixsecurity26/presentation/nasr)
(USENIX Security 2026), Nasr, Carlini and colleagues optimised attacks against
four such detectors, and got past three of them, Prompt Guard among them, more
than 90% of the time.
```
The figure is unchanged in the published version. The quiz explanation at :428 needs no change.

**E7. D4 and D6: industry anchors for the ingestion gate and the output filter.**

File `13-permissions/04-defences-by-design.mdx:270-273`. Current:
```
This moves the decision from the model, which can't be relied on, to people and
code, which can be held to a process. It costs review time, which is why it's
usually applied to the sources anyone can write to, not to every document.
```
Proposed:
```
This moves the decision from the model, which can't be relied on, to people and
code, which can be held to a process. It's what
[OWASP recommends](https://genai.owasp.org/llmrisk/llm082025-vector-and-embedding-weaknesses/)
for retrieval systems: "Accept data only from trusted and verified sources."
It costs review time, which is why it's usually applied to the sources anyone
can write to, not to every document.
```
The "usually applied" part is our judgement. If you want it hedged, write "which is why it's worth applying first to the sources anyone can write to".

File `13-permissions/04-defences-by-design.mdx:370-371`. Current:
```
The defence is code that runs on every answer before it's displayed, and
doesn't judge what the answer says, only where its addresses go:
```
Proposed:
```
The defence is code that runs on every answer before it's displayed, and
doesn't judge what the answer says, only where its addresses go. Microsoft's
[account of its own defences](https://www.microsoft.com/en-us/msrc/blog/2025/07/how-microsoft-defends-against-indirect-prompt-injection-attacks)
calls this "deterministic blocking of known data exfiltration methods",
starting with Markdown images:
```

**E8. D7: fix the EchoLeak attribution.** File `13-permissions/04-defences-by-design.mdx:355-358`

Current:
```
This is how **EchoLeak** (CVE-2025-32711) worked, an attack on Microsoft 365
Copilot that Aim Security's researchers disclosed in June 2025, after
Microsoft had fixed it
([the researchers' paper](https://arxiv.org/abs/2509.10540)). The attacker
```
Proposed:
```
This is how **EchoLeak** (CVE-2025-32711) worked, an attack on Microsoft 365
Copilot that
[Aim Security's researchers disclosed](https://www.catonetworks.com/blog/breaking-down-echoleak/)
in June 2025, after Microsoft had fixed it. Reddy and Gujral later wrote it
up as a [case study](https://arxiv.org/abs/2509.10540). The attacker
```
Link notes: Aim's original URL (`aim.security/lp/aim-labs-echoleak-blogpost`, later `aim.security/aim-labs/aim-labs-echoleak-blogpost`) now 301s to the Cato Networks page, since Cato acquired Aim. Both block scripts (403 / Incapsula), so I read the text via the Wayback Machine (snapshot 20250611174716, and the 2026 snapshot of the Cato page, which has the same text). If a stable link is preferred, use `https://web.archive.org/web/20250611174716/https://www.aim.security/lp/aim-labs-echoleak-blogpost`. The rest of the paragraph (:359-368) matches both sources and can stay.

**E9. F5: date the Anthropic guidance.** File `15-a-new-corpus/04-a-new-corpus-in-order.mdx:27-30`

Current:
```
   Anthropic's
   [guidance on contextual retrieval](https://www.anthropic.com/engineering/contextual-retrieval)
   puts the line at about 200,000 tokens, roughly 500 pages. This module's
```
Proposed:
```
   Anthropic's 2024
   [guidance on contextual retrieval](https://www.anthropic.com/engineering/contextual-retrieval)
   puts the line at about 200,000 tokens, roughly 500 pages. This module's
```

**E10. E2: back the "similarity scores bunch together" claim.** File `14-context-step/02-meaning-alongside-keywords-fused.mdx:204-207`

Current:
```
question and passage together; a floor on similarity is weaker, because
similarity scores from one embedding model bunch together, and it belongs to
that model, so a new model means measuring it again. The next concept chooses
that kind of threshold, for duplicates.
```
Proposed:
```
question and passage together; a floor on similarity is weaker, because
similarity scores from one embedding model bunch together, and it belongs to
that model, so a new model means measuring it again. bge's own
[model card](https://huggingface.co/BAAI/bge-small-en-v1.5) says the same:
its scores mostly fall between 0.6 and 1, so pick a threshold "based on the
similarity distribution on your data". The next concept chooses that kind of
threshold, for duplicates.
```
Caveat: the card's [0.6, 1] figure describes the pre-1.5 bge models; v1.5 "alleviates the issue". If you want it exact, drop the "between 0.6 and 1" clause and keep only the quote.

**E11. F1: name the models behind the ledger.** File `15-a-new-corpus/02-what-each-stage-bought.mdx:46-50`

Current:
```
Every lesson measured its own change against the pipeline it started from.
Here are the core stages again, one after another, on the same 43 labelled
questions, counting a question as answered when every part of its answer is
in the results. Each row is compared with the row above it. The demo
rebuilds every stage, so allow several seconds:
```
Proposed:
```
Every lesson measured its own change against the pipeline it started from.
Here are the core stages again, one after another, on the same 43 labelled
questions, counting a question as answered when every part of its answer is
in the results. Search by meaning uses bge-small-en-v1.5, the reranker is
ms-marco-MiniLM-L6-v2, and Claude wrote the chunk contexts in advance. Each
row is compared with the row above it. The demo rebuilds every stage, so
allow several seconds:
```

**E12. F2: soften.** File `15-a-new-corpus/02-what-each-stage-bought.mdx:66-69`

Current:
```
and the changes together are unmistakable. That's the usual shape of
retrieval work, and the reason Lesson 2 insisted on keeping every change's
```
Proposed:
```
and the changes together are unmistakable. That's why Lesson 2 insisted on
keeping every change's
```
The next line, "gains and losses, not just its total: small steps are only worth trusting in", continues unchanged.

**E13. F4: back the question count.** File `15-a-new-corpus/04-a-new-corpus-in-order.mdx:17-19`

Current:
```
1. **Write the questions.** Thirty to sixty real questions, of every type the
   agent will meet, each labelled with the passages that answer it, and a
   held-out set put aside
```
Proposed:
```
1. **Write the questions.** A few dozen real questions, of every type the
   agent will meet, each labelled with the passages that answer it, and a
   held-out set put aside. Anthropic's
   [guide to agent evaluations](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
   calls "20-50 simple tasks drawn from real failures" a great start
```
Alternative: keep "Thirty to sixty" as the course's own recommendation (this module used 43 plus 11), and add the Anthropic sentence after it.

**E14. F8: soften "every deployed system" and add industry sources.** File `15-a-new-corpus/05-where-the-module-leaves-off.mdx:56-60`

Current:
```
One idea comes up in every deployed system, and this module hasn't built it:
**semantic caching**. Store each answer with its question's vector, and when
a new question lands close enough to an old one, return the old answer
without searching or calling the model. For repetitive traffic it saves a
great deal, and it brings three risks this module has already met:
```
Proposed:
```
One idea this module hasn't built comes up often in deployed systems:
**semantic caching**. Store each answer with its question's vector, and when
a new question lands close enough to an old one, return the old answer
without searching or calling the model. Libraries such as
[GPTCache](https://github.com/zilliztech/GPTCache) and gateways such as
[LiteLLM](https://docs.litellm.ai/docs/proxy/caching) offer it ready-made.
For repetitive traffic it can save many model calls, and it brings three
risks this module has already met:
```
Optionally, at the first risk (:62), add: "GPTCache's own documentation warns of 'false positives during cache hits'."

**E15. F7 (optional, low priority).** File `15-a-new-corpus/05-where-the-module-leaves-off.mdx:27-30`. After "building the new index beside the old one and switching when it's complete", add: "Elasticsearch's [index aliases](https://www.elastic.co/docs/manage-data/data-store/aliases) exist for this switch."

### 3. Needs a decision

1. **Is filtering afterwards "not enough", or just worse? (A1, 13/01, repeated in the recaps and Lesson 15.)** The lesson teaches that filtering "has to happen before every stage that picks a top k". Our own demo supports that as a quality point: 20 of 57 questions come back short. But the main industry source for permission-aware RAG, OpenFGA, calls post-filtering "the most common approach". It suggests fetching 2-3x the candidates, and suits it to users who can see most documents. On secrecy, both approaches are equally safe, as long as filtering happens before the model sees anything.
   - **Recommendation:** keep teaching pre-filtering as the default, since it's the only way to get an exact top k. Stop presenting post-filtering as wrong: name it as common, say what it costs, and name its usual workaround (edit E1).
   - This changes the nuance of the concept, not its exercise. `PermittedRetriever` and its tests stay as they are.
   - Optional: a one-line addition to the demo could show over-fetching (for example, filtering the top 15 down to 5) recovering most of the 20 short questions. That would need re-verifying in Pyodide, and I haven't run it.

2. **The two-layer permission check (B3/B5, 13/02).** The design itself is sound: pre-filter on the index's copy, then run a live check before the model. But no source I found calls it a common production pattern, and OpenFGA offers the two calls as alternatives. **Recommendation:** keep the design and soften the attribution, as in edit E4. It doesn't change what's taught.

### 4. Counts

- **Verified: 11.** B1 Morris; B4 Zanzibar; B5 lineage of OpenFGA and SpiceDB; C2 PoisonedRAG; D1 existence of Prompt Guard and Prompt Shields; D2 Nasr et al. figures; D3 EchoLeak classifier bypass; D7 EchoLeak mechanics; E3 bge instruction; F5 Anthropic 200k; F3 interval containment (recomputed).
- **Contradicted: 2.** D7, the arXiv paper credited to Aim's researchers, is by GWU authors. B5, OpenFGA's guidance, presents pre- and post-filtering as alternatives, not "both layers".
- **Unreachable: 0.** Aim's and Cato's pages block scripts, so I read them via the Wayback Machine.
- **Re-labelled: 5.** D2 (USENIX Security 2026), D7 (Aim disclosure plus Reddy & Gujral case study), F5 (2024), F1 (models named), B5 (alternatives).
- **Replaced: 1.** D7 primary link goes to Aim Labs' disclosure.
- **Added: 9** sources: Greshake (C1), OWASP LLM08:2025 (A3, D4), Pinecone and Azure AI Search (A2), OpenFGA RAG page (A1, B5), MSRC blog (D6), bge model card (E2), Anthropic evals post (F4), GPTCache and LiteLLM (F8). Elastic aliases (F7) is optional.
- **Softened: 5.** A1 "has to", B3 "common pattern in production", D1 "far more phrasings", F2 "usual shape", F8 "every deployed system" / "saves a great deal".
- **Unsourced claims flagged:** A2, A3, B3, C1, D1 (in part), D4, D6, E2, F2, F4, F7, F8.
