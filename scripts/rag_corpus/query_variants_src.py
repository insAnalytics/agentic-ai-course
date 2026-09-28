"""Model-written query variants for Module 5 Lesson 7, written for the course by Claude.

Rewrites follow REWRITE_PROMPT, sub-queries follow SPLIT_PROMPT, hypothetical
documents follow HYDE_PROMPT. For questions about the company's private
registry documents, the texts were written as a model without access to those
documents would write them: from the question and conversation only, with any
specifics guessed rather than known. For the public-documentation questions
(Prometheus, Alertmanager, PostgreSQL), they draw on general knowledge, as any
model trained on public text would.
"""

REWRITE_PROMPT = ("Rewrite the user's latest question as a standalone search query for the company's internal "
                  "documentation. Use only what the question and the conversation say: resolve references like "
                  "'it' or 'the second one', keep identifiers exactly, and don't add facts or guesses. "
                  "Reply with the query only.")
SPLIT_PROMPT = ("If the question asks for more than one thing, split it into one search query per thing. "
                "Reply with one query per line and nothing else.")
HYDE_PROMPT = ("Write a short passage, in the style of technical documentation, that answers the question. "
               "Reply with the passage only.")

REWRITES = {
    "q01": "using the most powerful model for an agent",
    "q02": "how code running as an agent finds out its own agent identity",
    "q03": "agent settings changed but agent still behaves the old way",
    "q04": "safest way to remove an agent that is no longer used",
    "q05": "first steps when an agent key may have been leaked",
    "q06": "dashboards show zero agents while agents are still running",
    "q07": "list all agents beyond the first page of results",
    "q08": "which alerts page the on-call engineer at night",
    "q09": "REG-1007 error code meaning",
    "q10": "MON-2002",
    "q11": "INC-2093 incident summary",
    "q12": "X-Registry-Key header purpose",
    "q13": "how to fix REG-1003 errors",
    "q14": "AgentErrorRateHigh alert firing condition",
    "q15": "registry v2.4 changes",
    "q16": "how long old and new registry keys can both stay valid",
    "q17": "search cache hit rate during an agent latency spike that indicates the cache was flushed",
    "q18": "whether to restart a slow agent",
    "q19": "roll back a model migration when the new model misbehaves",
    "q20": "check that a newly deployed registry key works",
    "q21": "registry rate limit and the error returned when it is exceeded",
    "q22": "models allowed for standard-tier agents and what happens when an unallowed model is assigned",
    "q23": "claude-legacy switch-off date and agents still using claude-legacy",
    "q24": "changes made after INC-2041 expired auth-service certificate",
    "q25": "model notes_agent should move to from claude-legacy",
    "q26": "first step when the AgentLatencyHigh alert fires",
    "q27": "model the agent affected by INC-2067 must move to and deadline",
    "q28": "error code monitoring reports when the service down in INC-2093 is unreachable",
    "q29": "what the first alert that fired in INC-2041 measures",
    "q30": "agents that stop working if auth-service goes down",
    "q31": "services and agents that depend on kb-search",
    "q32": "what is affected if registry-db fails",
    "q33": "recurring causes across incidents",
    "q34": "monitoring gaps exposed by incidents",
    "q35": "registry rate limit",
    "q36": "how often a custom dashboard can poll the registry",
    "q37": "payments-gateway uptime SLA",
    "q38": "how to create a new tier",
    "q39": "on-call engineer who handled INC-2093",
    "q40": "why support_agent's registry key was rotated in July",
    "q41": "billing_agent monthly spending cap",
    "q42": "Prometheus alerting rule wait before firing",
    "q43": "Alertmanager mute alerts for a cluster when a cluster-unreachable alert is firing",
    "q44": "measure PostgreSQL standby replication lag behind the primary",
    "q45": "Prometheus rate versus irate for alerting",
    "q46": "Alertmanager one notification for many alerts when many systems fail",
    "h01": "two services sharing one registry key",
    "h02": "REG-1011",
    "h03": "regctl command to issue a key",
    "h04": "usual source of slowdown in an agent latency investigation",
    "h05": "what a read key can do and the error it gets on a write",
    "h06": "team to page when the search service research_agent relies on is slow",
    "h07": "agents affected if registry-api goes down",
    "h08": "creating a new agent on the legacy model",
    "h09": "kb-search latency target",
    "h10": "PostgreSQL hot standby",
    "h11": "how the INC-2067 kb-search stale cache problem was noticed",
}

SUB_QUERIES = {
    "q21": ['registry rate limit per key', 'error returned when the registry rate limit is exceeded'],
    "q22": ['models a standard-tier agent can use', 'error when assigning a model that is not allowed'],
    "q23": ['when claude-legacy is switched off', 'which agents still use claude-legacy'],
    "h05": ['what a read-scoped registry key can do', 'error a read key gets when it tries to write'],
}

