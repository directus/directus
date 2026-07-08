---
'@directus/api': patch
---

Fixed a memory leak where the WebSocket heartbeat handler left a `websocket.message` listener registered after each
heartbeat timeout
