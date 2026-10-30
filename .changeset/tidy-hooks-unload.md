---
'@directus/api': patch
---

Fixed `extensions.unload` not being received by API hook extensions
by emitting the event before deregistration.

This changes when the event is emitted: existing consumers, including
Flows, can now trigger other registered extension hooks during unload.
