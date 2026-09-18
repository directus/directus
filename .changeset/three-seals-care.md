---
'@directus/api': patch
---

Fixed csv, date, dateTime, timestamp, time, and json fields silently accepting wrong-typed values on write instead of returning a validation error
