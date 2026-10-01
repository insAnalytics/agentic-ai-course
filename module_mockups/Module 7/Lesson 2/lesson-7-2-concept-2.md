# Module 7, Lesson 2 — Concept 2: A shared format: OpenTelemetry's conventions for AI calls

> **Note for the site build:** both demos read `4b-think.json`. The second demo uses `trace_from_recording` from the first, so carry it into its hidden setup (later concepts in this lesson also use it).

---

## Why a shared format

The tracer from the last concept records a tree of spans, but the names on those spans were made up on the spot: `chat`, `tool_calls`, `arguments`. Another team's tracer would make up different ones, and every tool for storing, searching and displaying traces would need to be taught each team's names.

OpenTelemetry solves this with **semantic conventions**: agreed names for the spans and attributes that describe common kinds of work, such as HTTP requests and database queries. Its conventions for generative AI, maintained in the [`semantic-conventions-genai`](https://github.com/open-telemetry/semantic-conventions-genai) repository, cover model calls, tool calls, agents, retrieval and memory. Every part of them is still marked **Development**, which is why [Module 4 called them draft conventions](→ Module 4, the assembling the context step lesson, the seeing inside each request concept): names can still change, so code that emits them should be easy to update. (Module 4 mentioned that they can record whether a conversation was compacted; that's `gen_ai.conversation.compacted`, and it's still there.)

---

## The spans this agent produces

Four kinds of span from the conventions cover the registry agent:

- **`invoke_agent {agent name}`**: the whole run, at the root, with `gen_ai.operation.name` set to `invoke_agent` and `gen_ai.agent.name`.
- **`chat {model}`**: one model call, with `gen_ai.operation.name` set to `chat`. Its attributes include:
  - `gen_ai.provider.name`, which is required, and `gen_ai.request.model`
  - `gen_ai.response.model`, the model that actually answered, which isn't always the one requested
  - the sampling settings, such as `gen_ai.request.temperature` and `gen_ai.request.seed`
  - `gen_ai.usage.input_tokens` and `gen_ai.usage.output_tokens`, and `gen_ai.usage.cache_read.input_tokens` where a cache was used
  - `gen_ai.response.finish_reasons`, why the model stopped
- **`execute_tool {tool name}`**: one tool call, with `gen_ai.tool.name` required and `gen_ai.tool.call.id` recommended, so a tool span can be matched to the model call that asked for it.
- **`retrieval {data source}`**: a search of a document store, for pipelines like Module 5's. The registry agent searches through a tool, so its searches appear as `execute_tool search_docs`.

A step that failed gets status `ERROR` and an `error.type` attribute, as in the last concept.

The pilot's recordings predate this lesson's tracer, but they hold everything needed to build its traces after the fact. The demo does that for one run of p07, where the registry refused the change:

```python
def trace_from_recording(run: dict, trial: dict, capture_content: bool = False) -> list[Span]:
    """A pilot trial's recording as spans named and described by OpenTelemetry's GenAI conventions.
    The pilot recorded no timestamps, so these spans have none. Message content, tool arguments and
    tool results are left out unless capture_content is set, as the conventions recommend."""
    trace_id = secrets.token_hex(16)

    def new_span(name, parent, attributes):
        return Span(name=name, trace_id=trace_id, span_id=secrets.token_hex(8),
                    parent_id=parent.span_id if parent else None, start_ns=None, attributes=attributes)

    root = new_span("invoke_agent registry_agent", None, {
        "gen_ai.operation.name": "invoke_agent",
        "gen_ai.agent.name": "registry_agent",
        "gen_ai.conversation.id": trial["trial_id"],
    })
    spans = [root]
    log = iter(trial["tool_log"])
    for call in trial["calls"]:
        chat = new_span(f"chat {run['model']}", root, {
            "gen_ai.operation.name": "chat",
            # no well-known value covers a self-hosted vLLM server, so this is a custom one
            "gen_ai.provider.name": "vllm",
            "gen_ai.request.model": run["model"],
            "gen_ai.response.model": run["setup"]["agent_server"]["models"][0],
            "gen_ai.request.temperature": run["sampling"]["temperature"],
            "gen_ai.request.top_p": run["sampling"]["top_p"],
            "gen_ai.request.top_k": run["sampling"]["top_k"],
            "gen_ai.request.max_tokens": run["max_tokens"],
            "gen_ai.request.seed": call["seed"],
            "gen_ai.usage.input_tokens": call["prompt_tokens"],
            "gen_ai.usage.output_tokens": call["completion_tokens"],
            "gen_ai.response.finish_reasons": [call["finish_reason"]],
        })
        if capture_content:
            chat.attributes["gen_ai.output.messages"] = [{"role": "assistant", "parts": call["content"]}]
        spans.append(chat)
        for block in call["content"]:
            if block["type"] != "tool_use":
                continue
            entry = next(log)
            assert entry["tool"] == block["name"], "the tool log and the model's calls are out of step"
            tool = new_span(f"execute_tool {block['name']}", root, {
                "gen_ai.operation.name": "execute_tool",
                "gen_ai.tool.name": block["name"],
                "gen_ai.tool.call.id": block["id"],
                "gen_ai.tool.type": "function",
            })
            if not entry["ok"]:
                tool.status = "ERROR"
                tool.attributes["error.type"] = "tool_error"
            if capture_content:
                tool.attributes["gen_ai.tool.call.arguments"] = entry["input"]
                tool.attributes["gen_ai.tool.call.result"] = entry["output"]
            spans.append(tool)
    return spans


run = load_pilot("4b-think")
trial = next(t for t in run["trials"] if t["trial_id"] == "4b-think/p07/0")
spans = trace_from_recording(run, trial)

for span in spans:
    depth = 0 if span.parent_id is None else 1
    print(f"{'    ' * depth}{span.name}{'  ERROR' if span.status == 'ERROR' else ''}")
print("\nthe first model call:")
for key, value in spans[1].attributes.items():
    print(f"    {key} = {value!r}")
print("the failed tool call:")
for key, value in spans[4].attributes.items():
    print(f"    {key} = {value!r}")
```
```
invoke_agent registry_agent
    chat Qwen/Qwen3.5-4B
    execute_tool get_agent
    chat Qwen/Qwen3.5-4B
    execute_tool set_model  ERROR
    chat Qwen/Qwen3.5-4B

the first model call:
    gen_ai.operation.name = 'chat'
    gen_ai.provider.name = 'vllm'
    gen_ai.request.model = 'Qwen/Qwen3.5-4B'
    gen_ai.response.model = 'Qwen/Qwen3.5-4B'
    gen_ai.request.temperature = 1.0
    gen_ai.request.top_p = 0.95
    gen_ai.request.top_k = 20
    gen_ai.request.max_tokens = 8192
    gen_ai.request.seed = 1998000588
    gen_ai.usage.input_tokens = 1185
    gen_ai.usage.output_tokens = 109
    gen_ai.response.finish_reasons = ['stop']
the failed tool call:
    gen_ai.operation.name = 'execute_tool'
    gen_ai.tool.name = 'set_model'
    gen_ai.tool.call.id = 'call_01_0'
    gen_ai.tool.type = 'function'
    error.type = 'tool_error'
```
*(runs live, shows output — read-only demo snippet, not graded; built from a real recording)*

A few choices in that code are worth knowing about, because the conventions leave them to whoever writes the instrumentation:

- **`gen_ai.provider.name`** must use a well-known value when one fits, such as `openai` or `anthropic`. None covers a model served from your own vLLM server, so the code uses a custom value, which the conventions allow.
- **`chat`, though the HTTP request is a raw completion.** The pilot's client renders the chat template itself and sends the text to vLLM's completions endpoint. From the agent's side it's a chat call, messages in and content blocks out, so the span says `chat`. A tracer sitting at the HTTP layer would have said `text_completion`.
- **A tool that returns an error is marked `ERROR`.** The registry's REG-1007 refusal came back as a result, not an exception, but the tool call still failed, and marking it lets a query find every failed call. `tool_error` is this course's own value for `error.type`.
- **No timings.** The pilot didn't record when each step started, so these spans have none. The module's main runs are traced as they run, with real times.

---

## What the conventions leave out: content

Notice what the trace above doesn't hold: no prompt, no reply text, no tool arguments, no tool results. That's deliberate. In the conventions, every attribute that records content is **opt-in**: the messages sent to the model, the messages it returned, the system instructions, the tool definitions, and each tool call's arguments and result. Each one carries a warning that it's likely to contain sensitive information, including users' personal data.

Content is also big. The demo builds all 30 of the 4B's pilot traces twice, once without content and once capturing the model's replies and every tool call's arguments and result:

```python
import json


def attribute_bytes(spans: list[Span]) -> int:
    """How many bytes the spans' attributes take as JSON."""
    return sum(len(json.dumps(span.attributes).encode("utf-8")) for span in spans)


run = load_pilot("4b-think")
without = sum(attribute_bytes(trace_from_recording(run, trial)) for trial in run["trials"])
with_content = sum(attribute_bytes(trace_from_recording(run, trial, capture_content=True)) for trial in run["trials"])
print(f"all 30 traces, attributes only:      {without / 1000:.0f} KB")
print(f"all 30 traces, with content captured: {with_content / 1000:.0f} KB, {with_content / without:.0f} times as much")

trial = next(t for t in run["trials"] if t["trial_id"] == "4b-think/p07/0")
captured = trace_from_recording(run, trial, capture_content=True)
print("\nwhat one captured tool result holds:")
print("   ", captured[2].attributes["gen_ai.tool.call.result"])
```
```
all 30 traces, attributes only:      62 KB
all 30 traces, with content captured: 239 KB, 4 times as much

what one captured tool result holds:
    {"agent_id": "research_agent", "model": "claude-legacy", "tier": "standard", "owner": "research-team", "status": "active"}
```
*(runs live, shows output — read-only demo snippet, not graded)*

Capturing content made the traces almost four times as large, and that's without the input messages: a model call's input repeats the whole conversation so far, so recording it on every call grows much faster still.

So capturing content is a decision, not a default:

- **For debugging and evaluation it's essential.** You can't read why an agent did something without seeing what it saw and said. Every lesson after this one reads content.
- **In production it means storing what users typed,** and whatever the tools returned about them, for as long as the traces are kept. Module 10 covers trace retention and personal data.

This module's traces capture content, because the registry and its documents are made up and contain nothing personal.

---

## The same thing in a real SDK

In production you'd use OpenTelemetry's own SDK rather than a hand-written tracer: it propagates context across threads and processes, batches spans, and exports them to whichever backend you use. The spans and attribute names are the same:

```python
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter

exporter = InMemorySpanExporter()
provider = TracerProvider()
provider.add_span_processor(SimpleSpanProcessor(exporter))
tracer = provider.get_tracer("registry-agent")

with tracer.start_as_current_span("invoke_agent registry_agent",
                                  attributes={"gen_ai.operation.name": "invoke_agent",
                                              "gen_ai.agent.name": "registry_agent"}):
    with tracer.start_as_current_span("chat Qwen/Qwen3.5-4B") as span:
        span.set_attribute("gen_ai.operation.name", "chat")
        span.set_attribute("gen_ai.provider.name", "vllm")
        span.set_attribute("gen_ai.request.model", "Qwen/Qwen3.5-4B")
        span.set_attribute("gen_ai.usage.input_tokens", 1185)
        span.set_attribute("gen_ai.usage.output_tokens", 109)
    with tracer.start_as_current_span("execute_tool get_agent") as span:
        span.set_attribute("gen_ai.operation.name", "execute_tool")
        span.set_attribute("gen_ai.tool.name", "get_agent")
        span.set_attribute("gen_ai.tool.call.id", "call_00_0")

names = {s.context.span_id: s.name for s in exporter.get_finished_spans()}
for s in exporter.get_finished_spans():
    print(s.name, "| parent:", names.get(s.parent.span_id) if s.parent else None)
    print("   ", dict(s.attributes))
```
```
chat Qwen/Qwen3.5-4B | parent: invoke_agent registry_agent
    {'gen_ai.operation.name': 'chat', 'gen_ai.provider.name': 'vllm', 'gen_ai.request.model': 'Qwen/Qwen3.5-4B', 'gen_ai.usage.input_tokens': 1185, 'gen_ai.usage.output_tokens': 109}
execute_tool get_agent | parent: invoke_agent registry_agent
    {'gen_ai.operation.name': 'execute_tool', 'gen_ai.tool.name': 'get_agent', 'gen_ai.tool.call.id': 'call_00_0'}
invoke_agent registry_agent | parent: None
    {'gen_ai.operation.name': 'invoke_agent', 'gen_ai.agent.name': 'registry_agent'}
```
*(illustrative — OpenTelemetry's SDK can't run in the browser sandbox; run against `opentelemetry-sdk` 1.45.0)*

One difference from this lesson's tracer shows in the output: the SDK hands each span to the exporter when it ends, so children arrive before their parents. A backend puts the tree back together from the parent ids, which is why every span carries one.

---

## A second standard: OpenInference

OpenTelemetry's conventions aren't the only ones. Arize, which makes the Phoenix tracing tool, says the field currently has two standards: OpenTelemetry's `gen_ai.*` names, and its own **OpenInference**, which is also built on OpenTelemetry's trace model. OpenInference marks each span with a **kind** in `openinference.span.kind`, and the two map onto each other closely:

- `invoke_agent` is an `AGENT` span, `chat` an `LLM` span, `execute_tool` a `TOOL` span and `retrieval` a `RETRIEVER` span.
- Token counts are `llm.token_count.prompt` and `llm.token_count.completion` rather than `gen_ai.usage.input_tokens` and `gen_ai.usage.output_tokens`.
- A tool's name is `tool.name` rather than `gen_ai.tool.name`.
- OpenInference also has a `GUARDRAIL` kind for a check on inputs or outputs. OpenTelemetry's conventions have nothing equivalent yet, which matters for Module 6's checks, and the next concept comes back to it.

This course uses OpenTelemetry's names, because they're the vendor-neutral standard, but the choice is less important than making one: a trace in either format can be translated into the other.

---

## Quiz cards

> **Q1.** Why use agreed attribute names like gen_ai.usage.input_tokens rather than names your team makes up?
> - Any tool that knows the conventions can read your traces ✅
> - Made-up names are rejected by OpenTelemetry's SDK at runtime
> - The agreed names make each span smaller to store and send
> - Only the agreed names can be attached to a span as attributes
>
> *Explanation: The point of a convention is that storage, search and display tools can be built once and work for everyone's traces. Nothing stops you attaching your own attributes, and the next concept does exactly that for what the conventions don't cover.*

> **Q2.** A chat span records both gen_ai.request.model and gen_ai.response.model. Why both?
> - The model that answered isn't always the one requested ✅
> - One is for the prompt's tokens, the other for the reply's
> - The conventions require every attribute to appear twice
> - One holds the model's name, the other its provider
>
> *Explanation: Providers resolve aliases to specific versions, and fallbacks can route a request elsewhere. Module 6 made the point that recording which model answered is the minimum, because it's the first thing to find out when answers go wrong.*

> **Q3.** Why are message content, tool arguments and tool results opt-in?
> - They can hold personal data, and they make traces far larger ✅
> - Most tracing backends can't store text, only numbers and span ids
> - They're only useful while an agent is still being developed and tested
> - They're already captured elsewhere, by the model's provider
>
> *Explanation: The conventions flag each content attribute as likely to contain sensitive information, and the demo showed content multiplying a trace's size even without input messages. Content is essential for debugging, so it's a decision to make deliberately, not something to switch on by default.*

> **Q4.** The registry returned a REG-1007 error as a tool result rather than raising. How did this course's trace record that tool call?
> - As an ERROR span with an error.type, so it can be found ✅
> - As a normal span, since no exception was ever raised by the tool
> - It left the tool call out, since the change never happened
> - As a span under the next model call, which read the error
>
> *Explanation: The call failed even though nothing crashed, and marking it ERROR lets anyone querying the traces find every failed tool call. The span stays where the call happened, as a sibling after the model call that asked for it.*

> **Q5.** What is the difference between OpenTelemetry's GenAI conventions and OpenInference?
> - Two naming schemes for the same spans, mapping onto each other ✅
> - OpenInference is a tracing backend, and OpenTelemetry is a file format
> - OpenTelemetry covers agents; OpenInference covers model calls only
> - OpenInference replaced OpenTelemetry's conventions earlier this year
>
> *Explanation: Both are sets of names for spans and attributes, built on OpenTelemetry's trace model: chat is an LLM span, execute_tool a TOOL span, and so on. Arize describes them as the field's two current standards, and a trace in one can be translated into the other.*
