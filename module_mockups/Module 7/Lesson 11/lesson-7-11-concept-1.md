# Module 7, Lesson 11 — Concept 1: What to watch on every run

> **Note for the site build:**
> - New script `scripts/eval/monitoring_traffic.py`. Concept 2 extends it to four files, so use concept 2's zip, `m7-l11-c2-site-build.zip`, which replaces this concept's. This page reads two of the files: `public/data/eval/monitoring/traffic-baseline-a.json` (2.4 MB) and `traffic-layers-a.json` (2.5 MB). Each holds one recorded run's 385 development-task runs, as the spans each run's tracer recorded, in start order. The script drops `registry_agent.check.reason` and adds `registry_agent.search.results` to each `search_docs` span; its docstring says why.
> - New exports in `evalData.ts`:
>   - `trafficData(...conditions)`: the named traffic files, mounted at `/data/eval/monitoring`, like `pilotData`. This page uses `trafficData("baseline-a", "layers-a")`.
>   - `LOAD_TRAFFIC`: `TRACER` + `SUMMARIZE` + the setup block shown on this page (`load_traffic` and `percentile`), byte-identical to the page. It is the setup for every demo and exercise in this lesson.
>   - `DASHBOARD`: the exercise's reference `dashboard`, without its example printout, for the last demo on this page and for later pages.
> - The second and third demos continue from the first: put the first demo's code, minus its two `print` loops, into their hidden setup after `LOAD_TRAFFIC`.
> - The exercise needs `trafficData("baseline-a", "layers-a")`; its hidden tests load both files.

---

## No answer key, plenty of evidence

Every lesson so far has graded runs against something written in advance: a task's expected end state, a reference answer, a person's label. Once an agent is in use, its requests arrive with none of that. As [Lesson 1 put it](→ Module 7, the why agents are hard to grade lesson, the offline and online concept, what each method sees, and what it misses), production monitoring has no ground truth to grade against.

