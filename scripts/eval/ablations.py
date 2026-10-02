"""
Module 7, Lesson 9's ablations: the same agent, loop and tools, with one piece changed.

- "layers": Module 6's eight layered checks (06-reliability/10-layered-checks/02-layering-the-checks.mdx), ported
  from its scripted scenarios to the live registry world. What changed in the port, and nothing else:
    * the world: the registry is read with world.snapshot(), which logs nothing, so a layer's own reads never
      appear in the agent's tool log; TOOL_LABELS gains query_database, a tool Module 6's agent didn't have
    * "the request": every message the user has sent so far, since conversations have more than one
    * grounding: citation ids such as [D07:1] are removed with dates before numbers are compared, since Module 6's
      citations were [1]-style and this agent's ids contain digits
    * the support judge is a real model, not scripted verdicts: Module 6's support prompt, sent to the simulated
      user's model (Gemma 4 26B-A4B), which a different family from the agent and already on its own server; a claim
      whose cited source no tool returned fails without a judge call
    * every layer's objection at a point is logged, not just the first, so each layer's catches can be counted; the
      first still decides, as in Module 6, and the judge is only called when every code layer at that point passed
- "compaction": once a conversation has more than COMPACT_AFTER rounds, every round but the newest is replaced with a
  summary written by the agent's own model under Module 4's summary instructions (05-compaction-and-summarization),
  placed as Module 4's compact() places it; the summary request is a separate user message after the last round,
  because the chat template allows only tool results in a results message (the same change as Lesson 5's test)
- "no-labels": the date and type attributes are removed from every source search_docs returns; the tool log keeps
  the full output, so graders still see what the documents said
"""

import json
import re

from harness import Checks
from m4 import SUMMARY_INSTRUCTIONS, compact, split_rounds

VARIANTS = ("none", "layers", "compaction", "no-labels")
COMPACT_AFTER = 3
NUMBER = re.compile(r"(?<![\w.])\d+(?:,\d{3})*(?:\.\d+)?%?")
CITATION = re.compile(r"\[[^\]]*?[\w./-]+:\d+[^\]]*\]|\([\w./-]+:\d+\)")
TOOL_LABELS = {"get_agent": {"private"}, "get_health": {"private"}, "query_database": {"private"},
               "search_docs": {"untrusted"}, "set_model": {"changes_state"}, "send_email": {"external"}}
CLAIMS = [(re.compile(r"\bmoved (?P<agent_name>[a-z]+_agent)"), "set_model"),
          (re.compile(r"\bnotified (?P<to>[a-z]+-team)"), "send_email")]
JUDGE_SYSTEM = "You check statements against sources. Judge only from what you're given, not from anything else you know."
SUPPORT_TEMPLATE = (
    "Source:\n{source}\n\nClaim: {claim}\n\n"
    "Does the source, on its own, fully support the claim? If any part of the claim isn't stated in the source, "
    "or the source says something different, it doesn't. Reply with one line and nothing else:\n"
    "VERDICT: SUPPORTED\nor\nVERDICT: NOT SUPPORTED")
SOURCE = re.compile(r'<source id="([^"]+)"[^>]*>(.*?)</source>', re.S)


# --- the support judge, live and replayed ---

class SupportJudge:
    """Module 6's support judge on a real model. Every call is recorded, so a run can be replayed exactly."""

    def __init__(self, backend, seed: int):
        self.backend, self.seed, self.calls = backend, seed, []

    def supported(self, source: str, claim: str) -> bool:
        messages = [{"role": "system", "content": JUDGE_SYSTEM},
                    {"role": "user", "content": SUPPORT_TEMPLATE.format(source=source, claim=claim)}]
        reply = self.backend.chat(messages, {"temperature": 0.0}, self.seed + len(self.calls), 16)
        self.calls.append({"source": source, "claim": claim, "reply": reply["text"]})
        return "NOT SUPPORTED" not in reply["text"].upper()


class ReplaySupportJudge:
    """The recorded verdicts, in order, after checking each request matches the recorded one."""

    def __init__(self, calls: list):
        self.calls, self.n = calls, 0

    def supported(self, source: str, claim: str) -> bool:
        if self.n >= len(self.calls) or (self.calls[self.n]["source"], self.calls[self.n]["claim"]) != (source, claim):
            raise RuntimeError(f"judge call {self.n} doesn't match the recording")
        self.n += 1
        return "NOT SUPPORTED" not in self.calls[self.n - 1]["reply"].upper()


# --- Module 6's layers, on the live world ---

def successful_results(messages: list) -> str:
    """The text of every tool result that wasn't an error, from the loop's messages."""
    return " ".join(str(block["content"]) for message in messages if message["role"] == "user"
                    and isinstance(message["content"], list) for block in message["content"]
                    if block["type"] == "tool_result" and not block.get("is_error"))


def user_text(messages: list) -> str:
    return " ".join(m["content"] for m in messages if m["role"] == "user" and isinstance(m["content"], str))


