---
'@directus/sdk': patch
---

Fixed `deleteNotification`/`updateNotification` silently accepting `undefined`/`null` as the notification key instead of
throwing
