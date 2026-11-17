---
'@directus/specs': patch
'@directus/api': patch
---

Fixed `GET /server/specs/oas` listing admin-only and authenticated-only operations as available based on a caller's collection permissions alone
