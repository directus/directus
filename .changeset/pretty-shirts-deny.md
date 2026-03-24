---
'@directus/storage-driver-supabase': patch
'@directus/storage-driver-s3': patch
'@directus/storage': patch
'@directus/api': patch
---

Added POST /utils/assets/clear endpoint to purge cached asset variants from storage. Introduced bulkDelete support in
storage drivers (S3, Supabase) with fallback for others
