---
'@directus/app': patch
---

Fixed M2M fields being misclassified as M2O when relation data includes a matching collection/field pair with junction metadata. This resolves the "Interface 'list-m2m' not found" error that could occur after modifying field types.
