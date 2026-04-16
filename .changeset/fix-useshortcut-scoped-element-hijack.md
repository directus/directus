---
'@directus/composables': patch
---

Fixed `useShortcut` firing scoped shortcuts when no element is focused. Scoped shortcuts (those passed a target element) now only trigger when focus is inside that element; the "no focus" fallback is reserved for unscoped shortcuts that target the document body. This prevents things like the markdown editor's `Cmd+K` hijacking the key press from anywhere on the page.
