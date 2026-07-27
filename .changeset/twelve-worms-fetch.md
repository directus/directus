---
'@directus/env': minor
'@directus/api': major
---

Added support for restricting image transformation output size via `ASSETS_TRANSFORM_IMAGE_MAX_OUTPUT_DIMENSION`

::: notice

**Image transformation output is now restricted**
Image transformations that project an output larger than `ASSETS_TRANSFORM_IMAGE_MAX_OUTPUT_DIMENSION` (default `3000` px) on either axis are now rejected with an `IllegalAssetTransformationError`.
:::
