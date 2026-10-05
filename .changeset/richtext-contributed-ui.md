---
'@directus/extensions': minor
'@directus/extensions-sdk': minor
'@directus/composables': minor
'@directus/constants': minor
'@directus/app': minor
---

Added more toolbar UI for richtext extensions. Added dropdown `items` for toolbar buttons, an `isDisabled` predicate for buttons and items, and `bubbleMenus` that showed buttons next to the selection when `shouldShow` returned true. Made buttons and items with an unknown icon fall back to the `extension` icon with a console warning. Added the `useRichTextEditable()` composable so Vue node views could hide their edit controls when the field was readonly, disabled, locked or in comparison mode. Fixed the WYSIWYG pre-save diff reporting a change when the editor only wrote the same attributes in a different order.
