# Module 5, Lesson 11 — Concept 4: When the answer is in a table

> **Note for the site build:**
> - The shared setup now includes the previous exercise's reference
>   solution, `SearchBudget`.
> - **New shared code** for every demo and exercise from this concept to the
>   end of the lesson: `REGISTRY_DB`, `DB_TABLES`, `build_registry_db` and
>   `SQL_TOOL`, exactly as in the first code block below. It imports
>   `sqlite3` and `time`. It calls
>   `build_registry_db()` once, writing `/tmp/registry.db` in Pyodide's
>   in-memory file system.
> - **Check that `sqlite3` imports in the sandbox.** Recent Pyodide builds ship
>   it as a separate package, loaded with `pyodide.loadPackage("sqlite3")`;
>   the URI form `file:...?mode=ro` and `set_authorizer` must both work there.
> - **The exercise's reference solution** (`query_database`) joins the shared
>   setup only for pages *after* this concept.

---

## Questions a search can't answer well

"Which incident lasted longest?" The answer is in the documents: each of the
three incident reports states its duration. But no single passage says which
was longest. Search would have to return all three reports, and the model would
have to read them and compare. "How many agents are still on claude-legacy?"
works, but only because one runbook happens to list them. "Which of
support-team's agents did an incident affect?" needs facts from the registry and
from every incident report at once.

These are questions about **records**: lists, counts, comparisons, joins.
Similarity search finds passages that sound like the question; it can't count or
sort. If the facts exist as structured data, in a database or a spreadsheet, a
query answers these questions exactly, in one step. Most organisations have
both kinds of knowledge, and an agent can be given a tool for each.

This lesson's company keeps its registry and incident log in a database as well
as describing them in documents. Here's a snapshot of it, consistent with
everything the documents say:

```python
import sqlite3
import time

REGISTRY_DB = "/tmp/registry.db"
DB_TABLES = {"agents", "incidents", "incident_agents"}

def build_registry_db(path: str = REGISTRY_DB) -> None:
    """A snapshot of the registry and the incident log as a SQLite database, consistent with the documents."""
    Path(path).unlink(missing_ok=True)
    with sqlite3.connect(path) as db:
        db.executescript("""
            CREATE TABLE agents (agent_id TEXT PRIMARY KEY, model TEXT, tier TEXT, owner TEXT, status TEXT);
            CREATE TABLE incidents (incident_id TEXT PRIMARY KEY, started TEXT, title TEXT,
                                    failed_service TEXT, duration_minutes INTEGER);
            CREATE TABLE incident_agents (incident_id TEXT, agent_id TEXT);
            CREATE TABLE api_keys (agent_id TEXT, scope TEXT, key_hash TEXT);
        """)
        db.executemany("INSERT INTO agents VALUES (?, ?, ?, ?, ?)", [
            ("support_agent", "claude-sonnet", "standard", "support-team", "active"),
            ("triage_agent", "claude-haiku", "standard", "support-team", "active"),
            ("research_agent", "claude-legacy", "standard", "research-team", "active"),
            ("notes_agent", "claude-legacy", "standard", "support-team", "active"),
            ("billing_agent", "claude-opus", "priority", "finance-team", "active"),
        ])
        db.executemany("INSERT INTO incidents VALUES (?, ?, ?, ?, ?)", [
            ("INC-2041", "2026-04-08", "billing_agent unable to issue invoices", "auth-service", 135),
            ("INC-2067", "2026-06-15", "research_agent returning outdated results", "kb-search", 10080),
            ("INC-2093", "2026-08-27", "registry outage during database failover", "registry-db", 42),
        ])
        db.executemany("INSERT INTO incident_agents VALUES (?, ?)", [
            ("INC-2041", "billing_agent"), ("INC-2067", "research_agent"),
            ("INC-2093", "support_agent"), ("INC-2093", "triage_agent"),
        ])
        db.executemany("INSERT INTO api_keys VALUES (?, ?, ?)", [
            ("support_agent", "write", "sha256:9f2c1e..."), ("billing_agent", "write", "sha256:4b7a0d..."),
        ])

build_registry_db()

SQL_TOOL = {
    "name": "query_database",
    "description": (
        "Runs one read-only SQL query (SQLite) on the registry snapshot and incident log, and returns up to 20 "
        "rows. Use it for lists, counts and comparisons across agents or incidents; use search_documents for "
        "explanations, procedures and anything written in prose. Tables:\n"
        "agents(agent_id, model, tier, owner, status)\n"
        "incidents(incident_id, started, title, failed_service, duration_minutes)\n"
        "incident_agents(incident_id, agent_id): which agents each incident affected"),
    "input_schema": {
        "type": "object",
        "properties": {"sql": {"type": "string", "description": "One SELECT statement."}},
        "required": ["sql"],
    },
}
```
*(defined once here and already loaded for every demo and exercise from here to the end of this lesson)*

