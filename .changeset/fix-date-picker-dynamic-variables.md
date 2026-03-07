---
'@directus/app': patch
'@directus/utils': patch
---

Fixed calendar picker crashing when a dynamic variable (e.g. `$NOW`) is used as a date field value in validation rules
