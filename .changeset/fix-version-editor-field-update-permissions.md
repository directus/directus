---
'@directus/app': patch
---

Mark fields without update permission as readonly when editing a content version, preventing them from entering the version delta and making the version impossible to promote
