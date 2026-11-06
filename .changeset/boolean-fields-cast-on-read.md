---
'@directus/api': patch
---

Fixed boolean fields without the `cast-boolean` flag being returned as `0` and `1` on SQLite and MySQL
