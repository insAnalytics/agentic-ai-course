import { REACT_FAKE_CLIENT } from "./fakeClient";
import { CHECKED_AGENT } from "./reliabilityData";

/**
 * Module 7 (Evaluation) shared setup. Demos that read the pilot's recorded
 * runs pass `dataFiles={pilotData("4b-think")}` (fetched on first Run, see
 * courseData.ts) and start their setup code with LOAD_PILOT. Each run file is
 * 250-600 KB, so a demo lists only the runs it reads.
 */
export function pilotData(...setups: string[]): string[] {
  return ["eval/pilot/tasks.json", ...setups.map((setup) => `eval/pilot/${setup}.json`)];
}

/**
 * Introduced in Module 7 Lesson 1 concept 1; shown there verbatim (keep the
 * two byte-identical: scripts/check-copies.mjs checks it on every build).
 */
export const LOAD_PILOT = String.raw`import json
from pathlib import Path

PILOT = Path("/data/eval/pilot")


def load_pilot(setup: str) -> dict:
    """One pilot run file: "4b-think" (the agent this module evaluates), "4b-nothink" or "9b-think"."""
    return json.loads((PILOT / f"{setup}.json").read_text(encoding="utf-8"))


def load_tasks() -> dict[str, dict]:
    """The pilot's ten tasks by id: the request, and what each run was checked for."""
    return {task["id"]: task for task in json.loads((PILOT / "tasks.json").read_text(encoding="utf-8"))["tasks"]}
`;

/**
 * Module 7 Lesson 2's shared setup: every demo in the tracing lesson starts
 * from the pilot loader, the fake client and Module 6's checked loop
 * (run_checked_agent, Checks).
 */
export const TRACING_SETUP = LOAD_PILOT + "\n\n" + REACT_FAKE_CLIENT + CHECKED_AGENT;

/**
 * Module 7 Lesson 2 concept 1's Span and Tracer: the exercise's reference
 * solution, which the page shows as the correct answer (this same constant,
 * so the two can't drift). Demos after the exercise append it to
 * TRACING_SETUP, and later concepts build on it.
 */
export const TRACER = String.raw`import secrets
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
`;

/**
 * Module 7 Lesson 2 concept 2's trace_from_recording: a pilot trial rebuilt as
 * spans with OpenTelemetry's GenAI names. The first demo there shows it
 * (keep the two byte-identical: scripts/check-copies.mjs checks it); demos
 * after it, and later concepts, append it after TRACING_SETUP + TRACER.
 */
export const TRACE_FROM_RECORDING = String.raw`def trace_from_recording(run: dict, trial: dict, capture_content: bool = False) -> list[Span]:
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
`;
