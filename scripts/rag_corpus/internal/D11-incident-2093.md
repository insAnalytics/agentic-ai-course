---
doc_id: D11
title: "Incident INC-2093: registry outage during database failover"
date: 2026-08-29
access: [all-staff]
source_type: official
---
# Incident INC-2093: registry outage during database failover

## Summary

On 2026-08-27, registry-api was unavailable for 42 minutes while registry-db failed over to its standby. Agents that look things up in the registry couldn't finish their tasks, and monitoring lost sight of every agent for the same period.

## Timeline

- 14:10 — The primary registry-db host failed a disk check and failover started.
- 14:11 — `RegistryUnreachable` fired and paged the on-call engineer. The overview dashboard went blank.
- 14:20 — `support_agent` sessions began failing on their first registry lookup. `triage_agent` kept running but couldn't hand tickets over, so 212 tickets queued.
- 14:52 — The standby finished catching up and registry-api recovered. The queued tickets were handed over by 15:05.

## What made it worse

The failover should have taken about 5 minutes. It took 42 because the standby had fallen 38 minutes behind the primary, and nothing alerted on that lag. For the whole outage, monitoring showed no agents at all, so the on-call engineer couldn't tell which agents were affected. Its agent list comes from the registry.

## What we changed

- An alert now fires when the standby falls more than 60 seconds behind.
- Monitoring keeps its last good agent list when the registry is unreachable, instead of showing nothing.
- `support_agent` now tells users the registry is unavailable instead of failing silently.
