---
'@directus/api': minor
'@directus/env': minor
---

Added `IP_CUSTOM_HEADER_WARNINGS` env var (default `true`) to allow disabling the "Custom IP header didn't return valid IP address" warning when `IP_CUSTOM_HEADER` is set but the header is legitimately absent on some requests (e.g. health checks or non-proxied traffic)
