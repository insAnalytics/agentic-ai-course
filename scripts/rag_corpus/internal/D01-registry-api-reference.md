---
doc_id: D01
title: Registry API reference
date: 2026-08-18
access: [all-staff]
source_type: official
---
# Registry API reference

## Overview

The Registry API stores the configuration of every agent the company runs: its name, the model it uses, its tier, its owner and its status. Agents and internal tools read it to find out how an agent is configured, and owners write to it to change that configuration. The current version is v2.6.

All endpoints live under one base URL:

```
https://registry.internal.example/v2
```

Requests and responses are JSON. Timestamps are ISO 8601 in UTC.

## Authentication

Every request must carry a registry key in the `X-Registry-Key` header. A request without one is rejected with `REG-1001`, and a key the registry doesn't recognise is rejected with `REG-1002`.

```bash
curl https://registry.internal.example/v2/agents/me \
  -H "X-Registry-Key: $REGISTRY_KEY"
```

Keys have a scope. A `read` key can call every `GET` endpoint. A `write` key can also create, update and delete agents. Each key belongs to exactly one agent or one person, and the registry records which one made every change. Keys are issued and revoked with `regctl`; see the key rotation runbook.

## Listing agents

`GET /agents` returns agents in pages. Pass `limit` to set the page size (default 20, maximum 100). Each response includes a `next_cursor`; pass it back as `cursor` to get the next page. When `next_cursor` is `null`, there are no more pages.

```bash
curl "https://registry.internal.example/v2/agents?limit=50&cursor=eyJpZCI6IDUwfQ" \
  -H "X-Registry-Key: $REGISTRY_KEY"
```

```json
{
  "agents": [
    {"agent_id": "support_agent", "model": "claude-sonnet", "tier": "standard", "status": "active"}
  ],
  "next_cursor": "eyJpZCI6IDEwMH0"
}
```

You can filter by `status` (`active`, `paused` or `retired`) and by `owner`.

## Reading one agent

`GET /agents/{agent_id}` returns one agent's full record, or `REG-1005` if no agent has that id.

```json
{
  "agent_id": "research_agent",
  "model": "claude-legacy",
  "tier": "standard",
  "owner": "research-team",
  "status": "active",
  "updated_at": "2026-06-23T09:12:44Z"
}
```

`GET /agents/me` returns the agent that owns the key making the request. It's the quickest way to check that a newly deployed key works and belongs to the agent you expect.

## Creating an agent

`POST /agents` creates an agent. It needs a `write` key. The body must include `agent_id`, `model`, `tier` and `owner`; `status` defaults to `active`.

```json
{"agent_id": "triage_agent", "model": "claude-haiku", "tier": "standard", "owner": "support-team"}
```

Agent ids must be unique: reusing one returns `REG-1006`. The model must be allowed on the agent's tier (see "Tiers and models"), or the request fails with `REG-1007`.

## Updating an agent

`PATCH /agents/{agent_id}` changes one or more of `model`, `tier`, `owner` and `status`. Send only the fields you're changing. It needs a `write` key; a `read` key gets `REG-1004`.

```bash
curl -X PATCH https://registry.internal.example/v2/agents/research_agent \
  -H "X-Registry-Key: $REGISTRY_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "claude-sonnet"}'
```

A change takes effect on the agent's next session, not in the middle of one that's running. Setting `status` to `paused` stops new sessions from starting; `retired` also hides the agent from the default listing.

## Deleting an agent

`DELETE /agents/{agent_id}` removes an agent's record permanently. Prefer setting `status` to `retired`, which keeps the record and its change history. Delete only agents that were created by mistake.

## Tiers and models

Every agent has a tier, and each tier allows a fixed set of models:

| Tier | Allowed models |
|---|---|
| `standard` | `claude-haiku`, `claude-sonnet` |
| `priority` | `claude-haiku`, `claude-sonnet`, `claude-opus` |

Moving an agent to `claude-opus` therefore means moving it to the `priority` tier first, which needs approval from its owner's budget holder. `claude-legacy` is deprecated and can't be assigned to any agent; existing agents on it keep working until 2026-10-31.

## Rate limits

Each key may make 60 requests per minute. Requests past the limit get HTTP 429 with error `REG-1009` and a `Retry-After` header giving the number of seconds to wait. Limits apply per key, not per agent, so two processes sharing one key share one limit.

## Errors

Every error response has the same shape:

```json
{"error": {"code": "REG-1007", "name": "MODEL_NOT_ALLOWED", "message": "claude-opus is not allowed on tier standard"}}
```

The `code` is stable and safe to match on in code; the `message` is for people and may change. The full list is in the error code reference.
