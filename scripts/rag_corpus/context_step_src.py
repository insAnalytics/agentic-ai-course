"""Module 5 Lesson 14's labelled data for upgrading Module 4's context step: Module 4's tool catalog
with tool-finding tasks, one user's memories with recall tasks, and labelled memory pairs.

Written for the course. About half of each set of tasks is phrased without the words of what it should
find, which is the case keyword matching can't handle. Labels:
- a tool task's label is the service whose tools should be found (any action);
- a recall task's label is the ids of the memories that should come back;
- a pair's label is "duplicate" (same fact), "related" (same subject, different fact) or
  "contradiction" (same subject, incompatible facts).
"""

# Module 4 Lesson 7's catalog, reproduced exactly
SERVERS = {"registry": "agent records", "monitoring": "health checks and alerts", "billing": "usage and invoices",
           "deploy": "releases and rollbacks", "tickets": "support tickets", "github": "code and pull requests",
           "slack": "team messages", "calendar": "schedules"}
ACTIONS = ["list", "get", "search", "update", "delete"]


def tool_text(server: str, action: str) -> str:
    """A tool's name and description, as Module 4's find_tools matched them."""
    what = SERVERS[server]
    description = (f"{action.capitalize()} {what} in the {server} service. Use this when the task needs to "
                   f"{action} {what}; for other services use their own tools. Returns JSON. "
                   f"Fails with a clear error if the item doesn't exist or you lack permission.")
    return f"{server}__{action} {description}"


TOOL_TASKS = [
    {"id": "t01", "server": "monitoring", "worded": True, "task": "What alerts are firing for support_agent?"},
    {"id": "t02", "server": "billing", "worded": False, "task": "How much did billing_agent cost us last month?"},
    {"id": "t03", "server": "github", "worded": True, "task": "Is there an open pull request for the retry fix?"},
    {"id": "t04", "server": "calendar", "worded": False, "task": "When is the next on-call handover meeting?"},
    {"id": "t05", "server": "slack", "worded": False, "task": "Did anyone post in the channel about the outage?"},
    {"id": "t06", "server": "deploy", "worded": True, "task": "Roll back the release that broke the dashboard"},
    {"id": "t07", "server": "tickets", "worded": False, "task": "Which customer complaints are still unresolved?"},
    {"id": "t08", "server": "registry", "worded": False, "task": "Change which model support_agent runs on"},
    {"id": "t09", "server": "billing", "worded": True, "task": "Show me the latest invoices"},
    {"id": "t10", "server": "monitoring", "worded": False, "task": "Is the registry up, or is it down right now?"},
    {"id": "t11", "server": "calendar", "worded": True, "task": "What's on my schedule tomorrow?"},
    {"id": "t12", "server": "github", "worded": False, "task": "Find where the retry limit is set in the source"},
]

