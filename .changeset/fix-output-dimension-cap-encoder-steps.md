---
'@directus/api': patch
---

Fixed the image transformation output dimension cap rejecting valid downscales of sources larger than the cap

::: notice

`ASSETS_TRANSFORM_IMAGE_MAX_OUTPUT_DIMENSION` is now only measured against transformation steps that actually change
the dimensions, such as `resize`, `extract`, `extend` and `rotate`. Steps that leave the dimensions untouched, such as
`toFormat` selecting the output encoder, inherit an already validated size, so measuring them again rejected requests
whose output was never over the cap, for example `?width=400&format=webp` on a source wider than the cap.

The guard against intermediate enlargement is unchanged: a step that scales up beyond the cap is still rejected, even
when a later step shrinks back under it.

:::
