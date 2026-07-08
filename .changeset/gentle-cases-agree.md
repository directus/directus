---
'@directus/api': patch
---

Fixed updates failing on PostgreSQL when an invalid permission rule compiles to an empty condition. Such rules now deny
access via a boolean-valid CASE/WHEN fallback instead of erroring the request
