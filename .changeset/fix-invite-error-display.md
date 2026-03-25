---
"@directus/api": patch
"@directus/app": patch
---

Fixed invite acceptance to show the actual error reason on the frontend instead of a generic "Invalid payload" message. Also prevents email address leakage in the error response.
