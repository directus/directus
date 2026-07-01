---
'@directus/api': patch
---

Fix CockroachDB connection pool race condition where session parameters were not awaited before connection release,
causing silent integer overflow for values exceeding the 32-bit range.
