---
doc_id: D03
title: Registry changelog
date: 2026-08-18
access: [all-staff]
source_type: official
---
# Registry changelog

## v2.6 — 2026-08-18

- Added `GET /agents/me`, which returns the agent that owns the calling key.
- The registry can now enter maintenance mode. During maintenance, reads keep working and writes return `REG-1011`.
- Error responses now always include `name` alongside `code`.

## v2.5 — 2026-07-01

- Deprecated the `claude-legacy` model. Creating an agent with it, or changing an agent to it, now returns `REG-1010`.
- Agents already on `claude-legacy` keep running until 2026-10-31, when the model is switched off. Owners must move them before then; see the model migration runbook.

## v2.4 — 2026-05-12

- Lowered the rate limit from 100 to 60 requests per minute per key. Some internal dashboards were polling hard enough to slow the registry for agents.
- Rate-limited responses (`REG-1009`) now include a `Retry-After` header.

## v2.3 — 2026-03-10

- Added the `tier` field to every agent. Existing agents were set to `standard`.
- Each tier now has an allowlist of models. Assigning a model outside it returns `REG-1007`.

## v2.2 — 2026-01-20

- `GET /agents` now pages with `cursor` and `next_cursor`. The `offset` parameter still works but is deprecated.
- Page size is set with `limit`: default 20, maximum 100.
