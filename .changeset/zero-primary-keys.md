---
'@directus/api': patch
---

Fixed items with a primary key of `0` or `''` being skipped by filtered updates and deletes, and returning the wrong key
on create