# one user's memories; importance is 1 to 10, as in Module 4 Lesson 11
MEMORIES = [
    {"id": "m01", "content": "Priya owns support_agent.", "type": "semantic", "source": "user",
     "created": "2026-06-02T09:10:00", "tags": ["support_agent", "ownership"], "importance": 8},
    {"id": "m02", "content": "The billing dashboard is checked daily.", "type": "semantic", "source": "user",
     "created": "2026-06-05T11:00:00", "tags": ["billing"], "importance": 4},
    {"id": "m03", "content": "support_agent status notes go to Priya weekly.", "type": "procedural", "source": "user",
     "created": "2026-06-09T15:30:00", "tags": ["support_agent", "reporting"], "importance": 6},
    {"id": "m04", "content": "Status of search_agent: migrating.", "type": "semantic", "source": "tool",
     "created": "2026-06-11T08:45:00", "tags": ["search_agent"], "importance": 3},
    {"id": "m05", "content": "The user wants summaries as bullet points.", "type": "procedural", "source": "user",
     "created": "2026-06-12T10:00:00", "tags": ["preferences", "format"], "importance": 7},
    {"id": "m06", "content": "The user prefers short answers without a preamble.", "type": "procedural", "source": "user",
     "created": "2026-06-12T10:02:00", "tags": ["preferences", "format"], "importance": 7},
    {"id": "m07", "content": "research_agent moves from claude-legacy to claude-sonnet before 31 October.",
     "type": "semantic", "source": "tool", "created": "2026-07-03T14:20:00", "tags": ["research_agent", "migration"],
     "importance": 9},
    {"id": "m08", "content": "notes_agent's target model is claude-haiku.", "type": "semantic", "source": "tool",
     "created": "2026-07-03T14:22:00", "tags": ["notes_agent", "migration"], "importance": 6},
    {"id": "m09", "content": "On 27 August the registry was down for 42 minutes during a database failover.",
     "type": "episodic", "source": "tool", "created": "2026-08-27T15:10:00", "tags": ["incident", "registry"],
     "importance": 8},
    {"id": "m10", "content": "The user was paged for the registry outage and asked for the timeline afterwards.",
     "type": "episodic", "source": "agent", "created": "2026-08-27T16:00:00", "tags": ["incident", "oncall"],
     "importance": 5},
    {"id": "m11", "content": "The user is on the platform on-call rota.", "type": "semantic", "source": "user",
     "created": "2026-06-01T09:00:00", "tags": ["oncall"], "importance": 7},
    {"id": "m12", "content": "Tom is the Search team's contact for kb-search.", "type": "semantic", "source": "user",
     "created": "2026-06-20T13:00:00", "tags": ["kb-search", "contacts"], "importance": 5},
    {"id": "m13", "content": "kb-search's cache TTL change caused research_agent's stale answers in June.",
     "type": "episodic", "source": "tool", "created": "2026-06-24T10:30:00", "tags": ["incident", "kb-search"],
     "importance": 6},
    {"id": "m14", "content": "billing_agent's monthly spending cap is a finance matter; the user can't see it.",
     "type": "semantic", "source": "agent", "created": "2026-07-15T09:40:00", "tags": ["billing_agent"],
     "importance": 4},
    {"id": "m15", "content": "The user's team deploys on Tuesdays and Thursdays.", "type": "semantic", "source": "user",
     "created": "2026-06-15T12:00:00", "tags": ["deploy", "schedule"], "importance": 6},
    {"id": "m16", "content": "Rotate a leaked registry key first, investigate second.", "type": "procedural",
     "source": "user", "created": "2026-07-14T17:00:00", "tags": ["security", "keys"], "importance": 9},
    {"id": "m17", "content": "The user drafts incident reports in the team's wiki template.", "type": "procedural",
     "source": "user", "created": "2026-07-01T09:30:00", "tags": ["incident", "writing"], "importance": 5},
    {"id": "m18", "content": "triage_agent hands tickets it can't close to support_agent.", "type": "semantic",
     "source": "tool", "created": "2026-06-18T11:15:00", "tags": ["triage_agent", "support_agent"], "importance": 5},
    {"id": "m19", "content": "The overview dashboard showed no agents during the registry outage.", "type": "episodic",
     "source": "tool", "created": "2026-08-27T15:20:00", "tags": ["incident", "monitoring"], "importance": 6},
    {"id": "m20", "content": "The user asked for latency figures in milliseconds, not seconds.", "type": "procedural",
     "source": "user", "created": "2026-07-22T10:10:00", "tags": ["preferences", "units"], "importance": 6},
    {"id": "m21", "content": "The user's manager is Grace Okafor.", "type": "semantic", "source": "user",
     "created": "2026-06-01T09:05:00", "tags": ["people"], "importance": 5},
    {"id": "m22", "content": "Dashboards should use their own registry keys, not an agent's.", "type": "procedural",
     "source": "agent", "created": "2026-08-20T14:00:00", "tags": ["registry", "keys", "dashboards"],
     "importance": 7},
    {"id": "m23", "content": "Asked about the rate limit on 21 August; it is 60 requests per minute per key.",
     "type": "episodic", "source": "tool", "created": "2026-08-21T09:00:00", "tags": ["registry", "rate limit"],
     "importance": 4},
    {"id": "m24", "content": "The user is writing a proposal to move billing_agent to the priority tier.",
     "type": "episodic", "source": "user", "created": "2026-09-10T16:45:00", "tags": ["billing_agent", "tiers"],
     "importance": 6},
]

