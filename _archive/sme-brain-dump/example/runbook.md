# Runbook

## Daily health check
1. Confirm the DAG completed.
2. Check dashboard thresholds.
3. Verify vendor sync success.
4. Scan for late-arriving events.

## Vendor sync retry
1. Inspect the failed batch.
2. Confirm whether the exception path is warranted.
3. Retry the sync.
4. Check downstream counts for duplicates.

## Monthly backfill
1. Identify the date range.
2. Confirm support has no open customer-impacting incidents.
3. Run the backfill shortcut.
4. Validate totals before closing.
