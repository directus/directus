---
'@directus/api': patch
---

Fixed `setDeep` descending through an inherited `__proto__` when a caller supplied an intermediate node that was not null-prototype
