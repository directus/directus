---
'tests-blackbox': patch
'@directus/env': patch
'@directus/api': patch
---

Fixed an issue that would cause the project to hang in an unavailable state if an unexpected external error caused the
schema retrieval to fail in a high load environment
