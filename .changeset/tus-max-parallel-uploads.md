---
'@directus/api': patch
'@directus/app': patch
"@directus/env": patch
---

Add `FILES_MAX_UPLOAD_PARALLEL` to limit concurrent file uploads started by the Studio, working for both regular and resumable (TUS) uploads.