RECALL_TASKS = [
    {"id": "r01", "worded": True, "task": "Draft the weekly status note on support_agent",
     "relevant": ["m01", "m03"]},
    {"id": "r02", "worded": False, "task": "Who should I send the update about the customer-facing assistant to?",
     "relevant": ["m01", "m03"]},
    {"id": "r03", "worded": True, "task": "Summarise the registry outage timeline",
     "relevant": ["m09", "m10", "m19"]},
    {"id": "r04", "worded": False, "task": "What happened when the database failed over in August?",
     "relevant": ["m09", "m19"]},
    {"id": "r05", "worded": True, "task": "Which model is research_agent migrating to?", "relevant": ["m07"]},
    {"id": "r06", "worded": False, "task": "What deadline do we have for moving off the old model?",
     "relevant": ["m07"]},
    {"id": "r07", "worded": False, "task": "How should I format my reply to this user?",
     "relevant": ["m05", "m06", "m20"]},
    {"id": "r08", "worded": True, "task": "Who is the contact for kb-search?", "relevant": ["m12"]},
    {"id": "r09", "worded": False, "task": "Someone found a credential in the logs. What do I do first?",
     "relevant": ["m16"]},
    {"id": "r10", "worded": False, "task": "Which days does the team ship changes?", "relevant": ["m15"]},
    {"id": "r11", "worded": True, "task": "What is the registry rate limit per key?", "relevant": ["m23"]},
    {"id": "r12", "worded": False, "task": "Who do I report to?", "relevant": ["m21"]},
]

PAIRS = [
    {"id": "p01", "label": "duplicate", "a": "Priya owns support_agent.", "b": "support_agent belongs to Priya."},
    {"id": "p02", "label": "duplicate", "a": "The user wants summaries as bullet points.",
     "b": "Summaries for this user should be bulleted lists."},
    {"id": "p03", "label": "duplicate", "a": "The user's team deploys on Tuesdays and Thursdays.",
     "b": "Releases from this team go out every Tuesday and Thursday."},
    {"id": "p04", "label": "duplicate", "a": "The user's manager is Grace Okafor.",
     "b": "Grace Okafor is the person the user reports to."},
    {"id": "p05", "label": "duplicate", "a": "Rotate a leaked registry key first, investigate second.",
     "b": "If a registry key leaks, rotate it before investigating."},
    {"id": "p06", "label": "duplicate", "a": "The user prefers short answers without a preamble.",
     "b": "Keep replies brief and skip the introduction."},
    {"id": "p07", "label": "duplicate", "a": "The billing dashboard is checked daily.",
     "b": "Someone looks at the billing dashboard every day."},
    {"id": "p08", "label": "related", "a": "Priya owns support_agent.", "b": "Priya owns billing_agent."},
    {"id": "p09", "label": "related", "a": "The user wants summaries as bullet points.",
     "b": "The user wants latency figures in milliseconds."},
    {"id": "p10", "label": "related", "a": "research_agent moves to claude-sonnet before 31 October.",
     "b": "notes_agent's target model is claude-haiku."},
    {"id": "p11", "label": "related", "a": "The registry was down for 42 minutes on 27 August.",
     "b": "The overview dashboard showed no agents during the registry outage."},
    {"id": "p12", "label": "related", "a": "Tom is the Search team's contact for kb-search.",
     "b": "kb-search's cache change caused stale answers in June."},
    {"id": "p13", "label": "related", "a": "The user's team deploys on Tuesdays and Thursdays.",
     "b": "The user's team holds its planning meeting on Mondays."},
    {"id": "p14", "label": "contradiction", "a": "Tom owns support_agent.", "b": "Priya owns support_agent."},
    {"id": "p15", "label": "contradiction", "a": "The user wants summaries as bullet points.",
     "b": "The user wants summaries as flowing paragraphs, never bullets."},
    {"id": "p16", "label": "contradiction", "a": "The registry rate limit is 60 requests per minute per key.",
     "b": "The registry rate limit is 100 requests per minute per key."},
    {"id": "p17", "label": "contradiction", "a": "The user's team deploys on Tuesdays and Thursdays.",
     "b": "The user's team deploys on Mondays and Wednesdays."},
    {"id": "p18", "label": "contradiction", "a": "notes_agent's target model is claude-haiku.",
     "b": "notes_agent's target model is claude-sonnet."},
]
