---
'@directus/api': patch
---

Fixed field-level permissions for assets - now respects user's restricted access to directus_files fields and properly
filters file metadata through FilesService
