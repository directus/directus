---
'@directus/api': patch
---

Fixed the WebSocket heartbeat leaking a `websocket.message` listener on each pulse when a client failed to respond in time
