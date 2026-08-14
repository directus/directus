---
'@directus/api': patch
---

Fixed dimension-neutral (e.g. format) image transformations being incorrectly rejected when the original image exceeds `ASSETS_TRANSFORM_IMAGE_MAX_OUTPUT_DIMENSION`
