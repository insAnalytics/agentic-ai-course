"""Module 5 Lesson 12's graph extraction: model-written entities and relationships, one extraction per
chunk (Lesson 3's structured chunks, 200 tokens), for the architecture overview, the monitoring guide,
and the four incident and security reports.

Written for the course by Claude, reading each chunk with the prompt below, as an extraction model
would. Names are left as each chunk writes them (normalising them is part of the lesson).
Each triple is [subject, relation, object].
"""

EXTRACTION_PROMPT = """Extract the entities and relationships in this passage, as a JSON list of
[subject, relation, object] triples. Use only these relations:

- depends_on: a service or agent calls, or needs, another service to work
- hands_work_to: an agent passes work to another agent
- owned_by: a service belongs to a team
- affected: an incident affected a service or agent
- fired: an alert fired during an incident
- watches: an alert watches a service
- root_cause: the cause of an incident, in a short phrase
- monitoring_gap: something monitoring missed during an incident, in a short phrase

Name entities as the passage names them. The passage comes from the document and section below,
which may name things the passage itself doesn't. Return [] if there are none.

<document>{title}</document>
<section>{section}</section>
<passage>
{chunk}
</passage>"""

TRIPLES = {
    "D04:0": [],
    "D04:1": [
        ["registry-api", "owned_by", "Platform team"],
        ["registry-db", "owned_by", "Platform team"],
        ["registry-api", "depends_on", "registry-db"],
        ["auth-service", "owned_by", "Identity team"],
        ["monitoring", "owned_by", "Observability team"],
        ["kb-search", "owned_by", "Search team"],
    ],
    "D04:2": [
        ["registry-api", "depends_on", "auth-service"],
        ["registry-api", "depends_on", "registry-db"],
        ["Monitoring", "depends_on", "registry-api"],
    ],
    "D04:3": [
        ["support_agent", "depends_on", "registry-api"],
        ["support_agent", "depends_on", "kb-search"],
        ["triage_agent", "hands_work_to", "support_agent"],
    ],
    "D04:4": [
        ["registry-api", "owned_by", "Platform"],
        ["registry-db", "owned_by", "Platform"],
        ["auth-service", "owned_by", "Identity"],
        ["monitoring", "owned_by", "Observability"],
        ["kb-search", "owned_by", "Search"],
    ],
    "D08:0": [["monitoring", "depends_on", "the registry"]],
    "D08:1": [["RegistryUnreachable", "watches", "the registry"]],
    "D08:2": [["monitoring", "depends_on", "the registry"]],
    "D08:3": [],
    "D08:4": [],
    "D09:0": [
        ["INC-2041", "affected", "billing_agent"],
        ["billing_agent", "depends_on", "payments-gateway"],
    ],
    "D09:1": [
        ["INC-2041", "fired", "AgentErrorRateHigh"],
        ["INC-2041", "monitoring_gap", "alert fired outside paging hours, so nobody was paged"],
        ["payments-gateway", "depends_on", "auth-service"],
    ],
    "D09:2": [
        ["payments-gateway", "depends_on", "auth-service"],
        ["INC-2041", "root_cause", "an expired certificate in auth-service"],
        ["INC-2041", "affected", "payments-gateway"],
    ],
    "D09:3": [],
    "D10:0": [
        ["INC-2067", "affected", "research_agent"],
        ["INC-2067", "monitoring_gap", "no alert fired; a user noticed the outdated results"],
    ],
    "D10:1": [
        ["research_agent", "depends_on", "kb-search"],
        ["INC-2067", "affected", "kb-search"],
        ["INC-2067", "root_cause", "a cache setting changed without review"],
    ],
    "D10:2": [["INC-2067", "monitoring_gap", "nothing measures whether results are current"]],
    "D10:3": [],
    "D11:0": [
        ["INC-2093", "affected", "registry-api"],
        ["registry-api", "depends_on", "registry-db"],
        ["INC-2093", "affected", "monitoring"],
    ],
    "D11:1": [
        ["INC-2093", "fired", "RegistryUnreachable"],
        ["INC-2093", "affected", "support_agent"],
        ["INC-2093", "affected", "triage_agent"],
        ["triage_agent", "hands_work_to", "support_agent"],
    ],
    "D11:2": [
        ["INC-2093", "root_cause", "standby replication lag that nothing alerted on"],
        ["INC-2093", "monitoring_gap", "no alert on standby replication lag"],
        ["INC-2093", "monitoring_gap", "monitoring showed no agents while the registry was down"],
        ["Monitoring", "depends_on", "the registry"],
    ],
    "D11:3": [],
    "D12:0": [["SEC-014", "affected", "support_agent"]],
    "D12:1": [["SEC-014", "root_cause", "a debug flag left on after an investigation"]],
    "D12:2": [],
}


COMMUNITY_PROMPT = """These entities and relationships form one group in a graph built from the company's
documents. Summarise what the group is about in two or three sentences: the entities that matter
most, how they relate, and any incidents, causes or monitoring gaps it contains.

{relationships}"""

# Community summaries, keyed by one entity in each community (communities are found at run time,
# so a summary is matched to the community that contains its key entity).
COMMUNITY_SUMMARIES = {
    "INC-2041": (
        "billing_agent depends on payments-gateway, which checks every certificate with auth-service, owned by "
        "the Identity team. In INC-2041 an expired certificate in auth-service stopped billing_agent issuing "
        "invoices; AgentErrorRateHigh fired, but outside paging hours, so nobody was paged."),
    "INC-2067": (
        "research_agent depends on kb-search, owned by the Search team. In INC-2067 a cache setting changed "
        "without review made research_agent answer from outdated articles for a week; no alert fired, because "
        "nothing measures whether results are current."),
    "INC-2093": (
        "support_agent, and triage_agent through it, were affected by two incidents. In INC-2093 standby "
        "replication lag that nothing alerted on stretched a registry failover to 42 minutes, and monitoring "
        "showed no agents while the registry was down. In SEC-014 a debug flag left on after an investigation "
        "wrote support_agent's registry key to its logs."),
    "registry-api": (
        "registry-api, owned by the Platform team, depends on registry-db and auth-service. Monitoring, owned "
        "by the Observability team, gets its list of agents from registry-api, and RegistryUnreachable watches "
        "the registry."),
}
