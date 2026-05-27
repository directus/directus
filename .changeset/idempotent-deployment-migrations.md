---
'@directus/api': patch
---

Fixed `directus_deployments` migration failing with `ER_TABLE_EXISTS_ERROR` after a partial run by guarding each table and column creation with existence checks.
