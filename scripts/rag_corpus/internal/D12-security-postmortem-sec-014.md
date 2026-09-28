---
doc_id: D12
title: "Security postmortem SEC-014: registry key written to logs"
date: 2026-07-14
access: [security]
source_type: official
---
# Security postmortem SEC-014: registry key written to logs

## Summary

On 2026-07-11, a routine log review found `support_agent`'s write-scoped registry key in plain text in its debug logs. The logs are readable by about 60 engineers. The key was rotated within 3 hours of discovery. The registry's change history shows no use of the key from anywhere other than `support_agent` itself.

## How it happened

A developer enabled `REGISTRY_DEBUG=1` on `support_agent` on 2026-06-30 to investigate slow lookups, and didn't turn it off. With that flag set, the registry client logs every request in full, headers included, and the `X-Registry-Key` header is a request header. The key sat in the logs for 11 days.

## What we changed

- The registry client now masks `X-Registry-Key` in logs whatever the debug setting.
- `REGISTRY_DEBUG` switches itself off after 24 hours.
- The log review now searches for anything shaped like a registry key, daily instead of weekly.
- This incident is why the key rotation runbook says to rotate first and investigate second.
