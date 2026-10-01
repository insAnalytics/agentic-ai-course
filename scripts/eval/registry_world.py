"""
The registry agent's world for one trial: Module 6 Lesson 10's five tools, made real on Module 5's data,
plus Module 5's read-only SQL tool.

- get_agent, set_model and query_database use a fresh copy of Module 5's registry database per trial,
  built by Module 5's own build_registry_db, so no trial sees another's writes.
- search_docs is Module 5's reader-bound keyword search (search_tool_for), unchanged.
- set_model enforces the registry's documented rules (D01, D02, D07), with the documented error codes.
- get_health and send_email are in memory: readings fixed per task, and an outbox.
- Faults are switched on per task, never at random, so a trial can be replayed exactly.

Every tool returns a string. Problems come back as text starting "Error:", never as exceptions, and
every call is logged with whether it succeeded, in the shape Lesson 10's layers read.
"""

import inspect
import json
import sqlite3
import time
from functools import cache
from pathlib import Path

import m5

TIER_MODELS = {"standard": {"claude-haiku", "claude-sonnet"},
               "priority": {"claude-haiku", "claude-sonnet", "claude-opus"}}
DEPRECATED = {"claude-legacy"}
DB_TABLES = {"agents", "incidents", "incident_agents"}

# live readings aren't in any document; these are the world's, fixed so every trial sees the same ones
DEFAULT_HEALTH = {
    "support_agent": {"error_rate": 0.011, "p95_ms": 2100},
    "triage_agent": {"error_rate": 0.004, "p95_ms": 900},
    "research_agent": {"error_rate": 0.023, "p95_ms": 840},
    "notes_agent": {"error_rate": 0.008, "p95_ms": 1300},
    "billing_agent": {"error_rate": 0.002, "p95_ms": 1750},
}

# faults a task can switch on
FAULTS = {
    "lose_writes",      # set_model reports success but the change never lands
    "health_timeout",   # get_health fails with a timeout
    "empty_agent",      # get_agent returns a record with every field empty
}

# The pilot's wording, which a model used to explain away a lost write (Module 7, Lessons 1-2), and the
# wording from the main runs on, which says what a stale record after a successful write means.
SET_MODEL_DESCRIPTION_PILOT = ("Change the model an agent runs on. The change applies from the agent's next session. "
                               "The model must be allowed on the agent's tier.")
SET_MODEL_DESCRIPTION = ("Change the model an agent runs on. The model must be allowed on the agent's tier. "
                         "The registry record changes immediately; a session that's already running keeps its old "
                         "model until it ends.")

TOOL_SPECS = [
    {"name": "get_agent",
     "description": "Look up one agent in the registry: its model, tier, owner and status.",
     "input_schema": {"type": "object",
                      "properties": {"agent_name": {"type": "string", "description": "The agent's id, such as research_agent."}},
                      "required": ["agent_name"]}},
    {"name": "get_health",
     "description": "Read an agent's live health over the last 15 minutes: its error rate (a fraction of sessions) "
                    "and its p95 response time in milliseconds.",
     "input_schema": {"type": "object",
                      "properties": {"agent_name": {"type": "string", "description": "The agent's id."}},
                      "required": ["agent_name"]}},
    {"name": "set_model",
     "description": SET_MODEL_DESCRIPTION,
     "input_schema": {"type": "object",
                      "properties": {"agent_name": {"type": "string", "description": "The agent's id."},
                                     "model": {"type": "string", "description": "The model to move it to, such as claude-sonnet."}},
                      "required": ["agent_name", "model"]}},
    {"name": "search_docs",
     "description": m5.SEARCH_TOOL["description"],
     "input_schema": m5.SEARCH_TOOL["input_schema"]},
    {"name": "send_email",
     "description": "Send an email to a team's mailbox, such as research-team.",
     "input_schema": {"type": "object",
                      "properties": {"to": {"type": "string", "description": "The team's mailbox name."},
                                     "body": {"type": "string", "description": "The message."}},
                      "required": ["to", "body"]}},
    m5.SQL_TOOL,
]


@cache
def search_for(groups: frozenset):
    """Module 5's reader-bound search for these groups, built once and shared: it only reads."""
    return m5.search_tool_for(groups)


def registry_error(code: str, name: str, message: str) -> str:
    """An error in the registry's documented shape (D01), marked as an error for the loop."""
    return "Error: " + json.dumps({"error": {"code": code, "name": name, "message": message}})


class ToolBox(dict):
    """Tools by name. An unknown name, or arguments a tool can't take, comes back as an error result the
    model can act on, never as an exception that ends the run."""

    def __missing__(self, name):
        return lambda **_: f"Error: there is no tool named {name!r}. The tools are: {', '.join(self)}."


