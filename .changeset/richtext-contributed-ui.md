---
'@directus/extensions': minor
'@directus/extensions-sdk': minor
'@directus/composables': minor
'@directus/constants': minor
'@directus/app': minor
---

Added more toolbar UI for richtext extensions. A toolbar button can open a dropdown of `items`, buttons and items can set an `isDisabled` predicate, and `bubbleMenus` show buttons next to the selection when `shouldShow` returns true. A button or item with an unknown icon now shows the `extension` icon and logs a console warning. Vue node views can call the new `useRichTextEditable()` composable to hide their edit controls when the field is readonly, disabled, locked or in comparison mode. The WYSIWYG pre-save diff also no longer reports a change when the editor only writes the same attributes in a different order
