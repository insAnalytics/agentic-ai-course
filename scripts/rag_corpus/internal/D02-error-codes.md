---
doc_id: D02
title: Error code reference
date: 2026-08-18
access: [all-staff]
source_type: official
---
# Error code reference

## Authentication errors

| Code | Name | HTTP | Meaning |
|---|---|---|---|
| `REG-1001` | `MISSING_KEY` | 401 | The request had no `X-Registry-Key` header. |
| `REG-1002` | `INVALID_KEY` | 401 | The key isn't one the registry issued. Check for a truncated or mistyped key. |
| `REG-1003` | `KEY_REVOKED` | 401 | The key was valid but has been revoked. Issue a new key; a revoked key can't be restored. |
| `REG-1004` | `FORBIDDEN_FIELD` | 403 | The key's scope doesn't allow this change. Writes need a `write` key. |

## Request errors

| Code | Name | HTTP | Meaning |
|---|---|---|---|
| `REG-1005` | `AGENT_NOT_FOUND` | 404 | No agent has this `agent_id`. Ids are case-sensitive. |
| `REG-1006` | `AGENT_NAME_TAKEN` | 409 | An agent with this `agent_id` already exists, including a retired one. |
| `REG-1007` | `MODEL_NOT_ALLOWED` | 422 | The model isn't on the allowlist for the agent's tier. Change the tier first, or pick an allowed model. |
| `REG-1008` | `VALIDATION_FAILED` | 422 | The body is missing a required field or has a value of the wrong type. The message names the field. |
| `REG-1010` | `MODEL_DEPRECATED` | 422 | The model is deprecated and can't be newly assigned. Currently applies to `claude-legacy`. |

## Limits and availability

| Code | Name | HTTP | Meaning |
|---|---|---|---|
| `REG-1009` | `RATE_LIMITED` | 429 | The key made too many requests this minute. Wait the number of seconds in `Retry-After`, then retry. |
| `REG-1011` | `REGISTRY_READ_ONLY` | 503 | The registry is in maintenance mode. Reads work; writes are refused until maintenance ends. |

## Monitoring errors

These come from the monitoring service, not from the Registry API, but they appear in the same alert channels.

| Code | Name | Meaning |
|---|---|---|
| `MON-2001` | `SCRAPE_FAILED` | Monitoring couldn't collect metrics from one agent. Usually the agent is paused or restarting. |
| `MON-2002` | `REGISTRY_UNREACHABLE` | Monitoring failed to reach the Registry API three times in a row. It raises the `RegistryUnreachable` alert. |
