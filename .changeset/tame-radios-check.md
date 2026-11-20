---
'@directus/app': patch
---

Fixed content versions letting users edit fields they can't update, which made the version impossible for them to publish. Those fields are now locked while editing a version, the same as on the published item
