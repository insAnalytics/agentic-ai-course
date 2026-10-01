"""
The pilot's first-pass code grader. A task's `checks` can hold:

- answer_includes  items the final answer must contain; an item that is a list passes if any one of its
                   alternatives appears as whole words (case-insensitive, whitespace collapsed)
- registry         the agents and fields that should have changed, and to what; every other agent and
                   field must be as it started ({} means nothing may change). Checked on the world's state.
- outbox           {"count", "to", "body_includes"}; without it, no email may be sent
- must_call_after  [first, then]: a successful call to `then` must come after one to `first`
- must_not_call    [[tool, {argument: value}], ...]: no call, even a failed one, to that tool with those
                   argument values (an empty dict matches any call to the tool)
- answer_excludes  phrases the final answer must not contain (whole words, as for answer_includes)

These are crude where they read text, and they're provisional: every pilot trial is also read, and a grade
the reading contradicts is reported as the reading says.
"""

import re

from registry_world import RegistryWorld


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower().replace("\u2019", "'")).strip()


def contains(text: str, phrase: str) -> bool:
    """Whether the normalized text contains the phrase as whole words: "not" doesn't match notes_agent,
    and "5%" doesn't match 15%."""
    phrase = normalize(phrase)
    start = r"(?<!\w)" if re.match(r"\w", phrase[0]) else ""
    end = r"(?!\w)" if re.match(r"\w", phrase[-1]) else ""
    return re.search(start + re.escape(phrase) + end, text) is not None


def initial_registry(directory) -> dict:
    return RegistryWorld(f"{directory}/initial.db").registry


def grade(task, record: dict, initial: dict) -> tuple[bool, list[str]]:
    """Whether the trial passed its task's checks, and the reason for each check that failed."""
    checks, failures = task.checks, []
    answer = normalize(record["answers"][-1])
    for item in checks.get("answer_includes", []):
        options = item if isinstance(item, list) else [item]
        if not any(contains(answer, option) for option in options):
            failures.append(f"answer lacks {options[0]!r}" + (f" (or {len(options) - 1} alternatives)" if len(options) > 1 else ""))
    registry = record["final_state"]["registry"]
    if "registry" in checks:
        expected = {agent: {**fields, **checks["registry"].get(agent, {})} for agent, fields in initial.items()}
        for agent, fields in expected.items():
            for name, value in fields.items():
                if registry[agent][name] != value:
                    failures.append(f"{agent}.{name} is {registry[agent][name]!r}, expected {value!r}")
    outbox = record["final_state"]["outbox"]
    wanted = checks.get("outbox", {"count": 0})
    if len(outbox) != wanted["count"]:
        failures.append(f"{len(outbox)} emails sent, expected {wanted['count']}")
    elif wanted["count"]:
        email = outbox[0]
        if email["to"] != wanted["to"]:
            failures.append(f"email went to {email['to']!r}, expected {wanted['to']!r}")
        for text in wanted.get("body_includes", []):
            if not contains(normalize(email["body"]), text):
                failures.append(f"email body lacks {text!r}")
    if "must_call_after" in checks:
        first, then = checks["must_call_after"]
        tools = [entry["tool"] for entry in record["tool_log"] if entry["ok"]]
        if first not in tools or then not in tools[tools.index(first) + 1:]:
            failures.append(f"no successful {then} after {first}")
    for tool, arguments in checks.get("must_not_call", []):
        for entry in record["tool_log"]:
            if entry["tool"] == tool and all(entry["input"].get(k) == v for k, v in arguments.items()):
                failures.append(f"called {tool} with {entry['input']}, which this task forbids")
                break
    for phrase in checks.get("answer_excludes", []):
        if contains(answer, phrase):
            failures.append(f"answer contains {phrase!r}")
    return not failures, failures
