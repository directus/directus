---
'@directus/api': patch
---

Correctly set user "auth_data" after auth.update hook

Regression fix introduced with the new auth.update hook where the "refresh_token" which might be given by the provider was no longer updated on the corresponding user.
