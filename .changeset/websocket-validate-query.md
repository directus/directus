---
"@directus/api": patch
---

Validate query parameters in WebSocket `item` read and `subscribe` handlers to reject invalid values (e.g. `limit < -1`) that the REST API already rejects.
