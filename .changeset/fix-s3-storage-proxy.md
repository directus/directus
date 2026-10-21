---
'@directus/storage-driver-s3': major
---

Added proxy support via `HTTP_PROXY`, `HTTPS_PROXY` and `NO_PROXY` environment variables

::: notice

- Requests now go through the proxy set in `HTTP_PROXY`/`HTTPS_PROXY`. If these variables are already set and S3 should be reached directly, add the S3 host to `NO_PROXY`
- Proxy variables are read from the process environment, not from the Directus `.env` or config file
- `STORAGE_<LOCATION>_CONNECTION_TIMEOUT` (5 seconds by default) also covers the proxy handshake and may need raising for slow proxies

:::
