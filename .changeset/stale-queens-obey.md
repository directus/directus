---
'@directus/app': minor
'@directus/composables': minor
---

Added version select to collection page

`useItems` now accepts a `version` query parameter. When set, items are fetched with the given version, aggregate count calls are skipped (item counts are derived client-side from fetched results), and `changeManualSort` is disabled.
