# Sally Chen — Interview Transcript

AI: What are you responsible for that would cause pain if it vanished tomorrow?
Sally: The nightly customer event pipeline, the vendor sync job, and the on-call handoff notes.

AI: What breaks first when you’re unavailable?
Sally: The rerun of the nightly DAG. People know how to trigger it, but not which failures are safe to ignore.

AI: What’s undocumented but important?
Sally: The S3 archive path naming convention, the backfill shortcut, and the Slack escalation order.

AI: Which decisions do people forget were intentional?
Sally: We delay late-arriving events by one hour instead of force-merging them. That avoids duplicate downstream counts.

AI: What should a successor do in week one?
Sally: Sit with support, verify the dashboard thresholds, and rehearse the rerun sequence before the first incident.

AI: Who should they ask when unsure?
Sally: Priya in support for customer impacts, Marcus for warehouse schema changes, and me for the vendor exception path.

AI: What recurring work needs a runbook?
Sally: The daily health check, the vendor sync retry, and the monthly backfill.
