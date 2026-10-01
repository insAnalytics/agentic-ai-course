"""
The pilot's first-pass code grader. A task's `checks` can hold:

- answer_includes  items the final answer must contain; an item that is a list passes if any one of its
                   alternatives appears as whole words (case-insensitive, whitespace collapsed)
- registry         the agents and fields that should have changed, and to what; every other agent and
                   field must be as it started ({} means nothing may change). Checked on the world's state.
- outbox           {"count", "to", "body_includes"}: exactly `count` emails, the first to `to`; or
                   {"max_count", "to"}: at most `max_count` emails, every one to `to`.
                   Without it, no email may be sent
- must_call_after  [first, then]: a successful call to `then` must come after one to `first`
- must_not_call    [[tool, {argument: value}], ...]: no call, even a failed one, to that tool with those
                   argument values (an empty dict matches any call to the tool)
- answer_excludes  phrases the final answer must not contain (whole words, as for answer_includes)
- cites_only_retrieved  true: every source id the final answer cites, in [brackets] or as a (link target), must be
                   one a tool returned in this run
- max_tool_calls   the run may make at most this many tool calls

These are crude where they read text, and they're provisional: every pilot trial is also read, and a grade
the reading contradicts is reported as the reading says.
"""

import re

from registry_world import RegistryWorld


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower().replace("\u2019", "'")).strip()


def contains(text: str, phrase: str, version: int = 2) -> bool:
    """Whether the normalized text contains the phrase as whole words: "not" doesn't match notes_agent,
    and "5%" doesn't match 15%.

    Version 1, the first version, also treated a letter after a number as part of the same word, so "840"
    didn't match "840ms". Version 2 lets a number be followed by its unit: after a phrase that ends in a digit
    it only requires that no further digit, or decimal or thousands part, follows ("840" matches "840ms" but
    not "8400" or "840.5"). Version 1 is kept to reproduce the grades recorded with it."""
    phrase = normalize(phrase)
    start = r"(?<!\w)" if re.match(r"\w", phrase[0]) else ""
    if version >= 2 and phrase[-1].isdigit():
        end = r"(?![0-9]|[.,][0-9])"
    else:
        end = r"(?!\w)" if re.match(r"\w", phrase[-1]) else ""
    return re.search(start + re.escape(phrase) + end, text) is not None


def initial_registry(directory) -> dict:
    return RegistryWorld(f"{directory}/initial.db").registry


SOURCE_ID = r"[\w./-]+:\d+"


def cited_ids(answer: str) -> set[str]:
    """Every source id the answer cites: inside square brackets, one or more separated by commas, or alone in
    parentheses, which includes the target of a markdown link, "[text](id)". (Module 7, Lesson 5's citation
    exercise; it reads lists in brackets, which the first version missed, and gives the same verdict on every
    recorded run.)"""
    ids = set()
    for inside in re.findall(r"\[([^\[\]]+)\]", answer):
        for part in inside.split(","):
            if re.fullmatch(SOURCE_ID, part.strip()):
                ids.add(part.strip())
    ids |= set(re.findall(rf"\(({SOURCE_ID})\)", answer))
    return ids


def grade(task, record: dict, initial: dict, version: int = 2) -> tuple[bool, list[str]]:
    """Whether the trial passed its task's checks, and the reason for each check that failed.
    `version` is the phrase matcher's version (see contains)."""
    checks, failures = task.checks, []
    answer = normalize(record["answers"][-1])
    for item in checks.get("answer_includes", []):
        options = item if isinstance(item, list) else [item]
        if not any(contains(answer, option, version) for option in options):
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
    if "max_count" in wanted:
        if len(outbox) > wanted["max_count"]:
            failures.append(f"{len(outbox)} emails sent, expected at most {wanted['max_count']}")
        for email in outbox:
            if email["to"] != wanted["to"]:
                failures.append(f"email went to {email['to']!r}, expected only {wanted['to']!r}")
    elif len(outbox) != wanted["count"]:
        failures.append(f"{len(outbox)} emails sent, expected {wanted['count']}")
    elif wanted["count"]:
        email = outbox[0]
        if email["to"] != wanted["to"]:
            failures.append(f"email went to {email['to']!r}, expected {wanted['to']!r}")
        for text in wanted.get("body_includes", []):
            if not contains(normalize(email["body"]), text, version):
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
        if contains(answer, phrase, version):
            failures.append(f"answer contains {phrase!r}")
    if checks.get("cites_only_retrieved"):
        retrieved = set()
        for entry in record["tool_log"]:
            retrieved |= set(re.findall(r'<source id="([^"]+)"', entry["output"]))
        cited = cited_ids(record["answers"][-1])
        if cited - retrieved:
            failures.append(f"cites {sorted(cited - retrieved)}, which no tool returned")
    if "max_tool_calls" in checks and len(record["tool_log"]) > checks["max_tool_calls"]:
        failures.append(f"{len(record['tool_log'])} tool calls, more than {checks['max_tool_calls']}")
    return not failures, failures
