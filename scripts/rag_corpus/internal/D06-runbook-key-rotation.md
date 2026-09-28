---
doc_id: D06
title: "Runbook: rotating a registry key"
date: 2026-07-20
access: [oncall]
source_type: official
---
# Runbook: rotating a registry key

## When to rotate

Rotate an agent's registry key every 90 days, and immediately if the key may have been exposed: written to a log, pasted in a chat, or committed to a repository. An exposed key is rotated first and investigated second.

## Step 1: Issue the new key

Issue a key with the same scope as the old one. The old key keeps working, so the agent isn't interrupted.

```bash
regctl keys issue --agent support_agent --scope write
```

`regctl` prints the new key once. Store it in the secrets manager straight away; it can't be shown again.

## Step 2: Deploy it

Update the agent's secret to the new key and redeploy. New sessions pick up the new key; sessions already running finish on the old one.

## Step 3: Verify

From the agent's environment, call `GET /agents/me` with the new key. It should return the agent you rotated. If it returns `REG-1002`, the secret holds a truncated or mistyped key.

## Step 4: Revoke the old one

Revoke it within 24 hours of issuing the new one. Leaving both valid for longer doubles the number of keys that can leak. For an exposed key, don't wait: revoke as soon as Step 3 passes.

```bash
regctl keys revoke --key-id <old key id>
```

After revocation, anything still using the old key gets `REG-1003`. That's the signal that something was missed in Step 2.
