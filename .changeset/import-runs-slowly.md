---
'@directus/api': major
'@directus/sdk': minor
'@directus/env': minor
'@directus/specs': minor
---

Added support for multi-collection flat data imports

::: notice
**Import file size is now capped by default**
A new `IMPORT_MAX_FILE_SIZE` environment variable (default: `50mb`) limits the size of uploaded import files and schema snapshots. Previously, imports were effectively unrestricted, allowing files larger than `50mb` to be processed. With this change, imports exceeding the configured limit will be rejected. Increase `IMPORT_MAX_FILE_SIZE` to restore the previous behavior.

**Updated `background` query flag handling for `POST /utils/import/:collection`**
The `background` query flag now treats a valueless indicator (i.e. `?background`) as true. If you previously relied on a valueless background flag being interpreted as false, pass an explicit value instead (i.e. `?background=false`).
:::
