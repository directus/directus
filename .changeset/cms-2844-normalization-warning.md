---
'@directus/app': minor
---

Kept Tiptap rich text fields read-only, with a warning dialog on click, when the stored HTML contains markup the editor would normalize on save, so no edit (or autosave) can rewrite the content before the change is confirmed; the dialog also offers a raw HTML editing mode that swaps in the code interface and preserves the markup verbatim
