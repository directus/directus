---
'@directus/sdk': patch
---

Fixed custom endpoint requests with FormData bodies, including alternative implementations such as Undici, incorrectly defaulting to the JSON content type.
