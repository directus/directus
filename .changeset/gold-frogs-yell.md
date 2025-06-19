---
'@directus/sdk': major
---

Added support for LDAP login and enhanced parameter consistency for refresh and logout commands

::: notice
The `login` method now accepts a payload object instead of separate email and password parameters. 
This enables support for both standard and LDAP authentication, but requires updates to code that previously called `sdk.login(email, password)`. 
The new usage is `sdk.login({ email, password })` or `sdk.login({ identifier, password })` for LDAP.
:::

