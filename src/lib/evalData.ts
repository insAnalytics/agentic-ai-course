import { REACT_FAKE_CLIENT } from "./fakeClient";
import { CHECKED_AGENT, LOAD_UNSURE, reliabilityData, verificationData } from "./reliabilityData";

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

/**
 * Module 7 Lesson 2 concept 3's traced_checks (with POINTS and ACTIONS): the
 * exercise's reference, shown there as the correct answer by using this
 * constant, so the two can't drift.
 */
export const TRACED_CHECKS = String.raw`POINTS = ("before_model", "before_tool", "after_tool", "before_answer")
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
`;

/**
 * Module 7 Lesson 2 concept 3's TracedChat, instrument and config_hash: the
 * second demo there, up to its run (keep the two byte-identical:
 * scripts/check-copies.mjs checks it).
 */
export const INSTRUMENT_WRAPPERS = String.raw`import dataclasses
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
`;

/**
 * The instrumentation the module's main runs use: traced_checks plus the
 * wrappers. Needs TRACER, CHECKED_AGENT's Checks, and json in scope. The
 * main runs' scripts/eval/tracing.py holds the same code (checked by
 * scripts/check-copies.mjs).
 */
export const INSTRUMENT = TRACED_CHECKS + "\n\n" + INSTRUMENT_WRAPPERS;

/**
 * Module 7 Lesson 2 concept 4's summarize: the exercise's reference, shown
 * there as the correct answer by using this constant. Demos after it append
 * it after LOAD_PILOT + TRACER + TRACE_FROM_RECORDING.
 */
export const SUMMARIZE = String.raw`from collections import Counter


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
`;

/**
 * The pilot's own Python modules, served unchanged as course data under
 * public/data/eval/code/ (copies of scripts/eval/{eval_client,registry_world,harness}.py
 * and scripts/eval/course/{tokens,fake,m4,m5,m6loop}.py; scripts/check-copies.mjs
 * checks each copy is byte-identical). Module 7 Lesson 2 concept 5 replays
 * recorded runs with them.
 */
export const PILOT_CODE = ["tokens", "fake", "m4", "m5", "m6loop", "eval_client", "registry_world", "harness"];

/**
 * A replay demo's dataFiles: the pilot's tasks and the named runs, the two
 * Module 5 files the registry world reads, and the pilot's modules.
 */
export function replayData(...setups: string[]): string[] {
  return [...pilotData(...setups), "rag/documents.json", "rag/chunk-contexts.json",
          ...PILOT_CODE.map((name) => `eval/code/${name}.py`)];
}

/**
 * Module 7 Lesson 2 concept 5's hidden setup for replaying pilot runs:
 * LOAD_PILOT, then the pilot's modules imported from /data/eval/code (the
 * explicit package imports make Pyodide load numpy, networkx, pydantic,
 * jinja2 and sqlite3 first).
 */
export const REPLAY_SETUP = LOAD_PILOT + "\n\n" + String.raw`# the pilot's own code, served with the course data and imported unchanged
import sys

# packages the pilot's modules import, loaded into Pyodide here
import jinja2
import networkx
import numpy
import pydantic
import sqlite3

if "/data/eval/code" not in sys.path:
    sys.path.insert(0, "/data/eval/code")

from eval_client import ReplayClient, ReplayDiverged, ReplayUser
from harness import Task, run_trial
from registry_world import RegistryWorld
from tokens import _plain
`;

/**
 * Module 7 Lesson 3's reading files under public/data/eval/reading/: the
 * sample, each reader's labels and the categories (all small). traces.json
 * (2 MB) is listed only by the demos that read it.
 */
export function readingData(...names: string[]): string[] {
  return names.map((name) => `eval/reading/${name}.json`);
}

/**
 * Module 7 Lesson 3's shared setup, introduced in concept 1 and shown there
 * verbatim (keep the two byte-identical: scripts/check-copies.mjs checks it).
 * Every demo in the lesson starts from it.
 */
export const LOAD_READING = String.raw`import json
from pathlib import Path

READING = Path("/data/eval/reading")


def load_reading(name: str) -> dict:
    """One of the reading files: "sample", "labels-simar", "labels-simar-v2", "labels-claude", "categories"."""
    return json.loads((READING / f"{name}.json").read_text(encoding="utf-8"))
`;

/**
 * Module 7 Lesson 3 concept 4's tally: the exercise's reference, shown there
 * as the correct answer by using this constant (with the starter's example
 * call after it). Demos after the exercise append it to LOAD_READING.
 */
