---
'@directus/sdk': minor
---

Fixed SDK field types that differ between API requests and responses, including redacted encrypted
and concealed fields

Fields such as `directus_settings.license_key`, `directus_users.password` and
`directus_deployments.credentials` now read as the redacted `'**********'` literal and accept the
unredacted value on write. Code that assigns to these fields on a plain `DirectusSettings`,
`DirectusUser`, `DirectusShare` or `DirectusDeployment` type (rather than through a command's input
type) needs to go through the request types instead.
