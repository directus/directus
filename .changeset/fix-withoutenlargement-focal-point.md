---
"@directus/api": patch
---

Fixed asset transformation error when using `withoutEnlargement` with focal point and dimensions larger than the original image. Target dimensions are now clamped to the original image dimensions.
