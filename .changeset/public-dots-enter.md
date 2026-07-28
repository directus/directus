---
'@directus/system-data': patch
'@directus/api': patch
'@directus/app': patch
---

Restricted the settings fields readable with minimal app access to those actually needed by non-admin users, no longer exposing admin-only and sensitive AI configuration fields