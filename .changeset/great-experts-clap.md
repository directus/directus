---
"@directus/api": major
"@directus/types": patch
---

Fixed `Content Versioning` to correctly merge relational data and support all query parameter functionality

::: notice

The following changes should be kept in mind when updating:
1. Relational versioned data now requires explicit field expansion to be included in the response.
2. Invalid data (e.g. Fails validation rules) will error on query
3. Filter conditions now apply to the versioned data instead of the main record

For more information, please read the [breaking change docs](https://directus.io/docs/releases/breaking-changes/version-11#version-11110) for a full list of changes.

:::
