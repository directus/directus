---
'@directus/storage-driver-supabase': minor
---

Added support for the `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` environment variables

::: notice

If proxy is enabled, endpoints that should stay direct (e.g. self-hosted), should be listed in `NO_PROXY`

:::
