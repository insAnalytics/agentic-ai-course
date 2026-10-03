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
 * Module 7's faithfulness judge in compact form, for Lessons 6 and 7 (written by
 * scripts/eval/faithfulness_measure.py), mounted at /data/eval/faithfulness.
 */
export const FAITHFULNESS_DATA = ["eval/faithfulness/measure.json"];

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

/**
 * Module 7 Lesson 8 concept 2's first demo, up to its printing: Module 6's
 * three confidence signals as (score, correct) rows in `signals`, shown
 * there (its demo is this plus the print loop) and loaded hidden by the
 * demos after it. The vote and verdict code is Module 6's signals demo's.
 */
export const CALIBRATION_SIGNALS = String.raw`from collections import Counter


def auroc(rows: list[tuple[float, bool]]) -> float:
    right = [score for score, correct in rows if correct]
    wrong = [score for score, correct in rows if not correct]
    return sum((r > w) + 0.5 * (r == w) for r in right for w in wrong) / (len(right) * len(wrong))


def answer_key(question: dict, answer: str | None):
    if answer is None:
        return None
    return as_number(answer) if question["type"] == "number" else normalize(answer) or None


questions = {q["id"]: q for q in load_set("set-e")["questions"]}
signals = {}
pairs = [(answer_probability(s), s["correct"]) for r in load_run("plain.smaller")["results"] for s in r["samples"]]
signals["answer-line probability, 2B"] = [(p, c) for p, c in pairs if p is not None]
# Module 6's vote: each question's 20 samples as four votes of 5; confidence is the winner's share of the vote
agreement = []
for record in load_run("plain.smaller")["results"]:
    question = questions[record["id"]]
    for start in range(0, 20, 5):
        votes = record["samples"][start:start + 5]
        keys = [answer_key(question, s["answer"]) for s in votes]
        counts = Counter(key for key in keys if key is not None)
        if not counts:
            agreement.append((0.0, False))
            continue
        winner, n = counts.most_common(1)[0]
        agreement.append((n / 5, next(s["correct"] for s, key in zip(votes, keys) if key == winner)))
signals["agreement in a vote of 5, 2B"] = agreement
WANTED = {"supported": "SUPPORTED", "not_supported": "NOT SUPPORTED", "contradict": "CONTRADICT", "consistent": "CONSISTENT"}
built = load_set("set-v")
verdicts = []
for run_name, key in (("support.small", "support_pairs"), ("statements.small", "statement_pairs"),
                      ("statements.large", "statement_pairs")):
    labels = {p["id"]: p["label"] for p in built[key]}
    verdicts += [(verdict_probability(r["logprobs"]), r["verdict"] == WANTED[labels[r["id"]]])
                 for r in load_run(run_name)["results"]]
signals["verdict probability, judges"] = [(p, c) for p, c in verdicts if p is not None]
`;

/**
 * Module 7 Lesson 8 concept 3's scale, log_loss and fit_temperature: the
 * exercise's reference, shown there as the correct answer by using this
 * constant (with the starter's example after it), and loaded hidden by the
 * demo after it.
 */
export const TEMPERATURE_SCALING = String.raw`import math


def scale(p: float, temperature: float) -> float:
    """A confidence with its log-odds divided by the temperature: above 1 pulls it towards 0.5, below 1 pushes it out."""
    p = min(max(p, 1e-6), 1 - 1e-6)
    return 1 / (1 + math.exp(-math.log(p / (1 - p)) / temperature))


def log_loss(rows: list[tuple[float, bool]]) -> float:
    """How surprised the confidences were by what happened: the mean of -log(probability given to the outcome)."""
    return -sum(math.log(p if correct else 1 - p) for p, correct in ((min(max(p, 1e-6), 1 - 1e-6), c) for p, c in rows)) / len(rows)


def fit_temperature(rows: list[tuple[float, bool]], grid: list[float]) -> float:
    """The temperature from the grid whose scaled confidences have the lowest log loss on these rows."""
    return min(grid, key=lambda t: log_loss([(scale(p, t), correct) for p, correct in rows]))
`;

