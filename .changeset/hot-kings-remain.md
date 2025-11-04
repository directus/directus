---
'@directus/api': major
---

Fixed `<scope>.delete` filter hook running after permission check. Fixed keys returned by the hook not being used in place of the original keys.

::: notice

- Keys returned by the hook are now used in place of the original keys.
- The hook will trigger regardless of user permissions. Ensure any necessary permission checks are performed prior to any data processing.

:::

