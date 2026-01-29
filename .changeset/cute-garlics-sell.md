---
'@directus/app': minor
---

Added support for a global draft version that is automatically available for all items when versioning is enabled

::: notice

Backward Compatibility: If you have an existing version with the key `draft` and a custom name other than “Draft”, the display name will be standardized to “Draft” (i.e. transformed) to support the new global versioning feature. The version content and functionality remain unchanged.

:::
