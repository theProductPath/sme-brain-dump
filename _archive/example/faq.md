# FAQ

**What do I own?**
The nightly customer event pipeline, vendor sync retry path, and the handoff notes.

**What breaks first?**
The rerun of the nightly DAG if the upstream schema changes.

**What is the most important hidden rule?**
Do not force-merge late-arriving events. Delay them by one hour.

**Who do I ask about customer impact?**
Priya in support.

**Who do I ask about schema changes?**
Marcus on the warehouse team.

**What should I practice first?**
The rerun sequence and the monthly backfill procedure.

**What is the vendor exception path?**
It is the special retry flow Sally uses when a sync misses the normal window.
