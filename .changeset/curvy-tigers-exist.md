---
'@directus/app': patch
---

Fixed export failing on collections with virtual fields like $thumbnail by excluding them from export defaults and the field picker
