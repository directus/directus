---
'@directus/api': minor
'@directus/types': patch
'docs': patch
'@directus/app': patch
---

Fixed the permission check in the Data Studio for permissions rules containing fields which the current user has no access to, via new dedicated permission check API endpoint