def layered_checks(world, messages: list, judge, cost: dict, log: list) -> Checks:
    """All eight layers at their points. Each point runs every code layer and logs every objection; the first
    objection decides, and the support judge runs only when no code layer objected."""
    touched = set()

    def result_check(call, output):
        empty = [k for k, v in json.loads(output).items() if v is None] if output.startswith("{") else []
        return f"silent failure: {', '.join(empty)} came back empty" if empty else None

    def intent_check(call, messages_so_far):
        argument = {"set_model": "agent_name", "send_email": "to"}.get(call.name)
        request = user_text(messages_so_far).lower()
        if argument and str(call.input.get(argument, "")).lower() not in request:
            return f"ask the user: {argument} {call.input.get(argument)!r} wasn't in the request"
        if call.name == "set_model":
            known = (request + " " + successful_results(messages_so_far)).lower()
            if str(call.input.get("model", "")).lower() not in known:
                return f"look it up: model {call.input.get('model')!r} is in neither the request nor a tool result"
        return None

    def guard_before(call, messages_so_far):
        labels = TOOL_LABELS.get(call.name)
        acts = labels is not None and bool(labels & {"changes_state", "external"})
        if labels is None or (acts and "untrusted" in touched and "external" in labels and "private" in touched):
            return "denied: this session has read untrusted content and private data"
        if acts and "untrusted" in touched:
            # a person would confirm; this stand-in approves every request, as in Module 6
            cost["approvals"] += 1
        return None

    def guard_after(call, output):
        touched.update(TOOL_LABELS.get(call.name, {"untrusted"}))
        return None

    def read_back(call, output):
        if call.name != "set_model" or output.startswith("Error:"):
            return None
        cost["extra_reads"] += 1
        record = world.snapshot()["registry"].get(call.input.get("agent_name"), {})
        return None if record.get("model") == call.input.get("model") else "the registry doesn't show the change"

    def grounding(answer):
        evidence = successful_results(messages)
        known = [float(n.rstrip("%").replace(",", "")) for n in NUMBER.findall(evidence)]
        for figure in NUMBER.findall(re.sub(r"\d{4}-\d{2}-\d{2}", " ", CITATION.sub(" ", answer))):
            value = float(figure.rstrip("%").replace(",", ""))
            wanted = [value, value / 100] if figure.endswith("%") else [value]
            if not any(abs(w - k) < 1e-9 for w in wanted for k in known):
                return f"{figure} appears in no tool result"
        return None

    def report_check(answer):
        for pattern, tool in CLAIMS:
            for match in pattern.finditer(answer):
                if not any(e["tool"] == tool and e["ok"] and all(e["input"].get(k) == v for k, v in match.groupdict().items())
                           for e in world.log):
                    return f"the answer claims {match.group()!r}, which no successful call did"
        return None

    def missing_part(answer):
        failed = any(block.get("is_error") for message in messages if message["role"] == "user"
                     and isinstance(message["content"], list) for block in message["content"])
        admits = any(phrase in answer.lower() for phrase in ("couldn't", "unavailable", "not available", "failed"))
        return "a tool failed, and the answer doesn't say what's missing" if failed and not admits else None

    def support_judge(answer):
        sources = dict(SOURCE.findall(successful_results(messages)))
        for sentence in re.split(r"(?<=[.!?])\s+", answer):
            for cited in re.findall(r"\[([\w./-]+:\d+)\]", sentence):
                claim = CITATION.sub("", sentence).strip()
                if cited not in sources:
                    return f"cites {cited}, which no tool returned"
                cost["judge_calls"] += 1
                if not judge.supported(sources[cited].strip(), claim):
                    return f"the source doesn't support: {claim!r}"
        return None

    layers = {"before_tool": [("intent check", intent_check), ("session guard", guard_before)],
              "after_tool": [("result check", result_check), ("session guard", guard_after), ("read-back", read_back)],
              "before_answer": [("grounding", grounding), ("report check", report_check),
                                ("missing-part check", missing_part)]}

    def point(name):
        def run(*args):
            objections = [(layer, reason) for layer, hook in layers[name] if (reason := hook(*args))]
            if name == "before_answer" and not objections and (reason := support_judge(*args)):
                objections.append(("support judge", reason))
            for layer, reason in objections:
                log.append({"point": name, "layer": layer, "reason": reason})
            return objections[0][1] if objections else None
        return run

    return Checks(before_tool=point("before_tool"), after_tool=point("after_tool"), before_answer=point("before_answer"))


# --- compaction, forced ---

class CompactingClient:
    """The agent's client, compacting the conversation in place once it has more than `after` rounds."""

    def __init__(self, client, after: int, log: list):
        self.client, self.after, self.log = client, after, log

    def create(self, messages: list):
        rounds = split_rounds(messages)
        if len(rounds) > self.after:
            older = [messages[0]] + [m for r in rounds[:-1] for m in r]
            response = self.client.create(older + [{"role": "user", "content": SUMMARY_INSTRUCTIONS}])
            summary = "\n".join(b.text for b in response.content if b.type == "text").strip()
            self.log.append({"rounds_replaced": len(rounds) - 1, "summary": summary})
            messages[:] = compact(messages, summary, keep_recent=1)
        return self.client.create(messages)


# --- applying a variant ---

def strip_labels(search):
    def without_labels(**arguments):
        return re.sub(r' (?:date|type)="[^"]*"', "", search(**arguments))
    return without_labels


def variant_parts(variant: str, judge=None, record: dict | None = None):
    """For a variant: how it changes the tools (applied before tracing, so traces show what the model saw), how it
    changes the client (applied after tracing, so each of the client's model calls is its own span), and a
    checks_factory for run_trial, or None. `record` collects what the variant logs."""
    if variant not in VARIANTS:
        raise ValueError(f"unknown variant {variant!r}")
    record = record if record is not None else {}

    def change_tools(tools):
        if variant == "no-labels":
            return type(tools)({**tools, "search_docs": strip_labels(tools["search_docs"])})
        return tools

    def change_client(client):
        if variant == "compaction":
            record["compactions"] = []
            return CompactingClient(client, COMPACT_AFTER, record["compactions"])
        return client

    def layered(world, messages):
        return layered_checks(world, messages, judge, record["layer_cost"], record["layer_log"])

    if variant == "layers":
        record.update(layer_log=[], layer_cost={"approvals": 0, "extra_reads": 0, "judge_calls": 0})
    return change_tools, change_client, (layered if variant == "layers" else None)
