---
'@directus/app': patch
---

Fixed presentation fields (divider, header, notice, links) allowing the `required` and `readonly` options, which previously caused item creation to fail with a validation error when either option was enabled on a presentation field.
