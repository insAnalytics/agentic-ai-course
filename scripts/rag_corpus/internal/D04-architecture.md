---
doc_id: D04
title: Agent platform architecture overview
date: 2026-02-14
access: [all-staff]
source_type: official
---
# Agent platform architecture overview

## What the platform is

The agent platform is the set of services our agents run on. Agents are configured in the registry, look things up through shared services, and are watched by monitoring. This page describes the core services and how they connect. It doesn't cover every service an individual agent uses; each agent's owner documents those.

## Core services

- **registry-api** — the Registry API. Stores every agent's configuration. Owned by the Platform team.
- **registry-db** — the Postgres database behind registry-api, with a hot standby for failover. Owned by the Platform team.
- **auth-service** — validates registry keys and issues the internal certificates services use to talk to each other. Owned by the Identity team.
- **monitoring** — collects latency and error metrics for every agent and raises alerts. Owned by the Observability team.
- **kb-search** — search over the internal knowledge base, with a response cache in front of it. Owned by the Search team.

## How requests flow

When a request reaches registry-api, it first asks auth-service to validate the `X-Registry-Key` header, then reads or writes registry-db. If auth-service is slow, every registry request is slow; if registry-db is unavailable, registry-api can't answer at all.

Monitoring gets its list of agents from registry-api every 30 seconds, then collects metrics from each agent on the list.

## The agents that use them

`support_agent` answers customer questions. It looks up agent and account configuration through registry-api and searches help articles through kb-search. `triage_agent` reads incoming tickets and hands the ones it can't close to `support_agent`.

## Who to contact

Page the owning team through the on-call rota: Platform for registry-api and registry-db, Identity for auth-service, Observability for monitoring, and Search for kb-search.