export const TALLY = String.raw`from collections import defaultdict


def tally(assignments: dict[str, str], read: list[str]) -> list[dict]:
    """Count each failure category by runs and by tasks, and its share of everything read.

    assignments: trial id -> category, for every trace that failed.
    read: every trial id that was read, failed or not.
    Returns one dict per category: {"category", "runs", "tasks", "share"}, most runs first, then most tasks,
    then by name. A trial id looks like "baseline-a/a14/3": the task is the middle part.
    """
    unread = set(assignments) - set(read)
    if unread:
        raise ValueError(f"categories given for traces that weren't read: {sorted(unread)}")
    runs, tasks = defaultdict(int), defaultdict(set)
    for trial_id, category in assignments.items():
        runs[category] += 1
        tasks[category].add(trial_id.split("/")[1])
    rows = [{"category": category, "runs": runs[category], "tasks": len(tasks[category]),
             "share": round(runs[category] / len(read), 3)} for category in runs]
    return sorted(rows, key=lambda row: (-row["runs"], -row["tasks"], row["category"]))
`;

/**
 * Module 7 Lesson 4's suite file under public/data/eval/suite/: each phase 2a
 * suite task, its code-check result on every trial, and whether its reference
 * run passes (written by scripts/eval/suite_grades.py).
 */
export function suiteData(...names: string[]): string[] {
  return names.map((name) => `eval/suite/${name}.json`);
}

/**
 * Module 7 Lesson 4's shared setup, introduced in concept 1 and shown there
 * verbatim (keep the two byte-identical: scripts/check-copies.mjs checks it).
 * Every demo in the lesson starts from it.
 */
export const LOAD_SUITE = String.raw`import json
from pathlib import Path

SUITE = Path("/data/eval/suite")


def load_suite(name: str = "grades-2a") -> dict:
    """The phase 2a suite: its tasks, each trial's code-check result, and whether each reference run passes."""
    return json.loads((SUITE / f"{name}.json").read_text(encoding="utf-8"))
`;

/**
 * Module 7 Lesson 4 concept 1's triage: the exercise's reference, shown there
 * as the correct answer by using this constant (with the starter's example
 * call after it). The demo after the exercise appends it to LOAD_SUITE.
 */
export const TRIAGE = String.raw`def triage(tasks: list[dict], trials: dict[str, list[bool]], reference_passes: dict[str, bool]) -> dict[str, str]:
    """What each task needs before its results can be trusted. The first of these that applies wins:

    "no criteria"    its expect has no checks, no notes and no reference answer, so nothing says what success is
    "broken"         its reference run fails its own checks, so even a correct run can't pass
    "not run"        it has no trials
    "read the runs"  no trial passed: more often a broken task than a hard one, until someone reads them
    "always passes"  every trial passed
    "mixed"          some trials passed and some didn't
    """
    labels = {}
    for task in tasks:
        expect, results = task["expect"], trials.get(task["id"], [])
        if not (expect.get("checks") or expect.get("notes") or expect.get("answer")):
            labels[task["id"]] = "no criteria"
        elif not reference_passes.get(task["id"], False):
            labels[task["id"]] = "broken"
        elif not results:
            labels[task["id"]] = "not run"
        elif not any(results):
            labels[task["id"]] = "read the runs"
        elif all(results):
            labels[task["id"]] = "always passes"
        else:
            labels[task["id"]] = "mixed"
    return labels
`;

/**
 * Module 7 Lesson 5 concept 1's state_diff: the exercise's reference, shown
 * there as the correct answer by using this constant (with the starter's
 * example call after it). The demo after the exercise appends it to LOAD_SUITE.
 */
export const STATE_DIFF = String.raw`def state_diff(initial: dict, final: dict, changes: dict) -> list[str]:
    """Every way the final registry differs from the initial one with the expected changes applied, sorted.

    initial and final map agent id -> {field: value}; changes maps agent id -> the fields that should have changed.
    Each difference is one line: "agent: missing", "agent: not expected", or
    "agent.field: expected 'x', got 'y'" (a field that's absent shows as None).
    """
    unknown = changes.keys() - initial.keys()
    if unknown:
        raise ValueError(f"changes name agents that aren't in the initial registry: {sorted(unknown)}")
    expected = {agent: {**fields, **changes.get(agent, {})} for agent, fields in initial.items()}
    problems = []
    for agent in sorted(expected.keys() | final.keys()):
        if agent not in final:
            problems.append(f"{agent}: missing")
        elif agent not in expected:
            problems.append(f"{agent}: not expected")
        else:
            for field in sorted(expected[agent].keys() | final[agent].keys()):
                want, got = expected[agent].get(field), final[agent].get(field)
                if want != got:
                    problems.append(f"{agent}.{field}: expected {want!r}, got {got!r}")
    return problems
`;

