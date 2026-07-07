---
'@directus/specs': patch
---

Add missing `/users` endpoint specs: `POST /users/register`, `GET /users/register/verify-email`, `POST /users/me/tfa/generate`; fix incomplete `POST /users/me/tfa/enable` spec to include required `secret` and `otp` request body fields
