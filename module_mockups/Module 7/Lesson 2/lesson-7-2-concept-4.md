# Module 7, Lesson 2 — Concept 4: Reading a trace

> **Note for the site build:**
> - The exercise needs `TRACER` loaded. The demos need `TRACER`, `LOAD_PILOT`, concept 2's `trace_from_recording` and the exercise's reference `summarize`, loaded without showing them. All three demos read `4b-think.json`.
> - **Trace viewer (new component).** An interactive viewer for the pilot's traces, placed in the last section of this page. Build its data with the page's own code: add concept 2's `trace_from_recording` to `evalData.ts` as `TRACE_FROM_RECORDING`, byte-identical, and generate `public/data/eval/pilot/traces/<setup>.json` by running that exact Python (the way `build_course_libs.py` runs earlier modules' code) with `capture_content=True` for every trial of all three setups. The viewer:
>   - lets the learner pick a setup, task and trial, opening on `4b-think/p08/1`, with `4b-think/p01/0` and `4b-think/p07/0` offered as suggestions
>   - shows the trace as a collapsible tree: each span's name, an `ERROR` badge where set, and its key attributes (tokens for chat spans, tool name for tool spans)
>   - on clicking a span, shows all its attributes, with content attributes (`gen_ai.output.messages`, `gen_ai.tool.call.arguments`, `gen_ai.tool.call.result`) rendered readably: thinking, text and tool calls as separate blocks
>   - shows the trial's request at the top and its final answer at the bottom
>   - says in a caption that these traces were built from the pilot's recordings, which have no timings

---

## What a trace answers

A trace is worth recording because of the questions it answers about a run. For the registry agent, the useful ones are:

- **What happened, in what order.** The tree, read top to bottom.
- **Which model, with which settings.** The chat spans' `gen_ai.request.model`, `gen_ai.response.model` and sampling attributes, and the root span's configuration hash.
- **Where the tokens went.** The usage attributes on each chat span.
- **Where the time went.** Each span's start and end. The pilot's recordings have no timings, so this question waits for the main runs, and even there, durations need care: the pilot ran 30 trials at once on one shared GPU, so a slow call often meant a busy GPU, not a hard step.
- **What failed first.** The spans with status `ERROR`, and where their chain of failures started.
- **Which checks fired.** The check spans whose verdict was `blocked`.
- **What the model saw and thought.** The content attributes, when content is captured.

The first six are queries over the spans' attributes, and they should be written against attributes, not span names. Names are for people, and the conventions let each instrumentation choose its own format: `chat Qwen/Qwen3.5-4B` today could be `generate` in another tool's traces, and a custom span can start with the word "chat" without being a model call at all. `gen_ai.operation.name` says what a span is.

One more trap is in the conventions themselves. The `invoke_agent` span can carry its own token counts, the total for the whole run, so summing usage across every span in a trace counts every token twice. Sum the chat spans.

---

## Applied sandbox exercise
*(graded — the facts a trace answers at a glance, found by attributes)*

**Task shown to learner:**

Write `summarize(spans)`, which takes one run's spans (in the order they started) and returns a dict with these keys:

- `"model_calls"`: how many spans have `gen_ai.operation.name` equal to `"chat"`
- `"input_tokens"` and `"output_tokens"`: the totals of `gen_ai.usage.input_tokens` and `gen_ai.usage.output_tokens` over those chat spans only. A chat span with no usage attributes counts as 0.
- `"tool_calls"`: a dict counting the `gen_ai.tool.name` of each span whose operation is `"execute_tool"`
- `"failed_tools"`: the tool names of the tool spans with status `"ERROR"`, in order
- `"first_failure"`: the name of the first span (in order) whose status is `"ERROR"` and none of whose children has status `"ERROR"`, which is where a failure started; `None` if nothing failed
- `"blocked_checks"`: the `registry_agent.check.point` of every span whose `registry_agent.check.verdict` is `"blocked"`, in order

`Span` is loaded.

**Starter code:**
```python
from collections import Counter


def summarize(spans: list[Span]) -> dict:
    """The facts about one run that a trace answers at a glance, found by attributes rather than span names."""
    # your code here
```

