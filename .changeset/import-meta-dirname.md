---
'@directus/api': patch
'@directus/extensions-sdk': patch
'@directus/memory': patch
'@directus/specs': patch
'create-directus-project': patch
'directus': patch
---

Replaced `dirname(fileURLToPath(import.meta.url))` with the native `import.meta.dirname`
