---
doc_id: D14
title: Agent owners' FAQ
date: 2026-09-10
access: [all-staff]
source_type: official
---
# Agent owners' FAQ

## My agent suddenly stopped answering. What happened?

Check its status first: someone may have paused it, or it may have hit a spending cap. Then check whether it's on a model that's being switched off. If it's running but every task fails, look at the errors in its logs. An error code starting with `REG-` comes from the registry, and the error code reference explains each one.

## Can my agent use the biggest model?

Only on the priority tier. Standard-tier agents can use the smaller and mid-sized models. Moving to priority needs a sign-off from whoever holds your team's budget, and after that you can change the model.

## How do I find out which model my agent is on?

Look it up in the registry: its record has a `model` field. If you're writing code that runs as the agent, ask the registry "who am I?" with the agent's own key and you'll get the same record back.

## Why does my agent get told to slow down?

Each key gets a fixed number of registry calls per minute. If two things share a key, say the agent and a dashboard, they share that allowance. Give the dashboard its own read-only key.

## Who do I ask about my agent's costs?

Your team's budget holder for day-to-day questions. Some agents have spending caps managed by Finance; if yours does, Finance will have told you.

## I changed my agent's settings but nothing happened.

Changes apply when the agent starts its next session, not partway through one that's already running. Wait for the current sessions to finish, or check again in a few minutes.