`billing_agent`'s model and tier, and its team's name, are in the database but
not in any document, as registry details often aren't. The tool's description
carries the schema, since the model can only write a query against columns it
knows exist, and it says which questions belong to which tool.

---

## The obvious tool, and what's wrong with it

The simplest SQL tool runs whatever the model sends. On a copy of the
database:

```python
def run_sql(sql: str) -> str:
    """A naive SQL tool: whatever the model sends, on an ordinary connection."""
    with sqlite3.connect("/tmp/registry-copy.db") as db:
        return "\n".join(" | ".join(map(str, row)) for row in db.execute(sql).fetchall())

build_registry_db("/tmp/registry-copy.db")
for sql in ("SELECT incident_id, duration_minutes FROM incidents ORDER BY duration_minutes DESC LIMIT 1",
            "SELECT agent_id, key_hash FROM api_keys",
            "DELETE FROM agents WHERE status = 'active'",
            "SELECT COUNT(*) FROM agents"):
    print(f"{sql}\n  -> {run_sql(sql)!r}")
```
```
SELECT incident_id, duration_minutes FROM incidents ORDER BY duration_minutes DESC LIMIT 1
  -> 'INC-2067 | 10080'
SELECT agent_id, key_hash FROM api_keys
  -> 'support_agent | sha256:9f2c1e...\nbilling_agent | sha256:4b7a0d...'
DELETE FROM agents WHERE status = 'active'
  -> ''
SELECT COUNT(*) FROM agents
  -> '0'
```
*(runs live, shows output — read-only demo snippet, not graded. The queries are fixed examples, run for real on a throwaway copy.)*

The first query is the tool doing its job: the longest incident, in one step.
The next three are the problem. The same tool reads the `api_keys` table, which
has nothing to do with answering questions, and deletes every agent. A model
would rarely send a `DELETE` on its own, but its queries come from text it
has read, and Module 3's threat model applies: a planted instruction in a
retrieved document, or a confused model, can make it send anything. As
[Module 3 put it](→ Module 3, the tool threat model lesson, why the model cant be the security boundary concept),
the model can't be the security boundary. The tool has to be.

---

## Guardrails: allow, don't ban

Nothing here stops the model from writing its own SQL. That's the point of the
tool: it can ask questions nobody wrote a query for in advance. The guardrails
belong around the tool, in code the model can't change. The first instinct is
usually a list of banned words. Here's one, on the same throwaway copy:

```python
BANNED = ("DELETE", "DROP")

def run_sql_with_ban(sql: str) -> str:
    """A deny-list guardrail: refuse any query containing a banned word."""
    if any(word in sql.upper() for word in BANNED):
        return "Error: that statement isn't allowed."
    with sqlite3.connect("/tmp/registry-copy.db") as db:
        return "\n".join(" | ".join(map(str, row)) for row in db.execute(sql).fetchall())

build_registry_db("/tmp/registry-copy.db")
for sql in ("DELETE FROM agents",
            "UPDATE agents SET tier = 'priority', model = 'claude-opus'",
            "SELECT agent_id, tier FROM agents WHERE agent_id = 'notes_agent'",
            "SELECT incident_id FROM incidents WHERE title LIKE '%dropped%'"):
    print(f"{sql}\n  -> {run_sql_with_ban(sql)!r}")
```
```
DELETE FROM agents
  -> "Error: that statement isn't allowed."
UPDATE agents SET tier = 'priority', model = 'claude-opus'
  -> ''
SELECT agent_id, tier FROM agents WHERE agent_id = 'notes_agent'
  -> 'notes_agent | priority'
SELECT incident_id FROM incidents WHERE title LIKE '%dropped%'
  -> "Error: that statement isn't allowed."
```
*(runs live, shows output — read-only demo snippet, not graded. The queries are fixed examples.)*

The ban caught `DELETE`, then let an `UPDATE` through that moved every agent to
the priority tier, because nobody put `UPDATE` on the list. It also refused an
innocent search for incidents with "dropped" in the title. That's the
weakness of any deny-list: it has to name every dangerous thing in advance, a
single omission undoes it, and it blocks harmless requests that happen to
contain a banned word. An **allowlist** works the other way round. It names
what's permitted, and refuses everything else, including tricks nobody thought
of.

