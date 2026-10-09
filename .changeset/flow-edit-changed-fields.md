---
'@directus/app': patch
---

Fixed editing an active flow failing with a limit exceeded error by only sending changed fields on save
