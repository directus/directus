---
"@directus/api": patch
---

Fixed asset transformation error when using `withoutEnlargement` with focal point and dimensions larger than the original image. The target dimensions are now clamped to the original image dimensions when `withoutEnlargement` is enabled, preventing the "bad extract area" error from Sharp.
