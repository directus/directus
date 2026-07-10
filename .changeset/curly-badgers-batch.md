---
'@directus/api': patch
---

Sped up creating many items at once for flat, non-accountability collections by inserting all rows in a single statement instead of one INSERT per row. This is a guarded fast-path in `ItemsService.createMany` (Postgres only, no accountability tracking, no alias/relational fields, no client-provided primary key); everything else falls back to the existing per-row behaviour unchanged. It notably speeds up saving policies with many permissions under database latency.
