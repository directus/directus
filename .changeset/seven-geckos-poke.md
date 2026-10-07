---
'@directus/api': major
'@directus/utils': major
---

Removed the ip-matching dependency

::: notice

Policy `ip_access` and `IMPORT_IP_DENY_LIST` values are now more strictly validated. Subnets with a malformed prefix such as `10.0.0.0/ 24` or `10.0.0.0/+24`, are no longer accepted.

Existing policies that already store such a value will fail every request for users with that policy.

:::
