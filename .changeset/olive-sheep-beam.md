---
'@directus/api': patch
---

changed loop behavior from prematurely exiting to evaluating all subscriptions on ws; fixed issue where Directus might
skip valid subscriptions if a filter didn't match records.
