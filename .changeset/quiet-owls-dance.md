---
'@directus/api': major
'@directus/app': patch
'@directus/errors': major
---

Improved license handling so a failed license request keeps the current license in effect and is retried by a scheduled license check, with a warning in the app showing why the license could not be renewed and when it lapses

::: notice

The `/server/license` response no longer includes `downgrade_reason`. Read `invalid_reason` instead, which also reports why a license that is still in effect could not be renewed.

`@directus/errors` no longer exports `LicenseManagedByEnvError`, `LicenseOfflineUnsupportedError`, `LicenseResolveIncompleteError` or `LicenseServiceUnavailableError`, or their error codes. License request failures now surface as `LICENSE_INVALID` with a `failure` extension, or as the standard `FORBIDDEN`, `INVALID_PAYLOAD`, `REQUESTS_EXCEEDED` and `SERVICE_UNAVAILABLE` errors.

:::
