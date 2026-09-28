---
doc_id: D08
title: Monitoring guide
date: 2026-03-02
access: [all-staff]
source_type: official
---
# Monitoring guide

## What monitoring collects

For every agent, monitoring records response time (as p50 and p95), error rate, and the number of sessions. It learns which agents exist by asking the registry for the agent list every 30 seconds, so a new agent appears on the dashboards within a minute of being created.

## Alerts

| Alert | Fires when |
|---|---|
| `AgentLatencyHigh` | p95 response time above 8 seconds for 10 minutes |
| `AgentErrorRateHigh` | more than 5% of sessions end in an error over 15 minutes |
| `RegistryUnreachable` | three registry polls in a row fail (`MON-2002`) |

Alerts go to the on-call channel and page the on-call engineer between 08:00 and 20:00. Outside those hours, only `RegistryUnreachable` pages.

## When RegistryUnreachable fires

Check the registry's status page first. While the registry is down, monitoring can't refresh its agent list, so dashboards may show no agents at all even though the agents are still running. Don't read an empty dashboard as "every agent is down."

## Dashboards

Each agent has a panel with latency, error rate and sessions. The overview dashboard shows every active agent on one screen, sorted by p95. Panels refresh every 30 seconds and lag real time by up to a minute.

## Polling the registry from your own dashboards

If you build your own dashboard on top of the registry, poll no more than once every few seconds. The registry allows 100 requests per minute per key, and a dashboard that uses most of that leaves nothing for the agent sharing its key.
