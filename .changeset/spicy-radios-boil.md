---
'@directus/api': major
---

Dropped support for Memcached for Caching & Rate Limiting.

Memcached doesn't support pub/sub, which Directus now heavily relies on in multi-container deployments (for queuing, messaging, websockets, etc). That combined with the low usage we've seen across the ecosystem means it makes no sense to longer try to support both at the same time.

