---
'@directus/api': patch
---

Fixed collection `meta.icon` accepting arbitrary strings, which the app displayed as text; it now has to be an icon name (lowercase letters, numbers and underscores)
