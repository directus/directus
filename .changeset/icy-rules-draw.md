---
'@directus/env': major
---

Updated the default `TELEMETRY_URL` and `COMPLIANCE_URL` to `https://telemetry.directus.com`

::: notice

Telemetry and compliance reports are now sent to `telemetry.directus.com` instead of `telemetry.directus.io`.

If your deployment restricts outbound traffic, allow `telemetry.directus.com` before upgrading. Otherwise reporting will fail without logging an error.

:::
