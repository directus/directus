---
---
'@directus/types': patch
'@directus/api': major
'@directus/app': major
---

Fixed `USER_CREATED`, `USER_UPDATED`, `DATE_CREATED`, and `DATE_UPDATED` values in content versioning. These fields now correctly reflect the actual user and timestamp of creation or last update, rather than the user and date of promotion.

::: notice

- Requesting a non-existent version will now return a Forbidden error.
- The `USER_CREATED`, `USER_UPDATED`, `DATE_CREATED`, and `DATE_UPDATED` fields will now represent the last actual changes, not the promotion metadata.

:::
