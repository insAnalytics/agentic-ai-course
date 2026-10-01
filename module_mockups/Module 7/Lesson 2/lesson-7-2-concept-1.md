# Module 7, Lesson 2 — Concept 1: From a list of events to a tree of spans

> **Note for the site build:**
> - Every demo in this lesson starts from `LOAD_PILOT` (from `evalData.ts`), `REACT_FAKE_CLIENT` and Module 6's `CHECKED_AGENT` (`run_checked_agent` and `Checks`). The first demo reads `4b-think.json`.
> - The demos after the exercise also need the exercise's reference `Span` and `Tracer` loaded, without showing them. Add them to `evalData.ts` as `TRACER`, byte-identical to the reference solution below; later concepts in this module build on them.
> - Module 0 gap list: `contextvars`, mentioned here as how real tracers track the current span across threads and async tasks (a genuinely complicated topic, a candidate for Module 0's async lesson).
> - The second demo defines `print_tree`, `TracedClient` and `traced_tools`; the third demo reuses them, so carry them (and the demo's `registry` and `tools`) into its hidden setup.

---

## Four records that don't connect

Every module so far has kept its own record of what an agent did:

- [Module 2's tracing hook](→ Module 2, the from hand-rolled to a runtime lesson, the what a framework actually provides concept, the fix, by hand: a tracing hook) collected a flat list of events, one per model call or tool result. That module said where the events end up and how to read them was a topic for later. This lesson is that topic.
- [Module 4's manifest](→ Module 4, the assembling the context step lesson, the seeing inside each request concept) recorded what went into each request.
- [Module 6's check records](→ Module 6, the checks in the loop lesson, the what a failed check does concept) noted which check fired, on what, and what happened next.
- [Module 6's `record_run`](→ Module 6, the fallbacks and graceful degradation lesson, the pinning model and prompt versions concept) wrote down which model and prompt version a run used.

The pilot's recordings add two more lists: the tools the agent called, and the model calls it made. Here they are for one run of p08:

```python
trial = next(t for t in load_pilot("4b-think")["trials"] if t["trial_id"] == "4b-think/p08/0")

print("tool log:")
for entry in trial["tool_log"]:
    print(f"  {entry['tool']}({', '.join(f'{k}={v!r}' for k, v in entry['input'].items())})  ok={entry['ok']}")

print("model calls:")
for call in trial["calls"]:
    tools = [block["name"] for block in call["content"] if block["type"] == "tool_use"]
    print(f"  call {call['n']}: {call['wall_s']:.1f} s, {call['completion_tokens']} tokens out, asked for {tools or 'nothing'}")
```
```
tool log:
  get_agent(agent_name='research_agent')  ok=True
  set_model(agent_name='research_agent', model='claude-sonnet')  ok=True
  get_agent(agent_name='research_agent')  ok=True
  get_health(agent_name='research_agent')  ok=True
  search_docs(query='model change research_agent claude-sonnet tier', k=3)  ok=True
  query_database(sql="SELECT * FROM agents WHERE agent_id = 'research_agent'")  ok=True
  search_docs(query='verify model change agent status active session', k=3)  ok=True
model calls:
  call 0: 6.8 s, 319 tokens out, asked for ['get_agent']
  call 1: 1.9 s, 158 tokens out, asked for ['set_model']
  call 2: 0.7 s, 68 tokens out, asked for ['get_agent']
  call 3: 2.1 s, 223 tokens out, asked for ['get_health']
  call 4: 2.0 s, 215 tokens out, asked for ['search_docs']
  call 5: 2.4 s, 297 tokens out, asked for ['query_database']
  call 6: 3.7 s, 468 tokens out, asked for ['search_docs']
  call 7: 3.3 s, 452 tokens out, asked for nothing
```
*(runs live, shows output — read-only demo snippet, not graded)*

This run happens to be easy to line up by hand, because each model call asked for exactly one tool. Even so, the two lists can't answer basic questions without that kind of guesswork:

- **Which model call led to which tool call?** Nothing in either list links them. With parallel tool calls, or a check that blocked a call, lining them up by position stops working.
- **How long did the tools take, and the run as a whole?** The model calls have durations; the tools have none.
- **What happened inside a step?** A search that ran inside a tool, or a check that ran after it, has nowhere to go in a flat list.

And each module's record has its own shape, so no tool can read them all.

---

## Spans and traces

Observability tools settled this long ago, and OpenTelemetry, the open standard most of them now share, describes a run as a **trace** made of **spans**. A span is one timed step of the work:

- a **name**, saying what the step was, such as `chat` or `execute_tool get_agent`
- a **span id**, and the id of its **parent**: the step it happened inside. A span with no parent is the trace's root.
- a **trace id**, shared by every span in the same run
- a **start and end time**
- **attributes**: key-value facts about the step, such as the model, the tokens used, or the tool's arguments
- a **status**. OpenTelemetry's default is `UNSET`, which means the step finished without an error being recorded. `ERROR` marks a failure. `OK` is reserved for code that deliberately marks a success, and tracing code doesn't set it.

Because every span names its parent, the spans of one run form a tree: the run at the root, each model call and tool call beneath it, and anything that happened inside a tool beneath that. That one structure holds all four of the course's records, as later concepts in this lesson show.

The tracer below keeps a stack of the spans that are open. A new span's parent is whichever span is innermost when it starts. A Python context manager fits this exactly: the span opens when the `with` block starts and closes when it ends, however it ends.

---

## Applied sandbox exercise
*(graded — a tracer whose spans nest, time themselves, and record failures)*

**Task shown to learner:**

Write `Tracer.span(name, attributes=None)` as a context manager (use `contextlib.contextmanager`), so that `with tracer.span("chat") as span:` records the code inside the block as a span:

- **On entry**, create a `Span` with the tracer's `trace_id`, a new id from `self._new_id()`, and as its `parent_id` the `span_id` of the innermost span that's open right now, or `None` if none is. Set `start_ns` from `self.clock()`. Give it a copy of `attributes` (or an empty dict). Append it to `self.spans`, push it onto `self._open`, and yield it.
- **On exit**, however the block ends, set `end_ns` from `self.clock()` and pop it off `self._open`.
- **If an exception escapes the block**, set the span's `status` to `"ERROR"` and its `"error.type"` attribute to the exception's class name, then let the exception carry on. Tracing must not change what the code does.
- **Otherwise** leave `status` as `"UNSET"`.

**Starter code:**
```python
import secrets
import time
from collections import defaultdict
from contextlib import contextmanager
from dataclasses import dataclass, field


@dataclass
class Span:
    """One timed step of a run: what it was, which step it sits inside, and how it ended."""
    name: str
    trace_id: str
    span_id: str
    parent_id: str | None
    start_ns: int
    end_ns: int | None = None
    attributes: dict = field(default_factory=dict)
    status: str = "UNSET"


class Tracer:
    """Records one run as a tree of spans."""

    def __init__(self, clock=time.time_ns):
        self.clock = clock
        self.trace_id = secrets.token_hex(16)
        # every span, in the order it started
        self.spans: list[Span] = []
        # the spans that are open right now, innermost last
        self._open: list[Span] = []

    def _new_id(self) -> str:
        return secrets.token_hex(8)

    def span(self, name: str, attributes: dict | None = None):
        """Open a span for the code inside the with block, nested inside whichever span is open."""
        # your code here
```

**Hidden tests:**
```python
import itertools


class FakeClock:
    """A clock that ticks by one each time it's read, so times are predictable."""
    def __init__(self):
        self.ticks = itertools.count(1)

    def __call__(self) -> int:
        return next(self.ticks)


tracer = Tracer(clock=FakeClock())
opened = tracer.span("run")
assert hasattr(opened, "__enter__") and hasattr(opened, "__exit__"), \
    "span() should return a context manager: decorate it with @contextlib.contextmanager and yield the new span"

with opened as run:
    assert isinstance(run, Span), "the with block should receive the new Span"
    with tracer.span("chat", {"gen_ai.operation.name": "chat"}) as chat:
        with tracer.span("render prompt") as render:
            pass
    with tracer.span("execute_tool get_agent") as tool:
        tool.attributes["ok"] = True

assert [s.name for s in tracer.spans] == ["run", "chat", "render prompt", "execute_tool get_agent"], \
    "tracer.spans should hold every span in the order it started"
assert run.parent_id is None, "a span opened with nothing open is a root: parent_id None"
assert chat.parent_id == run.span_id and tool.parent_id == run.span_id, \
    "a span opened inside another gets that span's span_id as its parent_id"
assert render.parent_id == chat.span_id, "a span's parent is the innermost span open when it starts, not the outermost"
assert len({s.span_id for s in tracer.spans}) == 4, "every span needs its own span_id"
assert {s.trace_id for s in tracer.spans} == {tracer.trace_id}, "every span carries the tracer's trace_id"
assert (run.start_ns, chat.start_ns, render.start_ns, render.end_ns, chat.end_ns, tool.start_ns, tool.end_ns, run.end_ns) == (1, 2, 3, 4, 5, 6, 7, 8), \
    "read the clock once when a span starts and once when it ends"
assert chat.attributes == {"gen_ai.operation.name": "chat"} and tool.attributes == {"ok": True}, \
    "a span starts with the attributes it was given, and code inside the block can add more"
assert all(s.status == "UNSET" for s in tracer.spans), \
    "a span that ends normally keeps the status \"UNSET\"; only errors set a status"

given = {"a": 1}
with tracer.span("copy", given) as copied:
    pass
given["a"] = 2
assert copied.attributes == {"a": 1}, "copy the attributes dict, so later changes to the caller's dict don't leak in"

with tracer.span("next run") as next_run:
    pass
assert next_run.parent_id is None, "after a span closes, the next span opened at the top level is a root again"

tracer = Tracer(clock=FakeClock())
try:
    with tracer.span("run") as run:
        with tracer.span("execute_tool set_model") as failing:
            raise KeyError("no such agent")
except KeyError:
    pass
else:
    raise AssertionError("an exception inside a span must not be swallowed: re-raise it")
assert failing.status == "ERROR" and failing.attributes.get("error.type") == "KeyError", \
    "a span an exception escapes from gets status \"ERROR\" and error.type set to the exception's class name"
assert run.status == "ERROR", "the exception passed through the outer span too, so it's an error there as well"
assert failing.end_ns == 3 and run.end_ns == 4, "a span that fails still records its end time"
with tracer.span("after") as after:
    pass
assert after.parent_id is None, "a failed span must still be closed, or later spans get the wrong parent"

t1, t2 = Tracer(), Tracer()
assert t1.trace_id != t2.trace_id, "each tracer is one trace, with its own trace_id"
```

**Hint (shown on request):** Decorate `span` with `@contextmanager` and make it a generator: build the span, record it and push it, then `yield span` inside a `try`. An `except Exception as error:` block sets the status and attribute and ends with a bare `raise`; a `finally:` block sets the end time and pops, so it runs whether the block finished, failed, or re-raised. The parent is `self._open[-1]` when the stack isn't empty.

**Reference solution:**
```python
import secrets
import time
from collections import defaultdict
from contextlib import contextmanager
from dataclasses import dataclass, field


@dataclass
class Span:
    """One timed step of a run: what it was, which step it sits inside, and how it ended."""
    name: str
    trace_id: str
    span_id: str
    parent_id: str | None
    start_ns: int
    end_ns: int | None = None
    attributes: dict = field(default_factory=dict)
    status: str = "UNSET"


class Tracer:
    """Records one run as a tree of spans."""

    def __init__(self, clock=time.time_ns):
        self.clock = clock
        self.trace_id = secrets.token_hex(16)
        # every span, in the order it started
        self.spans: list[Span] = []
        # the spans that are open right now, innermost last
        self._open: list[Span] = []

    def _new_id(self) -> str:
        return secrets.token_hex(8)

    @contextmanager
    def span(self, name: str, attributes: dict | None = None):
        """Open a span for the code inside the with block, nested inside whichever span is open."""
        span = Span(name=name, trace_id=self.trace_id, span_id=self._new_id(),
                    parent_id=self._open[-1].span_id if self._open else None,
                    start_ns=self.clock(), attributes=dict(attributes or {}))
        self.spans.append(span)
        self._open.append(span)
        try:
            yield span
        except Exception as error:
            span.status = "ERROR"
            span.attributes["error.type"] = type(error).__name__
            raise
        finally:
            span.end_ns = self.clock()
            self._open.pop()
```

**Explanation:** The stack is what makes the tree. When a span opens, the innermost open span is the step it's happening inside, so that span is its parent; when it closes, it comes off the stack, so the next span opened at that level gets the right parent again. `try`/`finally` is what keeps the stack honest when something fails: without it, a span an exception escapes from would never be popped, and every later span in the run would hang off it. The `except` block records the failure and re-raises, because a tracer that swallowed exceptions would change how the agent behaves, which is the one thing recording mustn't do. And since the exception passes through every enclosing `with` block on its way out, each of those spans is marked `ERROR` too: the run failed, not just the tool. Copying the attributes means a caller who reuses a dict can't change a span after the fact.

One simplification: this tracer keeps its open spans in a plain list, which works while one run executes at a time. OpenTelemetry's Python SDK keeps the current span in a `contextvars` variable instead, so that spans opened in different threads or async tasks each find the right parent. The module's offline runs give each trial its own tracer, so the list is enough here.

---

## A run as a tree

With the tracer, a run can be traced without changing the agent's loop. The demo wraps the client and the tools: each wrapper opens a span around the real call and adds what it learned, and Module 6's `run_checked_agent` runs exactly as before. (These wrappers are deliberately minimal. Later in this lesson they gain the attribute names the industry has agreed on.) The model's replies are scripted:

```python
import json


def print_tree(spans: list[Span]) -> None:
    """Print spans as an indented tree, in the order they started, with their attributes."""
    children = defaultdict(list)
    for span in spans:
        children[span.parent_id].append(span)

    def show(span: Span, depth: int) -> None:
        status = "  ERROR" if span.status == "ERROR" else ""
        attributes = f"  {span.attributes}" if span.attributes else ""
        print(f"{'    ' * depth}{span.name}{status}{attributes}")
        for child in children[span.span_id]:
            show(child, depth + 1)

    for root in children[None]:
        show(root, 0)


class TracedClient:
    """A client whose every model call is recorded as a span."""

    def __init__(self, client, tracer: Tracer):
        self.client, self.tracer = client, tracer

    def create(self, messages: list):
        with self.tracer.span("chat") as span:
            response = self.client.create(messages=messages)
            span.attributes["tool_calls"] = [block.name for block in response.content if block.type == "tool_use"]
            return response


def traced_tools(tools: dict, tracer: Tracer) -> dict:
    """The same tools, each call recorded as a span."""
    def wrap(name, function):
        def call(**arguments):
            with tracer.span(f"execute_tool {name}", {"arguments": arguments}):
                return function(**arguments)
        return call
    return {name: wrap(name, function) for name, function in tools.items()}


registry = {"notes_agent": {"model": "claude-legacy", "tier": "standard"}}
tools = {
    "get_agent": lambda agent_name: json.dumps(registry[agent_name]),
    "set_model": lambda agent_name, model: registry[agent_name].update(model=model) or '{"status": "ok"}',
}
client = FakeLLMClient(scripted_responses=[
    [ThinkingBlock("Check the agent first."), ToolUseBlock("get_agent", {"agent_name": "notes_agent"})],
    [ToolUseBlock("set_model", {"agent_name": "notes_agent", "model": "claude-haiku"})],
    [TextBlock("Moved notes_agent to claude-haiku.")],
])

tracer = Tracer()
messages = [{"role": "user", "content": "Move notes_agent to claude-haiku."}]
with tracer.span("invoke_agent registry_agent"):
    answer = run_checked_agent(TracedClient(client, tracer), messages, traced_tools(tools, tracer), Checks())

print_tree(tracer.spans)
print("\nanswer:", answer)
by_id = {span.span_id: span for span in tracer.spans}
inside = all(by_id[s.parent_id].start_ns <= s.start_ns <= s.end_ns <= by_id[s.parent_id].end_ns
             for s in tracer.spans if s.parent_id)
print("every span's time lies inside its parent's:", inside)
```
```
invoke_agent registry_agent
    chat  {'tool_calls': ['get_agent']}
    execute_tool get_agent  {'arguments': {'agent_name': 'notes_agent'}}
    chat  {'tool_calls': ['set_model']}
    execute_tool set_model  {'arguments': {'agent_name': 'notes_agent', 'model': 'claude-haiku'}}
    chat  {'tool_calls': []}

answer: Moved notes_agent to claude-haiku.
every span's time lies inside its parent's: True
```
*(runs live, shows output — read-only demo snippet, not graded; the model's replies are scripted; `Span` and `Tracer` are the exercise's reference versions, loaded for you)*

Every model call and tool call now sits under the run, in order, each with what it did. The question the flat lists couldn't answer, which model call asked for which tool, is now just the order of siblings in the tree. And each span has its own start and end, so timings come for free (the demo checks they nest properly rather than printing them, because they change on every run).

When code crashes, the trace shows exactly where. Here the scripted model asks for an agent that doesn't exist, and this demo's simple tool raises instead of returning an error (the registry agent's real tools [return errors as results](→ Module 2, the termination, failure, and control lesson, the tool errors as observations, not exceptions concept), so it rarely crashes):

```python
client = FakeLLMClient(scripted_responses=[
    [ToolUseBlock("get_agent", {"agent_name": "notes_agnet"})],
])
tracer = Tracer()
messages = [{"role": "user", "content": "What model is notes_agent on?"}]
try:
    with tracer.span("invoke_agent registry_agent"):
        run_checked_agent(TracedClient(client, tracer), messages, traced_tools(tools, tracer), Checks())
except KeyError as error:
    print("the run raised:", repr(error))

print_tree(tracer.spans)
```
```
the run raised: KeyError('notes_agnet')
invoke_agent registry_agent  ERROR  {'error.type': 'KeyError'}
    chat  {'tool_calls': ['get_agent']}
    execute_tool get_agent  ERROR  {'arguments': {'agent_name': 'notes_agnet'}, 'error.type': 'KeyError'}
```
*(runs live, shows output — read-only demo snippet, not graded; the model's reply is scripted)*

The failing tool span and the run that contained it are both marked `ERROR`, with the exception's type, and the run's caller still gets the exception, unchanged.

---

## Quiz cards

> **Q1.** The pilot's tool log lists the seven tools one p08 run called. What can't it tell you that a trace of the run would?
> - Which model call asked for each tool, and the tools' timings ✅
> - Which tools were called, and with which arguments each time
> - Whether each of the tool calls succeeded or returned an error
> - The order in which the tools were called during the run
>
> *Explanation: The tool log records each call's tool, arguments and success, in order. What it doesn't record is how calls relate to the rest of the run: nothing links a tool call to the model call that asked for it, and tools have no timings. In a trace, each tool span sits under the run next to the model call before it, with its own start and end.*

> **Q2.** Inside a chat span, the code opens a span called "render prompt". What is its parent?
> - The chat span, the innermost one open when it starts ✅
> - The invoke_agent span right at the very top of the trace
> - None: a span opened inside another is its own root
> - Whichever span happens to finish right after it does
>
> *Explanation: A span's parent is the step it happened inside, which is the innermost span still open when it starts. Using the outermost open span instead would flatten every trace to two levels and lose the nesting a trace exists to show.*

> **Q3.** A tool raises KeyError inside an execute_tool span, which is inside the invoke_agent span. Which spans end with status ERROR?
> - Both: the exception passed through each of them ✅
> - Only the tool span, where the exception was first raised
> - Only the invoke_agent span, where the run failed
> - Neither, because the tracer catches the exception
>
> *Explanation: The exception leaves the tool's with block, is recorded and re-raised, then leaves the run's with block and is recorded there too. Both steps failed. The tracer never stops the exception: it only records it on the way past.*

> **Q4.** Why does the tracer re-raise an exception instead of handling it?
> - Recording a run mustn't change what the run does ✅
> - Python requires every context manager to re-raise
> - So the same error is recorded twice in the trace
> - Re-raising is what sets the span's end time
>
> *Explanation: A tracer that swallowed exceptions would turn crashes into silent successes, changing the agent's behaviour just by observing it. Context managers are free to suppress exceptions, so re-raising is a choice, and the end time is set by the finally block whether or not the exception is re-raised.*

> **Q5.** Why does a span that ends normally keep the status UNSET rather than OK?
> - In OpenTelemetry, UNSET already means no error ✅
> - OK is only allowed on the root span of a whole trace
> - A span can't know its own status until the trace ends
> - OK is filled in later by whichever tool exports the trace
>
> *Explanation: OpenTelemetry's default status, UNSET, means the step completed without an error being recorded. OK is reserved for application code that deliberately marks a success, and tracing code like this shouldn't set it.*
