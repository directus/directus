---
'@directus/app': patch
---

Excluded virtual fields like `$thumbnail` from export defaults in the export sidebar and sanitized preset-provided export fields so `directus_files` JSON exports no longer failed from synthetic field selection.
