---
'@directus/api': patch
---

Fix MS SQL trigger compatibility in ItemsService.createOne(). MS SQL Server doesn't support OUTPUT clauses when triggers
are present on tables. This change adds the includeTriggerModifications flag to .returning() calls when using MS SQL,
allowing operations to succeed on tables with triggers while maintaining full backward compatibility.
