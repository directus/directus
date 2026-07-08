---
'@directus/api': minor
'@directus/sdk': minor
---

Added a `POST /utils/import` endpoint (backed by `ImportService.importBatch`) that imports flat data for multiple related collections in a single request.