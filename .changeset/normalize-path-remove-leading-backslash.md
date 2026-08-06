---
'@directus/utils': patch
---

Fixed `normalizePath` not removing the leading slash from a backslash-rooted path (e.g. `\a\b\c`) when the `removeLeading` option is enabled
