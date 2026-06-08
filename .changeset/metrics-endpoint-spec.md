---
'@directus/specs': patch
---

Added `/metrics` endpoint with and `MetricsAuth` security scheme (`Authorization: Metrics <token>`). The endpoint is gated by a new `x-enabled-env` tag extension so it only surfaces in the dynamic spec when `METRICS_ENABLED=true`.
