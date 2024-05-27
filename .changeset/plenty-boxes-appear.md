---
"@directus/storage-driver-cloudinary": patch
"@directus/storage": patch
---

Fixed an issue where moving files using Cloudinary storage with custom ROOT location would fail. The issue occurred, for example, when trying to save an edited image.
