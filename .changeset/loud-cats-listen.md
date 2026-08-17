---
'@directus/api': patch
---

Fixed the WebSocket heartbeat leaking a `websocket.message` listener on each ping when a client failed to respond in time