**Hidden tests:**
```python
import itertools

ids = itertools.count(1)


def span(name, parent=None, status="UNSET", **attributes):
    """A finished span for the tests; attribute names use __ for dots."""
    return Span(name=name, trace_id="t", span_id=f"s{next(ids)}", parent_id=parent.span_id if parent else None,
                start_ns=0, end_ns=0, status=status,
                attributes={key.replace("__", "."): value for key, value in attributes.items()})


# a run like the refused change: two model calls, a failed tool, a blocked check
root = span("invoke_agent registry_agent", gen_ai__operation__name="invoke_agent",
            gen_ai__usage__input_tokens=2530, gen_ai__usage__output_tokens=298)
spans = [
    root,
    span("chat qwen", root, gen_ai__operation__name="chat", gen_ai__usage__input_tokens=1185, gen_ai__usage__output_tokens=109),
    span("execute_tool get_agent", root, gen_ai__operation__name="execute_tool", gen_ai__tool__name="get_agent"),
    span("chat qwen", root, gen_ai__operation__name="chat", gen_ai__usage__input_tokens=1345, gen_ai__usage__output_tokens=189),
    span("execute_tool set_model", root, "ERROR", gen_ai__operation__name="execute_tool", gen_ai__tool__name="set_model",
         error__type="tool_error"),
    span("check after_tool", root, registry_agent__check__point="after_tool", registry_agent__check__verdict="blocked"),
    span("check before_answer", root, registry_agent__check__point="before_answer", registry_agent__check__verdict="passed"),
    span("chat history trim", root),
    span("execute_tool get_agent", root, gen_ai__operation__name="execute_tool", gen_ai__tool__name="get_agent"),
]
summary = summarize(spans)
assert isinstance(summary, dict), "summarize should return a dict"
assert summary["model_calls"] == 2, \
    f"count model calls by gen_ai.operation.name == 'chat', not by the span's name: expected 2, got {summary['model_calls']}"
assert (summary["input_tokens"], summary["output_tokens"]) == (2530, 298), \
    ("add up tokens on the chat spans only: the root's own usage is already the total of its calls, so "
     f"summing every span counts them twice: got {(summary['input_tokens'], summary['output_tokens'])}")
assert summary["tool_calls"] == {"get_agent": 2, "set_model": 1}, f"count each tool's calls: got {summary['tool_calls']}"
assert summary["failed_tools"] == ["set_model"], f"list the tools whose span failed, in order: got {summary['failed_tools']}"
assert summary["first_failure"] == "execute_tool set_model", \
    f"the first failure is the failed span with no failed child: got {summary['first_failure']!r}"
assert summary["blocked_checks"] == ["after_tool"], \
    f"list the points of checks whose verdict was \"blocked\", not every check: got {summary['blocked_checks']}"

# a crash: the exception passed through the tool and then the run, so both are ERROR, and the root started first
root = span("invoke_agent registry_agent", status="ERROR", gen_ai__operation__name="invoke_agent")
tool = span("execute_tool get_agent", root, "ERROR", gen_ai__operation__name="execute_tool", gen_ai__tool__name="get_agent")
try:
    summary = summarize([root, span("chat qwen", root, gen_ai__operation__name="chat"), tool])
except KeyError as missing:
    raise AssertionError(f"a chat span may have no usage attributes (a scripted client reports none): read {missing} with .get and a default of 0")
assert summary["first_failure"] == "execute_tool get_agent", \
    ("a failure that passes up the tree marks every span it passes through; the first failure is where it started, "
     f"the failed span with no failed child, not the root: got {summary['first_failure']!r}")
assert summary["failed_tools"] == ["get_agent"], \
    f"only tool spans count as failed tools, not the run they failed inside: got {summary['failed_tools']}"
assert (summary["input_tokens"], summary["output_tokens"]) == (0, 0), \
    "a chat span without usage attributes (a scripted client reports none) counts as 0 tokens"

# two separate failures: the first in the order the spans started
root = span("invoke_agent registry_agent", gen_ai__operation__name="invoke_agent")
summary = summarize([root,
                     span("execute_tool search_docs", root, "ERROR", gen_ai__operation__name="execute_tool", gen_ai__tool__name="search_docs"),
                     span("execute_tool set_model", root, "ERROR", gen_ai__operation__name="execute_tool", gen_ai__tool__name="set_model")])
assert summary["first_failure"] == "execute_tool search_docs", "with two separate failures, report the one that started first"
assert summary["failed_tools"] == ["search_docs", "set_model"], "list every failed tool, in the order they ran"

clean = summarize([root, span("chat qwen", root, gen_ai__operation__name="chat")])
assert clean["first_failure"] is None and clean["failed_tools"] == [] and clean["blocked_checks"] == [] \
    and clean["tool_calls"] == {}, "a run with nothing failed or blocked reports None and empty lists and dicts"
```

