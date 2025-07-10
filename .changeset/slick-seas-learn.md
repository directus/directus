---
'@directus/api': major
---

Exclude database-only tables from snapshots

::: notice
Snapshots now exclude tables not tracked in `directus_collections` (database-only tables).

| Source Version | Target Version | Behavior                                                   | Impact                                       |
| -------------- | -------------- | ---------------------------------------------------------- | -------------------------------------------- |
| < 11.10.0      | ≥ 11.10.0      | Database-only tables from source will be created on target | ⚠️ Tables added                              |
| ≥ 11.10.0      | < 11.10.0      | Database-only tables will be dropped from target           | 🚨 Data loss risk                            |
| ≥ 11.10.0      | ≥ 11.10.0      | Database-only tables are ignored in snapshots              | ✅ No changes                                |
| < 11.10.0      | < 11.10.0      | Database-only tables may be created or dropped             | ⚠️ Depends on the diff between source/target |

Please review your snapshot workflows to ensure these changes will not result in unexpected behaviour.
:::



