---
'@directus/api': patch
---

Fixed the `year()` function on Oracle returning the ISO week-numbering year instead of the calendar year, and made the Oracle date part functions (`year`, `month`, `week`, `day`, `weekday`, `hour`, `minute`, `second`) return numbers instead of zero padded strings, so they match the other dialects.
