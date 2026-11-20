---
'@directus/api': patch
'@directus/extensions': patch
'@directus/extensions-registry': patch
'@directus/extensions-sdk': patch
'@directus/storage-driver-local': patch
'@directus/types': patch
'@directus/utils': patch
---

Switched Node.js built-in module imports to the `node:` protocol and enforced it with a lint rule
