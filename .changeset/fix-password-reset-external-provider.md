---
'@directus/api': major
'@directus/app': patch
'@directus/specs': patch
---

Fixed password reset sending emails to external auth provider users

:::notice
`requestPasswordReset` now throws a `Forbidden` error for external auth provider users.
:::
