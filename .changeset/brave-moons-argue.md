---
'@directus/storage-driver-cloudinary': major
'@directus/storage-driver-s3': major
'@directus/storage-driver-local': major
'@directus/storage-driver-supabase': major
---

Changed `exists()` to only report `false` for a file that is confirmed missing, instead of also reporting `false` when the storage location could not be reached

**Migration**: `exists()` now throws when the lookup itself fails, for example on a timeout, a connection error or rejected credentials. Callers that relied on a `false` result for any failure need to handle the error. Confirmed missing means a 404 for S3 and Cloudinary, `ENOENT`/`ENOTDIR`/`ENAMETOOLONG` for local, and an empty list result for Supabase. Azure and GCS already behaved this way. Note that S3 answers 403 rather than 404 for a missing object when the credentials cannot list the bucket, so granting `s3:ListBucket` is needed to keep getting a clean "missing" answer.
