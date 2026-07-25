---
'@directus/app': patch
---

Fixed two content-versioning issues in the Tiptap rich text interface: editing a field on a published item no longer remounts the editor when it auto-switches to a Draft version (which dropped focus mid-edit and could not be typed into), and choosing "Edit raw HTML" from the normalization warning now moves a versioned item to a Draft while opening the code editor, without marking non-versioned items dirty
