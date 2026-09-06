---
'@directus/memory': patch
---

Fixed the local key-value store incrementing `increment` and `setMax` non-atomically under concurrent access
