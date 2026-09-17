---
'@directus/sdk': patch
---

Fixed `deleteNotification`, `updateNotification`, `deletePermission`, `updatePermission`, `readPermission`, `readActivity`, and `readRevision` silently accepting `undefined`/`null` as the key instead of throwing
