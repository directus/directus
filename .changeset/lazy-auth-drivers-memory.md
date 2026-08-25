---
'@directus/api': patch
---

Reduced memory usage on startup by lazily loading LDAP, OAuth2, OpenID, and SAML auth drivers via dynamic imports, so their dependencies are only loaded when actually configured via `AUTH_PROVIDERS`
