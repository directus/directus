---
'@directus/api': patch
'@directus/utils': major
---

Remove ip-matching dependency

::: notice
Policies `ip_access` won't allow parsing of invalid subnets anymore. (e.g. `10.0.0.0/ 24` or `10.0.0.0/+24`)
:::
