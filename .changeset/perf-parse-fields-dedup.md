---
'@directus/api': patch
---

Improved performance of field parsing by deduplicating nested relational fields with a Set lookup instead of a nested scan (O(fields) instead of O(fields²))
