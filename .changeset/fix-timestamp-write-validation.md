---
'@directus/api': patch
---

Fixed writing an unparseable timestamp value silently producing an Invalid Date instead of raising a validation error, matching the existing behavior for `date` and `dateTime` fields.
