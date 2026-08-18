---
'@directus/api': patch
'@directus/env': patch
---

Updated `ASSETS_TRANSFORM_IMAGE_MAX_OUTPUT_DIMENSION` to match `ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION` (`6000` px)

::: notice
The default maximum output dimension is now `6000` px. Users who rely on the previous limit of `3000` px can explicitly configure `ASSETS_TRANSFORM_IMAGE_MAX_OUTPUT_DIMENSION`.
:::
