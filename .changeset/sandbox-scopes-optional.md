---
'@directus/extensions': patch
'@directus/types': patch
---

Fixed extensions that set `sandbox` without `requestedScopes` or without `enabled` being rejected as invalid
