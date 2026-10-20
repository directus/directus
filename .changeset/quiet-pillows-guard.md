---
'@directus/api': major
---

Fixed websocket subscription delete events not enforcing read permissions

::: notice

WebSocket Subscription delete events now require read permissions for a whole collection. Delete events will not be sent to users that have a policy with custom item rules on the events collection.

:::