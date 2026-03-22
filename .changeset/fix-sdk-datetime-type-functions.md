---
'@directus/sdk': patch
---

Distinguish `date`, `time`, and `datetime` types in SDK function type mappings. Previously all three resolved to the same set of functions (year through second). Now `date` fields only allow date functions (year, month, week, day, weekday) and `time` fields only allow time functions (hour, minute, second).
