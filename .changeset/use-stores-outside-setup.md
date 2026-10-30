---
'@directus/composables': minor
'@directus/app': patch
---

Fixed `useStores`, `useApi`, `useSdk` and `useExtensions` throwing when called outside of a component's setup, like in a display's `fields()` function after navigating between pages
