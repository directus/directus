---
'@directus/api': patch
---

Fixed TUS (chunked) uploads bypassing the `FILES_MIME_TYPE_ALLOW_LIST` setting, which was only enforced on regular multipart uploads
