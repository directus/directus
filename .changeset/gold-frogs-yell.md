---
'@directus/sdk': major
---

Replaced email and password parameters with a payload that supports both regular and LDAP login. Improved parameter consistency between refresh and logout commands. Allowed overriding mode in refresh and logout commands to be inline with login. Brought refresh command data payload `refresh_token` check inline with logout.
