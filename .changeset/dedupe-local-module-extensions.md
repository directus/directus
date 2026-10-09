---
'@directus/api': patch
---

Fixed extensions being loaded twice when the same extension was present as a local extension, a marketplace extension or a `package.json` dependency
