---
'@directus/app': patch
---

Fixed the auth module registering a cookie change listener at module scope, which left a permanent document.cookie
polling interval running
