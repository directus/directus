---
'@directus/utils': patch
---

Fixed `normalizePath` keeping the leading separator for a Windows-style backslash path (e.g. `\a\b\c`) when the `removeLeading` option was enabled
