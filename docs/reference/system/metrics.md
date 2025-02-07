---
description: REST and GraphQL API documentation on the Metric endpoint in Directus.
readTime: 4 min read
pageClass: page-reference
---

# Metrics

Retrieve monitored metrics for connected services.

This endpoint is disabled by default and, if enabled, only available to admin users or requests containing a metric
token defined in the `METRICS_TOKENS` list with the authorization header format `Authorization: Metrics <token>`.

The output is based on Prometheus "Time Series Data Model":
[Prometheus Time Series Data Model](https://prometheus.io/docs/concepts/data_model)

### Request

`GET /metrics`

### Response

```text
# TYPE directus_cache_response_time histogram
directus_cache_response_time 0.552
# TYPE directus_sqlite3_response_time histogram
directus_sqlite3_response_time 1.009
# TYPE directus_local_response_time histogram
directus_local_response_time 12.394
```