/**
 * Module 7 Lesson 9 concept 1's pass_rate and paired_difference: the
 * exercise's reference, shown there as the correct answer by using this
 * constant (with the starter's example after it), and loaded hidden by the
 * demo after it.
 */
export const PAIRED_DIFFERENCE = String.raw`import random


def pass_rate(results: list[bool]) -> float:
    return sum(results) / len(results)


def paired_difference(a: dict[str, list[bool]], b: dict[str, list[bool]], repeats: int = 2000,
                      seed: int = 0) -> tuple[float, float, float]:
    """B minus A: the mean over tasks of each task's pass-rate difference, with a 95% interval from resampling
    tasks. Only tasks both conditions ran are compared."""
    tasks = sorted(a.keys() & b.keys())
    if not tasks:
        raise ValueError("the two conditions share no tasks")
    differences = [pass_rate(b[t]) - pass_rate(a[t]) for t in tasks]
    rng = random.Random(seed)
    means = sorted(sum(rng.choices(differences, k=len(differences))) / len(differences) for _ in range(repeats))
    return sum(differences) / len(differences), means[int(0.025 * repeats)], means[int(0.975 * repeats) - 1]
`;

/**
 * Module 7 Lesson 9 concept 2's task_pass_hat_k and suite_pass_hat_k: the
 * exercise's reference, shown there as the correct answer by using this
 * constant (with the starter's example after it), and loaded hidden by both
 * demos after it.
 */
export const SUITE_PASS_HAT_K = String.raw`import random
from math import comb


def task_pass_hat_k(successes: int, runs: int, k: int) -> float:
    """Module 6's estimate of one task's pass^k: the chance that k trials drawn from its runs all pass."""
    return comb(successes, k) / comb(runs, k)


def suite_pass_hat_k(per_task: dict[str, list[bool]], k: int, repeats: int = 2000,
                     seed: int = 0) -> tuple[float, float, float]:
    """pass^k averaged over tasks, with a 95% interval from resampling tasks (sorted, one seeded generator).
    Every task needs at least k trials."""
    if any(k > len(results) for results in per_task.values()):
        raise ValueError(f"pass^{k} needs at least {k} trials of every task")
    values = [task_pass_hat_k(sum(per_task[t]), len(per_task[t]), k) for t in sorted(per_task)]
    rng = random.Random(seed)
    means = sorted(sum(rng.choices(values, k=len(values))) / len(values) for _ in range(repeats))
    return sum(values) / len(values), means[int(0.025 * repeats)], means[int(0.975 * repeats) - 1]
`;

/** Module 7 Lesson 9's ablation results (written by scripts/eval/ablation_results.py), mounted at /data/eval/ablations. */
export const ABLATIONS_DATA = ["eval/ablations/results.json"];

/**
 * Module 7 Lesson 9's shared setup from concept 3 on, introduced there and
 * shown verbatim (keep the two byte-identical: scripts/check-copies.mjs
 * checks it). Concepts 3 to 5 start every demo from it.
 */
export const LOAD_ABLATIONS = String.raw`import json
from pathlib import Path

ABLATIONS = Path("/data/eval/ablations")
results = json.loads((ABLATIONS / "results.json").read_text(encoding="utf-8"))


def passes(condition: str, group: str | None = None, split: str | None = None) -> dict[str, list[bool]]:
    """Each task's trial results under one condition, optionally only the tasks in one group, or in one split."""
    return {task: [row["pass"] for row in rows] for task, rows in results["conditions"][condition].items()
            if (group is None or results["tasks"][task]["group"] == group)
            and (split is None or results["tasks"][task]["split"] == split)}
`;

/** Module 7 Lesson 10's recorded settings of every main run (written by scripts/eval/run_settings.py), mounted at /data/eval/main. */
export const SETTINGS_DATA = ["eval/main/settings.json"];

