---
'@directus/app': patch
---

Fixed export field selection to exclude alias fields so using "Select All" in the export dialog no longer sent invalid alias fields to CSV and file exports.
