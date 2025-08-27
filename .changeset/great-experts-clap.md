---
"@directus/api": major
"@directus/types": patch
---

Redesign Content Versioning to now work across relations and all query parameters.

::: notice

The following things should be kept in mind when updating to the next release:
1. The returned data now closely matches our existing apis, likely breaking existing logic using versioning.
2. GQL `_by_version` now has separate options for `version` and `versionRaw` and does not default to versionRaw anymore.
3. Default values like `current_user` will return unexpected results which will be addressed in a follow up PR.

For more information, please read the [docs](TODO) on how to work with the new content versioning system.

:::
