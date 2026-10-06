---
'@directus/env': minor
'@directus/api': patch
---

Added `milliseconds` and `bytes` env cast types, so human readable durations (eg `15m`) and sizes (eg `10mb`) are
parsed into numbers by the env package instead of at every usage in the API
