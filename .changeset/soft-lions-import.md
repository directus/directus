---
'@directus/api': patch
'@directus/specs': patch
'@directus/env': patch
'@directus/utils': patch
---

Fixed background imports (`POST /utils/import/:collection?background=true`) returning the HTTP response before the uploaded request body was fully read. The upload is now spooled to a temp file within the request lifecycle before the response is sent, so the endpoint no longer relies on the live request stream still being readable after responding (which could hang until `IMPORT_TIMEOUT` behind a streaming proxy or CDN).

Added a `IMPORT_MAX_FILE_SIZE` environment variable that caps the size of an uploaded import file (returning `413 Content Too Large` when exceeded), preventing an unbounded upload from filling up disk now that imports are spooled to disk. It is unset (unlimited) by default and is separate from `FILES_MAX_UPLOAD_SIZE`.
