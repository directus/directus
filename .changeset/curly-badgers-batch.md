---
'@directus/api': patch
---

Sped up creating many items at once for flat, non-accountability collections by inserting all rows in one batched insert instead of one INSERT per row. This is a guarded fast-path in `ItemsService.createMany` (app-generated uuid primary key, no accountability tracking, no alias/relational fields, no client-provided primary key); everything else falls back to the existing per-row behaviour unchanged. It works across all supported databases and notably speeds up saving policies with many permissions under database latency.