A SQL tool for an agent usually stacks several guardrails, each doing a
different job:

- **Read-only access,** so no statement can change anything, whatever words it
  contains. Here that's a read-only connection. On a database server, it's a
  dedicated account that has only been granted `SELECT`.
- **An allowlist of what can be read.** Here that's SQLite's authorizer, which
  the database engine consults for every table a query touches. On a server,
  it's permission grants on specific tables, and **views** that expose only
  safe columns, so a sensitive column can't be selected at all.
- **A row limit,** so one broad query can't flood the model's context.
- **A timeout,** so one expensive query can't tie up the database. A cross join
  of a few tables can mean millions of rows.
- **A query budget,** limiting how many queries one question, or one user, can
  run, the same idea as the search budget in the previous concept.

These are [Module 3's least-privilege rules](→ Module 3, designing for least privilege lesson, separate reads from writes and gate the writes concept)
applied to data: the tool gets exactly the access answering questions needs.
The exercise builds the first four into the tool itself.

---

## Two tools, and the model routes

With a tool for each kind of question, a single response can use both. Here's
a question with a records part and a prose part:

```python
def run_sql(sql: str) -> str:
    """The naive tool again, for this demo only: the exercise replaces it."""
    with sqlite3.connect(REGISTRY_DB) as db:
        return "\n".join(" | ".join(map(str, row)) for row in db.execute(sql).fetchall())

client = RecordingClient([
    [ToolUseBlock("query_database", {"sql": "SELECT agent_id FROM agents WHERE owner = 'support-team' AND model = 'claude-legacy'"}),
     ToolUseBlock("search_documents", {"query": "claude-legacy switched off date"})],
    [TextBlock("One support-team agent is still on claude-legacy: notes_agent. It must move before the model "
               "is switched off on 2026-10-31 [D07:0]; its target is claude-haiku [D07:1].")],
])
messages = [{"role": "user", "content": "Which of support-team's agents are still on claude-legacy, and by when must they move?"}]
answer = run_agent(client, messages, {"query_database": run_sql, "search_documents": contextual_search})
for block in messages[1]["content"]:
    print(f"{block.name}: {block.input}")
for result in messages[2]["content"]:
    ids = re.findall(r'<source id="([^"]+)"', result["content"])
    print(f"  result: {ids if ids else repr(result['content'])}")
print(f"answer: {answer}")
```
```
query_database: {'sql': "SELECT agent_id FROM agents WHERE owner = 'support-team' AND model = 'claude-legacy'"}
search_documents: {'query': 'claude-legacy switched off date'}
  result: 'notes_agent'
  result: ['D07:0', 'D03:1', 'D07:5', 'D07:1', 'D07:4']
answer: One support-team agent is still on claude-legacy: notes_agent. It must move before the model is switched off on 2026-10-31 [D07:0]; its target is claude-haiku [D07:1].
```
*(runs live, shows output — read-only demo snippet, not graded. The model's tool calls and answer are scripted; the query and the search run for real.)*

The model sent both calls in one response, and the loop answered both, each
by its id, in one message, as Module 2's loop requires. The database answered
"which agents", exactly. Search answered "by when", from the runbook, with a
citation. A database row has no chunk id, so an answer that uses one should
say it came from the registry, the same way Lesson 10 made sources traceable.

---

## Quiz cards

> **Q1.** Why is "which incident lasted longest?" a poor fit for search?
> - It needs comparing values from several records, which similarity search can't do ✅
> - Incident reports can't be retrieved by duration
> - The durations are in a chart
> - The question is too short to embed
>
> *Explanation: search returns passages that resemble the question. A
> comparison across records needs all of them and an operation on them,
> which a query does in one step.*

> **Q2.** Why does the SQL tool's description include the table schema?
> - The model can only write a correct query against columns it knows exist ✅
> - The database requires it before every query
> - It stops the model from writing DELETE statements
> - Schemas make the tool run faster
>
> *Explanation: the description is the model's only view of the database.
> Without the columns, it would guess names and get errors back.*

> **Q3.** A naive SQL tool read `api_keys` and deleted every agent. Why
> can't instructions to the model fix that?
> - Queries come from text the model has read, so anything it's persuaded to send must be refused by the tool itself ✅
> - Models ignore instructions about databases
> - Instructions can't mention table names
> - The model can't see its own queries
>
> *Explanation: as Module 3 showed, a model can be manipulated by content
> in its context. The enforcement has to be in code the model can't
> change: what the connection can read and do.*

> **Q4.** How should an answer cite a fact from the database?
> - Say it came from the registry, since a row has no document chunk id ✅
> - It shouldn't; database facts need no citation
> - Invent a chunk id for the row
> - Quote the SQL query as the source
>
> *Explanation: every fact should be traceable to where it came from.
> For a database, that's the table or system it was read from, not a
> passage.*

> **Q5.** A SQL tool bans queries containing `DELETE` or `DROP`. What's
> wrong with that guardrail?
> - It lets through anything nobody listed, like `UPDATE`, and blocks harmless queries containing a banned word ✅
> - It's too slow to check every query
> - Banned words can't be detected in SQL
> - Nothing: a ban on destructive keywords is enough
>
> *Explanation: a deny-list has to name every dangerous thing in advance.
> An allowlist, such as a read-only connection and permitted tables,
> refuses everything not explicitly allowed.*

---

## Applied sandbox exercise
*(graded — a SQL tool that can only read what it should)*

**Task shown to learner:**

Write `query_database(sql, max_rows=20, timeout=1.0)`, the function behind `SQL_TOOL`:

- **Open the database read-only:** `sqlite3.connect(f"file:{REGISTRY_DB}?mode=ro",
  uri=True)`.
- **Stop long queries:** record a deadline, `time.monotonic() + timeout`, and
  install `connection.set_progress_handler(handler, 10_000)`. SQLite calls the
  handler every 10,000 steps of work, and stops the query when it returns a true
  value, so return whether the deadline has passed.
- **Install an authorizer** with `connection.set_authorizer(...)`. SQLite
  calls it for every action a statement would take. Return
  `sqlite3.SQLITE_OK` for `sqlite3.SQLITE_SELECT` and `sqlite3.SQLITE_FUNCTION`
  actions, and for `sqlite3.SQLITE_READ` actions only when the table, the
  authorizer's second argument, is in `DB_TABLES`. Return
  `sqlite3.SQLITE_DENY` for everything else.
- **Run the query and fetch at most `max_rows + 1` rows.** A stopped query
  raises `sqlite3.OperationalError` with the message `"interrupted"`: return
  `f"Error: the query ran for more than {timeout} seconds and was stopped.
  Narrow it with WHERE or LIMIT."`. For any other `sqlite3.Error`, return
  `f"Error: {error}"`. Always close the connection.
- **No rows:** return `"No rows."`.
- **Otherwise** return the column names joined by `" | "`, then each row the
  same way, one per line. If there were more than `max_rows` rows, show
  `max_rows` of them and end with the line `(more than <max_rows> rows; narrow
  the query with WHERE or LIMIT)`.

**Starter code:**

```python
def query_database(sql: str, max_rows: int = 20, timeout: float = 1.0) -> str:
    """The SQL tool: one query, on a read-only connection that can read only the allowed tables,
    stopped after `timeout` seconds, with at most max_rows rows back. Errors come back as text."""
    # TODO
    ...
```

**Hidden tests:**

```python
# 1. a query the tool is for: a header row, then one line per row
result = query_database("SELECT incident_id, duration_minutes FROM incidents ORDER BY duration_minutes DESC")
assert isinstance(result, str), f"query_database should return a string; got {result!r}"
assert result == "incident_id | duration_minutes\nINC-2067 | 10080\nINC-2041 | 135\nINC-2093 | 42", \
    f"the column names joined by ' | ', then each row the same way; got {result!r}"
counted = query_database("SELECT COUNT(*) FROM agents WHERE model = 'claude-legacy'")
assert counted == "COUNT(*)\n2", f"columns on the first line, then the rows; got {counted!r}"

# 2. tables outside the allowlist can't be read, even though they exist
assert query_database("SELECT key_hash FROM api_keys") == "Error: access to api_keys.key_hash is prohibited", \
    "reads of api_keys must be denied by the authorizer"
assert query_database("SELECT name FROM sqlite_master").startswith("Error: access to sqlite_master"), \
    "only the three allowed tables can be read"

# 3. nothing can be changed, and the database is untouched afterwards
for statement in ("DELETE FROM agents", "UPDATE agents SET tier = 'priority'", "DROP TABLE incidents",
                  "INSERT INTO agents VALUES ('x', 'y', 'z', 'w', 'v')"):
    assert query_database(statement) == "Error: not authorized", f"{statement!r} should be refused"
with sqlite3.connect(REGISTRY_DB) as check:
    assert check.execute("SELECT COUNT(*) FROM agents").fetchone() == (5,), "the database must be unchanged"

# 4. mistakes come back as messages the model can fix
for sql, expected in [("SELECT nonsense FROM agents", "Error: no such column: nonsense"),
                      ("SELECT * FROM agents; DELETE FROM agents", "Error: You can only execute one statement at a time."),
                      ("SELECT agent_id FROM agents WHERE tier = 'enterprise'", "No rows.")]:
    got = query_database(sql)
    assert got == expected, f"{sql!r} should return {expected!r}; got {got!r}"

# 5. at most max_rows rows, with a note when there were more
many = query_database("SELECT a.agent_id, i.incident_id FROM agents a, incidents i, incident_agents x")
lines = many.split("\n")
assert len(lines) == 22 and lines[-1] == "(more than 20 rows; narrow the query with WHERE or LIMIT)", \
    f"a header, 20 rows and the note; got {len(lines)} lines ending {lines[-1]!r}"
assert len(query_database("SELECT agent_id FROM agents", max_rows=3).split("\n")) == 5

# 6. a query that runs too long is stopped, with a message the model can act on
tables = ", ".join(f"agents t{i}" for i in range(9))
lengths = " + ".join(f"length(t{i}.agent_id)" for i in range(9))
stopped = query_database(f"SELECT SUM({lengths}) FROM {tables}", timeout=0.05)
assert stopped == "Error: the query ran for more than 0.05 seconds and was stopped. Narrow it with WHERE or LIMIT.", \
    f"stop a query at its timeout and say so; got {stopped[:100]!r}"
assert query_database("SELECT COUNT(*) FROM agents", timeout=0.05) == "COUNT(*)\n5", "a quick query isn't affected by the timeout"

# 7. in the loop, next to search, answering both calls from one response
client = RecordingClient([
    [ToolUseBlock("query_database", {"sql": "SELECT agent_id FROM agents WHERE owner = 'support-team' AND model = 'claude-legacy'"}),
     ToolUseBlock("search_documents", {"query": "claude-legacy switched off date"})],
    [TextBlock("notes_agent must move before 2026-10-31 [D07:0].")],
])
messages = [{"role": "user", "content": "Which support-team agents are on claude-legacy, and by when must they move?"}]
run_agent(client, messages, {"query_database": query_database, "search_documents": contextual_search})
results = messages[2]["content"]
assert results[0]["content"] == "agent_id\nnotes_agent" and results[1]["content"].startswith('<source id="D07:0"'), results
```

**Hint (shown on request):**

The authorizer is called as `authorize(action, arg1, arg2, database,
trigger)`; for a read, `arg1` is the table name. `cursor.description` gives
the column names after `execute`: `[c[0] for c in cursor.description]`. A
`try`/`except`/`finally` keeps the connection closed on every path. Catch
`sqlite3.OperationalError` before `sqlite3.Error`, since it's a subclass, and
check `str(error) == "interrupted"`.

**Reference solution:**

```python
def query_database(sql: str, max_rows: int = 20, timeout: float = 1.0) -> str:
    """The SQL tool: one query, on a read-only connection that can read only the allowed tables,
    stopped after `timeout` seconds, with at most max_rows rows back. Errors come back as text."""
    def authorize(action, arg1, arg2, database, trigger):
        if action == sqlite3.SQLITE_READ:
            return sqlite3.SQLITE_OK if arg1 in DB_TABLES else sqlite3.SQLITE_DENY
        return sqlite3.SQLITE_OK if action in (sqlite3.SQLITE_SELECT, sqlite3.SQLITE_FUNCTION) else sqlite3.SQLITE_DENY

    deadline = time.monotonic() + timeout
    db = sqlite3.connect(f"file:{REGISTRY_DB}?mode=ro", uri=True)
    db.set_authorizer(authorize)
    # SQLite calls this every 10,000 steps of work; a true result stops the query
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
```

**Explanation:**

There are two locks here, and they do different jobs. The read-only
connection means no statement can change the database, whatever it is. The
authorizer means only three tables can be read at all, so `api_keys` and
SQLite's own catalogue are off-limits even to a well-formed `SELECT`. It also
refuses everything that isn't a plain read, which is why `DELETE`, `ATTACH`,
`PRAGMA` and even recursive queries all come back as "not authorized". That's
[Module 3's least privilege](→ Module 3, designing for least privilege lesson, allowlists and per-tool credentials concept)
applied to data: the tool can do exactly what answering questions needs, and
nothing else. The row limit is Module 3's advice on tool results: an agent's
query can match thousands of rows, and a note telling the model to narrow it
beats flooding its context. The timeout test builds a nine-way cross join, nearly two
million rows to add up, and stops it at 0.05 seconds; a normal query under the
same limit is unaffected. The final test runs both tools in one response,
routed by the model, answered in one message.