/**
 * Module 7 Lesson 5 concept 2's normalize and contains: the exercise's
 * reference (the same matcher as grading.py's contains, version 2), shown
 * there as the correct answer by using this constant (with the starter's
 * example call after it). The demo after the exercise loads it as hidden setup.
 */
export const CONTAINS = String.raw`import re


def normalize(text: str) -> str:
    """Lower case, a straight apostrophe for a curly one, and single spaces."""
    return re.sub(r"\s+", " ", text.lower().replace("\u2019", "'")).strip()


def contains(text: str, phrase: str) -> bool:
    """Whether the text contains the phrase as whole words, after normalizing both."""
    text, phrase = normalize(text), normalize(phrase)
    start = r"(?<!\w)" if re.match(r"\w", phrase[0]) else ""
    if phrase[-1].isdigit():
        # a number may be followed by a unit, but not by more digits or a decimal or thousands part
        end = r"(?![0-9]|[.,][0-9])"
    else:
        end = r"(?!\w)" if re.match(r"\w", phrase[-1]) else ""
    return re.search(start + re.escape(phrase) + end, text) is not None
`;

/**
 * Module 7 Lesson 5 concept 3's SOURCE_ID, cited_ids and
 * unsupported_citations: the exercise's reference (grading.py's cited_ids
 * is the same function), shown there as the correct answer by using this
 * constant (with the starter's example call after it). The demo after the
 * exercise appends it to LOAD_SUITE.
 */
export const CITED_IDS = String.raw`import re

SOURCE_ID = r"[\w./-]+:\d+"


def cited_ids(answer: str) -> set[str]:
    """Every source id the answer cites: inside square brackets, one or more separated by commas, or alone in
    parentheses, which includes the target of a markdown link, "[text](id)"."""
    ids = set()
    for inside in re.findall(r"\[([^\[\]]+)\]", answer):
        for part in inside.split(","):
            if re.fullmatch(SOURCE_ID, part.strip()):
                ids.add(part.strip())
    ids |= set(re.findall(rf"\(({SOURCE_ID})\)", answer))
    return ids


def unsupported_citations(answer: str, retrieved: list[str]) -> list[str]:
    """The ids the answer cites that no tool returned in the run, sorted."""
    return sorted(cited_ids(answer) - set(retrieved))
`;

/**
 * Module 7 Lesson 6's judge file under public/data/eval/judges/: every phase 3
 * judge decision, without the judges' replies, and for each reply-failure item
 * whether the task's code checks passed the same run (written by
 * scripts/eval/judge_digest.py).
 */
export function judgesData(...names: string[]): string[] {
  return names.map((name) => `eval/judges/${name}.json`);
}

/**
 * Module 7 Lesson 6's shared setup, introduced in concept 1 and shown there
 * verbatim (keep the two byte-identical: scripts/check-copies.mjs checks it).
 * Every demo in the lesson starts from it.
 */
export const LOAD_JUDGES = String.raw`import json
from pathlib import Path

JUDGES = Path("/data/eval/judges")


def load_digest() -> dict:
    """Every phase 3 judge decision, by judge: gemma (Gemma 4 31B) and qwen9b (Qwen3.5-9B)."""
    return json.loads((JUDGES / "digest.json").read_text(encoding="utf-8"))["judges"]
`;

/**
 * Module 7 Lesson 7's judge-label files under public/data/eval/judge-labels/:
 * vs-reading.json (written by scripts/eval/judge_vs_reading.py) to start with.
 */
export function judgeLabelsData(...names: string[]): string[] {
  return names.map((name) => `eval/judge-labels/${name}.json`);
}

/**
 * Module 7 Lesson 7's shared setup, introduced in concept 1 and shown there
 * verbatim (keep the two byte-identical: scripts/check-copies.mjs checks it).
 * Every demo in the lesson starts from it.
 */
export const LOAD_JUDGE_LABELS = String.raw`import json
from pathlib import Path

JUDGE_LABELS = Path("/data/eval/judge-labels")


def load_vs_reading() -> list[dict]:
    """The 50 question runs Lesson 3's reading labelled, with the reading's verdict, both judges' correctness
    verdicts, and whether every citation was to a source a tool returned."""
    return json.loads((JUDGE_LABELS / "vs-reading.json").read_text(encoding="utf-8"))["rows"]
`;

/**
 * Module 7 Lesson 7 concept 1's agreement_stats: the exercise's reference,
 * shown there as the correct answer by using this constant (with the
 * starter's example call after it). Demos after the exercise append it to
 * LOAD_JUDGE_LABELS.
 */
