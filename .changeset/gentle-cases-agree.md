---
'@directus/api': patch
---

Fixed updates failing on PostgreSQL when a permission rule compiles to an empty condition by using a boolean-valid
always-true CASE/WHEN fallback
