---
'@directus/app': minor
---

Added validation for richtext extensions. The app does not load an extension, and logs the reason, if its config is malformed, its id is already in use, it reuses a core node, mark or extension name, or it adds an attribute that the core editor reserves
