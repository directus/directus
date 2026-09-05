---
'@directus/format-title': patch
---

Fixed `formatTitle` producing stray, leading, or trailing spaces when the input contained consecutive, leading, or trailing separators (e.g. `foo__bar` returned "Foo  Bar")
