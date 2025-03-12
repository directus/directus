---
'@directus/api': patch
---

Fixed bug in which OpenID and OAuth2 clients couldn't be passed params starting with "id" or "secret" e.g.
"id_token_signed_response_alg"
