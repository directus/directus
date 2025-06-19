---
'@directus/sdk': major
---

Added support for LDAP login and enhanced parameter consistency for refresh and logout commands

::: notice
The `login` method now accepts a payload object instead of separate email and password parameters. 
This enables support for both standard and LDAP authentication, but requires updates to code that previously called `sdk.login(email, password)`. 
The new usage is `sdk.login({ email, password })` or `sdk.login({ identifier, password })` for LDAP.

The `refresh` and `logout` method parameters have been updated to be consistent across usage. The functions now accept an options object instead of their previous regular parameters.

For example the new usage for `refresh` is `sdk.request(refresh({ mode: "json", refresh_token }))` instead of `sdk.request(refresh('json', refresh_token))`.
:::

