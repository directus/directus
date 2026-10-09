---
'@directus/extensions': minor
'@directus/extensions-sdk': patch
'@directus/app': patch
---

Fixed richtext extensions bundling their own copy of ProseMirror when they import an `@tiptap/pm` subpath other than `model`, `state`, `transform` or `view`.
