---
doc_id: D09
title: "Incident INC-2041: billing_agent unable to issue invoices"
date: 2026-04-10
access: [all-staff]
source_type: official
---
# Incident INC-2041: billing_agent unable to issue invoices

## Summary

On 2026-04-08, `billing_agent` failed to issue invoices for 2 hours 15 minutes. Every attempt ended in a timeout from payments-gateway. No customer was charged twice, but 1,140 invoices went out late.

## Timeline

- 06:02 — `AgentErrorRateHigh` fired for `billing_agent`. No page: it was outside paging hours.
- 08:00 — The on-call engineer saw the alert and found every failed session stuck on the same payments-gateway call.
- 08:40 — The Payments team found that payments-gateway couldn't open connections to auth-service.
- 08:55 — The Identity team renewed the certificate. `billing_agent` recovered within two minutes.

## Root cause

payments-gateway checks every request's certificate with auth-service before it will talk to a caller. An intermediate certificate in auth-service expired at 06:00, so every check failed, and payments-gateway timed out instead of returning an error. `billing_agent` treated the timeouts as transient and retried each one until its step limit ran out.

## What we changed

- auth-service now alerts 30 days before any certificate expires.
- payments-gateway now returns an error immediately when a certificate check fails, instead of hanging.
- `billing_agent` stops retrying after three timeouts from the same service in one session.
