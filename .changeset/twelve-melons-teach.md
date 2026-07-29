---
'@directus/api': patch
---

Fixed `TranslationsService.updateMany` incorrectly rejecting single-row updates that included both `key` and `language`
