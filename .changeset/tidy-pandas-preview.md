---
'@directus/app': patch
'@directus/api': patch
---

Fixed live preview using the published version key when the draft version was selected but not saved yet, and made `?version=draft` fall back to the published item when no draft exists
