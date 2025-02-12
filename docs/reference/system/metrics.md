---
description: REST API documentation on the Metric endpoint in Directus.
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
# HELP directus_db_sqlite3_response_time_ms sqlite3 Database connection response time
# TYPE directus_db_sqlite3_response_time_ms histogram
directus_db_sqlite3_response_time_ms_bucket{le="1"} 134
directus_db_sqlite3_response_time_ms_bucket{le="10"} 138
directus_db_sqlite3_response_time_ms_bucket{le="20"} 138
directus_db_sqlite3_response_time_ms_bucket{le="40"} 138
directus_db_sqlite3_response_time_ms_bucket{le="60"} 138
directus_db_sqlite3_response_time_ms_bucket{le="80"} 138
directus_db_sqlite3_response_time_ms_bucket{le="100"} 138
directus_db_sqlite3_response_time_ms_bucket{le="200"} 138
directus_db_sqlite3_response_time_ms_bucket{le="500"} 138
directus_db_sqlite3_response_time_ms_bucket{le="750"} 138
directus_db_sqlite3_response_time_ms_bucket{le="1000"} 138
directus_db_sqlite3_response_time_ms_bucket{le="+Inf"} 138
directus_db_sqlite3_response_time_ms_sum 33.43548399999054
directus_db_sqlite3_response_time_ms_count 138

# HELP directus_db_sqlite3_connection_errors sqlite3 Database connection error count
# TYPE directus_db_sqlite3_connection_errors counter
directus_db_sqlite3_connection_errors 0

# HELP directus_cache_redis_connection_errors Cache connection error count
# TYPE directus_cache_redis_connection_errors counter
directus_cache_redis_connection_errors 0

# HELP directus_redis_connection_errors Redis connection error count
# TYPE directus_redis_connection_errors counter
directus_redis_connection_errors 0

# HELP directus_storage_local_connection_errors local storage connection error count
# TYPE directus_storage_local_connection_errors counter
directus_storage_local_connection_errors 0
```
