---
doc_id: D13
title: billing_agent spend limits and approvals
date: 2026-09-01
access: [finance]
source_type: official
---
# billing_agent spend limits and approvals

## Monthly limit

`billing_agent`'s model usage is capped at $4,000 per calendar month. At 80% of the cap, the Finance operations lead gets an email. At 100%, `billing_agent` is set to `paused` until the next month or until the cap is raised.

## Raising the limit

Send a request to the Finance operations lead with the new cap, the reason, and the expected monthly volume of invoices. Raises up to $6,000 are approved by the Finance operations lead. Above that, the CFO approves.

## Why the cap exists

In March, a loop bug made `billing_agent` retry failed invoices without a step limit, and it used $2,900 of model calls in one night. The cap limits what any single bug can cost. It isn't a budget target: normal usage is about $2,200 a month.
