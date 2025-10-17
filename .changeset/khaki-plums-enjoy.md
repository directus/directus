---
'@directus/constants': major
'@directus/types': patch
'@directus/app': patch
---

Removed non-relational types from `RELATIONAL_TYPES` constant

::: notice

Extensions or external code using `RELATIONAL_TYPES` should note the excluded `presentation` and `group`.

:::
