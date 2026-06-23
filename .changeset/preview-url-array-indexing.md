---
'@directus/app': patch
---

Fixed array indexing (e.g. `field[0]` or `field.0`) in display and preview URL templates so the related field is fetched instead of being silently dropped
