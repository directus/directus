---
'@directus/api': major
'@directus/utils': major
---

Removed the ip-matching dependency

::: notice

Policy `ip_access` values are now more strictly validated, subnets with a malformed prefix such as `10.0.0.0/ 24` or `10.0.0.0/+24` are no longer accepted.

Existing policies that already store such a value will fail every request for users with that policy. Correct these values (e.g. to `10.0.0.0/24`) before upgrading.

:::
