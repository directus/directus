---
'@directus/sdk': patch
---

Declared `RequestCredentials` and a portable message-event type in the SDK instead of naming the DOM globals, so the published types resolve for consumers that build without the DOM lib
