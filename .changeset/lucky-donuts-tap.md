---
'@directus/api': patch
---

Removed the unused join that `_some` and `_none` filters added on top level one-to-many alias fields, which also stopped them from forcing `COUNT(DISTINCT)` and an unnecessary inner query
