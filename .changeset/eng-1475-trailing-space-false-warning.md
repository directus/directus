---
'@directus/app': patch
---

Fixed a false-positive "unsupported content" warning that locked a Tiptap rich text field read-only when the stored HTML differed from the editor's output only by insignificant whitespace (such as a trailing space inside a paragraph) that the editor trims during normalization
