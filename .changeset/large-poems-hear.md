---
'@directus/app': patch
---

Fixed the repeater interface options showing empty sub-fields, and dropping their key and type on save, when the sub-fields were created through the API without repeating the key and type inside their meta
