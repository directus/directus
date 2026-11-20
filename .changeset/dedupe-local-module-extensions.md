---
'@directus/extensions': patch
'@directus/api': patch
'@directus/app': patch
---

Fixed extensions being loaded twice when present in multiple sources by only using the copy from the highest-precedence source (local, then marketplace, then `package.json`). Ignored extensions will be logged to the console.

Installs that previously loaded a duplicate may show the skipped copy as "Missing" in Settings → Extensions; it can be safely deleted.
