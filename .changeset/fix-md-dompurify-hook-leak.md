---
'@directus/app': patch
---

Fixed markdown rendering getting slower over time by registering the sanitizer hook once instead of on every render
