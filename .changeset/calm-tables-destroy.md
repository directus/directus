---
"@directus/api": patch
"@directus/env": patch
---

Fixed potential Open Redirect vulnerability with OAuth2/OpenID/SAML SSO providers (via Directus redirect query parameter), by requiring redirect URLs to be enabled via allow list
