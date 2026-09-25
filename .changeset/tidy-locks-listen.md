---
'@directus/memory': minor
---

Added optional lock settings to `usingLock` to override the lock's duration and retry count. A signal is now passed to the callback that aborts if the lock is lost before it finishes
