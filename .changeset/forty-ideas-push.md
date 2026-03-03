---
'@directus/api': patch
---

Fix CockroachDB Schema Operations Performance Improvements #26552, by separate the paths for cockroach DB and
non-cockroach DB when updating fields. The former no longer calls `addColumnToTable`, because this function creates a
new column, and uses it to replace the existing one. In non-cockroach DBs, the unchanged parts will be ignored (like the
column type when you only want to change its default value); but in CockRoach DB, all rows are re-written into the new
column, therefore the bug.
