---
'@directus/api': patch
---

Stopped logging the missing custom IP header warning on `/server/ping` and `/server/info`, which are commonly hit directly (health checks)
