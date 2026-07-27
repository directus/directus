---
'@directus/api': patch
'@directus/specs': patch
'@directus/env': patch
'@directus/utils': patch
---

Fixed background imports (`POST /utils/import/:collection?background=true`) intermittently hanging and importing nothing when running behind a streaming proxy or CDN.

Added an `IMPORT_MAX_FILE_SIZE` environment variable that caps the size of an uploaded import file, returning `413 Content Too Large` when exceeded. Unset (unlimited) by default.
