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
4. 
For more information, please read the [breaking change docs](https://directus.io/docs/releases/breaking-changes/version-11#version-11110) for a full list of changes.

Additionally there will be further breaking changes to `USER_CREATED`, `USER_UPDATED`, `DATE_CREATED`, `DATE_UPDATED` default values in a followup PR as the current behavior is not fully desired.
Check in with https://github.com/directus/directus/pull/25744 to see more info about the breaking changes.

:::
