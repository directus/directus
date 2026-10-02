---
'@directus/app': minor
---

Added a load-time check for richtext extensions. The app logs a console warning, with the extension id, for each node or
mark whose `parseHTML` does not read back what its `renderHTML` writes, because such a node makes every save warn that
saving alters the content. Each extension is checked on its own with default attribute values, so
the check does not catch every mismatch.
