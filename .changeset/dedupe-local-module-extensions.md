---
'@directus/extensions': patch
'@directus/api': patch
---

Fixed extensions being loaded twice when present in multiple sources by only using the copy from the highest-precedence source (local, then marketplace, then `package.json`), without falling back to another copy when it's disabled.