**Hint (shown on request):** Write a small helper that returns a span's `gen_ai.operation.name` with `.get`, and use it to pick out the chat and tool spans. For the first failure, collect the `parent_id` of every failed span into a set: a failed span whose own `span_id` is in that set has a failed child, so its failure came from below. The first failed span not in the set is where the failure started.

**Reference solution:**
```python
from collections import Counter


def summarize(spans: list[Span]) -> dict:
    """The facts about one run that a trace answers at a glance, found by attributes rather than span names."""
    def operation(span):
        return span.attributes.get("gen_ai.operation.name")

    chats = [span for span in spans if operation(span) == "chat"]
    tools = [span for span in spans if operation(span) == "execute_tool"]
    # a failure that started somewhere else passes through its parents; the origin is the failed span with no failed child
    failed_parents = {span.parent_id for span in spans if span.status == "ERROR"}
    origins = [span for span in spans if span.status == "ERROR" and span.span_id not in failed_parents]
    return {
        "model_calls": len(chats),
        "input_tokens": sum(span.attributes.get("gen_ai.usage.input_tokens", 0) for span in chats),
        "output_tokens": sum(span.attributes.get("gen_ai.usage.output_tokens", 0) for span in chats),
        "tool_calls": dict(Counter(span.attributes["gen_ai.tool.name"] for span in tools)),
        "failed_tools": [span.attributes["gen_ai.tool.name"] for span in tools if span.status == "ERROR"],
        "first_failure": origins[0].name if origins else None,
        "blocked_checks": [span.attributes["registry_agent.check.point"] for span in spans
                           if span.attributes.get("registry_agent.check.verdict") == "blocked"],
    }
```

**Explanation:** Every count is found by `gen_ai.operation.name`, so the function works on any instrumentation that follows the conventions, whatever it names its spans. Tokens come from the chat spans alone, because a root span that carries the run's total would otherwise be counted on top of the calls that make it up. The first failure takes a little more thought. When an exception escapes a tool, the tracer marks the tool's span and then every span it passes through on the way out, up to the root, and the root started first. So "the first `ERROR` span" would name the run, not the cause. The cause is the failed span with no failed child: the set of failed spans' parents identifies every span whose failure came from below. A tool that returns an error result fails on its own, with no chain above it, so its span is an origin too.

---

## Two runs, summarized

