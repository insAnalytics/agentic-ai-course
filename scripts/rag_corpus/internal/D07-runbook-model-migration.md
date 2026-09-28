---
doc_id: D07
title: "Runbook: migrating agents off claude-legacy"
date: 2026-07-02
access: [all-staff]
source_type: official
---
# Runbook: migrating agents off claude-legacy

## Why and by when

`claude-legacy` was deprecated in v2.5 and will be switched off on 2026-10-31. Any agent still on it that day stops answering. No new agent can be put on it: the registry returns `REG-1010`.

## Which agents are affected

As of this writing, two active agents are on `claude-legacy`:

| Agent | Owner | Target model |
|---|---|---|
| `research_agent` | research-team | `claude-sonnet` |
| `notes_agent` | support-team | `claude-haiku` |

Owners can check any agent with `GET /agents/{agent_id}` and look at its `model` field.

## Step 1: Check the target is allowed

Both target models are allowed on the `standard` tier, so neither agent needs a tier change. If you'd rather move to `claude-opus`, the agent must move to the `priority` tier first, or the change fails with `REG-1007`.

## Step 2: Compare before you switch

Run 20 recent tasks through the target model and compare the results with what `claude-legacy` produced. Look for changes in format, not just in quality: a downstream step that parses the agent's output may break on a different model's phrasing.

## Step 3: Switch

Set the new model with `PATCH /agents/{agent_id}`. The change applies from each agent's next session.

## Step 4: Roll back if needed

You can't roll back to `claude-legacy`: the registry refuses it. If the new model misbehaves, set the agent's `status` to `paused` while you fix the problem, and tell its users.
