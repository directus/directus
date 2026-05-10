---
'@directus/app': patch
---

Fixed users getting signed out when opening many Studio pages in quick succession by avoiding a session refresh race across tabs.
