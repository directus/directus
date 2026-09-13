---
'@directus/storage-driver-supabase': patch
---

Fixed the Supabase storage driver silently ignoring HTTP_PROXY/HTTPS_PROXY for all operations (read, write, delete, list, stat, copy, move) on networks that require an outbound proxy
