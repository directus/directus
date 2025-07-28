---
'@directus/extensions-sdk': major
'@directus/storage-driver-cloudinary': patch
'@directus/storage-driver-supabase': patch
'@directus/storage-driver-azure': patch
'@directus/storage-driver-local': patch
'@directus/extensions-registry': patch
'@directus/storage-driver-gcs': patch
'@directus/storage-driver-s3': patch
'@directus/composables': patch
'@directus/extensions': patch
'@directus/constants': patch
'@directus/storage': patch
'@directus/errors': patch
'@directus/themes': patch
'@directus/types': patch
'@directus/api': patch
'@directus/app': patch
'@directus/sdk': patch
---

Added TypeScript support for services within the extension context

::: notice

The services exposed to API extensions using TypeScript are now fully typed instead of `any` this can potentially cause new type errors when building extensions.

Arguments of service methods are now strictly typed which can result in type errors for broader types that would not error before:
- The ItemsService constructor now expects the collection name to be a `string` so this will error on `string | undefined` (or other unions).
- Similarly functions like `service.readOne()`/`service.readMany()` now expect `string | number` for their primary keys and will error for nullable types

As a workaround, casting the services back to `any` will result in the original behavior. However, it is recommended to resolve the type errors instead.

:::
