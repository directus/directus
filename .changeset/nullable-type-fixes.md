---
'@directus/types': patch
'@directus/sdk': patch
'@directus/api': patch
---

Updated `@directus/types` and `@directus/sdk` field definitions to correctly include `| null` for nullable database columns across `comments`, `operations`, `roles`, and `shares`
