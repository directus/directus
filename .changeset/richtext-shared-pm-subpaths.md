---
'@directus/extensions': minor
'@directus/extensions-sdk': patch
'@directus/app': patch
---

Fixed richtext extensions bundling their own copy of ProseMirror when they import an `@tiptap/pm` subpath other than `model`, `state`, `transform` or `view` (for example `@tiptap/pm/keymap`, or `@tiptap/extension-table` through `@tiptap/pm/tables`). The app now shares every `@tiptap/pm` subpath it ships (all except `changeset` and `inputrules`, which extensions bundle safely), and the extensions SDK resolves bare `prosemirror-*` imports to the shared subpath.