/**
 * Module 7 Lesson 10's shared setup, introduced in concept 1 and shown
 * verbatim (keep the two byte-identical: scripts/check-copies.mjs checks
 * it). The lesson's demos start from it.
 */
export const LOAD_SETTINGS = String.raw`import json
from pathlib import Path

settings = json.loads(Path("/data/eval/main/settings.json").read_text(encoding="utf-8"))["runs"]
`;

/** Module 7 Lesson 10 concept 1's exercise reference, also loaded (unshown) for the demo after it. */
export const WHAT_CHANGED = String.raw`def what_changed(a: dict, b: dict, ignore: tuple = (), prefix: str = "") -> dict:
    """Every setting that differs between two runs' recorded settings, as {dotted.key: (a's value, b's value)}.
    Nested settings are compared key by key; a key one side lacks counts as None there. Keys in ${"`"}ignore${"`"} (dotted)
    are skipped."""
    changes = {}
    for key in sorted(a.keys() | b.keys()):
        name = f"{prefix}{key}"
        if name in ignore:
            continue
        left, right = a.get(key), b.get(key)
        if isinstance(left, dict) and isinstance(right, dict):
            changes.update(what_changed(left, right, ignore, f"{name}."))
        elif left != right:
            changes[name] = (left, right)
    return changes
`;

/** Module 7 Lesson 10 concept 2's exercise reference (needs PAIRED_DIFFERENCE), also loaded (unshown) for the demo after it. */
export const GATE = String.raw`def gate(known_good: dict, new: dict, tolerance: float = 0.02, task_drop: float = 0.8) -> dict:
    """Pass or fail a new run against the last known-good one. The suite regresses if its paired difference is
    clearly below zero (the whole interval under 0) and by more than ${"`"}tolerance${"`"}; a task is flagged if its pass rate
    fell by ${"`"}task_drop${"`"} or more. The run passes only if neither happens."""
    mean, low, high = paired_difference(known_good, new)
    shared = sorted(known_good.keys() & new.keys())
    flagged = [t for t in shared if pass_rate(known_good[t]) - pass_rate(new[t]) >= task_drop]
    suite_regressed = high < 0 and mean <= -tolerance
    return {"passed": not suite_regressed and not flagged, "difference": (mean, low, high),
            "suite_regressed": suite_regressed, "flagged": flagged}
`;

/**
 * Module 7 Lesson 10 concept 5's setup, shown verbatim on that page (keep
 * the two byte-identical: scripts/check-copies.mjs checks it). Mount
 * SETTINGS_DATA and ABLATIONS_DATA with it.
 */
export const LOAD_COSTS = String.raw`import json
from pathlib import Path

recorded = json.loads(Path("/data/eval/main/settings.json").read_text(encoding="utf-8"))
results = json.loads(Path("/data/eval/ablations/results.json").read_text(encoding="utf-8"))
`;

/** Module 7 Lesson 10 concept 3's one-sided Fisher test, shown in its first demo and loaded (unshown) for its second. */
export const FISHER_DROP = String.raw`from math import comb


def fisher_drop(before: list[bool], after: list[bool]) -> float:
    """One-sided Fisher exact test: the chance of ${"`"}after${"`"} having this few passes or fewer, if both runs had the same
    underlying pass rate, given how many passes there were in total."""
    a, b = sum(before), sum(after)
    total, n1, n2 = a + b, len(before), len(after)
    return sum(comb(n2, k) * comb(n1, total - k) for k in range(max(0, total - n1), b + 1)) / comb(n1 + n2, total)
`;

