---
'@directus/storage-driver-s3': minor
---

Added proxy support via `HTTP_PROXY`, `HTTPS_PROXY`, and `NO_PROXY` environment variables

::: notice

- Endpoints that should bypass the proxy (e.g. internal) should be listed in `NO_PROXY`
- `STORAGE_<LOCATION>_CONNECTION_TIMEOUT` (5 seconds by default) may need to be adjusted when using a proxy to account for the additional proxy handshake time.

:::
