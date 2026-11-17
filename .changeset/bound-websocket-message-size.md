---
'@directus/api': patch
---

Enforced `MAX_PAYLOAD_SIZE` on incoming WebSocket messages

::: notice

A WebSocket message larger than `MAX_PAYLOAD_SIZE` (default `1mb`) now closes the connection with
code `1009`. The setting applied only to REST bodies before this, leaving a message bounded by the
100MB `ws` allows on its own.

:::
