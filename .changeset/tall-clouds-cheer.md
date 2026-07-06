---
'@directus/sdk': patch
---

Fixed an unhandled promise rejection in the realtime client when the connection closed while a heartbeat ping was being handled
