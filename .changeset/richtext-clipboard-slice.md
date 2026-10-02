---
'@directus/app': patch
---

Fixed copy and paste in the WYSIWYG editor. Content copied with the toolbar copy button now keeps its wrapper node when pasted with Ctrl/Cmd+V, and a pasted element no longer stores ProseMirror's internal `data-pm-slice` clipboard attribute in the field value.
