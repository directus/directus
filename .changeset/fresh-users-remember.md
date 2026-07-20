---
'@directus/app': patch
---

Fixed current-user permission presets using stale user values after the signed-in user changes, and preserved saved M2O relation primary keys when the related item cannot be read
