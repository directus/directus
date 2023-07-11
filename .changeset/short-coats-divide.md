---
"@directus/app": patch
"@directus/api": major
"@directus/composables": patch
"@directus/constants": patch
"@directus/extensions-sdk": patch
"@directus/pressure": patch
"@directus/schema": patch
"@directus/storage-driver-azure": patch
"@directus/storage-driver-cloudinary": patch
"@directus/storage-driver-gcs": patch
"@directus/storage-driver-local": patch
"@directus/storage-driver-s3": patch
"@directus/storage": patch
"@directus/types": major
"@directus/update-check": patch
"@directus/utils": patch

---

::: notice
- `@directus/app` no longer exposes internal files, except for `index.js` (`createApp`) and `cli/run.js`! It's recommended to switch to [dedicated packages](https://docs.directus.io/contributing/codebase-overview.html#packages-packages) which are constantly being expanded.
- Types from `@directus/types` should now be imported via [`import type`](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export) syntax!
:::

Enabled bundling of packages
