---
'@directus/app': minor
---

Isolated failing richtext extensions from the rich text editor. A contributed toolbar button whose command or active check throws is disabled and logged, and an extension whose nodes cannot build the editor schema is rejected at registration instead of breaking every field that enabled it.