/** Module 7 Lesson 10 concept 3's exercise reference, also loaded (unshown) for the demo after it. */
export const BENJAMINI_HOCHBERG = String.raw`def benjamini_hochberg(p_values: dict[str, float], q: float = 0.05) -> list[str]:
    """The tests to flag while keeping the expected share of false flags at or below q: sort the p-values, find the
    largest rank k with p(k) <= k / m * q, and flag the k smallest. Returned sorted by name."""
    ranked = sorted(p_values.items(), key=lambda item: (item[1], item[0]))
    m = len(ranked)
    cutoff = max((k for k, (_, p) in enumerate(ranked, start=1) if p <= k / m * q), default=0)
    return sorted(name for name, _ in ranked[:cutoff])
`;

/**
 * Module 7 Lesson 11's simulated traffic (written by scripts/eval/monitoring_traffic.py), mounted at
 * /data/eval/monitoring: only the named conditions' files, since each is a few MB.
 */
export function trafficData(...conditions: string[]): string[] {
  return conditions.map((condition) => `eval/monitoring/traffic-${condition}.json`);
}

/**
 * Module 7 Lesson 11's setup block, shown verbatim on concept 1 (keep the two byte-identical:
 * scripts/check-copies.mjs checks it). LOAD_TRAFFIC is it with Lesson 2's Span and summarize, the setup of
 * every demo and exercise in the lesson.
 */
export const TRAFFIC_SETUP = String.raw`import json
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
`;

export const LOAD_TRAFFIC = TRACER + "\n\n" + SUMMARIZE + "\n\n" + TRAFFIC_SETUP;

/** Module 7 Lesson 11 concept 1's exercise reference, without its example printout; needs LOAD_TRAFFIC. */
export const DASHBOARD = String.raw`from statistics import mean


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
`;

/**
 * Module 7 Lesson 11 concept 2's setup block, shown verbatim on that page (keep the two byte-identical:
 * scripts/check-copies.mjs checks it). Its demos run on LOAD_TRAFFIC + DASHBOARD + this, with
 * trafficData("baseline-a", "baseline-b", "compaction-a").
 */
export const DEPLOY_STREAM = String.raw`import random


def run_facts(spans: list[Span]) -> tuple[bool, int]:
    """What this concept watches in one run: whether it ended without an answer, and its tokens."""
    facts = summarize(spans)
    chats = [span for span in spans if span.attributes.get("gen_ai.operation.name") == "chat"]
    return bool(chats[-1].attributes.get("registry_agent.tool_calls")), facts["input_tokens"] + facts["output_tokens"]


before = [run_facts(spans) for spans in load_traffic("baseline-a") + load_traffic("baseline-b")]
after = [run_facts(spans) for spans in load_traffic("compaction-a")]
deploy = len(before)


def stream(seed: int) -> list[tuple[bool, int]]:
    """The baseline's 770 runs in a random order, then, once the change ships, the compacting agent's 385."""
    rng = random.Random(seed)
    return rng.sample(before, len(before)) + rng.sample(after, len(after))
`;

/** Module 7 Lesson 11 concept 3's judged question runs (written by scripts/eval/monitoring_traffic.py), mounted at /data/eval/monitoring. */
export const RELEVANCE_DATA = ["eval/monitoring/relevance-judged.json"];

/**
 * Module 7 Lesson 11 concept 3's setup block, shown verbatim on that page (keep the two byte-identical:
 * scripts/check-copies.mjs checks it). Its demos and exercise run on LOAD_TRAFFIC + this, with RELEVANCE_DATA.
 */
export const JUDGED_SAMPLE = String.raw`from math import sqrt

judged = json.loads((MONITORING / "relevance-judged.json").read_text(encoding="utf-8"))["runs"]


def wilson(failures: float, n: int, z: float = 1.96) -> tuple[float, float]:
    """The Wilson score interval for a failure rate seen as ${"`"}failures${"`"} out of ${"`"}n${"`"}. Unlike the rate plus or minus
    z standard errors, it stays between 0 and 1, and it still gives an upper bound when nothing failed."""
    p = failures / n
    centre = (p + z * z / (2 * n)) / (1 + z * z / n)
    half = z / (1 + z * z / n) * sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return max(0.0, centre - half), min(1.0, centre + half)
`;