export const AGREEMENT_STATS = String.raw`def agreement_stats(pairs: list[tuple[str, str]]) -> dict:
    """How a grader's verdicts compare with a person's. pairs are (person, grader), each "pass" or "fail"; pairs with
    anything else are skipped and counted."""
    usable = [(p, g) for p, g in pairs if p in ("pass", "fail") and g in ("pass", "fail")]
    n = len(usable)
    if not n:
        return {"n": 0, "skipped": len(pairs), "tpr": None, "tnr": None, "accuracy": None, "kappa": None}
    passes = [g for p, g in usable if p == "pass"]
    fails = [g for p, g in usable if p == "fail"]
    agreed = sum(p == g for p, g in usable) / n
    person_pass = len(passes) / n
    grader_pass = sum(g == "pass" for _, g in usable) / n
    by_chance = person_pass * grader_pass + (1 - person_pass) * (1 - grader_pass)
    return {"n": n, "skipped": len(pairs) - n,
            "tpr": passes.count("pass") / len(passes) if passes else None,
            "tnr": fails.count("fail") / len(fails) if fails else None,
            "accuracy": agreed,
            "kappa": (agreed - by_chance) / (1 - by_chance) if by_chance < 1 else None}
`;

/**
 * Module 7 Lesson 8's data: Module 6's set E answer runs for both models
 * (plain.smaller is the 2B, plain the 4B) and its set V judge runs, as
 * Module 6's signals page mounts them, plus the 4B's run.
 */
export const CALIBRATION_DATA = [
  ...reliabilityData("plain.smaller", "plain"),
  ...verificationData("support.small", "statements.small", "statements.large"),
];

/**
 * Module 6 Lesson 6 concept 2's two logprob signals, copied from that page's
 * constants of the same names (scripts/check-copies.mjs keeps them identical).
 */
export const ANSWER_PROBABILITY = String.raw`import math


def answer_probability(sample: dict) -> float | None:
    """The probability the model gave its whole answer line: the product of its tokens' probabilities."""
    steps = sample.get("answer_logprobs")
    return math.exp(sum(step["logprob"] for step in steps)) if steps else None
`;

export const VERDICT_PROBABILITY = String.raw`def verdict_probability(steps: list[dict], marker: str = "VERDICT:") -> float | None:
    """The probability of the first word after the marker: the moment the judge commits to a verdict."""
    text = ""
    for i, step in enumerate(steps):
        text += step["token"]
        if marker in text:
            following = [s for s in steps[i + 1:] if s["token"].strip()]
            return math.exp(following[0]["logprob"]) if following else None
    return None
`;

/**
 * Module 7 Lesson 8's hidden setup: Module 6's SIGNALS_SETUP, rebuilt from
 * the same pieces. Every demo in the lesson starts from it, unshown.
 */
export const CALIBRATION_SETUP = LOAD_UNSURE + "\n" + ANSWER_PROBABILITY + "\n\n" + VERDICT_PROBABILITY;

/**
 * Module 7 Lesson 8 concept 1's calibration_table, ece and brier: the
 * exercise's reference, shown there as the correct answer by using this
 * constant (with the starter's example after it). Demos after the exercise
 * append it to CALIBRATION_SETUP.
 */
export const CALIBRATION = String.raw`def calibration_table(rows: list[tuple[float, bool]], bins: int = 10) -> list[dict]:
    """Group (confidence, correct) pairs into equal-width confidence bins; for each non-empty bin, its range, count,
    mean confidence and accuracy. A confidence of exactly 1.0 goes in the top bin."""
    groups = [[] for _ in range(bins)]
    for confidence, correct in rows:
        groups[min(int(confidence * bins), bins - 1)].append((confidence, correct))
    return [{"low": i / bins, "high": (i + 1) / bins, "count": len(group),
             "confidence": sum(c for c, _ in group) / len(group),
             "accuracy": sum(correct for _, correct in group) / len(group)}
            for i, group in enumerate(groups) if group]


def ece(rows: list[tuple[float, bool]], bins: int = 10) -> float:
    """Expected calibration error: each bin's gap between accuracy and mean confidence, weighted by its share of rows."""
    return sum(b["count"] / len(rows) * abs(b["accuracy"] - b["confidence"]) for b in calibration_table(rows, bins))


def brier(rows: list[tuple[float, bool]]) -> float:
    """The mean squared gap between each confidence and what happened (1 if right, 0 if wrong)."""
    return sum((confidence - correct) ** 2 for confidence, correct in rows) / len(rows)
`;
