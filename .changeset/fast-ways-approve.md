---
"@directus/app": patch
---

::: notice

Due to a bug introduced in v10.6.2, Field Conditions were saved incorrectly. This has been fixed and works again as expected.
However, if Field Conditions have been edited under this version, they need to be corrected. Please refer to https://github.com/directus/directus/issues/19757#issuecomment-1734162756 for instructions.
Note that no other versions are affected by this!

:::

Fixed the format of the stored field conditions value
