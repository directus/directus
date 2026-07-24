---
'@directus/app': patch
---

Fixed the Tiptap rich text editor body disappearing (only the toolbar left visible) when the table bubble menu was removed mid-session, e.g. when the normalization warning locked the field after pasting unsupported markup via Edit Raw Value