/** Module 7 Lesson 11 concept 3's exercise reference, without its example printout; needs JUDGED_SAMPLE's wilson. */
export const RUNS_TO_JUDGE = String.raw`def runs_to_judge(expected_rate: float, half_width: float, z: float = 1.96) -> int:
    """The fewest judged runs whose Wilson interval, at the expected failure rate, is no wider than half_width on
    either side of its middle. half_width must be positive."""
    n = 1
    while True:
        low, high = wilson(expected_rate * n, n, z)
        if (high - low) / 2 <= half_width:
            return n
        n += 1
`;

/** Module 7 Lesson 11 concept 4's request mix (written by scripts/eval/monitoring_traffic.py), mounted at /data/eval/monitoring. */
export const QUESTION_DATA = ["eval/monitoring/question-mix.json"];

/**
 * Module 7 Lesson 11 concept 4's setup block, shown verbatim on that page (keep the two byte-identical:
 * scripts/check-copies.mjs checks it). Its exercise and demos run on LOAD_TRAFFIC + this, with QUESTION_DATA.
 */
export const QUESTION_MIX = String.raw`import random
from collections import Counter, defaultdict

mix_runs = json.loads((MONITORING / "question-mix.json").read_text(encoding="utf-8"))["runs"]
by_category = defaultdict(list)
for run in mix_runs:
    by_category[run["category"]].append(run)
# the baseline's own mix of requests, as shares
reference_mix = {name: len(runs) / len(mix_runs) for name, runs in sorted(by_category.items())}


def arrivals(mix: dict[str, float], n: int, rng: random.Random) -> list[dict]:
    """n simulated requests: each one's category drawn from ${"`"}mix${"`"}, then one recorded run of that category."""
    names = list(mix)
    picked = rng.choices(names, weights=[mix[name] for name in names], k=n)
    return [rng.choice(by_category[name]) for name in picked]
`;

/** Module 7 Lesson 11 concept 4's exercise reference, without its example printout. */
export const PSI = String.raw`from math import log


def psi(reference: dict[str, int], current: dict[str, int], floor: float = 0.0001) -> float:
    """The population stability index between two counts of categories. Each count becomes a share of its own total;
    a category missing from either side gets the share ${"`"}floor${"`"}, so the logarithm stays finite."""
    expected_total, actual_total = sum(reference.values()), sum(current.values())
    index = 0.0
    for name in reference.keys() | current.keys():
        expected = reference.get(name, 0) / expected_total or floor
        actual = current.get(name, 0) / actual_total or floor
        index += (actual - expected) * log(actual / expected)
    return index
`;

/**
 * Module 7 Lesson 11 concept 6's setup block, shown verbatim on that page (keep the two byte-identical:
 * scripts/check-copies.mjs checks it). Its demos run on LOAD_TRAFFIC + this, with
 * trafficData("baseline-a", "baseline-b", "compaction-a") and QUESTION_DATA.
 */
export const CANARY = String.raw`import random
from math import sqrt


def ended_without_answer(spans: list[Span]) -> bool:
    chats = [span for span in spans if span.attributes.get("gen_ai.operation.name") == "chat"]
    return bool(chats[-1].attributes.get("registry_agent.tool_calls"))


live = [ended_without_answer(spans) for spans in load_traffic("baseline-a") + load_traffic("baseline-b")]
candidate = [ended_without_answer(spans) for spans in load_traffic("compaction-a")]


def worse(canary: list[bool], control: list[bool], z: float = 1.645) -> bool:
    """A one-sided two-proportion z-test: does the canary fail clearly more often than the control?"""
    pooled = (sum(canary) + sum(control)) / (len(canary) + len(control))
    spread = sqrt(pooled * (1 - pooled) * (1 / len(canary) + 1 / len(control)))
    return spread > 0 and (sum(canary) / len(canary) - sum(control) / len(control)) / spread > z
`;

