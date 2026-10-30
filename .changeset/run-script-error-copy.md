---
'@directus/api': patch
'@directus/utils': patch
---

Fixed Run Script operations failing with "illegal access" when the flow data contained errors, such as the validation errors from a failed Condition operation
