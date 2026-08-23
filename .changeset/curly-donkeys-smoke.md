---
'@directus/sdk': patch
---

Fixed `unsubscribe()` not removing subscriptions, causing them to persist across reconnects and accumulate for the lifetime of the client

