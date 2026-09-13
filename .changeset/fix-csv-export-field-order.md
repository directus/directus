---
'@directus/api': patch
---

Fixed relational fields (m2o/o2m/a2o) always being placed after every direct field when building the field tree, regardless of their position in the requested field list. This caused CSV/JSON exports to always push related columns to the end even when they were placed in the middle of the requested fields.
