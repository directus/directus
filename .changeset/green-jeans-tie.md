---
'@directus/api': minor
'@directus/app': minor
'@directus/schema': minor
'@directus/types': minor
'@directus/utils': minor
---

Added read-only support for introspected database views that expose an `id` column across all six supported dialects (MySQL/MariaDB, PostgreSQL, SQLite, MSSQL, CockroachDB, OracleDB), including materialized views (PostgreSQL, CockroachDB, OracleDB) and foreign tables (PostgreSQL).
