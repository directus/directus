---
"@directus/schema": patch
---

Fixed MySQL foreignKeys query to include TABLE_NAME in the JOIN condition, preventing a cartesian product when InnoDB statistics on system tables are degraded.