HYDE = {
    "q01": 'Agents can be configured to use any of the models available to your organisation. To use the '
           "most capable model, update the agent's model setting in its configuration. Larger models cost "
           'more per request and may have lower rate limits, so check your budget and quota before '
           'switching.',
    "q02": 'An agent can discover its own identity by reading the agent ID from its environment or by '
           "calling the identity endpoint with its credentials. The response includes the agent's name, ID "
           'and configuration, which code can use to adjust its behaviour at runtime.',
    "q03": 'Configuration changes are cached and may take a few minutes to propagate. If an agent still '
           'behaves the old way after you edit its settings, restart the agent or clear its configuration '
           'cache so that it reloads the latest values.',
    "q04": 'To remove an agent you no longer need, first disable it so it stops receiving work, confirm '
           'nothing depends on it, then delete it. Deleting an agent is permanent; export its configuration '
           'first if you might need it again.',
    "q05": 'If a key may have leaked, revoke it immediately so it can no longer be used, then issue a new '
           'key and update every service that used the old one. Review the audit logs for any activity with '
           'the leaked key.',
    "q06": 'If dashboards show zero agents while agents are running, the metrics pipeline has probably '
           "stopped receiving data. Check that the metrics exporter and the dashboard's data source are "
           'healthy; the agents themselves are usually unaffected.',
    "q07": 'List endpoints return results in pages. To retrieve every agent, request the first page, then '
           'use the page token in the response to request the next page, repeating until no token is '
           'returned. You can also increase the page size up to the maximum.',
    "q08": 'Critical alerts page the on-call engineer at any time of day, including at night. Warning-level '
           'alerts are routed to a channel and reviewed during working hours, so only alerts marked critical'
           ' will wake someone up.',
    "q09": 'REG-1007 is a registry error code indicating that a request failed validation. The error message'
           ' describes which field was invalid. Correct the request and retry.',
    "q10": 'MON-2002 is a monitoring error code. It indicates a problem with the monitoring configuration, '
           'such as an invalid or duplicate scrape target. Check the monitoring configuration for errors.',
    "q11": 'Incident INC-2093 summary: a service outage affected several dependent systems. The incident '
           'report describes the timeline, the root cause, the impact on users and the follow-up actions '
           'taken to prevent a recurrence.',
    "q12": 'The X-Registry-Key header carries the API key used to authenticate requests to the registry. '
           'Requests without a valid key in this header are rejected with an authentication error.',
    "q13": 'REG-1003 errors indicate an authentication or permission problem. Check that the request '
           'includes a valid key and that the key has permission for the operation. Regenerate the key if it'
           ' has expired.',
    "q14": "The AgentErrorRateHigh alert fires when the proportion of an agent's requests that fail exceeds "
           'a configured threshold for a sustained period.',
    "q15": 'Version 2.4 introduced several improvements, including new API endpoints, performance '
           'enhancements and bug fixes. See the release notes for breaking changes and migration steps.',
    "q16": 'When you rotate a registry key, the old key remains valid for a grace period so that services '
           'can switch over without downtime. After the grace period, typically seven days, the old key is '
           'revoked automatically.',
    "q17": 'During an agent latency spike, check the search cache hit rate. A hit rate that drops sharply, '
           'for example below 50%, suggests the cache was flushed or restarted, and latency should recover '
           'as the cache warms up again.',
    "q18": 'Restarting a slow agent often clears temporary problems such as memory leaks or stuck '
           'connections, and is a reasonable first step if users are affected. If the slowness returns, '
           'investigate further.',
    "q19": "To roll back a model migration, change the agent's model setting back to the previous model and "
           'redeploy. Keep the previous configuration until the new model has been validated, so the '
           'rollback is quick.',
    "q20": 'After deploying a new registry key, verify it by making an authenticated test request, such as '
           'listing agents. A successful response confirms the key is valid and correctly deployed.',
    "q21": 'The registry enforces a rate limit of 1,000 requests per hour per key. Requests over the limit '
           'are rejected with HTTP 429 Too Many Requests; wait until the limit resets before retrying.',
    "q22": 'Standard-tier agents can use the standard set of models. Assigning a model that is not available'
           " on the agent's tier fails with a validation error explaining that the model is not permitted.",
    "q23": 'The claude-legacy model is being retired and will be switched off at the end of its deprecation '
           'period. Agents still using it must migrate to a supported model before then; the migration guide'
           ' lists the affected agents.',
    "q24": 'Following INC-2041, the team added alerting for certificate expiry and reviewed the certificate '
           'renewal process for auth-service, so that an expiring certificate is caught before it causes an '
           'outage.',
    "q25": 'notes_agent should move from claude-legacy to a currently supported model of similar capability.'
           " Compare the candidate models on the agent's typical tasks before switching.",
    "q26": 'When the AgentLatencyHigh alert fires, first check recent deployments for changes, then look at '
           "the agent's logs and resource usage for errors or saturation.",
    "q27": 'The agent affected by INC-2067 must move to a supported model before its current model is '
           'retired. The migration deadline is listed in the deprecation notice.',
    "q28": 'When monitoring cannot reach a service, it reports an unreachable-target error and raises an '
           'alert. The error code identifies the service and the kind of failure.',
    "q29": 'The first alert to fire in an incident usually measures the latency or availability of the '
           'affected service, showing that requests have become slow or are failing.',
    "q30": 'If auth-service goes down, any agent that needs to authenticate requests will stop working, '
           'because it cannot validate credentials. Agents with cached credentials may continue briefly.',
    "q31": 'kb-search is used by services that need to search the knowledge base, such as help-desk tools '
           'and chat assistants.',
    "q32": 'If registry-db fails, the registry cannot read or write agent records, so anything that depends '
           'on the registry, such as agents and admin tools, is affected until the database is restored.',
    "q33": 'Common causes across incidents include configuration changes, bugs in new releases, capacity '
           'limits and outages at third-party providers.',
    "q34": 'Incidents have exposed gaps such as missing alerts for slow degradation, alerts routed to the '
           'wrong team, and dashboards without clear owners.',
    "q35": "The registry enforces a rate limit of 1,000 requests per hour per key.",
    "q36": 'Custom dashboards should poll the registry no more than once a minute to stay within the rate '
           'limit and avoid slowing the registry for other clients.',
    "q37": "payments-gateway has an uptime SLA of 99.9%, measured monthly.",
    "q38": "To create a new tier, define the tier's name, the models it allows and its limits in the tier "
           'configuration, then apply the change with an administrator key.',
    "q39": 'INC-2093 was handled by the on-call engineer for the platform team at the time of the incident.',
    "q40": "support_agent's registry key was rotated in July as part of the regular key rotation schedule.",
    "q41": 'billing_agent has a monthly spending cap that limits its model usage. Owners are notified as '
           'usage approaches the cap, and requests beyond it may be blocked.',
    "q42": "Prometheus alerting rules have an optional for clause. When an alert's expression first returns "
           'results, the alert becomes pending; it only fires once the condition has been true continuously '
           'for the duration given in for, such as for: 5m. This avoids alerts for brief spikes.',
    "q43": 'Alertmanager inhibition rules mute alerts when another alert is already firing. For example, an '
           'inhibit rule can suppress all warning alerts for a cluster while a critical ClusterUnreachable '
           'alert for the same cluster is firing, using equal labels to match the cluster.',
    "q44": 'Replication lag can be measured by comparing WAL positions. On the primary, the '
           "pg_stat_replication view shows each standby's sent, write, flush and replay LSNs; compare them "
           'with pg_current_wal_lsn(). On the standby, pg_last_wal_receive_lsn() and '
           'pg_last_wal_replay_lsn() show how far it has received and replayed.',
    "q45": 'Use rate for alerts. rate calculates the average per-second increase over the whole range and is'
           ' stable, while irate uses only the last two samples and is very volatile, which suits graphs of '
           'fast-moving counters but makes alerts flap.',
    "q46": 'Alertmanager groups related alerts into a single notification. The group_by setting in a route '
           'chooses the labels alerts are grouped by, and group_wait and group_interval control how long it '
           'waits to batch alerts, so a large outage produces one notification instead of hundreds.',
    "h01": 'Sharing one registry key between services is not recommended. Each service should have its own '
           'key so that access can be revoked individually and audit logs show which service made each '
           'request.',
    "h02": 'REG-1011 is a registry error code indicating a conflict with the current state of a resource, '
           'such as an update to an agent that was modified concurrently. Fetch the latest version and '
           'retry.',
    "h03": 'To issue a key with regctl, run regctl key create --agent <agent-id>. The command prints the new'
           ' key once; store it securely.',
    "h04": 'Latency spikes in agents usually come from higher traffic, larger prompts or slower responses '
           'from the model provider.',
    "h05": 'A read key can call read-only endpoints, such as listing and fetching agents. Attempting a write'
           ' with a read key fails with a permission error, typically HTTP 403 Forbidden.',
    "h06": 'If the search service used by research_agent is slow, page the team that owns the search '
           'service, listed in the service catalogue.',
    "h07": 'If registry-api goes down, any agent that reads its configuration from the registry at startup '
           'or during requests will be affected, along with tools that manage agents.',
    "h08": 'New agents cannot be created on deprecated models. Choose a currently supported model when '
           'creating an agent.',
    "h09": "kb-search targets a p95 latency of 200 ms for search requests.",
    "h10": 'A hot standby is a PostgreSQL standby server that accepts read-only queries while it '
           'continuously applies WAL from the primary. It can serve reads to spread load, and can be '
           'promoted to become the primary if the primary fails.',
    "h11": 'The stale results in INC-2067 were noticed during a routine review of search quality metrics, '
           'which showed answers citing outdated articles.',
}
