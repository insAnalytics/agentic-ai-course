---
doc_id: D05
title: "Runbook: agent latency spike"
date: 2026-07-09
access: [oncall]
source_type: official
---
# Runbook: agent latency spike

## When to use this runbook

Use it when the `AgentLatencyHigh` alert fires for an agent, or when users report that an agent is taking much longer than usual to answer. The alert fires when an agent's p95 response time stays above 8 seconds for 10 minutes.

## Step 1: Confirm it on the dashboard

Open the agent's latency panel and check that the rise is real and still happening. A single slow session can trip a short-lived spike that recovers before you get there. If p95 is back under 8 seconds, note it in the alert thread and stop.

## Step 2: Find the slow step

Open a few recent slow sessions and look at the time spent in each tool call and each model call. Most spikes come from one tool that got slow, not from the model. Write down which tool, and when it started.

## Step 3: Check the cache hit rate

If the slow tool is a search, check the cache hit rate on its panel. Below 40% usually means the cache was flushed or restarted, and it refills on its own within about 10 minutes. Wait that long before escalating. If the hit rate stays low after 10 minutes, the cache itself may be misconfigured.

## Step 4: Check for rate limiting

Look for `REG-1009` responses in the agent's logs. An agent that's being rate-limited waits for `Retry-After` on every call, which looks like latency. If you find them, check whether another process is sharing the agent's key.

## Step 5: Escalate

If you've found the slow service, page its owning team with the agent name, the tool, the start time and what you've ruled out. If you haven't, page Platform. Don't restart the agent to "see if it helps": a restart drops the sessions in progress and hides the evidence.
