---
'@directus/sdk': patch
---

Fixed a race in realtime subscriptions where the first message received could be either the `init` message or the first event, depending on timing.