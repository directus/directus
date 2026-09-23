---
'@directus/env': patch
'@directus/api': patch
---

Added explicit types to the env type map for every environment variable that has a default, so their
values are cast consistently instead of being guessed from the configured value's shape
