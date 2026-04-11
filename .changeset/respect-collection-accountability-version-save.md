---
'@directus/api': patch
---

Fixed Content Version saves creating activity and revision records even when the underlying collection's accountability was set to "Do Not Track Anything". Version saves now respect the collection's accountability configuration: no activity/revision records are written when accountability is disabled, only an activity record is written when accountability is set to "activity", and both activity and revision records are written when accountability is set to "all".
