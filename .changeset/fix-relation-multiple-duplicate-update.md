---
'@directus/app': patch
---

Fixed relational edits made in quick succession saving duplicate create or update entries for the same row, which made the stale entry win and dropped block editor changes inside translations
