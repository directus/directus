---
'@directus/utils': patch
---

Fixed fractional days and weeks in date adjustments, such as `$NOW(-0.5 days)`, being rounded to whole days
