---
'@directus/api': patch
---

Fixed API error when the fallback sort field picked for non-admin users was of a type the database cannot sort (e.g. JSON)
