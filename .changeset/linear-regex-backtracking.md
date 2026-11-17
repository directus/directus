---
'@directus/app': patch
'@directus/release-notes-generator': patch
'@directus/utils': patch
---

Reworked regexes whose worst-case matching time grew faster than the length of their input