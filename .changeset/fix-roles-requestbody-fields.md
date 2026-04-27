---
'@directus/specs': patch
---

Fixed stale fields in roles requestBody schemas: removed `external_id`, `module_listing`, `enforce_tfa`, `admin_access`, and `app_access`; added `icon` (Fixes #20972)