class RegistryWorld:
    def __init__(self, path: str, health: dict | None = None, faults=(), groups=("all-staff",)):
        unknown = set(faults) - FAULTS
        if unknown:
            raise ValueError(f"unknown faults: {sorted(unknown)}")
        self.path = path
        m5.build_registry_db(path)
        self.health = {name: {**DEFAULT_HEALTH.get(name, {}), **reading}
                       for name, reading in {**DEFAULT_HEALTH, **(health or {})}.items()}
        self.faults = set(faults)
        self.search = search_for(frozenset(groups))
        self.outbox, self.log = [], []

    # --- state, read by graders and by Lesson 10's layers ---

    @property
    def registry(self) -> dict:
        with sqlite3.connect(self.path) as db:
            rows = db.execute("SELECT agent_id, model, tier, owner, status FROM agents ORDER BY agent_id").fetchall()
        return {row[0]: dict(zip(("model", "tier", "owner", "status"), row[1:])) for row in rows}

    def mailboxes(self) -> set:
        return {record["owner"] for record in self.registry.values()}

    def snapshot(self) -> dict:
        return {"registry": self.registry, "outbox": list(self.outbox)}

    # --- the tools ---

    def get_agent(self, agent_name: str) -> str:
        record = self.registry.get(agent_name)
        if record is None:
            return registry_error("REG-1005", "AGENT_NOT_FOUND", f"no agent has the id {agent_name!r}")
        if "empty_agent" in self.faults:
            return json.dumps({"agent_id": agent_name, **dict.fromkeys(record)})
        return json.dumps({"agent_id": agent_name, **record})

    def get_health(self, agent_name: str) -> str:
        if agent_name not in self.registry:
            return registry_error("REG-1005", "AGENT_NOT_FOUND", f"no agent has the id {agent_name!r}")
        if "health_timeout" in self.faults:
            return "Error: the health service didn't answer within 5 seconds."
        return json.dumps({"agent_name": agent_name, "window": "last 15 minutes", **self.health[agent_name]})

    def set_model(self, agent_name: str, model: str) -> str:
        record = self.registry.get(agent_name)
        if record is None:
            return registry_error("REG-1005", "AGENT_NOT_FOUND", f"no agent has the id {agent_name!r}")
        if model in DEPRECATED:
            return registry_error("REG-1010", "MODEL_DEPRECATED", f"{model} is deprecated and can't be assigned")
        if model not in TIER_MODELS[record["tier"]]:
            return registry_error("REG-1007", "MODEL_NOT_ALLOWED", f"{model} is not allowed on tier {record['tier']}")
        if "lose_writes" not in self.faults:
            with sqlite3.connect(self.path) as db:
                db.execute("UPDATE agents SET model = ? WHERE agent_id = ?", (model, agent_name))
        return json.dumps({"status": "ok", "agent_id": agent_name, "model": model})

    def search_docs(self, query: str, k: int = 5) -> str:
        return self.search(query, k)

    def send_email(self, to: str, body: str) -> str:
        if to not in self.mailboxes():
            return f"Error: there is no mailbox named {to!r}. Send to a team, such as {sorted(self.mailboxes())[0]}."
        self.outbox.append({"to": to, "body": body})
        return json.dumps({"status": "sent", "to": to})

    def query_database(self, sql: str) -> str:
        """Module 5's query_database, on this trial's database: one read-only query, on the allowed tables,
        stopped after a second, with at most 20 rows back."""
        max_rows, timeout = 20, 1.0

        def authorize(action, arg1, arg2, database, trigger):
            if action == sqlite3.SQLITE_READ:
                return sqlite3.SQLITE_OK if arg1 in DB_TABLES else sqlite3.SQLITE_DENY
            return sqlite3.SQLITE_OK if action in (sqlite3.SQLITE_SELECT, sqlite3.SQLITE_FUNCTION) else sqlite3.SQLITE_DENY

        deadline = time.monotonic() + timeout
        db = sqlite3.connect(f"file:{self.path}?mode=ro", uri=True)
        db.set_authorizer(authorize)
        db.set_progress_handler(lambda: time.monotonic() > deadline, 10_000)
        try:
            cursor = db.execute(sql)
            rows = cursor.fetchmany(max_rows + 1)
            columns = [c[0] for c in cursor.description]
        except sqlite3.OperationalError as error:
            if str(error) == "interrupted":
                return f"Error: the query ran for more than {timeout} seconds and was stopped. Narrow it with WHERE or LIMIT."
            return f"Error: {error}"
        except sqlite3.Error as error:
            return f"Error: {error}"
        finally:
            db.close()
        if not rows:
            return "No rows."
        lines = [" | ".join(columns)] + [" | ".join(str(v) for v in row) for row in rows[:max_rows]]
        if len(rows) > max_rows:
            lines.append(f"(more than {max_rows} rows; narrow the query with WHERE or LIMIT)")
        return "\n".join(lines)

    def tools(self) -> ToolBox:
        """The tools by name, each checking its arguments and logging every call."""
        def logged(name, function):
            signature = inspect.signature(function)

            def call(**arguments):
                try:
                    signature.bind(**arguments)
                except TypeError as error:
                    output = f"Error: wrong arguments for {name}: {error}. Check the tool's parameters."
                else:
                    try:
                        output = function(**arguments)
                    # a value the tool can't convert, such as k="five"; the log keeps the message
                    except (TypeError, ValueError) as error:
                        output = f"Error: {name} couldn't use those arguments: {error}."
                self.log.append({"tool": name, "input": arguments, "ok": not output.startswith("Error:"), "output": output})
                return output
            return call

        return ToolBox({spec["name"]: logged(spec["name"], getattr(self, spec["name"])) for spec in TOOL_SPECS})


def fresh_world(task, directory: str | Path) -> RegistryWorld:
    """The world for one trial of a task, in its own database file."""
    path = Path(directory) / f"{task.id}-{time.monotonic_ns()}.db"
    groups = tuple(task.groups) if getattr(task, "groups", None) else ("all-staff",)
    return RegistryWorld(str(path), health=task.health, faults=task.faults, groups=groups)

# the tool definitions exactly as the pilot sent them, so its recordings can still be checked against them
TOOL_SPECS_PILOT = [{**spec, "description": SET_MODEL_DESCRIPTION_PILOT} if spec["name"] == "set_model" else spec
                    for spec in TOOL_SPECS]
