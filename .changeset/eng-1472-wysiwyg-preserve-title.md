---
'@directus/app': patch
---

Preserved the `title`, `role`, `lang` and inline `dir` attributes on nodes and marks in the Tiptap rich text editor, so editing through the source code drawer no longer flags them as unsupported markup or strips them on save
