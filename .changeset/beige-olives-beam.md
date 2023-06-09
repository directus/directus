---
"@directus/storage-driver-s3": patch
"@directus/storage": patch
"tests-blackbox": patch
---

Fixed S3 storage scaling issues by using a customized request handler with an increased maximum of open sockets