It still has a great deal to count. [Anthropic's guide to agent evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) places monitoring after launch, where its job is to detect distribution drift and real-world failures nobody anticipated. The metrics its example tasks track are the ones every run produces without any grading: the number of turns, tool calls and tokens, and how long the reply took. That's the subject of this concept: what can be measured on every run, with no answer key at all. Grading a sample of runs comes later in this lesson.

This course has no users, so the lesson replays the module's recorded runs as if they had arrived live: the 385 runs of the baseline's batch a on development tasks, each with the trace [Lesson 2's instrumentation](→ Module 7, the tracing an agent run lesson, the what this course adds to a trace concept) recorded as it ran, read in the order the runs started. Every demo built on them is labelled **simulated**. One consequence to keep in mind: the runs were made 48 at a time on one GPU, so a run's duration includes time spent waiting for the GPU. The durations have a realistic shape, but they aren't what a single user would wait.

---

## The golden signals, for an agent

Google's SRE book has the standard starting point for monitoring any service. [Its monitoring chapter](https://sre.google/sre-book/monitoring-distributed-systems/) names four "golden signals", and says that if you can only measure four things about a user-facing system, these are the four. Each has an agent version:

- **Latency: how long a request takes.** For an agent, that's the whole run, not one model call: the user waits for every step. The book also says to track the latency of failed requests separately, since a fast error can make an average look good and a slow error is worse than a fast one.
- **Traffic: how much demand there is.** Runs per minute, and also what kind of runs. A shift in what people ask is the subject of a later concept in this lesson.
- **Errors: the rate of requests that fail.** The book counts three kinds: explicit failures, such as an HTTP 500; implicit ones, such as a 200 response with the wrong content; and failures by policy, such as any request slower than a promised time. An agent has all three, and the implicit kind matters most: a confident wrong answer leaves every span in its trace marked as fine.
- **Saturation: how full the service is.** For the agent itself, that's how close runs come to their limits: the step limit, and the context window. The serving side has its own saturation, such as GPU load and a provider's rate limits, which belongs with deployment in Module 10.

One more signal matters more for an agent than for most services: **cost**. A run's tokens are its bill, and they vary far more from run to run than an ordinary request's cost does.

---

## The same numbers, in OpenTelemetry's terms

The [GenAI conventions from Lesson 2](→ Module 7, the tracing an agent run lesson, the a shared format: OpenTelemetry's conventions for AI calls concept) define metrics as well as spans. They're still marked as in development, and are maintained in [their own repository](https://github.com/open-telemetry/semantic-conventions-genai). The ones that fit an agent are all histograms:

- `gen_ai.invoke_agent.duration`: how long a whole agent run took
- `gen_ai.invoke_agent.inference_calls` and `gen_ai.invoke_agent.tool_calls`: how many model calls and tool calls a run made
- `gen_ai.execute_tool.duration` and `gen_ai.client.operation.duration`: how long one tool call or one model call took

For tokens, the conventions define two families and say what each is for. Counters (`gen_ai.client.inference.usage.input_tokens` and `.output_tokens`) track total consumption over time and stand in for cost. Histograms of the tokens per model call (`gen_ai.client.inference.operation.input_tokens` and `.output_tokens`) are for percentiles and outliers, and the conventions say outright that they shouldn't be used for totals or cost. That split, a total for the bill and a distribution for everything else, comes up again below.

In production, an SDK records these as each run happens. Here they're computed from the recorded spans, which carry the same information: a run's start and end, its model calls with their token counts, its tool calls with their status.

---

## A day of traffic

The setup loads the traffic as lists of [Lesson 2's `Span`](→ Module 7, the tracing an agent run lesson, the from a list of events to a tree of spans concept), and defines one helper used throughout the lesson, the nearest-rank percentile. [`summarize`](→ Module 7, the tracing an agent run lesson, the reading a trace concept), Lesson 2's facts about one run, is loaded too.

```python
import json
from math import ceil
from pathlib import Path

MONITORING = Path("/data/eval/monitoring")


def load_traffic(condition: str) -> list[list[Span]]:
    """One recorded run's development runs, each as the spans it recorded, in the order the runs started."""
    data = json.loads((MONITORING / f"traffic-{condition}.json").read_text(encoding="utf-8"))
    return [[Span(trace_id=run["trace_id"], **span) for span in run["spans"]] for run in data["runs"]]


def percentile(values: list[float], p: float) -> float:
    """The nearest-rank percentile: the smallest value with at least p% of the values at or below it."""
    ordered = sorted(values)
    return ordered[ceil(p / 100 * len(ordered)) - 1]
```
*(defined once here and already loaded for every demo in this lesson, with Lesson 2's `Span` and `summarize`)*

There are several ways to compute a percentile, and they give slightly different answers on the same data. A dashboard should say which it uses. Nearest-rank is the simplest: the value itself, never one interpolated between two runs.

Here is the traffic, three ways:

```python
from statistics import mean

traffic = load_traffic("baseline-a")
facts = [summarize(spans) for spans in traffic]
roots = [next(span for span in spans if span.parent_id is None) for spans in traffic]
measures = {
    "seconds per run": [(root.end_ns - root.start_ns) / 1e9 for root in roots],
    "tokens per run": [f["input_tokens"] + f["output_tokens"] for f in facts],
    "model calls per run": [f["model_calls"] for f in facts],
}
print(f"{len(traffic)} runs\n")
print(f"{'':<20}{'mean':>9}{'median':>9}{'p95':>9}{'max':>9}")
for name, values in measures.items():
    print(f"{name:<20}{mean(values):>9,.1f}{percentile(values, 50):>9,.1f}{percentile(values, 95):>9,.1f}{max(values):>9,.1f}")
```
```
385 runs

                         mean   median      p95      max
seconds per run          14.1     11.7     33.0     58.9
tokens per run        9,384.3  4,637.0 33,557.0 66,984.0
model calls per run       3.6      3.0      9.0     10.0
```
*(runs live, shows output — read-only demo snippet, not graded; simulated traffic: the recorded runs of the baseline's batch a, development tasks only, read in the order they started)*

---

## Worry about the tail

The SRE book has a section called "Worrying About Your Tail", and the table shows why. The mean tokens per run is about 9,400, but the median run used under 4,700. The mean is twice what a typical run costs, pulled up by a few long runs. One run in twenty used more than 33,000. The same holds for time: the median run took under 12 seconds, and one in twenty took more than 33.

```python
from bisect import bisect_right

tokens, calls = measures["tokens per run"], measures["model calls per run"]
costliest = sorted(tokens, reverse=True)[: len(tokens) // 10]
print(f"the costliest 10% of runs ({len(costliest)}) used {sum(costliest) / sum(tokens):.0%} of all tokens\n")

# bucket edges about three times apart, as the SRE book suggests for latency
edges = [1_000, 3_000, 10_000, 30_000, 100_000]
labels = ["under 1k"] + [f"{low // 1000}k to {high // 1000}k" for low, high in zip(edges, edges[1:])] + ["100k and up"]
buckets = [[] for _ in labels]
for run_tokens, run_calls in zip(tokens, calls):
    buckets[bisect_right(edges, run_tokens)].append(run_calls)
for label, bucket in zip(labels, buckets):
    if bucket:
        print(f"{label:<12} {len(bucket):>4} runs  {'#' * round(len(bucket) / 8):<32} {mean(bucket):.1f} model calls on average")
```
```
the costliest 10% of runs (38) used 38% of all tokens

1k to 3k       34 runs  ####                             1.6 model calls on average
3k to 10k     256 runs  ################################ 2.7 model calls on average
10k to 30k     70 runs  #########                        6.0 model calls on average
30k to 100k    25 runs  ###                              9.4 model calls on average
```
*(runs live, shows output — read-only demo snippet, not graded; simulated traffic: the recorded runs of the baseline's batch a, development tasks only, read in the order they started)*

A tenth of the runs used 38% of the tokens, and the runs that cost most are the ones that went round the loop most: the 25 over 30,000 tokens averaged 9.4 model calls, against a step limit of 10. That's [Lesson 2's growing context](→ Module 7, the tracing an agent run lesson, the reading a trace concept, where the tokens go) at the scale of a whole day: every extra step resends everything before it.

Two habits follow:

- **Keep the distribution, not just the mean.** The book recommends counting requests into buckets whose edges grow by a factor of about three, as the demo does, rather than storing one average. A mean hides exactly the runs worth looking at.
- **Use the mean for the bill and the percentiles for everything else.** Total tokens, or the mean times the number of runs, is what you pay. The median and p95 describe what runs are like. It's the same split OpenTelemetry's counters and histograms make.

The runs near the step limit are also this agent's saturation signal. A p95 of 9 model calls against a limit of 10 says that a noticeable share of runs end close to where the loop would cut them off.

---

## Errors that raise, and errors that don't

The trace shows explicit errors directly. A tool span whose status is `ERROR` is a tool call that failed:

```python
from collections import Counter

calls, failed = Counter(), Counter()
for spans in traffic:
    for span in spans:
        if span.attributes.get("gen_ai.operation.name") == "execute_tool":
            calls[span.attributes["gen_ai.tool.name"]] += 1
            failed[span.attributes["gen_ai.tool.name"]] += span.status == "ERROR"
for tool, count in calls.most_common():
    print(f"{tool:<16} {count:>4} calls  {failed[tool]:>3} failed ({failed[tool] / count:.0%})")
print(f"{'all tools':<16} {calls.total():>4} calls  {failed.total():>3} failed ({failed.total() / calls.total():.1%})")
```
```
search_docs       570 calls    0 failed (0%)
get_agent         187 calls    9 failed (5%)
query_database    148 calls   14 failed (9%)
set_model          75 calls   10 failed (13%)
get_health         32 calls    8 failed (25%)
send_email         27 calls    0 failed (0%)
all tools        1039 calls   41 failed (3.9%)
```
*(runs live, shows output — read-only demo snippet, not graded; simulated traffic: the recorded runs of the baseline's batch a, development tasks only, read in the order they started)*

A rate on its own can mislead, because not every tool error is a problem. Reading the recorded results behind these 41:

- **About half are the registry working.** `set_model` refusing a model the rules don't allow, or one that's deprecated, and `get_agent` not finding an agent that doesn't exist. Several tasks ask for exactly that.
- **Seven are injected faults.** Some `get_health` calls time out because the suite makes them, to test what the agent does next.
- **Fourteen are the agent's own mistakes.** Its SQL named columns that don't exist, or a table it isn't allowed to read.

A dashboard that only shows 3.9% can't tell these apart. Recording a specific error type on each failed span, such as the registry's error code, lets the rate be split by cause. OpenTelemetry's `error.type` attribute is meant for exactly that.

Other errors raise nothing, and each needs something extra before a dashboard can count it:

- **A run that ended without an answer.** No span fails when the loop hits its step limit. It shows up as a run whose last model call still asked for tools. Recording why each run ended, as a single attribute on the root span, would make it a direct count.
- **A search that found nothing.** A search returning no results is a success as far as its status goes. The recordings kept search results only as content, so the traffic file adds a result count to each search span, the attribute a production tracer would record. This agent's keyword search returns any section that shares a single word with the query, so it almost never comes back empty: once in 570 searches here. The signal is far louder for a search that drops weak matches, like [Module 5's threshold on the reranker's score](→ Module 5, the answering from retrieved context lesson, the abstaining when retrieval is weak concept), where how often it abstains is one of the numbers [Module 5 said to watch](→ Module 5, the a retrieval system for a new corpus lesson, the where the module leaves off concept, a system that keeps running).
- **An answer a check withheld.** A blocked `before_answer` check span, from [Module 6's checks traced as spans](→ Module 7, the tracing an agent run lesson, the what this course adds to a trace concept).
- **A wrong answer, or a decline.** Nothing in the trace says whether a reply was right, or whether it was a refusal. These are the implicit errors, and they need a grader: the subject of the third concept in this lesson.

---

## Applied sandbox exercise
*(graded — the numbers a monitoring dashboard shows, from traces)*

**Task shown to learner:**

Write `dashboard(runs)`. `runs` is a non-empty list of runs, each a list of `Span`s in the order they started. `summarize` (Lesson 2's) and `percentile` (this lesson's nearest-rank percentile) are loaded. Return a dict with these keys:

- `"runs"`: the number of runs.
- `"p50_seconds"` and `"p95_seconds"`: `percentile` at 50 and 95 of each run's duration in seconds, the end minus the start of its root span (the span with no parent).
- `"mean_tokens"` and `"p95_tokens"`: the mean, and `percentile` at 95, of each run's input plus output tokens over its chat spans.
- `"tool_error_rate"`: the share of all `execute_tool` spans whose status is `"ERROR"`.
- `"empty_search_rate"`: the share of `execute_tool` spans for `search_docs` whose `registry_agent.search.results` is 0.
- `"no_answer_rate"`: the share of runs whose last chat span asked for tools, that is, has a non-empty `registry_agent.tool_calls`.
- `"withheld_rate"`: the share of runs with at least one `before_answer` check span whose `registry_agent.check.verdict` is `"blocked"`.

Find spans by their attributes (`gen_ai.operation.name`, `registry_agent.check.point`), not their names. A rate with nothing to count, such as tool errors in runs that called no tools, is `0.0`.

**Starter code:**
```python
def dashboard(runs: list[list[Span]]) -> dict:
    """The numbers a monitoring dashboard shows for a batch of runs, each run given as its spans in start order."""
    # your code here


print(dashboard(load_traffic("baseline-a")))
```

**Hidden tests:**
```python
import itertools
from math import isclose

_ids = itertools.count()


def make_run(seconds: float, steps: list[tuple], root_status: str = "UNSET") -> list[Span]:
    """One run's spans in start order. Steps: ("chat", input, output, asked_tools), ("tool", name, ok, results),
    ("check", point, verdict) or ("user",); the root carries the run's token totals, as real invoke_agent spans do."""
    root = Span(name="invoke_agent registry_agent", trace_id="t", span_id=f"s{next(_ids)}", parent_id=None,
                start_ns=1_000_000_000, end_ns=1_000_000_000 + round(seconds * 1e9), status=root_status,
                attributes={"gen_ai.operation.name": "invoke_agent"})
    spans, clock, totals = [root], 1_000_000_001, [0, 0]
    for step in steps:
        kind, attributes, status = step[0], {}, "UNSET"
        if kind == "chat":
            _, tokens_in, tokens_out, asked = step
            name = "chat Qwen/Qwen3.5-4B"
            attributes = {"gen_ai.operation.name": "chat", "gen_ai.usage.input_tokens": tokens_in,
                          "gen_ai.usage.output_tokens": tokens_out, "registry_agent.tool_calls": list(asked)}
            totals[0] += tokens_in
            totals[1] += tokens_out
        elif kind == "tool":
            _, tool, ok, results = step
            name = f"execute_tool {tool}"
            attributes = {"gen_ai.operation.name": "execute_tool", "gen_ai.tool.name": tool}
            if tool == "search_docs":
                attributes["registry_agent.search.results"] = results
            status = "UNSET" if ok else "ERROR"
        elif kind == "check":
            _, point, verdict = step
            name = f"check {point}"
            attributes = {"registry_agent.check.point": point, "registry_agent.check.verdict": verdict}
        else:
            name = "simulated_user reply"
            attributes = {"registry_agent.simulated_user.stopped": False}
        spans.append(Span(name=name, trace_id="t", span_id=f"s{next(_ids)}", parent_id=root.span_id,
                          start_ns=clock, end_ns=clock + 1, attributes=attributes, status=status))
        clock += 2
    root.attributes |= {"gen_ai.usage.input_tokens": totals[0], "gen_ai.usage.output_tokens": totals[1]}
    return spans


answered = [("chat", 1000, 100, ["search_docs"]), ("tool", "search_docs", True, 5), ("chat", 2000, 200, [])]

# percentiles: twenty runs lasting 1 to 20 seconds
runs = [make_run(s, answered) for s in range(1, 21)]
result = dashboard(runs)
assert isinstance(result, dict), "dashboard should return a dict"
assert result["runs"] == 20, f"runs counts the runs: got {result['runs']}"
assert isclose(result["p50_seconds"], 10.0), \
    f"p50_seconds is percentile(seconds, 50) of each run's root span duration in seconds: expected 10.0, got {result['p50_seconds']}"
assert isclose(result["p95_seconds"], 19.0), \
    f"p95_seconds is percentile(seconds, 95), the nearest rank, not an interpolated value: expected 19.0, got {result['p95_seconds']}"

# tokens come from the chat spans; the root's totals would count them twice
cheap = make_run(2, answered)
costly = make_run(2, [("chat", 1000, 100, ["get_agent"]), ("tool", "get_agent", True, None)] * 9 + [("chat", 9000, 900, [])])
result = dashboard([cheap] * 19 + [costly])
expected_mean = (19 * 3300 + (9 * 1100 + 9900)) / 20
assert isclose(result["mean_tokens"], expected_mean), \
    f"mean_tokens is the mean of input plus output tokens over each run's chat spans: expected {expected_mean}, got {result['mean_tokens']}"
assert isclose(result["p95_tokens"], 3300), \
    f"p95_tokens is percentile(tokens, 95) over runs, so one costly run in twenty doesn't set it: expected 3300, got {result['p95_tokens']}"

# tool errors: failed tool spans out of all tool spans, not checks and not runs
failed = make_run(3, [("chat", 100, 10, ["get_agent", "set_model"]), ("tool", "get_agent", True, None),
                      ("check", "after_tool", "passed"), ("tool", "set_model", False, None),
                      ("check", "after_tool", "blocked"), ("chat", 100, 10, [])])
flagged = make_run(3, [("chat", 100, 10, ["get_health"]), ("tool", "get_health", True, None),
                       ("check", "after_tool", "blocked"), ("chat", 100, 10, [])])
crashed = make_run(3, [("chat", 100, 10, ["get_agent"]), ("tool", "get_agent", True, None)], root_status="ERROR")
result = dashboard([failed, flagged, crashed, make_run(3, answered)])
assert isclose(result["tool_error_rate"], 1 / 5), \
    f"tool_error_rate is the share of execute_tool spans with status ERROR (1 of 5 here); a blocked check or a failed run isn't a tool error: got {result['tool_error_rate']}"

# empty searches: out of searches only
searches = make_run(3, [("chat", 100, 10, ["search_docs"] * 4 + ["get_agent"]), ("tool", "search_docs", True, 0),
                        ("tool", "search_docs", True, 5), ("tool", "search_docs", True, 3), ("tool", "search_docs", True, 0),
                        ("tool", "get_agent", True, None), ("chat", 100, 10, [])])
result = dashboard([searches])
assert isclose(result["empty_search_rate"], 2 / 4), \
    f"empty_search_rate is the share of search_docs spans with no results (2 of 4 searches here): got {result['empty_search_rate']}"

# no answer: the last model call still asked for tools
gave_up = make_run(3, [("chat", 100, 10, ["search_docs"]), ("tool", "search_docs", True, 5)] * 3)
conversation = make_run(3, [("chat", 100, 10, ["get_agent"]), ("tool", "get_agent", True, None), ("chat", 100, 10, []),
                            ("user",), ("chat", 100, 10, ["get_agent"]), ("tool", "get_agent", True, None)])
recovered = make_run(3, [("chat", 100, 10, ["get_agent"]), ("tool", "get_agent", True, None), ("chat", 100, 10, []),
                         ("user",), ("chat", 100, 10, [])])
result = dashboard([gave_up, conversation, recovered, make_run(3, answered)])
assert isclose(result["no_answer_rate"], 2 / 4), \
    f"no_answer_rate is the share of runs whose last chat span asked for tools; earlier calls that asked don't count: expected 0.5, got {result['no_answer_rate']}"

# withheld: runs with a blocked before_answer check, counted once per run
twice = make_run(3, answered + [("check", "before_answer", "blocked"), ("user",), ("chat", 100, 10, []),
                                ("check", "before_answer", "blocked")])
tool_blocked = make_run(3, [("chat", 100, 10, ["set_model"]), ("check", "before_tool", "blocked"), ("chat", 100, 10, []),
                            ("check", "before_answer", "passed")])
result = dashboard([twice, tool_blocked, make_run(3, answered), make_run(3, answered)])
assert isclose(result["withheld_rate"], 1 / 4), \
    f"withheld_rate is the share of runs with a blocked before_answer check, each run counted once; other blocked checks don't withhold the answer: got {result['withheld_rate']}"

# nothing to divide by
try:
    result = dashboard([make_run(1, [("chat", 10, 1, [])])])
except ZeroDivisionError:
    raise AssertionError("a rate with nothing to count, such as tool errors when no tool was called, is 0.0, not a division by zero")
assert result["tool_error_rate"] == 0.0 and result["empty_search_rate"] == 0.0, \
    "a rate with nothing to count, such as tool errors when no tool was called, is 0.0"

# the recorded traffic
result = dashboard(load_traffic("baseline-a"))
assert result["runs"] == 385 and result["p95_tokens"] == 33557, f"baseline traffic: {result}"
assert isclose(result["tool_error_rate"], 41 / 1039) and isclose(result["no_answer_rate"], 12 / 385), \
    f"baseline traffic, errors: {result}"
assert isclose(dashboard(load_traffic("layers-a"))["withheld_rate"], 241 / 385), "layers traffic: 241 of 385 runs withheld"
```

**Hint (shown on request):** Each rate has its own denominator: tool errors out of tool spans, empty searches out of searches, and the two run-level rates out of runs. Count a run as withheld once, however many of its checks blocked. For tokens, `summarize` already sums the chat spans only; adding the root span's usage would count every token twice.

**Reference solution:**
```python
from statistics import mean


def dashboard(runs: list[list[Span]]) -> dict:
    """The numbers a monitoring dashboard shows for a batch of runs, each run given as its spans in start order."""
    def operation(span):
        return span.attributes.get("gen_ai.operation.name")

    def no_answer(spans):
        chats = [span for span in spans if operation(span) == "chat"]
        return bool(chats) and bool(chats[-1].attributes.get("registry_agent.tool_calls"))

    def withheld(spans):
        return any(span.attributes.get("registry_agent.check.point") == "before_answer"
                   and span.attributes.get("registry_agent.check.verdict") == "blocked" for span in spans)

    def share(count, total):
        return count / total if total else 0.0

    facts = [summarize(spans) for spans in runs]
    roots = [next(span for span in spans if span.parent_id is None) for spans in runs]
    seconds = [(root.end_ns - root.start_ns) / 1e9 for root in roots]
    tokens = [f["input_tokens"] + f["output_tokens"] for f in facts]
    tools = [span for spans in runs for span in spans if operation(span) == "execute_tool"]
    searches = [span for span in tools if span.attributes["gen_ai.tool.name"] == "search_docs"]
    return {
        "runs": len(runs),
        "p50_seconds": percentile(seconds, 50),
        "p95_seconds": percentile(seconds, 95),
        "mean_tokens": mean(tokens),
        "p95_tokens": percentile(tokens, 95),
        "tool_error_rate": share(sum(span.status == "ERROR" for span in tools), len(tools)),
        "empty_search_rate": share(sum(span.attributes["registry_agent.search.results"] == 0 for span in searches),
                                   len(searches)),
        "no_answer_rate": share(sum(map(no_answer, runs)), len(runs)),
        "withheld_rate": share(sum(map(withheld, runs)), len(runs)),
    }


print(dashboard(load_traffic("baseline-a")))
```
```
{'runs': 385, 'p50_seconds': 11.726373888, 'p95_seconds': 33.01483962, 'mean_tokens': 9384.306493506494, 'p95_tokens': 33557, 'tool_error_rate': 0.03946102021174206, 'empty_search_rate': 0.0017543859649122807, 'no_answer_rate': 0.03116883116883117, 'withheld_rate': 0.0}
```

**Explanation:** Most of the work is choosing what each number is a share of. A tool error is a property of a tool call, so its rate is out of tool calls; a withheld answer or a missing one is a property of a run, so those rates are out of runs, each run counted once. The tests check exactly these choices: a blocked `after_tool` check on a tool call that succeeded isn't a tool error, an earlier model call that asked for tools doesn't mean the run ended without an answer, and a blocked tool call doesn't withhold the answer. The percentiles are nearest-rank, so p95 is one of the runs' real values, and one costly run in twenty doesn't set it.

---

## The dashboard on two versions of the agent

The same dashboard on two recorded runs: the baseline, and the agent with [Module 6's layered checks](→ Module 7, the does this piece help? ablations lesson, the module 6's layers on real runs concept) switched on:

```python
boards = {condition: dashboard(load_traffic(condition)) for condition in ("baseline-a", "layers-a")}
print(f"{'':<18}{'baseline':>10}{'layers':>10}")
for key in boards["baseline-a"]:
    values = [board[key] for board in boards.values()]
    if key.endswith("rate"):
        print(f"{key:<18}" + "".join(f"{value:>10.1%}" for value in values))
    elif isinstance(values[0], int):
        print(f"{key:<18}" + "".join(f"{value:>10,}" for value in values))
    else:
        print(f"{key:<18}" + "".join(f"{value:>10,.1f}" for value in values))
```
```
                    baseline    layers
runs                     385       385
p50_seconds             11.7      13.1
p95_seconds             33.0      37.8
mean_tokens          9,384.3  10,218.7
p95_tokens            33,557    34,922
tool_error_rate         3.9%      3.7%
empty_search_rate       0.2%      0.3%
no_answer_rate          3.1%      7.0%
withheld_rate           0.0%     62.6%
```
*(runs live, shows output — read-only demo snippet, not graded; simulated traffic: the development-task runs of the baseline's batch a and of the layered run, each read in the order its runs started; `dashboard` is the exercise's reference, loaded for you)*

If the layered agent had gone live, the dashboard would have shown the problem almost at once: answers were withheld in half of its first 10 runs and in 62% of its first 50, against none before, and more runs ending without an answer, 7.0% against 3.1%. No grader was needed to see it.

What the dashboard can't say is why. Whether those withheld answers deserved it needed someone to read them, and [Lesson 9's reading](→ Module 7, the does this piece help? ablations lesson, the module 6's layers on real runs concept, what the layers did) found most were false alarms from two layers. That's the SRE book's distinction between what's broken and why: monitoring is good at the first, and the second takes reading the runs behind the number.

The other rows need the same care in the other direction. Latency rose by 1.4 seconds at the median, but these two runs were separate batches on a shared GPU, so the difference may be the GPU's load rather than the checks. Whether a difference like that is a real change or noise is the next concept's subject.

---

## Quiz cards

> **Q1.** A dashboard shows mean tokens per run of 9,400 and a median of 4,600. What does that tell you?
> - Most runs cost well under the mean, and a few long runs pull it up ✅
> - The mean is wrong, because it adds the root span's totals to the chat spans
> - Half of all the tokens were spent by the runs below the median
> - The median is the figure to bill from, because it's the typical run
>
> *Explanation: A mean twice the median is the mark of a long tail. Here a tenth of the runs used 38% of the tokens. The mean is still the right number for the bill, since total cost is the mean times the runs, but it describes almost no actual run. The runs below the median spent far less than half the tokens.*

> **Q2.** The SRE book counts a 200 response with the wrong content as an error. What's the agent version?
> - A confident reply that's wrong, with every span in the trace marked as fine ✅
> - A tool call that returns an error, which the model then reads and reacts to
> - A run that stops at the step limit before the model has given any answer
> - A check that withholds the answer before the user gets a chance to read it
>
> *Explanation: An implicit error is one where nothing reports a failure. A tool error has an ERROR status, a step-limit stop shows in the last model call, and a withheld answer is a blocked check span. A wrong reply looks exactly like a right one in the trace, which is why it needs a grader.*

> **Q3.** The baseline's tool error rate is 3.9%. What should you do with it before alerting on it?
> - Split it by tool and error, since many of them are the registry working ✅
> - Retry every failed tool call automatically, so that the rate drops to zero
> - Divide the failed tool calls by the number of runs instead of by the calls
> - Leave it out, since tool errors are returned to the model and it can recover
>
> *Explanation: About half of the 41 errors are the registry correctly refusing a change or not finding an agent that doesn't exist, seven are injected faults, and fourteen are the agent's own SQL. One rate mixes all three. Recording a specific error type on each failed span lets the dashboard split them.*

> **Q4.** A team wants its monthly token bill and the p95 tokens per model call. Which OpenTelemetry instruments fit?
> - The usage counters for the bill, and the per-call histograms for the p95 ✅
> - The per-call histograms for both, adding up their buckets for the bill
> - The usage counters for both, since they already count every single token
> - The invoke_agent span's usage attributes for both, read from each trace
>
> *Explanation: The conventions define the two families for the two jobs: counters track total consumption and stand in for cost, and per-operation histograms give percentiles and outliers. They say the histograms shouldn't be used for totals or cost. A counter has no distribution to take a percentile of.*

> **Q5.** With Module 6's layers on, the dashboard shows answers withheld in 62.6% of runs. What does that number establish?
> - That answers are being withheld, but not whether they deserved it ✅
> - That most of the withheld answers were wrong and the checks were right
> - That the layers made each run slower than the baseline's runs were
> - Nothing much, because a withheld answer isn't counted as an error
>
> *Explanation: The dashboard shows the symptom without any grading, which is its strength. Whether the checks were right needs the runs read, and Lesson 9's reading found most of the withheld answers were false alarms. The latency difference between two separate batches on a shared GPU can't be put down to the checks.*

> **Q6.** Only 1 of 570 of this agent's searches came back empty. Why is the signal so quiet here?
> - Its keyword search returns any section sharing a word with the query ✅
> - The agent only ever searched for things the documents are known to cover
> - Searches that found nothing were recorded as tool errors in the trace
> - The trace leaves out the searches that returned no results at all
>
> *Explanation: Keyword search with no cut-off almost always finds something, so emptiness rarely happens. A search that drops weak matches, like Module 5's reranker threshold, makes the equivalent signal, how often it abstains, far more informative. Empty searches here have a success status and a result count of 0; they aren't errors and aren't dropped.*

> **Q7.** Which of these is a saturation signal for the registry agent itself?
> - How close runs come to the step limit of ten model calls ✅
> - How many new runs arrive at the agent in each minute
> - The share of the agent's tool calls that come back failed
> - The median number of seconds a run takes from start to end
>
> *Explanation: Saturation is how full something is relative to a limit. For the agent, the limits are the step limit and the context window, and a p95 of nine model calls against ten says many runs end near the cut-off. Arrivals are traffic, failed calls are errors, and run time is latency.*
