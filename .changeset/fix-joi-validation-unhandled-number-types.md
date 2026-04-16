---
'@directus/validation': patch
---

Fixed `number.unsafe` (and other numeric Joi error types) surfacing as an internal 500 error instead of a validation error when a user-configured validation rule rejects an unsafe number
