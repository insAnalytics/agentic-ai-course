import json

from m6loop import Checks

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


POINTS = ("before_model", "before_tool", "after_tool", "before_answer")
# what Module 6's loop does when a check at each point gives a reason
ACTIONS = {"before_model": "stopped the run", "before_tool": "returned to the model as an error",
           "after_tool": "returned to the model as an error", "before_answer": "withheld the answer"}


def traced_checks(checks: Checks, tracer: Tracer) -> Checks:
    """The same checks, each call recorded as a span: where it ran, on what, and what it decided."""
    def wrap(point, check):
        def run(*args):
            attributes = {"registry_agent.check.point": point}
            if point in ("before_tool", "after_tool"):
                call = args[0]
                attributes |= {"gen_ai.tool.name": call.name, "gen_ai.tool.call.id": call.id}
            with tracer.span(f"check {point}", attributes) as span:
                reason = check(*args)
                span.attributes["registry_agent.check.verdict"] = "blocked" if reason else "passed"
                if reason:
                    span.attributes["registry_agent.check.reason"] = reason
                    span.attributes["registry_agent.check.action"] = ACTIONS[point]
                return reason
        return run
    return Checks(**{point: wrap(point, getattr(checks, point)) for point in POINTS})


import dataclasses
import hashlib


class TracedChat:
    """A client for Module 6's loop, with each model call as a chat span named and described by the conventions."""

    def __init__(self, client, tracer: Tracer, model: str, provider: str):
        self.client, self.tracer, self.model, self.provider = client, tracer, model, provider

    def create(self, messages: list):
        attributes = {"gen_ai.operation.name": "chat", "gen_ai.provider.name": self.provider,
                      "gen_ai.request.model": self.model}
        with self.tracer.span(f"chat {self.model}", attributes) as span:
            response = self.client.create(messages=messages)
            # a real client reports these; the course's scripted client doesn't, so they're added only when present
            if usage := getattr(response, "usage", None):
                span.attributes["gen_ai.usage.input_tokens"] = usage["input_tokens"]
                span.attributes["gen_ai.usage.output_tokens"] = usage["output_tokens"]
            if answered := getattr(response, "model", None):
                span.attributes["gen_ai.response.model"] = answered
            span.attributes["registry_agent.tool_calls"] = [b.name for b in response.content if b.type == "tool_use"]
            return response


def instrument(client, tools: dict, checks: Checks, tracer: Tracer, model: str, provider: str):
    """The agent's client, tools and checks, each recording spans; Module 6's loop runs them unchanged."""
    # before_tool always runs just before its tool, so it can tell the tool's span which call it belongs to
    current = {}

    def remember(check):
        def run(call, messages):
            current["call"] = call
            return check(call, messages)
        return run

    def wrap_tool(name, function):
        def call(**arguments):
            attributes = {"gen_ai.operation.name": "execute_tool", "gen_ai.tool.name": name,
                          "gen_ai.tool.call.id": current["call"].id, "gen_ai.tool.type": "function"}
            with tracer.span(f"execute_tool {name}", attributes) as span:
                output = function(**arguments)
                if str(output).startswith("Error:"):
                    span.status = "ERROR"
                    span.attributes["error.type"] = "tool_error"
                return output
        return call

    traced = traced_checks(dataclasses.replace(checks, before_tool=remember(checks.before_tool)), tracer)
    return (TracedChat(client, tracer, model, provider),
            {name: wrap_tool(name, function) for name, function in tools.items()}, traced)


def config_hash(system: str, tools: list) -> str:
    """Module 6's record_run hash of the prompt and tool definitions."""
    config = json.dumps({"system": system, "tools": tools}, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(config.encode("utf-8")).hexdigest()[:12]