/**
 * Module 7 Lesson 11 concept 7's setup block, shown verbatim on that page (keep the two byte-identical:
 * scripts/check-copies.mjs checks it). Its demos and exercise run on LOAD_TRAFFIC + this, with QUESTION_DATA.
 */
export const AB_USERS = String.raw`import random
from collections import defaultdict
from math import ceil, sqrt

mix_runs = json.loads((MONITORING / "question-mix.json").read_text(encoding="utf-8"))["runs"]
# a stand-in for users: each development task is one "user" who sends the same request ten times
user_runs = defaultdict(list)
for run in mix_runs:
    user_runs[run["trial_id"].split("/")[1]].append(run["passed"])
users = list(user_runs.values())
`;

/** Module 7 Lesson 11 concept 7's exercise reference, without its example printout; needs AB_USERS's ceil. */
export const USERS_PER_ARM = String.raw`def users_per_arm(p_control: float, p_treatment: float, runs_per_user: int = 1, icc: float = 0.0,
                  z_alpha: float = 1.96, z_power: float = 0.8416) -> int:
    """Users needed in each arm to detect a change in a pass rate from p_control to p_treatment, at a two-sided 5%
    level with 80% power by default. Runs from one user are correlated by ${"`"}icc${"`"}, which inflates the runs needed by
    the design effect 1 + (runs_per_user - 1) * icc."""
    if p_control == p_treatment:
        raise ValueError("the two pass rates must differ: no sample size detects a change of zero")
    variance = p_control * (1 - p_control) + p_treatment * (1 - p_treatment)
    runs = (z_alpha + z_power) ** 2 * variance / (p_control - p_treatment) ** 2
    design_effect = 1 + (runs_per_user - 1) * icc
    return ceil(runs * design_effect / runs_per_user)
`;

/** Module 7 Lesson 12 concept 2's exercise reference, without its example printout. */
export const HEADLINE = String.raw`from math import sqrt


def headline(per_task: dict[str, list[bool]], z: float = 1.96, min_tasks: int = 10) -> dict:
    """A pass rate the way a report should give it: the mean over tasks of each task's pass rate, its standard error
    clustered by task, and the interval that gives, kept between 0 and 1. With fewer than min_tasks tasks the
    interval is None: too few tasks for the normal approximation. The naive standard error, treating every trial
    as independent, comes alongside for comparison."""
    rates = [sum(results) / len(results) for results in per_task.values()]
    tasks, trials = len(rates), sum(map(len, per_task.values()))
    rate = sum(rates) / tasks
    se = sqrt(sum((r - rate) ** 2 for r in rates) / (tasks - 1) / tasks) if tasks > 1 else None
    interval = None
    if tasks >= min_tasks:
        interval = (max(0.0, rate - z * se), min(1.0, rate + z * se))
    pooled = sum(map(sum, per_task.values())) / trials
    return {"tasks": tasks, "trials": trials, "rate": rate, "se": se, "interval": interval,
            "naive_se": sqrt(pooled * (1 - pooled) / trials)}
`;

/** Module 7 Lesson 12 concept 4's grader breakdown (written by scripts/eval/report_grades.py), mounted at /data/eval/report. */
export const REPORT_DATA = ["eval/report/baseline-grades.json"];

/**
 * Module 7 Lesson 12 concept 4's setup block, shown verbatim on that page (keep the two byte-identical:
 * scripts/check-copies.mjs checks it). Its demos run on LOAD_SETTINGS + LOAD_ABLATIONS + this, with REPORT_DATA and
 * judgeLabelsData("measure").
 */
export const REPORT_GRADES = String.raw`REPORT = Path("/data/eval/report")
grades = json.loads((REPORT / "baseline-grades.json").read_text(encoding="utf-8"))["trials"]
measured = json.loads(Path("/data/eval/judge-labels/measure.json").read_text(encoding="utf-8"))
`;
