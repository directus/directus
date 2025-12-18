---
'@directus/sdk': minor
---

Add `parseQueryParams` utility and apply it to realtime subscriptions to properly parse complex query parameters (e.g.
`fields` with nested relations), aligning realtime behavior with REST requests.