Here are the summaries of two pilot runs, built from their recordings with [`trace_from_recording`](→ this lesson, the a shared format: OpenTelemetry's conventions for AI calls concept, the spans this agent produces): the refused change in p07, and a run of p08, where the agent was asked to move a model and check the change took effect, and the write was silently lost:

```python
run = load_pilot("4b-think")
for trial_id in ("4b-think/p07/0", "4b-think/p08/1"):
    trial = next(t for t in run["trials"] if t["trial_id"] == trial_id)
    print(trial_id, "--", trial["messages"][0]["content"])
    for key, value in summarize(trace_from_recording(run, trial)).items():
        print(f"    {key}: {value}")
```
```
4b-think/p07/0 -- Move research_agent to claude-opus.
    model_calls: 3
    input_tokens: 4118
    output_tokens: 479
    tool_calls: {'get_agent': 1, 'set_model': 1}
    failed_tools: ['set_model']
    first_failure: execute_tool set_model
    blocked_checks: []
4b-think/p08/1 -- Move research_agent to claude-sonnet, and check that the change took effect.
    model_calls: 4
    input_tokens: 5966
    output_tokens: 637
    tool_calls: {'get_agent': 2, 'set_model': 1}
    failed_tools: []
    first_failure: None
    blocked_checks: []
```
*(runs live, shows output — read-only demo snippet, not graded; built from real recordings; `trace_from_recording` and `summarize` are loaded for you)*

The p07 run shows its failure plainly: `set_model` failed, and that's where the run's trouble started. (Its check list is empty because the pilot's recordings predate check spans; the main runs' traces include them.) The p08 run looks clean: nothing failed, nothing was blocked. Yet it's one of the nine runs that told the user a lost write had worked.

**A trace records what happened, not whether it was right.** Every tool call in p08 succeeded as far as any status can tell, because the lost write said `"ok"`. The failure is only visible in what the tools returned and what the agent concluded, which is content, not structure.

---

## Where the tokens go

Every model call sends the conversation so far. One p02 run searched ten times without answering:

```python
run = load_pilot("4b-think")
trial = next(t for t in run["trials"] if t["trial_id"] == "4b-think/p02/1")
calls = [span for span in trace_from_recording(run, trial) if span.attributes.get("gen_ai.operation.name") == "chat"]
print("p02/1, input tokens on each model call:", [span.attributes["gen_ai.usage.input_tokens"] for span in calls])

totals = [summarize(trace_from_recording(run, trial)) for trial in run["trials"]]
sent = sum(s["input_tokens"] for s in totals)
written = sum(s["output_tokens"] for s in totals)
print(f"all 30 runs: {sent:,} tokens sent to the model, {written:,} generated, {sent / written:.0f} sent for every one generated")
```
```
p02/1, input tokens on each model call: [1188, 1956, 2152, 3072, 3229, 3437, 4294, 5141, 5296, 5380]
all 30 runs: 212,246 tokens sent to the model, 19,147 generated, 11 sent for every one generated
```
*(runs live, shows output — read-only demo snippet, not graded)*

Each call's input includes every earlier call and result, so it grows with every step. That's [Module 4's context budget](→ Module 4, the context as a budget lesson) seen from the other side: across the 4B's 30 pilot runs, 11 tokens were sent to the model for every one it generated. Input tokens usually cost less each than output tokens, but in an agent there are far more of them, so a step that adds a long tool result, or a run that takes a few extra steps, costs more than its own output suggests. A trace shows exactly which calls and which runs that cost came from.

---

## What the model saw and thought

The question p08's summary couldn't answer is why the agent reported success. With content captured, the trace can answer it. The demo walks the same p08 run, printing what each tool returned and what each model call asked for, then the model's reasoning before its final answer:

```python
run = load_pilot("4b-think")
trial = next(t for t in run["trials"] if t["trial_id"] == "4b-think/p08/1")
spans = trace_from_recording(run, trial, capture_content=True)

for span in spans:
    if span.attributes.get("gen_ai.operation.name") == "execute_tool":
        print(f"{span.name}: {span.attributes['gen_ai.tool.call.result'][:70]}")
    elif span.attributes.get("gen_ai.operation.name") == "chat":
        parts = span.attributes["gen_ai.output.messages"][0]["parts"]
        calls = [part["name"] for part in parts if part["type"] == "tool_use"]
        print(f"{span.name}: asks for {calls or 'nothing, and answers'}")

final = [span for span in spans if span.attributes.get("gen_ai.operation.name") == "chat"][-1]
thinking = next(part["thinking"] for part in final.attributes["gen_ai.output.messages"][0]["parts"] if part["type"] == "thinking")
print("\nthe model's reasoning before its answer, first four paragraphs:\n")
print("\n\n".join(thinking.split("\n\n")[:4]))
```
```
chat Qwen/Qwen3.5-4B: asks for ['get_agent']
execute_tool get_agent: {"agent_id": "research_agent", "model": "claude-legacy", "tier": "stan
chat Qwen/Qwen3.5-4B: asks for ['set_model']
execute_tool set_model: {"status": "ok", "agent_id": "research_agent", "model": "claude-sonnet
chat Qwen/Qwen3.5-4B: asks for ['get_agent']
execute_tool get_agent: {"agent_id": "research_agent", "model": "claude-legacy", "tier": "stan
chat Qwen/Qwen3.5-4B: asks for nothing, and answers

the model's reasoning before its answer, first four paragraphs:

Wait, that's strange. The set_model function returned success, but when I check the agent again, it still shows "claude-legacy" as the model. Let me think about this...

The set_model documentation says: "Change the model an agent runs on. The change applies from the agent's next session."

So the change hasn't taken effect yet - it will apply from the agent's next session. This is why checking immediately shows the old model. The user asked to "check that the change took effect" but based on the API behavior, the change doesn't take effect immediately - it only applies when the agent runs its next session.

I should inform the user that the model has been successfully updated (as confirmed by the set_model return), but explain that the change will apply from the next session and not immediately.
```
*(runs live, shows output — read-only demo snippet, not graded; the reasoning is the model's own, recorded in the pilot)*

The model noticed the contradiction, went looking for an explanation, and found one in `set_model`'s own description, written for this course: "The change applies from the agent's next session." Lesson 1 suspected the tool description had supplied the excuse; the trace shows the model quoting it. That's evidence about the harness, not the model: the fix starts with that sentence, which is why it's being rewritten for the main runs.

This is what reading a run means in practice, and it's how the next lesson works: not counting statuses, but following what the agent saw and concluded, step by step, until the first point where it went wrong.

---

## Exploring the pilot's traces

The viewer below shows the trace of any pilot run, built the same way, with content captured. It opens on the p08 run above. Two others worth reading:

- `4b-think/p01/0`, the multi-hop question, where the agent searched once, never found the section that says what the alert measures, and answered anyway
- `4b-think/p07/0`, the refused change, where the error comes back from the registry and the agent explains it to the user

*(interactive trace viewer — built from the pilot's real recordings, which have no timings)*

---

## Quiz cards

> **Q1.** Why find model calls by gen_ai.operation.name rather than by span names that start with "chat"?
> - Names vary by tool; the attribute says what a span is ✅
> - Span names are dropped when a trace is exported to a backend
> - The attribute is faster to read than a span's name in Python
> - Only the root span of a trace has a name it can be found by
>
> *Explanation: The conventions suggest a name format but let instrumentations choose their own, and a custom span can begin with "chat" without being a model call. gen_ai.operation.name is the field defined to say what operation a span records.*

> **Q2.** Why does summing gen_ai.usage.input_tokens over every span in a trace give the wrong total?
> - The invoke_agent span can carry the total, counting it twice ✅
> - Tool spans carry the tokens of the tool results they returned
> - Check spans repeat the tokens of the call they were checking
> - Usage attributes are in different units on different spans
>
> *Explanation: The conventions recommend usage attributes on the invoke_agent span as well as on each model call, and the agent span's figure is the sum of its calls. Adding it to the calls counts every token twice; the chat spans alone give the total.*

> **Q3.** A tool raises an exception, and the tracer marks the tool span and the root span ERROR. Which one is the first failure?
> - The tool span: the failed span with no failed child ✅
> - The root span, because it started before the tool
> - Both, because each of them has status ERROR set
> - Neither, because exceptions aren't failures of a step
>
> *Explanation: The exception started in the tool and passed up through the root, marking it on the way. The root's ERROR is a consequence, not a cause. The span where a failure began is the one marked ERROR with no failed span beneath it.*

> **Q4.** One p08 run's trace shows no failed spans and no blocked checks, yet the run told the user a lost write had worked. What does that show?
> - A trace records what happened, not whether it was right ✅
> - The trace was built incorrectly from the run's recording
> - Lost writes can't be represented in OpenTelemetry's format
> - The run should have been recorded with status ERROR
>
> *Explanation: Every step did what it was asked and reported success, including the write that silently failed. Statuses describe whether steps ran, not whether the run's result was correct. The evidence of the mistake is in the content: the read-back's result and the reply.*

> **Q5.** Across the pilot's 4B runs, 11 tokens were sent to the model for every one it generated. Why so many?
> - Every call resends the whole conversation so far ✅
> - The model's reasoning tokens are counted as input
> - The tool definitions are only sent on the first call
> - Generated tokens are counted after compression
>
> *Explanation: An agent's model calls are stateless: each one sends the system prompt, the tools and every earlier step again, so input grows with every step while each call's output stays small. On the p02 run that searched ten times, the last call sent over four times what the first did.*
