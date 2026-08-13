---
'@directus/storage-driver-cloudinary': major
'@directus/storage-driver-s3': major
'@directus/storage-driver-local': major
'@directus/storage-driver-supabase': major
'@directus/storage-driver-azure': patch
'@directus/storage-driver-gcs': patch
---

::: notice
`exists()` now throws when the lookup itself fails, for example on a timeout, a connection error or rejected credentials, instead of also reporting `false`. Callers that relied on a `false` result for any failure need to handle the error. Note that S3 answers 403 rather than 404 for a missing object when the credentials cannot list the bucket, so granting `s3:ListBucket` is needed to keep getting a clean "missing" answer.
:::

Changed `exists()` to only report `false` for a file that is confirmed missing, instead of also reporting `false` when the storage location could not be reached
