---
'@directus/api': patch
'@directus/schema': patch
---

Fixed several MS SQL Server reliability and performance issues:

- Rewrote schema introspection to a single `sys.*` overview query instead of per-table lookups, greatly reducing schema-read time on large databases
- Gave each pooled connection its own request queue, so a query can no longer run on the wrong connection — fixing intermittent `Requests can only be made in the LoggedIn state, not the SentClientRequest state` errors under load (knex shares a single queue across all connections)
- Wait for an in-flight request to finish before a transaction's begin/savepoint/commit, instead of erroring
- Only use the trigger-compatible insert path when the table actually has triggers, so a failed insert no longer leaks a temp table onto the connection
- Fixed flakiness in the MS SQL Server test suite
