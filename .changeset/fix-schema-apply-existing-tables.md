---
'@directus/api': patch
---

Fixed schema apply failing with "Collection already exists" when tables were pre-created by external migrations (e.g. Supabase, Prisma, Flyway)
