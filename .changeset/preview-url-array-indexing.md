---
'@directus/utils': patch
'@directus/app': patch
---

Fixed array indexing (e.g. `field[0]` or `field.0`) in display and preview URL templates, so a template like `{{ categories[0].name }}` now resolves to the indexed value instead of rendering empty
