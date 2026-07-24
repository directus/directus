---
'@directus/app': patch
---

Disabled the field menu's raw-value editing (Edit Raw Value swaps to View Raw Value, and Paste Raw Value is hidden) while a Tiptap rich text field is locked read-only because its stored HTML contains markup the editor can't represent, so raw editing can no longer bypass the normalization warning
