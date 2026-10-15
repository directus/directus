---
'@directus/api': patch
'@directus/app': patch
'@directus/errors': minor
'@directus/specs': patch
---

Fixed auto-save from a second session silently overwriting newer content version edits. Version saves now accept a `baseDate` and are rejected with `VERSION_CONFLICT` when the version was saved since, and the app rebases onto the latest save or asks which changes to keep
