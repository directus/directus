---
'@directus/app': patch
---

Fixed relational edits saving two update entries for the same row when an interface emitted twice in one tick, which made the stale entry win and dropped block editor changes inside translations
