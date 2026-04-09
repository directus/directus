---
'@directus/app': major
---

Removed rounded buttons and adopted shared header action button across all views

::: notice

- **Potential breaking change for extensions:** The `rounded` prop has been removed from `v-button`. Extensions using `rounded` will still render correctly but buttons will appear as rounded rectangles instead of circles. No functional impact.

###
