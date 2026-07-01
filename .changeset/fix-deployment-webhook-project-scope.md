---
'@directus/api': patch
---

Scoped the deployment webhook's project lookup to the requesting provider's deployment, so a webhook can no longer resolve a project that shares an external ID under a different provider
