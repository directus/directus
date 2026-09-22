---
'@directus/extensions': minor
'@directus/extensions-sdk': minor
'@directus/app': minor
'@directus/api': minor
---

Added `@tiptap/core`, `@tiptap/vue-3` and the `@tiptap/pm` subpaths `model`, `state`, `transform` and `view` to the shared app dependencies. App extensions import them directly and the app serves one copy, so every extension shares the same ProseMirror schema
