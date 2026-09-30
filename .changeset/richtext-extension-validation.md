---
'@directus/app': minor
---

Added validation for richtext extensions. The app does not load an extension, and logs the reason, if its config is malformed, reuses a core node, mark or extension name, or redefines an attribute a core type already has.
