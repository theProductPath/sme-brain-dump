# Successor Brief

## Role in practice
You own the customer event pipeline, the vendor sync job, and the handoff notes that keep support and analytics aligned.

## What breaks without attention
- Nightly DAG reruns can stall after upstream schema changes.
- Vendor sync retries can produce duplicates if the exception path is used casually.
- Slack escalation order matters when customer-impacting issues appear.

## Undocumented knowledge
- Use the S3 archive path naming convention exactly as documented in the transcript.
- Delay late-arriving events by one hour instead of force-merging them.
- The rerun shortcut is safe only after confirming downstream counts.

## First week
1. Sit with support and review recent escalations.
2. Verify dashboard thresholds and alert routing.
3. Rehearse the rerun sequence before taking incidents solo.
4. Confirm who owns schema changes and vendor exceptions.

## Ask these people
- Priya, support, for customer impact questions.
- Marcus, warehouse, for schema changes.
- Sally, for vendor exception paths.
