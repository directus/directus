---
'@directus/api': major
'@directus/sdk': minor
'@directus/env': minor
'@directus/specs': minor
---

Added support for multi collection flat data imports

::: notice
**Import file size is now capped by default.** A new `IMPORT_MAX_FILE_SIZE` environment variable
(default `50mb`) limits the size of uploaded import files and schema snapshots. Previously thes file imports were effectively
unbounded, so imports of files larger than 50mb will now be rejected. Raise `IMPORT_MAX_FILE_SIZE`
to restore the previous behaviour.

**`background` query flag on `POST /utils/import/:collection`.** The flag is now parsed slightly differently, a bare `?background` (no value) counts as `true`. Pass an explicit `?background=false` if you relied on a valueless flag being treated as `false`.
:::
