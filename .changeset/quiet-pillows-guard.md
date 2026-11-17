---
'@directus/api': major
---

Fixed websocket subscription delete events not enforcing read permissions

::: notice

WebSocket Subscription delete events now require read access to, at minimum, the `id` field and no item rules on the events collection. Users who don't meet these requirements will not receive delete events.

:::