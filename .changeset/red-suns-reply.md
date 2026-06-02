---
'@directus/validation': patch
'@directus/app': patch
---

Fixed API error when validating numbers outside the JavaScript safe range, now returning a proper validation message
