---
'@directus/api': patch
---

Fixed image transformations being rejected as too large when a format or quality was requested, since the output cap was measured against the untransformed source dimensions
