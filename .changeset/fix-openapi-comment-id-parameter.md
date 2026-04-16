---
'@directus/specs': patch
---

Added missing `id` path parameter to the `/comments/{id}` OpenAPI spec so the generated spec validates and imports cleanly in tools like Postman.
