---
'@directus/storage-driver-cloudinary': patch
'@directus/storage-driver-supabase': patch
'@directus/storage-driver-azure': patch
'@directus/storage-driver-gcs': patch
'@directus/constants': patch
'@directus/env': major
'docs': patch
'@directus/api': patch
'@directus/app': patch
---

Fixed enforcing `chunkSize` when TUS is not enabled and updated the default `TUS_CHUNK_SIZE` to `8mb`
