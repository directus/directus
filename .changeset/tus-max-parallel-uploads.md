---
'@directus/api': patch
'@directus/app': patch
"@directus/env": patch
---

Added concurrency control for file uploads via a new `FILES_MAX_UPLOAD_CONCURRENCY` env variable
