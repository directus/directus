---
'@directus/memory': minor
'@directus/env': patch
'@directus/api': patch
---

Fixed concurrently booting instances crashing while another instance holds the license lock

::: notice

License initialization holds a distributed lock across the license server round trip, which on first activation can take
well over a minute. Instances that boot at the same time now wait for that lock instead of failing with
`The operation was unable to achieve a quorum during its retry window`, and continue booting without the lock if it
cannot be acquired at all. How long an instance waits for the lock is configurable through the new
`LICENSE_LOCK_ACQUIRE_TIMEOUT` variable, which defaults to `120000` (2 minutes).

:::
