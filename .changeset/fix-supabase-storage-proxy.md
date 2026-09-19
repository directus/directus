---
'@directus/storage-driver-supabase': minor
---

Added proxy support via `HTTP_PROXY`, `HTTPS_PROXY`, and `NO_PROXY` environment variables

::: notice

If proxy is enabled, endpoints that should stay direct (e.g. self-hosted), should be listed in `NO_PROXY`

:::
