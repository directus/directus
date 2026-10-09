---
'@directus/app': patch
---

Fixed permission checks in the Insights module so dashboard and panel actions are only available to users with the matching permissions. `VWorkspaceTile` gained `createAllowed`, `updateAllowed` and `deleteAllowed` props and no longer renders resize handles when `draggable` is `false`.
