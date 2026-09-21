---
'@directus/api': patch
---

Fixed csv, date, dateTime, timestamp, time, and json fields silently accepting invalid values on write instead of returning a validation error
