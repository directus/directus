---
'@directus/errors': minor
'@directus/env': minor
'@directus/api': major
'@directus/app': minor
---

Added support for importing data in the background

::: notice
Imports now automatically time out after 1 hour, with a maximum of 20 running concurrently. These limits can be configured via `IMPORT_TIMEOUT` and `IMPORT_MAX_CONCURRENY`, respectively.
:::
